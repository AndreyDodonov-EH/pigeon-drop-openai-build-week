---
name: subagent-delegate
description: Delegate well-specified work to a cold-start subagent when the user explicitly asks to use a subagent, delegate, parallelize with agents, or names an available agent type. Use model overrides and self-contained briefs deliberately; the active session remains responsible for integration and verification. Image work follows `game-art`.
---

# Delegating to subagents

Two execution paths exist: **the active session**, which has the conversation and project
context, and a **cold-start subagent**, which receives only the brief you provide. Use a
subagent only when the user explicitly asks for delegation or subagents; do not spawn one
merely because a task has multiple parts.

|                          | Active session | Subagent |
|--------------------------|----------------|----------|
| Conversation context     | yes            | no — provide a self-contained brief |
| Best for                 | architecture, ambiguous requirements, tuned-by-eye constants, integration | user-requested parallel work, broad exploration, isolated implementation, context-heavy reads |
| Main cost                | consumes this thread's context | cold start and duplicated context derivation |
| Accountability           | owns final result | reports findings/changes; active session reviews |

Image generation and editing are not a reason to delegate by themselves. Follow
`game-art` and use the active session's image capability directly unless the user asks for
an agent-based split.

## Choosing an agent and model

Pick the most specific available agent type for the job. Use a general-purpose agent only
when no specialist fits.

- **`sonnet`** — default override for implementation, codebase research, and work needing
  competent engineering judgment from a clear brief.
- **`haiku`** — mechanical, high-volume, low-judgment work: identical edits, extraction,
  renames, or bulk summarization.
- **`opus` / `fable`** — reserve for a user-requested subtask that genuinely needs deeper
  reasoning and does not depend on unexternalized context from this conversation.

If the result blocks current work, run it in the foreground. Otherwise, background is
appropriate when the user asked for parallel work. Continue an existing relevant agent
with `SendMessage`; do not start a fresh one and discard its context.

## The brief is the contract

Brief the subagent like a colleague joining cold. Every implementation brief includes:

1. **Goal** — one-sentence outcome followed by necessary detail.
2. **Context** — repository root, relevant files/symbols, established decisions, and the
   commands or runtime surface involved.
3. **Constraints** — exact scope, files it may touch, conventions to match, dependencies it
   may add, and explicit non-goals. Forbid drive-by refactors and broad reformatting.
4. **Acceptance checks** — concrete commands or observable behavior; require the agent to
   run them and fix failures before reporting.
5. **Deliverable** — concise summary, every file changed, checks run with outcomes, and any
   unresolved issue or assumption.

For read-only exploration, state the search breadth and ask for conclusions with file paths
and line references rather than large file dumps.

## Review and integration

A subagent's report describes intent; it is not proof.

1. Read every changed file and compare it with the approved scope and surrounding idiom.
2. Check naming, duplication, abstraction level, and whether tuned constants or unrelated
   behavior moved.
3. Re-run acceptance checks in the active session.
4. Verify runtime-visible changes end to end; use `run-game` for Phaser visuals.
5. Send specific feedback to the same agent when revisions are needed. Apply a direct patch
   only when it is genuinely smaller and clearer than another delegation round.
6. Report failures, skipped checks, or partial work plainly; do not mark the task complete
   until verification succeeds.
