'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type Watchlist } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useUI } from '@/lib/ui-context';

export default function WatchlistsPage() {
  const { user, ready } = useAuth();
  const { toast, confirm } = useUI();
  const [lists, setLists] = useState<Watchlist[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    api.myWatchlists().then(setLists).catch((e) => setErr(e.message));
  }, [ready, user]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const w = await api.createWatchlist({ name, description: desc });
      setLists([w, ...lists]);
      setName(''); setDesc('');
      toast(`"${w.name}" oluşturuldu`, 'success');
    } catch (ex: any) { toast(ex.message, 'error'); }
  }

  async function deleteList(w: Watchlist) {
    const ok = await confirm({
      title: 'Listeyi sil',
      message: `"${w.name}" listesini silmek istediğine emin misin?\n\nBu işlem geri alınamaz.`,
      confirmText: 'Sil',
      destructive: true
    });
    if (!ok) return;
    setBusyId(w.id);
    try {
      await api.deleteWatchlist(w.id);
      setLists(lists.filter((x) => x.id !== w.id));
      toast('Liste silindi', 'success');
    } catch (ex: any) { toast('Hata: ' + ex.message, 'error'); }
    finally { setBusyId(null); }
  }

  if (!ready) return <div className="text-muted">Yükleniyor...</div>;

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
            <div key={w.id}
              className="bg-card border border-border rounded-lg p-4
                         hover:border-accent transition-colors flex justify-between items-start gap-3">
              <Link href={`/watchlists/${w.id}`} className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold">{w.name}</h3>
                  <span className="text-xs text-muted shrink-0">{w.itemCount} öğe</span>
                </div>
                {w.description && (
                  <p className="text-sm text-muted mt-1 line-clamp-2">{w.description}</p>
                )}
              </Link>
              <button
                onClick={() => deleteList(w)}
                disabled={busyId === w.id}
                title="Listeyi sil"
                className="text-xs px-2 py-1 rounded border border-red-500/40
                           text-red-400 hover:bg-red-500/10 disabled:opacity-30
                           disabled:cursor-not-allowed shrink-0">
                {busyId === w.id ? '...' : 'Sil'}
              </button>
            </div>
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