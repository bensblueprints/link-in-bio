import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import Logo from '../components/Logo.jsx';

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (password.length < 8) return setErr('Password must be at least 8 characters');
    if (password !== confirm) return setErr('Passwords do not match');
    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => nav('/login'), 2000);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-sm bg-zinc-900/70 border border-zinc-800 rounded-2xl p-8">
        <Link to="/" className="inline-block mb-6"><Logo /></Link>
        <h1 className="font-bold text-lg mb-2">Set a new password</h1>
        {!token ? (
          <p className="text-sm text-red-400 mt-4">
            Missing or invalid reset link. <Link to="/forgot-password" className="underline">Request a new one</Link>.
          </p>
        ) : done ? (
          <p className="text-sm text-zinc-300 mt-4">Password updated. Redirecting you to log in…</p>
        ) : (
          <form onSubmit={submit}>
            <label>New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
            <div className="mt-3">
              <label>Confirm new password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
            <button
              disabled={busy || !password || !confirm}
              className="w-full mt-5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
              style={{ background: 'var(--ll-orange)' }}
            >
              {busy ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
