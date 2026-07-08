import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, Instagram, Facebook, Youtube, Twitter, Globe, MessageCircle, Music2, ChevronLeft } from 'lucide-react';
import { onboardingApi } from '../api';
import Logo from '../components/Logo.jsx';

const STEPS_FULL = ['username', 'plan', 'theme', 'links', 'profile'];
const STEPS_PLAN_PRESET = ['username', 'theme', 'links', 'profile'];
const VALID_PLAN_KEYS = new Set(['free', 'starter', 'pro', 'premium', 'lifetime']);

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@username' },
  { key: 'tiktok', label: 'TikTok', icon: Music2, placeholder: '@username' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'youtube.com/@username' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'facebook.com/username' },
  { key: 'x', label: 'X / Twitter', icon: Twitter, placeholder: '@username' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: 'Phone number' },
  { key: 'spotify', label: 'Spotify', icon: Music2, placeholder: 'Spotify URL' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://…' }
];

const THEME_PREVIEWS = {
  gradient: { bg: 'linear-gradient(160deg,#1e1b4b,#4c1d95,#be185d)', desc: 'Vivid gradient' },
  glass: { bg: 'linear-gradient(135deg,#0f172a,#134e4a)', desc: 'Frosted glass' },
  minimal: { bg: '#fafafa', desc: 'Clean light' },
  dark: { bg: '#09090b', desc: 'Sleek near-black' },
  neon: { bg: '#030014', desc: 'Glowing accents' },
  paper: { bg: '#f5f0e8', desc: 'Neo-brutalist paper' }
};

function ProgressBar({ step, steps }) {
  const pct = ((steps.indexOf(step) + 1) / steps.length) * 100;
  return (
    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-8">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--ll-orange)' }} />
    </div>
  );
}

function useDebouncedUsername(username) {
  const [status, setStatus] = useState('idle'); // idle | checking | available | taken | invalid
  const timer = useRef();

  useEffect(() => {
    clearTimeout(timer.current);
    if (!username) return setStatus('idle');
    if (!/^[a-z0-9-]{3,30}$/.test(username)) return setStatus('invalid');
    setStatus('checking');
    timer.current = setTimeout(async () => {
      try {
        const { available } = await onboardingApi.checkUsername(username);
        setStatus(available ? 'available' : 'taken');
      } catch {
        setStatus('idle');
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [username]);

  return status;
}

function StepUsername({ value, onChange, onNext }) {
  const status = useDebouncedUsername(value);
  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Welcome to LinkLeaf!</h1>
      <p className="text-zinc-400 mb-8">Choose your LinkLeaf username. You can always change it later.</p>
      <div className="flex items-center border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900 focus-within:border-orange-500">
        <span className="pl-4 text-zinc-500 text-sm">linkleaf.im/</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="username"
          className="!border-0 !ring-0 flex-1"
          autoFocus
        />
        <span className="pr-4">
          {status === 'checking' && <Loader2 size={16} className="animate-spin text-zinc-500" />}
          {status === 'available' && <Check size={16} className="text-emerald-400" />}
          {status === 'taken' && <span className="text-red-400 text-xs font-semibold">taken</span>}
        </span>
      </div>
      {status === 'invalid' && value && <p className="text-xs text-amber-400 mt-2">3-30 characters: lowercase letters, numbers, hyphens.</p>}
      <button
        disabled={status !== 'available'}
        onClick={onNext}
        className="w-full mt-8 px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        style={{ background: 'var(--ll-orange)' }}
      >
        Continue
      </button>
    </div>
  );
}

function StepPlan({ value, onChange, onNext, onBack }) {
  const [plans, setPlans] = useState(null);
  useEffect(() => {
    fetch('/api/plans').then((r) => r.json()).then((d) => setPlans(d.plans));
  }, []);
  if (!plans) return <p className="text-zinc-500">Loading plans…</p>;

  const order = ['free', 'starter', 'pro', 'premium', 'lifetime'];
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-6 cursor-pointer"><ChevronLeft size={16} /> Back</button>
      <h1 className="text-2xl font-extrabold mb-1">Find the plan for you</h1>
      <p className="text-zinc-400 mb-6">You can upgrade or cancel any time.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {order.map((key) => {
          const p = plans[key];
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`text-left rounded-2xl border-2 p-4 transition-all cursor-pointer ${active ? 'ring-2' : 'border-zinc-800 hover:border-zinc-600'}`}
              style={active ? { borderColor: 'var(--ll-orange)', boxShadow: '0 0 0 2px rgba(249,115,22,.25)' } : {}}
            >
              <div className="font-bold flex items-center gap-1.5">
                {p.label} {active && <Check size={14} style={{ color: 'var(--ll-orange)' }} />}
              </div>
              <div className="text-2xl font-extrabold mt-1">
                {key === 'lifetime' ? `$${p.priceOneTime}` : `$${p.priceAnnual}`}
                <span className="text-xs font-normal text-zinc-500">{key === 'lifetime' ? ' once' : '/mo'}</span>
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                {key === 'lifetime' ? `Cap ${p.seatCap} — pay once, keep forever` : key === 'free' ? 'Forever free' : `Billed annually, or $${p.priceMonthly}/mo monthly`}
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={onNext}
        className="w-full mt-8 px-4 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
        style={{ background: 'var(--ll-orange)' }}
      >
        Continue
      </button>
    </div>
  );
}

function StepTheme({ value, onChange, onNext, onBack, plan }) {
  const [allowed, setAllowed] = useState(null);
  useEffect(() => {
    fetch('/api/plans').then((r) => r.json()).then((d) => {
      const cfg = d.plans[plan] || d.plans.free;
      setAllowed(cfg.themes === 'all' ? d.themes : cfg.themes);
    });
  }, [plan]);
  if (!allowed) return null;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-6 cursor-pointer"><ChevronLeft size={16} /> Back</button>
      <h1 className="text-2xl font-extrabold mb-1">Pick a theme</h1>
      <p className="text-zinc-400 mb-6">Change this any time from your dashboard.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {['gradient', 'glass', 'minimal', 'dark', 'neon', 'paper'].map((t) => {
          const locked = !allowed.includes(t);
          const p = THEME_PREVIEWS[t];
          const active = value === t;
          return (
            <button
              key={t}
              disabled={locked}
              onClick={() => onChange(t)}
              className={`relative rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${active ? '' : 'border-zinc-800 hover:border-zinc-600'}`}
              style={active ? { borderColor: 'var(--ll-orange)' } : {}}
            >
              <div className="h-16" style={{ background: p.bg }} />
              <div className="px-2.5 py-1.5 bg-zinc-900">
                <div className="text-xs font-semibold capitalize">{t}{locked && ' 🔒'}</div>
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={onNext}
        className="w-full mt-8 px-4 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
        style={{ background: 'var(--ll-orange)' }}
      >
        Continue
      </button>
    </div>
  );
}

function StepLinks({ links, onChange, onNext, onBack }) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-6 cursor-pointer"><ChevronLeft size={16} /> Back</button>
      <h1 className="text-2xl font-extrabold mb-1">Add your links</h1>
      <p className="text-zinc-400 mb-6">Fill in as many as you like — all optional.</p>
      <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
        {PLATFORMS.map((p) => (
          <div key={p.key} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0"><p.icon size={16} /></div>
            <input
              value={links[p.key] || ''}
              onChange={(e) => onChange({ ...links, [p.key]: e.target.value })}
              placeholder={p.placeholder}
            />
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-full mt-8 px-4 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
        style={{ background: 'var(--ll-orange)' }}
      >
        Continue
      </button>
    </div>
  );
}

function StepProfile({ profile, onChange, onBack, onSubmit, busy }) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-6 cursor-pointer"><ChevronLeft size={16} /> Back</button>
      <h1 className="text-2xl font-extrabold mb-1">Tell us about you</h1>
      <p className="text-zinc-400 mb-6">This shows at the top of your page.</p>
      <label>Display name</label>
      <input value={profile.display_name} onChange={(e) => onChange({ ...profile, display_name: e.target.value })} placeholder="Your name" />
      <div className="mt-3">
        <label>Bio</label>
        <textarea
          rows={3}
          maxLength={160}
          value={profile.bio}
          onChange={(e) => onChange({ ...profile, bio: e.target.value })}
          placeholder="One or two lines about you"
        />
        <p className="text-[11px] text-zinc-600 mt-1 text-right">{profile.bio.length}/160</p>
      </div>
      <button
        disabled={busy}
        onClick={onSubmit}
        className="w-full mt-6 px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
        style={{ background: 'var(--ll-orange)' }}
      >
        {busy ? 'Publishing…' : 'Publish my page'}
      </button>
    </div>
  );
}

export default function Onboarding() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  // A plan chosen on the marketing pricing page arrives as ?plan=pro — skip
  // asking again in the wizard (was the "makes me choose the plan twice" bug).
  const presetPlan = params.get('plan');
  const hasPresetPlan = presetPlan && VALID_PLAN_KEYS.has(presetPlan);
  const STEPS = hasPresetPlan ? STEPS_PLAN_PRESET : STEPS_FULL;

  const [step, setStep] = useState('username');
  const [username, setUsername] = useState('');
  const [plan, setPlan] = useState(hasPresetPlan ? presetPlan : 'free');
  const [theme, setTheme] = useState('gradient');
  const [links, setLinks] = useState({});
  const [profile, setProfile] = useState({ display_name: '', bio: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    fetch('/api/plans').then((r) => r.json()).then((d) => setPlans(d.plans));
  }, []);

  const idx = STEPS.indexOf(step);
  const goTo = (i) => setStep(STEPS[Math.max(0, Math.min(STEPS.length - 1, i))]);

  async function submit() {
    setBusy(true);
    setErr('');
    try {
      await onboardingApi.complete({
        username,
        plan,
        theme,
        profile,
        links: Object.entries(links).map(([platform, value]) => ({ platform, value }))
      });
      // Onboarding always publishes on Free (no charge happens here) — if a
      // paid plan was picked, send them to the real Whop checkout now. Their
      // plan gets applied automatically by the webhook once payment completes,
      // matched by the same email they used to sign up.
      const cfg = plans?.[plan];
      const checkout = plan === 'lifetime' ? cfg?.checkoutUrl : cfg?.checkoutUrl?.annual;
      if (plan !== 'free' && checkout) {
        window.location.href = checkout;
        return;
      }
      nav('/dashboard');
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8"><Logo /></div>
        <ProgressBar step={step} steps={STEPS} />
        {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
        {step === 'username' && <StepUsername value={username} onChange={setUsername} onNext={() => goTo(idx + 1)} />}
        {step === 'plan' && <StepPlan value={plan} onChange={setPlan} onNext={() => goTo(idx + 1)} onBack={() => goTo(idx - 1)} />}
        {step === 'theme' && <StepTheme value={theme} onChange={setTheme} plan={plan} onNext={() => goTo(idx + 1)} onBack={() => goTo(idx - 1)} />}
        {step === 'links' && <StepLinks links={links} onChange={setLinks} onNext={() => goTo(idx + 1)} onBack={() => goTo(idx - 1)} />}
        {step === 'profile' && <StepProfile profile={profile} onChange={setProfile} onBack={() => goTo(idx - 1)} onSubmit={submit} busy={busy} />}
      </div>
    </div>
  );
}
