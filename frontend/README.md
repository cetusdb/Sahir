# Sahir Frontend (Next.js + Tailwind)

Next.js 14 (App Router), React 18, TypeScript ve TailwindCSS.

## Gereksinimler

- Node.js 18.17+ (önerilen 20+)
- npm veya pnpm/yarn

## Kurulum

```bash
cd frontend
npm install

# .env.local oluştur
cp .env.local.example .env.local
# İçeriği:
#   NEXT_PUBLIC_API_BASE=http://localhost:5000
```

## Çalıştırma

```bash
npm run dev
# Tarayıcıda: http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Sayfa Yapısı

```
app/
├── page.tsx                      Anasayfa: popüler / yüksek puanlı / yeni
├── login/page.tsx                Giriş
├── register/page.tsx             Kayıt
├── search/page.tsx               Arama sonuçları
├── profile/page.tsx              Kendi profilim
├── categories/
│   ├── page.tsx                  Kategori ağacı
│   └── [id]/page.tsx             Tek kategoriye ait yapımlar
├── productions/[id]/page.tsx     Yapım detayı + puan + yorum
├── recommendations/page.tsx      Kişisel öneriler
└── watchlists/
    ├── page.tsx                  Listelerim + yeni liste
    └── [id]/page.tsx             Liste detayı

components/
├── Header.tsx                    Üst menü, arama, kullanıcı durumu
├── ProductionCard.tsx            Kart bileşeni
└── ProductionGrid.tsx            Kart ızgarası

lib/
└── api.ts                        Tipler + fetch tabanlı API client
```

## Auth akışı

`api.login()` / `api.register()` başarılı olduğunda dönen JWT token
`localStorage` içine `sahir_token` anahtarıyla yazılır.
Tüm istekler `lib/api.ts` üzerinden gider ve `Authorization: Bearer ...` header'ı
otomatik eklenir. Token'ın süresi dolduğunda kullanıcı çıkış yapar (yeniden giriş gerekir).

## CORS

Backend `appsettings.json` → `Cors:AllowedOrigins` listesine
`http://localhost:3000` eklendiğinden emin ol; aksi halde tarayıcıda CORS hatası alırsın.
