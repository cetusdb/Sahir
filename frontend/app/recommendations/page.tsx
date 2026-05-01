'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getUser, type ProductionListItem } from '@/lib/api';
import ProductionGrid from '@/components/ProductionGrid';

export default function RecommendationsPage() {
  const [items, setItems] = useState<ProductionListItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const user = typeof window !== 'undefined' ? getUser() : null;

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.recommendations(24)
      .then(setItems)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-2">Sana Özel Öneriler</h1>
        <p className="text-muted mb-6">
          Öneri almak için önce hesabına giriş yap.
        </p>
        <Link href="/login"
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold">
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Sana Özel Öneriler</h1>
      <p className="text-muted mb-6">
        İzleme geçmişin ve puanlarına göre seçildi.
      </p>
      {err && <div className="text-red-400">{err}</div>}
      {loading ? <div className="text-muted">Hesaplanıyor...</div>
               : <ProductionGrid items={items} />}
    </div>
  );
}
