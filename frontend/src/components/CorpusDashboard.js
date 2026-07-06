import { useEffect, useState } from "react";

const API = "http://127.0.0.1:5000";

const STATUS_OPTIONS = ["raw", "translated", "reviewed", "verified", "rejected"];

const PILL = {
  verified:   { background: "#dcfce7", color: "#15803d" },
  reviewed:   { background: "#e0f2fe", color: "#0369a1" },
  translated: { background: "#fef9c3", color: "#a16207" },
  raw:        { background: "#f1f5f9", color: "#475569" },
  rejected:   { background: "#fee2e2", color: "#b91c1c" },
};

function StatusPill({ status }) {
  const s = PILL[status] || PILL.raw;
  return (
    <span style={{
      ...s,
      padding:      "3px 10px",
      borderRadius: "999px",
      fontSize:     "11px",
      fontWeight:   700,
      textTransform:"uppercase",
    }}>
      {status}
    </span>
  );
}

function CorpusDashboard() {
  const [corpus,  setCorpus]  = useState([]);
  const [stats,   setStats]   = useState({
    total: 0, translated: 0, missing: 0, status_counts: {},
  });
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState({ text: "", type: "" });
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");

  async function loadData() {
    try {
      setLoading(true);
      const [cRes, sRes] = await Promise.all([
        fetch(`${API}/api/corpus`),
        fetch(`${API}/api/stats`),
      ]);
      setCorpus(await cRes.json());
      setStats(await sRes.json());
    } catch {
      showMsg("Could not load corpus. Is Flask running?", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function showMsg(text, type = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  }

  async function saveRow(sentenceId, fields) {
    try {
      const res = await fetch(`${API}/api/corpus/${sentenceId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(fields),
      });
      if (!res.ok) throw new Error();
      showMsg(`Sentence #${sentenceId} saved successfully.`, "success");
      loadData();
    } catch {
      showMsg("Save failed. Please try again.", "error");
    }
  }

  function handleChange(id, field, value) {
    setCorpus(prev =>
      prev.map(r =>
        Number(r.sentence_id) === Number(id) ? { ...r, [field]: value } : r
      )
    );
  }

  // Filter + search
  const visible = corpus.filter(row => {
    const matchesFilter = filter === "all" || row.reviewer_status === filter;
    const matchesSearch =
      !search ||
      row.english_text?.toLowerCase().includes(search.toLowerCase()) ||
      row.sesotho_text?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="card">
        <h2>Corpus Manager</h2>
        <p className="muted">Loading dataset…</p>
      </div>
    );
  }

  return (
    <section>

      {/* Stats Row */}
      <div className="stats-grid">
        {[
          { label: "Total Entries",  value: stats.total,                          color: "#1e3a8a" },
          { label: "Translated",     value: stats.translated,                     color: "#0d9488" },
          { label: "Missing",        value: stats.missing,                        color: "#f59e0b" },
          { label: "Verified",       value: stats.status_counts?.verified || 0,   color: "#16a34a" },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{ borderTopColor: s.color }}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>

      {/* Corpus Table Card */}
      <div className="card">
        <h2>Corpus Dataset Editor</h2>

        {/* Search & Filter Bar */}
        <div style={styles.toolbar}>
          <input
            type="text"
            placeholder="Search English or Sesotho text…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, ...styles.toolInput }}
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={styles.toolInput}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={loadData}>
            ↻ Refresh
          </button>
        </div>

        {msg.text && (
          <p className={msg.type === "error" ? "error-msg" : "success-msg"}>
            {msg.text}
          </p>
        )}

        <p className="muted" style={{ marginBottom: 12 }}>
          Showing <strong>{visible.length}</strong> of <strong>{corpus.length}</strong> entries
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>ID</th>
                <th style={{ width: 100 }}>Domain</th>
                <th>English Source</th>
                <th>Sesotho Translation</th>
                <th style={{ width: 130 }}>Status</th>
                <th>Notes</th>
                <th style={{ width: 70 }}>Save</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
                    No entries match your search or filter.
                  </td>
                </tr>
              ) : (
                visible.map(row => (
                  <tr key={row.sentence_id}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>
                      {row.sentence_id}
                    </td>
                    <td>
                      <StatusPill status={row.domain_category || "raw"} />
                    </td>
                    <td style={{ maxWidth: 220, lineHeight: 1.5 }}>
                      {row.english_text}
                    </td>
                    <td>
                      <textarea
                        value={row.sesotho_text || ""}
                        onChange={e =>
                          handleChange(row.sentence_id, "sesotho_text", e.target.value)
                        }
                        style={styles.cellTextarea}
                      />
                    </td>
                    <td>
                      <select
                        value={row.reviewer_status || "raw"}
                        onChange={e =>
                          handleChange(row.sentence_id, "reviewer_status", e.target.value)
                        }
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <textarea
                        value={row.notes || ""}
                        onChange={e =>
                          handleChange(row.sentence_id, "notes", e.target.value)
                        }
                        style={styles.cellTextarea}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: "7px 12px", fontSize: 13 }}
                        onClick={() =>
                          saveRow(row.sentence_id, {
                            sesotho_text:    row.sesotho_text,
                            reviewer_status: row.reviewer_status,
                            notes:           row.notes,
                          })
                        }
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const styles = {
  toolbar: {
    display:      "flex",
    gap:          "10px",
    marginBottom: "14px",
    alignItems:   "center",
    flexWrap:     "wrap",
  },
  toolInput: {
    padding:      "9px 12px",
    border:       "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize:     "14px",
    color:        "#0f172a",
    background:   "#fff",
  },
  cellTextarea: {
    width:        "100%",
    minHeight:    "64px",
    padding:      "7px 10px",
    border:       "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize:     "13px",
    resize:       "vertical",
    fontFamily:   "inherit",
  },
};

export default CorpusDashboard;
