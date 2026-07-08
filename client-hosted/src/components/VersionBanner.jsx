import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

// Polls /api/version. The value is the hashed bundle name, which changes on
// every deploy. If it changes while this tab is open, we shipped an update —
// offer a one-click refresh so users never sit on a stale cached build.
export default function VersionBanner() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let baseline = null;
    let timer;
    const check = async () => {
      try {
        const r = await fetch('/api/version', { cache: 'no-store' });
        const { version } = await r.json();
        if (!version) return;
        if (baseline === null) baseline = version;
        else if (version !== baseline) setStale(true);
      } catch {
        /* offline / transient — ignore */
      }
    };
    check();
    timer = setInterval(check, 120000); // every 2 minutes
    return () => clearInterval(timer);
  }, []);

  if (!stale) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white"
      style={{ background: 'var(--ll-orange, #f97316)' }}
    >
      <span>A new version of LinkLeaf is available.</span>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors"
      >
        <RefreshCw size={14} /> Refresh
      </button>
    </div>
  );
}
