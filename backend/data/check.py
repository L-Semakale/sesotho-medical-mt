import csv
import os
import sys
from collections import Counter

# Configuration 
CSV_FILE = "medical_corpus.csv"
TARGET   = 5000
DOMAINS  = {
    "HIV"                          : 1000,
    "Medication Instructions"      : 900,
    "Tuberculosis"                 : 800,
    "Symptoms and Complaints"      : 800,
    "General Patient Education"    : 600,
    "Appointments and Follow-Up"   : 500,
    "Maternal and Child Health"    : 400,
}

PASS = " PASS"
FAIL = " FAIL"
WARN = "  WARN"

def separator(char="─", width=60):
    print(char * width)

def load_corpus(filepath):
    if not os.path.exists(filepath):
        print(f"\n{FAIL}  File not found: {filepath}")
        print(f"       Run this script from: backend/data/")
        print(f"       Expected file at    : {os.path.abspath(filepath)}")
        sys.exit(1)
    rows = []
    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

# Checks 

def check_columns(rows):
    required = {"sentence_id", "domain_category", "english_text", "sesotho_text"}
    actual   = set(rows[0].keys()) if rows else set()
    missing  = required - actual
    extra    = actual - required
    if missing:
        print(f"{FAIL}  Column headers   — missing: {missing}")
        print(f"       Columns found: {actual}")
        return False
    if extra:
        print(f"{WARN}  Column headers   — extra columns (OK): {extra}")
    else:
        print(f"{PASS}  Column headers   — all 4 required columns present")
    return True

def check_total(rows):
    total = len(rows)
    diff  = total - TARGET
    if total == TARGET:
        print(f"{PASS}  Total sentences  — {total} / {TARGET}")
        return True
    elif total > TARGET:
        print(f"{FAIL}  Total sentences  — {total} / {TARGET}  (+{diff} extra)")
    else:
        print(f"{FAIL}  Total sentences  — {total} / {TARGET}  ({diff} missing)")
    return False

def check_duplicates(rows):
    ids    = [str(row["sentence_id"]) for row in rows]
    counts = Counter(ids)
    dupes  = {k: v for k, v in counts.items() if v > 1}
    if dupes:
        print(f"{FAIL}  Duplicates       — {len(dupes)} duplicate sentence_id(s) found")
        for k, v in list(dupes.items())[:10]:
            print(f"             sentence_id={k} appears {v} times")
        return False
    print(f"{PASS}  Duplicates       — 0 duplicates found")
    return True

def check_id_range(rows):
    try:
        ids = sorted([int(row["sentence_id"]) for row in rows])
    except ValueError:
        print(f"{FAIL}  ID range         — non-integer sentence_id values found")
        return False
    min_id   = ids[0]
    max_id   = ids[-1]
    expected = set(range(1, TARGET + 1))
    actual   = set(ids)
    missing  = sorted(expected - actual)
    extra    = sorted(actual - expected)
    if missing or extra:
        print(f"{FAIL}  ID range         — {min_id} to {max_id}")
        if missing:
            preview = missing[:15]
            more    = len(missing) - 15
            print(f"             Missing IDs ({len(missing)}): {preview}"
                  + (f" ... and {more} more" if more > 0 else ""))
        if extra:
            print(f"             Unexpected IDs: {extra[:10]}")
        return False
    print(f"{PASS}  ID range         — 1 to {TARGET} (continuous, no gaps)")
    return True

def check_empty_translations(rows):
    empty_sesotho = [str(row["sentence_id"]) for row in rows
                     if not str(row.get("sesotho_text") or "").strip()]
    empty_english = [str(row["sentence_id"]) for row in rows
                     if not str(row.get("english_text") or "").strip()]
    ok = True
    if empty_sesotho:
        print(f"{FAIL}  Empty sesotho    — {len(empty_sesotho)} row(s) with no Sesotho text")
        for sid in empty_sesotho[:10]:
            print(f"             sentence_id={sid}")
        ok = False
    else:
        print(f"{PASS}  Empty sesotho    — 0 empty Sesotho translations")
    if empty_english:
        print(f"{FAIL}  Empty english    — {len(empty_english)} row(s) with no English text")
        ok = False
    else:
        print(f"{PASS}  Empty english    — 0 empty English sentences")
    return ok

def check_translation_length(rows, ratio_min=0.4, ratio_max=3.5):
    suspicious = []
    for row in rows:
        eng = str(row.get("english_text") or "").strip()
        ses = str(row.get("sesotho_text") or "").strip()
        if not eng or not ses:
            continue
        ratio = len(ses) / len(eng)
        if ratio < ratio_min or ratio > ratio_max:
            suspicious.append((row["sentence_id"], round(ratio, 2)))
    if suspicious:
        print(f"{WARN}  Length ratios    — {len(suspicious)} sentence(s) with unusual ratio "
              f"(outside {ratio_min}–{ratio_max}x)")
        for sid, r in suspicious[:5]:
            print(f"             sentence_id={sid}  ratio={r}")
        if len(suspicious) > 5:
            print(f"             ... and {len(suspicious)-5} more")
    else:
        print(f"{PASS}  Length ratios    — all translations within expected range")
    return len(suspicious) == 0

def check_domains(rows):
    domain_counts = Counter(row["domain_category"] for row in rows)
    print(f"\n{'─'*60}")
    print(f"  {'DOMAIN':<38} {'EXPECTED':>8}  {'ACTUAL':>8}  STATUS")
    print(f"{'─'*60}")
    all_ok = True
    for domain, expected_count in DOMAINS.items():
        actual_count = domain_counts.get(domain, 0)
        if actual_count == expected_count:
            status = "✅"
        elif actual_count == 0:
            status = " MISSING"
            all_ok = False
        else:
            status = f"  OFF BY {actual_count - expected_count:+d}"
            all_ok = False
        print(f"  {domain:<38} {expected_count:>8}  {actual_count:>8}  {status}")
    print(f"{'─'*60}")
    total_actual = sum(domain_counts.values())
    print(f"  {'TOTAL':<38} {TARGET:>8}  {total_actual:>8}")
    unexpected = set(domain_counts.keys()) - set(DOMAINS.keys())
    if unexpected:
        print(f"\n{WARN}  Unexpected domain labels found:")
        for d in unexpected:
            print(f"       '{d}'  —  {domain_counts[d]} sentence(s)")
        all_ok = False
    return all_ok

#  Main 

def main():
    separator("═")
    print("   Sesotho Medical Corpus — Integrity Check")
    print(f"   File   : {CSV_FILE}")
    print(f"   Target : {TARGET} sentences")
    separator("═")
    print()

    rows = load_corpus(CSV_FILE)

    print(f"🔎 Running checks ...\n")

    results = []
    results.append(("Column Headers",      check_columns(rows)))
    results.append(("Total Count",         check_total(rows)))
    results.append(("Duplicate IDs",       check_duplicates(rows)))
    results.append(("ID Range",            check_id_range(rows)))
    results.append(("Empty Translations",  check_empty_translations(rows)))
    results.append(("Translation Lengths", check_translation_length(rows)))
    results.append(("Domain Distribution", check_domains(rows)))

    separator()
    passed = sum(1 for _, r in results if r)
    failed = len(results) - passed

    print(f"\n  Summary: {passed}/{len(results)} checks passed\n")
    for name, result in results:
        icon = "✅" if result else "❌"
        print(f"    {icon}  {name}")

    separator("═")
    if failed == 0:
        print("   ALL CHECKS PASSED — corpus is clean and ready!")
    else:
        print(f"    {failed} check(s) FAILED — review the issues above.")
    separator("═")

if __name__ == "__main__":
    main()
