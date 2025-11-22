#!/usr/bin/env python3

import os
import sys
from pathlib import Path


def read_file(path: Path) -> str:
    if path.is_file():
        return path.read_text()
    else:
        return f"(missing: {path})\n"


def main() -> int:
    claude_project_dir = os.environ.get("CLAUDE_PROJECT_DIR", "")
    base_dir = Path(claude_project_dir)

    # Determine project type from config (default: standard)
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
            # If config parsing fails, just keep defaults
            project_type = "standard"
            tdd_mode = "false"

    # Build the CODE_GUIDE bullet list based on project type + TDD
    code_guide_bullets = (
        f"   - `{claude_project_dir}/.meridian/CODE_GUIDE.md`"
    )

    if project_type == "hackathon":
        code_guide_bullets += (
            f"\n   - `{claude_project_dir}/.meridian/CODE_GUIDE_ADDON_HACKATHON.md`"
        )
    elif project_type == "production":
        code_guide_bullets += (
            f"\n   - `{claude_project_dir}/.meridian/CODE_GUIDE_ADDON_PRODUCTION.md`"
        )

    if tdd_mode == "true":
        code_guide_bullets += (
            f"\n   - `{claude_project_dir}/.meridian/CODE_GUIDE_ADDON_TDD.md`"
        )

    # Load agent prompt and context
    prompt_path = base_dir / ".meridian" / "prompts" / "agent-operating-manual.md"
    prompt_content = read_file(prompt_path)

    if not prompt_content.endswith("\n"):
        prompt_content += "\n"

    # Build comprehensive context
    output = f"""{prompt_content}[SYSTEM]:

NEXT STEPS:
1. Read the following files before starting your work:
{code_guide_bullets}
   - `{claude_project_dir}/.meridian/memory.jsonl`
   - `{claude_project_dir}/.meridian/task-backlog.yaml`

2. Read all additional relevant documents listed in `{claude_project_dir}/.meridian/relevant-docs.md`.

3. Review all uncompleted tasks in `{claude_project_dir}/.meridian/tasks/` — you MUST read ALL files within each task folder.

4. Ask the user what they would like to work on.

IMPORTANT:
Claude must always complete all steps listed in this system message before doing anything else. Even if the user sends any message after this system message, Claude must first perform everything described above and only then handle the user's request.
"""

    print(output, end="")

    # Create flag to force Claude to review context on next tool use
    needs_context_review = base_dir / ".meridian" / ".needs-context-review"
    try:
        needs_context_review.parent.mkdir(parents=True, exist_ok=True)
        needs_context_review.touch(exist_ok=True)
    except Exception:
        # If this fails we still exit 0, same as bash not checking touch result
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
