import { useState } from "react";

const API = "http://127.0.0.1:5000";

function Login({ onLogin }) {
  const [mode,     setMode]     = useState("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);

  function switchMode(m) {
    setMode(m);
    setError("");
    setPassword("");
    setConfirm("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (password !== confirm) {
        return setError("Passwords do not match.");
      }
      if (password.length < 6) {
        return setError("Password must be at least 6 characters.");
      }
    }

    setBusy(true);

    try {
      if (mode === "signup") {
        // Step 1: Register the account
        const registerRes = await fetch(`${API}/api/register`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            username: username.trim().toLowerCase(),
            password,
          }),
        });

        const registerData = await registerRes.json();
        if (!registerRes.ok) throw new Error(registerData.error || "Registration failed.");

        // Step 2: Immediately log them in
        const loginRes = await fetch(`${API}/api/login`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            username: username.trim().toLowerCase(),
            password,
          }),
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error || "Auto-login failed.");

        onLogin(loginData); // { username, role }

      } else {
        // Normal sign in
        const res  = await fetch(`${API}/api/login`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            username: username.trim().toLowerCase(),
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid username or password.");

        onLogin(data); // { username, role }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>🏥 Medical MT</h1>
        <p className="sub">Sesotho–English Translation Prototype</p>

        {/* Sign In / Sign Up toggle */}
        <div className="login-toggle">
          <button
            type="button"
            className={mode === "signin" ? "active" : ""}
            onClick={() => switchMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {mode === "signup" && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={busy}
          >
            {busy
              ? "Please wait…"
              : mode === "signup" ? "Create Account" : "Sign In"
            }
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
