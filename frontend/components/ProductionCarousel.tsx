'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { ProductionListItem } from '@/lib/api';
import ProductionCard from './ProductionCard';

type Props = {
  title: string;
  subtitle?: string;
  items: ProductionListItem[];
  href?: string;          // "Tümünü gör" hedefi
  itemWidthClass?: string; // Tailwind genişlik sınıfı (kart için)
};

export default function ProductionCarousel({
  title, subtitle, items, href,
  itemWidthClass = 'w-36 sm:w-44 md:w-48'
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };
    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [items.length]);

  function scroll(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85 * dir;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }

  if (items.length === 0) return null;

  return (
    <section className="relative">
      {/* Başlık + sağda ok butonları */}
      <div className="flex items-end justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold truncate">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {href && (
            <Link href={href}
              className="text-xs text-muted hover:text-accent
                         px-2 py-1 rounded border border-border hover:border-accent">
              Tümünü Gör →
            </Link>
          )}
          <NavButton dir="left"  onClick={() => scroll(-1)} disabled={!canLeft}  />
          <NavButton dir="right" onClick={() => scroll(1)}  disabled={!canRight} />
        </div>
      </div>

      {/* Şerit + iki yan kenarda fade overlay */}
      <div className="relative">
        {/* Sol fade */}
        <div className={`pointer-events-none absolute inset-y-0 left-0 w-12
                         bg-gradient-to-r from-bg to-transparent z-10
                         transition-opacity ${canLeft ? 'opacity-100' : 'opacity-0'}`} />
        {/* Sağ fade */}
        <div className={`pointer-events-none absolute inset-y-0 right-0 w-12
                         bg-gradient-to-l from-bg to-transparent z-10
                         transition-opacity ${canRight ? 'opacity-100' : 'opacity-0'}`} />

        <div ref={trackRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 snap-x snap-mandatory
                     carousel-track">
          {items.map((p) => (
            <div key={p.id} className={`flex-none ${itemWidthClass} snap-start`}>
              <ProductionCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NavButton({
  dir, onClick, disabled
}: { dir: 'left' | 'right'; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      aria-label={dir === 'left' ? 'Sola kaydır' : 'Sağa kaydır'}
      className="w-9 h-9 rounded-full border border-border bg-card
                 hover:bg-panel hover:border-accent transition-colors
                 disabled:opacity-25 disabled:cursor-not-allowed
                 flex items-center justify-center text-base font-bold">
      {dir === 'left' ? '‹' : '›'}
    </button>
  );
}
