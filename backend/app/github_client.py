import re
import os
import json
import logging
from typing import Dict, Any, Tuple
from pathlib import Path
import httpx
from app import config

logger = logging.getLogger(__name__)

class GitHubClientError(Exception):
    """Custom exception for GitHub client errors."""
    pass

class GitHubClient:
    def __init__(self, token: str = config.GITHUB_TOKEN):
        self.token = token
        
    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        return headers

    def parse_pr_url(self, pr_url: str) -> Tuple[str, str, int]:
        """
        Parses GitHub PR URL to extract owner, repo, and pull number.
        Expected format: https://github.com/owner/repo/pull/num
        """
        # Clean URL (remove trailing slashes, /files, etc.)
        url = pr_url.strip().rstrip("/")
        url = re.sub(r"/files$", "", url)
        
        pattern = r"github\.com/([^/]+)/([^/]+)/pull/(\d+)"
        match = re.search(pattern, url)
        if not match:
            raise GitHubClientError(
                f"Invalid GitHub PR URL format: {pr_url}. Expected format: https://github.com/owner/repo/pull/number"
            )
            
        owner = match.group(1)
        repo = match.group(2)
        pull_number = int(match.group(3))
        return owner, repo, pull_number

    async def fetch_pr_details(self, pr_url: str) -> Dict[str, Any]:
        """
        Fetches PR details (title, body) and modified files (name, patch, contents).
        Supports mock:// and local:// URLs for offline evaluation and testing.
        """
        # Check for mock or local URLs
        if pr_url.startswith("mock://") or pr_url.startswith("local://"):
            return self._load_local_mock_pr(pr_url)
            
        try:
            owner, repo, pull_number = self.parse_pr_url(pr_url)
        except GitHubClientError as e:
            # Check if it points to a local path directly as a fallback
            if os.path.exists(pr_url) or pr_url.endswith(".json"):
                return self._load_local_mock_pr(pr_url)
            raise e

        headers = self._get_headers()
        base_api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # 1. Fetch main PR info
                pr_response = await client.get(base_api_url, headers=headers)
                if pr_response.status_code != 200:
                    raise GitHubClientError(f"GitHub API returned status {pr_response.status_code}: {pr_response.text}")
                
                pr_data = pr_response.json()
                title = pr_data.get("title", "")
                body = pr_data.get("body", "")
                
                # 2. Fetch files changed in the PR
                files_response = await client.get(f"{base_api_url}/files", headers=headers)
                if files_response.status_code != 200:
                    raise GitHubClientError(f"GitHub API files endpoint returned status {files_response.status_code}")
                
                files_data = files_response.json()
                
                files_list = []
                for f in files_data:
                    filename = f.get("filename", "")
                    status = f.get("status", "")
                    patch = f.get("patch", "") # unified diff patch
                    raw_url = f.get("raw_url", "")
                    
                    # Fetch file contents if it is not removed
                    content = ""
                    if status != "removed" and raw_url:
                        content_response = await client.get(raw_url, headers=headers)
                        if content_response.status_code == 200:
                            content = content_response.text
                    
                    files_list.append({
                        "filename": filename,
                        "status": status,
                        "patch": patch,
                        "content": content
                    })
                    
                return {
                    "pr_url": pr_url,
                    "title": title,
                    "body": body,
                    "files": files_list
                }
                
            except httpx.RequestError as exc:
                raise GitHubClientError(f"Network request to GitHub failed: {exc}")

    def _load_local_mock_pr(self, pr_url: str) -> Dict[str, Any]:
        """
        Loads mock PR details from a local JSON file or parses inline mock format.
        Useful for running evaluation suite offline without rate limit issues.
        """
        # If the path points to a file, load it
        path_str = pr_url.replace("mock://", "").replace("local://", "")
        file_path = Path(path_str)
        
        # If relative, resolve against project root
        if not file_path.is_absolute():
            project_root = Path(__file__).resolve().parent.parent.parent
            file_path = project_root / file_path

        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
                
        # If it's a test seed but the file doesn't exist, return a generic mock PR
        logger.warning(f"Mock PR file not found at {file_path}. Returning default mock data.")
        return {
            "pr_url": pr_url,
            "title": "Mock Vulnerable and Low Quality PR",
            "body": "This is a mock PR containing common Python bugs, security issues, and style violations.",
            "files": [
                {
                    "filename": "vulnerable_app.py",
                    "status": "modified",
                    "patch": "@@ -1,15 +1,24 @@\n import os\n+import subprocess\n \n def run_user_cmd(cmd):\n-    # Run command safely\n-    pass\n+    # Execute shell command directly from user input\n+    return subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE).stdout.read()\n \n def connect_db():\n-    # Safe db connection\n-    pass\n+    # Hardcoded credential vulnerability\n+    db_url = \"postgresql://admin:supersecretpassword123@localhost:5432/dbname\"\n+    return db_url\n",
                    "content": "import os\nimport subprocess\n\ndef run_user_cmd(cmd):\n    # Execute shell command directly from user input\n    return subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE).stdout.read()\n\ndef connect_db():\n    # Hardcoded credential vulnerability\n    db_url = \"postgresql://admin:supersecretpassword123@localhost:5432/dbname\"\n    return db_url\n"
                },
                {
                    "filename": "poor_quality.py",
                    "status": "added",
                    "patch": "@@ -0,0 +1,20 @@\n+def FUNC1(x,y):\n+ z = x+y\n+ print(\"adding things\", z)\n+ return z\n+\n+def FUNC2(x,y):\n+ # duplicate logic\n+ z = x+y\n+ print(\"adding things\", z)\n+ return z\n",
                    "content": "def FUNC1(x,y):\n z = x+y\n print(\"adding things\", z)\n return z\n\ndef FUNC2(x,y):\n # duplicate logic\n z = x+y\n print(\"adding things\", z)\n return z\n"
                }
            ]
        }

# Singleton instance
github_client = GitHubClient()
