import { useState } from "react";
import { API, getAuthHeaders } from "../config";
import Alert from "./ui/Alert";

const MAX_CHARS = 300;

function Translator({ username }) {
  const [text, setText]           = useState("");
  const [direction, setDirection] = useState("en-st");
  const [result, setResult]       = useState(null);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");

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

  // ✅ FIX — Removed `isNeural` gate; safety banner now fires for ALL sources
  // Old: const isNeural   = result?.source === "neural";
  // Old: const isHighRisk = result?.safety?.is_high_risk;
  const isHighRisk = result?.safety?.is_high_risk;

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

          {/* Output box — always shown for every layer */}
          <label>Translation Output</label>
          <div className="output-box" aria-live="polite">
            {result.translated_text}
          </div>

          {/* ✅ FIX — Safety alert now shows for ALL sources (corpus, semantic, neural)
              Old: {isNeural && isHighRisk && ( ... )}
              New: {isHighRisk && ( ... )}
          */}
          {isHighRisk && (
            <div style={{
              marginTop: 10,
              background: "#fff1f5",
              border: "1px solid #fbcfe8",
              borderRadius: 14,
              padding: "10px 12px",
              boxShadow: "0 6px 16px rgba(244, 114, 182, 0.12)",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 6,
              }}>
                <span style={{
                  fontSize: 14,
                  background: "#ffe4e6",
                  borderRadius: "50%",
                  width: 22,
                  height: 22,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  ⚠️
                </span>

                <strong style={{ color: "#9f1239", fontSize: 13 }}>
                  Tiny safety check
                </strong>
              </div>

              <p style={{
                margin: 0,
                fontSize: 12.5,
                color: "#881337",
                lineHeight: 1.5,
              }}>
                <em>"{result.input_text}"</em> includes{" "}
                {result.safety.detected_terms?.length === 1
                  ? "a sensitive term"
                  : "sensitive terms"}
                :{" "}
                <strong>{result.safety.detected_terms?.join(", ")}</strong>.
              </p>

              <p style={{
                margin: "6px 0 0",
                fontSize: 12.5,
                color: "#881337",
                lineHeight: 1.5,
              }}>
                Please have a qualified healthcare professional review this
                before clinical use.
              </p>
            </div>
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
