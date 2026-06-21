// frontend/src/components/History.js

import { useEffect, useState, useCallback } from "react";
import { API, getAuthHeaders } from "../config";
import Alert from "./ui/Alert";

function History({ username }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!username) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setError("");

      const res = await fetch(
        `${API}/api/history?username=${encodeURIComponent(username)}`,
        {
          headers: getAuthHeaders({ "Content-Type": undefined }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not load translation history.");
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load translation history.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    load();

    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="card">
      <div style={styles.header}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Translation History</h2>
          <p className="muted" style={{ margin: 0 }}>
            Recent translations submitted by this user.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <p className="muted">Loading translation history…</p>
      ) : items.length === 0 ? (
        <p className="muted">No translations yet. Try the translator first.</p>
      ) : (
        <div className="table-wrap" style={{ maxHeight: 360, overflowY: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Input</th>
                <th>Output</th>
                <th>When</th>
              </tr>
            </thead>

            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ color: "#94a3b8", fontWeight: 700 }}>
                    {item.id}
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{item.input_text}</div>
                    <small className="muted">{item.direction_label}</small>
                  </td>

                  <td>{item.translated_text}</td>

                  <td style={{ whiteSpace: "nowrap", color: "#64748b" }}>
                    {item.created_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
};

export default History;
