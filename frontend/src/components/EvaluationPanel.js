const METRICS = [
  {
    model:  "NLLB-200 (Baseline)",
    bleu:   "14.2",
    chrf:   "0.38",
    ter:    "76.4",
    status: "verified",
    label:  "Completed",
  },
  {
    model:  "mBART-50 (Baseline)",
    bleu:   "11.8",
    chrf:   "0.32",
    ter:    "81.2",
    status: "verified",
    label:  "Completed",
  },
  {
    model:  "Fine-Tuned NLLB-200",
    bleu:   "—",
    chrf:   "—",
    ter:    "—",
    status: "translated",
    label:  "Pending Training",
  },
];

const PILL = {
  verified:   { background: "#dcfce7", color: "#15803d" },
  translated: { background: "#fef9c3", color: "#a16207" },
};

function EvaluationPanel() {
  return (
    <section>

      {/* Metric explanation cards */}
      <div style={styles.metricRow}>
        {[
          { name: "BLEU",   arrow: "↑ Higher is better", desc: "Measures n-gram overlap between MT output and reference translations." },
          { name: "chrF++", arrow: "↑ Higher is better", desc: "Character-level F-score. More robust for morphologically rich languages like Sesotho." },
          { name: "TER",    arrow: "↓ Lower is better",  desc: "Translation Edit Rate. Counts edits needed to match the reference." },
        ].map(m => (
          <div key={m.name} style={styles.metricCard}>
            <strong style={{ fontSize: 18, color: "#1e3a8a" }}>{m.name}</strong>
            <span style={styles.arrow}>{m.arrow}</span>
            <p style={styles.metricDesc}>{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Results Table */}
      <div className="card">
        <h2>Model Evaluation Results</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
          Scores evaluated against the verified reference corpus using
          SacreBLEU and the HuggingFace Evaluate library.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Model Variant</th>
                <th>BLEU ↑</th>
                <th>chrF++ ↑</th>
                <th>TER ↓</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map(r => (
                <tr key={r.model}>
                  <td><strong>{r.model}</strong></td>
                  <td>{r.bleu}</td>
                  <td>{r.chrf}</td>
                  <td>{r.ter}</td>
                  <td>
                    <span style={{
                      ...(PILL[r.status] || PILL.translated),
                      padding:       "3px 10px",
                      borderRadius:  "999px",
                      fontSize:      "11px",
                      fontWeight:    700,
                      textTransform: "uppercase",
                    }}>
                      {r.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const styles = {
  metricRow: {
    display:       "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap:           "16px",
    marginBottom:  "22px",
  },
  metricCard: {
    background:    "#fff",
    borderRadius:  "12px",
    padding:       "18px",
    boxShadow:     "0 2px 8px rgba(0,0,0,0.06)",
    borderTop:     "4px solid #1e3a8a",
    display:       "flex",
    flexDirection: "column",
    gap:           "4px",
  },
  arrow: {
    fontSize:   "12px",
    fontWeight: 600,
    color:      "#0d9488",
  },
  metricDesc: {
    margin:   "4px 0 0",
    fontSize: "13px",
    color:    "#64748b",
    lineHeight: 1.5,
  },
};

export default EvaluationPanel;
