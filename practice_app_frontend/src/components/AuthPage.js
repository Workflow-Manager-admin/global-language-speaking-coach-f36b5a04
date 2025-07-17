import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../App.css";

// PUBLIC_INTERFACE
function AuthPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [mode, setMode] = useState("login");
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAuth = (e) => {
    e.preventDefault();
    // Demo: direct login (real app would use backend)
    if (!form.username || !form.password) {
      setError("Please fill all fields");
      return;
    }
    login(form.username, form.password)
      .catch(() => setError("Invalid credentials"));
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{mode === "login" ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleAuth}>
          <input
            name="username"
            autoFocus
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            aria-label="Username"
          />
          <input
            name="password"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={handleChange}
            aria-label="Password"
          />
          {error && <div className="auth-error">{error}</div>}
          <button className="btn btn-accent" type="submit">
            {mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>
        <div style={{marginTop:16}}>
          {mode === "login"
            ? (<span>Don't have an account? <button onClick={() => setMode("signup")} className="btn-link">Sign Up</button></span>)
            : (<span>Already have an account? <button onClick={() => setMode("login")} className="btn-link">Login</button></span>)
          }
        </div>
      </div>
    </div>
  );
}
export default AuthPage;
