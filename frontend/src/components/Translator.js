import { useState } from "react";
import { API, getAuthHeaders } from "../config";
import Alert from "./ui/Alert";

const MAX_CHARS = 300;

// Only supported language directions for this project
const SUPPORTED_DIRECTIONS = ["en-st", "st-en"];

function Translator({ username }) {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState("en-st");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleTranslate(e) {
    e.preventDefault();

    const cleanText = text.trim();
    const cleanDirection = direction.trim().toLowerCase();

    if (!cleanText) {
      setError("Please enter a medical phrase to translate.");
      return;
    }

    if (cleanText.length > MAX_CHARS) {
      setError(`Please keep the phrase under ${MAX_CHARS} characters.`);
      return;
    }

    if (!SUPPORTED_DIRECTIONS.includes(cleanDirection)) {
      setError(
        "Unsupported language direction. This system only supports English ↔ Sesotho medical translation."
      );
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
          direction: cleanDirection,
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

  const isHighRisk = result?.safety?.is_high_risk;

  return (
    <div className="card">
      <h2>Translate Medical Phrase</h2>

      <div style={styles.scopeBadge}>
        Accepted input: English or Sesotho only
      </div>

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
          onClick={() =>
            useExample("Do not stop taking your medicine.", "en-st")
          }
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
              onChange={(e) => {
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
              onChange={(e) => {
                const selectedDirection = e.target.value;

                if (!SUPPORTED_DIRECTIONS.includes(selectedDirection)) {
                  setError(
                    "Unsupported language direction. Please select English ↔ Sesotho only."
                  );
                  return;
                }

                setDirection(selectedDirection);
                setResult(null);
                setError("");
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

          <div style={styles.metaBox}>
            <span>
              <strong>Direction:</strong> {result.direction_label}
            </span>

            <span>
              <strong>Source:</strong> {result.source}
            </span>

            <span>
              <strong>Model:</strong> {result.model}
            </span>
          </div>

          {isHighRisk && (
            <div style={styles.safetyBox}>
              <div style={styles.safetyHeader}>
                <span style={styles.safetyIcon}>⚠️</span>

                <strong style={styles.safetyTitle}>
                  Medical safety warning
                </strong>
              </div>

              <p style={styles.safetyText}>
                <em>"{result.input_text}"</em> includes{" "}
                {result.safety.detected_terms?.length === 1
                  ? "a sensitive medical term"
                  : "sensitive medical terms"}
                :{" "}
                <strong>
                  {result.safety.detected_terms?.join(", ")}
                </strong>
                .
              </p>

              <p style={styles.safetyText}>
                Please have a qualified healthcare professional review this
                translation before clinical use.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  scopeBadge: {
    display: "inline-block",
    marginBottom: 14,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#ecfdf5",
    color: "#047857",
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid #bbf7d0",
  },

  exampleRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 16,
  },

  exampleBtn: {
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1e40af",
    padding: "7px 10px",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },

  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  metaBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
    fontSize: 12,
    color: "#475569",
  },

  safetyBox: {
    marginTop: 10,
    background: "#fff1f5",
    border: "1px solid #fbcfe8",
    borderRadius: 14,
    padding: "10px 12px",
    boxShadow: "0 6px 16px rgba(244, 114, 182, 0.12)",
  },

  safetyHeader: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },

  safetyIcon: {
    fontSize: 14,
    background: "#ffe4e6",
    borderRadius: "50%",
    width: 22,
    height: 22,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  safetyTitle: {
    color: "#9f1239",
    fontSize: 13,
  },

  safetyText: {
    margin: "6px 0 0",
    fontSize: 12.5,
    color: "#881337",
    lineHeight: 1.5,
  },
};

export default Translator;
