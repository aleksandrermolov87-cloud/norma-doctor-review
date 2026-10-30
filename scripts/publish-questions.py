#!/usr/bin/env python3
"""Publish the reviewed question list without storing the organizer key."""

import getpass
import json
from pathlib import Path
import subprocess
import tempfile

SITE = "https://norma-doctor-review-2026.ieydbf.chatgpt.site"
SOURCE = Path(__file__).resolve().parents[1] / "content" / "questions-50.txt"

questions = [line.strip() for line in SOURCE.read_text(encoding="utf-8").splitlines() if line.strip()]
if len(questions) != 50 or len(set(questions)) != 50:
    raise SystemExit("Expected exactly 50 distinct questions")

key = getpass.getpass("Organizer key: ")
with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", suffix=".json") as payload:
    json.dump({"questions": questions}, payload, ensure_ascii=False)
    payload.flush()
    publication = subprocess.run(
        ["curl", "--max-time", "20", "-sS", "-X", "PUT", "-H", "Content-Type: application/json",
         "--data-binary", "@" + payload.name, "--config", "-", SITE + "/api/questions"],
        input='header = "Authorization: Bearer ' + key + '"\n',
        text=True, capture_output=True, check=True,
    )
result = json.loads(publication.stdout)
if result.get("count") != 50:
    raise SystemExit("Publication returned an unexpected result: " + str(result))

verification = subprocess.run(
    ["curl", "--max-time", "20", "-sS", SITE + "/api/questions"],
    text=True, capture_output=True, check=True,
)
published = json.loads(verification.stdout)["questions"]
if [item["text"] for item in published] != questions:
    raise SystemExit("Published questions do not match the source file")
print("Published and verified 50 questions.")
