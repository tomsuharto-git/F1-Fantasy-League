#!/usr/bin/env python3
import json
import sys
import os

input_data = json.load(sys.stdin)

flag_path = os.path.join(
    os.environ.get("CLAUDE_PROJECT_DIR", ""),
    ".meridian/.needs-context-review"
)

if os.path.exists(flag_path):
    os.remove(flag_path)

    output = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                "[SYSTEM]: You were recently given a system message instructing you to review important "
                "files and documentation. This hook exists as a guardrail to ensure you complete that review "
                "before performing any tool actions.\n\n"
                "If you triggered this hook *while already reviewing that system message* — that's okay. "
                "You did everything correctly. We're sorry for the interruption; this guardrail can "
                "occasionally activate while you are doing exactly what you should.\n\n"
                "Please continue reviewing the files listed in the system message and disregard this warning. "
                "The guardrail has now been cleared, and you will not see this warning again during this review cycle.\n\n"
                "After you finish reviewing the required files, you may automatically resume your work—"
                "no user confirmation is needed."
            ),
            "systemMessage": "[Meridian] Hold on, Claude is reviewing the restored project context to avoid missing information. Tools will be available in a moment."
        }
    }
    print(json.dumps(output))
else:
    sys.exit(0)
