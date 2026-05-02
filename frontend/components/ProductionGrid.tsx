import type { ProductionListItem } from '@/lib/api';
import ProductionCard from './ProductionCard';

export default function ProductionGrid({ items }: { items: ProductionListItem[] }) {
  if (items.length === 0) {
    return <div className="text-muted py-12 text-center">Sonuç yok.</div>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map((p) => <ProductionCard key={p.id} p={p} />)}
    </div>
  );
}
