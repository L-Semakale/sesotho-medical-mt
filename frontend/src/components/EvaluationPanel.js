// frontend/src/components/EvaluationPanel.js

import StatusPill from "./ui/StatusPill";
import Alert      from "./ui/Alert";

const METRICS = [
  {
    model:  "NLLB-200 distilled-600M (Baseline)",
    bleu:   "27.01",
    chrf:   "49.15",
    ter:    "60.67",
    status: "evaluated",
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

const ERROR_ANALYSIS = [
  { severity: "None (Safe)", count: 6, pct: "60%", color: "#16a34a" },
  { severity: "Minor",       count: 3, pct: "30%", color: "#d97706" },
  { severity: "Critical",    count: 1, pct: "10%", color: "#dc2626" },
];

const METRIC_CARDS = [
  {
    name:      "BLEU",
    score:     "27.01",
    direction: "Higher is better",
    threshold: "Above 20 = understandable",
    desc:      "Measures n-gram overlap between MT output and reference. A score of 27 is strong for low-resource Sesotho.",
    color:     "#1d4ed8",
  },
  {
    name:      "chrF++",
    score:     "49.15",
    direction: "Higher is better",
    threshold: "Primary metric for Sesotho",
    desc:      "Character-level F-score. More robust for morphologically rich languages like Sesotho.",
    color:     "#16a34a",
    primary:   true,
  },
  {
    name:      "TER",
    score:     "60.67",
    direction: "Lower is better",
    threshold: "~60% expected for low-resource MT",
    desc:      "Translation Edit Rate. Counts edits needed to match the reference. Score aligns with expected low-resource baseline.",
    color:     "#dc2626",
  },
];

function EvaluationPanel() {
  return (
    <section>

      {/* Metric summary cards */}
      <div style={styles.metricRow}>
        {METRIC_CARDS.map(m => (
          <div
            key={m.name}
            style={{
              ...styles.metricCard,
              borderLeft: `4px solid ${m.color}`,
            }}
          >
            <div style={styles.metricHeader}>
              <span style={styles.metricName}>
                {m.name}
                {m.primary && (
                  <span style={styles.primaryBadge}>Primary</span>
                )}
              </span>
              <span style={{ ...styles.metricScore, color: m.color }}>
                {m.score}
              </span>
            </div>

            <span style={{ ...styles.direction, color: m.color }}>
              {m.direction}
            </span>

            <span style={styles.threshold}>{m.threshold}</span>

            <p style={styles.metricDesc}>{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Results table */}
      <div className="card">
        <h2 style={styles.cardTitle}>Model Evaluation Results</h2>

        <p style={styles.cardSub}>
          NLLB-200 evaluated zero-shot on a 100-pair held-out Sesotho–English
          medical test set using SacreBLEU. The test set was kept separate from
          the corpus lookup cache.
        </p>

        <p style={{ ...styles.cardSub, fontSize: 12, marginBottom: 16 }}>
          chrF++ is the primary metric — character-level matching is more
          reliable for morphologically rich languages.
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
                  <td><StatusPill value={r.status}>{r.label}</StatusPill></td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error analysis */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={styles.cardTitle}>Qualitative Error Analysis</h2>

        <p style={{ ...styles.cardSub, marginBottom: 16 }}>
          10 NLLB-200 outputs were manually reviewed and classified by error
          severity. Automatic metrics alone cannot confirm medical safety — a
          sentence can score well on BLEU while containing a clinically
          dangerous error.
        </p>

        <div style={styles.errorGrid}>
          {ERROR_ANALYSIS.map(e => (
            <div
              key={e.severity}
              style={{
                ...styles.errorCard,
                borderLeft: `4px solid ${e.color}`,
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 800, color: e.color }}>
                {e.count}
              </span>
              <strong style={{ fontSize: 13, color: "#0f172a" }}>{e.severity}</strong>
              <span style={{ fontSize: 12, color: "#64748b" }}>{e.pct} of sample</span>
            </div>
          ))}
        </div>

        <Alert type="error" style={{ marginTop: 18 }}>
          <strong>Critical Finding — Row 7</strong>
          <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.6 }}>
            NLLB-200 hallucinated <em>"lethal dose"</em> from{" "}
            <em>"missed dose"</em> — a translation that could cause serious
            misunderstanding in a healthcare setting. This supports the need for
            verified corpus lookup, safety warnings, and professional review.
          </p>
        </Alert>
      </div>

      {/* Interpretation */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={styles.cardTitle}>Evaluation Interpretation</h2>

        <p style={{ ...styles.cardSub, marginBottom: 12 }}>
          The baseline result shows that NLLB-200 can produce understandable
          Sesotho–English medical translations, but is not clinically safe as a
          standalone translator. The safest prototype strategy is a hybrid
          approach:
        </p>

        <ul style={styles.list}>
          <li>Prefer <strong>verified corpus matches</strong> where available.</li>
          <li>Use <strong>NLLB-200 generation</strong> only as a fallback.</li>
          <li>Display <strong>medical disclaimers and high-risk warnings</strong>.</li>
          <li>Require <strong>bilingual professional review</strong> before any clinical use.</li>
        </ul>
      </div>

    </section>
  );
}

const styles = {
  metricRow: {
    display:             "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap:                 14,
    marginBottom:        20,
  },
  metricCard: {
    background:   "#fff",
    border:       "1px solid #e2e8f0",
    borderRadius: 6,
    padding:      "16px 18px",
    display:      "flex",
    flexDirection: "column",
    gap:          6,
  },
  metricHeader: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
  },
  metricName: {
    fontSize:   14,
    fontWeight: 700,
    color:      "#0f172a",
    display:    "flex",
    alignItems: "center",
    gap:        8,
  },
  primaryBadge: {
    fontSize:     10,
    fontWeight:   600,
    background:   "#f0fdf4",
    color:        "#16a34a",
    border:       "1px solid #bbf7d0",
    borderRadius: 4,
    padding:      "2px 6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  metricScore: {
    fontSize:   22,
    fontWeight: 800,
  },
  direction: {
    fontSize:   11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  threshold: {
    fontSize: 11,
    color:    "#64748b",
  },
  metricDesc: {
    color:        "#475569",
    fontSize:     13,
    lineHeight:   1.6,
    margin:       0,
    paddingTop:   4,
    borderTop:    "1px solid #f1f5f9",
  },
  cardTitle: {
    fontSize:     16,
    fontWeight:   700,
    color:        "#0f172a",
    marginBottom: 6,
  },
  cardSub: {
    fontSize:     13,
    color:        "#64748b",
    marginTop:    0,
    lineHeight:   1.6,
  },
  errorGrid: {
    display:             "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap:                 12,
  },
  errorCard: {
    background:    "#fff",
    border:        "1px solid #e2e8f0",
    borderRadius:  6,
    padding:       "14px 16px",
    display:       "flex",
    flexDirection: "column",
    gap:           4,
  },
  list: {
    color:      "#475569",
    lineHeight: 1.9,
    margin:     0,
    fontSize:   14,
  },
};

export default EvaluationPanel;
