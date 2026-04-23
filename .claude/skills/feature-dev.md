---
name: feature-dev
description: User-facing entry point for any new feature, change, or improvement to CareLink. Triggers the full PM → Impl → QA → evidence → user acceptance pipeline with two mandatory gates (spec confirmation, final acceptance). Invoked via `/feature <需求>` or whenever the user starts a new feature conversation without an existing spec.
---

# `/feature` — the single entry point for feature work

This skill runs the **閉環 feature pipeline** defined in `CLAUDE.md#agent-workflow`. You (Claude) are the coordinator; you use the Agent tool to delegate to four specialists and you stop at the two user gates.

## Sequence you enforce

### 1. Plan
- Delegate the user's raw requirement to the `pm-feature-planner` subagent via the Agent tool. Pass the user's words verbatim plus any relevant file paths you already know are affected.
- Wait for `pm-feature-planner` to return a spec in its output format: feature summary, user story, scope, out-of-scope, task list, acceptance criteria, risks.

### 2. GATE 1 — user confirms spec
- **This is a hard stop.** Present the spec to the user formatted like this:

  ```
  ## Spec ready — waiting for your confirmation

  **Feature:** <1-line summary from PM>
  **Tasks:** <count> tasks, each with acceptance criteria above
  **Risks / open questions:** <from PM output, or "none">

  Options:
  - `confirm` → start implementation
  - `/refine <what to change>` → send back to planner
  - `reject` → discard and start over
  ```

- Do **not** route to the implementer until the user explicitly says confirm / 同意 / yes / 好.
- If the user types `/refine <change>`, invoke the `refine-spec` skill instead.
- There is **no** "just do it" escape hatch. Every feature, even one-line changes, gets Gate 1.

### 3. Implement
- Delegate to `rn-expo-implementer` with the full approved spec embedded as context.
- The implementer produces code + a report of what changed. Do not forward it blindly — you'll route via QA first.

### 4. QA
- Delegate to `qa-test-runner`. Pass:
  - The plan's acceptance criteria (so QA can cross-check).
  - The implementer's "files changed / what was changed" output.

- On `QA status: FAIL`:
  - Forward QA's `Required fixes` section **verbatim** back to `rn-expo-implementer`.
  - Track the cycle count. On the 4th cycle (3 rounds of Impl ↔ QA without pass), stop and escalate to the user with what each cycle produced.

- On `QA status: PASS`: continue.

### 5. Reality-check (evidence only, no verdict)
- Delegate to `reality-checker`. Pass the plan + the implementer's output + QA's passed report.
- The reality-checker produces an **evidence report** (criterion-by-criterion with file:line citations or command output). It does not say PASS, NEEDS WORK, or READY — only `✅ evidenced` / `⚠️ partial` / `❌ missing` per criterion.

### 6. GATE 2 — user acceptance
- **This is also a hard stop.** Present the evidence report to the user formatted like this:

  ```
  ## Evidence report — waiting for your acceptance

  ### Feature
  <summary>

  ### Acceptance criteria — evidence per item
  <reality-checker's criterion-by-criterion output, verbatim>

  ### Files changed
  - <file> — <summary>

  ### Commits
  - <sha> <title>

  ### Gaps / caveats surfaced
  - <anything ⚠️ or ❌>

  ### How to try it
  <1–3 concrete steps>

  Options:
  - `approve` → task done, ready to merge
  - `/refine <what to change>` → re-plan and re-run pipeline
  - `fix <specific change>` → small tweak; re-runs impl + QA + evidence
  - `reject` → back to planner with your reason
  ```

### 7. Route the user's Gate 2 decision
- `approve` → stop. The task is done. Offer to open/merge a PR if appropriate.
- `/refine <change>` → invoke the `refine-spec` skill.
- `fix <specific change>` → re-delegate to `rn-expo-implementer` with just that change. Then re-run QA + reality-checker + Gate 2.
- `reject` → delegate to `pm-feature-planner` with the rejection reason; start over from step 2.

## What you never do

- Route past Gate 1 or Gate 2 without an explicit user word. AI-inferred consent is not consent.
- Declare the task done on the user's behalf.
- Skip any specialist ("this is too simple for QA" is not a reason).
- Rewrite any subagent's output before forwarding. You either forward verbatim or route back, never both.
- Mix features. If the user drops two features in one message, split into two `/feature` pipelines.

## When not to use this skill

- For a local question (e.g. "how does X file work?") — answer directly, no pipeline.
- For debugging that doesn't change behavior — call the relevant agent directly.
- For exploratory "what could we do about X?" — discuss plainly; don't enter the pipeline until the user says "let's do it, spec it out".
