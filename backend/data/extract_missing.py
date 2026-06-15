import csv

CSV_FILE = "medical_corpus.csv"
OUT_FILE = "needs_retranslation.csv"

PATCHED_IDS = set(
    list(range(263, 401)) +
    list(range(480, 601)) +
    list(range(4001, 4201))
)

with open(CSV_FILE, encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

broken = [r for r in rows if int(r["sentence_id"]) in PATCHED_IDS]

with open(OUT_FILE, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["sentence_id", "domain_category", "english_text"])
    writer.writeheader()
    for r in broken:
        writer.writerow({
            "sentence_id": r["sentence_id"],
            "domain_category": r["domain_category"],
            "english_text": r["english_text"]
        })

print(f"Extracted {len(broken)} rows to {OUT_FILE}")
