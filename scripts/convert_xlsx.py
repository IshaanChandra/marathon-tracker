#!/usr/bin/env python3
"""Convert Sub_3-45_NYC_Marathon_Plan.xlsx into src/data/plan.json + reference.json.

The workbook cells are free-text. This script parses them into structured fields
with heuristics, but ALWAYS preserves the verbatim cell in `raw` so nothing is lost.
It validates that the sum of parsed daily run miles matches each week's "Run Miles"
column and exits non-zero on mismatch.

Usage: python3 scripts/convert_xlsx.py [path-to-xlsx]
"""

import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

import openpyxl

XLSX_DEFAULT = Path.home() / "Desktop" / "Sub_3-45_NYC_Marathon_Plan.xlsx"
OUT_DIR = Path(__file__).resolve().parent.parent / "src" / "data"
YEAR = 2026
DOWS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
MONTHS = {m: i + 1 for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])}

CUTBACK_WEEKS = {"4", "9", "13", "16"}  # per Key & Paces "Cutbacks" row
TRAVEL_WEEKS = {"3": "italy", "4": "italy", "9": "wedding", "10": "wedding", "11": "wedding"}

FUEL_RE = re.compile(r"gel|saltstick|lmnt|water|oz/hr|\boz\b|sip|carb|hydrate|fueling|caffein",
                     re.IGNORECASE)
STRUCT_RE = re.compile(r"\bwu\b|\bcd\b|\d+\s*x\s|x\s*\d|uphill|strides|tempo @|@ mp", re.IGNORECASE)
HR_RE = re.compile(r"HR\s*\d+\s*-\s*\d+")
PACE_RE = re.compile(r"@\s*(MP\s*)?([\d]+:[\d]+(?:\s*-\s*[\d]+:[\d]+)?)")

TYPE_KEYWORDS = [
    ("race day", "race"), ("hill repeats", "hills"), ("threshold", "threshold"),
    ("vo2", "vo2"), ("tempo", "tempo"), ("mp workout", "mp"), ("mp tune-up", "mp"),
    ("shake-out", "shakeout"), ("shakeout", "shakeout"), ("long run", "long"),
    ("easy", "easy"),
]


def parse_week_of(text):
    """'Jun 29\\n(Italy Thu+)' -> (date(2026,6,29), 'Italy Thu+')."""
    lines = [l.strip() for l in str(text).split("\n") if l.strip()]
    m = re.match(r"([A-Z][a-z]{2})\s+(\d{1,2})", lines[0])
    if not m:
        raise ValueError(f"Cannot parse week-of date: {text!r}")
    d = date(YEAR, MONTHS[m.group(1)], int(m.group(2)))
    note = " ".join(l.strip("()") for l in lines[1:]) or None
    return d, note


def parse_lift(lines):
    """Lines from the first 'LIFT:' line onward -> lift dict."""
    focus = lines[0].split(":", 1)[1].strip()
    notes = " ".join(l.strip() for l in lines[1:]) or None
    if focus.lower().startswith("sh/"):
        focus = "Shoulders/Arms"
    return {"focus": focus, "notes": notes}


def classify_type(text_lower, is_saturday):
    for kw, t in TYPE_KEYWORDS:
        if kw in text_lower:
            return t
    return "long" if is_saturday else "easy"


def parse_day_cell(raw, dow):
    """Parse one schedule cell into {run, lift, rest, notes} (plus raw upstream)."""
    day = {"run": None, "lift": None, "rest": False, "notes": None}
    if raw is None or not str(raw).strip():
        day["rest"] = True
        return day
    lines = [l.strip() for l in str(raw).split("\n") if l.strip()]

    lift_idx = next((i for i, l in enumerate(lines) if l.upper().startswith("LIFT")), None)
    if lift_idx is not None:
        day["lift"] = parse_lift(lines[lift_idx:])
        lines = lines[:lift_idx]

    if not lines:
        return day
    text = " ".join(lines)
    text_lower = text.lower()

    miles_m = re.match(r"^(\d+(?:\.\d+)?)\s*mi\b", lines[0])
    if "RACE DAY" in text:
        day["run"] = {
            "miles": 26.2, "type": "race", "hrZone": None, "pace": "8:35/mi",
            "structure": None, "fueling": None,
        }
        day["notes"] = "NYC MARATHON — Goal 3:45"
        return day

    if miles_m is None:
        # Rest / travel / non-run day
        day["rest"] = True
        day["notes"] = text
        return day

    run = {
        "miles": float(miles_m.group(1)),
        "type": classify_type(text_lower, dow == "Saturday"),
        "hrZone": None, "pace": None, "structure": None, "fueling": None,
    }
    hr = HR_RE.search(text)
    if hr:
        run["hrZone"] = hr.group(0)
    pace = PACE_RE.search(text)
    if pace:
        run["pace"] = (("MP " if pace.group(1) else "") + pace.group(2)).strip()

    fuel_lines, struct_lines, note_lines = [], [], []
    for l in lines[1:]:
        if FUEL_RE.search(l):
            fuel_lines.append(l)
        elif STRUCT_RE.search(l) or l.startswith("+") or l.startswith("/"):
            struct_lines.append(l)
        else:
            # Drop lines that just restate the run type/HR (e.g. "Easy (HR 135-145)")
            stripped = HR_RE.sub("", l).strip(" ()").lower()
            if stripped not in {kw for kw, _ in TYPE_KEYWORDS}:
                note_lines.append(l)
    if fuel_lines:
        run["fueling"] = " ".join(fuel_lines)
    if struct_lines:
        run["structure"] = " ".join(struct_lines)
    if run["miles"] == int(run["miles"]):
        run["miles"] = int(run["miles"])
    day["run"] = run
    if note_lines:
        day["notes"] = " ".join(note_lines)
    return day


def parse_target_miles(cell):
    """'33\\n(reduced from 38)' -> 33; '18 default\\nA: 22-25...' -> 18."""
    m = re.match(r"^\s*(\d+(?:\.\d+)?)", str(cell))
    return float(m.group(1)) if m else None


def sheet_rows(ws):
    rows = []
    for row in ws.iter_rows():
        vals = [c.value for c in row]
        if any(v is not None for v in vals):
            rows.append(vals)
    return rows


def convert_schedule(wb):
    weeks, days = [], {}
    bb_notes = []

    # --- Base Building sheet: Week, Week Of, Mon..Sun, Run Miles, Lift Days
    rows = sheet_rows(wb["Base Building"])
    for r in rows[1:]:
        if r[0] and str(r[0]).startswith("BB-") and r[1]:
            week_of, note = parse_week_of(r[1])
            weeks.append(make_week(str(r[0]), "Base Building", week_of, r[9], r[10], note))
            add_days(days, str(r[0]), week_of, r[2:9])
        elif r[0] and all(v in (None, "") for v in r[1:]):
            bb_notes.append(str(r[0]))

    # --- Training Plan sheet: Phase, Week, Week Of, Mon..Sun, Run Miles, Lift Days
    rows = sheet_rows(wb["Training Plan"])
    for r in rows[1:]:
        if r[0] is None or r[2] is None:
            continue
        week_id = str(int(float(r[1])))
        week_of, note = parse_week_of(r[2])
        weeks.append(make_week(week_id, str(r[0]), week_of, r[10], r[11], note))
        add_days(days, week_id, week_of, r[3:10])

    return weeks, days, bb_notes


def make_week(week_id, phase, week_of, miles_cell, lift_cell, note):
    return {
        "id": week_id,
        "phase": phase,
        "weekOf": week_of.isoformat(),
        "targetMiles": parse_target_miles(miles_cell),
        "targetMilesText": str(miles_cell).strip(),
        "liftDays": str(lift_cell).strip(),
        "isCutback": week_id in CUTBACK_WEEKS,
        "travel": TRAVEL_WEEKS.get(week_id),
        "note": note,
    }


def add_days(days, week_id, week_of, cells):
    for i, cell in enumerate(cells):
        d = week_of + timedelta(days=i)
        parsed = parse_day_cell(cell, DOWS[i])
        days[d.isoformat()] = {
            "weekId": week_id,
            "dow": DOWS[i],
            "raw": str(cell).strip() if cell is not None else "",
            **parsed,
        }


def convert_reference(wb):
    """Two-column sheets -> ordered sections of {heading, items:[{term, body, sub}]}."""
    out = {}
    for key, sheet in [("travel", "Travel Adjustments"),
                       ("fueling", "Nutrition & Fueling"),
                       ("paces", "Key & Paces")]:
        rows = sheet_rows(wb[sheet])
        sections, current = [], None
        for r in rows:
            term = str(r[0]) if r[0] is not None else ""
            body = str(r[1]).strip() if len(r) > 1 and r[1] is not None else ""
            if not term.strip():
                continue
            if not body:  # section header row
                current = {"heading": term.strip(), "items": []}
                sections.append(current)
            else:
                if current is None:
                    current = {"heading": "", "items": []}
                    sections.append(current)
                current["items"].append({
                    "term": term.strip(),
                    "body": body,
                    "sub": term.startswith("  "),
                })
        out[key] = sections
    return out


def extract_scenarios(reference):
    """Pull the A/B/C scenario options for Italy Wk 4 and Wedding Wk 10."""
    scenarios = {
        "italy": {"weekId": "4", "options": {}},
        "wedding": {"weekId": "10", "options": {}},
    }
    trip = None
    for section in reference["travel"]:
        if "TRIP 1" in section["heading"]:
            trip = "italy"
        elif "TRIP 2" in section["heading"]:
            trip = "wedding"
        elif "GENERAL" in section["heading"] or "RED FLAGS" in section["heading"]:
            trip = None
        for item in section["items"]:
            m = re.match(r"Scenario ([ABC])\s*\((\w+)\)", item["term"])
            if m and trip:
                miles = re.match(r"^([\d-]+)\s*mi", item["body"])
                scenarios[trip]["options"][m.group(1)] = {
                    "label": m.group(2),
                    "miles": miles.group(1) if miles else None,
                    "description": item["body"],
                }
    return scenarios


def validate(weeks, days):
    """Weekly sum of parsed run miles must match the sheet's Run Miles number."""
    failures = []
    print(f"{'Week':>6} {'target':>7} {'parsed':>7}")
    for w in weeks:
        total = sum(
            d["run"]["miles"] for d in days.values()
            if d["weekId"] == w["id"] and d["run"]
        )
        target = w["targetMiles"]
        ok = target is not None and abs(total - target) < 0.05
        print(f"{w['id']:>6} {target!s:>7} {total:>7.1f} {'OK' if ok else '** MISMATCH **'}")
        if not ok:
            failures.append(w["id"])
    return failures


def main():
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else XLSX_DEFAULT
    wb = openpyxl.load_workbook(xlsx, data_only=True)

    weeks, days, bb_notes = convert_schedule(wb)
    reference = convert_reference(wb)
    scenarios = extract_scenarios(reference)

    plan = {
        "meta": {
            "goal": "3:45 marathon (~8:35/mile)",
            "race": "NYC Marathon",
            "raceDate": "2026-11-01",
            "startDate": weeks[0]["weekOf"],
            "marathonPace": "8:35/mi",
            "baseBuildingNotes": bb_notes,
        },
        "weeks": weeks,
        "days": days,
        "scenarios": scenarios,
    }

    failures = validate(weeks, days)
    if failures:
        print(f"\nFAILED mileage validation for weeks: {failures}", file=sys.stderr)
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "plan.json").write_text(json.dumps(plan, indent=2) + "\n")
    (OUT_DIR / "reference.json").write_text(json.dumps(reference, indent=2) + "\n")
    print(f"\nWrote {OUT_DIR / 'plan.json'} ({len(days)} days, {len(weeks)} weeks)")
    print(f"Wrote {OUT_DIR / 'reference.json'}")


if __name__ == "__main__":
    main()
