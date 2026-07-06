import { useState } from "react";
import { API, getAuthHeaders } from "../config";
import Alert from "./ui/Alert";

const LABELS = {
  5: "Excellent",
  4: "Good",
  3: "Okay",
  2: "Poor",
  1: "Very Poor",
};

function getAnonymousFeedbackUser() {
  const key = "feedbackAnonymousUser";

  let anonymousUser = localStorage.getItem(key);

  if (!anonymousUser) {
    const countKey = "feedbackAnonymousUserCount";
    const currentCount = Number(localStorage.getItem(countKey) || "0");
    const nextCount = currentCount + 1;

    anonymousUser = `user${nextCount}`;

    localStorage.setItem(countKey, String(nextCount));
    localStorage.setItem(key, anonymousUser);
  }

  return anonymousUser;
}

function FeedbackForm({ username, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (rating === 0) {
      setStatus("error");
      setMessage("Please select a star rating before submitting.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const anonymousUsername = getAnonymousFeedbackUser();

    try {
      const res = await fetch(`${API}/api/feedback`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: anonymousUsername,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setStatus("success");
      setMessage(data.message || "Thank you for your feedback!");
      setRating(0);
      setComment("");

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      setStatus("error");
      setMessage(
        err.message || "Could not reach the server. Please check your connection."
      );
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
        <div style={{ marginBottom: 16 }}>
          <label style={styles.label}>Your Rating</label>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
            role="radiogroup"
            aria-label="Feedback rating"
          >
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`Rate ${star} out of 5`}
                aria-pressed={rating === star}
                style={{
                  ...styles.starButton,
                  color: star <= display ? "#f59e0b" : "#cbd5e1",
                  transform: star <= display ? "scale(1.15)" : "scale(1)",
                }}
              >
                ★
              </button>
            ))}

            {display > 0 && (
              <span style={{ fontSize: 14, color: "#64748b", marginLeft: 6 }}>
                {LABELS[display]}
              </span>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label htmlFor="feedback-comment" style={styles.label}>
            Comment <span style={{ color: "#94a3b8" }}>(optional)</span>
          </label>

          <textarea
            id="feedback-comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tell us what worked well or what could be improved…"
            rows={4}
            maxLength={500}
            style={styles.textarea}
          />

          <div
            style={{
              textAlign: "right",
              fontSize: 12,
              color: "#94a3b8",
              marginTop: 4,
            }}
          >
            {comment.length}/500
          </div>
        </div>

        {status === "success" && <Alert type="success">{message}</Alert>}
        {status === "error" && <Alert type="error">{message}</Alert>}

        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            ...styles.button,
            opacity: status === "loading" ? 0.7 : 1,
            cursor: status === "loading" ? "not-allowed" : "pointer",
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
    display: "block",
    fontWeight: 600,
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  starButton: {
    fontSize: 36,
    cursor: "pointer",
    transition: "color 0.15s ease, transform 0.1s ease",
    userSelect: "none",
    background: "transparent",
    border: "none",
    padding: 0,
    lineHeight: 1,
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    lineHeight: 1.6,
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
    color: "#1e293b",
    background: "#f8fafc",
  },
  button: {
    padding: "10px 24px",
    background: "#1e3a8a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
};

export default FeedbackForm;
