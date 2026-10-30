#!/usr/bin/env python3
"""Validate the editable survey and write the JSON consumed by the Site."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content" / "doctor-thinking-50.psv"
TARGET = ROOT / "app" / "doctor-thinking" / "questions.json"

rows = [line.split("|") for line in SOURCE.read_text(encoding="utf-8").splitlines()]
if rows[0] != ["group", "question", "option1", "option2", "option3", "option4"]:
    raise SystemExit("Unexpected survey header")
if len(rows) != 51 or any(len(row) != 6 for row in rows):
    raise SystemExit("The survey must contain exactly 50 questions with four options")
if len({row[1] for row in rows[1:]}) != 50:
    raise SystemExit("Question wording must be unique")

questions = []
for index, (group, text, *options) in enumerate(rows[1:], start=1):
    if min(map(len, [group, text, *options])) < 3:
        raise SystemExit(f"Incomplete question {index}")
    if len(set(options)) != 4:
        raise SystemExit(f"Repeated option in question {index}")
    questions.append({
        "id": f"dt{index:02d}",
        "group": group,
        "text": text,
        "options": [{"id": letter, "label": label} for letter, label in zip("abcd", options)],
    })

TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Compiled {len(questions)} questions.")
