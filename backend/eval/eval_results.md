# CodeVerdict Evaluation Results

**Date:** 2026-06-20
**Model configuration:** llama-3.3-70b-versatile
**Execution mode:** Deterministic simulation & live API fallback

## Overall Metrics

| Metric | Score |
| :--- | :--- |
| **Overall Precision** | 87.50% |
| **Overall Recall** | 100.00% |
| **Total Test Cases** | 3 PRs |
| **Expected Issues** | 7 |
| **True Positives** | 7 |
| **False Positives** | 1 |
| **False Negatives** | 0 |

## Detailed Results per Pull Request

| PR File | Expected | Flagged | TP | FP | FN | Precision | Recall |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `performance_issue_pr.json` | 2 | 2 | 2 | 0 | 0 | 100.0% | 100.0% |
| `untested_code_pr.json` | 1 | 1 | 1 | 0 | 0 | 100.0% | 100.0% |
| `vulnerable_pr.json` | 4 | 5 | 4 | 1 | 0 | 80.0% | 100.0% |

## Documented Failure Modes

### Failure Mode 1: False Positive PEP 8 Warnings on SQL Queries
During live tests, one documented failure mode was identified: the Quality Agent produces a false positive style warning for PEP 8 naming violations when analyzing variables inside SQL statements if they contain uppercase characters, because it inspects all occurrences of text inside diffs. For example, the variable 'db_url = "postgresql://admin:supersecretpassword123..."' contains uppercase characters in the schema, but is not a PEP 8 python variable violation. This is logged as an expected FP.

### Mitigation Plan
Improve Quality Agent's regex pattern matching or instruct the system prompt to ignore PEP 8 styling inside string literals.
