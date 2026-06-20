import unittest
import asyncio
from unittest.mock import patch, MagicMock
from app.agents.security_agent import SecurityAgent
from app.agents.quality_agent import QualityAgent
from app.agents.performance_agent import PerformanceAgent
from app.agents.test_coverage_agent import TestCoverageAgent
from app.agents.synthesizer_agent import SynthesizerAgent
from app.orchestrator import orchestrator
from app.models.schemas import Finding

class TestCodeSentryAgents(unittest.TestCase):
    def setUp(self):
        # Sample PR details for tests
        self.mock_pr = {
            "pr_url": "mock://test_pr",
            "title": "Add DB logging",
            "body": "This PR adds user authentication database connections and runs queries.",
            "files": [
                {
                    "filename": "auth.py",
                    "status": "added",
                    "content": "def authenticate(username, password):\n    db_password = 'admin_secret_key'\n    return True\n",
                    "patch": "@@ -0,0 +1,4 @@\n+def authenticate(username, password):\n+    db_password = 'admin_secret_key'\n+    return True\n"
                }
            ]
        }
        self.loop = asyncio.get_event_loop()

    def test_security_agent(self):
        agent = SecurityAgent()
        result = self.loop.run_until_complete(agent.review(self.mock_pr))
        self.assertEqual(result.agent_name, "Security Agent")
        self.assertIsInstance(result.findings, list)
        
        # Verify bandit integration or mock responses work
        if result.findings:
            self.assertEqual(result.findings[0].category, "Security")

    def test_quality_agent(self):
        agent = QualityAgent()
        result = self.loop.run_until_complete(agent.review(self.mock_pr))
        self.assertEqual(result.agent_name, "Quality Agent")
        self.assertIsInstance(result.findings, list)

    def test_performance_agent(self):
        agent = PerformanceAgent()
        result = self.loop.run_until_complete(agent.review(self.mock_pr))
        self.assertEqual(result.agent_name, "Performance Agent")
        self.assertIsInstance(result.findings, list)

    def test_coverage_agent(self):
        agent = TestCoverageAgent()
        result = self.loop.run_until_complete(agent.review(self.mock_pr))
        self.assertEqual(result.agent_name, "Test Coverage Agent")
        self.assertIsInstance(result.findings, list)

    def test_synthesizer_agent_fallback(self):
        synthesizer = SynthesizerAgent()
        findings = {
            "Security Agent": [Finding(severity="Critical", category="Security", file="auth.py", description="Hardcoded key", suggestion="Remove key")],
            "Quality Agent": [Finding(severity="Warning", category="Quality", file="auth.py", description="Poor name", suggestion="Fix name")]
        }
        result = self.loop.run_until_complete(synthesizer.synthesize("mock://test_pr", findings))
        self.assertEqual(result.pr_url, "mock://test_pr")
        self.assertGreater(len(result.findings), 0)
        self.assertEqual(result.findings[0].severity, "Critical") # Sorted priority

    def test_orchestrator(self):
        # Test full end-to-end slice
        result = self.loop.run_until_complete(orchestrator.review_pr("mock://backend/eval/dataset/vulnerable_pr.json"))
        self.assertIsNotNone(result.summary)
        self.assertGreater(len(result.findings), 0)
        self.assertIn("Security Agent", result.agent_breakdowns)

if __name__ == "__main__":
    unittest.main()
