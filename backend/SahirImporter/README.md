# Sahir Importer (C#)

Kaggle TMDB CSV'sini `sahir_db`'ye aktaran küçük bir .NET 8 console uygulaması.
Backend ile aynı dilde (C#), dolayısıyla Visual Studio / Rider'da debug
edebilir, modeli/şemayı değişince kolayca uyarlayabilirsin.

## Adımlar

### 1) Veri setini indir

https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata
→ **Download** → zip içinden `tmdb_5000_movies.csv` dosyasını
**`backend/SahirImporter/`** klasörüne koy (ya da başka bir yere koyup yolu parametreyle ver).

### 2) Bağımlılıkları yükle

```powershell
cd backend\SahirImporter
dotnet restore
```

İlk seferde `MySqlConnector` ve `CsvHelper` paketlerini indirir.

### 3) Çalıştır

```powershell
dotnet run -- --csv tmdb_5000_movies.csv --password ROOT_SIFREN
```

Varsayılan olarak ilk **500** filmi alır. Daha fazla istersen:

```powershell
dotnet run -- --csv tmdb_5000_movies.csv --password ROOT_SIFREN --limit 2000
```

### 4) Çıktı

```
[1/4] CSV okunuyor: tmdb_5000_movies.csv
      İşlenecek satır: 500
[2/4] MySQL'e bağlanılıyor: localhost:3306/sahir_db
[3/4] Filmler işleniyor (12 mevcut tür, 8 mevcut yapım)...
      ... 50 eklendi
      ... 100 eklendi
      ...
[4/4] Bitti.
      Eklenen:    492
      Atlanan:    8
      Tür sayısı: 22
```

## Parametreler

| Parametre   | Varsayılan | Açıklama                                  |
|-------------|------------|-------------------------------------------|
| `--csv`     | (zorunlu)  | TMDB CSV dosyasının yolu                  |
| `--password`| (zorunlu)  | MySQL root parolası                       |
| `--limit`   | 500        | En fazla kaç film aktarılacak             |
| `--host`    | localhost  | MySQL adresi                              |
| `--port`    | 3306       | MySQL portu                               |
| `--user`    | root       | MySQL kullanıcısı                         |
| `--db`      | sahir_db   | Hedef veritabanı                          |

## Mantık

- **Aynı (Title, ReleaseYear) varsa atlar** — duplicate yaratmaz.
- TMDB poster URL'sini `https://image.tmdb.org/t/p/w500/...` olarak yazar.
- `genres` JSON-string'ini parse eder, eksik tür varsa `Genres` tablosuna ekler,
  M:N tablo `ProductionGenres`'e bağlar.
- Tüm yapımları **Film** kategorisine atar (TMDB 5000 sadece film içerir).
- Kullanıcı verilerine **(yorum, puan, izleme listesi) dokunmaz**.

## Sık karşılaşılan sorunlar

**`MySqlException: Access denied for user 'root'@'localhost'`**
→ `--password` MySQL Workbench'te bağlanırken kullandığın parolayla aynı olmalı.

**`MySqlException: Unknown database 'sahir_db'`**
→ `database/schema.sql` çalıştırılmamış. Önce onu yükle.

**`File not found: tmdb_5000_movies.csv`**
→ Dosya yolu yanlış. Tam yolla dene:
```powershell
dotnet run -- --csv "C:\indirilenler\tmdb_5000_movies.csv" --password ...
```

**Hâlâ `Eklenen: 0, Atlanan: 500`**
→ Filmler zaten DB'de. Tabloyu sıfırlamak istersen MySQL'de:
```sql
USE sahir_db;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Ratings;
TRUNCATE TABLE Comments;
TRUNCATE TABLE WatchlistItems;
TRUNCATE TABLE WatchHistory;
TRUNCATE TABLE ProductionGenres;
TRUNCATE TABLE Productions;
SET FOREIGN_KEY_CHECKS = 1;
```
(Dikkat: tüm yapımları + ona bağlı tüm verileri siler.)

## Daha büyük veri setleri

- **TMDB Movies Dataset 2023** (~1M film) — `--limit 5000` gibi sınırlı çek.
- **The Movies Dataset** (~45K film) — orta boy.

CSV'leri `title`, `release_date`, `genres`, `poster_path`, `runtime`,
`overview`, `original_language` gibi standart kolonları taşıdığı sürece
script'i değiştirmeden çalışır.

## Visual Studio'dan çalıştırma

1. Visual Studio'yu aç → **Open a project or solution** → `backend/` klasörünü seç
2. Solution Explorer'da **SahirImporter** projesine sağ tık → **Set as Startup Project**
3. Properties → Debug → "Open debug launch profiles UI" → **Command line arguments**:
   ```
   --csv tmdb_5000_movies.csv --password ROOT_SIFREN --limit 500
   ```
4. F5 ile çalıştır.
