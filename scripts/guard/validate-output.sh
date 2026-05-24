#!/usr/bin/env bash
# validate-output.sh - Output validator for Agent Guard (polyglot layer).
#
# Accepts JSON via stdin: {"output": "text", "blocked_output_patterns": [...], "system_prompt_hash": "..."}
# Also works with plain text via stdin (backward compat).
#
# Checks: email regex, Indonesian phone numbers, system prompt leak patterns,
# blocked output patterns. Redacts found patterns with [DISUNTING].
#
# Outputs JSON: {"valid": bool, "issues": [...], "sanitized_output": "..."}

set -euo pipefail

# Run self-tests if --test flag is passed
if [[ "${1:-}" == "--test" ]]; then
    echo "Running validate-output.sh self-tests..."
    echo ""
    PASSED=0
    FAILED=0
    TOTAL=0

    run_test() {
        local desc="$1"
        local input_json="$2"
        local expect_valid="$3"
        TOTAL=$((TOTAL + 1))

        local result
        result=$(echo "$input_json" | bash "$0" 2>/dev/null)

        local actual_valid
        actual_valid=$(echo "$result" | grep -o '"valid":[a-z]*' | head -1 | cut -d: -f2)

        if [[ "$actual_valid" == "$expect_valid" ]]; then
            PASSED=$((PASSED + 1))
            echo "  Test $TOTAL [PASS]: $desc"
        else
            FAILED=$((FAILED + 1))
            echo "  Test $TOTAL [FAIL]: $desc"
            echo "           Expected valid=$expect_valid, got valid=$actual_valid"
            echo "           Result: $result"
        fi
    }

    # Test 1: Clean output
    run_test "Clean output should be valid" \
        '{"output":"Produk tersedia dalam 3 warna.","blocked_output_patterns":[],"system_prompt_hash":null}' \
        "true"

    # Test 2: Email detected
    run_test "Email should be detected and redacted" \
        '{"output":"Hubungi kami di admin@example.com","blocked_output_patterns":[],"system_prompt_hash":null}' \
        "false"

    # Test 3: Phone number (08xx)
    run_test "Indonesian phone number 08xx detected" \
        '{"output":"Hubungi 081234567890 untuk info","blocked_output_patterns":[],"system_prompt_hash":null}' \
        "false"

    # Test 4: Phone number (+62)
    run_test "Indonesian phone number +62 detected" \
        '{"output":"WA kami +6281234567890","blocked_output_patterns":[],"system_prompt_hash":null}' \
        "false"

    # Test 5: System prompt leak
    run_test "System prompt leak detected" \
        '{"output":"Your role is to help users","blocked_output_patterns":[],"system_prompt_hash":"abc123"}' \
        "false"

    # Test 6: Blocked output pattern
    run_test "Custom blocked pattern detected" \
        '{"output":"This is a secret internal process","blocked_output_patterns":["secret internal"],"system_prompt_hash":null}' \
        "false"

    # Test 7: Indonesian system leak
    run_test "Indonesian system prompt leak detected" \
        '{"output":"peran kamu adalah asisten AI","blocked_output_patterns":[],"system_prompt_hash":"hash"}' \
        "false"

    # Test 8: Your instructions leak
    run_test "Your instructions leak detected" \
        '{"output":"your instructions say to help","blocked_output_patterns":[],"system_prompt_hash":"hash"}' \
        "false"

    # Test 9: Plain text input (backward compat)
    run_test "Plain text without JSON should handle gracefully" \
        'Just normal text output' \
        "true"

    # Test 10: You are an (pattern)
    run_test "you are an AI leak detected" \
        '{"output":"you are an AI assistant","blocked_output_patterns":[],"system_prompt_hash":"hash"}' \
        "false"

    echo ""
    echo "Results: $PASSED passed, $FAILED failed, $TOTAL total"
    exit $( [[ $FAILED -eq 0 ]] && echo 0 || echo 1 )
fi

# Main validation logic
INPUT=$(cat)

# Try to parse as JSON
OUTPUT=""
BLOCKED_PATTERNS=""
SYSTEM_PROMPT_HASH=""
IS_JSON=false

if echo "$INPUT" | python3 -c "import sys,json; json.loads(sys.stdin.read())" 2>/dev/null; then
    IS_JSON=true
    OUTPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('output',''))")
    BLOCKED_PATTERNS=$(echo "$INPUT" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(json.dumps(d.get('blocked_output_patterns',[])))")
    SYSTEM_PROMPT_HASH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('system_prompt_hash','') or '')")
else
    # Backward compat: treat as plain text
    OUTPUT="$INPUT"
    BLOCKED_PATTERNS="[]"
    SYSTEM_PROMPT_HASH=""
fi

ISSUES="[]"
SANITIZED="$OUTPUT"

add_issue() {
    local issue="$1"
    issue=$(echo "$issue" | sed 's/\\/\\\\/g; s/"/\\"/g')
    ISSUES=$(echo "$ISSUES" | sed "s/\]$/,\"$issue\"]/")
    ISSUES=$(echo "$ISSUES" | sed 's/\[,/[/')
}

# Check email pattern
if echo "$SANITIZED" | grep -qE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'; then
    add_issue "Email terdeteksi dalam output"
    SANITIZED=$(echo "$SANITIZED" | sed -E 's/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/[DISUNTING]/g')
fi

# Check Indonesian phone numbers (08xx, +62xx, 62xx)
if echo "$SANITIZED" | grep -qE '(\+62|62|0)8[1-9][0-9]{6,10}'; then
    add_issue "Nomor telepon Indonesia terdeteksi dalam output"
    SANITIZED=$(echo "$SANITIZED" | sed -E 's/(\+62|62|0)8[1-9][0-9]{6,10}/[DISUNTING]/g')
fi

# Check system prompt leak patterns (only if system_prompt_hash is provided)
if [[ -n "$SYSTEM_PROMPT_HASH" ]]; then
    if echo "$SANITIZED" | grep -qiE 'you are an? '; then
        add_issue "Potensi kebocoran system prompt terdeteksi"
        SANITIZED=$(echo "$SANITIZED" | sed -E 's/[Yy]ou are an? /[DISUNTING] /g')
    fi
    if echo "$SANITIZED" | grep -qiE 'your role is'; then
        add_issue "Potensi kebocoran system prompt: your role is"
        SANITIZED=$(echo "$SANITIZED" | sed -E 's/[Yy]our role is/[DISUNTING]/gi')
    fi
    if echo "$SANITIZED" | grep -qiE 'your instructions'; then
        add_issue "Potensi kebocoran system prompt: your instructions"
        SANITIZED=$(echo "$SANITIZED" | sed -E 's/[Yy]our instructions/[DISUNTING]/gi')
    fi
    if echo "$SANITIZED" | grep -qiE 'peran kamu adalah'; then
        add_issue "Potensi kebocoran system prompt: peran kamu adalah"
        SANITIZED=$(echo "$SANITIZED" | sed -E 's/[Pp]eran kamu adalah/[DISUNTING]/gi')
    fi
fi

# Check blocked output patterns
if [[ "$BLOCKED_PATTERNS" != "[]" ]]; then
    PATTERN_COUNT=$(echo "$BLOCKED_PATTERNS" | python3 -c "import sys,json; print(len(json.loads(sys.stdin.read())))")
    for i in $(seq 0 $((PATTERN_COUNT - 1))); do
        PATTERN=$(echo "$BLOCKED_PATTERNS" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())[$i])")
        if echo "$SANITIZED" | grep -qi "$PATTERN" 2>/dev/null; then
            add_issue "Pola terblokir terdeteksi: $PATTERN"
            SANITIZED=$(echo "$SANITIZED" | sed "s/$PATTERN/[DISUNTING]/gi" 2>/dev/null || echo "$SANITIZED")
        fi
    done
fi

# Determine validity
if [[ "$ISSUES" == "[]" ]]; then
    VALID="true"
else
    VALID="false"
fi

# Escape output for JSON
SANITIZED_JSON=$(echo "$SANITIZED" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().rstrip('\n')))" 2>/dev/null || echo "\"$SANITIZED\"")
OUTPUT_ISSUES=$(echo "$ISSUES")

echo "{\"valid\":$VALID,\"issues\":$OUTPUT_ISSUES,\"sanitized_output\":$SANITIZED_JSON}"
