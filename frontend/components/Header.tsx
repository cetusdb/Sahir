'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import ThemeSwitcher from './ThemeSwitcher';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const router = useRouter();
  
  // Müzik kontrolü için referans
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- MÜZİK YÖNETİM SİSTEMİ ---
  useEffect(() => {
    // Tema ve müzik dosyası eşleştirmeleri
    const themeSounds: Record<string, string> = {
      'valentines': '/valentines-bg.mp3',
      'halloween': '/halloween-bg.mp3',
      'christmas': '/christmas-bg.mp3'
    };

    const currentSoundPath = themeSounds[theme];

    if (currentSoundPath) {
      // Eğer zaten bir müzik objesi varsa ve kaynağı farklıysa eskisini temizle
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Yeni müzik objesini oluştur
      audioRef.current = new Audio(currentSoundPath);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;

      const playAudio = () => {
        audioRef.current?.play().catch(() => {
          console.log("Müzik için kullanıcı etkileşimi bekleniyor...");
        });
      };

      // İlk yüklemede ve etkileşim dinleyicileriyle çalmayı dene
      playAudio();
      window.addEventListener('click', playAudio, { once: true });
      window.addEventListener('scroll', playAudio, { once: true });
      window.addEventListener('keydown', playAudio, { once: true });

      // Temizlik fonksiyonu: Etkinlik dinleyicilerini kaldır
      return () => {
        window.removeEventListener('click', playAudio);
        window.removeEventListener('scroll', playAudio);
        window.removeEventListener('keydown', playAudio);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    } else {
      // Müzik tanımlanmamış temalarda (default vb.) çalmayı durdur
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, [theme]);

  function handleLogout() {
    logout();
    router.push('/');
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-bg/80 border-b border-border transition-all duration-300">
      
      {/* VARSAYILAN TEMA: SABİT PARLAYAN YILDIZLAR */}
      {theme === 'default' && (
        <div className="star-container">
          {[...Array(50)].map((_, i) => {
            const leftBase = (i / 50) * 100; 
            return (
              <div
                key={i}
                className="star"
                style={{
                  left: `${leftBase + (Math.random() * 6 - 3)}vw`, 
                  top: `${Math.random() * 100}vh`,
                  width: `${Math.random() * 10 + 12}px`, 
                  height: `${Math.random() * 10 + 12}px`,
                  animationDelay: `${Math.random() * 5}s`, 
                  animationDuration: `${Math.random() * 2 + 3.5}s`
                }}
              />
            );
          })}
        </div>
      )}

      {/* SEVGİLİLER GÜNÜ ANİMASYONU */}
      {theme === 'valentines' && (
        <div className="heart-explosion-container">
          {[...Array(60)].map((_, i) => (
            <span
              key={i}
              className="heart-particle"
              style={{
                left: `${Math.random() * 100}vw`,
                top: `${Math.random() * 100}vh`,
                '--tx': `${(Math.random() - 0.5) * 600}px`,
                '--ty': `${(Math.random() - 0.5) * 600}px`,
                '--r': `${Math.random() * 360}deg`,
                '--s': Math.random() * 1.5 + 0.5,
                animationDelay: `${Math.random() * 0.5}s`
              } as any}
            >
              ❤️
            </span>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center transition-transform hover:scale-105 active:scale-95">
          <Image 
            src="/sahirlogo.png.jpeg" 
            alt="SAHIR Logo" 
            width={70} 
            height={70} 
            className="object-contain"
            priority 
          />
        </Link>

        {/* NAVİGASYON */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-muted">
          <Link href="/" className="hover:text-text transition-colors">Anasayfa</Link>
          <Link href="/categories" className="hover:text-text transition-colors">Kategoriler</Link>
          <Link href="/recommendations" className="hover:text-text transition-colors">Öneriler</Link>
          {user && <Link href="/watchlists" className="hover:text-text transition-colors">Listelerim</Link>}
          
          {user && <ThemeSwitcher />}
          
          {(user?.role === 'Editor' || user?.role === 'Admin') && (
            <Link href="/editor" className="text-accent2 hover:text-accent2/80 font-semibold transition-colors">
              Editör
            </Link>
          )}
          {user?.role === 'Admin' && (
            <Link href="/admin" className="text-accent hover:text-accent/80 font-semibold transition-colors">
              Admin
            </Link>
          )}
        </nav>

        {/* ARAMA ÇUBUĞU */}
        <form onSubmit={search} className="ml-auto flex-1 max-w-md hidden sm:block">
          <div className="relative group">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Film veya dizi ara..."
              className="w-full bg-card border border-border rounded-lg px-4 py-2 text-sm
                         placeholder-muted focus:outline-none focus:border-accent 
                         focus:ring-1 focus:ring-accent/30 transition-all" 
            />
          </div>
        </form>

        {/* KULLANICI İŞLEMLERİ */}
        <div className="flex items-center gap-3">
          {!user && <ThemeSwitcher />}
          {user ? (
            <>
              <Link href={`/profile`} className="text-sm font-semibold hover:text-accent transition-colors">
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs px-4 py-2 rounded-md border border-border hover:bg-card hover:border-accent/50 transition-all">
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link href="/login"
                className="text-sm px-4 py-2 rounded-md hover:bg-card transition-colors">
                Giriş
              </Link>
              <Link href="/register"
                className="text-sm px-4 py-2 rounded-md bg-accent text-white font-bold hover:opacity-90 shadow-lg shadow-accent/20 transition-all">
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}