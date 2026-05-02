# Sahir API (Backend)

ASP.NET Core 8 Web API + Entity Framework Core + Pomelo.MySQL.

## Gereksinimler

- .NET SDK 8.0+
- MySQL 8.0+
- (Opsiyonel) `dotnet-ef` CLI: `dotnet tool install --global dotnet-ef`

## Kurulum

```bash
cd backend/SahirAPI

# Bağımlılıkları yükle
dotnet restore

# appsettings.json'daki DefaultConnection'ı kendi MySQL bilgilerinle güncelle
#  Server=localhost;Port=3306;Database=sahir_db;User=root;Password=root;

# Veritabanı şemasını yükle (kolay yol):
mysql -u root -p < ../../database/schema.sql

# (Alternatif) EF Core migrations kullanmak istersen:
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## Çalıştırma

```bash
dotnet run
# veya hot-reload ile:
dotnet watch
```

API varsayılan olarak `http://localhost:5000` (HTTP) ve
`https://localhost:5001` (HTTPS) üzerinde çalışır.

Swagger UI: `http://localhost:5000/swagger`

## Önemli Dosyalar

```
SahirAPI/
├── Program.cs                       Uygulama giriş, DI, JWT, CORS, Swagger
├── appsettings.json                 Bağlantı dizesi + JWT key
├── Data/ApplicationDbContext.cs     EF Core DbContext + ilişkiler
├── Models/                          Entity sınıfları
├── DTOs/                            Veri transfer nesneleri
├── Services/
│   ├── AuthService.cs               Kayıt/giriş + JWT üretimi (BCrypt)
│   └── RecommendationService.cs     Tür ağırlıklı öneri motoru
└── Controllers/
    ├── AuthController.cs
    ├── ProductionsController.cs
    ├── CategoriesController.cs
    ├── RatingsController.cs
    ├── CommentsController.cs
    ├── WatchlistsController.cs
    └── RecommendationsController.cs
```

## Roller

- `User`   — varsayılan rol; puan, yorum, liste oluşturma.
- `Editor` — yapım ekleme/güncelleme.
- `Admin`  — kategori/yapım silme, tam erişim.

`schema.sql` içindeki `admin / editor / cinephile` kullanıcılarının
parolaları örnek BCrypt hash içerir; gerçek bir parola için
`/api/auth/register` ile yeni kullanıcı oluşturup MySQL'den
rolünü `Admin` olarak güncellemen önerilir:

```sql
UPDATE Users SET Role = 'Admin' WHERE Username = 'kendi_kullanicim';
```

## Hızlı API testi

```bash
# Kayıt ol
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"t@t.com","password":"123456"}'

# Yapımları listele
curl http://localhost:5000/api/productions

# JWT ile öneri al
TOKEN="..."
curl http://localhost:5000/api/recommendations \
  -H "Authorization: Bearer $TOKEN"
```

## Güvenlik notları

- `Jwt:Key` üretimde mutlaka değiştirilmeli (en az 32 karakter, yüksek entropi).
- Bağlantı dizesi `appsettings.Production.json` ya da ortam değişkenleri ile yönetilmeli
  (`ConnectionStrings__DefaultConnection`).
- BCrypt çalışma faktörü (`workFactor`) varsayılan 11; çok yavaşsa düşürülebilir.
