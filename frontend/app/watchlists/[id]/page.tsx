'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, type WatchlistDetail } from '@/lib/api';
import ProductionGrid from '@/components/ProductionGrid';

export default function WatchlistDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [w, setW] = useState<WatchlistDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.watchlist(id).then(setW).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <div className="text-red-400">{err}</div>;
  if (!w)  return <div className="text-muted">Yükleniyor...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold">{w.name}</h1>
      {w.description && <p className="text-muted mt-1">{w.description}</p>}
      <p className="text-xs text-muted mt-1">
        {w.items.length} yapım · {w.isPublic ? 'Herkese açık' : 'Özel'}
      </p>
      <div className="mt-6">
        <ProductionGrid items={w.items} />
      </div>
    </div>
  );
}
