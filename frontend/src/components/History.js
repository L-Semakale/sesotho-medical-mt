import { useEffect, useState } from "react";

const API = "http://127.0.0.1:5000";

function History({ username }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${API}/api/history?username=${username}`);
        const data = await res.json();
        setItems(data);
      } catch {
        /* silent — backend may not be ready */
      }
    }

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [username]);

  return (
    <div className="card">
      <h2>Translation History</h2>

      {items.length === 0 ? (
        <p className="muted">No translations yet. Try the translator above.</p>
      ) : (
        <div className="table-wrap" style={{ maxHeight: 320, overflowY: "auto" }}>
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
                  <td>{item.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.input_text}</div>
                    <small className="muted">{item.direction_label}</small>
                  </td>
                  <td>{item.translated_text}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{item.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;
