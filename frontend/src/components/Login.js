// frontend/src/components/Login.js

import { useState } from "react";
import { API } from "../config";

function Login({ onLogin }) {
  const [mode, setMode] = useState("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setConfirm("");
  }

  function saveSession(data) {
    if (data?.token) {
      localStorage.setItem("token", data.token);
    }

    if (data?.username) {
      localStorage.setItem("username", data.username);
    }

    if (data?.role) {
      localStorage.setItem("role", data.role);
    }

    onLogin(data);
  }

  async function loginUser(cleanUsername, userPassword) {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: cleanUsername,
        password: userPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Invalid username or password.");
    }

    return data;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername) {
      setError("Please enter your username.");
      return;
    }

    if (mode === "signup") {
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setBusy(true);

    try {
      if (mode === "signup") {
        const registerRes = await fetch(`${API}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: cleanUsername,
            password,
          }),
        });

        const registerData = await registerRes.json();

        if (!registerRes.ok) {
          throw new Error(registerData.error || "Registration failed.");
        }

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
    <div className="login-page">
      <div className="login-box">
        <h1>🏥 Medical MT</h1>
        <p className="sub">Sesotho–English Translation Prototype</p>

        <div className="login-toggle" role="tablist" aria-label="Login mode">
          <button
            type="button"
            className={mode === "signin" ? "active" : ""}
            onClick={() => switchMode("signin")}
            role="tab"
            aria-selected={mode === "signin"}
          >
            Sign In
          </button>

          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => switchMode("signup")}
            role="tab"
            aria-selected={mode === "signup"}
          >
            Sign Up
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
            />
          </div>

          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
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
              : mode === "signup"
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
