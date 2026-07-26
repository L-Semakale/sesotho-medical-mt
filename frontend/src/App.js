import { useState } from "react";
import "./App.css";
import Login          from "./components/Login";
import UserDashboard  from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import PrivacyPolicy  from "./components/PrivacyPolicy";

function App() {
  const [user, setUser] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const isAdmin = user.role === "admin";

  // Show Privacy Policy page when link is clicked
  if (showPrivacy) {
    return (
      <main className="page">
        <button
          className="btn"
          onClick={() => setShowPrivacy(false)}
          style={{ margin: '20px' }}
        >
          ← Back
        </button>
        <PrivacyPolicy />
      </main>
    );
  }

  return (
    <main className="page">
      <header className="app-header">
        <div>
          <p className="eyebrow">Proof-of-Concept Prototype</p>
          <h1>Sesotho–English Medical MT System</h1>
          <p>
            Signed in as&nbsp;
            <strong style={{ textTransform: "capitalize" }}>
              {user.username}
            </strong>
            &nbsp;·&nbsp;
            <span style={{ opacity: 0.8 }}>{user.role} account</span>
          </p>
        </div>

        <div className="header-right">
          {isAdmin && (
            <div className="corpus-badge">
              <small>Corpus Goal</small>
              <strong>5 000</strong>
              <small>sentence pairs</small>
            </div>
          )}

          <button className="btn btn-danger" onClick={() => setUser(null)}>
            Sign Out
          </button>
        </div>
      </header>

      {isAdmin ? <AdminDashboard /> : <UserDashboard username={user.username} />}

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        marginTop: '60px',
        borderTop: '1px solid #e0e0e0',
        fontSize: '0.85rem',
        color: '#666'
      }}>
        <button
          onClick={() => setShowPrivacy(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#1a73e8',
            cursor: 'pointer',
            fontSize: '0.85rem',
            textDecoration: 'underline'
          }}
        >
          Terms of Use & Privacy Policy
        </button>
      </footer>
    </main>
  );
}

export default App;
