'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, type ProductionListItem } from '@/lib/api';
import ProductionGrid from '@/components/ProductionGrid';

const PAGE_SIZE = 24;

export default function BrowsePage() {
  const params = useSearchParams();
  const router = useRouter();

  const q          = params.get('q') ?? '';
  const sort       = params.get('sort') ?? 'popular';
  const type       = params.get('type') ?? '';
  const categoryId = params.get('categoryId') ?? '';
  const page       = Math.max(1, Number(params.get('page')) || 1);

  const [items, setItems]   = useState<ProductionListItem[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr]       = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    api.productions({
      q:          q || undefined,
      sort,
      type:       type || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      page,
      pageSize:   PAGE_SIZE
    })
      .then((r) => { setItems(r.items); setTotal(r.total); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [q, sort, type, categoryId, page]);

  function updateParam(key: string, value: string | null) {
    const sp = new URLSearchParams(params.toString());
    if (value === null || value === '') sp.delete(key);
    else sp.set(key, value);
    sp.delete('page'); // filtre değişince ilk sayfaya dön
    router.push(`/search?${sp.toString()}`);
  }

  function goToPage(n: number) {
    const sp = new URLSearchParams(params.toString());
    sp.set('page', String(n));
    router.push(`/search?${sp.toString()}`);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const headerTitle = q
    ? `“${q}” için sonuçlar`
    : type === 'Movie'  ? 'Tüm Filmler'
    : type === 'TVShow' ? 'Tüm Diziler'
    : sort === 'rating' ? 'En Yüksek Puanlı'
    : sort === 'newest' ? 'Yeni Eklenenler'
    : 'Tüm Yapımlar';

  return (
    <div>
      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{headerTitle}</h1>
          <p className="text-muted">
            {loading ? 'Yükleniyor...' :
              total > 0 ? `${total} sonuç bulundu` : 'Sonuç yok.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={type}
            onChange={(e) => updateParam('type', e.target.value)}
            className="bg-card border border-border rounded-md px-3 py-2 text-sm">
            <option value="">Tür: Hepsi</option>
            <option value="Movie">Sadece Film</option>
            <option value="TVShow">Sadece Dizi</option>
          </select>
          <select value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="bg-card border border-border rounded-md px-3 py-2 text-sm">
            <option value="popular">Popüler</option>
            <option value="rating">En Yüksek Puan</option>
            <option value="newest">En Yeni</option>
          </select>
        </div>
      </div>

      {err && <div className="text-red-400 mb-3">Hata: {err}</div>}

      {loading ? (
        <div className="text-muted py-12 text-center">Yükleniyor...</div>
      ) : (
        <>
          <ProductionGrid items={items} />
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
          )}
        </>
      )}
    </div>
  );
}

function Pagination({
  page, totalPages, onChange
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  // Sayfa numarası penceresi (örn: 1 ... 4 5 6 ... 50)
  const window = 2;
  const pages: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages ||
        (i >= page - window && i <= page + window)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-1 flex-wrap">
      <button onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-md border border-border text-sm
                   hover:bg-card disabled:opacity-30">
        ← Önceki
      </button>
      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`d${idx}`} className="px-2 text-muted">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            className={`min-w-[2.25rem] px-3 py-1.5 rounded-md text-sm border
                       ${p === page
                         ? 'bg-accent text-black border-accent font-semibold'
                         : 'border-border hover:bg-card'}`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1.5 rounded-md border border-border text-sm
                   hover:bg-card disabled:opacity-30">
        Sonraki →
      </button>
    </div>
  );
}
