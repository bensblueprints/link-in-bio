import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { User, Blocks, Palette, BarChart3, Mail, LogOut, ExternalLink, Code2 } from 'lucide-react';
import { authApi } from '../api';
import { useAuth } from '../AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import ProfileTab from '../components/ProfileTab.jsx';
import BlocksTab from '../components/BlocksTab.jsx';
import ThemeTab from '../components/ThemeTab.jsx';
import AnalyticsTab from '../components/AnalyticsTab.jsx';
import SubscribersTab from '../components/SubscribersTab.jsx';
import EmbedTab from '../components/EmbedTab.jsx';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'blocks', label: 'Blocks', icon: Blocks },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'subscribers', label: 'Subscribers', icon: Mail },
  { id: 'embed', label: 'Embed', icon: Code2 }
];

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('profile');

  if (user === null) return <Navigate to="/login" replace />;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading…</div>;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <Logo size={24} />
        <div className="flex items-center gap-2">
          {user.plan === 'free' ? (
            <Link
              to="/pricing"
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white cursor-pointer"
              style={{ background: 'var(--ll-orange)' }}
            >
              Upgrade
            </Link>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 capitalize">{user.plan} plan</span>
          )}
          <a
            href={user.username ? `/${user.username}` : '/'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ExternalLink size={14} /> View page
          </a>
          <button
            onClick={() => authApi.logout().then(() => setUser(null))}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <nav className="flex gap-1 mb-6 bg-zinc-900/70 border border-zinc-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              tab === t.id ? 'bg-orange-600/90 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <t.icon size={15} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div>
        {tab === 'profile' && <ProfileTab />}
        {tab === 'blocks' && <BlocksTab />}
        {tab === 'theme' && <ThemeTab />}
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'subscribers' && <SubscribersTab />}
        {tab === 'embed' && <EmbedTab username={user.username} />}
      </div>
    </div>
  );
}
