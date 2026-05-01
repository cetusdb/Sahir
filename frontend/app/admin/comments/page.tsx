'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, type AdminComment } from '@/lib/api';

export default function AdminCommentsPage() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<AdminComment[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load(search = '') {
    setLoading(true);
    try {
      const r = await api.adminComments({ q: search || undefined, pageSize: 100 });
      setItems(r.items); setTotal(r.total);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!ready) return;
    if (user?.role !== 'Admin') return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  async function deleteComment(c: AdminComment) {
    if (!confirm(
      `${c.username} kullanıcısının "${c.productionTitle}" altındaki yorumu silinsin mi?\n\n"${c.body.slice(0, 100)}${c.body.length > 100 ? '...' : ''}"`))
      return;
    setBusyId(c.id);
    try {
      await api.adminDeleteComment(c.id);
      setItems((prev) => prev.filter((x) => x.id !== c.id));
      setTotal((t) => t - 1);
    } catch (e: any) { alert('Hata: ' + e.message); }
    finally { setBusyId(null); }
  }

  if (!ready) return <div className="text-muted">Yükleniyor...</div>;
  if (user?.role !== 'Admin') {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Yetkisiz Erişim</h1>
        <p className="text-muted mb-4">Bu sayfa sadece admin kullanıcılar içindir.</p>
        <Link href="/" className="text-accent">Anasayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-3xl font-bold">Yorum Moderasyonu</h1>
          <p className="text-muted">Toplam {total} yorum.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Yorum içeriğinde ara..."
            className="bg-card border border-border rounded-md px-3 py-2 text-sm w-64" />
          <button className="px-3 py-2 rounded-md bg-accent text-black font-semibold text-sm">
            Ara
          </button>
        </form>
      </div>

      {err && <div className="text-red-400 mb-3">{err}</div>}

      {loading ? (
        <div className="text-muted py-8">Yükleniyor...</div>
      ) : items.length === 0 ? (
        <div className="text-muted py-8 text-center">Yorum bulunamadı.</div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <article key={c.id}
              className="bg-panel border border-border rounded-lg p-4">
              <header className="flex justify-between items-start mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{c.username}</span>
                  <span className="text-muted">·</span>
                  <Link href={`/productions/${c.productionId}`}
                    className="text-accent hover:underline">
                    {c.productionTitle}
                  </Link>
                  <span className="text-muted">·</span>
                  <span className="text-xs text-muted">
                    {new Date(c.createdAt).toLocaleString('tr-TR')}
                  </span>
                </div>
                <button
                  disabled={busyId === c.id}
                  onClick={() => deleteComment(c)}
                  className="text-xs px-3 py-1 rounded border border-red-500/40
                             text-red-400 hover:bg-red-500/10 disabled:opacity-30">
                  {busyId === c.id ? 'Siliniyor...' : 'Sil'}
                </button>
              </header>
              <p className="leading-relaxed text-sm whitespace-pre-wrap">{c.body}</p>
              <footer className="mt-2 text-xs text-muted">
                ❤ {c.likeCount} beğeni · #{c.id}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
