'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function EditorDashboardPage() {
  const { user, ready } = useAuth();

  if (!ready) return <div className="text-muted">Yükleniyor...</div>;

  const allowed = user?.role === 'Editor' || user?.role === 'Admin';
  if (!allowed) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Yetkisiz Erişim</h1>
        <p className="text-muted mb-4">
          Bu sayfa yalnızca editör veya admin rolüne sahip kullanıcılar içindir.
        </p>
        <Link href="/" className="text-accent">Anasayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Editör Paneli</h1>
      <p className="text-muted mb-6">
        Yapım kataloğunu yönet. Yeni film/dizi ekle, mevcut bilgileri güncelle.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/editor/productions"
          className="block bg-panel border border-border rounded-xl p-6
                     hover:border-accent transition-colors">
          <h2 className="text-xl font-bold">Yapımları Yönet</h2>
          <p className="text-sm text-muted mt-1">
            Mevcut filmleri ve dizileri listele, düzenle veya sil.
          </p>
        </Link>
        <Link href="/editor/productions/new"
          className="block bg-panel border border-accent rounded-xl p-6
                     hover:bg-card transition-colors">
          <h2 className="text-xl font-bold text-accent">+ Yeni Yapım Ekle</h2>
          <p className="text-sm text-muted mt-1">
            Kataloğa yeni bir film veya dizi kaydı oluştur.
          </p>
        </Link>
      </div>
    </div>
  );
}
