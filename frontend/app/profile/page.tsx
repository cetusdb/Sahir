'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUser, type Watchlist, api } from '@/lib/api';

export default function ProfilePage() {
  const user = typeof window !== 'undefined' ? getUser() : null;
  const [lists, setLists] = useState<Watchlist[]>([]);

  useEffect(() => {
    if (!user) return;
    api.myWatchlists().then(setLists).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted mb-3">Profilini görmek için giriş yap.</p>
        <Link href="/login"
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold">
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-panel border border-border rounded-xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent
                        flex items-center justify-center text-2xl font-bold text-accent">
          {user.username[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <p className="text-sm text-muted">Rol: {user.role}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold mb-3">Listelerim</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {lists.length === 0 && <div className="text-muted">Henüz listen yok.</div>}
          {lists.map((w) => (
            <Link key={w.id} href={`/watchlists/${w.id}`}
              className="bg-card border border-border rounded-lg p-4 hover:border-accent">
              <div className="font-bold">{w.name}</div>
              <div className="text-xs text-muted">{w.itemCount} yapım</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
