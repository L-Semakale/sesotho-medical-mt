import pandas as pd

hiv_df = pd.read_csv("dataset/medical_corpus.csv")
tb_df  = pd.read_csv("medical_corpus.csv")

print(f"HIV file  : {len(hiv_df)} rows")
print(hiv_df["domain_category"].value_counts().to_string())
print()
print(f"TB file   : {len(tb_df)} rows")
print(tb_df["domain_category"].value_counts().to_string())
print()

merged = pd.concat([hiv_df, tb_df], ignore_index=True)
merged["sentence_id"] = range(1, len(merged) + 1)
merged.to_csv("medical_corpus.csv", index=False, encoding="utf-8")

print(f"  Merged total : {len(merged)} rows saved to medical_corpus.csv")
print()
print("  By domain:")
print(merged["domain_category"].value_counts().to_string())
