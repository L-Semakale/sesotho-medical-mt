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
  3: "#d97706",
  2: "#ea580c",
  1: "#dc2626",
};

function FeedbackViewer({
  username,
  showForm         = true,
  showAverage      = true,
  showDistribution = true,
  showResponses    = true,
}) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res  = await fetch(`${API}/api/feedback`, {
        headers: getAuthHeaders({ "Content-Type": undefined }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Could not load feedback.");

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

  useEffect(() => { load(); }, [load]);

  const total   = items.length;
  const average = total
    ? (items.reduce((sum, i) => sum + Number(i.rating), 0) / total).toFixed(1)
    : "—";

  const distribution = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count:  items.filter(i => Number(i.rating) === r).length,
  }));

  return (
    <section style={{ width: "100%", boxSizing: "border-box" }}>

      {showForm && <FeedbackForm username={username} onSubmitted={load} />}

      {error && <Alert type="error" style={{ marginBottom: 16 }}>{error}</Alert>}

      {/* Average + Distribution row */}
      {(showAverage || showDistribution) && (
        <div style={styles.summaryRow}>

          {showAverage && (
            <div className="card" style={styles.avgCard}>
              <p style={styles.avgLabel}>Average Rating</p>

              <div style={styles.avgScore}>{average}</div>

              <div style={styles.avgStars}>
                {total > 0 ? STARS(Math.round(average)) : "—"}
              </div>

              <p style={styles.avgCount}>
                {total} response{total !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {showDistribution && (
            <div className="card" style={styles.distCard}>
              <h2 style={styles.cardTitle}>Rating Distribution</h2>

              {distribution.map(d => (
                <div key={d.rating} style={styles.barRow}>
                  <span style={{ ...styles.barRatingLabel, color: RATING_COLOR[d.rating] }}>
                    {d.rating}★
                  </span>

                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width:      total ? `${(d.count / total) * 100}%` : "0%",
                        background: RATING_COLOR[d.rating],
                      }}
                    />
                  </div>

                  <span style={styles.barCount}>{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Responses table */}
      {showResponses && (
        <div className="card">
          <div style={styles.tableHeader}>
            <h2 style={styles.cardTitle}>All Responses</h2>
            <button type="button" className="btn btn-primary" onClick={load}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p style={styles.muted}>Loading feedback…</p>
          ) : items.length === 0 ? (
            <p style={styles.muted}>No feedback submitted yet.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Rating</th>
                    <th style={styles.th}>Comment</th>
                    <th style={styles.th}>Submitted</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td style={{ ...styles.td, color: "#94a3b8", fontWeight: 600 }}>
                        {item.id}
                      </td>

                      <td style={styles.td}>
                        <strong style={{ textTransform: "capitalize" }}>
                          {item.username}
                        </strong>
                      </td>

                      <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
                        <span style={{ color: RATING_COLOR[item.rating], fontWeight: 700 }}>
                          {STARS(item.rating)}
                        </span>
                        <span style={{ marginLeft: 6, fontSize: 12, color: "#64748b" }}>
                          ({item.rating}/5)
                        </span>
                      </td>

                      <td style={{ ...styles.td, ...styles.commentCell }}>
                        {item.comment || "—"}
                      </td>

                      <td style={{ ...styles.td, whiteSpace: "nowrap", color: "#64748b", fontSize: 12 }}>
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
  summaryRow: {
    display:     "flex",
    gap:         16,
    marginBottom: 20,
    alignItems:  "flex-start",
    flexWrap:    "wrap",
  },
  avgCard: {
    flex:      "0 0 160px",
    minWidth:  140,
    textAlign: "center",
  },
  avgLabel: {
    margin:     "0 0 8px",
    fontSize:   11,
    fontWeight: 600,
    color:      "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  avgScore: {
    fontSize:   44,
    fontWeight: 800,
    color:      "#0f172a",
    lineHeight: 1,
  },
  avgStars: {
    fontSize:  18,
    color:     "#d97706",
    marginTop: 6,
  },
  avgCount: {
    margin:   "8px 0 0",
    fontSize: 12,
    color:    "#94a3b8",
  },
  distCard: {
    flex:    1,
    minWidth: 220,
  },
  cardTitle: {
    fontSize:     15,
    fontWeight:   700,
    color:        "#0f172a",
    marginBottom: 12,
    marginTop:    0,
  },
  barRow: {
    display:     "flex",
    alignItems:  "center",
    gap:         10,
    marginBottom: 8,
  },
  barRatingLabel: {
    width:      28,
    fontSize:   13,
    fontWeight: 700,
    flexShrink: 0,
  },
  barTrack: {
    flex:         1,
    height:       8,
    background:   "#f1f5f9",
    borderRadius: 999,
    overflow:     "hidden",
  },
  barFill: {
    height:       "100%",
    borderRadius: 999,
    transition:   "width 0.3s ease",
  },
  barCount: {
    width:     24,
    textAlign: "right",
    fontSize:  12,
    color:     "#64748b",
    flexShrink: 0,
  },
  tableHeader: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    gap:            12,
    marginBottom:   14,
    flexWrap:       "wrap",
  },
  tableWrap: {
    width:                    "100%",
    overflowX:                "auto",
    WebkitOverflowScrolling:  "touch",
  },
  table: {
    width:          "100%",
    minWidth:       520,
    borderCollapse: "collapse",
  },
  th: {
    padding:    "10px 12px",
    textAlign:  "left",
    fontSize:   12,
    fontWeight: 600,
    color:      "#475569",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  td: {
    padding:      "10px 12px",
    fontSize:     14,
    borderBottom: "1px solid #f1f5f9",
    color:        "#0f172a",
    lineHeight:   1.5,
  },
  commentCell: {
    maxWidth:  260,
    wordBreak: "break-word",
  },
  muted: {
    fontSize: 13,
    color:    "#94a3b8",
    margin:   0,
  },
};

export default FeedbackViewer;
