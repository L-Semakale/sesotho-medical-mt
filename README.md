# Sesotho Medical MT

**Medical text translation between English and Sesotho — built for healthcare workers and patients in Lesotho.**

>  **Medical Disclaimer:** This is a research prototype. Do not use for clinical diagnosis, treatment decisions, or emergency care. All outputs must be reviewed by qualified bilingual or medical personnel before real-world use.

---

## 🔗 Links

| | |
|---|---|
| **GitHub Repository** | https://github.com/L-Semakale/sesotho-medical-mt |
| **Video Demo** | https://youtu.be/IUWbhWTxlg0 |

---

##  App Interfaces

### Translator — User View
Medical disclaimer visible on load. Users can translate, view history, submit feedback, and complete usability testing.

![Translator Interface](docs/screenshots/01_translator.png)

---

### Admin Dashboard — Evaluation Metrics
Live BLEU, chrF++, and TER scores from the held-out medical test set. Accessible to admin accounts only.

![Admin Dashboard](docs/screenshots/02_evaluation.png)

---

##  Designs

### Figma Mockups
> Add your Figma link here:  
> [View Figma Mockups](https://figma.com/your-link-here)

### UI Screenshots
All interface screenshots are in `docs/screenshots/`.

| Screen | File |
|---|---|
| Translator (User) | `docs/screenshots/01_translator.png` |
| Evaluation Dashboard (Admin) | `docs/screenshots/02_evaluation.png` |

---

##  Environment Setup

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.10 or higher |
| Node.js | 18 or higher |
| pip | Latest |
| Git | Latest |

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/L-Semakale/sesotho-medical-mt.git
cd sesotho-medical-mt

# 2. Create and activate virtual environment
python -m venv venv

# Windows PowerShell
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install Python dependencies
pip install -r backend/requirements.txt

# 4. Start the backend server
cd backend
python app.py
```

Backend runs at **http://localhost:5000**

The fine-tuned NLLB model loads automatically from `models/nllb-finetuned-sesotho/` on startup. Expected startup output:

```
  FAISS index built — 5,000 rows
  Translation pipeline ready:
  Layer 1 → Exact corpus match
  Layer 2 → Semantic similarity (FAISS + Sentence Transformers)
  Layer 3 → NLLB-200 neural translation
  Safety  → High-risk term detection active
 * Running on http://127.0.0.1:5000
```

---

### Frontend Setup

```bash
# From the project root
cd frontend
npm install
npm start
```

Frontend runs at **http://localhost:3000**

---

### Default Admin Account

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `Admin@MT2025` |

> Change this password before any shared or public deployment.

---

##  Deployment Plan

### Current State
The system runs locally as a development prototype.

### Recommended Production Stack

| Layer | Recommended Tool | Reason |
|---|---|---|
| Backend hosting | **Railway** or **Render** | Free tier, supports Python/Flask, easy GitHub deploy |
| Frontend hosting | **Vercel** | Zero-config React deployment, free tier |
| Database | **SQLite → PostgreSQL** | Migrate `system.db` to PostgreSQL for concurrent users |
| Model serving | **Hugging Face Inference API** or self-hosted | Offload NLLB GPU inference from app server |
| Reverse proxy | **Nginx** | Route frontend ↔ backend traffic |
| Process manager | **Gunicorn** | Replace Flask dev server for production |

### Deployment Steps (Backend — Render/Railway)

```bash
# 1. Add a Procfile to backend/
echo "web: gunicorn app:app" > backend/Procfile

# 2. Set environment variables on the platform
FLASK_ENV=production
SECRET_KEY=your-secret-key

# 3. Push to GitHub — platform auto-deploys on push
git push origin main
```

### Deployment Steps (Frontend — Vercel)

```bash
# From the frontend directory
npm run build
# Then connect the GitHub repo to Vercel — it detects React automatically
```

### Environment Variable Reference

| Variable | Purpose |
|---|---|
| `FLASK_ENV` | Set to `production` to disable debug mode |
| `SECRET_KEY` | Flask session signing key |
| `DATABASE_URL` | PostgreSQL connection string (if migrating from SQLite) |

---

##  Code Files

### Project Structure

```
sesotho-medical-mt/
├── backend/
│   ├── app.py                      # Flask API — all routes and endpoints
│   ├── database.py                 # Database schema, queries, init
│   ├── nllb_translator.py          # NLLB-200 translation engine (3-layer pipeline)
│   ├── safety.py                   # High-risk medical term detection
│   ├── usability.py                # SUS score collection and storage
│   ├── requirements.txt            # Python dependencies
│   └── data/
│       ├── medical_corpus.csv      # 5,000 English–Sesotho verified pairs
│       └── system.db               # SQLite — users, history, feedback, SUS
├── models/
│   ├── nllb-600M/                  # Base NLLB-200 model weights
│   └── nllb-finetuned-sesotho/     # Fine-tuned model weights (loaded by default)
├── frontend/
│   └── src/                        # React.js application source
├── notebook/
│   └── 01_data_eval_model.ipynb    # Data preparation & model evaluation
├── docs/
│   └── screenshots/                # UI screenshots
├── research_archive/               # Training data, evaluation scripts, results
└── README.md
```

---

### Key Backend Files

#### `app.py` — API Routes

| Route | Method | Description |
|---|---|---|
| `/api/translate` | POST | Main translation endpoint |
| `/api/history` | GET | User translation history |
| `/api/feedback` | POST | Submit translation feedback |
| `/api/sus` | POST | Submit SUS usability score |
| `/api/admin/metrics` | GET | BLEU, chrF++, TER scores (admin only) |
| `/api/admin/users` | GET | User list (admin only) |

#### `nllb_translator.py` — Translation Pipeline

```
Input text
    │
    ├── Layer 1: Exact match → medical_corpus.csv
    │               ↓ hit → return verified_corpus
    │
    ├── Layer 2: FAISS semantic search (threshold: 0.88)
    │               ↓ hit → return verified_corpus
    │
    └── Layer 3: Fine-tuned NLLB-200 (nllb-finetuned-sesotho)
                    ↓ → safety filter → return nllb_model
```

#### `safety.py` — Safety Filter
Scans all Layer 3 outputs for high-risk medical terms before returning to the user. Flags outputs that require human review.

#### `database.py` — Schema

| Table | Contents |
|---|---|
| `users` | Accounts, roles, hashed passwords |
| `translations` | Full history — input, output, direction, model, timestamp |
| `feedback` | Per-translation user feedback |
| `usability_feedback` | SUS scores and responses |

---

### `requirements.txt`

```
flask
flask-cors
transformers
torch
sentencepiece
faiss-cpu
sentence-transformers
pandas
sacrebleu
```

---

##  Translation API — Quick Reference

**Endpoint:** `POST http://localhost:5000/api/translate`

**Request:**
```json
{
  "text": "Take this medication twice a day",
  "direction": "en-st",
  "username": "admin"
}
```

**Response:**
```json
{
  "input_text": "Take this medication twice a day",
  "translated_text": "noa meriana ena habeli ka letsatsi",
  "direction_label": "English → Sesotho",
  "model": "nllb_model",
  "safety": {
    "is_high_risk": false,
    "detected_terms": [],
    "requires_review": false,
    "warning": null
  }
}
```

| Field | Values |
|---|---|
| `direction` | `"en-st"` English → Sesotho · `"st-en"` Sesotho → English |
| `model` | `"verified_corpus"` · `"nllb_model"` |
| `safety.is_high_risk` | `true` if dangerous medical terms detected in output |

---

##  Limitations

- CPU inference only — Layer 3 translations take 3–8 seconds per sentence
- Corpus covers 5,000 pairs across 7 medical domains — unseen phrases rely on neural generation
- Not validated for clinical use — all outputs require human review before real-world application
- 6 SUS participants — sufficient for proof-of-concept, not for generalised usability claims

---

##  License

Research prototype developed for academic purposes.  
Not licensed for clinical or commercial deployment.
