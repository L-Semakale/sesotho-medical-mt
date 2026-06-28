import { useState } from "react";
import "./App.css";
import Login          from "./components/Login";
import UserDashboard  from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const isAdmin = user.role === "admin";

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
    </main>
  );
}

export default App;
