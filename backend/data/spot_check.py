import csv
import random

CSV_FILE = "medical_corpus.csv"

PATCHED_IDS = set(
    list(range(263, 401)) +
    list(range(480, 601)) +
    list(range(4001, 4201))
)

with open(CSV_FILE, encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

patched_rows = [r for r in rows if int(r["sentence_id"]) in PATCHED_IDS]
sample = random.sample(patched_rows, 20)

print(f"Spot-checking 20 random rows from the 459 patched translations\n")
print("=" * 70)
for r in sample:
    print(f"  ID     : {r['sentence_id']}")
    print(f"  Domain : {r['domain_category']}")
    print(f"  EN     : {r['english_text']}")
    print(f"  ST     : {r['sesotho_text']}")
    print("-" * 70)
