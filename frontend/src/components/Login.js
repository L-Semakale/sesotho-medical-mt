import { useState } from "react";
import { API } from "../config";

function Login({ onLogin }) {
  const [mode, setMode]         = useState("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setConfirm("");
  }

  function saveSession(data) {
    if (data?.token)    localStorage.setItem("token",    data.token);
    if (data?.username) localStorage.setItem("username", data.username);
    if (data?.role)     localStorage.setItem("role",     data.role);
    onLogin(data);
  }

  async function loginUser(cleanUsername, userPassword) {
    const res  = await fetch(`${API}/api/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username: cleanUsername, password: userPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Invalid username or password.");
    return data;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) { setError("Please enter your username."); return; }

    if (mode === "signup") {
      if (password !== confirm)  { setError("Passwords do not match."); return; }
      if (password.length < 6)   { setError("Password must be at least 6 characters."); return; }
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const regRes  = await fetch(`${API}/api/register`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ username: cleanUsername, password }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || "Registration failed.");
        const loginData = await loginUser(cleanUsername, password);
        saveSession(loginData);
      } else {
        const loginData = await loginUser(cleanUsername, password);
        saveSession(loginData);
      }
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>

        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>MT</div>
          <div>
            <h1 style={styles.title}>Medical Translator</h1>
            <p style={styles.subtitle}>Sesotho – English · Clinical Prototype</p>
          </div>
        </div>

        <div style={styles.toggle} role="tablist" aria-label="Login mode">
          {["signin", "signup"].map(m => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              style={{
                ...styles.toggleBtn,
                ...(mode === m ? styles.toggleBtnActive : {}),
              }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {error && <p style={styles.errorMsg}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              style={styles.input}
            />
          </div>

          {mode === "signup" && (
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                style={styles.input}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{ ...styles.submitBtn, opacity: busy ? 0.7 : 1 }}
          >
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight:      "100vh",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    background:     "#f1f5f9",
    padding:        "24px 16px",
  },
  box: {
    background:   "#fff",
    border:       "1px solid #e2e8f0",
    borderRadius: "8px",
    padding:      "36px 32px",
    width:        "100%",
    maxWidth:     "400px",
    boxShadow:    "0 1px 4px rgba(0,0,0,0.06)",
  },
  logoArea: {
    display:      "flex",
    alignItems:   "center",
    gap:          14,
    marginBottom: 28,
  },
  logoIcon: {
    width:          44,
    height:         44,
    background:     "#1e3a8a",
    color:          "#fff",
    borderRadius:   6,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontWeight:     800,
    fontSize:       14,
    letterSpacing:  "0.05em",
    flexShrink:     0,
  },
  title: {
    margin:     0,
    fontSize:   17,
    fontWeight: 700,
    color:      "#0f172a",
  },
  subtitle: {
    margin:   "2px 0 0",
    fontSize: 12,
    color:    "#94a3b8",
  },
  toggle: {
    display:      "flex",
    border:       "1px solid #e2e8f0",
    borderRadius: 6,
    overflow:     "hidden",
    marginBottom: 22,
  },
  toggleBtn: {
    flex:       1,
    border:     "none",
    background: "#f8fafc",
    padding:    "10px",
    fontSize:   13,
    fontWeight: 500,
    color:      "#64748b",
    cursor:     "pointer",
  },
  toggleBtnActive: {
    background: "#1e3a8a",
    color:      "#fff",
    fontWeight: 700,
  },
  errorMsg: {
    background:   "#fef2f2",
    border:       "1px solid #fecaca",
    borderRadius: 5,
    color:        "#b91c1c",
    fontSize:     13,
    padding:      "10px 12px",
    marginBottom: 16,
  },
  form: {
    display:       "flex",
    flexDirection: "column",
    gap:           14,
  },
  formGroup: {
    display:       "flex",
    flexDirection: "column",
    gap:           6,
  },
  label: {
    fontSize:      12,
    fontWeight:    600,
    color:         "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    padding:      "10px 12px",
    border:       "1px solid #cbd5e1",
    borderRadius: 6,
    fontSize:     14,
    color:        "#0f172a",
    background:   "#fff",
    outline:      "none",
    width:        "100%",
    boxSizing:    "border-box",
  },
  submitBtn: {
    marginTop:    4,
    padding:      "11px",
    background:   "#1e3a8a",
    color:        "#fff",
    border:       "none",
    borderRadius: 6,
    fontSize:     14,
    fontWeight:   700,
    cursor:       "pointer",
    width:        "100%",
  },
};

export default Login;
