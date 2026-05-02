'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, type AdminStats } from '@/lib/api';

export default function AdminDashboardPage() {
  const { user, ready } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (user?.role !== 'Admin') return;
    api.adminStats().then(setStats).catch((e) => setErr(e.message));
  }, [ready, user]);

  if (!ready) return <div className="text-muted">Yükleniyor...</div>;
  if (user?.role !== 'Admin') {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Yetkisiz Erişim</h1>
        <p className="text-muted">Bu sayfa sadece admin kullanıcılar içindir.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Admin Paneli</h1>
      <p className="text-muted mb-6">Sistem yönetimi ve kullanıcı işlemleri.</p>

      {err && <div className="text-red-400 mb-4">{err}</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Toplam Kullanıcı" value={stats.totalUsers} />
          <Stat label="Admin"            value={stats.totalAdmins}    accent />
          <Stat label="Editör"           value={stats.totalEditors} />
          <Stat label="Yapım"            value={stats.totalProductions} />
          <Stat label="Puan"             value={stats.totalRatings} />
          <Stat label="Yorum"            value={stats.totalComments} />
          <Stat label="İzleme Listesi"   value={stats.totalWatchlists} />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/admin/users"
          className="block bg-panel border border-border rounded-xl p-6
                     hover:border-accent transition-colors">
          <h2 className="text-xl font-bold">Kullanıcı Yönetimi</h2>
          <p className="text-sm text-muted mt-1">
            Tüm kullanıcıları listele, rol ata, hesap sil.
          </p>
        </Link>
        <Link href="/admin/comments"
          className="block bg-panel border border-border rounded-xl p-6
                     hover:border-accent transition-colors">
          <h2 className="text-xl font-bold">Yorum Moderasyonu</h2>
          <p className="text-sm text-muted mt-1">
            Tüm yorumları gör, uygunsuz olanları sil.
          </p>
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`bg-panel border ${accent ? 'border-accent' : 'border-border'} rounded-xl p-4`}>
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? 'text-accent' : ''}`}>{value}</div>
    </div>
  );
}
