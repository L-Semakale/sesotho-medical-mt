import csv
from collections import Counter

CSV_FILE = "medical_corpus.csv"

empty_rows = []

with open(CSV_FILE, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if not str(row.get("sesotho_text") or "").strip():
            empty_rows.append(row)

#  Summary by domain 
domain_counts = Counter(row["domain_category"] for row in empty_rows)

print(f"Total empty sesotho_text rows: {len(empty_rows)}\n")
print(f"{'DOMAIN':<38} {'EMPTY ROWS':>10}")
print("─" * 50)
for domain, count in domain_counts.most_common():
    print(f"{domain:<38} {count:>10}")

#  Full ID list 
print(f"\nFull list of empty sentence_ids:")
print("─" * 50)
ids = [row["sentence_id"] for row in empty_rows]
print(ids)

#  Save to file 
with open("empty_sesotho_ids.txt", "w") as f:
    for row in empty_rows:
        f.write(f"{row['sentence_id']},{row['domain_category']},{row['english_text']}\n")

print(f"\n Full list saved to: empty_sesotho_ids.txt")
