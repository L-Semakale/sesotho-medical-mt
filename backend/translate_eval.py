from nllb_translator import nllb_translate

sentences = [
    "Continue taking your ARVs every day without missing a dose.",
    "HIV is managed with antiretroviral therapy taken daily.",
    "Complete the full course of TB treatment even if you feel better.",
    "Tuberculosis is spread through the air when an infected person coughs.",
    "Take one tablet twice daily after meals.",
    "Do not stop taking this medicine without consulting your doctor.",
    "If you experience chest pain or difficulty breathing, seek help immediately.",
    "Please attend your follow-up appointment next week.",
    "Attend all antenatal care visits during your pregnancy.",
    "Wash your hands regularly to prevent the spread of infection.",
]

print("\n" + "="*70)
for i, sentence in enumerate(sentences, 1):
    result = nllb_translate(sentence, src="english", tgt="sesotho")
    print(f"\nSentence {i}:")
    print(f"  EN: {sentence}")
    print(f"  ST: {result}")
print("\n" + "="*70)
