import { useState } from "react";
import Disclaimer from "./Disclaimer";
import Translator from "./Translator";
import History    from "./History";
import Feedback   from "./FeedbackViewer";
import SUSForm    from "./SUSForm";

const TABS = [
  { id: "translate", label: "Translate" },
  { id: "history",   label: "History"   },
  { id: "sus",       label: "Usability" },
  { id: "feedback",  label: "Feedback"  },
];

function UserDashboard({ username }) {
  const [activeTab, setActiveTab] = useState("translate");

  return (
    <section>
      <Disclaimer />

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

      <div style={styles.panel}>
        {activeTab === "translate" && <Translator username={username} />}
        {activeTab === "history"   && <History    username={username} />}
        {activeTab === "sus"       && <SUSForm    username={username} />}
        {activeTab === "feedback"  && (
          <Feedback
            username={username}
            showAverage={false}
            showDistribution={false}
            showResponses={false}
          />
        )}
      </div>
    </section>
  );
}

const styles = {
  tabBar: {
    display:      "flex",
    gap:          "4px",
    borderBottom: "2px solid #e2e8f0",
    marginBottom: "24px",
    flexWrap:     "wrap",
  },
  tabBtn: {
    border:       "none",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
    background:   "transparent",
    padding:      "10px 18px",
    fontWeight:   500,
    fontSize:     "14px",
    color:        "#64748b",
    cursor:       "pointer",
    transition:   "color 0.15s, border-color 0.15s",
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

export default UserDashboard;
