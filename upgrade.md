# CodeVerdict — UI Correction Pass (accuracy fixes only)

**For:** Antigravity agentic IDE
**Type:** Targeted correction pass on the existing UI — NOT a redesign
**Scope:** The current UI (sidebar nav, hero section, console panel, findings cards, pill-tabs) is visually in good shape and should NOT be restructured or restyled wholesale. This pass fixes specific items where the UI currently implies a capability, verification, or feature that CodeVerdict does not actually have. Every change below is a correction of an overstatement, not a stylistic preference — treat accuracy as the priority over how impressive a word sounds.

Do not touch: the overall layout, the dark console panel's visual treatment, the pill-tab filter mechanics, the stats sidebar placement, the severity color system, or anything not explicitly listed below. This is a scoped, surgical pass.

---

## Fix 1 — Sidebar navigation items don't match real features

**Current items:** "Active Profiles," "Consensus Pipeline," "Remediation Console," "Knowledge Memory"

**Problem:** These names describe features from the original reference site that CodeVerdict does not have:
- "Active Profiles" implies multiple scan profiles (web/mobile/cloud/etc.) — CodeVerdict only reviews code diffs from a single PR.
- "Consensus Pipeline" implies multi-model cross-consensus — CodeVerdict uses one model (Llama 3 via Groq) per agent, no consensus voting between models.
- "Remediation Console" implies automated fix-PR generation — CodeVerdict's Synthesizer produces a review/report, not an auto-generated code patch.
- "Knowledge Memory" implies persistent, cross-scan learning — CodeVerdict is stateless per review; the only "memory" involved is the RAG knowledge base of static reference documents (style guides, secure-coding notes), which doesn't change or learn between scans.

**Fix:** Replace the sidebar items with ones that map to real, existing parts of the app. Suggested set (adjust labels if a more natural name fits the actual implemented views):
- **"Scanner Console"** (keep — this is the real, current PR-input/results view)
- **"Agent Breakdown"** — a view/section showing each of the 4 agents' individual raw findings (already exists per-agent in the results view; if not yet a distinct nav item, this can simply link to that section)
- **"Reference Library"** — replaces "Knowledge Memory"; accurately describes the static RAG knowledge base (the style/secure-coding reference docs that Quality and Security agents retrieve from) without implying it learns or persists new information over time
- **"Eval Results"** — links to a view showing the real precision/recall numbers and methodology from `eval/eval_results.md`, if such a view exists or is easy to add; if not, omit this nav item rather than fake it
- **"About"** — a short, honest one-pager: what CodeVerdict is, the 4 agents + synthesizer architecture, and that it's a portfolio project demonstrating agentic AI, RAG, and tool-use (bandit), not a commercial product

If any of these proposed views don't actually exist in the app yet, do not build new backend functionality to support them in this pass — either link to the nearest real equivalent or omit the nav item. The goal is for every visible nav item to point to something real, not to add scope.

## Fix 2 — "Active Exploit" badge overstates verification

**Current:** The console panel's top finding shows a badge reading "Active Exploit" next to "EXPLOIT PATH CWE-89."

**Problem:** "Active Exploit" implies the system verified the vulnerability is actually, dynamically exploitable (e.g., via runtime testing or proof-of-concept execution). CodeVerdict's Security Agent identifies issues via static analysis (`bandit`) plus LLM reasoning over the diff — neither constitutes proof of active exploitability. This is a factual overstatement, not a style issue.

**Fix:** Replace "Active Exploit" with "Static Finding" (when the finding came from bandit) or "Flagged by Security Agent" (when it's LLM-reasoned without a bandit match). The path-trace visual (`req.params.id → db.raw → SELECT * FROM users`) can stay if the underlying finding genuinely traces a data flow like this — but the badge text must reflect that this was identified through static analysis and AI review, not active/dynamic exploitation testing.

Apply the same correction anywhere else in the UI where similar verification language appears (e.g., if "Verified," "Confirmed Exploitable," or similar phrasing shows up elsewhere, replace with accurate equivalents like "Flagged," "Identified," or "Static Finding").

## Fix 3 — "EXPLOITABILITY 91/100" label overstates what the score measures

**Current:** Findings show a score labeled "EXPLOITABILITY" with a value like "91/100."

**Problem:** "Exploitability" is a specific security term implying a measured/modeled likelihood that an attacker could successfully exploit the issue — typically requiring deeper analysis (attack-path validation, environmental context) than a single LLM-plus-static-analysis pass provides. CodeVerdict's score more accurately reflects how confident/severe the finding is, not a calculated exploitability metric.

**Fix:** Rename this label to **"Severity Score"** or **"Confidence"** (pick whichever is more accurate to how the score is actually calculated in the codebase — if it's derived from the Synthesizer's severity ranking, "Severity Score" fits; if it reflects the agent's certainty in the finding, "Confidence" fits). Update this consistently everywhere the "Exploitability" label appears, including any per-finding score bars in the results view, not just the hero console panel.

## Fix 4 — Hero tagline overstates auto-fix capability

**Current:** "CodeVerdict reviews every PR like a senior AppSec engineer — it traces real exploit paths and ranks what's actually dangerous. Then it ships verified fix PRs and threat models, with zero process drag."

**Problem:** This describes three things CodeVerdict doesn't do: (1) "traces real exploit paths" implies dynamic exploit-path verification (see Fix 2/3), (2) "ships verified fix PRs" implies CodeVerdict auto-generates and opens pull requests with code fixes — it doesn't, it produces a review/report, (3) "threat models" implies structured threat-modeling output (e.g., STRIDE) — CodeVerdict doesn't generate this.

**Fix:** Replace with copy describing what CodeVerdict actually does. Suggested direction (adjust wording, keep the confident tone, but make every claim true):

> "CodeVerdict reviews every pull request with four specialized AI agents — security, quality, performance, and test coverage — each grounded in real tooling and reference material. A final synthesis step merges their findings into one clear, ranked review."

Keep the secondary tagline pill ("Thinks like a hacker. Fixes like an engineer.") only if reworded to remove the "fixes" implication — e.g., "Reviews like a senior engineer. Explains like a mentor." or similar — since CodeVerdict doesn't generate fixes, only explains and flags issues.

## Fix 5 — General sweep for similar overstatements

After completing Fixes 1-4, do one pass across all remaining visible UI text (button labels, tooltips, section headers, empty states) checking for any other language implying: auto-remediation/fix generation, multi-model consensus, persistent cross-scan memory/learning, dynamic/runtime exploit verification, or compliance reporting (SARIF/PDF export) — none of which CodeVerdict currently does. Replace any instance found with accurate equivalents, following the same standard as Fixes 1-4: the tool can sound confident and well-built without claiming capabilities it doesn't have.

---

## Definition of Done for this pass

- [ ] Sidebar nav items all map to real, existing parts of the app — no item links to or implies a feature that doesn't exist.
- [ ] No badge, label, or score anywhere claims dynamic/verified exploitability — all such language replaced with accurate static-analysis/AI-review framing.
- [ ] Hero copy and any secondary taglines describe the real 4-agent + synthesizer architecture, with no mention of auto-generated fix PRs or threat models.
- [ ] A full text sweep has been done per Fix 5, with no remaining overstatements found or all found instances corrected.
- [ ] Nothing outside the scope of Fixes 1-5 was restructured, restyled, or rebuilt — this was a targeted correction pass, not a redesign.