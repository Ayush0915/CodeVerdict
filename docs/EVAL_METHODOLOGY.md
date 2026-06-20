# CodeVerdict Evaluation Methodology

This document outlines the design, metrics, and composition of CodeVerdict's evaluation suite.

---

## 1. Metric Definitions

CodeVerdict uses standard evaluation metrics to gauge review performance:

### 1.1 True Positive (TP)
An expected issue defined in the dataset that was correctly flagged by the system.
- **Match Criteria:** The flagged finding matches the expected category, and its description matches the expected issue's regex pattern.

### 1.2 False Positive (FP)
A finding flagged by CodeVerdict that does not correspond to any expected issue in the dataset.
- *Note:* In code review systems, some FPs are useful feedback, but for testing correctness, we aim to minimize them to reduce "noise" for developers.

### 1.3 False Negative (FN)
An expected issue that CodeVerdict failed to identify in the review output.

### 1.4 Precision
The percentage of flagged issues that are correct:
$$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}}$$

### 1.5 Recall
The percentage of actual code bugs that the tool managed to catch:
$$\text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}}$$

---

## 2. Dataset Composition

The dataset contains three seeded mock pull request JSON files, covering all evaluation criteria:

### 2.1 `vulnerable_pr.json`
- **Focus:** Security & Quality.
- **Bugs Seeded:**
  - `subprocess.Popen(..., shell=True)` (Critical command injection risk).
  - Hardcoded credential string `supersecretpassword123` (Critical credential exposure).
  - Uppercase function names `FUNC1` and `FUNC2` (PEP 8 violation).
  - Duplicate mathematical logic in `FUNC2` (DRY violation).

### 2.2 `performance_issue_pr.json`
- **Focus:** Performance & Quality.
- **Bugs Seeded:**
  - SQL query `SELECT * FROM users WHERE id = ?` inside a loop (N+1 query pattern).
  - Bare `except:` block catching all exceptions (Quality issue).

### 2.3 `untested_code_pr.json`
- **Focus:** Coverage.
- **Bugs Seeded:**
  - Added new `validate_password_strength` function without modifying or adding any test files.

---

## 3. Execution Pipeline

When `run_eval.py` is invoked:
1. It reads each JSON file from `eval/dataset/`.
2. It executes the orchestrator review, loading files locally using the `local://` schema.
3. It performs regex checks to match findings against expected bugs.
4. It outputs stats for each PR, computes overall averages, and writes the results to `eval/eval_results.md`.
5. It enforces an **80% threshold** gating build success.

---

## 4. Documented Failure Modes

### 4.1 SQL Variable Names vs. PEP 8 Rules
- **Problem:** The Quality Agent flags uppercase variables inside database connection schemas or string queries (e.g. `DB_URL = "postgresql://..."`) as style violations, leading to False Positives.
- **Mitigation:** In future revisions, system prompts will instruct the agent to ignore styling details inside string literals.
