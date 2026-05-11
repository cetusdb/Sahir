'use client';

import Link from 'next/link';
import type { ProductionListItem } from '@/lib/api';

export default function ProductionCard({ p }: { p: ProductionListItem }) {
  return (
    <Link
      href={`/productions/${p.id}`}
      className="group block bg-[#0f172a] border border-white/5 rounded-xl overflow-hidden
                 hover:border-accent/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]
                 transition-all duration-500 transform hover:-translate-y-1"
    >
      <div className="aspect-[2/3] bg-[#020617] relative overflow-hidden">
        {p.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.posterUrl}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-2">
            <span className="text-4xl opacity-20">🎬</span>
            <span className="text-xs italic">Afiş Hazırlanıyor</span>
          </div>
        )}

        {/* SAĞ ÜST: PUAN (ALTIN SARISI VURGULU) */}
        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-accent text-[11px]
                        font-bold rounded-lg border border-accent/20 px-2 py-1 flex items-center gap-1 shadow-lg">
          <span className="text-accent">★</span> {p.averageScore || '—'}
        </div>

        {/* SOL ÜST: TÜR (BUZLU CAM EFEKTİ) */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] text-white/90
                        font-medium rounded-lg px-2 py-1 border border-white/10 uppercase tracking-wider">
          {p.type === 'TVShow' ? 'Dizi' : 'Film'}
        </div>

        {/* ALT KISIMDAKİ SİYAH GEÇİŞ */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#020617] to-transparent opacity-80" />
      </div>

      <div className="p-4 bg-gradient-to-b from-[#0f172a] to-[#020617]">
        <h3 className="font-bold text-sm leading-tight line-clamp-2
                       group-hover:text-accent transition-colors duration-300 min-h-[2.5rem]">
          {p.title}
        </h3>

        <div className="text-[11px] text-muted-foreground mt-2 flex justify-between items-center opacity-80">
          <span className="bg-white/5 px-2 py-0.5 rounded text-white/70">{p.releaseYear}</span>
          {p.categoryName && (
            <span className="text-accent/80 font-medium truncate max-w-[100px]">
              {p.categoryName}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
