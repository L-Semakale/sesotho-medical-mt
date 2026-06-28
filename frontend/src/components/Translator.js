import { useState } from "react";
import { API, getAuthHeaders } from "../config";
import Alert from "./ui/Alert";

const MAX_CHARS = 300;

function Translator({ username }) {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState("en-st");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleTranslate(e) {
    e.preventDefault();

    const cleanText = text.trim();

    if (!cleanText) {
      setError("Please enter a medical phrase to translate.");
      return;
    }

    if (cleanText.length > MAX_CHARS) {
      setError(`Please keep the phrase under ${MAX_CHARS} characters.`);
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API}/api/translate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text: cleanText,
          direction,
          username: username || "anonymous",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Translation failed.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          "Could not reach the translation backend. Is Flask running?"
      );
    } finally {
      setBusy(false);
    }
  }

  function useExample(exampleText, exampleDirection = "en-st") {
    setText(exampleText);
    setDirection(exampleDirection);
    setResult(null);
    setError("");
  }

  return (
    <div className="card">
      <h2>Translate Medical Phrase</h2>

      <p className="muted" style={{ marginTop: 0 }}>
        Enter a short healthcare phrase and select the translation direction.
      </p>

      <div style={styles.exampleRow}>
        <button
          type="button"
          style={styles.exampleBtn}
          onClick={() => useExample("Take one tablet twice daily.", "en-st")}
        >
          Example: dosage
        </button>

        <button
          type="button"
          style={styles.exampleBtn}
          onClick={() => useExample("Return to the clinic next week.", "en-st")}
        >
          Example: appointment
        </button>

        <button
          type="button"
          style={styles.exampleBtn}
          onClick={() => useExample("Do not stop taking your medicine.", "en-st")}
        >
          Example: adherence
        </button>
      </div>

      <form onSubmit={handleTranslate}>
        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="medical-phrase">Medical Phrase</label>
            <input
              id="medical-phrase"
              type="text"
              value={text}
              onChange={e => {
                setText(e.target.value);
                setError("");
                setResult(null);
              }}
              placeholder="e.g. Take one tablet twice daily."
              required
              maxLength={MAX_CHARS}
            />

            <div style={styles.charCount}>
              {text.length}/{MAX_CHARS}
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="translation-direction">Direction</label>
            <select
              id="translation-direction"
              value={direction}
              onChange={e => {
                setDirection(e.target.value);
                setResult(null);
              }}
            >
              <option value="en-st">English → Sesotho</option>
              <option value="st-en">Sesotho → English</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: 14 }}
          disabled={busy || !text.trim()}
        >
          {busy ? "Translating…" : "Translate"}
        </button>
      </form>

      {error && (
        <Alert type="error" style={{ marginTop: 12 }}>
          {error}
        </Alert>
      )}

      {result && (
        <div style={{ marginTop: 18 }}>
          <label>Translation Output</label>

          <div className="output-box" aria-live="polite">
            {result.translated_text}
          </div>

          {/* badge and description removed */}

          {result?.safety?.is_high_risk && (
            <Alert type="error" style={{ marginTop: 10 }}>
              <strong>High-Risk Medical Terms Detected:</strong>{" "}
              {result.safety.detected_terms?.join(", ")}
              <br />
              {result.safety.warning}
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  exampleRow: {
    display:      "flex",
    gap:          8,
    flexWrap:     "wrap",
    marginBottom: 16,
  },
  exampleBtn: {
    border:       "1px solid #dbeafe",
    background:   "#eff6ff",
    color:        "#1e40af",
    padding:      "7px 10px",
    borderRadius: 999,
    cursor:       "pointer",
    fontSize:     12,
    fontWeight:   700,
  },
  charCount: {
    textAlign: "right",
    fontSize:  12,
    color:     "#94a3b8",
    marginTop: 4,
  },
};

export default Translator;