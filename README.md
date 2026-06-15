# Sesotho–English Medical Translation Prototype

A proof-of-concept web app that translates short medical phrases between
Sesotho and English using the open-weight NLLB-200 model.

 **Repo:** https://github.com/L-Semakale/sesotho-medical-mt
 **Demo video:** docs/demo.mp4

## Tools & Stack
| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | React.js                    |
| Backend    | Flask (REST API)            |
| Model      | NLLB-200-distilled-600M     |
| ML libs    | Hugging Face Transformers, PyTorch |
| Evaluation | SacreBLEU (BLEU, chrF++, TER)|
| Database   | SQLite                      |

## Setup

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
python app.py        # runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm start            # runs on http://localhost:3000
```

### Notebook
Open `notebook/01_data_eval_model.ipynb` in Jupyter or Google Colab and run all cells.

## Deployment Plan
- **Backend:** Render (free web service) or Hugging Face Spaces
- **Frontend:** Vercel or Netlify
- **Model:** Loaded from Hugging Face Hub at runtime (or cached locally for offline)
