'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import ProductionForm from '@/components/ProductionForm';

export default function NewProductionPage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  if (!ready) return <div className="text-muted">Yükleniyor...</div>;
  const allowed = user?.role === 'Editor' || user?.role === 'Admin';
  if (!allowed) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Yetkisiz Erişim</h1>
        <Link href="/" className="text-accent">Anasayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link href="/editor/productions"
        className="text-sm text-muted hover:text-accent">← Yapımlara dön</Link>
      <h1 className="text-3xl font-bold mt-2 mb-1">Yeni Yapım Ekle</h1>
      <p className="text-muted mb-6">
        Yeni bir film veya dizi kaydı oluştur. Posteri yükleyebilir veya URL girebilirsin.
      </p>

      <ProductionForm
        submitLabel="Kaydet"
        onSubmit={async (data) => {
          const r = await api.createProduction(data);
          alert('Kayıt oluşturuldu.');
          router.push(`/productions/${r.id}`);
        }}
      />
    </div>
  );
}
