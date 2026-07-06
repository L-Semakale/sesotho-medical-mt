import { useEffect, useState } from "react";

const API = "http://127.0.0.1:5000";

const STARS = rating => "★".repeat(Number(rating)) + "☆".repeat(5 - Number(rating));

const RATING_COLOR = {
  5: "#16a34a",
  4: "#0d9488",
  3: "#f59e0b",
  2: "#f97316",
  1: "#ef4444",
};

function FeedbackViewer() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${API}/api/feedback`);
        const data = await res.json();
        setItems(data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const total   = items.length;
  const average = total
    ? (items.reduce((sum, i) => sum + Number(i.rating), 0) / total).toFixed(1)
    : "—";

  const distribution = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count:  items.filter(i => Number(i.rating) === r).length,
  }));

  if (loading) {
    return (
      <div className="card">
        <h2>User Feedback</h2>
        <p className="muted">Loading feedback…</p>
      </div>
    );
  }

  return (
    <section>

      {/* Summary Row */}
      <div style={styles.summaryRow}>

        <div className="card" style={{ textAlign: "center", flex: "0 0 180px" }}>
          <p className="muted" style={{ margin: "0 0 6px" }}>Average Rating</p>
          <div style={{ fontSize: 48, fontWeight: 700, color: "#1e3a8a", lineHeight: 1 }}>
            {average}
          </div>
          <div style={{ fontSize: 22, color: "#f59e0b", marginTop: 6 }}>
            {total > 0 ? STARS(Math.round(average)) : "—"}
          </div>
          <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
            {total} response{total !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <h2 style={{ marginBottom: 14 }}>Rating Distribution</h2>
          {distribution.map(d => (
            <div key={d.rating} style={styles.barRow}>
              <span style={{ width: 28, fontWeight: 600, color: RATING_COLOR[d.rating] }}>
                {d.rating}★
              </span>
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.barFill,
                  width:      total ? `${(d.count / total) * 100}%` : "0%",
                  background: RATING_COLOR[d.rating],
                }} />
              </div>
              <span style={{ width: 28, textAlign: "right", fontSize: 13, color: "#64748b" }}>
                {d.count}
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* Individual Responses */}
      <div className="card">
        <h2>Individual Responses</h2>

        {items.length === 0 ? (
          <p className="muted">No feedback submitted yet.</p>
        ) : (
          <div className="table-wrap">
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
                    <td style={{ color: "#94a3b8", fontWeight: 600 }}>{item.id}</td>
                    <td>
                      <strong style={{ textTransform: "capitalize" }}>{item.username}</strong>
                    </td>
                    <td>
                      <span style={{ color: RATING_COLOR[item.rating], fontWeight: 700, fontSize: 16 }}>
                        {STARS(item.rating)}
                      </span>
                      <span style={{ marginLeft: 6, fontSize: 13, color: "#64748b" }}>
                        ({item.rating}/5)
                      </span>
                    </td>
                    <td style={{ maxWidth: 340, lineHeight: 1.6 }}>{item.comment}</td>
                    <td style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: 13 }}>
                      {item.created_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </section>
  );
}

const styles = {
  summaryRow: {
    display:      "flex",
    gap:          "22px",
    marginBottom: "22px",
    alignItems:   "flex-start",
    flexWrap:     "wrap",
  },
  barRow: {
    display:      "flex",
    alignItems:   "center",
    gap:          "10px",
    marginBottom: "8px",
  },
  barTrack: {
    flex:         1,
    height:       "10px",
    background:   "#f1f5f9",
    borderRadius: "999px",
    overflow:     "hidden",
  },
  barFill: {
    height:       "100%",
    borderRadius: "999px",
    transition:   "width 0.4s ease",
  },
};

export default FeedbackViewer;
