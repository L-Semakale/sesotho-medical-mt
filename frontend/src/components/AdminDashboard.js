import { useState } from "react";
import CorpusDashboard from "./CorpusDashboard";
import EvaluationPanel from "./EvaluationPanel";
import FeedbackViewer  from "./FeedbackViewer";
import Translator      from "./Translator";

const TABS = [
  { id: "translate",  label: "Translate"         },
  { id: "corpus",     label: "Corpus Manager"     },
  { id: "evaluation", label: "Evaluation Metrics" },
  { id: "feedback",   label: "User Feedback"      },
];

function AdminDashboard({ username }) {
  const [activeTab, setActiveTab] = useState("translate");

  return (
    <section>

      {/* Admin Banner */}
      <div style={styles.banner}>
        <div>
          <h2 style={styles.bannerTitle}>Admin Dashboard</h2>
          <p style={styles.bannerSub}>
            Translation · Corpus management · Model evaluation · User feedback.
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
        {activeTab === "translate"  && <Translator username={username} />}
        {activeTab === "corpus"     && <CorpusDashboard />}
        {activeTab === "evaluation" && <EvaluationPanel />}
        {activeTab === "feedback"   && <FeedbackViewer showForm={false} />}
      </div>

    </section>
  );
}

const styles = {
  banner: {
    background:   "#f8fafc",
    border:       "1px solid #e2e8f0",
    borderLeft:   "4px solid #1e3a8a",
    borderRadius: "6px",
    padding:      "18px 22px",
    marginBottom: "20px",
  },
  bannerTitle: {
    margin:     "0 0 4px",
    color:      "#0f172a",
    fontSize:   "17px",
    fontWeight: 700,
  },
  bannerSub: {
    margin:   0,
    color:    "#64748b",
    fontSize: "13px",
  },
  tabBar: {
    display:      "flex",
    gap:          "4px",
    borderBottom: "2px solid #e2e8f0",
    marginBottom: "24px",
    flexWrap:     "wrap",
  },
  tabBtn: {
    border:           "none",
    borderBottom:     "2px solid transparent",
    marginBottom:     "-2px",
    background:       "transparent",
    padding:          "10px 18px",
    fontWeight:       500,
    fontSize:         "14px",
    color:            "#64748b",
    cursor:           "pointer",
    transition:       "color 0.15s, border-color 0.15s",
  },
  tabBtnActive: {
    color:        "#1e3a8a",
    borderBottom: "2px solid #1e3a8a",
    fontWeight:   700,
  },
  panel: {
    animation: "fadeIn 0.15s ease",
  },
};

export default AdminDashboard;
