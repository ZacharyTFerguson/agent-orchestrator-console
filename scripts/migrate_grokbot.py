#!/usr/bin/env python3
"""Post-download migration: skills, agents, rules, README."""
import os
import re
from pathlib import Path

ROOT = Path("/workspace")
ARCHIVE = ROOT / "grokbot-archive"
SKILLS_SRC = ARCHIVE / "Skills"
SKILLS_DST = ROOT / ".cursor" / "skills"
AGENTS_DST = ROOT / ".cursor" / "agents"
RULES_DST = ROOT / ".cursor" / "rules" / "grokbot-standing-rules.mdc"
PERSONALITIES = ARCHIVE / "Personalities"
STATUS = ARCHIVE / "Memory & rules" / "STATUS.md"

MIGRATION_NOTE = (
    "Migrated from GrokBot archive 2026-08-20. "
    "Original Grok agent IDs and /home/box paths preserved for reference.\n"
)

ALLOWLIST_OLD = "/home/box/agent-data/agents/79034e4c-c809-4e00-aefd-dd9ac8c00a28/pdi-active-allowlist.txt"
ALLOWLIST_REPO = "grokbot-archive/Memory & rules/pdi-active-allowlist.txt"

# 14 workflow skills: folder name -> Drive filename in Skills/
WORKFLOW_SKILLS = {
    "verify-i-j-formulas-after-writes": "verify-i-j-formulas-after-writes.md",
    "sort-fleet-by-unit-prefix": "sort-fleet-by-unit-prefix.md",
    "run-a-onestep-total-distance-report": "run-a-onestep-total-distance-report.md",
    "run-a-onestep-daily-operations-report": "run-a-onestep-daily-operations-report.md",
    "recover-from-chrome-aw-snap": "read-onestep-history-distance.md",  # wrong Drive filename
    "read-fuel-charging-details": "read-fuel-charging-details.md",
    "read-efleets-mileage-history": "read-efleets-mileage-history.md",
    "prescreen-inbound-email": "prescreen-inbound-email.md",
    "pick-current-mileage": "pick-current-mileage.md",
    "open-vehicle-in-efleets": "open-vehicle-in-efleets.md",
    "one-tab-per-page": "one-tab-per-page.md",
    "import-xlsx-into-automations": "import-xlsx-into-automations.md",
    "fix-last-reading-from-mileage-history": "fix-last-reading-from-mileage-history.md",
    "audit-efleets-mileage": "audit-efleets-mileage.md",
}


def slugify_personality_filename(name: str) -> str:
    base = Path(name).stem
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", base).strip("-").lower()
    slug = re.sub(r"-\([0-9a-f]{8}\)$", "", slug)
    slug = re.sub(r"-+$", "", slug)
    return slug or "agent"


def extract_description(content: str) -> str:
    m = re.search(r"## Description\s*\n\s*\n(.+?)(?:\n\s*\n## |\Z)", content, re.DOTALL)
    if not m:
        return "GrokBot personality from archive dump 2026-08-20."
    desc = m.group(1).strip()
    desc = re.sub(r"\*\*", "", desc)
    desc = desc.replace("_(empty)_", "No description in archive.")
    return desc.split("\n")[0][:500]


def update_allowlist_refs(text: str) -> str:
    if ALLOWLIST_OLD not in text:
        return text
    addition = f" ({ALLOWLIST_OLD}; repo copy: `{ALLOWLIST_REPO}`)"
    return text.replace(ALLOWLIST_OLD, ALLOWLIST_OLD + addition)


def migrate_skill(folder: str, src_name: str) -> Path:
    src = SKILLS_SRC / src_name
    dst_dir = SKILLS_DST / folder
    dst_dir.mkdir(parents=True, exist_ok=True)
    dst = dst_dir / "SKILL.md"
    content = src.read_text(encoding="utf-8")

    # Fix frontmatter name for recover-from-chrome-aw-snap
    if folder == "recover-from-chrome-aw-snap":
        content = re.sub(
            r"(^---\s*\nname:\s*).+$",
            rf"\1{folder}",
            content,
            count=1,
            flags=re.MULTILINE,
        )
    else:
        content = re.sub(
            r"(^---\s*\nname:\s*).+$",
            rf"\1{folder}",
            content,
            count=1,
            flags=re.MULTILINE,
        )

    content = update_allowlist_refs(content)

    # Insert migration note after frontmatter
    if content.startswith("---"):
        end = content.find("---", 3)
        if end != -1:
            end += 3
            body = content[end:].lstrip("\n")
            content = content[:end] + "\n\n" + MIGRATION_NOTE + "\n" + body

    dst.write_text(content, encoding="utf-8")
    return dst


def migrate_agents() -> list[Path]:
    created = []
    for src in sorted(PERSONALITIES.glob("*.md")):
        content = src.read_text(encoding="utf-8")
        slug = slugify_personality_filename(src.name)
        desc = extract_description(content)
        out = AGENTS_DST / f"{slug}.md"
        out.write_text(
            f"---\nname: {slug}\ndescription: {desc}\n---\n\n{content}",
            encoding="utf-8",
        )
        created.append(out)
    return created


def migrate_rules() -> Path:
    body = STATUS.read_text(encoding="utf-8")
    RULES_DST.parent.mkdir(parents=True, exist_ok=True)
    RULES_DST.write_text(
        "---\n"
        "description: Standing rules from GrokBot archive dump 2026-08-20. "
        "Holds, vacation send policy, pairing sheet writers, card homes.\n"
        "alwaysApply: true\n"
        "---\n\n"
        + body,
        encoding="utf-8",
    )
    return RULES_DST


GROKBOT_BEGIN = "<!-- GROKBOT_BEGIN -->"
GROKBOT_END = "<!-- GROKBOT_END -->"

GROKBOT_SECTION = """\
## GrokBot archive (2026-08-20)

This repo includes a **GrokBot archive** migrated from Google Drive for use with **Cursor Cloud Agents**. The dump preserves agent personalities, workflow skills, standing rules, routines, and memory from the paused GrokBot team (August 2026).

### Layout

| Path | Contents |
|------|----------|
| [`grokbot-archive/`](grokbot-archive/) | Full mirror of the Drive dump: README, Personalities, Skills, Routines, Memory & rules, Work snapshot |
| [`.cursor/skills/`](.cursor/skills/) | 14 workflow skills as Cursor skill folders (`SKILL.md` each) |
| [`.cursor/rules/grokbot-standing-rules.mdc`](.cursor/rules/grokbot-standing-rules.mdc) | Always-on standing rules from `STATUS.md` (holds, vacation send, pairing writers, card homes) |
| [`.cursor/agents/`](.cursor/agents/) | One agent definition per Grok personality |
| [`grokbot-archive/Routines/`](grokbot-archive/Routines/) | Grok automation definitions (inbox check, prescreen, oil updater, resume hourly) — map to Cursor Automations manually |

Re-run [`scripts/migrate_grokbot.py`](scripts/migrate_grokbot.py) after editing archive skills or personalities to refresh `.cursor/skills/` and `.cursor/agents/`.

### Resume pointers

- Standing rules and holds: `grokbot-archive/Memory & rules/STATUS.md` and `.cursor/rules/grokbot-standing-rules.mdc`
- PDI email allowlist: `grokbot-archive/Memory & rules/pdi-active-allowlist.txt`
- Original Grok paths (`/home/box/...`) are preserved in skill and agent files for reference
"""


def update_readme() -> None:
    readme = ROOT / "README.md"
    block = f"{GROKBOT_BEGIN}\n{GROKBOT_SECTION}{GROKBOT_END}\n"
    if readme.exists():
        text = readme.read_text(encoding="utf-8")
        if GROKBOT_BEGIN in text and GROKBOT_END in text:
            start = text.index(GROKBOT_BEGIN)
            end = text.index(GROKBOT_END) + len(GROKBOT_END)
            readme.write_text(text[:start] + block.rstrip() + text[end:], encoding="utf-8")
            return
        readme.write_text(text.rstrip() + "\n\n" + block, encoding="utf-8")
        return
    readme.write_text(
        "# agent-orchestrator-console\n\n"
        "Configurable Multi-Agent Orchestrator Console with chat, cron, heartbeats and SQLite persistence.\n\n"
        + block,
        encoding="utf-8",
    )


def main() -> None:
    SKILLS_DST.mkdir(parents=True, exist_ok=True)
    AGENTS_DST.mkdir(parents=True, exist_ok=True)
    skill_paths = [migrate_skill(f, s) for f, s in WORKFLOW_SKILLS.items()]
    agent_paths = migrate_agents()
    rules_path = migrate_rules()
    update_readme()
    print(f"Migrated {len(skill_paths)} skills, {len(agent_paths)} agents, rules -> {rules_path}")


if __name__ == "__main__":
    main()
