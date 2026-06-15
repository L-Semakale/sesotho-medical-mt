import { useState } from "react";
import Disclaimer from "./Disclaimer";
import Translator from "./Translator";
import History    from "./History";
import Feedback   from "./FeedbackViewer";

const TABS = [
  { id: "translate", label: "🔀 Translate" },
  { id: "history",   label: "📜 History"   },
  { id: "feedback",  label: "💬 Feedback"  },
];

function UserDashboard({ username }) {
  const [activeTab, setActiveTab] = useState("translate");

  return (
    <section>
      <Disclaimer />

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
        {activeTab === "translate" && <Translator username={username} />}
        {activeTab === "history"   && <History    username={username} />}
        {activeTab === "feedback"  && <Feedback   username={username} />}
      </div>
    </section>
  );
}

const styles = {
  tabBar: {
    display:      "flex",
    gap:          "8px",
    background:   "#fff",
    borderRadius: "14px",
    padding:      "6px",
    marginBottom: "22px",
    boxShadow:    "0 2px 8px rgba(0,0,0,0.06)",
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

export default UserDashboard;
