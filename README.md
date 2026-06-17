# Sesotho Medical Machine Translation System

A proof-of-concept web application that translates **medical text between English and Sesotho / Southern Sotho** to support clearer communication between healthcare workers and patients in Lesotho.

**Status:** Proof-of-Concept Prototype — NLLB-200 evaluated · SUS usability testing completed

---

## Repository & Demo

**GitHub Repository:** https://github.com/L-Semakale/sesotho-medical-mt  
**Video Demo:** [Watch the demo here](https://youtu.be/IUWbhWTxlg0)

---

## Overview

Many patients in Sesotho-speaking regions receive medical instructions in English, which can create barriers to understanding treatment, medication use, follow-up care, and disease prevention.

This project addresses that gap through a **dual-path medical translation architecture**:

1. **Verified corpus cache**  
   Exact matches against the medical phrase corpus are returned instantly without calling the neural model.

2. **NLLB-200 neural translation fallback**  
   Phrases not found in the corpus are translated using `facebook/nllb-200-distilled-600M`, Meta AI's open-weight multilingual model supporting 200 languages, including Sesotho (`sot_Latn`).

This design prioritises safety for high-frequency medical phrases while preserving broader translation coverage for unseen inputs.

> **Medical Disclaimer:**  
> This system is a proof-of-concept research prototype. It must not be used for clinical diagnosis, treatment decisions, emergency care, or as a replacement for qualified medical interpretation. Outputs should be reviewed by qualified bilingual or healthcare personnel before real-world use.

---

## Medical Domains Covered

The corpus contains English–Sesotho medical sentence pairs across key healthcare domains.

| **Domain** | **Sentence Pairs** |
|---|---:|
| HIV / AIDS | 1,000 |
| Medication Instructions | 900 |
| Tuberculosis (TB) | 800 |
| Symptoms & Complaints | 800 |
| General Patient Education | 600 |
| Appointments & Follow-up | 500 |
| Maternal & Child Health | 400 |
| **Total** | **5,000** |

---

## How Translation Works

The system follows a dual-path translation workflow:

1. The user signs in and submits a medical phrase in English or Sesotho.
2. The backend checks the **verified corpus cache** for an exact match.
3. If the phrase is found, the system returns the stored corpus translation.
4. If no match is found, **NLLB-200** performs live neural translation.
5. The response includes the translated text and its source:
   - `verified_corpus`
   - `nllb_model`
6. Each translation request is stored in the user's history with timestamp, direction, and model source.

---

## Model Evaluation

NLLB-200 was evaluated in **zero-shot mode** on a 100-pair held-out medical test set using SacreBLEU.

No model weights were fine-tuned. Instead, the project uses a domain-aware translation strategy based on verified corpus lookup and NLLB-200 fallback generation.

| **Metric** | **Score** | **Interpretation** |
|---|---:|---|
| **BLEU** | **27.01** | Above 20 = understandable; strong for low-resource Sesotho MT |
| **chrF++** | **49.15** | Primary metric — character-level, suited to Sesotho morphology |
| **TER** | **60.67** | Approximately 60% editing effort; expected baseline for low-resource MT |

**chrF++ is the primary metric** because Sesotho is morphologically rich. Character-level matching captures partial word matches that BLEU may miss, especially when valid morphological variations occur.

Evaluation files:

- Full results: `backend/data/evaluation_results.txt`
- Side-by-side examples: `backend/data/evaluation_examples.csv`
- Evaluation notebook: `notebook/01_data_eval_model.ipynb`

---

## Why No Fine-Tuning?

NLLB-200 was not fine-tuned because the available dataset and hardware resources were not sufficient for stable model adaptation.

| **Reason** | **Detail** |
|---|---|
| Dataset size | 5,000 pairs is below the 50,000+ usually needed for stable fine-tuning |
| Hardware | Approximately 16GB VRAM would be required, exceeding available resources |
| Risk | Fine-tuning on insufficient data can cause catastrophic forgetting |

Instead, the project uses two lightweight domain adaptation strategies:

- **Retrieval-based phrase cache** — verified corpus pairs are returned without calling the model.
- **Domain-specific evaluation** — the model is benchmarked specifically on medical text.

This approach is consistent with Saunders (2022) on lightweight domain adaptation in neural machine translation.

---

## Qualitative Error Analysis

Automatic metrics alone cannot confirm medical safety. A translation may receive a reasonable BLEU or chrF++ score while still containing a clinically dangerous error.

To address this, 10 NLLB-200 outputs were manually reviewed and classified by severity.

| **Severity** | **Count** | **% of Sample** |
|---|---:|---:|
| None — medically safe | 6 | 60% |
| Minor | 3 | 30% |
| **CRITICAL** | **1** | **10%** |

### Critical Finding

NLLB-200 hallucinated **"lethal dose"** from **"missed dose"** in one output.

This is the most important safety finding in the project. It demonstrates why the dual-path architecture is necessary: the verified corpus cache can intercept high-frequency medical phrases before the neural model is called, reducing the risk of unsafe generated translations reaching users.

---

## Usability Evaluation (SUS)

System usability was assessed using the **System Usability Scale (SUS)** — a validated 10-item Likert questionnaire. Six participants completed the evaluation after interacting with the live system.

| **Participant** | **SUS Score** | **Grade** |
|---|---:|---|
| Temana | 85.0 | Excellent |
| Rapelang | 82.5 | Good |
| Mak'hong | 70.0 | Okay |
| Tapile | 65.0 | Poor |
| Mpho | 60.0 | Poor |
| *(Participant 6)* | *(see data)* | — |

| **Metric** | **Value** |
|---|---|
| Participants | 6 |
| Mean SUS Score | ~74 |
| Acceptable threshold | 68 |
| Overall Grade | **Good** |

The mean SUS score exceeds the widely accepted **68-point acceptability threshold**, indicating the system is usable for its intended purpose as a proof-of-concept prototype.

Participants who reported lower scores cited occasional incorrect translations — consistent with the known limitations of zero-shot NLLB-200 on low-resource language pairs.

Usability data: `backend/data/system.db` → `usability_feedback` table  
Visualisation: `figure8_sus_scores.png`

---

## Tech Stack

| **Layer** | **Technology** |
|---|---|
| Frontend | React.js |
| Backend | Python 3.10+, Flask |
| Database | SQLite (`system.db`) |
| Translation Engine | NLLB-200 `facebook/nllb-200-distilled-600M` via HuggingFace Transformers |
| ML Framework | PyTorch |
| Corpus | `medical_corpus.csv` — 5,000 English–Sesotho medical pairs |
| Evaluation | SacreBLEU — BLEU, chrF++, TER |
| Usability | System Usability Scale (SUS) — 6 participants |
| Data Processing | Pandas |
| Notebook | Jupyter / Google Colab |
| Version Control | Git & GitHub |

---

## Screenshots

### User View — Translator

Medical disclaimer visible on load. Tabs are available for translation, history, usability testing, and feedback.

![User Dashboard — Translator](docs/screenshots/01_translator.png)

---

### Admin View — Evaluation Metrics

Real BLEU, chrF++, and TER scores from NLLB-200 evaluated on the 100-pair held-out medical test set.

![Admin Dashboard — Evaluation Metrics](docs/screenshots/02_evaluation.png)

---

## Environment Setup & Installation

### Prerequisites

Before running the system, install:

- Python 3.10 or higher
- Node.js 18 or higher
- Git
- pip

---

## Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/L-Semakale/sesotho-medical-mt.git
cd sesotho-medical-mt

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows PowerShell
source venv/bin/activate     # macOS / Linux

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Download the NLLB-200 model
# Run once only — downloads approximately 2.5 GB
cd backend
python download_model.py

# 5. Start the backend server
python app.py
# Backend runs at http://localhost:5000
```

---

## Frontend Setup

```bash
# From the project root
cd frontend
npm install
npm start
# Frontend runs at http://localhost:3000
```

## Project Structure

```
sesotho-medical-mt/
├── backend/
│   ├── app.py                      # Flask API server
│   ├── database.py                 # Database logic
│   ├── nllb_translator.py          # NLLB-200 translation engine
│   ├── translator.py               # Translation routing logic
│   ├── safety.py                   # Medical safety filter
│   ├── usability.py                # SUS data collection
│   ├── download_model.py           # NLLB-200 model downloader
│   ├── reset_admin.py              # Admin utility
│   ├── translate_eval.py           # Evaluation runner
│   ├── sus_analysis.py             # SUS scoring and visualisation
│   ├── sus_responses.csv           # Raw SUS responses
│   ├── sus_summary.csv             # SUS summary statistics
│   ├── figure8_sus_scores.png      # SUS bar chart
│   ├── requirements.txt            # Python dependencies
│   └── data/
│       ├── medical_corpus.csv      # 5,000 English–Sesotho pairs
│       ├── evaluate_nllb.py        # NLLB evaluation script
│       ├── evaluation_results.txt  # BLEU, chrF++, TER scores
│       ├── evaluation_examples.csv # Side-by-side translation examples
│       ├── terminology_glossary.csv
│       ├── test_set.csv
│       ├── train_set.csv
│       ├── validation_set.csv
│       └── README.md
├── frontend/
│   └── src/                        # React.js application
├── notebook/
│   └── 01_data_eval_model.ipynb
├── docs/
│   └── screenshots/
└── README.md
```

## Limitations

- **Zero-shot only** — NLLB-200 was not fine-tuned on medical data due to dataset and hardware constraints.
- **Corpus coverage** — phrases outside the 5,000-pair corpus rely on neural generation, which carries hallucination risk.
- **Small usability sample** — 6 SUS participants is sufficient for a proof-of-concept but not for generalised usability claims.
- **Not for clinical use** — outputs must be reviewed by qualified personnel before any real-world application.

---

## License

This project was developed as a research prototype for academic purposes.  
Not licensed for clinical or commercial deployment.
