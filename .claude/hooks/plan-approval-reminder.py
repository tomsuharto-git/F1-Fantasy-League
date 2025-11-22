#!/usr/bin/env python3
import json
import sys
import os

# Read hook input
input_data = json.load(sys.stdin)

tool_name = input_data.get("tool_name", "")

# Read env variable
claude_project_dir = os.environ.get("CLAUDE_PROJECT_DIR", "")

if tool_name == "ExitPlanMode":
    # Inject reminder to Claude after exiting plan mode
    output = {
        "decision": "block",
        "reason": (
            f"[SYSTEM]: If the user has approved the plan, you must create a task in "
            f"`{claude_project_dir}/.meridian/task-backlog.yaml` and generate a task brief using "
            f"the `task-manager` skill. Do not create a task if it is only a small change or a bug fix. "
            f"Before creating any new task brief or adding an entry to task-backlog.yaml, you MUST use the "
            f"`task-manager` skill."
        ),
        "systemMessage": "[Meridian] Plan approved. Claude will now create a task folder, write the task brief, and update the backlog."
    }
    print(json.dumps(output))
else:
    # Allow other tools to proceed normally
    sys.exit(0)
