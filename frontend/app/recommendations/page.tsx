'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type AIPreferences, type ProductionListItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import ProductionGrid from '@/components/ProductionGrid';

const GENRE_CHOICES = [
  'Aksiyon', 'Macera', 'Bilim Kurgu', 'Drama', 'Komedi',
  'Suç', 'Gerilim', 'Fantastik', 'Romantik', 'Korku',
  'Belgesel', 'Animasyon'
];
const MOOD_CHOICES = [
  { id: 'Eğlenceli',          emoji: '😄' },
  { id: 'Düşündürücü',         emoji: '🤔' },
  { id: 'Gerilim/Heyecan',     emoji: '😱' },
  { id: 'Romantik',            emoji: '💕' },
  { id: 'Sakin/Hafif',         emoji: '☕' }
];
const ERA_CHOICES = [
  'Yeni filmler (2015 sonrası)',
  'Klasikler (1980-2014)',
  'Çok eski (1980 öncesi)',
  'Farketmez'
];

export default function RecommendationsPage() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<ProductionListItem[]>([]);
  const [aiItems, setAiItems] = useState<ProductionListItem[]>([]);
  const [aiReason, setAiReason] = useState<string>('');
  const [needsForm, setNeedsForm] = useState(false);
  const [loadingClassic, setLoadingClassic] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form state (cold-start için)
  const [genres, setGenres] = useState<string[]>([]);
  const [mood,   setMood]   = useState<string>('');
  const [era,    setEra]    = useState<string>('');

  useEffect(() => {
    if (!ready) return;
    if (!user) { setLoadingClassic(false); return; }
    api.recommendations(24)
      .then(setItems)
      .catch((e) => setErr(e.message))
      .finally(() => setLoadingClassic(false));
  }, [ready, user]);

  function toggleGenre(g: string) {
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  async function getAIRecommendations(prefs: AIPreferences | null = null) {
    setLoadingAi(true);
    setErr(null);
    setAiItems([]);
    setAiReason('');
    try {
      const r = await api.aiRecommendations(prefs, 12);
      if (r.requiresPreferences) {
        setNeedsForm(true);
      } else {
        setAiItems(r.items);
        setAiReason(r.reason ?? '');
        setNeedsForm(false);
      }
    } catch (e: any) {
      setErr('AI önerisi alınamadı: ' + e.message);
    } finally {
      setLoadingAi(false);
    }
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (genres.length === 0 && !mood && !era) {
      alert('En az bir tercih belirt — tür seç veya ruh hali/dönem seç.');
      return;
    }
    getAIRecommendations({ genres, mood, era });
  }

  if (!ready) return <div className="text-muted">Yükleniyor...</div>;

  if (!user) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold mb-2">Sana Özel Öneriler</h1>
        <p className="text-muted mb-6">Öneri almak için önce hesabına giriş yap.</p>
        <Link href="/login"
          className="px-4 py-2 rounded-md bg-accent text-black font-semibold">
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Sana Özel Öneriler</h1>
        <p className="text-muted">
          İzleme geçmişin, puanların ve listelerin analiz edilerek seçildi.
        </p>
      </div>

      {err && <div className="text-red-400">{err}</div>}

      {/* AI öneri kartı */}
      <section className="bg-gradient-to-br from-panel via-card to-panel
                          border border-accent2/40 rounded-2xl p-6">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>✨</span> Yapay Zekâ Önerileri
              <span className="text-xs px-2 py-0.5 rounded-full
                               bg-accent2/20 text-accent2 border border-accent2/40">
                Gemini
              </span>
            </h2>
            <p className="text-sm text-muted mt-1">
              Google Gemini, zevkine en yakın yapımları seçer ve neden seçtiğini açıklar.
            </p>
          </div>
          {!needsForm && aiItems.length === 0 && (
            <button
              onClick={() => setNeedsForm(true)}
              disabled={loadingAi}
              className="px-4 py-2 rounded-md bg-accent2 text-black font-semibold
                         disabled:opacity-50">
              {loadingAi ? 'Düşünüyor...' : '✨ Öneri Al'}
            </button>
          )}
        </div>

        {/* Cold-start formu */}
        {needsForm && (
          <form onSubmit={submitForm} className="mt-5 space-y-5">
            <div className="text-sm text-muted bg-card border border-border rounded-md p-3">
              Henüz izleme geçmişin yok. Sana iyi öneri verebilmek için
              üç soruya cevap ver:
            </div>

            {/* Soru 1: Türler */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                1. Hangi türleri seversin? <span className="text-muted">(birden fazla seç)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRE_CHOICES.map((g) => {
                  const on = genres.includes(g);
                  return (
                    <button type="button" key={g}
                      onClick={() => toggleGenre(g)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors
                        ${on ? 'bg-accent2 text-black border-accent2'
                             : 'border-border hover:bg-card'}`}>
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Soru 2: Ruh hali */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                2. Bugün nasıl bir şey izlemek istiyorsun?
              </label>
              <div className="flex flex-wrap gap-2">
                {MOOD_CHOICES.map((m) => (
                  <button type="button" key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`text-sm px-3 py-1.5 rounded-full border flex items-center gap-1.5
                      ${mood === m.id
                        ? 'bg-accent2 text-black border-accent2'
                        : 'border-border hover:bg-card'}`}>
                    <span>{m.emoji}</span>{m.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Soru 3: Dönem */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                3. Yapım dönemi?
              </label>
              <div className="flex flex-wrap gap-2">
                {ERA_CHOICES.map((e) => (
                  <button type="button" key={e}
                    onClick={() => setEra(e)}
                    className={`text-sm px-3 py-1.5 rounded-full border
                      ${era === e
                        ? 'bg-accent2 text-black border-accent2'
                        : 'border-border hover:bg-card'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loadingAi}
              className="w-full py-2.5 bg-accent2 text-black font-bold rounded-md
                         disabled:opacity-50">
              {loadingAi ? 'Gemini düşünüyor...' : '✨ Önerilerini Al'}
            </button>
          </form>
        )}

        {/* AI sonuçları */}
        {aiItems.length > 0 && (
          <div className="mt-5">
            {aiReason && (
              <div className="bg-card border border-accent2/40 rounded-md p-4 mb-4">
                <div className="text-xs text-accent2 uppercase tracking-wide mb-1">
                  Gemini'nin yorumu
                </div>
                <p className="text-sm leading-relaxed">{aiReason}</p>
              </div>
            )}
            <ProductionGrid items={aiItems} />
            <div className="text-center mt-4">
              <button onClick={() => {
                  // Sonuçları temizle, formu zorla aç — kullanıcı tercihlerini yeniden seçsin
                  setAiItems([]);
                  setAiReason('');
                  setGenres([]);
                  setMood('');
                  setEra('');
                  setNeedsForm(true);
                }}
                className="text-sm px-4 py-2 rounded-md border border-accent2
                           text-accent2 hover:bg-card">
                ↻ Tekrar öneri al
              </button>
            </div>
          </div>
        )}

        {loadingAi && aiItems.length === 0 && !needsForm && (
          <div className="mt-5 text-muted text-sm">Gemini düşünüyor, birkaç saniye sürebilir...</div>
        )}
      </section>

      {/* Klasik (içerik tabanlı) öneriler */}
      <section>
        <h2 className="text-2xl font-bold mb-1">Algoritmik Öneriler</h2>
        <p className="text-sm text-muted mb-4">
          Tür ağırlıkları + ortalama puan üzerinden hesaplandı.
        </p>
        {loadingClassic ? (
          <div className="text-muted">Hesaplanıyor...</div>
        ) : (
          <ProductionGrid items={items} />
        )}
      </section>
    </div>
  );
}
