'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setU] = useState('');
  const [email, setE] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const r = await api.register({ username, email, password });
      login(r.token, { userId: r.userId, username: r.username, role: r.role });
      router.push('/');
    } catch (ex: any) {
      setErr(ex.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-panel border border-border rounded-xl p-6 mt-8">
      <h1 className="text-2xl font-bold mb-1">Hesap Oluştur</h1>
      <p className="text-muted text-sm mb-5">Sahir'e ücretsiz katıl.</p>
      <form onSubmit={submit} className="space-y-4">
        <input placeholder="Kullanıcı adı" required value={username}
          onChange={(e) => setU(e.target.value)}
          className="w-full bg-card border border-border rounded-md px-3 py-2
                     focus:outline-none focus:border-accent" />
        <input type="email" placeholder="E-posta" required value={email}
          onChange={(e) => setE(e.target.value)}
          className="w-full bg-card border border-border rounded-md px-3 py-2
                     focus:outline-none focus:border-accent" />
        <input type="password" placeholder="Parola (en az 6 karakter)" required
          minLength={6} value={password}
          onChange={(e) => setP(e.target.value)}
          className="w-full bg-card border border-border rounded-md px-3 py-2
                     focus:outline-none focus:border-accent" />
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button disabled={loading}
          className="w-full bg-accent text-black font-semibold py-2 rounded-md
                     disabled:opacity-50">
          {loading ? 'Oluşturuluyor...' : 'Kayıt Ol'}
        </button>
      </form>
      <p className="text-sm text-muted mt-4">
        Zaten üye misin? <Link href="/login" className="text-accent">Giriş Yap</Link>
      </p>
    </div>
  );
}