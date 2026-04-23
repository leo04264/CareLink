---
name: refine-spec
description: User-facing change-request entry point. Use when the user wants to modify a spec — either at Gate 1 (before implementation has started) or at Gate 2 (after seeing the evidence report). Loops back into `pm-feature-planner` with the user's change request and the current spec; the revised spec re-enters Gate 1.
---

# `/refine` — spec refinement loop

This is the formal way to send a feature back through the pipeline with changes. It is **not** a way to bypass Gate 1 or Gate 2 — quite the opposite: it's how you respect the user's ability to iterate without losing the pipeline's guarantees.

Invoke this skill when the user types `/refine <change>` (or any clear refinement intent, e.g. "change X to Y") **during a feature-dev flow**.

## Sequence

### 1. Capture context

Gather into a single handoff packet:
- **Current spec**: the full PM output that's on the table right now.
- **Current stage**: Gate 1 (not yet built) or Gate 2 (built, evidence in hand).
- **User's change**: the text after `/refine`, or the user's refinement intent.
- **Relevant artifacts**:
  - If at Gate 2: the reality-checker evidence report + list of files changed (so the planner knows what's already shipped and what would have to be re-done).
  - If at Gate 1: nothing extra.

### 2. Re-delegate to the planner

Call `pm-feature-planner` via the Agent tool with the packet above. Tell it explicitly:
- "Here is the current spec."
- "Here is the user's change request."
- "Produce a revised spec in your standard output format."
- If at Gate 2: "Note what is already implemented — flag which tasks need new work, which are unchanged, and which can be discarded."

### 3. Back to Gate 1

The revised spec re-enters the `feature-dev` skill at **Gate 1**. Same presentation format, same options (`confirm` / `/refine` / `reject`). No shortcut — a refined spec is still a spec that needs user confirmation.

### 4. Continue the pipeline

Once the user confirms the revised spec, the pipeline continues exactly as in `feature-dev`. If revisions at Gate 2 mean some files need re-work and others are fine, the implementer handles that when delegated — you do not try to split work yourself.

## What you never do

- Skip the planner and hand the change directly to the implementer. Even small refinements go through the planner so the acceptance criteria stay in sync with the spec.
- Auto-confirm the revised spec on the user's behalf.
- Lose the history — always include both the old spec and the change request in the handoff packet so the planner can diff them.

## When not to use

- **A small typo or concrete fix where the spec doesn't change** (e.g. "button color is #123, should be #456"). Use `fix <specific change>` in `feature-dev` Gate 2 — that's routed directly to the implementer, which is cheaper and still hits QA + Gate 2 again.
- **Rejecting the whole feature**. Use `reject` in Gate 2 — that goes back to the planner with a cleaner slate.
- **Answering a question**. `/refine` is for changes; questions just get answered plainly.
