// frontend/src/components/SUSForm.js
import { useState } from "react";

const API = "http://127.0.0.1:5000";

const SUS_QUESTIONS = [
  { id: 1,  text: "I think that I would like to use this system frequently.",          positive: true  },
  { id: 2,  text: "I found the system unnecessarily complex.",                         positive: false },
  { id: 3,  text: "I thought the system was easy to use.",                             positive: true  },
  { id: 4,  text: "I think that I would need the support of a technical person to use this system.", positive: false },
  { id: 5,  text: "I found the various functions in this system were well integrated.", positive: true  },
  { id: 6,  text: "I thought there was too much inconsistency in this system.",        positive: false },
  { id: 7,  text: "I would imagine that most people would learn to use this system very quickly.", positive: true },
  { id: 8,  text: "I found the system very cumbersome to use.",                        positive: false },
  { id: 9,  text: "I felt very confident using the system.",                           positive: true  },
  { id: 10, text: "I needed to learn a lot of things before I could get going with this system.", positive: false },
];

const SCALE = [1, 2, 3, 4, 5];
const SCALE_LABELS = {
  1: "Strongly Disagree",
  3: "Neutral",
  5: "Strongly Agree",
};

function SUSForm({ username }) {
  const [responses, setResponses]   = useState({});
  const [comment,   setComment]     = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [susScore,  setSusScore]    = useState(null);
  const [busy,      setBusy]        = useState(false);
  const [error,     setError]       = useState("");

  const allAnswered = SUS_QUESTIONS.every(q => responses[q.id] !== undefined);

  function handleSelect(questionId, value) {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  }

  function calculateSUS() {
    let total = 0;
    SUS_QUESTIONS.forEach(q => {
      const r = responses[q.id];
      if (q.positive) {
        total += (r - 1);
      } else {
        total += (5 - r);
      }
    });
    return parseFloat((total * 2.5).toFixed(1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allAnswered) return;

    const score = calculateSUS();
    setSusScore(score);
    setBusy(true);
    setError("");

    try {
      await fetch(`${API}/api/sus`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          responses,
          sus_score: score,
          comment,
        }),
      });
      setSubmitted(true);
    } catch {
      setError("Could not submit. Your score has been calculated below.");
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    const grade =
      susScore >= 85 ? { label: "Excellent",    color: "#15803d", bg: "#dcfce7" } :
      susScore >= 72 ? { label: "Good",          color: "#1d4ed8", bg: "#dbeafe" } :
      susScore >= 65 ? { label: "Acceptable ✅", color: "#0d9488", bg: "#ccfbf1" } :
      susScore >= 51 ? { label: "Marginal",      color: "#a16207", bg: "#fef9c3" } :
                       { label: "Poor",          color: "#dc2626", bg: "#fee2e2" };

    return (
      <div className="card" style={{ textAlign: "center" }}>
        <h2>✅ Thank You!</h2>
        <p className="muted">Your usability feedback has been recorded.</p>

        <div style={{
          background: grade.bg,
          borderRadius: 16,
          padding: "32px 24px",
          margin: "24px auto",
          maxWidth: 320,
        }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: grade.color }}>
            {susScore}
          </div>
          <div style={{ fontSize: 14, color: grade.color, fontWeight: 700, marginTop: 4 }}>
            / 100 — {grade.label}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
            SUS target for this prototype: ≥ 65 / 100
          </div>
        </div>

        <p style={{ fontSize: 13, color: "#64748b", maxWidth: 420, margin: "0 auto" }}>
          This score is for research purposes only. The System Usability Scale (Brooke, 1996)
          measures perceived usability on a scale of 0–100.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>📋 System Usability Scale (SUS)</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 6 }}>
        Please rate your experience with this prototype after using the translator.
        There are no right or wrong answers.
      </p>
      <div style={{
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 24,
        fontSize: 13,
        color: "#1e40af",
      }}>
        ℹ️ This is a <strong>proof-of-concept research prototype</strong>.
        Your anonymous feedback helps evaluate its usability.
        Based on Brooke (1996) — System Usability Scale.
      </div>

      <form onSubmit={handleSubmit}>
        {SUS_QUESTIONS.map((q, idx) => (
          <div key={q.id} style={styles.questionBlock}>
            <p style={styles.questionText}>
              <span style={styles.qNumber}>{idx + 1}</span>
              {q.text}
            </p>

            <div style={styles.scaleRow}>
              <span style={styles.scaleLabel}>Strongly Disagree</span>

              <div style={styles.radioGroup}>
                {SCALE.map(val => (
                  <label key={val} style={styles.radioLabel}>
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      value={val}
                      checked={responses[q.id] === val}
                      onChange={() => handleSelect(q.id, val)}
                      style={{ display: "none" }}
                    />
                    <div style={{
                      ...styles.radioCircle,
                      background:   responses[q.id] === val ? "#1e3a8a" : "#f1f5f9",
                      color:        responses[q.id] === val ? "#fff"    : "#475569",
                      borderColor:  responses[q.id] === val ? "#1e3a8a" : "#cbd5e1",
                      transform:    responses[q.id] === val ? "scale(1.15)" : "scale(1)",
                    }}>
                      {val}
                    </div>
                    {SCALE_LABELS[val] && (
                      <span style={styles.scaleTick}>{SCALE_LABELS[val]}</span>
                    )}
                  </label>
                ))}
              </div>

              <span style={styles.scaleLabel}>Strongly Agree</span>
            </div>
          </div>
        ))}

        <div className="form-group" style={{ marginTop: 24 }}>
          <label>Additional Comments (optional)</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Any comments about the interface, translation quality, or ease of use..."
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 14,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!allAnswered || busy}
          >
            {busy ? "Submitting…" : "Submit SUS Evaluation"}
          </button>

          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            {Object.keys(responses).length} / 10 answered
          </span>
        </div>

        {!allAnswered && (
          <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 8 }}>
            Please answer all 10 questions before submitting.
          </p>
        )}

        {error && (
          <p style={{ fontSize: 13, color: "#dc2626", marginTop: 8 }}>{error}</p>
        )}
      </form>
    </div>
  );
}

const styles = {
  questionBlock: {
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: 20,
    marginBottom: 20,
  },
  questionText: {
    margin: "0 0 12px",
    fontSize: 14,
    color: "#1e293b",
    lineHeight: 1.6,
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  qNumber: {
    background: "#1e3a8a",
    color: "#fff",
    borderRadius: "50%",
    width: 22,
    height: 22,
    minWidth: 22,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    marginTop: 1,
  },
  scaleRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  scaleLabel: {
    fontSize: 11,
    color: "#94a3b8",
    whiteSpace: "nowrap",
    minWidth: 100,
  },
  radioGroup: {
    display: "flex",
    gap: 10,
    flex: 1,
    justifyContent: "center",
  },
  radioLabel: {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  radioCircle: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    transition: "all 0.15s",
    cursor: "pointer",
  },
  scaleTick: {
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
    maxWidth: 50,
    lineHeight: 1.2,
  },
};

export default SUSForm;