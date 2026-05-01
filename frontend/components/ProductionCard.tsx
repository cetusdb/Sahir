import Link from 'next/link';
import type { ProductionListItem } from '@/lib/api';

export default function ProductionCard({ p }: { p: ProductionListItem }) {
  return (
    <Link href={`/productions/${p.id}`}
      className="group block bg-card border border-border rounded-xl overflow-hidden
                 hover:border-accent transition-colors">
      <div className="aspect-[2/3] bg-panel relative overflow-hidden">
        {p.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.posterUrl} alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            Poster yok
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/70 text-accent text-xs
                        font-semibold rounded px-1.5 py-0.5">
          ★ {p.averageScore || '—'}
        </div>
        <div className="absolute top-2 left-2 bg-black/70 text-xs rounded px-1.5 py-0.5">
          {p.type === 'TVShow' ? 'Dizi' : 'Film'}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2
                       group-hover:text-accent">{p.title}</h3>
        <div className="text-xs text-muted mt-1 flex justify-between">
          <span>{p.releaseYear}</span>
          {p.categoryName && <span>{p.categoryName}</span>}
        </div>
      </div>
    </Link>
  );
}
