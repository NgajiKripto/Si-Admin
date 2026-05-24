#!/bin/bash
# Output validator for Agent Guard
# Checks output text for PII leaks, system prompt leaks, and blocked patterns.
#
# Usage:
#   echo "output text" | bash validate-output.sh
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

Output:
  JSON object with fields:
    valid             - boolean indicating if output is clean
    issues            - array of issue description strings
    sanitized_output  - output with problematic content redacted

Examples:
  echo "Hello customer" | validate-output.sh
  validate-output.sh --input "Your email is user@example.com"
EOF
}

# Validate output text and produce JSON using python3 for safe serialization
validate_output() {
    local text="$1"

    # Use python3 for all validation and JSON output to handle special characters safely
    python3 -c '
import json, re, sys

text = sys.argv[1]
redaction = sys.argv[2]

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

valid = len(issues) == 0

result = {
    "valid": valid,
    "issues": issues,
    "sanitized_output": sanitized
}
print(json.dumps(result, ensure_ascii=False))
' "$text" "$REDACTION"
}

# Run self-tests
run_tests() {
    local passed=0
    local failed=0

    # Test 1: Clean output passes
    result=$(validate_output "Terima kasih atas pertanyaan Anda tentang produk kami.")
    if echo "$result" | grep -q '"valid": true'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Clean output should be valid"
    fi

    # Test 2: Email detected
    result=$(validate_output "Hubungi kami di admin@company.com untuk info lebih lanjut.")
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
    result=$(validate_output "Hubungi 081234567890 untuk bantuan.")
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect phone number 08xx"
    fi

    # Test 4: Phone number detected (+62 format)
    result=$(validate_output "WA: +6281234567890")
    if echo "$result" | grep -q 'Nomor telepon terdeteksi'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect phone +62 format"
    fi

    # Test 5: System prompt leak - "you are an AI"
    result=$(validate_output "As you are an AI, I cannot help with that.")
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect 'you are an AI'"
    fi

    # Test 6: System prompt leak - "instruksi sistem"
    result=$(validate_output "Berdasarkan instruksi sistem yang saya terima.")
    if echo "$result" | grep -q 'kebocoran system prompt'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect 'instruksi sistem'"
    fi

    # Test 7: System prompt leak - "saya adalah AI"
    result=$(validate_output "Maaf, saya adalah AI dan tidak bisa melakukan itu.")
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect 'saya adalah AI'"
    fi

    # Test 8: Redaction in sanitized output
    result=$(validate_output "Email: test@example.com")
    if echo "$result" | grep -q "$REDACTION"; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should redact email in sanitized output"
    fi

    # Test 9: Multiple issues
    result=$(validate_output "Email admin@test.com, call 081234567890, you are an AI")
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect multiple issues"
    fi

    # Test 10: Your role is pattern
    result=$(validate_output "Remember, your role is to be helpful")
    if echo "$result" | grep -q '"valid": false'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should detect 'your role is'"
    fi

    # Test 11: Multiline content with special characters
    result=$(validate_output 'Line 1 with "quotes" and
Line 2 with backslash \ and $pecial chars')
    if echo "$result" | python3 -c 'import json,sys; json.loads(sys.stdin.read()); print("valid_json")' 2>/dev/null | grep -q 'valid_json'; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
        echo "  FAIL: Should produce valid JSON for special characters"
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
        validate_output "$2"
        ;;
    *)
        # Read from stdin
        input_text=$(cat)
        if [ -z "$input_text" ]; then
            echo "Error: No input provided. Use --help for usage." >&2
            exit 2
        fi
        validate_output "$input_text"
        ;;
esac
