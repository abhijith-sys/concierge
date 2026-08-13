import type { FormEvent } from "react";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!loading && user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card stack" onSubmit={onSubmit}>
        <div>
          <h1 style={{ margin: 0 }}>Super Admin</h1>
          <p className="muted">Staff access only. No public registration.</p>
        </div>
        <label className="stack">
          <span className="muted">Email</span>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label className="stack">
          <span className="muted">Password</span>
          <input
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
