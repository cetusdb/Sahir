# Sahir - Film & Dizi Arşiv Platformu

IMDb / Letterboxd benzeri, kategori ağacına dayalı film & dizi arşivi.
Kullanıcılar yapımları puanlayabilir, yorum yazabilir, izleme listeleri oluşturabilir
ve izleme geçmişine göre kişiselleştirilmiş öneriler alabilir.

## Mimari

| Katman          | Teknoloji                                                 |
|-----------------|-----------------------------------------------------------|
| Backend         | ASP.NET Core 8 Web API + Entity Framework Core            |
| Frontend        | Next.js 14 (App Router) + React + TailwindCSS             |
| Veritabanı      | MySQL 8 (Pomelo.EntityFrameworkCore.MySql)                |
| Kimlik doğrulama| JWT Bearer Token + BCrypt parola özetleme                 |
| Öneri sistemi   | Tür bazlı skor (kullanıcı izleme geçmişi → ağırlıklı tür) |

## Klasör Yapısı

```
Sahir/
├── backend/
│   └── SahirAPI/                 ASP.NET Core Web API
│       ├── Controllers/          REST endpoint'leri
│       ├── Models/               Entity sınıfları
│       ├── DTOs/                 Data Transfer Objects
│       ├── Data/                 ApplicationDbContext
│       ├── Services/             Auth, Recommendation
│       ├── Program.cs
│       ├── appsettings.json
│       └── SahirAPI.csproj
├── frontend/                     Next.js uygulaması
│   ├── app/                      App Router sayfaları
│   ├── components/               UI bileşenleri
│   ├── lib/                      API client, helpers
│   ├── package.json
│   └── tailwind.config.js
├── database/
│   └── schema.sql                MySQL şeması + seed
└── README.md
```

## Başlıca Özellikler

Film/Dizi CRUD ve hiyerarşik kategori ağacı (Aksiyon → Süper Kahraman gibi).
Kullanıcı kayıt/giriş, rol yönetimi (User, Editor, Admin).
1-10 puan sistemi, yorum yazma, beğenme.
İzleme listesi (Watchlist), izlendi listesi (Watched).
İzleme geçmişine göre tür ağırlıklı öneri motoru.
Editör paneli: yapım ekleme/güncelleme.

## Hızlı Başlangıç

1. **Veritabanı**: MySQL kur, `database/schema.sql` dosyasını çalıştır.
2. **Backend**: `cd backend/SahirAPI && dotnet restore && dotnet run`
3. **Frontend**: `cd frontend && npm install && npm run dev`
4. Tarayıcıda http://localhost:3000 adresini aç.

Detaylı kurulum için `backend/README.md` ve `frontend/README.md` dosyalarına bakın.

## API Endpoint'leri (özet)

```
POST   /api/auth/register             Yeni kullanıcı
POST   /api/auth/login                JWT token al
GET    /api/productions               Filtrele/ara
GET    /api/productions/{id}          Detay
POST   /api/productions               Editor+ ekler
GET    /api/categories/tree           Kategori ağacı
POST   /api/ratings                   Puan ver
GET    /api/comments/{productionId}   Yorumlar
POST   /api/comments                  Yorum yaz
GET    /api/watchlist                 Kullanıcının listesi
POST   /api/watchlist                 Listeye ekle
GET    /api/recommendations           Kişisel öneriler
```

## Lisans

Eğitim amaçlı örnek proje.
