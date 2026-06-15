import { useState } from "react";

const API = "http://127.0.0.1:5000";

function Translator({ username }) {
  const [text,       setText]       = useState("");
  const [direction,  setDirection]  = useState("en-st");
  const [output,     setOutput]     = useState("");
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState("");

  async function handleTranslate(e) {
    e.preventDefault();
    if (!text.trim()) return;

    setBusy(true);
    setError("");
    setOutput("");

    try {
      const res = await fetch(`${API}/api/translate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, direction, username }),
      });

      if (!res.ok) throw new Error("Translation request failed.");

      const data = await res.json();
      setOutput(data.translated_text);
    } catch {
      setError("Could not reach the translation backend. Is Flask running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Translate Medical Phrase</h2>

      <form onSubmit={handleTranslate}>
        <div className="form-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Medical Phrase</label>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="e.g. Take one tablet twice daily."
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Direction</label>
            <select value={direction} onChange={e => setDirection(e.target.value)}>
              <option value="en-st">English → Sesotho</option>
              <option value="st-en">Sesotho → English</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: 14 }}
          disabled={busy}
        >
          {busy ? "Translating…" : "Translate"}
        </button>
      </form>

      {error  && <p className="error-msg" style={{ marginTop: 12 }}>{error}</p>}

      {output && (
        <div style={{ marginTop: 18 }}>
          <label>Translation Output</label>
          <div className="output-box">{output}</div>
        </div>
      )}
    </div>
  );
}

export default Translator;
