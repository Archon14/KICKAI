"""Local tactical memory with provenance. Not a silent fine-tune on poisoned data."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class TacticalMemory:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.records: list[dict[str, Any]] = []
        if self.path.exists():
            try:
                self.records = json.loads(self.path.read_text(encoding="utf-8"))
            except Exception:
                self.records = []

    def append(self, record: dict[str, Any]) -> None:
        if "provenance" not in record:
            raise ValueError("tactical memory requires provenance")
        self.records.append(record)
        self.path.write_text(json.dumps(self.records, indent=2), encoding="utf-8")

    def tendencies(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for row in self.records:
            key = str(row.get("action") or row.get("recommendation", {}).get("action"))
            if key:
                counts[key] = counts.get(key, 0) + 1
        return counts
