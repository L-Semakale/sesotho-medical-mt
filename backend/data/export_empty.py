import csv
import json

CSV_FILE    = "medical_corpus.csv"
OUTPUT_JSON = "empty_for_translation.json"

empty_rows = []

with open(CSV_FILE, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if not str(row.get("sesotho_text") or "").strip():
            empty_rows.append({
                "sentence_id"     : row["sentence_id"],
                "domain_category" : row["domain_category"],
                "english_text"    : row["english_text"],
                "sesotho_text"    : ""
            })

# Save as JSON for easy review
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(empty_rows, f, indent=2, ensure_ascii=False)

# Print first 10 as preview
print(f"Total rows to translate: {len(empty_rows)}\n")
print(" Preview (first 10) ")
for row in empty_rows[:10]:
    print(f"  [{row['sentence_id']}] {row['domain_category']}")
    print(f"  EN: {row['english_text']}")
    print()

print(f" Saved to: {OUTPUT_JSON}")
