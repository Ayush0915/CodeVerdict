from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class PRReviewRequest(BaseModel):
    pr_url: str = Field(..., description="The GitHub Pull Request URL to analyze")

class Finding(BaseModel):
    severity: str = Field(..., description="Severity of the issue: Critical, Warning, or Suggestion")
    category: str = Field(..., description="Category: Security, Quality, Performance, Coverage")
    file: str = Field(..., description="File path relative to repository root")
    line_range: Optional[str] = Field(None, description="Line range affected, e.g., '12-15' or '45'")
    description: str = Field(..., description="Detailed description of the issue found")
    suggestion: str = Field(..., description="Actionable code suggestion to fix the issue")

class AgentReviewResult(BaseModel):
    agent_name: str
    findings: List[Finding]
    raw_response: Optional[str] = None
    retrieved_context: Optional[List[str]] = None

class SynthesisResult(BaseModel):
    pr_url: str
    summary: str = Field(..., description="High-level executive summary of the review")
    findings: List[Finding] = Field(default_factory=list, description="Merged, ranked, and deduplicated findings")
    agent_breakdowns: Dict[str, List[Finding]] = Field(default_factory=dict, description="Original findings grouped by agent name")
