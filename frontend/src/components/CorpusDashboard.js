// frontend/src/components/CorpusDashboard.js

import { useEffect, useMemo, useState } from "react";
import { API, getAuthHeaders } from "../config";
import StatusPill from "./ui/StatusPill";
import Alert from "./ui/Alert";

const STATUS_OPTIONS = ["raw", "translated", "reviewed", "verified", "rejected"];
const PAGE_SIZE = 25;

function CorpusDashboard() {
  const [corpus, setCorpus] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    translated: 0,
    missing: 0,
    status_counts: {},
  });

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setMsg({ text: "", type: "" });

      const [cRes, sRes] = await Promise.all([
        fetch(`${API}/api/corpus`, {
          headers: getAuthHeaders({ "Content-Type": undefined }),
        }),
        fetch(`${API}/api/stats`, {
          headers: getAuthHeaders({ "Content-Type": undefined }),
        }),
      ]);

      const cData = await cRes.json();
      const sData = await sRes.json();

      if (!cRes.ok) {
        throw new Error(cData.error || "Could not load corpus.");
      }

      if (!sRes.ok) {
        throw new Error(sData.error || "Could not load corpus statistics.");
      }

      setCorpus(Array.isArray(cData) ? cData : []);
      setStats(sData || {});
    } catch (err) {
      showMsg(err.message || "Could not load corpus. Is Flask running?", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function showMsg(text, type = "success") {
    setMsg({ text, type });

    window.clearTimeout(showMsg.timer);
    showMsg.timer = window.setTimeout(() => {
      setMsg({ text: "", type: "" });
    }, 3500);
  }

  async function saveRow(sentenceId, fields) {
    try {
      setSavingId(sentenceId);

      const res = await fetch(`${API}/api/corpus/${sentenceId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(fields),
      });

      let data = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.error || "Save failed. Please try again.");
      }

      showMsg(`Sentence #${sentenceId} saved successfully.`, "success");
      await loadData();
    } catch (err) {
      showMsg(err.message || "Save failed. Please try again.", "error");
    } finally {
      setSavingId(null);
    }
  }

  function handleChange(id, field, value) {
    setCorpus(prev =>
      prev.map(row =>
        Number(row.sentence_id) === Number(id)
          ? { ...row, [field]: value, _dirty: true }
          : row
      )
    );
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    return corpus.filter(row => {
      const matchesFilter =
        filter === "all" || row.reviewer_status === filter;

      const matchesSearch =
        !q ||
        row.english_text?.toLowerCase().includes(q) ||
        row.sesotho_text?.toLowerCase().includes(q) ||
        row.domain_category?.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [corpus, search, filter]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const pagedRows = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

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
      <div className="stats-grid">
        {[
          {
            label: "Total Entries",
            value: stats.total || 0,
            color: "#1e3a8a",
          },
          {
            label: "Translated",
            value: stats.translated || 0,
            color: "#0d9488",
          },
          {
            label: "Missing",
            value: stats.missing || 0,
            color: "#f59e0b",
          },
          {
            label: "Verified",
            value: stats.status_counts?.verified || 0,
            color: "#16a34a",
          },
        ].map(s => (
          <div
            className="stat-card"
            key={s.label}
            style={{ borderTopColor: s.color }}
          >
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={styles.header}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Corpus Dataset Editor</h2>
            <p className="muted" style={{ margin: 0 }}>
              Review, edit, and verify Sesotho-English medical sentence pairs.
            </p>
          </div>

          <button className="btn btn-primary" type="button" onClick={loadData}>
            ↻ Refresh
          </button>
        </div>

        <div style={styles.toolbar}>
          <input
            type="text"
            placeholder="Search English, Sesotho, or domain…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, ...styles.toolInput }}
            aria-label="Search corpus"
          />

          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={styles.toolInput}
            aria-label="Filter by reviewer status"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {msg.text && (
          <Alert type={msg.type === "error" ? "error" : "success"}>
            {msg.text}
          </Alert>
        )}

        <div style={styles.resultMeta}>
          <p className="muted" style={{ margin: 0 }}>
            Showing <strong>{pagedRows.length}</strong> on this page ·{" "}
            <strong>{visible.length}</strong> matched ·{" "}
            <strong>{corpus.length}</strong> total entries
          </p>

          <p className="muted" style={{ margin: 0 }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>ID</th>
                <th style={{ width: 110 }}>Domain</th>
                <th>English Source</th>
                <th>Sesotho Translation</th>
                <th style={{ width: 130 }}>Status</th>
                <th>Notes</th>
                <th style={{ width: 85 }}>Save</th>
              </tr>
            </thead>

            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      color: "#94a3b8",
                    }}
                  >
                    No entries match your search or filter.
                  </td>
                </tr>
              ) : (
                pagedRows.map(row => (
                  <tr key={row.sentence_id}>
                    <td style={{ fontWeight: 600, color: "#94a3b8" }}>
                      {row.sentence_id}
                    </td>

                    <td>
                      <StatusPill value={row.domain_category || "general"} />
                    </td>

                    <td style={{ maxWidth: 240, lineHeight: 1.5 }}>
                      {row.english_text}
                    </td>

                    <td>
                      <textarea
                        value={row.sesotho_text || ""}
                        onChange={e =>
                          handleChange(
                            row.sentence_id,
                            "sesotho_text",
                            e.target.value
                          )
                        }
                        style={styles.cellTextarea}
                        aria-label={`Sesotho translation for sentence ${row.sentence_id}`}
                      />
                    </td>

                    <td>
                      <select
                        value={row.reviewer_status || "raw"}
                        onChange={e =>
                          handleChange(
                            row.sentence_id,
                            "reviewer_status",
                            e.target.value
                          )
                        }
                        style={styles.statusSelect}
                        aria-label={`Reviewer status for sentence ${row.sentence_id}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <textarea
                        value={row.notes || ""}
                        onChange={e =>
                          handleChange(row.sentence_id, "notes", e.target.value)
                        }
                        style={styles.notesTextarea}
                        aria-label={`Notes for sentence ${row.sentence_id}`}
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={savingId === row.sentence_id}
                        onClick={() =>
                          saveRow(row.sentence_id, {
                            sesotho_text: row.sesotho_text || "",
                            reviewer_status: row.reviewer_status || "raw",
                            notes: row.notes || "",
                          })
                        }
                        style={{
                          padding: "7px 10px",
                          fontSize: 12,
                          opacity: savingId === row.sentence_id ? 0.7 : 1,
                        }}
                      >
                        {savingId === row.sentence_id ? "Saving…" : "Save"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.pagination}>
          <button
            type="button"
            className="btn"
            disabled={currentPage <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            ← Previous
          </button>

          <span className="muted">
            Page {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            className="btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  toolbar: {
    display: "flex",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  toolInput: {
    minWidth: 180,
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
  },
  resultMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  cellTextarea: {
    width: "100%",
    minWidth: 220,
    minHeight: 70,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1.5,
    boxSizing: "border-box",
  },
  notesTextarea: {
    width: "100%",
    minWidth: 150,
    minHeight: 70,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1.5,
    boxSizing: "border-box",
  },
  statusSelect: {
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    fontSize: 13,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 18,
    flexWrap: "wrap",
  },
};

export default CorpusDashboard;
