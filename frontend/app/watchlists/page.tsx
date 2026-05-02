'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getUser, type Watchlist } from '@/lib/api';

export default function WatchlistsPage() {
  const [lists, setLists] = useState<Watchlist[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const user = typeof window !== 'undefined' ? getUser() : null;

  useEffect(() => {
    if (!user) return;
    api.myWatchlists().then(setLists).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const w = await api.createWatchlist({ name, description: desc });
      setLists([w, ...lists]);
      setName(''); setDesc('');
    } catch (ex: any) { setErr(ex.message); }
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted mb-4">Listeleri görmek için giriş yap.</p>
        <Link href="/login"
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold">
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[1fr_360px] gap-8">
      <div>
        <h1 className="text-3xl font-bold mb-5">Listelerim</h1>
        {err && <div className="text-red-400 mb-3">{err}</div>}
        <div className="space-y-3">
          {lists.length === 0 && (
            <div className="text-muted">Henüz listen yok.</div>
          )}
          {lists.map((w) => (
            <Link href={`/watchlists/${w.id}`} key={w.id}
              className="block bg-card border border-border rounded-lg p-4 hover:border-accent">
              <div className="flex justify-between">
                <h3 className="font-bold">{w.name}</h3>
                <span className="text-xs text-muted">{w.itemCount} öğe</span>
              </div>
              {w.description && (
                <p className="text-sm text-muted mt-1">{w.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      <aside className="bg-panel border border-border rounded-xl p-5 h-fit">
        <h2 className="font-bold mb-3">Yeni Liste</h2>
        <form onSubmit={create} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Liste adı" required
            className="w-full bg-card border border-border rounded-md px-3 py-2" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Açıklama (opsiyonel)" rows={3}
            className="w-full bg-card border border-border rounded-md px-3 py-2" />
          <button className="w-full bg-accent text-black font-semibold py-2 rounded-md">
            Oluştur
          </button>
        </form>
      </aside>
    </div>
  );
}
