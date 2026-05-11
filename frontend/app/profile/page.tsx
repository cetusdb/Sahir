'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, type Watchlist, type WatchHistoryItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { user, ready } = useAuth();
  const [lists, setLists] = useState<Watchlist[]>([]);
  const [watched, setWatched] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    if (!ready || !user) return;
    api.myWatchlists().then(setLists).catch(() => {});
    api.watchHistory().then(setWatched).catch(() => {});
  }, [ready, user]);

  if (!ready) return <div className="text-muted">Yükleniyor...</div>;

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

      <section className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href="/watched"
          className="bg-card border border-border rounded-xl p-4 hover:border-accent">
          <div className="text-xs text-muted uppercase">İzlediklerim</div>
          <div className="text-2xl font-bold mt-1">{watched.length}</div>
        </Link>
        <Link href="/watchlists"
          className="bg-card border border-border rounded-xl p-4 hover:border-accent">
          <div className="text-xs text-muted uppercase">Listelerim</div>
          <div className="text-2xl font-bold mt-1">{lists.length}</div>
        </Link>
        <Link href="/recommendations"
          className="bg-card border border-border rounded-xl p-4 hover:border-accent">
          <div className="text-xs text-muted uppercase">Öneriler</div>
          <div className="text-sm mt-1">Sana özel</div>
        </Link>
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
