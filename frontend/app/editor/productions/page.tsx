'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, type ProductionListItem } from '@/lib/api';

export default function EditorProductionsPage() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<ProductionListItem[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load(search = '') {
    setLoading(true);
    try {
      const r = await api.productions({ q: search || undefined, pageSize: 100 });
      setItems(r.items);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (!ready) return;
    if (user?.role !== 'Editor' && user?.role !== 'Admin') return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  async function deleteItem(p: ProductionListItem) {
    if (!confirm(`"${p.title}" yapımını silmek istediğine emin misin? Bu işlem geri alınamaz.`)) return;
    setBusyId(p.id);
    try {
      await api.deleteProduction(p.id);
      setItems((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e: any) { alert('Hata: ' + e.message); }
    finally { setBusyId(null); }
  }

  if (!ready) return <div className="text-muted">Yükleniyor...</div>;

  const allowed = user?.role === 'Editor' || user?.role === 'Admin';
  if (!allowed) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Yetkisiz Erişim</h1>
        <Link href="/" className="text-accent">Anasayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Yapımlar</h1>
          <p className="text-muted">{items.length} kayıt.</p>
        </div>
        <div className="flex gap-2">
          <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Ara..."
              className="bg-card border border-border rounded-md px-3 py-2 text-sm" />
            <button className="px-3 py-2 rounded-md bg-card border border-border text-sm">
              Ara
            </button>
          </form>
          <Link href="/editor/productions/new"
            className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm">
            + Yeni Yapım
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-muted py-8">Yükleniyor...</div>
      ) : items.length === 0 ? (
        <div className="text-muted py-8 text-center">Yapım bulunamadı.</div>
      ) : (
        <div className="bg-panel border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card text-muted text-xs uppercase">
                <tr>
                  <Th>Poster</Th>
                  <Th>Başlık</Th>
                  <Th>Tür</Th>
                  <Th>Yıl</Th>
                  <Th>Kategori</Th>
                  <Th>Puan</Th>
                  <Th>İşlem</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-card/40">
                    <Td>
                      <div className="w-12 h-16 bg-card border border-border
                                      rounded overflow-hidden">
                        {p.posterUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.posterUrl} alt={p.title}
                            className="w-full h-full object-cover" />
                        )}
                      </div>
                    </Td>
                    <Td>
                      <Link href={`/productions/${p.id}`}
                        className="font-semibold hover:text-accent">{p.title}</Link>
                    </Td>
                    <Td className="text-xs text-muted">
                      {p.type === 'TVShow' ? 'Dizi' : 'Film'}
                    </Td>
                    <Td className="text-xs text-muted">{p.releaseYear}</Td>
                    <Td className="text-xs text-muted">{p.categoryName ?? '—'}</Td>
                    <Td className="text-xs text-muted">
                      ★ {p.averageScore || '—'} ({p.ratingCount})
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Link href={`/editor/productions/${p.id}/edit`}
                          className="text-xs px-2 py-1 rounded border border-border
                                     hover:bg-card">Düzenle</Link>
                        {(user?.role === 'Editor' || user?.role === 'Admin') && (
                          <button
                            disabled={busyId === p.id}
                            onClick={() => deleteItem(p)}
                            className="text-xs px-2 py-1 rounded border border-red-500/40
                                       text-red-400 hover:bg-red-500/10 disabled:opacity-30">
                            Sil
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-semibold">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
