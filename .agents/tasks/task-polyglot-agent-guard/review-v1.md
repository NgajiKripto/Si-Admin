# Polyglot guard scripts with TypeScript bridge and declarative policies

The agent guard system expands from a TypeScript-only implementation into a polyglot architecture: Python scripts handle input scanning and knowledge auditing, shell scripts handle output validation and file security scanning, and a TypeScript bridge (`runner.ts`) invokes these via `child_process.execSync` with automatic fallback to the existing TS implementations. Declarative YAML policy files define blocked patterns, allowed topics, action permissions, and output rules. The change also carries forward (from a prior task) the action-permissions module, knowledge-auditor, and associated API/UI work.

**Watch for:** The `runSkillScan` function in `runner.ts` passes a user-provided `filePath` directly into a shell command without sanitization, creating a command injection vector (confirmed). The shell scripts construct JSON by string concatenation with `sed`, which will produce malformed JSON on any input containing double quotes, backslashes, or newlines (confirmed). The YAML policy files are not loaded by any code in this diff — they exist as documentation only, creating a drift risk between the actual patterns in code and the declared policies (confirmed).

## High-level view

The TypeScript bridge (`runner.ts`) uses synchronous `execSync` calls on the request path, blocking the Node.js event loop for the duration of each Python/shell invocation. If a script fails the existing TypeScript implementation handles the request — but a slow or hanging process will stall the entire server indefinitely because no explicit `execSync` timeout is set.

The shell scripts build JSON output using raw `sed` substitution against untrusted content. The `validate-output.sh` script escapes backslashes and double-quotes in sanitized output, but does not handle literal newlines reliably, and handles its JSON array construction with fragile `sed 's/\]$//'` patterns that break if a previous array element contains `]`. The Python scripts avoid this by using stdlib `json.dumps` for output serialization.

The YAML policy files provide a declarative specification of the guard's rules but are not consumed by any runtime code. The actual patterns live hardcoded in the Python scripts, the TypeScript modules, and the shell scripts independently — three sources of truth for what should be one policy set.

The `scan-skill.sh` scanner's `$()` detection will false-positive on any shell script or Markdown code block demonstrating command substitution — which is likely in a knowledge base about software.

<details>
<summary>Issues (6)</summary>

1. **Command injection in `runSkillScan`** — `filePath` is interpolated into a shell command with only double-quote wrapping. A filename containing `$(...)` or backticks inside double quotes still executes. Validate or escape the path, or pass it via stdin/environment variable instead of as a shell argument.
2. **Shell JSON construction breaks on quotes/newlines** — `validate-output.sh` and `scan-skill.sh` build JSON by string concatenation. Any output containing `"`, `\`, or literal newlines will produce invalid JSON that `JSON.parse` in the bridge will reject, triggering a fallback (output validator) or returning null (skill scan). Use a proper JSON encoder (e.g., `jq` or `python3 -c 'import json...'`) for the output stage.
3. **No `execSync` timeout** — All four `execSync` calls in `runner.ts` use the default timeout (infinite). A hung Python or bash process blocks the Node event loop indefinitely. Set an explicit `timeout` (e.g., 5000ms) and handle the `ETIMEDOUT` error in the catch block.
4. **YAML policies are dead code** — The four YAML files under `scripts/guard/policies/` are not loaded by any script or TypeScript module. Patterns are hardcoded in each language implementation independently. Either load the YAML at runtime or document them explicitly as human-readable specifications that must be manually synced.
5. **`validate-output.sh` doesn't escape newlines in JSON strings** — The `sed ':a;N;$!ba;s/\n/\\n/g'` at the end of `validate_output` converts newlines to literal `\n` in the final `echo`, but the intermediate `sanitized` variable is built by multiple `sed` calls that don't preserve multiline content correctly through the `grep -q` checks, which consume stdin or expect single-line pipe output.
6. **`scan-skill.sh` false-positives on code documentation** — The `\$\(` pattern triggers on any file containing Markdown code fences showing shell examples, which is common in knowledge bases. Consider only flagging if the file has an executable extension or shebang, or require multiple threat signals before marking unsafe.

</details>

<details>
<summary>Details</summary>

## Command injection via `runSkillScan`

In `runner.ts`:

```typescript
const result = execSync(`bash "${SCAN_SKILL_SCRIPT}" "${filePath}"`, {
  encoding: "utf-8",
  stdio: ["pipe", "pipe", "pipe"],
});
```

Double-quoting prevents word splitting and glob expansion, but does not prevent command substitution within double quotes. A `filePath` of `$(rm -rf /)` would execute inside the quotes. The other three runner functions pass data via stdin (the `input` option), which is the correct pattern. `runSkillScan` should pass the file path via an environment variable (`env: { SCAN_TARGET: filePath }`) and read `$SCAN_TARGET` in the shell script, or pipe it via stdin.

## Shell scripts produce malformed JSON on real-world input

`validate-output.sh` builds its JSON output with:

```bash
sanitized=$(echo "$sanitized" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
echo "{\"valid\": $valid, \"issues\": $issues, \"sanitized_output\": \"$sanitized\"}"
```

The intermediate issue-array construction uses `sed 's/\]$//'` to strip a trailing bracket and append a new element — if any previously-appended issue string contains a literal `]` character, the sed will strip the wrong bracket. The `grep -qEi` calls use `echo "$sanitized" | grep`, which fails on values starting with `-` (interpreted as grep flags) and may split multiline content.

`scan-skill.sh` has the same JSON construction pattern for its findings array and is similarly fragile when the cumulative `findings` string manipulation encounters bracket characters.

The fallback behavior masks this in practice: when `JSON.parse` throws, the TS bridge catches it and falls back. This means the polyglot path silently degrades to the TypeScript path on any non-trivial input, making the shell scripts effectively dead code for real workloads containing special characters.

## Blocking `execSync` without timeout

```typescript
const result = execSync(`python3 "${SCAN_INPUT_SCRIPT}"`, {
  input: payload,
  encoding: "utf-8",
  stdio: ["pipe", "pipe", "pipe"],
});
```

No `timeout` option is set. If `python3` hangs (broken pipe, infinite loop on pathological input), the Node.js event loop is blocked indefinitely. Since this runs in a Next.js API route, a single hung request freezes the entire server process. Adding `timeout: 5000` ensures the call throws after 5 seconds, which the existing catch block handles gracefully by falling back to TypeScript.

## YAML policy files have no runtime consumer

The four files under `scripts/guard/policies/` define the canonical set of blocked patterns, allowed topics, action permissions, and output rules. But:

- `scan-input.py` hardcodes `BUILTIN_PATTERNS` and `DELIMITER_PATTERNS` directly.
- `audit-knowledge.py` hardcodes `INJECTION_PATTERNS` directly.
- `validate-output.sh` hardcodes PII regexes and system-prompt-leak patterns directly.
- The TypeScript modules (`input-sanitizer.ts`, `knowledge-auditor.ts`, `output-validator.ts`) hardcode their own copies.

Any update to the policy YAML will have no effect unless someone manually propagates the change to all three language implementations. The files will inevitably drift from the actual code.

## `scan-skill.sh` over-triggers on documentation content

The scanner flags any occurrence of `$(` as shell injection:

```bash
if echo "$line" | grep -qE '\$\(' 2>/dev/null; then
```

A Markdown file teaching bash usage, a README with installation instructions, or a knowledge entry documenting environment setup will all trigger this. The scanner has no allowlist for file types or context. Consider checking for a shebang or executable permission as a precondition, or requiring at least two distinct threat categories before marking a file unsafe.

</details>

<details>
<summary>File map</summary>

| File | Change |
|:-----|:-------|
| `scripts/guard/scan-input.py` | Python port of input sanitizer with built-in self-tests |
| `scripts/guard/audit-knowledge.py` | Python port of knowledge auditor with injection detection |
| `scripts/guard/scan-skill.sh` | Shell security scanner for files (injection, exfil, traversal, obfuscation) |
| `scripts/guard/validate-output.sh` | Shell output validator (PII redaction, system prompt leak detection) |
| `scripts/guard/policies/blocked-patterns.yml` | Declarative blocked pattern definitions |
| `scripts/guard/policies/allowed-topics.yml` | Declarative allowed topic keyword lists |
| `scripts/guard/policies/action-permissions.yml` | Declarative action permission defaults |
| `scripts/guard/policies/output-rules.yml` | Declarative output validation rules |
| `src/lib/agent-guard/runner.ts` | TypeScript bridge invoking scripts via execSync with TS fallback |
| `src/lib/agent-guard/index.ts` | Re-exports runner functions and polyglot availability check |
| `src/lib/agent-guard/action-permissions.ts` | ActionType enum, `isActionAllowed` utility |
| `src/lib/agent-guard/knowledge-auditor.ts` | TS knowledge content auditor |
| `src/lib/agent-guard/input-sanitizer.ts` | TS input sanitizer with zero-width detection |
| `src/app/api/knowledge/route.ts` | Integrated `auditKnowledgeContent` as pre-write gate |
| `src/app/api/pengaturan/agent-guard/route.ts` | PATCH validates readOnlyMode, allowedActions with ACTION_TYPES membership |
| `src/app/(dashboard)/pengaturan/components/AgentGuardSettings.tsx` | Read-only mode toggle, per-action permission switches |
| `src/lib/agent-guard/example-usage.ts` | Reference examples for guard integration |
| `prisma/schema.prisma` | Added `readOnlyMode` and `allowedActions` fields |
| `README.md` | Polyglot architecture documentation section |

Full diff: `git diff main` from the repository root.

</details>
