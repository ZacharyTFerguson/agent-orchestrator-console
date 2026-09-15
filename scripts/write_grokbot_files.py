#!/usr/bin/env python3
"""Write GrokBot archive files from base64 blobs saved by the migration fetch step."""

import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOB_DIR = ROOT / ".migration-blobs"

# destination relative to repo root -> Drive file id
FILES = {
    "grokbot-archive/README.md": "1N67vSwRaqgim2yCIWTNLccxqVjhmeG6_",
    "grokbot-archive/Skills/verify-i-j-formulas-after-writes.md": "1maYfVVXgwxiDr38FZDKP6azFj4mMXE5I",
    "grokbot-archive/Skills/sort-fleet-by-unit-prefix.md": "1EqqRc8QGXu9g7acAsVv9-sI9p0WD9ao0",
    "grokbot-archive/Skills/run-a-onestep-total-distance-report.md": "1rhrw7U6hXxbx3FK8z0frOfP7-XoRzDXy",
    "grokbot-archive/Skills/run-a-onestep-daily-operations-report.md": "1Zwp1EBJo3FYposigEI7oXSEY56FwqYU_",
    "grokbot-archive/Skills/read-onestep-history-distance.md": "1VQ4_pqwEj29EOEcvhCzoBEJ8N1rRU8QN",
    "grokbot-archive/Skills/read-fuel-charging-details.md": "1oOFtCHSOOLkAzKFq4xBrwfrvWTgbqWkD",
    "grokbot-archive/Skills/read-efleets-mileage-history.md": "17sSy7vAYKEaHqrGnnmk_Jak6l60_lDP0",
    "grokbot-archive/Skills/prescreen-inbound-email.md": "10wLMbi9LXNcm-lIKqwQ3LJLTnjNkBPI8",
    "grokbot-archive/Skills/pick-current-mileage.md": "1OMmOEh_aUZpl5ds4JGnl4Q6JWu4Mic_g",
    "grokbot-archive/Skills/open-vehicle-in-efleets.md": "1jrhCjTH3ly5Ihx3l_Jh8ugcL9DbIBzQv",
    "grokbot-archive/Skills/one-tab-per-page.md": "1JjOKBmC0s3fgST8J2Va4THefBWb2t1fg",
    "grokbot-archive/Skills/import-xlsx-into-automations.md": "1VQ8OanKjvmebrtpk7pQX3ZX60CQWI_SP",
    "grokbot-archive/Skills/fix-last-reading-from-mileage-history.md": "1FzoO3Dj3XV-cNVlDUL0Z7KX7nu6ibaK0",
    "grokbot-archive/Skills/audit-efleets-mileage.md": "18_NLq9wrec_uHTfdVa9Bvzu9-FIAOdvo",
    "grokbot-archive/Skills/MANAGED-SKILLS.md": "1ppWFnnmsUp0Vi0UZOjeSJ2KWTauyqyE3",
    "grokbot-archive/Personalities/APPBuilder.md": "1FMm4C_dDl6S_G2l90KxsELfgmkQRH_I2",
    "grokbot-archive/Personalities/Dicomlight Implement.md": "1Q4FmcOSUDpuOB08WHuhQ1CsRByz4nGxg",
    "grokbot-archive/Personalities/Dicomlight Research.md": "1Qle7FtcM9yeWvPOfkeOXIrEz20UGaBrR",
    "grokbot-archive/Personalities/Dicomlight Review.md": "1IeM5RQb1G7eXb5DdtM3yIH1nPZI25bC0",
    "grokbot-archive/Personalities/Groups.md": "1vhQGMjcKvzdlkj16azP99fg_h985w9-W",
    "grokbot-archive/Personalities/New Bot (e1f2d13b).md": "1xa3deQZA9hcUdN2EaNxfUM3Wjbd9MAFQ",
    "grokbot-archive/Personalities/New Bot.md": "1AiAGBbrPbP4sJyJAhEh_JdOQdexkrfpc",
    "grokbot-archive/Personalities/Oil Change Implementer.md": "1mfFgSJbTd27XQ1ctjVw1a3Rqguykz8B2",
    "grokbot-archive/Personalities/Oil Change Reviewer.md": "1JK-nevV4GWRv4Aav_9JbL3px2-SGCAkf",
    "grokbot-archive/Personalities/Oil Change Updater.md": "1vCuZqTMg2r6MEtJzggN5Em3aRaLDR-zj",
    "grokbot-archive/Personalities/One Step Liason.md": "1m_4CPyoBuSo7Vyjg4ZaMixJcCH6ssDYj",
    "grokbot-archive/Personalities/OneStep Probe.md": "1gfahy4aQk2j99Qh2Zl16zesu8NLyO2vb",
    "grokbot-archive/Personalities/OneStep Research.md": "1-owT3JyPrNPfa9GEdt9tWd1dxQY9q4CE",
    "grokbot-archive/Personalities/OneStep Review.md": "1M8c6UyrkHW0oXptH722Br1jM511RifNJ",
    "grokbot-archive/Personalities/Zach's Automations Emails.md": "1kw2tLw74XI30fHCqjDRBcKaHk7kfb9xY",
    "grokbot-archive/Personalities/internet bot prescreen.md": "1mBCmBA6R7bo_LOUruC1uymhtPWL1uqdH",
    "grokbot-archive/Personalities/internet bot review.md": "1ruRkg4UfRUfe1dPyAeVUP6SFlTIHP4FR",
    "grokbot-archive/Routines/internet bot prescreen — Screen automations inbox.md": "1H72kEyej-lwAOm8kjeJCNQ2Ow5EUFBWr",
    "grokbot-archive/Routines/Zach's Automations Emails — Resume hourly inbox.md": "1-B2I_AvrVy1OORMuuC6QeyZwiTjkixT2",
    "grokbot-archive/Routines/Zach's Automations Emails — Inbox check.md": "1ynjKEC8VUB7SMKZ5GWmVp7sl3v3qy-qy",
    "grokbot-archive/Routines/Oil Change Updater — Update Automations Spread Sheet.md": "1pzGujYpxW2pNCE054BZ2kRSwgSLOZZYy",
    "grokbot-archive/Memory & rules/STATUS.md": "1oLYoyAUAPCD_LqEFNiQE6X7LejtdoeoF",
    "grokbot-archive/Memory & rules/internet-bot-profile.md": "1gZRk3VAqlvyK4SstI9v3lgEeJc38cOzG",
    "grokbot-archive/Memory & rules/internet-bot-log-2026-08.md": "1pSTSqK3Ue2R-2e-44jCZ6-_VD6tYZlFq",
    "grokbot-archive/Memory & rules/pdi-active-allowlist.txt": "1Y2rkC-5_KNYi5CnGKu6HCCpkpKG0IVud",
    "grokbot-archive/Memory & rules/other-agents/APPBuilder (4ffc90f9).md": "1BMCNgBwJ4o3EnEMj3iswtjBF1aoZ0vmn",
    "grokbot-archive/Memory & rules/other-agents/Dicomlight Implement (e04f9401).md": "1kWy2KMj2bmXuBibyy8q8raasyR2q9NNA",
    "grokbot-archive/Memory & rules/other-agents/Dicomlight Review (6c1975df).md": "1UEQlolslRdrf92lgQZHGejHiIkOuc0Mb",
    "grokbot-archive/Memory & rules/other-agents/New Bot (e1f2d13b).md": "1JB5Bo47swyX2xX04Yxxzuhz2vF_H2IwV",
    "grokbot-archive/Memory & rules/other-agents/One Step Liason (bf69664a).md": "1r4Fi5ZBTgxqGkP39o_3JbjUJs9B4hYS8",
    "grokbot-archive/Memory & rules/other-agents/OneStep Probe (8d7c58ce).md": "1U2GadEiROI73Ey-CVULuR6dTrOZc9IsL",
    "grokbot-archive/Memory & rules/other-agents/OneStep Research (feeba1cd).md": "1eq44tgJmJegdTw8_wJS_mV3V--OpBhp6",
    "grokbot-archive/Memory & rules/other-agents/OneStep Review (665a980c).md": "1rSxYAuY8qyrPMxth8wBvqYOr5kTcyn3Y",
    "grokbot-archive/Memory & rules/other-agents/Oil Change Implementer (12ed551c).md": "1nGoH5AOht3_dVQ9hL09Re4UHuB9yqMs1",
    "grokbot-archive/Memory & rules/other-agents/Oil Change Reviewer (242f947b).md": "1yQpWELErTjjLY77bHNmfn7OcG_BKE0Rq",
    "grokbot-archive/Memory & rules/other-agents/Oil Change Updater (06ab01b0).md": "1KPZtrXs2J6j19dwNJ4iYAtHTFB4RBgQE",
    "grokbot-archive/Memory & rules/other-agents/internet bot prescreen (ffa4c4aa).md": "1iU0py3J80KjV-Nz9u6ju5Ox9UELuePU7",
    "grokbot-archive/Memory & rules/other-agents/internet bot review (5e976821).md": "1fqWnuj7MxoT4olLP5wBKhHlEREXGJxwf",
    "grokbot-archive/Work snapshot/suspected-cards-plan.md": "1jGL_o6-KWgHKRwERRV0edW28JCuWqHeH",
    "grokbot-archive/Work snapshot/card-home-status-2026-08-19.md": "1o74Jj4tf29vLbV4fs15rdf27pQ3zdbBJ",
    "grokbot-archive/Work snapshot/PA21-signed-days.md": "1w4Jq8WKsgVcB5cgkJvBJU-Bgqg8x-Z9X",
}

SKILL_MAP = {
    "verify-i-j-formulas-after-writes": "grokbot-archive/Skills/verify-i-j-formulas-after-writes.md",
    "sort-fleet-by-unit-prefix": "grokbot-archive/Skills/sort-fleet-by-unit-prefix.md",
    "run-a-onestep-total-distance-report": "grokbot-archive/Skills/run-a-onestep-total-distance-report.md",
    "run-a-onestep-daily-operations-report": "grokbot-archive/Skills/run-a-onestep-daily-operations-report.md",
    "recover-from-chrome-aw-snap": "grokbot-archive/Skills/read-onestep-history-distance.md",
    "read-fuel-charging-details": "grokbot-archive/Skills/read-fuel-charging-details.md",
    "read-efleets-mileage-history": "grokbot-archive/Skills/read-efleets-mileage-history.md",
    "prescreen-inbound-email": "grokbot-archive/Skills/prescreen-inbound-email.md",
    "pick-current-mileage": "grokbot-archive/Skills/pick-current-mileage.md",
    "open-vehicle-in-efleets": "grokbot-archive/Skills/open-vehicle-in-efleets.md",
    "one-tab-per-page": "grokbot-archive/Skills/one-tab-per-page.md",
    "import-xlsx-into-automations": "grokbot-archive/Skills/import-xlsx-into-automations.md",
    "fix-last-reading-from-mileage-history": "grokbot-archive/Skills/fix-last-reading-from-mileage-history.md",
    "audit-efleets-mileage": "grokbot-archive/Skills/audit-efleets-mileage.md",
}

AGENT_MAP = {
    "appbuilder": "grokbot-archive/Personalities/APPBuilder.md",
    "dicomlight-implement": "grokbot-archive/Personalities/Dicomlight Implement.md",
    "dicomlight-research": "grokbot-archive/Personalities/Dicomlight Research.md",
    "dicomlight-review": "grokbot-archive/Personalities/Dicomlight Review.md",
    "oil-change-implementer": "grokbot-archive/Personalities/Oil Change Implementer.md",
    "oil-change-reviewer": "grokbot-archive/Personalities/Oil Change Reviewer.md",
    "oil-change-updater": "grokbot-archive/Personalities/Oil Change Updater.md",
    "one-step-liason": "grokbot-archive/Personalities/One Step Liason.md",
    "onestep-probe": "grokbot-archive/Personalities/OneStep Probe.md",
    "onestep-research": "grokbot-archive/Personalities/OneStep Research.md",
    "onestep-review": "grokbot-archive/Personalities/OneStep Review.md",
    "internet-bot": "grokbot-archive/Personalities/Zach's Automations Emails.md",
    "internet-bot-prescreen": "grokbot-archive/Personalities/internet bot prescreen.md",
    "internet-bot-review": "grokbot-archive/Personalities/internet bot review.md",
}


def read_blob(file_id: str) -> bytes:
    path = BLOB_DIR / f"{file_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Missing blob for {file_id}")
    data = json.loads(path.read_text())
    return base64.b64decode(data["content"])


def write_archive_files() -> None:
    for rel, file_id in FILES.items():
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(read_blob(file_id))
        print(f"wrote {rel}")


def normalize_skill_frontmatter(text: str, skill_name: str) -> str:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return text
    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return text
    body = "\n".join(lines[end + 1 :]).lstrip("\n")
    desc_lines = []
    for line in lines[1:end]:
        if line.startswith("description:"):
            desc = line.split(":", 1)[1].strip()
            if desc.startswith(">"):
                desc = desc.lstrip(">- ").strip()
            desc_lines.append(desc)
        elif desc_lines and line.startswith(" "):
            desc_lines.append(line.strip())
    description = " ".join(desc_lines).strip()
    header = (
        "---\n"
        f"name: {skill_name}\n"
        f"description: {description}\n"
        "---\n\n"
        "> Migrated from GrokBot archive 2026-08-20. Allowlist copy: "
        "`grokbot-archive/Memory & rules/pdi-active-allowlist.txt` "
        "(original Grok path preserved in body where cited).\n\n"
    )
    return header + body


def write_cursor_skills() -> None:
    for skill_name, archive_rel in SKILL_MAP.items():
        src = ROOT / archive_rel
        text = src.read_text(encoding="utf-8")
        normalized = normalize_skill_frontmatter(text, skill_name)
        dest = ROOT / ".cursor" / "skills" / skill_name / "SKILL.md"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(normalized, encoding="utf-8")
        print(f"wrote .cursor/skills/{skill_name}/SKILL.md")


def slug_from_personality(text: str, fallback: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            title = line[2:].strip()
            slug = title.lower().replace("'", "").replace(" ", "-")
            return slug
    return fallback


def write_cursor_agents() -> None:
    for slug, archive_rel in AGENT_MAP.items():
        src = ROOT / archive_rel
        text = src.read_text(encoding="utf-8")
        title = slug
        desc = ""
        for line in text.splitlines():
            if line.startswith("# "):
                title = line[2:].strip()
            if line.startswith("## Description") or line.startswith("## description"):
                continue
            if desc == "" and line.strip() and not line.startswith("#") and not line.startswith("- **id"):
                if not line.startswith("```"):
                    desc = line.strip()
                    break
        header = f"---\nname: {slug}\ndescription: {desc or title}\n---\n\n"
        dest = ROOT / ".cursor" / "agents" / f"{slug}.md"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(header + text, encoding="utf-8")
        print(f"wrote .cursor/agents/{slug}.md")


def write_cursor_rules() -> None:
    status = (ROOT / "grokbot-archive/Memory & rules/STATUS.md").read_text(encoding="utf-8")
    rule = (
        "---\n"
        "description: Standing rules from GrokBot archive dump 2026-08-20. Holds, vacation send policy, pairing sheet writers, card homes.\n"
        "alwaysApply: true\n"
        "---\n\n"
        + status
    )
    dest = ROOT / ".cursor" / "rules" / "grokbot-standing-rules.mdc"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(rule, encoding="utf-8")
    print("wrote .cursor/rules/grokbot-standing-rules.mdc")


def main() -> int:
    if not BLOB_DIR.exists():
        print(f"Expected blob dir {BLOB_DIR}", file=sys.stderr)
        return 1
    write_archive_files()
    write_cursor_skills()
    write_cursor_agents()
    write_cursor_rules()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
