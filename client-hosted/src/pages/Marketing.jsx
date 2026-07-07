import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function Marketing({ scrollToPricing }) {
  const [plans, setPlans] = useState(null);
  const pricingRef = useRef(null);

  useEffect(() => {
    fetch('/api/plans').then((r) => r.json()).then((d) => setPlans(d.plans));
  }, []);

  useEffect(() => {
    if (scrollToPricing && pricingRef.current) pricingRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [scrollToPricing, plans]);

  const order = ['free', 'starter', 'pro', 'premium', 'lifetime'];

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-zinc-300 hover:text-white px-3 py-2">Log in</Link>
          <Link
            to="/signup"
            className="text-sm font-semibold text-white px-4 py-2 rounded-lg cursor-pointer"
            style={{ background: 'var(--ll-orange)' }}
          >
            Sign up free
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 pt-16 pb-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Your Connected World.</h1>
        <p className="text-lg text-zinc-400 mt-5 max-w-xl mx-auto">
          One page for every link you share. Free to start, no branding lock-in on paid plans, and your subscriber
          data is always yours to export.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            to="/signup"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
            style={{ background: 'var(--ll-orange)' }}
          >
            Claim your page
          </Link>
          <a href="#pricing" className="px-6 py-3 rounded-xl text-sm font-semibold text-zinc-200 border border-zinc-700 hover:border-zinc-500">
            See pricing
          </a>
        </div>
      </section>

      <section id="pricing" ref={pricingRef} className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-extrabold text-center mb-10">Simple, honest pricing</h2>
        {!plans ? (
          <p className="text-center text-zinc-500">Loading…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {order.map((key) => {
              const p = plans[key];
              const featured = key === 'pro';
              return (
                <div
                  key={key}
                  className={`rounded-2xl border p-5 flex flex-col ${featured ? 'border-2' : 'border-zinc-800'}`}
                  style={featured ? { borderColor: 'var(--ll-orange)' } : {}}
                >
                  <div className="font-bold">{p.label}</div>
                  <div className="text-3xl font-extrabold mt-2">
                    {key === 'lifetime' ? `$${p.priceOneTime}` : `$${p.priceAnnual}`}
                    <span className="text-xs font-normal text-zinc-500">{key === 'lifetime' ? ' once' : '/mo'}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1 mb-4">
                    {key === 'lifetime' ? `First ${p.seatCap} users only` : key === 'free' ? 'Forever' : `or $${p.priceMonthly}/mo billed monthly`}
                  </div>
                  <ul className="text-sm text-zinc-300 space-y-2 flex-1">
                    <li className="flex gap-2"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> {p.themes === 'all' ? 'All 6 themes' : `${p.themes.length} themes`}</li>
                    <li className="flex gap-2"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> {p.unlimitedYoutube ? 'Unlimited video embeds' : '1 video embed'}</li>
                    {p.emailCollect && <li className="flex gap-2"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> Email capture + CSV export</li>}
                    {p.customStyling && <li className="flex gap-2"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> Custom colors, background & CSS</li>}
                    {!p.showBadge && <li className="flex gap-2"><Check size={15} className="text-emerald-400 shrink-0 mt-0.5" /> No LinkLeaf badge</li>}
                  </ul>
                  <Link
                    to="/signup"
                    className="mt-5 text-center px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                    style={{ background: featured ? 'var(--ll-orange)' : '#27272a', color: '#fff' }}
                  >
                    Get started
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="max-w-5xl mx-auto px-4 py-10 text-center text-xs text-zinc-600">
        LinkLeaf — Your Connected World.
      </footer>
    </div>
  );
}
