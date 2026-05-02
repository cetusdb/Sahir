# Sahir — Kurulum Rehberi (Sıfırdan Çalıştırma)

Bu rehber, projeyi temiz bir bilgisayarda baştan ayağa çalışır hale getirmek
için izlenecek adımları içerir.

## 1) Ön Gereksinimler

| Yazılım            | Sürüm    | İndirme                                                |
|--------------------|----------|--------------------------------------------------------|
| .NET SDK           | 8.0+     | https://dotnet.microsoft.com/download                  |
| Node.js            | 20+      | https://nodejs.org                                     |
| MySQL Server       | 8.0+     | https://dev.mysql.com/downloads/mysql/                 |
| MySQL Workbench    | (ops.)   | Şema yüklemek için kolaylık sağlar                     |
| Git                | son      | https://git-scm.com                                    |

## 2) Veritabanını Hazırla

MySQL kuruluysa `root` kullanıcısıyla terminalden şemayı yükle:

```bash
mysql -u root -p < database/schema.sql
```

veya MySQL Workbench üzerinden `database/schema.sql` dosyasını aç ve çalıştır.

`sahir_db` veritabanı oluşur, örnek kategoriler / yapımlar / kullanıcılar yüklenir.

## 3) Backend'i Çalıştır

```bash
cd backend/SahirAPI

# Connection string'i kendi MySQL şifrenle güncelle:
#   appsettings.json → ConnectionStrings:DefaultConnection
#   Örn: Server=localhost;Port=3306;Database=sahir_db;User=root;Password=SENIN_SIFREN;

# JWT anahtarını mutlaka değiştir:
#   appsettings.json → Jwt:Key  (en az 32 karakterlik bir secret)

dotnet restore
dotnet run
```

API artık `http://localhost:5000` adresinde dinliyor.
Swagger UI: `http://localhost:5000/swagger`

## 4) Frontend'i Çalıştır

```bash
cd frontend
cp .env.local.example .env.local        # NEXT_PUBLIC_API_BASE=http://localhost:5000
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç.

## 5) İlk Kullanım

1. Sağ üstten **Kayıt Ol** ile bir hesap oluştur.
2. Anasayfadaki yapımlara tıkla, puanla ve yorum yaz.
3. **Listelerim** sayfasından yeni bir liste oluştur, yapım detayında "İzledim olarak işaretle" ile geçmişine ekle.
4. **Öneriler** sayfasında izleme geçmişine göre kişiselleştirilmiş listenin gelmesini izle.

## 6) Editör / Admin Yetkisi Verme

Yapım eklemek/güncellemek için Editor veya Admin rolüne ihtiyacın var.
Kayıt sonrası MySQL'den rolünü güncelle:

```sql
USE sahir_db;
UPDATE Users SET Role = 'Editor' WHERE Username = 'kendi_kullanicim';
-- veya
UPDATE Users SET Role = 'Admin'  WHERE Username = 'kendi_kullanicim';
```

Yeni token almak için bir kez **çıkış** + **giriş** yap.

## 7) Sık Karşılaşılan Sorunlar

**`MySql.Data.MySqlClient.MySqlException: Access denied`**
→ `appsettings.json` içinde `User`/`Password` değerini kontrol et.

**Tarayıcıda CORS hatası**
→ `appsettings.json` → `Cors:AllowedOrigins` listesinde `http://localhost:3000` olmalı.
→ Backend'i değişiklik sonrası yeniden başlat.

**`Cannot read properties of null (reading 'token')` veya 401**
→ Token süresi dolmuş olabilir. Çıkış yap, tekrar giriş yap.

**Posterler görünmüyor**
→ TMDB resimlerine internet erişimi gerekir; offline iseniz `posterUrl`'leri kendi
   bir CDN'e taşıyabilirsin. `next.config.js` içinde `remotePatterns` zaten gevşek tutuldu.

**Migration hatası**
→ `dotnet ef` yüklü değilse: `dotnet tool install --global dotnet-ef`
→ `database/schema.sql` zaten eksiksiz şemayı içerir, EF migration zorunlu değil.

## 8) Üretime Çıkış (Özet)

- Backend için Docker imajı + MySQL'i ayrı bir container'da çalıştır.
- `Jwt:Key` ve connection string'i ortam değişkeni olarak ver.
- Next.js'i `npm run build` + `npm start` ile veya Vercel'e deploy et.
- HTTPS arkasına al; cookie-based JWT veya HTTP-only kullanmak için
  `lib/api.ts` içindeki `localStorage` yaklaşımını gözden geçir.
