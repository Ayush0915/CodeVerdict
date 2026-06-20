import os
import sys
import tempfile
import subprocess
import json
import logging
import shutil
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class BanditRunner:
    @staticmethod
    def run_on_files(files: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Writes files to a temporary directory, runs bandit, and returns structured findings.
        Only runs on files with a .py extension.
        """
        py_files = [f for f in files if f.get("filename", "").endswith(".py") and f.get("content")]
        
        if not py_files:
            logger.info("No Python files to run bandit on.")
            return []

        # Create temporary directory
        temp_dir = tempfile.mkdtemp(prefix="codesentry_bandit_")
        temp_path = Path(temp_dir)
        
        try:
            # Write python files to the temp directory
            # Maintain relative directory structures if any, to be safe
            for file_info in py_files:
                filename = file_info["filename"]
                content = file_info["content"]
                
                # Safeguard path traversal
                safe_filename = filename.replace("../", "").replace("..\\", "")
                dest_file_path = temp_path / safe_filename
                
                # Create parent directories
                dest_file_path.parent.mkdir(parents=True, exist_ok=True)
                
                with open(dest_file_path, "w", encoding="utf-8") as f:
                    f.write(content)

            # Build and execute the bandit command: bandit -r <temp_dir> -f json -q
            # We run in quiet mode (-q) and recursively (-r)
            # We use subprocess to run the bandit command.
            # Using sys.executable to call bandit if installed as a module, or call bandit CLI
            cmd = [sys.executable, "-m", "bandit", "-r", temp_dir, "-f", "json", "-q"]
            
            logger.info(f"Running bandit command: {' '.join(cmd)}")
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # Bandit exits with 0 if no issues, 1 if issues found. We inspect stdout regardless.
            stdout_content = result.stdout.strip()
            
            if not stdout_content:
                # Try running bandit directly as binary in case sys.executable module approach failed
                cmd_direct = ["bandit", "-r", temp_dir, "-f", "json", "-q"]
                logger.info(f"Retrying direct bandit command: {' '.join(cmd_direct)}")
                result_direct = subprocess.run(cmd_direct, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                stdout_content = result_direct.stdout.strip()
                
            if not stdout_content:
                logger.warning(f"Bandit stderr output: {result.stderr}")
                return []
                
            try:
                bandit_data = json.loads(stdout_content)
                findings = bandit_data.get("results", [])
                
                # Format bandit findings to align with our schema
                formatted_findings = []
                for issue in findings:
                    # Resolve filepath to relative original path
                    abs_filepath = issue.get("filename", "")
                    try:
                        rel_filepath = os.path.relpath(abs_filepath, temp_dir).replace("\\", "/")
                    except Exception:
                        rel_filepath = abs_filepath
                    
                    # Map bandit severity to our severity
                    # Bandit severities: LOW, MEDIUM, HIGH
                    bandit_severity = issue.get("issue_severity", "MEDIUM").upper()
                    if bandit_severity == "HIGH":
                        severity = "Critical"
                    elif bandit_severity == "MEDIUM":
                        severity = "Warning"
                    else:
                        severity = "Suggestion"
                        
                    line_number = issue.get("line_number")
                    line_range = str(line_number) if line_number is not None else None
                    
                    formatted_findings.append({
                        "severity": severity,
                        "category": "Security",
                        "file": rel_filepath,
                        "line_range": line_range,
                        "description": f"Bandit Rule {issue.get('test_id')}: {issue.get('issue_text')}",
                        "suggestion": f"Fix the code issue around line {line_number}. Code snippet: {issue.get('code', '').strip()}"
                    })
                
                return formatted_findings
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse bandit output as JSON: {e}. Output was: {stdout_content}")
                return []
                
        except Exception as e:
            logger.error(f"Error executing bandit runner: {e}")
            return []
            
        finally:
            # Clean up temp directory
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                logger.warning(f"Failed to clean up bandit temp dir {temp_dir}: {e}")
