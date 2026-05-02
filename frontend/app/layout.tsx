import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';

export const metadata: Metadata = {
  title: 'Sahir — Film & Dizi Arşivi',
  description: 'Film ve dizileri keşfet, puanla, yorumla; izleme listeleri oluştur.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-bg text-text">
        <AuthProvider>
          <ThemeProvider>
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10">
              {children}
            </main>
            <footer className="mt-16 border-t border-border py-8 text-center
                                text-muted text-sm relative z-10">
              Sahir © {new Date().getFullYear()} — Eğitim amaçlı örnek proje.
            </footer>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
