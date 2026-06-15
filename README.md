# Sesotho Medical Machine Translation System

A proof-of-concept web application that translates **medical text between English and Sesotho
(Southern Sotho)** to support clear communication between healthcare workers and patients in Lesotho.

> **Track:** BSc. Software Engineering — Capstone Project
> **Status:** Proof-of-Concept Prototype — NLLB-200 evaluated · SUS usability testing completed

---

## Repository & Demo

**GitHub Repo:** https://github.com/L-Semakale/sesotho-medical-mt
**Video Demo:** [Watch the demo here](https://youtu.be/IUWbhWTxlg0)

---

## Description

Many patients in Sesotho-speaking regions struggle to understand medical instructions given in English.
This system bridges that gap using a **dual-path translation architecture**:

1. **Verified corpus cache** — exact matches against 5,000 human-reviewed medical phrase pairs
   are returned instantly without calling the model.
2. **NLLB-200 neural translation** — phrases not found in the corpus are translated by
   `facebook/nllb-200-distilled-600M`, Meta's open-weight multilingual model supporting
   200 languages including Sesotho (`sot_Latn`).

This design prioritises safety for high-frequency medical phrases while preserving broad
translation coverage for novel inputs.

> ⚠️ **Medical Disclaimer:** This is a proof-of-concept research prototype.
> It must not be used for clinical diagnosis, treatment decisions, or as a replacement
> for professional medical interpretation.

---

## Medical Domains Covered

| Domain | Sentence Pairs |
|---|---|
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

1. User signs in and submits a medical phrase (English or Sesotho)
2. Backend checks the **verified corpus cache** — instant return for known phrases
3. If not cached, **NLLB-200** performs live neural translation
4. Response includes the translation and its source (`verified_corpus` or `nllb_model`)
5. Every translation is logged to history with timestamp and model used

---

## Model Evaluation

NLLB-200 was evaluated in **zero-shot mode** on a 100-pair held-out medical test set
using SacreBLEU. No fine-tuning was applied — see rationale below.

| Metric | Score | Interpretation |
|---|---|---|
| **BLEU** | **27.01** | Above 20 = understandable; strong for low-resource Sesotho MT |
| **chrF++** ⭐ | **49.15** | **Primary metric** — character-level, suited to Sesotho morphology |
| **TER** | **60.67** | ~60% editing effort — expected baseline for low-resource MT |

> ⭐ chrF++ is the primary metric because Sesotho is morphologically rich.
> Character-level matching captures partial word matches that BLEU misses.

Full results: `backend/data/evaluation_results.txt`
Side-by-side examples: `backend/data/evaluation_examples.csv`

### Why No Fine-Tuning?

| Reason | Detail |
|---|---|
| Dataset size | 5,000 pairs is well below the 50,000+ needed for stable fine-tuning |
| Hardware | ~16GB VRAM required — exceeds available resources |
| Risk | Fine-tuning on insufficient data risks catastrophic forgetting |

Instead, two lightweight domain adaptation strategies were used:
- **Retrieval-based phrase cache** — verified corpus pairs returned without calling the model
- **Domain-specific evaluation** — model benchmarked exclusively on medical text

This approach is consistent with Saunders (2022) on lightweight domain adaptation in NMT.

### Qualitative Error Analysis

10 NLLB-200 outputs were manually reviewed and classified by severity:

| Severity | Count | % of Sample |
|---|---|---|
| None (medically safe) | 6 | 60% |
| Minor | 3 | 30% |
| **CRITICAL** | **1** | **10%** |

> ⚠️ **Critical Finding:** NLLB-200 hallucinated **"lethal dose"** from **"missed dose"**
> in one output. This directly justifies the dual-path architecture — the verified corpus
> cache intercepts high-frequency medical phrases before the model is called.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js |
| **Backend** | Python 3.10+, Flask |
| **Database** | SQLite (`system.db`) |
| **Translation Engine** | NLLB-200 (`facebook/nllb-200-distilled-600M`) via HuggingFace Transformers |
| **ML Framework** | PyTorch |
| **Corpus** | `medical_corpus.csv` — 5,000 English–Sesotho medical pairs |
| **Evaluation** | SacreBLEU (BLEU, chrF++, TER) |
| **Data Processing** | Pandas |
| **Notebook** | Jupyter / Google Colab |
| **Version Control** | Git & GitHub |

---

## Screenshots

### 👤 User View — Translator
> Medical disclaimer visible on load. Tabs for Translate, History, Usability, and Feedback.

![User Dashboard — Translator](docs/screenshots/01_translator.png)

---

### 🔐 Admin View — Evaluation Metrics
> Real BLEU, chrF++, and TER scores from NLLB-200 evaluated on the 100-pair held-out medical test set.
> Corpus goal of 5,000 sentence pairs displayed in the header.

![Admin Dashboard — Evaluation Metrics](docs/screenshots/02_evaluation.png)

## Environment Setup & Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Git
- pip

### Backend Setup

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

# 4. Download the NLLB-200 model (run ONCE — downloads ~2.5 GB)
cd backend
python download_model.py

# 5. Start the backend server
python app.py
```

### Frontend Setup

```bash
# In a new terminal from the project root
cd frontend
npm install
npm start
```

### Access the Application

| Service | URL |
|---|---|
| React frontend | http://localhost:3000 |
| Flask backend API | http://127.0.0.1:5000 |

> **Note:** The NLLB-200 model (~2.5 GB) is not stored in this repository.
> Run `download_model.py` once after cloning to cache it locally in `backend/models/`.
> On first translation request, the model loads into memory (~30 seconds).

---

## Database Schema

### `users`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key |
| `username` | TEXT | Unique username |
| `password_hash` | TEXT | Hashed password |
| `role` | TEXT | `user` or `admin` |

### `medical_corpus` (CSV + SQLite mirror)
| Column | Type | Description |
|---|---|---|
| `sentence_id` | INTEGER | Unique identifier |
| `domain_category` | TEXT | HIV / TB / Medication / Symptoms / Appointments / Maternal / General |
| `english_text` | TEXT | Source sentence in English |
| `sesotho_text` | TEXT | Translated sentence in Sesotho |
| `source` | TEXT | Origin of the pair |
| `source_reference` | TEXT | URL or document name |
| `translator_code` | TEXT | Anonymous translator identifier |
| `reviewer_status` | TEXT | `raw` / `translated` / `reviewed` / `verified` / `rejected` |
| `notes` | TEXT | Reviewer annotations |

### `history`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key |
| `username` | TEXT | User who made the request |
| `input_text` | TEXT | Source phrase |
| `direction` | TEXT | `en-st` or `st-en` |
| `direction_label` | TEXT | Human-readable direction |
| `translated_text` | TEXT | Translation output |
| `model` | TEXT | `verified_corpus` or `nllb_model` |
| `created_at` | TEXT | Timestamp |

### `usability_feedback`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key |
| `username` | TEXT | Anonymous participant identifier |
| `q1`–`q10` | INTEGER | SUS question responses (1–5 Likert scale) |
| `sus_score` | REAL | Calculated SUS score (0–100) |
| `comment` | TEXT | Optional qualitative comment |
| `created_at` | TEXT | Timestamp |

### `feedback`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key |
| `username` | TEXT | Submitting user |
| `rating` | TEXT | Rating value |
| `comment` | TEXT | Feedback text |
| `created_at` | TEXT | Timestamp |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Register a new user |
| `POST` | `/api/login` | Authenticate a user |
| `POST` | `/api/translate` | Translate text (en→st or st→en) |
| `GET` | `/api/history` | Retrieve translation history |
| `GET` | `/api/corpus` | List all corpus entries |
| `GET` | `/api/stats` | Corpus statistics and domain counts |
| `PUT` | `/api/corpus/<id>` | Update a corpus entry (admin) |
| `POST` | `/api/feedback` | Submit translation feedback |
| `GET` | `/api/feedback` | Retrieve all feedback (admin) |
| `POST` | `/api/sus` | Submit SUS usability evaluation |
| `GET` | `/api/sus` | Retrieve SUS results and average score (admin) |

### Example: Translate Request

```json
POST /api/translate
{
  "text": "The patient must avoid alcohol while taking this medicine.",
  "direction": "en-st",
  "username": "demo_user"
}
```

### Example: Translate Response

```json
{
  "input_text": "The patient must avoid alcohol while taking this medicine.",
  "direction": "en-st",
  "direction_label": "English → Sesotho",
  "translated_text": "Mokuli o lokela ho qoba joala ha a ntse a noa moriana ona.",
  "model": "nllb_model"
}
```

### Example: SUS Submission

```json
POST /api/sus
{
  "username": "participant_01",
  "responses": {"1": 4, "2": 2, "3": 5, "4": 1, "5": 4,
                "6": 2, "7": 5, "8": 1, "9": 4, "10": 2},
  "sus_score": 82.5,
  "comment": "Easy to use. Translation was fast."
}
```

---

## Usability Evaluation

Prototype usability was evaluated using the **System Usability Scale** (Brooke, 1996),
a validated 10-item questionnaire scored 0–100.

| Metric | Target | Result |
|---|---|---|
| Participants | 5–10 purposively selected users | — |
| Minimum acceptable SUS score | 65 / 100 | — |
| Sampling method | Purposive — Sesotho-speaking or bilingual users | — |

> SUS results are stored in `usability_feedback` table and accessible via `GET /api/sus`.
> Participants were not asked to provide personal medical information.
> All feedback is stored anonymously.

---

## Dataset Split

The corpus was split for model evaluation and optional adaptation experiments:

| Split | Size | Purpose |
|---|---|---|
| Training set | 4,000 pairs (80%) | Lightweight adaptation experiments |
| Validation set | 500 pairs (10%) | Model selection |
| Test set | 500 pairs (10%) | Final evaluation |

Split files: `backend/data/train_set.csv`, `validation_set.csv`, `test_set.csv`
Split script: `notebook/01_data_eval_model.ipynb` — final cell

---

## Project Structure

```
sesotho-medical-mt/
├── backend/
│   ├── app.py                      # Flask API — all routes
│   ├── nllb_translator.py          # NLLB-200 neural translation engine
│   ├── download_model.py           # One-time model download script
│   └── data/
│       ├── medical_corpus.csv          # Master bilingual corpus (5,000 pairs)
│       ├── train_set.csv               # 80% training split
│       ├── validation_set.csv          # 10% validation split
│       ├── test_set.csv                # 10% test split
│       ├── evaluation_examples.csv     # 100-pair held-out test set
│       └── evaluation_results.txt      # BLEU / chrF++ / TER scores
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.js                      # Root component — auth routing
│       ├── App.css                     # Global styles
│       ├── index.js                    # React entry point
│       └── components/
│           ├── Login.js                # Authentication form
│           ├── UserDashboard.js        # User view — tabs
│           ├── AdminDashboard.js       # Admin view — tabs
│           ├── Translator.js           # Translation interface
│           ├── History.js              # Translation history
│           ├── SUSForm.js              # SUS usability questionnaire
│           ├── EvaluationPanel.js      # Model evaluation results
│           ├── CorpusDashboard.js      # Corpus management (admin)
│           ├── FeedbackViewer.js       # Feedback viewer
│           └── Disclaimer.js          # Medical disclaimer banner
├── notebook/
│   └── 01_data_eval_model.ipynb        # Data analysis, evaluation, dataset split
├── docs/                               # Proposal and supporting documents
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Deployment Plan

### Current (MVP)
Local Flask backend + React development server for demonstration.

### Production (Next Phase)

| Component | Platform |
|---|---|
| Backend | Render / Railway (free tier) |
| Frontend | Vercel / Netlify |
| Database | SQLite → PostgreSQL |
| Model | Loaded from HuggingFace on startup |
| Domain & HTTPS | Render-managed SSL |

---

## References

- Costa-jussà et al. (2022) — NLLB-200: No Language Left Behind
- Papineni et al. (2002) — BLEU metric
- Popović (2017) — chrF++ metric
- Snover et al. (2006) — TER metric
- Saunders (2022) — Domain adaptation in NMT
- Brooke (1996) — System Usability Scale
- Nekoto et al. (2020) — Participatory African language MT
- Liu et al. (2020) — mBART multilingual pre-training