# Sesotho Medical Machine Translation System

A proof-of-concept web application that translates **medical English text into Sesotho (Southern Sotho)**
to support clear communication between healthcare workers and patients in Lesotho.

> **Track:** FullStack Development
> **Status:** Initial MVP — NLLB-200 neural translation integrated and evaluated

---

## Repository

**GitHub Repo:** https://github.com/L-Semakale/sesotho-medical-mt
**Video Demo:** [Watch the demo here](https://youtu.be/IUWbhWTxlg0)

---

## Description

Many patients in Sesotho-speaking regions struggle to understand medical instructions given in English.
This system bridges that gap using **NLLB-200**, Meta's open-weight multilingual neural machine
translation model, fine-tuned for the medical domain via a curated bilingual corpus.

The application is powered by a bilingual medical corpus of **4,200 collected English–Sesotho sentence
pairs** (100 human-verified for evaluation), covering the most common healthcare communication needs.

### Medical Domains Covered

- HIV / AIDS
- Tuberculosis (TB)
- Symptoms & Complaints
- Medication Instructions
- Maternal & Child Health
- Appointments & Follow-up
- General Patient Education

### How Translation Works

1. User submits English (or Sesotho) medical text
2. App checks the **verified corpus cache** first — instant return for known phrases
3. If not cached, **NLLB-200** (`facebook/nllb-200-distilled-600M`) performs live neural translation
4. Response includes the translation and its source (`verified_corpus` or `nllb_model`)
5. Every translation is logged to history with the model used

---

##  Model Evaluation

NLLB-200 was evaluated on a 100-pair held-out test set drawn from the medical corpus.
References are LLM-assisted translations; a 100-pair human-verified gold set is in progress.

| Metric | Score | Interpretation |
|--------|-------|----------------|
| **BLEU** | **27.01** | Above 20 = understandable to good translation (strong for Sesotho) |
| **chrF++** | **49.15** | Headline metric — character-level, suited to Sesotho morphology |
| **TER** | **60.67** | ~60% editing effort — expected baseline for low-resource MT |

> chrF++ is the primary metric as it handles Sesotho's agglutinative morphology better than BLEU.
> Full results: `backend/data/evaluation_results.txt`
> Side-by-side examples: `backend/data/evaluation_examples.csv`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML, CSS, JavaScript |
| **Backend** | Python 3.10+, Flask |
| **Database** | SQLite (`system.db`) |
| **Translation Engine** | NLLB-200 (`facebook/nllb-200-distilled-600M`) via HuggingFace Transformers |
| **Corpus** | `medical_corpus.csv` — 4,200 English–Sesotho medical pairs |
| **Evaluation** | SacreBLEU (BLEU, chrF++, TER) |
| **Version Control** | Git & GitHub |

---

## Environment Setup & Installation

### Prerequisites

- Python 3.10 or higher
- Git
- pip

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/L-Semakale/sesotho-medical-mt.git
cd sesotho-medical-mt

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows PowerShell
source venv/bin/activate     # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Download the NLLB-200 model (run ONCE — downloads ~2.5GB)
cd backend
python download_model.py

# 5. Start the backend server
python app.py
```

### Access the Application

```
http://127.0.0.1:5000
```

> **Note:** The NLLB-200 model (~2.5GB) is not stored in this repository.
> Run `download_model.py` once after cloning to cache it locally in `backend/models/`.
> On first translation request, the model loads into memory (~30 seconds).

---

## Database Schema

### Table: `medical_corpus` (CSV + SQLite mirror)

| Column | Type | Description |
|---|---|---|
| `sentence_id` | INTEGER | Unique identifier (Primary Key) |
| `domain_category` | TEXT | Medical domain (HIV, TB, Medication, etc.) |
| `english_text` | TEXT | Source sentence in English |
| `sesotho_text` | TEXT | Translated sentence in Sesotho |
| `source` | TEXT | Origin of the pair (manual / LLM-assisted) |
| `reviewer_status` | TEXT | `raw` / `translated` / `reviewed` / `verified` / `rejected` |
| `notes` | TEXT | Reviewer annotations |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/translate` | Translate text (en→st or st→en) |
| `GET` | `/api/history` | Retrieve translation history |
| `GET` | `/api/corpus` | List all corpus entries |
| `GET` | `/api/stats` | Corpus statistics and status counts |
| `PUT` | `/api/corpus/<id>` | Update a corpus entry |
| `POST` | `/api/register` | Register a new user |
| `POST` | `/api/login` | Authenticate a user |
| `POST` | `/api/feedback` | Submit translation feedback |

### Example Request

```json
POST /api/translate
{
  "text": "The patient must avoid alcohol while taking this medicine.",
  "direction": "en-st",
  "username": "demo_user"
}
```

### Example Response

```json
{
  "input_text": "The patient must avoid alcohol while taking this medicine.",
  "direction": "en-st",
  "direction_label": "English → Sesotho",
  "translated_text": "Mokuli o lokela ho qoba joala ha a ntse a noa moriana ona.",
  "model": "nllb_model"
}
```

---

## Project Structure

```
sesotho-medical-mt/
├── backend/
│   ├── app.py                  # Flask API — all routes
│   ├── nllb_translator.py      # NLLB-200 neural translation engine
│   ├── download_model.py       # One-time model download script
│   ├── database.py             # DB initialisation helpers
│   ├── translator.py           # Legacy CSV lookup (kept for reference)
│   ├── requirements.txt        # Python dependencies
│   └── data/
│       ├── medical_corpus.csv          # Master bilingual corpus (4,200 pairs)
│       ├── evaluation_results.txt      # BLEU / chrF++ / TER scores
│       └── evaluation_examples.csv    # Side-by-side translation examples
├── frontend/
│   └── index.html              # Single-page UI
├── notebook/
│   └── 01_data_eval_model.ipynb  # Data prep & evaluation notebook
├── docs/                       # Proposal and supporting documents
├── .gitignore
└── README.md
```

---

## Deployment Plan

### Current (MVP)
Local Flask development server for demonstration.

### Production (Next Phase)

| Component | Platform |
|---|---|
| Backend | Render / Railway (free tier) |
| Database | SQLite → PostgreSQL |
| Model | Loaded from HuggingFace on startup |
| Domain & HTTPS | Render-managed SSL |
