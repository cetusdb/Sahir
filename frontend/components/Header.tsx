'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ThemeSwitcher from './ThemeSwitcher';

export default function Header() {
  const { user, logout } = useAuth();
  const [q, setQ] = useState('');
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/');
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-bg/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/" className="text-2xl font-black tracking-tight">
          <span className="text-accent">SAHIR</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm text-muted">
          <Link href="/" className="hover:text-text">Anasayfa</Link>
          <Link href="/categories" className="hover:text-text">Kategoriler</Link>
          <Link href="/recommendations" className="hover:text-text">Öneriler</Link>
          {user && <Link href="/watchlists" className="hover:text-text">Listelerim</Link>}
          {/* Listelerim'in hemen sağında tema seçici */}
          {user && <ThemeSwitcher />}
          {(user?.role === 'Editor' || user?.role === 'Admin') && (
            <Link href="/editor" className="text-accent2 hover:text-accent2/80 font-semibold">
              Editör
            </Link>
          )}
          {user?.role === 'Admin' && (
            <Link href="/admin" className="text-accent hover:text-accent/80 font-semibold">
              Admin
            </Link>
          )}
        </nav>

        <form onSubmit={search} className="ml-auto flex-1 max-w-md hidden sm:block">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Film veya dizi ara..."
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm
                       placeholder-muted focus:outline-none focus:border-accent" />
        </form>

        <div className="flex items-center gap-2">
          {/* Misafirler için de tema seçici görünsün — istersen kaldır */}
          {!user && <ThemeSwitcher />}
          {user ? (
            <>
              <Link href={`/profile`} className="text-sm hover:text-accent">
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-card">
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link href="/login"
                className="text-sm px-3 py-1.5 rounded-md hover:bg-card">Giriş</Link>
              <Link href="/register"
                className="text-sm px-3 py-1.5 rounded-md bg-accent text-black font-semibold hover:opacity-90">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
