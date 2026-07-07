import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../AuthContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Signup() {
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
      const u = await authApi.signup(email, password);
      setUser(u);
      nav('/onboarding');
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
        <h1 className="font-bold text-lg mb-1">Create your account</h1>
        <p className="text-xs text-zinc-500 mb-6">Free to start. No card required.</p>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
        <div className="mt-3">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          <p className="text-[11px] text-zinc-600 mt-1">At least 8 characters.</p>
        </div>
        {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
        <button
          disabled={busy || !email || password.length < 8}
          className="w-full mt-5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
          style={{ background: 'var(--ll-orange)' }}
        >
          {busy ? 'Creating account…' : 'Continue'}
        </button>
        <p className="text-xs text-zinc-500 mt-4">
          Already have an account? <Link to="/login" className="underline hover:text-white">Log in</Link>
        </p>
      </form>
    </div>
  );
}
