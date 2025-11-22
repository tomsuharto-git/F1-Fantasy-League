#!/usr/bin/env python3

import os
import sys
import json
from pathlib import Path


def read_file(path: Path) -> str:
    if path.is_file():
        return path.read_text()
    else:
        # Match bash helper behavior: print a "(missing: ...)" marker
        return f"(missing: {path})\n"


def main() -> int:
    claude_project_dir = os.environ.get("CLAUDE_PROJECT_DIR", "")
    base_dir = Path(claude_project_dir)

    # Determine project type and TDD mode (defaults)
    config_file = base_dir / ".meridian" / "config.yaml"
    project_type = "standard"
    tdd_mode = "false"

    if config_file.is_file():
        try:
            for line in config_file.read_text().splitlines():
                stripped = line.lstrip()
                if stripped.startswith("project_type:"):
                    pt_value = stripped.split(":", 1)[1].strip().lower()
                    if pt_value in {"hackathon", "standard", "production"}:
                        project_type = pt_value
                    else:
                        project_type = "standard"
                elif stripped.startswith("tdd_mode:"):
                    tdd_value = stripped.split(":", 1)[1].strip().lower()
                    if tdd_value in {"true", "yes", "on", "1"}:
                        tdd_mode = "true"
                    else:
                        tdd_mode = "false"
        except Exception:
            # On parse error, keep defaults
            project_type = "standard"
            tdd_mode = "false"

    # Build CODE_GUIDE_FILES snippet for insertion into the markdown
    code_guide_files = f"- `{claude_project_dir}/.meridian/CODE_GUIDE.md`"

    if project_type == "hackathon":
        code_guide_files += (
            f"\n- `{claude_project_dir}/.meridian/CODE_GUIDE_ADDON_HACKATHON.md`"
        )
    elif project_type == "production":
        code_guide_files += (
            f"\n- `{claude_project_dir}/.meridian/CODE_GUIDE_ADDON_PRODUCTION.md`"
        )

    if tdd_mode == "true":
        code_guide_files += (
            f"\n- `{claude_project_dir}/.meridian/CODE_GUIDE_ADDON_TDD.md`"
        )

    # Load session reload template
    reload_template_path = (
        base_dir / ".claude" / "hooks" / "prompts" / "session-reload.md"
    )
    reload_context = read_file(reload_template_path)

    # Expand $CLAUDE_PROJECT_DIR placeholders
    reload_context = reload_context.replace("$CLAUDE_PROJECT_DIR", claude_project_dir)

    # Inject the CODE_GUIDE_FILES block
    reload_context = reload_context.replace("{{CODE_GUIDE_FILES}}", code_guide_files)

    additional_context = (
        f"<reload_context_system_message>{reload_context}"
        f"</reload_context_system_message>"
    )

    # payload = {
    #     "systemMessage": (
    #         "[Meridian] Session restored. Key project files were reloaded so Claude can "
    #         "continue work without losing context. If you see any errors during this process, "
    #         "don't worry, they are intentional."
    #     ),
    #     "hookSpecificOutput": {
    #         "hookEventName": "SessionStart",
    #         "additionalContext": additional_context,
    #     },
    #     "suppressOutput": True,
    # }

    # print(json.dumps(payload, indent=2, ensure_ascii=False))

    print(additional_context, end="")

    # Create flag to force Claude to review context on next tool use
    needs_context_review = base_dir / ".meridian" / ".needs-context-review"
    try:
        needs_context_review.parent.mkdir(parents=True, exist_ok=True)
        needs_context_review.touch(exist_ok=True)
    except Exception:
        # Ignore errors to match bash behavior (no explicit error handling)
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
