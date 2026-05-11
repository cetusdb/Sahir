'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, type WatchlistDetail } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useUI } from '@/lib/ui-context';
import ProductionCard from '@/components/ProductionCard';

export default function WatchlistDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const { toast, confirm } = useUI();

  const [w, setW] = useState<WatchlistDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.watchlist(id).then(setW).catch((e) => setErr(e.message));
  }, [id]);

  async function deleteList() {
    if (!w) return;
    const ok = await confirm({
      title: 'Listeyi sil',
      message: `"${w.name}" listesini silmek istediğine emin misin?`,
      confirmText: 'Sil',
      destructive: true
    });
    if (!ok) return;
    try {
      await api.deleteWatchlist(id);
      toast('Liste silindi', 'success');
      setTimeout(() => router.push('/watchlists'), 600);
    } catch (e: any) { toast('Hata: ' + e.message, 'error'); }
  }

  async function removeItem(productionId: number, title: string) {
    if (!w) return;
    const ok = await confirm({
      title: 'Listeden çıkar',
      message: `"${title}" listeden çıkarılsın mı?`,
      confirmText: 'Çıkar',
      destructive: true
    });
    if (!ok) return;
    try {
      await api.removeFromWatchlist(w.id, productionId);
      setW({ ...w, items: w.items.filter((p) => p.id !== productionId) });
      toast('Listeden çıkarıldı', 'success');
    } catch (e: any) { toast('Hata: ' + e.message, 'error'); }
  }

  if (err) return <div className="text-red-400">{err}</div>;
  if (!w)  return <div className="text-muted">Yükleniyor...</div>;

  return (
    <div>
      <Link href="/watchlists" className="text-sm text-muted hover:text-accent">
        ← Listelerim
      </Link>

      <div className="flex justify-between items-start mt-2 mb-1 gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{w.name}</h1>
          {w.description && <p className="text-muted mt-1">{w.description}</p>}
          <p className="text-xs text-muted mt-1">
            {w.items.length} yapım · {w.isPublic ? 'Herkese açık' : 'Özel'}
          </p>
        </div>

        {user && (
          <button onClick={deleteList}
            className="text-sm px-3 py-1.5 rounded-md border border-red-500/40
                       text-red-400 hover:bg-red-500/10">
            🗑 Listeyi Sil
          </button>
        )}
      </div>

      <div className="mt-6">
        {w.items.length === 0 ? (
          <div className="text-muted py-12 text-center">
            Liste boş. Bir filme gidip "+ Listeye Ekle" ile ekleyebilirsin.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {w.items.map((p) => (
              <div key={p.id} className="relative group">
                <ProductionCard p={p} />
                <button
                  onClick={(e) => { e.preventDefault(); removeItem(p.id, p.title); }}
                  title="Listeden çıkar"
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full
                             bg-black/80 hover:bg-red-500/90 text-white text-sm
                             opacity-0 group-hover:opacity-100 transition-opacity
                             flex items-center justify-center">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
