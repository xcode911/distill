# distill

`distill` is a Unix-first CLI that compresses command output before you send it to a paid LLM.

## Install

```bash
npm i -g @samuelfaj/distill
```

## Usage

```bash
logs | distill "summarize errors"
git diff | distill "what changed?"
terraform plan 2>&1 | distill "is this safe?"
```

Persist defaults locally:

```bash
distill config model "qwen3.5:2b"
distill config thinking false
```

For pipeline exit mirroring, use `pipefail` in your shell:

```bash
set -o pipefail
```

Interactive prompts are passed through when `distill` detects simple prompt patterns like `[y/N]` or `password:`.

## Global agent instructions

If you want Codex, Claude Code, or OpenCode to prefer `distill` whenever they run a command whose output will be sent to a paid LLM, add a global instruction telling the agent to pipe command output through `distill`.

- Codex reads global agent instructions from `$CODEX_HOME/AGENTS.md`. If `CODEX_HOME` is not set, use `~/.codex/AGENTS.md`.
- Claude Code supports global settings in `~/.claude/settings.json`, and its official mechanism for custom behavior is global instructions via `CLAUDE.md`.
- OpenCode supports global instruction files through `~/.config/opencode/opencode.json`. Point its `instructions` field at a markdown file with the same rule.

Recommended instruction text:

```md
CRITICAL: Always when you invoke a any shell command pipe it through `distill` and tell exactly what you want to know.
`distill` will summarize the response to save tokens, which is critical for us.

Examples:
- `bun test 2>&1 | distill "did the tests pass?"`
- `git diff 2>&1 | distill "what changed?"`
- `terraform plan 2>&1 | distill "is this safe?"`

NEVER RUN COMMANDS WITHOUT `distill` unless if it would break an interactive/TUI workflow or when exact uncompressed output is required.
```