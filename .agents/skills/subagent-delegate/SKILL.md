---
name: subagent-delegate
description: Delegate independent, bounded work to Codex subagents when parallel exploration, review, testing, or summarization will improve speed or keep noisy detail out of the main thread.
---

# Delegate to Codex subagents

Use Codex subagents for independent, well-specified read-heavy work: codebase mapping,
test/log analysis, focused reviews, documentation checks, or repeated triage.

Keep architectural decisions, ambiguous requirements, tightly coupled edits, and final
integration in the main session. Avoid concurrent write-heavy tasks unless files are
clearly disjoint.

Ask Codex directly to delegate, stating:

- one bounded task per agent;
- whether to wait for all results;
- the required summary format and file references.

Example: "Spawn three subagents: security review, test-gap review, and code-path mapping.
Wait for all, then summarize verified findings by category with file references."

Built-in subagent types are `default`, `worker`, and `explorer`. For recurring roles,
define a named custom agent in `.codex/agents/*.toml` — set `model`,
`model_reasoning_effort`, and `sandbox_mode` there, not in SKILL.md (Codex ignores
`model:`/`allowed-tools:` skill frontmatter; those fields are for Claude Code). Use a
lower-cost/read-only agent for exploration; reserve stronger agents for ambiguous review.

Inspect running or completed agents with `/agent` in the Codex CLI. Treat each result as
input, not proof: read cited files, inspect diffs, resolve conflicts, and run the
relevant checks yourself.

Do not use parallel agents to edit overlapping files. A separate `codex exec` subprocess
is not a coordinated subagent; use it only when independent process-level work is
intentionally desired.
