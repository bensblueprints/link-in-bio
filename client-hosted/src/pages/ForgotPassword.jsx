import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api';
import Logo from '../components/Logo.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
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
        <h1 className="font-bold text-lg mb-2">Reset your password</h1>
        {sent ? (
          <p className="text-sm text-zinc-300 mt-4">
            If an account exists for <strong>{email}</strong>, we've sent a password reset link to that address. Check your inbox.
          </p>
        ) : (
          <form onSubmit={submit}>
            <p className="text-sm text-zinc-500 mb-4">Enter your email and we'll send you a link to reset your password.</p>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
            {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
            <button
              disabled={busy || !email}
              className="w-full mt-5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
              style={{ background: 'var(--ll-orange)' }}
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="text-xs text-zinc-500 mt-4">
          <Link to="/login" className="underline hover:text-white">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
