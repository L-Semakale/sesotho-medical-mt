import { useState } from "react";

const API = "http://127.0.0.1:5000";

const LABELS = {
  5: "Excellent",
  4: "Good",
  3: "Okay",
  2: "Poor",
  1: "Very Poor",
};

function FeedbackForm({ username, onSubmitted }) {
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [comment,   setComment]   = useState("");
  const [status,    setStatus]    = useState("idle"); // idle | loading | success | error
  const [message,   setMessage]   = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (rating === 0) {
      setStatus("error");
      setMessage("Please select a star rating before submitting.");
      return;
    }

    setStatus("loading");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/feedback`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username: username || "anonymous",
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Thank you for your feedback!");
        setRating(0);
        setComment("");
        if (onSubmitted) onSubmitted(); // notify parent to refresh list
      } else {
        setStatus("error");
        setMessage(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Could not reach the server. Please check your connection.");
    }
  }

  const display = hovered || rating;

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2 style={{ marginBottom: 4 }}>Leave Feedback</h2>
      <p className="muted" style={{ marginBottom: 18 }}>
        How would you rate your experience with this system?
      </p>

      <form onSubmit={handleSubmit}>

        {/* ── Star Selector ── */}
        <div style={{ marginBottom: 16 }}>
          <label style={styles.label}>Your Rating</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                style={{
                  fontSize:   36,
                  cursor:     "pointer",
                  color:      star <= display ? "#f59e0b" : "#cbd5e1",
                  transition: "color 0.15s ease, transform 0.1s ease",
                  transform:  star <= display ? "scale(1.15)" : "scale(1)",
                  userSelect: "none",
                }}
              >
                ★
              </span>
            ))}
            {display > 0 && (
              <span style={{ fontSize: 14, color: "#64748b", marginLeft: 6 }}>
                {LABELS[display]}
              </span>
            )}
          </div>
        </div>

        {/* ── Comment ── */}
        <div style={{ marginBottom: 18 }}>
          <label style={styles.label}>Comment <span style={{ color: "#94a3b8" }}>(optional)</span></label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tell us what worked well or what could be improved…"
            rows={4}
            maxLength={500}
            style={styles.textarea}
          />
          <div style={{ textAlign: "right", fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
            {comment.length}/500
          </div>
        </div>

        {/* ── Status Message ── */}
        {status === "success" && (
          <div style={{ ...styles.alert, background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}>
             {message}
          </div>
        )}
        {status === "error" && (
          <div style={{ ...styles.alert, background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }}>
             {message}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            ...styles.button,
            opacity: status === "loading" ? 0.7 : 1,
            cursor:  status === "loading" ? "not-allowed" : "pointer",
          }}
        >
          {status === "loading" ? "Submitting…" : "Submit Feedback"}
        </button>

      </form>
    </div>
  );
}

const styles = {
  label: {
    display:      "block",
    fontWeight:   600,
    fontSize:     14,
    color:        "#374151",
    marginBottom: 8,
  },
  textarea: {
    width:        "100%",
    padding:      "10px 12px",
    borderRadius: 8,
    border:       "1px solid #e2e8f0",
    fontSize:     14,
    lineHeight:   1.6,
    resize:       "vertical",
    fontFamily:   "inherit",
    boxSizing:    "border-box",
    outline:      "none",
    color:        "#1e293b",
    background:   "#f8fafc",
  },
  button: {
    padding:      "10px 24px",
    background:   "#1e3a8a",
    color:        "#fff",
    border:       "none",
    borderRadius: 8,
    fontSize:     15,
    fontWeight:   600,
    cursor:       "pointer",
    transition:   "background 0.2s ease",
  },
  alert: {
    padding:      "10px 14px",
    borderRadius: 8,
    border:       "1px solid",
    fontSize:     14,
    marginBottom: 14,
  },
};

export default FeedbackForm;
