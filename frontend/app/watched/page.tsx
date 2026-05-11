'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type WatchHistoryItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useUI } from '@/lib/ui-context';
import ProductionCard from '@/components/ProductionCard';

export default function WatchedPage() {
  const { user, ready } = useAuth();
  const { toast, confirm } = useUI();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) { setLoading(false); return; }
    api.watchHistory()
      .then(setItems)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [ready, user]);

  async function removeOne(productionId: number, title: string) {
    const ok = await confirm({
      title: 'İzlediklerinden çıkar',
      message: `"${title}" izlediklerinden çıkarılsın mı?`,
      confirmText: 'Çıkar',
      destructive: true
    });
    if (!ok) return;
    setBusyId(productionId);
    try {
      await api.removeFromHistory(productionId);
      setItems(items.filter((x) => x.production.id !== productionId));
      toast('Listeden çıkarıldı', 'success');
    } catch (e: any) { toast('Hata: ' + e.message, 'error'); }
    finally { setBusyId(null); }
  }

  if (!ready) return <div className="text-muted">Yükleniyor...</div>;

  if (!user) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-2">İzlediklerim</h1>
        <p className="text-muted mb-6">Bu sayfayı görmek için giriş yap.</p>
        <Link href="/login"
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold">
          Giriş Yap
        </Link>
      </div>
    );
  }

  const grouped = groupByMonth(items);

  return (
    <div>
      <h1 className="text-3xl font-bold">İzlediklerim</h1>
      <p className="text-muted mb-6">
        {loading ? 'Yükleniyor...' : `Toplam ${items.length} yapım izledin.`}
      </p>

      {err && <div className="text-red-400 mb-4">Hata: {err}</div>}

      {!loading && items.length === 0 && !err && (
        <div className="bg-panel border border-border rounded-xl p-8 text-center">
          <p className="text-muted mb-3">Henüz hiçbir yapımı "izledim" olarak işaretlemedin.</p>
          <p className="text-sm text-muted mb-5">
            Bir filme git, "✓ İzledim" butonuna tıkla — burada görünecek.
          </p>
          <Link href="/"
            className="px-4 py-2 rounded-md bg-accent text-black font-semibold">
            Anasayfaya Dön
          </Link>
        </div>
      )}

      <div className="space-y-10">
        {grouped.map(({ label, items: monthItems }) => (
          <section key={label}>
            <h2 className="text-lg font-bold text-muted uppercase tracking-wide mb-3
                           border-b border-border pb-2">
              {label} <span className="text-xs">({monthItems.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {monthItems.map((h) => (
                <div key={h.production.id} className="relative group">
                  <ProductionCard p={h.production} />
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1
                                  text-xs text-white text-center
                                  bg-gradient-to-t from-black/80 to-transparent
                                  rounded-b-xl">
                    {new Date(h.watchedAt).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'short'
                    })}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeOne(h.production.id, h.production.title);
                    }}
                    disabled={busyId === h.production.id}
                    title="İzlediklerimden çıkar"
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full
                               bg-black/80 hover:bg-red-500/90 text-white text-sm
                               opacity-0 group-hover:opacity-100 transition-opacity
                               flex items-center justify-center disabled:opacity-50">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function groupByMonth(items: WatchHistoryItem[]) {
  const groups = new Map<string, WatchHistoryItem[]>();
  for (const item of items) {
    const d = new Date(item.watchedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => {
      const [y, m] = key.split('-').map(Number);
      return { label: `${months[m]} ${y}`, items };
    });
}