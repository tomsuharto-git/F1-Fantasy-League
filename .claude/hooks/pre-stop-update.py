#!/usr/bin/env python3
import json
import sys
import os

# Read hook input
input_data = json.load(sys.stdin)

# Check if we already ran this hook
if input_data.get("stop_hook_active"):
    # Already prompted Claude once, let it stop
    sys.exit(0)

# Resolve CLAUDE_PROJECT_DIR from environment (fallback to literal if missing)
claude_project_dir = os.environ.get("CLAUDE_PROJECT_DIR", "<project_root_dir>")

# First stop - ask Claude to save context and ensure a clean tree
output = {
    "decision": "block",
    "reason": (
        "[SYSTEM]: Before stopping, check whether you need to update "
        f"`{claude_project_dir}/.meridian/task-backlog.yaml`, "
        f"`{claude_project_dir}/.meridian/tasks/TASK-###/{{TASK-###.yaml,TASK-###-plan.md,TASK-###-context.md}}` "
        "(for the current task), "
        f"or `{claude_project_dir}/.meridian/memory.jsonl` using the `memory-curator` skill, as well as any other "
        "documents that should reflect what you accomplished during this session. If nothing significant happened, you may skip "
        "the update. If you were working on a task, update the status, session progress and next steps in "
        f"`{claude_project_dir}/.meridian/tasks/TASK-###/TASK-###.yaml` with details such as: the current implementation "
        "step, key decisions made, issues discovered, complex problems solved, and any other important information from this "
        "session. Save information that would be difficult to rediscover in future sessions.\n\n"
        "If you consider the current work \"finished\" or close to completion, you MUST ensure the codebase is clean before "
        "stopping: run the project's tests, lint, and build commands. If any of these fail, you must fix the issues and rerun "
        "them until they pass before stopping. If they already passed recently and no further changes were made, you may state "
        "that they are already clean and stop.\n\n"
        "If you have nothing to update, your response to this hook must be exactly the same as the message that was blocked."
        "If you did update something, resend the same message you sent before you were interrupted by this hook. "
        "Before marking a task as complete, review the 'Definition of Done' section in "
        f"`{claude_project_dir}/.meridian/prompts/agent-operating-manual.md`."
    ),
    "systemMessage": "[Meridian] Before stopping, Claude is updating task files, backlog, and memory and verifying tests/lint/build so nothing is left incomplete."
}

print(json.dumps(output))
sys.exit(0)
