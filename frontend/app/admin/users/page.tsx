'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, type AdminUser } from '@/lib/api';

type Role = 'User' | 'Editor' | 'Admin';

export default function AdminUsersPage() {
  const { user, ready } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load(search = '') {
    setLoading(true);
    try {
      const list = await api.adminUsers(search || undefined);
      setUsers(list);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!ready) return;
    if (user?.role !== 'Admin') return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  async function changeRole(u: AdminUser, role: Role) {
    if (u.role === role) return;
    if (!confirm(`${u.username} kullanıcısının rolü "${role}" olarak değiştirilsin mi?`)) return;
    setBusyId(u.id);
    try {
      await api.adminChangeRole(u.id, role);
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role } : x));
    } catch (e: any) { alert('Hata: ' + e.message); }
    finally { setBusyId(null); }
  }

  async function deleteUser(u: AdminUser) {
    if (!confirm(
      `${u.username} kullanıcısı tamamen silinecek (yorumları, puanları, listeleri dahil). Emin misin?`))
      return;
    setBusyId(u.id);
    try {
      await api.adminDeleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e: any) { alert('Hata: ' + e.message); }
    finally { setBusyId(null); }
  }

  if (!ready) return <div className="text-muted">Yükleniyor...</div>;
  if (user?.role !== 'Admin') {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Yetkisiz Erişim</h1>
        <p className="text-muted mb-4">Bu sayfa sadece admin kullanıcılar içindir.</p>
        <Link href="/" className="text-accent">Anasayfaya Dön</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-muted">Toplam {users.length} kullanıcı.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Ara (kullanıcı adı / e-posta)"
            className="bg-card border border-border rounded-md px-3 py-2 text-sm" />
          <button className="px-3 py-2 rounded-md bg-accent text-black font-semibold text-sm">
            Ara
          </button>
        </form>
      </div>

      {err && <div className="text-red-400 mb-3">{err}</div>}

      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted text-xs uppercase">
              <tr>
                <Th>Kullanıcı</Th>
                <Th>E-posta</Th>
                <Th>Rol</Th>
                <Th>Aktivite</Th>
                <Th>Kayıt</Th>
                <Th>İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center text-muted py-8">
                  Yükleniyor...
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-8">
                  Kullanıcı bulunamadı.
                </td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-card/40">
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent
                                      flex items-center justify-center text-xs font-bold text-accent">
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{u.username}</div>
                        <div className="text-xs text-muted">#{u.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted">{u.email}</Td>
                  <Td>
                    <select value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      className={`bg-card border rounded-md px-2 py-1 text-xs font-semibold
                        ${u.role === 'Admin'  ? 'border-accent  text-accent'  :
                          u.role === 'Editor' ? 'border-accent2 text-accent2' :
                                                'border-border'}`}>
                      <option value="User">User</option>
                      <option value="Editor">Editor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </Td>
                  <Td className="text-xs text-muted">
                    {u.ratingCount} puan · {u.commentCount} yorum · {u.watchlistCount} liste
                  </Td>
                  <Td className="text-xs text-muted">
                    {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                  </Td>
                  <Td>
                    <button
                      disabled={busyId === u.id || u.id === user.userId}
                      onClick={() => deleteUser(u)}
                      title={u.id === user.userId ? 'Kendi hesabını silemezsin' : 'Sil'}
                      className="text-xs px-2 py-1 rounded border border-red-500/40
                                 text-red-400 hover:bg-red-500/10 disabled:opacity-30
                                 disabled:cursor-not-allowed">
                      Sil
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-semibold">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
