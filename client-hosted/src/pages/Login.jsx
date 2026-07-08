import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../AuthContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const u = await authApi.login(email, password);
      setUser(u);
      nav('/dashboard');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <form onSubmit={submit} className="w-full max-w-sm bg-zinc-900/70 border border-zinc-800 rounded-2xl p-8">
        <Link to="/" className="inline-block mb-6"><Logo /></Link>
        <h1 className="font-bold text-lg mb-6">Log in</h1>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        <div className="mt-3">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <p className="text-xs text-right mt-2">
          <Link to="/forgot-password" className="text-zinc-500 hover:text-white underline">Forgot password?</Link>
        </p>
        {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
        <button
          disabled={busy || !email || !password}
          className="w-full mt-5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
          style={{ background: 'var(--ll-orange)' }}
        >
          {busy ? 'Signing in…' : 'Log in'}
        </button>
        <p className="text-xs text-zinc-500 mt-4">
          No account? <Link to="/signup" className="underline hover:text-white">Sign up free</Link>
        </p>
      </form>
    </div>
  );
}
