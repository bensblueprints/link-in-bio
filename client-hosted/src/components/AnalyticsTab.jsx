import React, { useEffect, useState } from 'react';
import { Eye, MousePointerClick, Percent, Users } from 'lucide-react';
import { api } from '../api';
import { Card } from './ui.jsx';

function Stat({ icon: Icon, label, value, suffix = '' }) {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-orange-600/15 text-orange-400 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xl font-bold tabular-nums">{value}{suffix}</div>
        <div className="text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  );
}

function Chart({ days }) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.views, d.clicks)));
  return (
    <div>
      <div className="flex items-end gap-[3px] h-36">
        {days.map((d) => (
          <div key={d.date} className="flex-1 flex items-end gap-[2px] group relative" title={`${d.date}: ${d.views} views, ${d.clicks} clicks`}>
            <div className="flex-1 bg-orange-500/70 rounded-t-sm min-h-[2px] transition-colors group-hover:bg-orange-400" style={{ height: `${(d.views / max) * 100}%` }} />
            <div className="flex-1 bg-emerald-500/70 rounded-t-sm min-h-[2px] transition-colors group-hover:bg-emerald-400" style={{ height: `${(d.clicks / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5">
        <span>{days[0]?.date}</span>
        <span>{days[days.length - 1]?.date}</span>
      </div>
      <div className="flex gap-4 mt-2 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500/70" /> Views</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" /> Clicks</span>
      </div>
    </div>
  );
}

export default function AnalyticsTab() {
  const [a, setA] = useState(null);

  useEffect(() => {
    api.analytics().then(setA);
  }, []);

  if (!a) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={Eye} label="Page views" value={a.totalViews} />
        <Stat icon={MousePointerClick} label="Link clicks" value={a.totalClicks} />
        <Stat icon={Percent} label="Overall CTR" value={a.ctr} suffix="%" />
        <Stat icon={Users} label="Subscribers" value={a.subscribers} />
      </div>

      <Card title="Last 30 days">
        <Chart days={a.days} />
      </Card>

      <Card title="Clicks per link">
        {a.perLink.length === 0 ? (
          <p className="text-zinc-500 text-sm">No link blocks yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                <th className="pb-2 font-semibold">Link</th>
                <th className="pb-2 font-semibold text-right">Clicks</th>
                <th className="pb-2 font-semibold text-right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {a.perLink.map((l) => (
                <tr key={l.id} className="border-b border-zinc-800/60 last:border-0">
                  <td className="py-2.5">
                    <div className="font-medium">{l.title || 'Untitled'}</div>
                    <div className="text-xs text-zinc-500 truncate max-w-[280px]">{l.url}</div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{l.clicks}</td>
                  <td className="py-2.5 text-right tabular-nums text-zinc-400">{l.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
