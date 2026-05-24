# Polyglot guard scripts with TypeScript bridge and declarative policies (v3)

The agent guard system expands from TypeScript-only into a polyglot architecture: Python handles input scanning and knowledge auditing, shell scripts handle output validation and file security scanning, and a TypeScript bridge (`runner.ts`) invokes these via `execSync` with automatic fallback to existing TS implementations. Both issues from v2 are resolved: `runGuardOutput` now passes `blocked_output_patterns` and `system_prompt_hash` as a JSON payload via stdin (parsed by the shell script's python3 block), and all text flows exclusively through stdin — no positional arguments carry content, eliminating the `ARG_MAX` constraint entirely.

**Watch for:** No blocking concerns remain.

**Verdict**: APPROVED

## High-level view

The feature parity gap between shell and TypeScript output validation is closed. `validate-output.sh` receives a JSON object with `output`, `blocked_output_patterns`, and `system_prompt_hash` keys; its python3 block applies custom patterns and checks for hash presence. An admin who configures blocked output patterns gets identical enforcement whether the polyglot path succeeds or the TypeScript fallback runs.

The data pipeline is fully stdin-based. The shell script reads via `cat`, attempts JSON parse, and if the payload contains an "output" key it routes to structured validation with all parameters. Plain text input (no JSON or missing "output" key) falls back to default behavior — preserving backward compatibility for standalone CLI use.

<details>
<summary>Issues (0)</summary>

No actionable issues remain. All concerns from v1 (6 issues) and v2 (2 issues) have been addressed.

</details>

<details>
<summary>Details</summary>

## Output validator JSON protocol verification

The bridge sends the structured payload:

```typescript
const payload = JSON.stringify({
  output,
  blocked_output_patterns: blockedOutputPatterns,
  system_prompt_hash: systemPromptHash,
});
const result = execSync(`bash "${VALIDATE_OUTPUT_SCRIPT}"`, {
  input: payload,
  ...
});
```

The shell script's main path reads stdin, parses JSON, and routes on the presence of an "output" key:

```bash
printf '%s' "$input_text" | python3 -c '
...
obj = json.loads(raw)
if isinstance(obj, dict) and "output" in obj:
    payload = {
        "text": obj["output"],
        "redaction": redaction,
        "blocked_output_patterns": obj.get("blocked_output_patterns", []),
        "system_prompt_hash": obj.get("system_prompt_hash")
    }
...
' | validate_output_json
```

The `validate_output_json` function iterates `blocked_output_patterns` with `re.escape(bp)` and checks `system_prompt_hash in text`, closing the v2 asymmetry.

## stdin-only data flow

The data path for the bridge integration:

```
runner.ts → execSync(stdin: JSON) → bash validate-output.sh
  → input_text=$(cat)                   # read from stdin
  → printf '%s' "$input_text" | python3 -c '...'   # pipe to python3
    → validate_output_json (reads from stdin via json.load)
```

No content appears as a positional argument in the bridge path. The `--input` flag (standalone CLI) still receives text as `$2` but pipes it to python3 internally — not used by the TypeScript bridge.

</details>

<details>
<summary>File map</summary>

| File | Change |
|:-----|:-------|
| `scripts/guard/scan-input.py` | Python input sanitizer with stdin JSON interface and self-tests |
| `scripts/guard/audit-knowledge.py` | Python knowledge auditor with injection/zero-width detection |
| `scripts/guard/scan-skill.sh` | Shell file scanner using SCAN_TARGET env var, python3 JSON output |
| `scripts/guard/validate-output.sh` | Shell output validator: JSON stdin protocol with custom patterns and prompt hash |
| `scripts/guard/policies/*.yml` | Human-readable policy specs with sync-note headers |
| `src/lib/agent-guard/runner.ts` | TypeScript bridge: execSync with timeout: 5000, JSON stdin for all data |
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
