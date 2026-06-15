const METRICS = [
  {
    model:  "NLLB-200 distilled-600M (Baseline)",
    bleu:   "27.01",
    chrf:   "49.15",
    ter:    "60.67",
    status: "verified",
    label:  "Evaluated",
    note:   "Primary model — zero-shot on 100-pair medical test set",
  },
  {
    model:  "mBART-50 (Baseline)",
    bleu:   "—",
    chrf:   "—",
    ter:    "—",
    status: "pending",
    label:  "Hardware Constrained",
    note:   "Excluded — limited Sesotho support; NLLB-200 selected per proposal Section 3.7",
  },
  {
    model:  "Fine-Tuned NLLB-200",
    bleu:   "—",
    chrf:   "—",
    ter:    "—",
    status: "pending",
    label:  "Out of Scope",
    note:   "Requires 50,000+ pairs and 16GB VRAM — infeasible per Section 3.9 risk strategy",
  },
];

const PILL = {
  verified: { background: "#dcfce7", color: "#15803d" },
  pending:  { background: "#fef9c3", color: "#a16207" },
};

const ERROR_ANALYSIS = [
  { severity: "None (Safe)",  count: 6,  pct: "60%", color: "#22c55e" },
  { severity: "Minor",        count: 3,  pct: "30%", color: "#f59e0b" },
  { severity: "Critical",     count: 1,  pct: "10%", color: "#ef4444" },
];

function EvaluationPanel() {
  return (
    <section>

      {/* Metric explanation cards */}
      <div style={styles.metricRow}>
        {[
          {
            name: "BLEU",
            score: "27.01",
            arrow: "↑ Higher is better",
            threshold: "Above 20 = understandable",
            desc: "Measures n-gram overlap between MT output and reference. Score of 27 is strong for low-resource Sesotho.",
            color: "#3b82f6",
          },
          {
            name: "chrF++",
            score: "49.15",
            arrow: "↑ Higher is better",
            threshold: "Headline metric for Sesotho",
            desc: "Character-level F-score. Primary metric — more robust for morphologically rich languages like Sesotho.",
            color: "#22c55e",
          },
          {
            name: "TER",
            score: "60.67",
            arrow: "↓ Lower is better",
            threshold: "~60% expected for low-resource MT",
            desc: "Translation Edit Rate. Counts edits needed to match the reference. Score aligns with expected low-resource baseline.",
            color: "#ef4444",
          },
        ].map(m => (
          <div key={m.name} style={{ ...styles.metricCard, borderTop: `4px solid ${m.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 18, color: "#1e3a8a" }}>{m.name}</strong>
              <span style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.score}</span>
            </div>
            <span style={{ ...styles.arrow, color: m.color }}>{m.arrow}</span>
            <span style={styles.threshold}>{m.threshold}</span>
            <p style={styles.metricDesc}>{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Results Table */}
      <div className="card">
        <h2>Model Evaluation Results</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 6 }}>
          NLLB-200 evaluated zero-shot on a 100-pair held-out Sesotho–English medical test set
          using SacreBLEU. Test set kept separate from corpus lookup cache.
        </p>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 12 }}>
          ⭐ chrF++ is the primary metric — character-level matching is more reliable for
          morphologically rich languages.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Model Variant</th>
                <th>BLEU ↑</th>
                <th>chrF++ ↑ ⭐</th>
                <th>TER ↓</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map(r => (
                <tr key={r.model}>
                  <td><strong>{r.model}</strong></td>
                  <td style={{ fontWeight: r.bleu !== "—" ? 700 : 400 }}>{r.bleu}</td>
                  <td style={{ fontWeight: r.chrf !== "—" ? 700 : 400 }}>{r.chrf}</td>
                  <td style={{ fontWeight: r.ter  !== "—" ? 700 : 400 }}>{r.ter}</td>
                  <td>
                    <span style={{
                      ...(PILL[r.status] || PILL.pending),
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}>
                      {r.label}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Analysis Summary */}
      <div className="card" style={{ marginTop: 22 }}>
        <h2>Qualitative Error Analysis</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
          10 NLLB-200 outputs manually reviewed and classified by error severity.
          Automatic metrics alone cannot confirm medical safety — a sentence can
          score well on BLEU while containing a clinically dangerous error.
        </p>

        <div style={styles.errorGrid}>
          {ERROR_ANALYSIS.map(e => (
            <div key={e.severity} style={{ ...styles.errorCard, borderLeft: `5px solid ${e.color}` }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: e.color }}>{e.count}</span>
              <strong style={{ fontSize: 14 }}>{e.severity}</strong>
              <span style={{ fontSize: 12, color: "#64748b" }}>{e.pct} of sample</span>
            </div>
          ))}
        </div>

        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 10,
          padding: "14px 18px",
          marginTop: 18,
        }}>
          <strong style={{ color: "#dc2626" }}>⚠️ Critical Finding — Row 7</strong>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>
            NLLB-200 hallucinated <em>"lethal dose"</em> from <em>"missed dose"</em> —
            a translation that could cause patient harm in real deployment.
            This directly justifies the dual-path architecture: the verified corpus cache
            intercepts high-frequency medical phrases before the model is called.
          </p>
        </div>

        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 10,
          padding: "14px 18px",
          marginTop: 12,
        }}>
          <strong style={{ color: "#15803d" }}>✅ Domain Adaptation Strategy</strong>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#14532d", lineHeight: 1.6 }}>
            Instead of fine-tuning (which requires 50,000+ pairs and 16GB VRAM),
            this project uses two lightweight strategies: (1) retrieval-based phrase cache
            for verified medical phrases, and (2) domain-specific evaluation on a held-out
            medical test set. This approach is consistent with Saunders (2022) on
            lightweight domain adaptation.
          </p>
        </div>
      </div>

    </section>
  );
}

const styles = {
  metricRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "22px",
  },
  metricCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  arrow: {
    fontSize: "12px",
    fontWeight: 600,
  },
  threshold: {
    fontSize: "11px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  metricDesc: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  errorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
  },
  errorCard: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
};

export default EvaluationPanel;