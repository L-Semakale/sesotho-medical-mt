// frontend/src/components/FeedbackViewer.js

import { useEffect, useState, useCallback } from "react";
import FeedbackForm from "./FeedbackForm";
import { API, getAuthHeaders } from "../config";
import Alert from "./ui/Alert";

const STARS = rating =>
  "★".repeat(Number(rating)) + "☆".repeat(5 - Number(rating));

const RATING_COLOR = {
  5: "#16a34a",
  4: "#0d9488",
  3: "#f59e0b",
  2: "#f97316",
  1: "#ef4444",
};

function FeedbackViewer({
  username,
  showForm = true,
  showAverage = true,
  showDistribution = true,
  showResponses = true,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/feedback`, {
        headers: getAuthHeaders({ "Content-Type": undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not load feedback.");
      }

      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => Number(b.id) - Number(a.id))
        : [];

      setItems(sorted);
    } catch (err) {
      setError(err.message || "Could not load feedback.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = items.length;

  const average = total
    ? (items.reduce((sum, i) => sum + Number(i.rating), 0) / total).toFixed(1)
    : "—";

  const distribution = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: items.filter(i => Number(i.rating) === r).length,
  }));

  return (
    <section style={{ width: "100%", boxSizing: "border-box" }}>
      <style>{`
        .feedback-summary-row {
          display: flex;
          gap: 22px;
          margin-bottom: 22px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .feedback-avg-card {
          flex: 0 0 180px;
          min-width: 140px;
          text-align: center;
        }

        .feedback-dist-card {
          flex: 1;
          min-width: 220px;
        }

        .feedback-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .feedback-table-wrap table {
          width: 100%;
          min-width: 520px;
          border-collapse: collapse;
        }

        .feedback-table-wrap th,
        .feedback-table-wrap td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }

        .feedback-table-wrap th {
          font-weight: 600;
          color: #475569;
          background: #f8fafc;
        }

        .feedback-comment-cell {
          max-width: 260px;
          word-break: break-word;
          line-height: 1.6;
        }

        @media (max-width: 600px) {
          .feedback-avg-card,
          .feedback-dist-card {
            flex: 1 1 100%;
          }

          .feedback-comment-cell {
            max-width: 160px;
          }
        }
      `}</style>

      {showForm && <FeedbackForm username={username} onSubmitted={load} />}

      {error && <Alert type="error">{error}</Alert>}

      {(showAverage || showDistribution) && (
        <div className="feedback-summary-row">
          {showAverage && (
            <div className="card feedback-avg-card">
              <p className="muted" style={{ margin: "0 0 6px" }}>
                Average Rating
              </p>

              <div
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#1e3a8a",
                  lineHeight: 1,
                }}
              >
                {average}
              </div>

              <div style={{ fontSize: 22, color: "#f59e0b", marginTop: 6 }}>
                {total > 0 ? STARS(Math.round(average)) : "—"}
              </div>

              <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
                {total} response{total !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {showDistribution && (
            <div className="card feedback-dist-card">
              <h2 style={{ marginBottom: 14 }}>Rating Distribution</h2>

              {distribution.map(d => (
                <div key={d.rating} style={styles.barRow}>
                  <span
                    style={{
                      width: 28,
                      fontWeight: 600,
                      color: RATING_COLOR[d.rating],
                    }}
                  >
                    {d.rating}★
                  </span>

                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: total ? `${(d.count / total) * 100}%` : "0%",
                        background: RATING_COLOR[d.rating],
                      }}
                    />
                  </div>

                  <span
                    style={{
                      width: 28,
                      textAlign: "right",
                      fontSize: 13,
                      color: "#64748b",
                    }}
                  >
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showResponses && (
        <div className="card">
          <div style={styles.header}>
            <h2 style={{ marginBottom: 0 }}>All Responses</h2>

            <button type="button" className="btn btn-primary" onClick={load}>
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <p className="muted">Loading feedback…</p>
          ) : items.length === 0 ? (
            <p className="muted">No feedback submitted yet.</p>
          ) : (
            <div className="feedback-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Submitted</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td style={{ color: "#94a3b8", fontWeight: 600 }}>
                        {item.id}
                      </td>

                      <td>
                        <strong style={{ textTransform: "capitalize" }}>
                          {item.username}
                        </strong>
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            color: RATING_COLOR[item.rating],
                            fontWeight: 700,
                            fontSize: 16,
                          }}
                        >
                          {STARS(item.rating)}
                        </span>

                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 13,
                            color: "#64748b",
                          }}
                        >
                          ({item.rating}/5)
                        </span>
                      </td>

                      <td className="feedback-comment-cell">
                        {item.comment || "—"}
                      </td>

                      <td
                        style={{
                          whiteSpace: "nowrap",
                          color: "#64748b",
                          fontSize: 13,
                        }}
                      >
                        {item.created_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  barTrack: {
    flex: 1,
    height: "10px",
    background: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.4s ease",
  },
};

export default FeedbackViewer;
