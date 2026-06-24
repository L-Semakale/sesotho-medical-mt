import { useState } from "react";
import CorpusDashboard from "./CorpusDashboard";
import EvaluationPanel from "./EvaluationPanel";
import FeedbackViewer  from "./FeedbackViewer";
import Translator      from "./Translator";   // ← correct import

const TABS = [
  { id: "translate",  label: "🌐 Translate"          },
  { id: "corpus",     label: "📂 Corpus Manager"      },
  { id: "evaluation", label: "📊 Evaluation Metrics"  },
  { id: "feedback",   label: "💬 User Feedback"       },
];

function AdminDashboard({ username }) {   // ← accept username prop
  const [activeTab, setActiveTab] = useState("translate");

  return (
    <section>

      {/* Admin Banner */}
      <div style={styles.banner}>
        <div>
          <h2 style={styles.bannerTitle}>🔒 Admin Dashboard</h2>
          <p style={styles.bannerSub}>
            Translation · Corpus management · Model evaluation · User feedback review.
            Restricted to the system administrator.
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab.id ? styles.tabBtnActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div style={styles.panel}>
        {activeTab === "translate"  && <Translator username={username} />}  {/* ← pass username */}
        {activeTab === "corpus"     && <CorpusDashboard />}
        {activeTab === "evaluation" && <EvaluationPanel />}
        {activeTab === "feedback"   && <FeedbackViewer showForm={false} />}
      </div>

    </section>
  );
}

const styles = {
  banner: {
    background:   "linear-gradient(135deg, #1e3a8a, #1e40af)",
    borderRadius: "14px",
    padding:      "22px 26px",
    marginBottom: "22px",
    borderLeft:   "6px solid #f59e0b",
  },
  bannerTitle: {
    margin:     "0 0 6px",
    color:      "#fff",
    fontSize:   "20px",
  },
  bannerSub: {
    margin:   0,
    color:    "#bfdbfe",
    fontSize: "14px",
  },
  tabBar: {
    display:      "flex",
    gap:          "8px",
    background:   "#fff",
    borderRadius: "14px",
    padding:      "6px",
    marginBottom: "22px",
    boxShadow:    "0 2px 8px rgba(0,0,0,0.06)",
    flexWrap:     "wrap",      // ← mobile friendly
  },
  tabBtn: {
    flex:         1,
    border:       "none",
    background:   "transparent",
    padding:      "11px 16px",
    borderRadius: "10px",
    fontWeight:   600,
    fontSize:     "14px",
    color:        "#64748b",
    cursor:       "pointer",
    transition:   "all 0.2s",
    minWidth:     "120px",     // ← prevents squishing
  },
  tabBtnActive: {
    background: "#1e3a8a",
    color:      "#fff",
    boxShadow:  "0 4px 12px rgba(30,58,138,0.25)",
  },
  panel: {
    animation: "fadeIn 0.2s ease",
  },
};

export default AdminDashboard;
