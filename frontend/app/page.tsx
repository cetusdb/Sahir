'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type ProductionListItem } from '@/lib/api';
import ProductionCarousel from '@/components/ProductionCarousel';

type Section = {
  title: string;
  subtitle?: string;
  items: ProductionListItem[];
  href: string;
};

export default function HomePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [trending, setTrending] = useState<ProductionListItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.productions({ sort: 'popular', pageSize: 100 }),
      api.productions({ sort: 'rating',  pageSize: 100 }),
      api.productions({ sort: 'newest',  pageSize: 100 }),
      api.productions({ sort: 'popular', type: 'Movie',  pageSize: 100 }),
      api.productions({ sort: 'popular', type: 'TVShow', pageSize: 100 })
    ])
      .then(([popular, top, newest, movies, shows]) => {
        setTrending(popular.items.slice(0, 5));
        setSections([
          { title: 'Popüler',         subtitle: 'En çok izlenen ve oylanan',
            items: popular.items, href: '/search?sort=popular' },
          { title: 'En Yüksek Puanlı', subtitle: 'Eleştirmen favorileri',
            items: top.items,     href: '/search?sort=rating' },
          { title: 'Yeni Eklenenler',  subtitle: 'Kataloğa son giren yapımlar',
            items: newest.items,  href: '/search?sort=newest' },
          { title: 'Filmler',          subtitle: 'Uzun metraj seçkisi',
            items: movies.items,  href: '/search?type=Movie&sort=popular' },
          { title: 'Diziler',          subtitle: 'Sezon sezon takip et',
            items: shows.items,   href: '/search?type=TVShow&sort=popular' }
        ].filter((s) => s.items.length > 0));
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border
                          bg-gradient-to-br from-panel to-card p-8 sm:p-12">
        {trending[0]?.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={trending[0].posterUrl} alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-15" />
        )}
        <div className="relative">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Film & dizi dünyana <span className="text-accent">hoş geldin</span>.
          </h1>
          <p className="mt-3 text-muted max-w-2xl">
            Kategoriye göre keşfet, puanla, yorum yaz. Kişiselleştirilmiş öneriler
            için izleme listeni oluştur.
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            <Link href="/categories"
              className="px-4 py-2 rounded-md bg-accent text-black font-semibold">
              Kategorileri Gez
            </Link>
            <Link href="/recommendations"
              className="px-4 py-2 rounded-md border border-border hover:bg-card">
              Önerilerini Al
            </Link>
          </div>
        </div>
      </section>

      {err && <div className="text-red-400">API hatası: {err}</div>}
      {loading && <div className="text-muted">Yükleniyor...</div>}

      {!loading && sections.length === 0 && !err && (
        <div className="bg-panel border border-border rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Henüz film/dizi yok</h2>
          <p className="text-muted text-sm mb-4">
            Veritabanı boş gözüküyor. Yapımları görmek için:
          </p>
          <ul className="text-sm text-muted text-left max-w-md mx-auto space-y-1">
            <li>• Editör panelinden manuel yapım ekleyebilirsin, veya</li>
            <li>• <code className="text-accent">SahirImporter</code> ile Kaggle CSV'den toplu aktarım yapabilirsin.</li>
          </ul>
          <div className="mt-5 flex gap-2 justify-center">
            <Link href="/editor/productions/new"
              className="px-4 py-2 rounded-md bg-accent text-black font-semibold text-sm">
              + Yapım Ekle
            </Link>
            <Link href="/categories"
              className="px-4 py-2 rounded-md border border-border text-sm">
              Kategorilere Bak
            </Link>
          </div>
        </div>
      )}

      {sections.map((s) => (
        <ProductionCarousel
          key={s.title}
          title={s.title}
          subtitle={s.subtitle}
          items={s.items}
          href={s.href}
        />
      ))}
    </div>
  );
}
