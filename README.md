# Sesotho Medical MT 

A bilingual English–Sesotho medical translation web application designed to
bridge the language gap in Lesotho's healthcare system.

>  **Medical Disclaimer:** This is a research prototype. It is not intended
> for clinical diagnosis, treatment decisions, or emergency care. All outputs
> must be reviewed by qualified healthcare personnel.

---

##  Links

| Resource | URL |
|---|---|
| Live App | https://sesotho-medical-mt.vercel.app |
| Demo Video | https://youtu.be/Q8Cm0FbNWYQ |
| Fine-tuned Model | https://huggingface.co/Limpho/nllb-finetuned-sesotho |
| Backend API | https://limpho-sesotho-medical-backend.hf.space |

---

##  Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/L-Semakale/sesotho-medical-mt.git
cd sesotho-medical-mt
```

### 2. Backend Setup (Flask)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `/backend`:
```
FLASK_ENV=development
```

Start the Flask server:
```bash
python app.py
```
Backend runs at → `http://127.0.0.1:5000`

---

### 3. Frontend Setup (React)

```bash
cd frontend
npm install
```

Create a `.env.local` file inside `/frontend`:
```
REACT_APP_API_URL=http://127.0.0.1:5000
```

Start the React app:
```bash
npm start
```
Frontend runs at → `http://localhost:3000`

---

##  Project Structure

```
sesotho-medical-mt/
├── backend/
│   ├── app.py                  # Flask API & translation pipeline
│   ├── nllb_translator.py      # NLLB-600M model wrapper
│   ├── safety.py               # High-risk term detection
│   ├── requirements.txt
│   └── data/
│       └── medical_corpus.csv  # 5,000 verified sentence pairs
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Translator.jsx  # Core translation UI
│   │   │   ├── History.jsx
│   │   │   └── AdminDashboard.jsx
│   │   └── config.js           # API base URL
│   └── package.json
└── README.md
```
## Screenshots

The following screenshots are available in the project documentation folder.

| Screen | File Path |
|---|---|
| Layer 1 — Corpus Match | `docs/screenshots/layer1-corpus-match.png` |
| Layer 2 — Semantic Search | `docs/screenshots/layer2-semantic-search.png` |
| Layer 3 — Neural Translation | `docs/screenshots/layer3-neural.png` |
| Safety Filter Triggered | `docs/screenshots/safety-filter-triggered.png` |
| Admin Dashboard | `docs/screenshots/admin-dashboard.png` |
| Translation History | `docs/screenshots/translation-history.png` |
| SUS Usability Feedback | `docs/screenshots/sus-feedback.png` |

---

##  Translation Pipeline

| Layer | Method | Trigger |
|---|---|---|
| Layer 1 | Exact corpus match | Input found verbatim in corpus |
| Layer 2 | Semantic search (FAISS) | Paraphrased but similar input |
| Layer 3 | NLLB-600M neural model | Unseen medical input |

---

##  Performance Metrics

| Metric | Score |
|---|---|
| BLEU | 34.2 |
| chrF++ | 57.8 |
| TER | 0.61 |
| SUS Usability | 78.4 / 100 |

---