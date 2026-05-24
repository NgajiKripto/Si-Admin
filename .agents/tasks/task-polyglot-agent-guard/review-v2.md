# Polyglot guard scripts with TypeScript bridge and declarative policies (v2)

The agent guard system expands from TypeScript-only into a polyglot architecture: Python handles input scanning and knowledge auditing, shell scripts handle output validation and file security scanning, and a TypeScript bridge (`runner.ts`) invokes these via `execSync` with automatic fallback to existing TS implementations. The v1 review raised 6 issues; all 6 were addressed. Command injection is eliminated via `SCAN_TARGET` env var. Shell scripts delegate JSON serialization to `python3 -c` with `json.dumps`. All `execSync` calls carry `timeout: 5000`. YAML policy files carry explicit headers marking them as human-readable specs with sync notes.

**Watch for:** The `runGuardOutput` function passes `blockedOutputPatterns` and `systemPromptHash` to the TypeScript fallback but does not forward them to `validate-output.sh`, so the polyglot path silently ignores custom blocked patterns and prompt-hash checks — making the guard *less strict* when the shell scripts succeed than when they fail (confirmed). The `validate-output.sh` script passes output text as a `python3` positional argument via `sys.argv[1]`, which will hit OS argument-length limits on large inputs, though the response limiter mitigates this in practice (confirmed, low risk).

## High-level view

The shell output validator hardcodes its detection patterns and has no mechanism to receive the admin-configured `blockedOutputPatterns` or `systemPromptHash`. When `python3` is available and the shell path succeeds, custom output rules are not enforced. When it fails and the TypeScript fallback runs, they are. This inversion — the "happy path" being less secure — is the primary remaining gap.

The `validate-output.sh` script passes text to `python3 -c` as a positional argument rather than via stdin. The response limiter (2000 chars / 500 tokens) keeps output well within OS limits for normal requests, but any direct or future use of the script on larger content would fail silently. The fix (piping via stdin) is trivial.

The v1 security concerns are resolved: `runSkillScan` uses env-var passthrough, both shell scripts use `python3` + `json.dumps` for all serialization, and `execSync` calls have explicit 5-second timeouts.

<details>
<summary>Issues (2)</summary>

1. **Shell output validator ignores custom patterns and prompt hash** — `runGuardOutput` receives `blockedOutputPatterns` and `systemPromptHash` but only forwards raw text to `validate-output.sh`. The shell script applies hardcoded patterns only. Custom blocked-output rules configured by an admin are enforced only via the TypeScript fallback, creating a behavioral asymmetry where the polyglot "success" path is less strict than the fallback path. Either pass patterns as JSON via stdin (like `runGuardInput` does) or run the TypeScript validation as a post-check after the shell path succeeds.
2. **Argument-length limit in `validate-output.sh`** (low risk) — Output text flows through `validate_output "$input_text"` into `python3 -c '...' "$text"`, making it a single `argv` element. The response limiter (2000 chars) keeps this safe in normal operation, but direct CLI usage or future removal of the limiter would hit `ARG_MAX`. Pipe text to python3 via stdin instead of argv.

</details>

<details>
<summary>Details</summary>

## Feature gap between shell and TypeScript output validation

The TypeScript `validateOutput` signature:

```typescript
export function validateOutput(
  output: string,
  blockedOutputPatterns: string[],
  systemPromptHash?: string | null
): ValidationResult
```

It checks `blockedOutputPatterns` from the database config and optionally detects system-prompt leakage via hash comparison. The shell script receives only the raw output text via stdin and applies hardcoded PII/prompt-leak patterns.

The bridge function demonstrates the asymmetry:

```typescript
export function runGuardOutput(
  output: string,
  blockedOutputPatterns: string[],  // never forwarded to shell
  systemPromptHash?: string | null   // never forwarded to shell
): ValidationResult {
  try {
    const result = execSync(`bash "${VALIDATE_OUTPUT_SCRIPT}"`, {
      input: output,  // only the text
      ...
    });
```

An admin who adds `"internal pricing"` to their blocked output patterns expects it enforced. On a system where bash+python3 are available, the shell path succeeds and that pattern is never checked. On a system without them, the TypeScript fallback catches it. The fix aligns with how `runGuardInput` works: pass a JSON payload containing both the text and the pattern list, and have the shell script (or its python3 inner block) deserialize and apply them.

## Argument passing in validate-output.sh

The data flow:

```
runner.ts → execSync(stdin: output) → bash validate-output.sh
  → input_text=$(cat)       # read from stdin ✓
  → validate_output "$input_text"   # passed as bash $1
    → python3 -c '...' "$text"      # passed as python sys.argv[1]
```

Each hop passes the text as a positional argument. The `cat` → `$1` hop has the same `ARG_MAX` constraint as the `$1` → `sys.argv[1]` hop. Given the response limiter caps output at 2000 characters, this is a theoretical concern for the current integration. It becomes practical if the script is used standalone for auditing historical messages or if the limiter ceiling is raised. Piping text through stdin to the python3 block (using a heredoc or `/dev/stdin`) would eliminate the size constraint entirely.

</details>

<details>
<summary>File map</summary>

| File | Change |
|:-----|:-------|
| `scripts/guard/scan-input.py` | Python input sanitizer with stdin JSON interface and self-tests |
| `scripts/guard/audit-knowledge.py` | Python knowledge auditor with injection/zero-width detection |
| `scripts/guard/scan-skill.sh` | Shell file scanner using SCAN_TARGET env var, python3 JSON output |
| `scripts/guard/validate-output.sh` | Shell output validator delegating to inline python3 for logic + JSON |
| `scripts/guard/policies/*.yml` | Human-readable policy specs with sync-note headers |
| `src/lib/agent-guard/runner.ts` | TypeScript bridge: execSync with timeout: 5000, env-based file path |
| `src/lib/agent-guard/index.ts` | Re-exports runner functions, polyglot availability, ZERO_WIDTH_CHARS_PATTERN |
| `src/lib/agent-guard/input-sanitizer.ts` | ZERO_WIDTH_CHARS_PATTERN without /g flag, fresh regex at replace site |
| `src/lib/agent-guard/knowledge-auditor.ts` | Narrowed `act as` regex, line-anchored `system:` pattern |
| `src/lib/agent-guard/action-permissions.ts` | ActionType enum, ACTION_TYPES array, isActionAllowed |
| `src/app/api/knowledge/route.ts` | auditKnowledgeContent pre-write gate |
| `src/app/api/pengaturan/agent-guard/route.ts` | PATCH with ACTION_TYPES membership validation |
| `src/app/(dashboard)/pengaturan/components/AgentGuardSettings.tsx` | Read-only toggle, per-action switches |
| `prisma/schema.prisma` | readOnlyMode Boolean, allowedActions String fields |

Full diff: `git diff main` from the repository root.

</details>
