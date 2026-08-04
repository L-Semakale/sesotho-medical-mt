# Sesotho Medical Machine Translation System

## Project Overview

The **Sesotho Medical Machine Translation System** is a proof-of-concept bilingual medical translation web application designed to support healthcare-related translation between **English and Sesotho**.

Healthcare communication in Lesotho is often affected by a language barrier. Many patients speak Sesotho as their main everyday language, while clinical records, medication labels, treatment instructions, referral notes, discharge instructions, consent information, and health guidelines are commonly written in English. This project addresses that gap by providing a specialized medical translation prototype for healthcare communication and research.

The system uses a **three-layer hybrid translation pipeline** to improve transparency, reduce reliance on unconstrained neural generation, and support safer translation in the medical domain:

1. **Exact Corpus Match**
2. **Semantic Similarity Search**
3. **Fine-tuned Neural Machine Translation using NLLB-200**

A medical safety filter is included to flag high-risk terms and provide warnings where professional clinical review is required.

> **Corpus Note:** The project uses a 5,000-pair curated English–Sesotho medical corpus. Of these pairs, 4,536 were reviewed, 459 remained raw, and 5 reached full clinical verification status. The corpus is therefore suitable for proof-of-concept research but should not be treated as a fully clinically verified medical translation resource.

> **Medical Disclaimer:** This system is a proof-of-concept research prototype. It is not a certified medical device and must not be used as the sole basis for diagnosis, treatment, medication dosing, emergency care, or clinical decision-making. All translations should be reviewed by a qualified bilingual healthcare professional before clinical use.

---

## Key Features

- English-to-Sesotho and Sesotho-to-English interface support
- Three-layer hybrid translation pipeline
- Curated and reviewed medical corpus lookup
- Semantic similarity search using Sentence Transformers and FAISS
- Fine-tuned NLLB-200 neural machine translation
- Medical safety filter for high-risk terms
- Translation history storage
- User feedback collection
- System Usability Scale (SUS) feedback support
- Admin dashboard for system statistics
- React frontend
- Flask backend API
- SQLite database for local prototype storage

---

## Translation Pipeline

The system processes each translation request using three layers.

| **Layer** | **Method** | **Description** |
|---|---|---|
| **Layer 1** | Exact Corpus Match | Checks whether the input sentence exists in the curated and reviewed English–Sesotho medical corpus. |
| **Layer 2** | Semantic Search | Uses Sentence Transformers and FAISS to find the closest reviewed corpus translation. |
| **Layer 3** | Neural Translation | Uses the NLLB-200 distilled 600M model fine-tuned for medical English–Sesotho translation. |

---

### Layer 1: Exact Corpus Match

The system first checks the input against a curated and reviewed medical corpus.

If an exact match is found, the system returns the corresponding reviewed Sesotho translation.

This layer is prioritized because reviewed corpus translations are more transparent and controlled than generated translations.

---

### Layer 2: Semantic Similarity Search

If no exact match is found, the system uses semantic search.

The sentence is encoded using a Sentence Transformer model and compared against the corpus using FAISS.

If the similarity score is above the configured threshold, the system returns the closest reviewed corpus translation.

In the project report, the semantic similarity threshold was set to **0.88** to prioritize precision over recall in a medical context.

---

### Layer 3: Neural Machine Translation

If the first two layers do not return a confident match, the system uses a neural machine translation model.

The base model used for fine-tuning is:

```text
facebook/nllb-200-distilled-600M
```

The project fine-tunes this base model on English–Sesotho medical translation data to improve performance in healthcare-related contexts.

In the deployed prototype, the fine-tuned checkpoint may be loaded from a project-specific Hugging Face model repository, depending on the deployment configuration.

If available, the fine-tuned model checkpoint can be documented here:

```text
Fine-tuned model: Add Hugging Face model link here if publicly available
```

---

## Safety Filter

Medical translation is high-risk. To reduce harm, the system includes a safety filter that detects predefined high-risk medical terms.

Examples of flagged terms include:

```text
morphine, fentanyl, insulin, warfarin, overdose, toxic dose,
lethal dose, contraindicated, anaphylaxis, suicide, self-harm
```

When a high-risk term is detected, the system displays a warning message advising the user to seek professional medical review.

The safety filter is intended as an additional guardrail. It does not replace clinical judgment.

### Safety Filter Limitations

The current safety filter is strongest for English medical terms and internationally recognized drug names. If a high-risk term is fully translated or paraphrased into Sesotho, the filter may not always detect it.

Future versions should expand the safety lexicon to include:

- Sesotho medical equivalents
- Spelling variants
- Drug classes
- Dosage patterns
- Emergency symptom phrases
- Locally used clinical terminology

---

## Evaluation Results

The system was evaluated using automatic translation metrics, human evaluation, and usability testing.

### Automatic Translation Evaluation

The fine-tuned model was evaluated against the base NLLB-200 model on a held-out English–Sesotho medical test set.

| **Metric** | **Base NLLB-200** | **Fine-Tuned Model** | **Improvement** |
|---|---:|---:|---:|
| **BLEU** | 27.01 | **50.41** | +23.40 |
| **chrF++** | 49.15 | **65.89** | +16.74 |
| **TER** | 60.67 | **36.78** | -23.89 |

BLEU and chrF++ measure translation similarity to reference translations, where higher scores indicate better performance.

TER measures the amount of editing required to match the reference translation, where lower scores indicate better performance.

### Human Evaluation

Five Sesotho-proficient evaluators reviewed translations using a 1–5 scale.

| **Category** | **Average Score** |
|---|---:|
| Adequacy | 4.30 |
| Fluency | 4.18 |
| Medical Accuracy | 4.04 |

The human evaluation results should be interpreted as proof-of-concept evidence rather than statistically conclusive clinical validation.

### Usability Evaluation

The application achieved a System Usability Scale score of:

```text
78.4 / 100
```

This falls within the **Good** usability band.

---

## Repository Structure

```text
sesotho-medical-mt/
│
├── backend/
│   ├── app.py
│   ├── nllb_translator.py
│   ├── safety.py
│   ├── database.py
│   ├── usability.py
│   ├── requirements.txt
│   ├── translations.db
│   └── data/
│       ├── medical_corpus.csv
│       ├── train_set.csv
│       ├── validation_set.csv
│       └── test_set.csv
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── components/
│   │       ├── Translator.js
│   │       ├── EvaluationPanel.js
│   │       ├── History.js
│   │       ├── AdminDashboard.js
│   │       ├── SUSForm.js
│   │       ├── PrivacyPolicy.js
│   │       └── Disclaimer.js
│   └── package.json
│
├── notebooks/
│   ├── 00_training_log.ipynb
│   ├── 01_data_eval_model.ipynb
│   ├── 02_human_evaluation.ipynb
│   └── 03_google_translate_comparison.ipynb
│
├── README.md
└── .gitignore
```
---

## Prerequisites

Before running the project, install the following tools.

### Required Software

| **Tool** | **Version** | **Purpose** |
|---|---|---|
| Python | 3.9 or higher | Runs the Flask backend and ML pipeline |
| pip | Latest | Installs Python dependencies |
| Node.js | 18 or higher | Runs the React frontend |
| npm | Latest | Installs frontend dependencies |
| Git | Latest | Clones and manages the repository |

### Download Links

- Python: https://www.python.org/downloads/
- Node.js: https://nodejs.org/
- Git: https://git-scm.com/

---

## Hardware Requirements

The project can run on CPU, but neural translation may be slow.

| **Component** | **Minimum** | **Recommended** |
|---|---|---|
| RAM | 4GB | 8GB or higher |
| Storage | 5GB free space | 10GB free space |
| GPU | Not required | CUDA-compatible GPU |
| Internet | Required for model download | Stable broadband connection |

The NLLB model is approximately **2.4GB**, so the first setup may take time depending on internet speed.

---

## Installation and Setup

Follow the steps below to run the project locally.

---

## 1. Clone the Repository

```bash
git clone https://github.com/L-Semakale/sesotho-medical-mt.git
cd sesotho-medical-mt
```

---

## 2. Backend Setup

Navigate to the backend folder.

```bash
cd backend
```

---

### 2.1 Create a Virtual Environment

For Windows, macOS, or Linux:

```bash
python -m venv venv
```

---

### 2.2 Activate the Virtual Environment

For Windows:

```bash
venv\Scripts\activate
```

For macOS/Linux:

```bash
source venv/bin/activate
```

After activation, your terminal should show something similar to:

```text
(venv)
```

---

### 2.3 Install Backend Dependencies

Install all required Python packages.

```bash
pip install -r requirements.txt
```

If `requirements.txt` is missing or incomplete, install the main dependencies manually:

```bash
pip install flask flask-cors pandas numpy torch transformers sentence-transformers faiss-cpu scikit-learn sacrebleu evaluate datasets accelerate
```

---

### 2.4 Download the Base NLLB Translation Model

The project uses Meta AI's NLLB-200 distilled 600M model as the base model.

Run the following command inside the backend environment:

```bash
python -c "from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; model_name='facebook/nllb-200-distilled-600M'; AutoTokenizer.from_pretrained(model_name); AutoModelForSeq2SeqLM.from_pretrained(model_name); print('Model downloaded successfully')"
```

This downloads and caches the model locally.

If your deployment uses a separate fine-tuned checkpoint, update the model path inside the relevant backend configuration or `nllb_translator.py`.

---

### 2.5 Start the Backend Server

Run the Flask backend.

```bash
python app.py
```

If successful, the terminal should show:

```text
* Running on http://127.0.0.1:5000
```

The backend API will now be available at:

```text
http://127.0.0.1:5000
```

---

## 3. Frontend Setup

Open a new terminal window.

Navigate to the frontend folder.

```bash
cd sesotho-medical-mt/frontend
```

If you are already in the project root, run:

```bash
cd frontend
```

---

### 3.1 Install Frontend Dependencies

```bash
npm install
```

---

### 3.2 Start the React Application

```bash
npm start
```

The application should open automatically in your browser.

If it does not open automatically, visit:

```text
http://localhost:3000
```

---

## Running the Full System Locally

To run the complete system:

1. Open Terminal 1.
2. Start the backend.

For macOS/Linux:

```bash
cd backend
source venv/bin/activate
python app.py
```

For Windows:

```bash
cd backend
venv\Scripts\activate
python app.py
```

3. Open Terminal 2.
4. Start the frontend.

```bash
cd frontend
npm start
```

5. Open the web application:

```text
http://localhost:3000
```

---

## Supported Translation Directions

The project is restricted to English–Sesotho translation directions only.

| **Direction Code** | **Description** |
|---|---|
| `en-st` | English to Sesotho |
| `st-en` | Sesotho to English |

Unsupported language directions should be rejected by the application.

The formal quantitative and human evaluation in the report focused on **English-to-Sesotho** translation.

---

## API Endpoints

The Flask backend exposes several API endpoints.

---

### `POST /translate`

Translates medical text between the supported directions:

- English to Sesotho
- Sesotho to English

The formal evaluation in the report focused on English-to-Sesotho translation.

#### Request Body

```json
{
  "text": "Take this medicine twice a day",
  "direction": "en-st"
}
```

#### Example Response

```json
{
  "translation": "Nwa moriana ona habeli ka letsatsi",
  "source": "corpus_exact",
  "flagged": false,
  "warning": null
}
```

#### Possible Source Values

| **Source** | **Meaning** |
|---|---|
| `corpus_exact` | Translation came from the curated/reviewed corpus |
| `semantic_search` | Translation came from semantic similarity search |
| `neural` | Translation came from the NLLB neural model |

---

### `POST /feedback`

Stores user feedback for a translation.

#### Request Body

```json
{
  "translation_id": 1,
  "rating": 4,
  "comment": "The translation was accurate but slightly formal."
}
```

#### Example Response

```json
{
  "message": "Feedback saved successfully"
}
```

---

### `POST /sus-feedback`

Stores System Usability Scale feedback.

#### Request Body

```json
{
  "responses": [4, 3, 4, 2, 5, 2, 4, 2, 5, 1]
}
```

#### Example Response

```json
{
  "sus_score": 78.4,
  "message": "SUS feedback saved successfully"
}
```

---

### `GET /history`

Returns recent translation history.

#### Example Response

```json
[
  {
    "id": 1,
    "input_text": "Take this medicine twice a day",
    "translation": "Nwa moriana ona habeli ka letsatsi",
    "source": "corpus_exact",
    "created_at": "2026-07-07 12:30:00"
  }
]
```

---

### `GET /admin/stats`

Returns summary statistics for the admin dashboard.

#### Example Response

```json
{
  "total_translations": 284,
  "flagged_count": 12,
  "corpus_hits": 198,
  "semantic_hits": 12,
  "neural_hits": 74,
  "average_sus_score": 78.4
}
```

---

## Running Tests

If the repository includes a test folder, run tests from the backend directory.

```bash
cd backend
pytest tests/ -v
```

If `pytest` is not installed, install it first:

```bash
pip install pytest
```

The tests may cover:

- Exact corpus match behavior
- Semantic search behavior
- Safety filter detection
- API response codes
- Database read and write operations
- Feedback and SUS score calculation

---

## Dataset

The project uses a curated English–Sesotho medical corpus.

### Corpus Verification Status

| **Status** | **Count** | **Percentage** |
|---|---:|---:|
| Reviewed | 4,536 | 90.7% |
| Raw | 459 | 9.2% |
| Fully clinically verified | 5 | 0.1% |
| **Total** | **5,000** | **100%** |

The corpus is suitable for proof-of-concept research and model development. It is not yet sufficient for unsupervised clinical deployment.

### Corpus Domain Summary

| **Domain** | **Pairs** | **Percentage** |
|---|---:|---:|
| HIV/AIDS | 1,000 | 20% |
| Medication Instructions | 900 | 18% |
| Tuberculosis | 800 | 16% |
| Symptoms and Complaints | 800 | 16% |
| Appointments and Follow-Up | 500 | 10% |
| Maternal and Child Health | 400 | 8% |
| General Patient Education | 600 | 12% |
| **Total** | **5,000** | **100%** |

The corpus is divided into:

| **Split** | **Percentage** |
|---|---:|
| Training Set | 80% |
| Validation Set | 10% |
| Test Set | 10% |

---

## Model Training Details

The NLLB-200 distilled 600M model was fine-tuned for English–Sesotho medical translation.

| **Parameter** | **Value** |
|---|---|
| Base Model | `facebook/nllb-200-distilled-600M` |
| Source Language Code | `eng_Latn` |
| Target Language Code | `sot_Latn` |
| Learning Rate | `2e-5` |
| Batch Size | `4` to `8` |
| Weight Decay | `0.01` |
| Epochs | `3` |
| Training Framework | Hugging Face Trainer |
| Compute | Google Colab Pro |

The model was fine-tuned for three epochs because the available domain-specific corpus was relatively small. Longer training could increase the risk of overfitting, where the model memorizes training examples rather than generalizing to unseen medical sentences.

---

## Evaluation

The project was evaluated using automatic metrics and human evaluation.

### Automatic Evaluation

| **Metric** | **Score** |
|---|---:|
| BLEU | 50.41 |
| chrF++ | 65.89 |
| TER | 36.78 |

### Human Evaluation

Five Sesotho-proficient evaluators reviewed translations using a 1–5 scale.

| **Category** | **Average Score** |
|---|---:|
| Adequacy | 4.30 |
| Fluency | 4.18 |
| Medical Accuracy | 4.04 |

### Usability Evaluation

The application achieved a System Usability Scale score of:

```text
78.4 / 100
```

This falls within the **Good** usability band.

### Evaluation Limitations

- Formal quantitative and human evaluation focused on English-to-Sesotho translation.
- The human evaluation sample was small.
- Inter-rater reliability was not computed in this proof-of-concept stage.
- The 10-sentence manual error analysis should be interpreted as indicative, not statistically conclusive.
- Larger clinical validation is required before real-world deployment.

---

## Google Translate Comparison Notebook

The repository includes a supplementary notebook:

```text
notebooks/03_google_translate_comparison.ipynb
```

This notebook benchmarks Google Translate against NLLB-200 outputs on a 50-sentence held-out subset using BLEU, chrF++, and TER.

This comparison is included for transparency and to contextualize the system against an existing public translation tool. The novelty of this project is not only automatic metric performance, but also:

- Medical-domain corpus control
- Source-layer transparency
- Retrieval-first translation
- Safety filtering for high-risk clinical terms
- Local adaptability for Lesotho’s healthcare context

---

## Troubleshooting

| **Problem** | **Cause** | **Solution** |
|---|---|---|
| `ModuleNotFoundError: faiss` | FAISS is not installed | Run `pip install faiss-cpu` |
| `ModuleNotFoundError: flask_cors` | Flask-CORS missing | Run `pip install flask-cors` |
| `OSError: Can't load tokenizer` | Model not downloaded or internet issue | Check internet connection and rerun the model download command |
| Backend not starting | Wrong directory or missing dependencies | Ensure you are inside `backend` and ran `pip install -r requirements.txt` |
| Frontend blank page | Backend not running | Start Flask backend on port `5000` |
| CORS error | CORS not enabled in Flask | Ensure `CORS(app)` is included in `app.py` |
| Translation is slow | Neural model loading for the first time | Wait for first inference; later translations should be faster |
| SQLite error | Database file issue | Delete `translations.db` and restart the backend |
| `npm start` fails | Missing frontend packages | Run `npm install` again |

---

## Deployment

The project can be deployed using the following platforms.

| **Component** | **Platform** |
|---|---|
| Frontend | Vercel |
| Backend API | Hugging Face Spaces |
| Model Hosting | Hugging Face |
| Repository | GitHub |

Current project links:

```text
Repository: https://github.com/L-Semakale/sesotho-medical-mt
Backend: https://huggingface.co/spaces/Limpho/sesotho-medical-backend
Frontend: https://sesotho-medical-mt.vercel.app/
```

If the frontend is not publicly deployed, it can be run locally using the setup instructions above.

---

## Ethics and Privacy

This project follows privacy-conscious design principles.

- No personally identifiable information (PII) is required for translation.
- No private patient records were used to build the corpus.
- Feedback is collected for usability and quality improvement.
- Translation history is stored locally in SQLite for prototype evaluation.
- The system includes a medical disclaimer.
- The system is not intended to replace professional medical advice or clinical judgment.

Ethics information:

```text
REC Approval: M26-BSE-016
Approval Date: 11 June 2026
Ethics Pathway: Pathway A, Capstone-based
```

---

## Medical Disclaimer

This system is a proof-of-concept academic research prototype.

It is not a certified medical device.

It must not be used as the sole basis for:

- Diagnosis
- Treatment decisions
- Medication dosage
- Emergency care
- Clinical decision-making
- Patient consent without professional review

All translations should be checked by a qualified bilingual healthcare professional before being used in any real healthcare setting.

---

## Limitations

The current prototype has the following limitations:

- The corpus size is limited compared to high-resource translation systems.
- Only 5 out of 5,000 corpus pairs reached full clinical verification status.
- The neural model may produce errors or hallucinations.
- Not all evaluators were medical professionals.
- Formal evaluation focused on English-to-Sesotho translation.
- Sesotho-to-English translation requires further evaluation.
- The system requires internet access for deployment and initial model download.
- Rural offline deployment is not yet supported.
- The tool has not undergone regulatory certification.
- The safety filter may miss high-risk terms fully translated or paraphrased into Sesotho.

---

## Future Work

Recommended future improvements include:

1. Expand the corpus to 20,000–50,000 clinically verified pairs.
2. Add offline mobile support using a quantized model.
3. Conduct larger evaluation with healthcare workers in Lesotho.
4. Improve bidirectional English–Sesotho and Sesotho–English translation.
5. Add speech-to-text and text-to-speech support.
6. Integrate stronger medical terminology validation.
7. Expand the safety filter to include Sesotho medical terms and dosage patterns.
8. Explore LLM-based post-editing for grammar and morphology correction.
9. Extend the approach to other Southern African languages.
10. Compute inter-rater reliability in future human evaluation studies.

---

## Citation

If you use this project, model, or corpus in your research, please cite:

```text
Semakale, L.E. (2026). A Proof-of-Concept English–Sesotho Medical 
Translation Prototype Using Open-Weight Multilingual Neural Machine 
Translation Models. BSc. Software Engineering Capstone Project, 
African Leadership University, Kigali, Rwanda.
```

---

## Project Status

This project is a proof-of-concept academic capstone prototype.

It demonstrates that a hybrid architecture combining curated corpus lookup, semantic search, and fine-tuned neural machine translation can support low-resource medical translation for English and Sesotho.

Further clinical validation, regulatory review, larger-scale human evaluation, and real-world testing are required before medical deployment.
```