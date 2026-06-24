import { useState } from "react";
import { API, getAuthHeaders } from "../config";
import Alert from "./ui/Alert";

const SUS_QUESTIONS = [
  { id: 1,  text: "I think that I would like to use this system frequently.",                                    positive: true  },
  { id: 2,  text: "I found the system unnecessarily complex.",                                                   positive: false },
  { id: 3,  text: "I thought the system was easy to use.",                                                       positive: true  },
  { id: 4,  text: "I think that I would need the support of a technical person to use this system.",             positive: false },
  { id: 5,  text: "I found the various functions in this system were well integrated.",                          positive: true  },
  { id: 6,  text: "I thought there was too much inconsistency in this system.",                                  positive: false },
  { id: 7,  text: "I would imagine that most people would learn to use this system very quickly.",               positive: true  },
  { id: 8,  text: "I found the system very cumbersome to use.",                                                  positive: false },
  { id: 9,  text: "I felt very confident using the system.",                                                     positive: true  },
  { id: 10, text: "I needed to learn a lot of things before I could get going with this system.",               positive: false },
];

const SCALE = [1, 2, 3, 4, 5];

function SUSForm({ username }) {
  const [responses, setResponses] = useState({});
  const [comment, setComment]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [susScore, setSusScore]   = useState(null);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");

  const allAnswered = SUS_QUESTIONS.every(q => responses[q.id] !== undefined);

  function handleSelect(questionId, value) {
    setResponses(prev => ({ ...prev, [questionId]: Number(value) }));
  }

  function calculateSUS() {
    let total = 0;
    SUS_QUESTIONS.forEach(q => {
      const r = Number(responses[q.id]);
      total += q.positive ? r - 1 : 5 - r;
    });
    return Number((total * 2.5).toFixed(1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allAnswered) { setError("Please answer all 10 questions before submitting."); return; }

    const score = calculateSUS();
    setSusScore(score);
    setBusy(true);
    setError("");

    try {
      const res  = await fetch(`${API}/api/sus`, {
        method:  "POST",
        headers: getAuthHeaders(),
        body:    JSON.stringify({
          username:  username || "anonymous",
          responses,
          sus_score: score,
          comment:   comment.trim(),
        }),
      });
      let data = {};
      try { data = await res.json(); } catch { data = {}; }
      if (!res.ok) throw new Error(data.error || "Could not submit SUS evaluation.");
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Could not submit. Your score has still been calculated below.");
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  }

  /* ── Result screen ── */
  if (submitted) {
    const grade =
      susScore >= 85 ? { label: "Excellent",   color: "#15803d", bg: "#f0fdf4" } :
      susScore >= 72 ? { label: "Good",         color: "#1d4ed8", bg: "#eff6ff" } :
      susScore >= 65 ? { label: "Acceptable",   color: "#0d9488", bg: "#f0fdfa" } :
      susScore >= 51 ? { label: "Marginal",     color: "#a16207", bg: "#fefce8" } :
                       { label: "Poor",         color: "#dc2626", bg: "#fef2f2" };

    return (
      <div className="card" style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          Submission Received
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          Your usability feedback has been recorded.
        </p>

        {error && <Alert type="warning" style={{ marginBottom: 16 }}>{error}</Alert>}

        <div style={{ ...styles.scoreBox, background: grade.bg, borderColor: grade.color }}>
          <span style={{ fontSize: 52, fontWeight: 800, color: grade.color, lineHeight: 1 }}>
            {susScore}
          </span>
          <span style={{ fontSize: 13, color: grade.color, fontWeight: 700, marginTop: 4 }}>
            / 100 — {grade.label}
          </span>
          <span style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Prototype target: ≥ 65 / 100
          </span>
        </div>

        <p style={{ fontSize: 12, color: "#94a3b8", maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
          This score is for research purposes only. The System Usability Scale
          measures perceived usability on a scale of 0–100.
        </p>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="card">
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
        System Usability Scale (SUS)
      </h2>

      <p style={{ fontSize: 13, color: "#64748b", marginTop: 0, marginBottom: 14 }}>
        Rate your experience with this prototype after using the translator.
        There are no right or wrong answers.
      </p>

      <Alert type="info" style={{ marginBottom: 24 }}>
        This is a <strong>proof-of-concept research prototype</strong>. Your
        feedback helps evaluate its usability. Based on Brooke (1996) — System
        Usability Scale.
      </Alert>

      <form onSubmit={handleSubmit}>
        {SUS_QUESTIONS.map((q, idx) => (
          <fieldset key={q.id} style={styles.questionBlock}>
            <legend style={styles.questionText}>
              <span style={styles.qNumber}>{idx + 1}</span>
              {q.text}
            </legend>

            <div style={styles.scaleRow}>
              <span style={styles.scaleEdge}>Strongly Disagree</span>

              <div style={styles.radioGroup}>
                {SCALE.map(val => {
                  const selected = responses[q.id] === val;
                  return (
                    <label key={val} style={styles.radioLabel}>
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value={val}
                        checked={selected}
                        onChange={() => handleSelect(q.id, val)}
                        style={styles.srOnly}
                      />
                      <span
                        style={{
                          ...styles.radioCircle,
                          background:   selected ? "#1e3a8a" : "#f8fafc",
                          color:        selected ? "#fff"    : "#475569",
                          borderColor:  selected ? "#1e3a8a" : "#cbd5e1",
                        }}
                      >
                        {val}
                      </span>
                    </label>
                  );
                })}
              </div>

              <span style={styles.scaleEdge}>Strongly Agree</span>
            </div>
          </fieldset>
        ))}

        <div style={{ marginTop: 20 }}>
          <label style={styles.label} htmlFor="sus-comment">
            Additional Comments (optional)
          </label>
          <textarea
            id="sus-comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Any comments about the interface, translation quality, or ease of use..."
            rows={3}
            style={styles.textarea}
          />
        </div>

        <div style={styles.submitRow}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!allAnswered || busy}
          >
            {busy ? "Submitting…" : "Submit Evaluation"}
          </button>

          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            {Object.keys(responses).length} / 10 answered
          </span>
        </div>

        {!allAnswered && (
          <p style={{ fontSize: 12, color: "#d97706", marginTop: 8 }}>
            Please answer all 10 questions before submitting.
          </p>
        )}

        {error && (
          <Alert type="error" style={{ marginTop: 10 }}>{error}</Alert>
        )}
      </form>
    </div>
  );
}

const styles = {
  scoreBox: {
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    border:        "1px solid",
    borderRadius:  8,
    padding:       "28px 24px",
    margin:        "20px auto",
    maxWidth:      280,
  },
  questionBlock: {
    border:       "none",
    borderBottom: "1px solid #f1f5f9",
    padding:      "0 0 18px",
    margin:       "0 0 18px",
  },
  questionText: {
    margin:      "0 0 12px",
    fontSize:    14,
    color:       "#1e293b",
    lineHeight:  1.6,
    display:     "flex",
    alignItems:  "flex-start",
    gap:         10,
    fontWeight:  500,
  },
  qNumber: {
    background:     "#1e3a8a",
    color:          "#fff",
    borderRadius:   "50%",
    width:          22,
    height:         22,
    minWidth:       22,
    display:        "inline-flex",
    alignItems:     "center",
    justifyContent: "center",
    fontSize:       11,
    fontWeight:     700,
    marginTop:      1,
    flexShrink:     0,
  },
  scaleRow: {
    display:    "flex",
    alignItems: "center",
    gap:        10,
    flexWrap:   "wrap",
  },
  scaleEdge: {
    fontSize:   11,
    color:      "#94a3b8",
    whiteSpace: "nowrap",
    minWidth:   90,
  },
  radioGroup: {
    display:        "flex",
    gap:            8,
    flex:           1,
    justifyContent: "center",
    minWidth:       220,
  },
  radioLabel: {
    cursor:  "pointer",
    display: "flex",
  },
  srOnly: {
    position: "absolute",
    opacity:  0,
    width:    1,
    height:   1,
    overflow: "hidden",
  },
  radioCircle: {
    width:          36,
    height:         36,
    borderRadius:   "50%",
    border:         "2px solid",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontWeight:     700,
    fontSize:       13,
    transition:     "background 0.12s, border-color 0.12s",
    cursor:         "pointer",
  },
  label: {
    display:       "block",
    fontSize:      12,
    fontWeight:    600,
    color:         "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom:  6,
  },
  textarea: {
    width:      "100%",
    padding:    "10px 12px",
    borderRadius: 6,
    border:     "1px solid #e2e8f0",
    fontSize:   14,
    resize:     "vertical",
    fontFamily: "inherit",
    boxSizing:  "border-box",
    color:      "#0f172a",
  },
  submitRow: {
    display:    "flex",
    alignItems: "center",
    gap:        14,
    marginTop:  18,
    flexWrap:   "wrap",
  },
};

export default SUSForm;
