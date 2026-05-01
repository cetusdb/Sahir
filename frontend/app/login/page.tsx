'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const r = await api.login({ email, password });
      // Context'i güncelle → Header anında re-render olur
      login(r.token, { userId: r.userId, username: r.username, role: r.role });
      router.push('/');
    } catch (ex: any) {
      setErr(ex.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-panel border border-border rounded-xl p-6 mt-8">
      <h1 className="text-2xl font-bold mb-1">Giriş Yap</h1>
      <p className="text-muted text-sm mb-5">Sahir hesabınla devam et.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-posta">
          <input type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-border rounded-md px-3 py-2
                       focus:outline-none focus:border-accent" />
        </Field>
        <Field label="Parola">
          <input type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-card border border-border rounded-md px-3 py-2
                       focus:outline-none focus:border-accent" />
        </Field>
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button disabled={loading}
          className="w-full bg-accent text-black font-semibold py-2 rounded-md
                     disabled:opacity-50">
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
      <p className="text-sm text-muted mt-4">
        Hesabın yok mu? <Link href="/register" className="text-accent">Kayıt Ol</Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}