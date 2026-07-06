import React, { useEffect, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { api, BASE } from '../api';
import { Card } from './ui.jsx';

export default function SubscribersTab() {
  const [subs, setSubs] = useState(null);

  useEffect(() => {
    api.subscribers().then(setSubs);
  }, []);

  if (!subs) return <p className="text-zinc-500">Loading…</p>;

  async function remove(id) {
    await api.deleteSubscriber(id);
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <Card
      title={`Subscribers (${subs.length})`}
      actions={
        <a
          href={`${BASE}/api/subscribers.csv`}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <Download size={13} /> Export CSV
        </a>
      }
    >
      {subs.length === 0 ? (
        <p className="text-zinc-500 text-sm py-6 text-center">
          No subscribers yet. Add an <strong>Email collect</strong> block to your page to start building your list.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <th className="pb-2 font-semibold">Email</th>
              <th className="pb-2 font-semibold">Subscribed</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-b border-zinc-800/60 last:border-0">
                <td className="py-2.5 font-medium">{s.email}</td>
                <td className="py-2.5 text-zinc-400 text-xs">{s.ts}</td>
                <td className="py-2.5 text-right">
                  <button onClick={() => remove(s.id)} className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer" title="Remove">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
