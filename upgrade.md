# CodeVerdict — UI Upgrade & Rebrand Specification

**For:** Antigravity agentic IDE
**Type:** Frontend visual upgrade + project-wide rename
**Scope:** Rebrand only — do not change backend logic, agent behavior, or architecture from the original CODESENTRY_BUILD_PLAN.md. This is a presentation-layer upgrade plus a name change that must be applied consistently everywhere the old name appears.

---

## 0. Why this rename is happening (context for the copilot)

The original project name "CodeVerdict" collides with an existing, funded, branded product in the same space ("CodeVerdict — AI-Native SAST," a security-scanning platform). To avoid confusion and any appearance of copying a real company's branding, the project is being renamed to **CodeVerdict** before further public/resume use.

**Rename this everywhere it appears**, including but not limited to:
- README.md title and all body references
- package.json `name` field (frontend)
- Page `<title>` tags and any meta tags
- UI headers, logo text, footer text
- Python module docstrings/comments that reference the project by name
- Any environment variable prefixes, Docker image names, or docker-compose service names that include "codeverdict"
- GitHub Actions workflow names/comments
- docs/*.md files (ARCHITECTURE.md, LEARNING_NOTES.md, DECISIONS.md, EVAL_METHODOLOGY.md)

Do a full repository search for "CodeVerdict," "codeverdict," and "code-verdict" (case variants) and replace each with "CodeVerdict" / "codeverdict" / "code-verdict" as grammatically appropriate. Log every renamed file in `docs/DECISIONS.md` so there's a record of the rename.

**Tagline to use throughout:** "Multi-agent code review, one final verdict." Use this or a close variant in the hero section, README description, and page meta description.

---

## 1. Design Direction

Build the frontend to match the attached visual reference (dark, premium, security/SaaS aesthetic) with the following intentional direction — not a generic dark-mode template:

### Color tokens (use these exact values as CSS variables)
```css
--bg-primary: #0a0e14;        /* near-black base, slightly blue-shifted, not pure black */
--bg-surface: #11151c;        /* card/panel background, one step up from base */
--bg-surface-raised: #161b24; /* hover/active surface state */
--border-subtle: #1f2530;     /* hairline borders on cards */
--text-primary: #e8eaed;      /* main text, off-white not pure white */
--text-secondary: #8b92a3;    /* muted/secondary text */
--accent-primary: #6366f1;    /* indigo/violet — primary actions, links, active states */
--accent-success: #34d399;    /* findings resolved, "neutralized", passing checks */
--accent-warning: #fbbf24;    /* medium severity */
--accent-critical: #f87171;   /* critical/high severity findings */
```

### Typography
- **Display/headings:** A geometric sans with some character — Inter, or Geist if available via Google Fonts/CDN — weight 600-700 for headlines, tight letter-spacing (-0.02em) on large sizes.
- **Body:** Same family, weight 400-500, comfortable line-height (1.6) for readability of findings/descriptions.
- **Monospace (for code snippets, file paths, line numbers):** JetBrains Mono or similar — used specifically for: file paths (e.g. `app/auth.py:L42`), code excerpts, severity tags, the "exploit path" style chain shown in the reference image.

### Layout & signature element
The reference image's standout feature is the **live finding card with a visual "path" trace** (e.g., `req.params.id → db.raw → SELECT * FROM users`) and a numeric score bar. Recreate this concept as CodeVerdict's signature element, adapted to what CodeVerdict actually produces:

- Each finding card shows: severity badge, category tag (Security/Quality/Performance/Coverage), file path + line range in monospace, a short title, the agent's explanation, and — where applicable — a horizontal score/confidence bar (0-100).
- For Security findings specifically that came from the real `bandit` tool call, visually distinguish these (e.g., a small "Verified by static analysis" tag) from purely LLM-reasoned findings, since this is a real, defensible technical detail worth surfacing in the UI, not just the backend.

Do not copy the reference image's exact copy/branding/company name — only the visual language (dark surfaces, score bars, monospace data, badge system, the calm-but-serious tone).

### Use your own design judgment within this direction

The tokens, layout, and signature element described above are a **starting direction, not a rigid spec to execute mechanically.** Treat this the way a design lead at a studio would treat a creative brief: the brief sets the boundaries and the intent, but you are expected to make real decisions inside it, not just fill in the blanks.

Concretely, this means:
- If a spacing, sizing, or color choice described above doesn't actually look good once it's on screen, change it — use your own judgment on what reads as clean, confident, and uncluttered, rather than treating the listed hex values and font names as untouchable.
- Look at the result critically before calling it done. Ask yourself: does this look like a templated dark-mode dashboard, or does it look like something with a specific point of view? If it's the former, revise it.
- Favor a clean, uncluttered result over a maximalist one. Generous whitespace, clear visual hierarchy, and restraint in how many accent colors/effects appear on screen at once will read as more premium than cramming in every element described in this spec. It is fine — encouraged, even — to simplify a section, cut a decorative element, or merge two visual ideas into one if that produces a cleaner result.
- The finding cards, score bars, and agent-progress states are the functional requirements; exactly how they're laid out, spaced, and styled within the dark/premium direction is yours to decide well.
- Take one real design risk somewhere on the page (the "signature element") rather than playing it safe everywhere — but keep everything else around it quiet and disciplined so that one risk stands out instead of competing with five others.
- Before finalizing, do a self-critique pass: take a screenshot or render the page, look at it as if seeing it for the first time, and remove anything that isn't earning its place on the screen.

### Motion
Keep animation minimal and purposeful:
- Findings list: a brief staggered fade-in as results arrive (since agents return at slightly different times in practice, even though they're dispatched together)
- Score bars: animate from 0 to final value on first render
- No decorative motion beyond this — per design best practice, restraint reads as more premium than heavy animation.

---

## 2. Pages/Views to Build or Update

### 2.1 Landing / Input view
- CodeVerdict logo/wordmark + tagline
- PR URL input field + "Start Review" button
- A secondary "Load Mock PR" button for offline/demo use (already exists in concept — keep this, it's a legitimately good idea for demos without GitHub API rate limits)
- Brief, honest stat row IF real eval numbers exist by this point (e.g., "Evaluated against N PRs · X% precision · Y% recall") — **do NOT fabricate numbers here.** If the eval suite hasn't produced numbers yet, omit this row entirely rather than placeholder/fake stats. This matters: the reference image's "90.8% detection rate" etc. are that company's real (claimed) numbers — CodeVerdict must only ever show numbers that came from its own actual `eval/eval_results.md`.

### 2.2 Review results view
- Per-agent tabs (All / Security / Quality / Performance / Coverage) matching the reference image's filter pattern
- Each finding as a card per the signature element described above
- A distinct "Final Synthesized Review" section, visually set apart (e.g., a highlighted border or header treatment) since this is the most important output — the merged, de-duplicated, ranked result from the Synthesizer agent
- Loading state while agents run: show which agents are in-flight (e.g., "Security Agent: scanning..." / "Quality Agent: reviewing...") rather than a generic spinner — this also doubles as a nice transparency feature, letting the user see the multi-agent nature of the tool as it works, which is good for both UX and for demoing the architecture to others.

### 2.3 Empty/error states
Per design guidance: explain what happened and how to fix it, in the product's voice, never vague.
- No PR URL entered: inline validation message, not a generic browser alert
- GitHub API failure (bad URL, rate limit, private repo): a specific, helpful message — e.g., "Couldn't fetch this PR. Check that the URL is correct and the repo is public, or try the mock PR instead."
- LLM/Groq API failure: "The review service is temporarily unavailable. Try again in a moment."

---

## 3. Explicit Non-Goals for This Pass

- Do not change any backend agent logic, prompts, orchestration, or RAG/bandit integration — this is purely a rename + frontend visual pass.
- Do not add new features beyond what's described above (no new agents, no new endpoints).
- Do not fabricate metrics, testimonials, or company names anywhere in copy — this is a personal portfolio project, not a company, and should never imply otherwise (no fake customer logos, no invented user counts).

## 4. Definition of Done for This Pass

- [ ] Every instance of "CodeVerdict" in the repo is renamed to "CodeVerdict" (verified via repo-wide search showing zero remaining matches except in `docs/DECISIONS.md`'s rename log, which should reference the old name for history).
- [ ] Frontend visually matches the dark/premium direction described in Section 1, using the specified color tokens and typography.
- [ ] Findings display the signature card pattern (severity, category, file/line, monospace path data, score bar where applicable).
- [ ] Security findings sourced from real `bandit` output are visually distinguished from pure-LLM findings.
- [ ] No fabricated statistics appear anywhere in the UI — landing page stat row is either real (from `eval/eval_results.md`) or omitted entirely.
- [ ] Loading state shows per-agent progress, not a generic spinner.
- [ ] Empty/error states give specific, actionable messages per Section 2.3.
- [ ] Mobile responsive down to ~375px width; visible keyboard focus states on all interactive elements.
- [ ] The result, viewed as a whole, looks clean and intentional rather than like a generic dashboard template with boxes checked — if it doesn't, revise before considering this pass complete.