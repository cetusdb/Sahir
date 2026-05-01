'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type CategoryNode } from '@/lib/api';

export default function CategoriesPage() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.categoryTree().then(setTree).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Kategoriler</h1>
      <p className="text-muted mb-6">Yapımları kategori ağacına göre keşfet.</p>
      {err && <div className="text-red-400">{err}</div>}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {tree.map((c) => <CategoryBlock key={c.id} c={c} />)}
      </div>
    </div>
  );
}

function CategoryBlock({ c }: { c: CategoryNode }) {
  return (
    <div className="bg-panel border border-border rounded-xl p-4">
      <Link href={`/categories/${c.id}`}
        className="text-lg font-bold hover:text-accent">{c.name}</Link>
      {c.description && <p className="text-sm text-muted mt-1">{c.description}</p>}
      {c.children?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {c.children.map((ch) => (
            <li key={ch.id}>
              <Link href={`/categories/${ch.id}`}
                className="text-sm text-muted hover:text-accent">→ {ch.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
