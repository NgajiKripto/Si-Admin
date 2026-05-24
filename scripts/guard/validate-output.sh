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

# Validate output text
validate_output() {
    local text="$1"
    local issues="[]"
    local sanitized="$text"

    # Check for email patterns
    if echo "$sanitized" | grep -qEi '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'; then
        issues=$(echo "$issues" | sed 's/\]$//')
        if [ "$issues" != "[" ]; then
            issues="${issues},"
        fi
        issues="${issues}\"Email terdeteksi dalam output\"]"
        sanitized=$(echo "$sanitized" | sed -E 's/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/'"$REDACTION"'/g')
    fi

    # Check for Indonesian phone patterns (08xx, +62xx, 62xx)
    if echo "$sanitized" | grep -qE '(\+62|62|0)8[1-9][0-9]{6,10}'; then
        issues=$(echo "$issues" | sed 's/\]$//')
        if [ "$issues" != "[" ]; then
            issues="${issues},"
        fi
        issues="${issues}\"Nomor telepon terdeteksi dalam output\"]"
        sanitized=$(echo "$sanitized" | sed -E 's/(\+62|62|0)8[1-9][0-9]{6,10}/'"$REDACTION"'/g')
    fi

    # Check for system prompt leak patterns
    local prompt_leaked=false
    if echo "$sanitized" | grep -qEi 'you are an AI|you are an? assistant'; then
        prompt_leaked=true
    fi
    if echo "$sanitized" | grep -qEi 'your role is'; then
        prompt_leaked=true
    fi
    if echo "$sanitized" | grep -qEi 'instruksi sistem'; then
        prompt_leaked=true
    fi
    if echo "$sanitized" | grep -qEi 'system prompt'; then
        prompt_leaked=true
    fi
    if echo "$sanitized" | grep -qEi 'saya adalah AI'; then
        prompt_leaked=true
    fi

    if [ "$prompt_leaked" = true ]; then
        issues=$(echo "$issues" | sed 's/\]$//')
        if [ "$issues" != "[" ]; then
            issues="${issues},"
        fi
        issues="${issues}\"Potensi kebocoran system prompt terdeteksi\"]"
        sanitized=$(echo "$sanitized" | sed -E 's/[Yy]ou are an? (AI|assistant)/'"$REDACTION"'/g')
        sanitized=$(echo "$sanitized" | sed -E 's/[Yy]our role is/'"$REDACTION"'/g')
        sanitized=$(echo "$sanitized" | sed -E 's/[Ii]nstruksi [Ss]istem/'"$REDACTION"'/g')
        sanitized=$(echo "$sanitized" | sed -E 's/[Ss]ystem [Pp]rompt/'"$REDACTION"'/g')
        sanitized=$(echo "$sanitized" | sed -E 's/[Ss]aya adalah AI/'"$REDACTION"'/g')
    fi

    local valid="true"
    if [ "$issues" != "[]" ]; then
        valid="false"
    fi

    # Escape the sanitized output for JSON
    sanitized=$(echo "$sanitized" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

    echo "{\"valid\": $valid, \"issues\": $issues, \"sanitized_output\": \"$sanitized\"}"
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
