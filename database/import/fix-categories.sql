-- =====================================================================
-- Sahir - Mevcut filmleri türlerine göre alt kategorilere dağıtır
-- ve İngilizce TMDB tür adlarını Türkçe karşılıklarıyla birleştirir.
--
-- ÇALIŞTIRMADAN ÖNCE: Veritabanını yedekle (mysqldump) — geri dönüşü yok.
-- Çalıştırma: MySQL Workbench'te tüm bloğu seç ve Execute (Ctrl+Shift+Enter).
-- =====================================================================

USE sahir_db;
SET autocommit = 0;
START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1) İngilizce ↔ Türkçe tür eşlemesi (geçici tablo)
-- ---------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS GenreMap;
CREATE TEMPORARY TABLE GenreMap (
    en VARCHAR(50) PRIMARY KEY,
    tr VARCHAR(50) NOT NULL
);

INSERT INTO GenreMap (en, tr) VALUES
  ('Action',          'Aksiyon'),
  ('Adventure',       'Macera'),
  ('Science Fiction', 'Bilim Kurgu'),
  ('Drama',           'Drama'),
  ('Comedy',          'Komedi'),
  ('Crime',           'Suç'),
  ('Thriller',        'Gerilim'),
  ('Fantasy',         'Fantastik'),
  ('Romance',         'Romantik'),
  ('Horror',          'Korku'),
  ('Documentary',     'Belgesel'),
  ('Animation',       'Animasyon'),
  ('Mystery',         'Gizem'),
  ('Family',          'Aile'),
  ('War',             'Savaş'),
  ('History',         'Tarihi'),
  ('Music',           'Müzik'),
  ('Western',         'Western'),
  ('TV Movie',        'TV Filmi');

-- ---------------------------------------------------------------------
-- 2) Türkçe karşılığı henüz Genres tablosunda yoksa ekle
-- ---------------------------------------------------------------------
INSERT INTO Genres (Name)
SELECT m.tr FROM GenreMap m
LEFT JOIN Genres g ON g.Name = m.tr
WHERE g.Id IS NULL;

-- ---------------------------------------------------------------------
-- 3) İngilizce-türlü her ürün için Türkçe türü de ekle (varsa atla)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO ProductionGenres (ProductionId, GenreId)
SELECT pg.ProductionId, tr.Id
FROM ProductionGenres pg
JOIN Genres en  ON pg.GenreId = en.Id
JOIN GenreMap m ON m.en = en.Name
JOIN Genres tr  ON tr.Name = m.tr;

-- ---------------------------------------------------------------------
-- 4) İngilizce ProductionGenres bağlantılarını sil
-- ---------------------------------------------------------------------
DELETE pg FROM ProductionGenres pg
JOIN Genres en  ON pg.GenreId = en.Id
JOIN GenreMap m ON m.en = en.Name;

-- ---------------------------------------------------------------------
-- 5) Boşta kalan İngilizce türleri sil
-- ---------------------------------------------------------------------
DELETE FROM Genres
WHERE Name IN (SELECT en FROM GenreMap)
  AND Id NOT IN (SELECT GenreId FROM ProductionGenres);

-- ---------------------------------------------------------------------
-- 6) Filmleri türlerine göre alt kategoriye ata
--    Mantık: Yapımın türleriyle kategori adı eşleşen ilk kayıt seçilir.
--    Yaprak (alt) kategoriler kök kategorilere tercih edilir.
-- ---------------------------------------------------------------------
UPDATE Productions p
SET p.CategoryId = (
    SELECT c.Id
    FROM ProductionGenres pg
    JOIN Genres g     ON pg.GenreId = g.Id
    JOIN Categories c ON c.Name     = g.Name
    WHERE pg.ProductionId = p.Id
    ORDER BY
        CASE WHEN c.ParentId IS NOT NULL THEN 0 ELSE 1 END,
        c.Id
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1
    FROM ProductionGenres pg
    JOIN Genres g     ON pg.GenreId = g.Id
    JOIN Categories c ON c.Name     = g.Name
    WHERE pg.ProductionId = p.Id
);

-- ---------------------------------------------------------------------
-- 7) Eşleşmeyen yapımları "Film" kök kategorisine bırak (varsayılan)
-- ---------------------------------------------------------------------
UPDATE Productions
SET CategoryId = (SELECT Id FROM Categories WHERE Slug = 'film' LIMIT 1)
WHERE CategoryId IS NULL AND Type = 'Movie';

UPDATE Productions
SET CategoryId = (SELECT Id FROM Categories WHERE Slug = 'dizi' LIMIT 1)
WHERE CategoryId IS NULL AND Type = 'TVShow';

-- ---------------------------------------------------------------------
-- Özet
-- ---------------------------------------------------------------------
SELECT c.Name AS Kategori, COUNT(p.Id) AS YapımSayısı
FROM Productions p
LEFT JOIN Categories c ON c.Id = p.CategoryId
GROUP BY c.Id, c.Name
ORDER BY YapımSayısı DESC;

DROP TEMPORARY TABLE GenreMap;

COMMIT;
SET autocommit = 1;
