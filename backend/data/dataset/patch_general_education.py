import pandas as pd

CSV = "../medical_corpus.csv"
df  = pd.read_csv(CSV)

print(f"Before : {len(df)} rows")

#  Step 1: Remove duplicate 
before_dedup = len(df)
df = df.drop_duplicates(subset=["english_text"], keep="first")
removed = before_dedup - len(df)
print(f"Duplicates removed : {removed}")

#  Step 2: Add 21 new sentences to reach 600
patch = [
    "Understanding the difference between a virus and a bacteria helps you know why antibiotics are not always needed.",
    "Antibiotics should only be taken when prescribed by a doctor.",
    "Never demand antibiotics from your doctor if they are not necessary.",
    "Overuse of antibiotics leads to antibiotic resistance.",
    "Antibiotic resistance is a serious global health threat.",
    "Complete the full course of antibiotics even if you feel better.",
    "Painkillers should be used with caution and only as directed.",
    "Over-the-counter medications can have serious side effects if misused.",
    "Always read the dosage instructions before taking any medication.",
    "Do not give adult medications to children without medical advice.",
    "Children require different medication doses based on their weight and age.",
    "Herbal and traditional medicines can interact with prescription medications.",
    "Always inform your doctor if you are using any complementary therapies.",
    "Health screening is recommended even when you feel well.",
    "Many serious diseases develop silently without obvious symptoms.",
    "Blood tests can reveal health problems before symptoms appear.",
    "A healthy gut microbiome supports your immune system and overall health.",
    "Probiotics found in yoghurt and fermented foods support gut health.",
    "Chronic inflammation is linked to many serious diseases including cancer.",
    "Reducing sugar and processed food intake lowers inflammation in the body.",
    "Your lifestyle choices today determine your health outcomes tomorrow.",
]

existing = set(df["english_text"].str.strip().str.lower())
next_id  = int(df["sentence_id"].max()) + 1

rows = []
skipped = 0
for text in patch:
    if text.strip().lower() in existing:
        skipped += 1
        print(f"  SKIP: {text[:60]}")
        continue
    rows.append({
        "sentence_id":      next_id + len(rows),
        "domain_category":  "General Patient Education",
        "english_text":     text,
        "sesotho_text":     "",
        "source":           "WHO",
        "source_reference": "general-patient-education-v1",
        "translator_code":  "",
        "reviewer_status":  "raw",
        "notes":            "",
    })

df = pd.concat([df, pd.DataFrame(rows)], ignore_index=True)
df["sentence_id"] = range(1, len(df) + 1)
df.to_csv(CSV, index=False, encoding="utf-8")

print(f"Added    : {len(rows)} sentences ({skipped} skipped)")
print(f"After    : {len(df)} rows")
print()
print(df["domain_category"].value_counts().to_string())
print()
print(f"Duplicates : {df.duplicated(subset=['english_text']).sum()}")
print(f"ID range   : {df['sentence_id'].min()} to {df['sentence_id'].max()}")
