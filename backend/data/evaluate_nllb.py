import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
import sacrebleu
from nllb_translator import nllb_translate

# --- Load and clean the corpus ---
df = pd.read_csv("medical_corpus.csv")
df = df.dropna(subset=["english_text", "sesotho_text"])
df = df[df["sesotho_text"].astype(str).str.strip() != ""]
df = df[df["english_text"] != df["sesotho_text"]]

# --- Held-out test sample (reproducible with random_state) ---
test = df.sample(min(100, len(df)), random_state=42)

hypotheses, references = [], []
print(f"Translating {len(test)} test sentences with NLLB-200...\n")

for i, (_, row) in enumerate(test.iterrows(), 1):
    hyp = nllb_translate(row["english_text"], src="english", tgt="sesotho")
    hypotheses.append(hyp)
    references.append(str(row["sesotho_text"]))
    if i % 10 == 0:
        print(f"  {i}/{len(test)} translated")

# --- Compute metrics ---
bleu = sacrebleu.corpus_bleu(hypotheses, [references])
chrf = sacrebleu.corpus_chrf(hypotheses, [references], word_order=2)  # chrF++
ter  = sacrebleu.corpus_ter(hypotheses, [references])

print("\n" + "=" * 45)
print("  NLLB-200 EVALUATION RESULTS")
print("=" * 45)
print(f"  Test set size : {len(test)} sentence pairs")
print(f"  BLEU          : {bleu.score:.2f}")
print(f"  chrF++        : {chrf.score:.2f}")
print(f"  TER           : {ter.score:.2f}")
print("=" * 45)

# --- Save results (your evidence) ---
with open("evaluation_results.txt", "w", encoding="utf-8") as f:
    f.write("NLLB-200 Sesotho-English Medical Translation Evaluation\n")
    f.write("Direction: English -> Sesotho\n")
    f.write(f"Test set size: {len(test)} sentence pairs\n\n")
    f.write(f"BLEU   : {bleu.score:.2f}\n")
    f.write(f"chrF++ : {chrf.score:.2f}\n")
    f.write(f"TER    : {ter.score:.2f}\n")

# --- Save side-by-side examples for your appendix ---
pd.DataFrame({
    "english": test["english_text"].values,
    "reference_sesotho": references,
    "nllb_output": hypotheses
}).to_csv("evaluation_examples.csv", index=False, encoding="utf-8")

print("\nSaved: evaluation_results.txt  and  evaluation_examples.csv")
