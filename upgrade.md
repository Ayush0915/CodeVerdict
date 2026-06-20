# CodeVerdict — UI Upgrade Specification (v2, based on real reference screenshots)

**For:** Antigravity agentic IDE
**Type:** Frontend visual upgrade only
**Scope:** Visual/design system upgrade. Do not change backend logic, agent behavior, prompts, orchestration, RAG, or bandit integration. Project is already named CodeVerdict — no further renaming needed.

---

## 0. Critical scoping rule — read this before anything else

The visual reference for this spec is the real marketing site for an existing product, "CodeSentry" (trycodesentry.online) — a much larger, funded security platform with features CodeVerdict does not have: a persistent codebase memory graph, 7 scan profiles across web/mobile/cloud/IaC, 22-layer analysis pipelines, multi-model cross-consensus, threat modeling (STRIDE), and SARIF/PDF compliance reports.

**Only borrow the visual design language from this reference — never the claimed features, never the specific numbers, never sections describing capabilities CodeVerdict doesn't have.** Building a UI section that implies a feature exists when it doesn't is a misrepresentation, not a design choice, and it will fall apart the moment anyone (a recruiter, an interviewer) actually tries to use it.

**Concretely:**
- ✅ Borrow: the overall layout system, color palette, typography scale, card style, pill-badge pattern, the dark "console" panel treatment for showing findings/code, the score-bar + severity-badge pattern, button styles.
- ❌ Do not borrow: "Codegraph," "Memory Graph," "Business Context," "Audit Config" sections (CodeVerdict has no persistent cross-scan memory or codebase-wide graph — it reviews one PR diff at a time), the 7-scan-profile selector (Web/API/Android/iOS/Cloud/Secrets/Agentic AI — CodeVerdict only reviews code diffs, not infra or mobile binaries), the full pipeline diagram with "22 analysis layers," "cross-model consensus," "Tree-sitter AST," "Dependency CVE," "Threat modeling (STRIDE)" (CodeVerdict has 4 specific agents + 1 synthesizer — show exactly that, not an invented larger pipeline), any specific percentage/stat that isn't pulled live from CodeVerdict's own `eval/eval_results.md`.

If in doubt about whether a section maps to something CodeVerdict actually does, leave it out rather than guess.

---

## 1. Design System (derived from the real reference screenshots)

### Background & overall theme
**Light theme as the primary surface** — not dark. The reference uses a near-white background (`#fafafa` to `#ffffff`) for the page itself, with **one dark panel as a deliberate contrast element** (the "console" showing live findings/diffs), not a fully dark UI. This is a correction from earlier drafts of this spec, which assumed dark-mode-first — that was based on a single cropped image and was wrong.

```css
--bg-page: #fafafa;            /* main page background, near-white */
--bg-card: #ffffff;            /* card surfaces, pure white, sit on top of page bg */
--border-subtle: #e5e7eb;      /* light hairline borders on cards/pills */
--text-primary: #0a0a0a;       /* near-black, for headlines */
--text-secondary: #52525b;     /* muted gray for body/supporting text */

--console-bg: #0a0e14;         /* the ONE dark panel used for live findings/diffs */
--console-text: #e8eaed;
--console-border: #1f2530;

--accent-brand: #4f46e5;       /* primary buttons, links — indigo, used sparingly */
--accent-success: #16a34a;     /* dot indicators, "verified", low severity */
--accent-critical: #dc2626;    /* critical severity */
--accent-warning: #d97706;     /* high/medium severity */
--accent-info: #2563eb;        /* medium-low / informational */
```

### Typography
- **Headlines:** large, bold, tight-tracking grotesk sans (Inter or similar at weight 700-800). The reference's headlines are notably large relative to body text — lean into that scale contrast, don't undersize headlines out of caution.
- **Body:** same family, weight 400, muted gray color (`--text-secondary`), comfortable line-height.
- **Monospace:** used ONLY inside the dark console panel and for file paths/line numbers — JetBrains Mono or similar.

### Signature components to build

**1. Eyebrow pill badge** — small rounded-pill label above each major section, with a small colored dot + uppercase tracked text (e.g., "● MULTI-AGENT REVIEW"). Used once per major section, not on every card.

**2. The dark console/findings panel** — this is the one deliberate dark element on an otherwise light page. Used specifically to display:
- Live findings as the agents run
- The Final Synthesized Review output
- Each finding inside it follows the reference's pattern: file/target path in monospace at top, severity badge (top-right, colored pill), a short labeled score with a horizontal bar beneath it in the matching severity color.

**3. Pill-tab selector** — horizontal row of rounded-pill tabs, active state filled dark/black with white text, inactive state outlined. Use this for the agent-category filter (All / Security / Quality / Performance / Coverage) on the results view — this directly maps to the reference's Web Application/API/Android tab row, and it's a legitimate, honest reuse since CodeVerdict really does have exactly these 4 categories.

**4. Icon-in-rounded-square** — small (40-44px) rounded-square containers with a centered line icon, light gray background, used next to feature/agent names. Use this for each of the 4 agent types + the Synthesizer on the landing page, each with a distinct, relevant icon (e.g., a shield for Security, a sparkle/check for Quality, a gauge/speedometer for Performance, a clipboard-check for Coverage, a merge/git-icon for Synthesizer).

### Motion
Same as before — minimal and purposeful only:
- Score bars animate from 0 to final value on render
- Findings fade/slide in with a slight stagger as they arrive
- No other decorative motion

---

## 2. Pages/Views — scoped to what CodeVerdict actually does

### 2.1 Landing / Input view

**Hero section** (light background, matches reference's hero layout):
- Eyebrow pill: "● MULTI-AGENT CODE REVIEW"
- Large bold headline — write something honest and specific to CodeVerdict's real mechanism, e.g., "Four agents review your PR. One verdict ships." (adjust wording, but keep it concrete about the real architecture, not vague marketing language)
- Subhead, 1-2 sentences, stating plainly what it does: reviews a GitHub PR for security, quality, performance, and test coverage using specialized AI agents, with a static analysis tool (bandit) backing the security findings.
- PR URL input + "Start Review" button + "Load Mock PR" secondary button (keep this — legitimately useful, not borrowed feature creep)

**Below the input, a live-style preview** (using the dark console panel pattern): show what a finding looks like — this can use the mock PR's actual output if available, so it's real, not staged-looking placeholder text.

**Stats row:** ONLY if `eval/eval_results.md` has real numbers. Format like the reference's stat row (large bold number, small label beneath) but only with CodeVerdict's actual measured precision/recall/benchmark-set-size. If no real numbers exist yet, omit the row entirely — do not placeholder it with fake numbers in the reference's style.

**Agent overview section** (replaces the reference's "Codegraph / Audit Config / Business Context / Memory Graph" 4-card row, with CodeVerdict's real equivalent): 4 cards, one per agent (Security, Quality, Performance, Test Coverage), each with the icon-in-rounded-square treatment, agent name, and a 1-sentence honest description of what it actually checks. A 5th, visually distinct card or a connecting visual for the Synthesizer, described accurately as "merges all four agents' findings into one ranked, de-duplicated review" — not implying any persistent memory or learning-over-time capability CodeVerdict doesn't have.

### 2.2 Review results view

- Pill-tab filter row (All / Security / Quality / Performance / Coverage) — directly reusing the reference's tab pattern, since this maps honestly
- Findings rendered in the dark console panel pattern: file path + line range (monospace), severity badge, short title, agent explanation, score/confidence bar where the agent produces one
- Security findings that came from the real `bandit` call get a small distinguishing tag (e.g., "Verified — static analysis") — this is one place where CodeVerdict can legitimately show something concrete and real, similar in spirit to the reference's "ACTIVE EXPLOIT" tag, but accurately labeled for what it actually is.
- Final Synthesized Review: the most visually prominent block on this page — larger console panel, clearly labeled, sits above or before the per-agent breakdown.
- Loading state: show per-agent progress (e.g., "Security Agent — scanning...", checkmarks as each completes) rather than a generic spinner, similar in spirit to the reference's step-by-step "Connect → Analyze → Fix" flow but reflecting CodeVerdict's actual 4-agents-in-parallel-then-synthesize flow, not a sequential one (don't imply sequential steps if your agents genuinely run in parallel — that would misrepresent the architecture).

### 2.3 Empty/error states
Unchanged from before — specific, actionable, in-product voice:
- No URL entered → inline validation, not browser alert
- GitHub fetch failure → "Couldn't fetch this PR. Check the URL is correct and the repo is public, or try the mock PR instead."
- LLM API failure → "The review service is temporarily unavailable. Try again in a moment."

---

## 3. Explicit Non-Goals

- Do not build a codebase-wide memory graph, persistent learning, or cross-scan suppression — CodeVerdict reviews one PR at a time, statelessly, by design (per the original build plan).
- Do not build multi-platform scan profiles (Android/iOS/Cloud/IaC) — CodeVerdict reviews code diffs only.
- Do not build a pipeline diagram implying more analysis stages than actually exist (4 agents + 1 synthesizer — show exactly that if a pipeline visual is used at all).
- Do not display any percentage, count, or score that isn't computed from CodeVerdict's real eval suite or the real bandit/LLM output at runtime.
- Do not add navigation items (Pricing, Teams, Docs, Blog, Sign in) implying this is a multi-page SaaS product with accounts — this is a single-page portfolio tool. A minimal header with the logo + one-line description is sufficient.

## 4. Definition of Done

- [ ] Page uses a light background with the dark console panel as a deliberate, singular contrast element — not a fully dark theme.
- [ ] Eyebrow pill badges, large bold headline typography, and icon-in-rounded-square cards are implemented per Section 1.
- [ ] The 4-agent overview section accurately describes CodeVerdict's real agents — no invented capabilities.
- [ ] Pill-tab filter on the results view works and matches the visual pattern (filled active state, outlined inactive).
- [ ] Findings panel uses the dark console treatment with severity badges and score bars where applicable.
- [ ] Bandit-sourced security findings are visually and textually distinguished as real static-analysis output, accurately labeled.
- [ ] No stats, percentages, or capabilities appear anywhere that don't correspond to something CodeVerdict actually does or has actually measured.
- [ ] No multi-page SaaS navigation (Pricing/Teams/Sign in) — header stays minimal and honest about what this is.
- [ ] Mobile responsive down to ~375px; visible keyboard focus states.
- [ ] Viewed as a whole, the result looks like a confident, honest single-purpose tool — not an attempt to look like a bigger company than it is.