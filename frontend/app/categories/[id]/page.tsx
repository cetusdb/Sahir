'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  api, type CategoryFlat, type ProductionListItem
} from '@/lib/api';
import ProductionGrid from '@/components/ProductionGrid';

const PAGE_SIZE = 24;

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const sp     = useSearchParams();
  const router = useRouter();

  const sort = sp.get('sort') ?? 'popular';
  const type = sp.get('type') ?? '';
  const page = Math.max(1, Number(sp.get('page')) || 1);

  const [cat, setCat]     = useState<CategoryFlat | null>(null);
  const [items, setItems] = useState<ProductionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState<string | null>(null);

  // Kategori adı
  useEffect(() => {
    api.categoriesFlat()
      .then((all) => setCat(all.find((c) => c.id === id) ?? null))
      .catch(() => {});
  }, [id]);

  // Yapımlar
  useEffect(() => {
    setLoading(true);
    setErr(null);
    api.productions({
      categoryId: id,
      sort,
      type:       type || undefined,
      page,
      pageSize:   PAGE_SIZE
    })
      .then((r) => { setItems(r.items); setTotal(r.total); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id, sort, type, page]);

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    router.push(`/categories/${id}?${next.toString()}`);
  }

  function goToPage(n: number) {
    const next = new URLSearchParams(sp.toString());
    next.set('page', String(n));
    router.push(`/categories/${id}?${next.toString()}`);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-2">
        <Link href="/categories" className="text-sm text-muted hover:text-accent">
          ← Kategoriler
        </Link>
      </div>

      <div className="flex justify-between items-end mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            {cat ? cat.name : `Kategori #${id}`}
          </h1>
          {cat?.description && (
            <p className="text-muted text-sm mt-1">{cat.description}</p>
          )}
          <p className="text-muted text-sm mt-1">
            {loading ? 'Yükleniyor...' : `${total} yapım`}
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
