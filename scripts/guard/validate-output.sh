#!/bin/bash
# Output validator for Agent Guard
# Checks output text for PII leaks, system prompt leaks, and blocked patterns.
#
# Usage:
#   echo "output text" | bash validate-output.sh
#   echo '{"output":"text","blocked_output_patterns":["secret"],"system_prompt_hash":"abc"}' | bash validate-output.sh
#   bash validate-output.sh --input "text to validate"
#   bash validate-output.sh --help
#   bash validate-output.sh --test

set -e

REDACTION="[DISUNTING]"

# Print help message
show_help() {
    cat <<'EOF'
Usage: validate-output.sh [OPTIONS]

Output validator for Agent Guard. Checks for PII leaks, system prompt leaks,
and blocked output patterns.

Options:
  --help          Show this help message
  --test          Run built-in self-tests
  --input TEXT    Text to validate (alternative to stdin)

Input:
  Provide text via stdin or --input argument.
  Stdin accepts either plain text or a JSON object with fields:
    output                  - the text to validate
    blocked_output_patterns - optional array of custom blocked patterns
    system_prompt_hash      - optional hash for prompt leak detection

Output:
  JSON object with fields:
    valid             - boolean indicating if output is clean
    issues            - array of issue description strings
    sanitized_output  - output with problematic content redacted

Examples:
  echo "Hello customer" | validate-output.sh
  validate-output.sh --input "Your email is user@example.com"
  echo '{"output": "test", "blocked_output_patterns": ["secret"]}' | validate-output.sh
EOF
}

# Validate output text via python3, piping data through stdin
# Arguments: None. Reads a JSON payload from stdin with keys:
#   text, redaction, blocked_output_patterns (optional), system_prompt_hash (optional)
validate_output_json() {
    python3 -c '
import json, re, sys

payload = json.load(sys.stdin)
text = payload["text"]
redaction = payload["redaction"]
blocked_output_patterns = payload.get("blocked_output_patterns", [])
system_prompt_hash = payload.get("system_prompt_hash")

issues = []
sanitized = text

# Check for email patterns
email_re = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
if email_re.search(sanitized):
    issues.append("Email terdeteksi dalam output")
    sanitized = email_re.sub(redaction, sanitized)

# Check for Indonesian phone patterns (08xx, +62xx, 62xx)
phone_re = re.compile(r"(\+62|62|0)8[1-9][0-9]{6,10}")
if phone_re.search(sanitized):
    issues.append("Nomor telepon terdeteksi dalam output")
    sanitized = phone_re.sub(redaction, sanitized)

# Check for system prompt leak patterns
prompt_leaked = False
prompt_patterns = [
    (re.compile(r"you are an? (AI|assistant)", re.IGNORECASE), True),
    (re.compile(r"your role is", re.IGNORECASE), True),
    (re.compile(r"instruksi sistem", re.IGNORECASE), True),
    (re.compile(r"system prompt", re.IGNORECASE), True),
    (re.compile(r"saya adalah AI", re.IGNORECASE), True),
]

for pattern, _ in prompt_patterns:
    if pattern.search(sanitized):
        prompt_leaked = True

if prompt_leaked:
    issues.append("Potensi kebocoran system prompt terdeteksi")
    sanitized = re.sub(r"[Yy]ou are an? (AI|assistant)", redaction, sanitized)
    sanitized = re.sub(r"[Yy]our role is", redaction, sanitized)
    sanitized = re.sub(r"[Ii]nstruksi [Ss]istem", redaction, sanitized)
    sanitized = re.sub(r"[Ss]ystem [Pp]rompt", redaction, sanitized)
    sanitized = re.sub(r"[Ss]aya adalah AI", redaction, sanitized)

# Check custom blocked output patterns
for bp in blocked_output_patterns:
    if bp and re.search(re.escape(bp), sanitized, re.IGNORECASE):
        issues.append("Pola terblokir terdeteksi: " + bp)
        sanitized = re.sub(re.escape(bp), redaction, sanitized, flags=re.IGNORECASE)

# Check system prompt hash leak (if hash provided, look for it in output)
if system_prompt_hash and system_prompt_hash in text:
    issues.append("System prompt hash terdeteksi dalam output")

valid = len(issues) == 0

result = {
    "valid": valid,
    "issues": issues,
    "sanitized_output": sanitized
}
print(json.dumps(result, ensure_ascii=False))
'
}

# Run self-tests
run_tests() {
    local passed=0
    local failed=0

    # Test 1: Clean output passes
    result=$(echo '{"text": "Terima kasih atas pertanyaan Anda tentang produk kami.", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | grep -q '"valid": true'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Clean output should be valid"
    fi

    # Test 2: Email detected
    result=$(echo '{"text": "Hubungi kami di admin@company.com untuk info lebih lanjut.", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect email"
    fi
    if echo "$result" | grep -q 'Email terdeteksi'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should have email issue message"
    fi

    # Test 3: Phone number detected (08xx format)
    result=$(echo '{"text": "Hubungi 081234567890 untuk bantuan.", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect phone number 08xx"
    fi

    # Test 4: Phone number detected (+62 format)
    result=$(echo '{"text": "WA: +6281234567890", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | grep -q 'Nomor telepon terdeteksi'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect phone +62 format"
    fi

    # Test 5: System prompt leak - "you are an AI"
    result=$(echo '{"text": "As you are an AI, I cannot help with that.", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect 'you are an AI'"
    fi

    # Test 6: System prompt leak - "instruksi sistem"
    result=$(echo '{"text": "Berdasarkan instruksi sistem yang saya terima.", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | grep -q 'kebocoran system prompt'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect 'instruksi sistem'"
    fi

    # Test 7: System prompt leak - "saya adalah AI"
    result=$(echo '{"text": "Maaf, saya adalah AI dan tidak bisa melakukan itu.", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect 'saya adalah AI'"
    fi

    # Test 8: Redaction in sanitized output
    result=$(echo '{"text": "Email: test@example.com", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | grep -q "$REDACTION"; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should redact email in sanitized output"
    fi

    # Test 9: Multiple issues
    result=$(echo '{"text": "Email admin@test.com, call 081234567890, you are an AI", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect multiple issues"
    fi

    # Test 10: Your role is pattern
    result=$(echo '{"text": "Remember, your role is to be helpful", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect 'your role is'"
    fi

    # Test 11: Multiline content with special characters
    result=$(printf '{"text": "Line 1 with \\"quotes\\" and\\nLine 2 with backslash and special chars", "redaction": "[DISUNTING]"}' | validate_output_json)
    if echo "$result" | python3 -c 'import json,sys; json.loads(sys.stdin.read()); print("valid_json")' 2>/dev/null | grep -q 'valid_json'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should produce valid JSON for special characters"
    fi

    # Test 12: Custom blocked output patterns
    result=$(echo '{"text": "This contains secret pricing info", "redaction": "[DISUNTING]", "blocked_output_patterns": ["secret pricing"]}' | validate_output_json)
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect custom blocked pattern"
    fi
    if echo "$result" | grep -q 'Pola terblokir terdeteksi'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should have blocked pattern issue message"
    fi

    # Test 13: System prompt hash detection
    result=$(echo '{"text": "The hash is abc123def in this output", "redaction": "[DISUNTING]", "system_prompt_hash": "abc123def"}' | validate_output_json)
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect system prompt hash in output"
    fi
    if echo "$result" | grep -q 'System prompt hash terdeteksi'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should have hash leak issue message"
    fi

    # Test 14: Backward compatibility - plain text stdin
    result=$(echo "Terima kasih atas pertanyaan Anda" | bash "$0")
    if echo "$result" | grep -q '"valid": true'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Plain text stdin should work for backward compat"
    fi

    local total=$((passed + failed))
    echo ""
    echo "Results: $passed/$total tests passed"
    if [ $failed -eq 0 ]; then
        echo "PASS"
        exit 0
    else
        echo "FAIL"
        exit 1
    fi
}

# Main entry point
case "${1:-}" in
    --help)
        show_help
        exit 0
        ;;
    --test)
        run_tests
        ;;
    --input)
        if [ -z "${2:-}" ]; then
            echo "Error: --input requires a value" >&2
            exit 2
        fi
        # --input flag always treats argument as plain text, pipe via stdin to avoid ARG_MAX
        printf '%s' "$2" | python3 -c '
import json, sys
raw = sys.stdin.read()
payload = {"text": raw, "redaction": "'"$REDACTION"'"}
print(json.dumps(payload, ensure_ascii=False))
' | validate_output_json
        ;;
    *)
        # Read from stdin
        input_text=$(cat)
        if [ -z "$input_text" ]; then
            echo "Error: No input provided. Use --help for usage." >&2
            exit 2
        fi

        # Try to parse as JSON with "output" key (new structured format)
        # If it's a JSON object with "output" key, use structured mode
        # Otherwise, treat as plain text (backward compatibility)
        # All data piped via stdin to python3 to avoid ARG_MAX limits
        printf '%s' "$input_text" | python3 -c '
import json, sys

raw = sys.stdin.read()
redaction = "'"$REDACTION"'"
try:
    obj = json.loads(raw)
    if isinstance(obj, dict) and "output" in obj:
        # Structured JSON input - build payload for validate_output_json
        payload = {
            "text": obj["output"],
            "redaction": redaction,
            "blocked_output_patterns": obj.get("blocked_output_patterns", []),
            "system_prompt_hash": obj.get("system_prompt_hash")
        }
        print(json.dumps(payload, ensure_ascii=False))
    else:
        # JSON but not the expected structure, treat as plain text
        payload = {"text": raw, "redaction": redaction}
        print(json.dumps(payload, ensure_ascii=False))
except (json.JSONDecodeError, ValueError):
    # Not JSON, treat as plain text
    payload = {"text": raw, "redaction": redaction}
    print(json.dumps(payload, ensure_ascii=False))
' | validate_output_json
        ;;
esac
