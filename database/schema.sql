-- =====================================================================
-- Sahir - Film & Dizi Arşiv Platformu
-- MySQL 8 veritabanı şeması + örnek (seed) veriler
-- =====================================================================

DROP DATABASE IF EXISTS sahir_db;
CREATE DATABASE sahir_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE sahir_db;

-- ---------------------------------------------------------------------
-- Kullanıcılar
-- ---------------------------------------------------------------------
CREATE TABLE Users (
    Id            INT AUTO_INCREMENT PRIMARY KEY,
    Username      VARCHAR(50)  NOT NULL UNIQUE,
    Email         VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash  VARCHAR(255) NOT NULL,
    Role          ENUM('User','Editor','Admin') NOT NULL DEFAULT 'User',
    AvatarUrl     VARCHAR(500) NULL,
    Bio           TEXT NULL,
    CreatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (Email)
);

-- ---------------------------------------------------------------------
-- Kategori ağacı (self-referential)
-- Örn: Aksiyon -> Süper Kahraman, Bilim Kurgu -> Distopya
-- ---------------------------------------------------------------------
CREATE TABLE Categories (
    Id          INT AUTO_INCREMENT PRIMARY KEY,
    Name        VARCHAR(100) NOT NULL,
    Slug        VARCHAR(120) NOT NULL UNIQUE,
    ParentId    INT NULL,
    Description VARCHAR(500) NULL,
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cat_parent FOREIGN KEY (ParentId)
        REFERENCES Categories(Id) ON DELETE SET NULL,
    INDEX idx_cat_parent (ParentId)
);

-- ---------------------------------------------------------------------
-- Yapımlar (Film veya Dizi)
-- ---------------------------------------------------------------------
CREATE TABLE Productions (
    Id            INT AUTO_INCREMENT PRIMARY KEY,
    Title         VARCHAR(255) NOT NULL,
    OriginalTitle VARCHAR(255) NULL,
    Type          ENUM('Movie','TVShow') NOT NULL,
    ReleaseYear   INT NOT NULL,
    EndYear       INT NULL,
    DurationMin   INT NULL,                 -- Film süresi
    SeasonsCount  INT NULL,                 -- Dizi için
    EpisodesCount INT NULL,
    Synopsis      TEXT NULL,
    PosterUrl     VARCHAR(500) NULL,
    BackdropUrl   VARCHAR(500) NULL,
    TrailerUrl    VARCHAR(500) NULL,
    Director      VARCHAR(255) NULL,
    Country       VARCHAR(100) NULL,
    Language      VARCHAR(50)  NULL,
    CategoryId    INT NULL,                 -- Birincil kategori
    CreatedById   INT NULL,                 -- Editör
    CreatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_cat   FOREIGN KEY (CategoryId)
        REFERENCES Categories(Id) ON DELETE SET NULL,
    CONSTRAINT fk_prod_user  FOREIGN KEY (CreatedById)
        REFERENCES Users(Id) ON DELETE SET NULL,
    INDEX idx_prod_title    (Title),
    INDEX idx_prod_year     (ReleaseYear),
    INDEX idx_prod_type     (Type),
    INDEX idx_prod_category (CategoryId),
    FULLTEXT KEY ft_prod_search (Title, OriginalTitle, Synopsis)
);

-- ---------------------------------------------------------------------
-- Türler (M:N) - Bir yapım birden çok türe ait olabilir
-- ---------------------------------------------------------------------
CREATE TABLE Genres (
    Id   INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE ProductionGenres (
    ProductionId INT NOT NULL,
    GenreId      INT NOT NULL,
    PRIMARY KEY (ProductionId, GenreId),
    CONSTRAINT fk_pg_prod  FOREIGN KEY (ProductionId)
        REFERENCES Productions(Id) ON DELETE CASCADE,
    CONSTRAINT fk_pg_genre FOREIGN KEY (GenreId)
        REFERENCES Genres(Id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Puanlar (1-10)
-- ---------------------------------------------------------------------
CREATE TABLE Ratings (
    Id           INT AUTO_INCREMENT PRIMARY KEY,
    UserId       INT NOT NULL,
    ProductionId INT NOT NULL,
    Score        TINYINT NOT NULL,    -- 1..10
    CreatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_prod (UserId, ProductionId),
    CONSTRAINT fk_rate_user FOREIGN KEY (UserId)
        REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT fk_rate_prod FOREIGN KEY (ProductionId)
        REFERENCES Productions(Id) ON DELETE CASCADE,
    CONSTRAINT chk_score CHECK (Score BETWEEN 1 AND 10)
);

-- ---------------------------------------------------------------------
-- Yorumlar
-- ---------------------------------------------------------------------
CREATE TABLE Comments (
    Id           INT AUTO_INCREMENT PRIMARY KEY,
    UserId       INT NOT NULL,
    ProductionId INT NOT NULL,
    Body         TEXT NOT NULL,
    LikeCount    INT NOT NULL DEFAULT 0,
    CreatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cmt_user FOREIGN KEY (UserId)
        REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT fk_cmt_prod FOREIGN KEY (ProductionId)
        REFERENCES Productions(Id) ON DELETE CASCADE,
    INDEX idx_cmt_prod (ProductionId)
);

-- ---------------------------------------------------------------------
-- İzleme Listeleri (Watchlist - kullanıcı oluşturur)
-- ---------------------------------------------------------------------
CREATE TABLE Watchlists (
    Id          INT AUTO_INCREMENT PRIMARY KEY,
    UserId      INT NOT NULL,
    Name        VARCHAR(120) NOT NULL,
    Description VARCHAR(500) NULL,
    IsPublic    BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wl_user FOREIGN KEY (UserId)
        REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE TABLE WatchlistItems (
    Id           INT AUTO_INCREMENT PRIMARY KEY,
    WatchlistId  INT NOT NULL,
    ProductionId INT NOT NULL,
    AddedAt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wl_prod (WatchlistId, ProductionId),
    CONSTRAINT fk_wli_wl   FOREIGN KEY (WatchlistId)
        REFERENCES Watchlists(Id) ON DELETE CASCADE,
    CONSTRAINT fk_wli_prod FOREIGN KEY (ProductionId)
        REFERENCES Productions(Id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- İzleme geçmişi (öneri motoru için)
-- ---------------------------------------------------------------------
CREATE TABLE WatchHistory (
    Id           INT AUTO_INCREMENT PRIMARY KEY,
    UserId       INT NOT NULL,
    ProductionId INT NOT NULL,
    WatchedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_history (UserId, ProductionId),
    CONSTRAINT fk_wh_user FOREIGN KEY (UserId)
        REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT fk_wh_prod FOREIGN KEY (ProductionId)
        REFERENCES Productions(Id) ON DELETE CASCADE
);

-- =====================================================================
-- Seed: Kategoriler
-- =====================================================================
INSERT INTO Categories (Id, Name, Slug, ParentId, Description) VALUES
(1, 'Film',         'film',         NULL, 'Tüm uzun metraj filmler'),
(2, 'Dizi',         'dizi',         NULL, 'Tüm televizyon dizileri'),
(3, 'Aksiyon',      'aksiyon',      1,    'Aksiyon filmleri'),
(4, 'Süper Kahraman','super-kahraman',3,  'Süper kahraman filmleri'),
(5, 'Bilim Kurgu',  'bilim-kurgu',  1,    'Sci-fi filmleri'),
(6, 'Distopya',     'distopya',     5,    'Distopik gelecek senaryoları'),
(7, 'Drama',        'drama',        1,    'Drama filmleri'),
(8, 'Komedi',       'komedi',       1,    'Komedi filmleri'),
(9, 'Suç',          'suc',          2,    'Suç dizileri'),
(10,'Fantastik',    'fantastik',    2,    'Fantastik diziler'),
(11,'Belgesel',     'belgesel',     1,    'Belgesel filmler');

-- =====================================================================
-- Seed: Türler (Genres)
-- =====================================================================
INSERT INTO Genres (Id, Name) VALUES
(1,'Aksiyon'),(2,'Macera'),(3,'Bilim Kurgu'),(4,'Drama'),
(5,'Komedi'),(6,'Suç'),(7,'Gerilim'),(8,'Fantastik'),
(9,'Romantik'),(10,'Korku'),(11,'Belgesel'),(12,'Animasyon');

-- =====================================================================
-- Seed: Admin & örnek kullanıcılar
--   Parolalar BCrypt ile özetlenmiştir (uygulamada API üzerinden üretilmeli).
--   Aşağıdaki örnek hash 'Sahir123!' parolasının BCrypt karşılığıdır.
-- =====================================================================
INSERT INTO Users (Id, Username, Email, PasswordHash, Role, Bio) VALUES
(1,'admin','admin@sahir.local',
 '$2a$11$8K1p/aB0hSx0Cs2gQ7n7sOFkkH9hqz5R4mZ7bV3W7xS9UoEuW.5cu',
 'Admin','Site yöneticisi'),
(2,'editor','editor@sahir.local',
 '$2a$11$8K1p/aB0hSx0Cs2gQ7n7sOFkkH9hqz5R4mZ7bV3W7xS9UoEuW.5cu',
 'Editor','Yapım editörü'),
(3,'cinephile','cine@sahir.local',
 '$2a$11$8K1p/aB0hSx0Cs2gQ7n7sOFkkH9hqz5R4mZ7bV3W7xS9UoEuW.5cu',
 'User','Sinema tutkunu');

-- =====================================================================
-- Seed: Yapımlar
-- =====================================================================
INSERT INTO Productions
 (Id, Title, OriginalTitle, Type, ReleaseYear, DurationMin, Synopsis,
  PosterUrl, Director, Country, Language, CategoryId, CreatedById) VALUES
(1,'Inception','Inception','Movie',2010,148,
  'Bir hırsız, rüya paylaşımı teknolojisi sayesinde hedeflerinin bilinçaltına girer.',
  'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
  'Christopher Nolan','ABD','İngilizce',5,2),
(2,'The Dark Knight','The Dark Knight','Movie',2008,152,
  'Batman, Joker''e karşı Gotham''ı korumak için ahlaki sınırlarını test eder.',
  'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'Christopher Nolan','ABD','İngilizce',4,2),
(3,'Parasite','기생충','Movie',2019,132,
  'Yoksul bir aile, zengin bir aileye sızarak hayatlarını değiştirmeye çalışır.',
  'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
  'Bong Joon-ho','Güney Kore','Korece',7,2),
(4,'Interstellar','Interstellar','Movie',2014,169,
  'İnsanlığın hayatta kalması için bir grup astronot solucan deliği üzerinden seyahat eder.',
  'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  'Christopher Nolan','ABD','İngilizce',5,2),
(5,'Breaking Bad','Breaking Bad','TVShow',2008,NULL,
  'Kanser teşhisi konan bir kimya öğretmeni, metamfetamin üretmeye başlar.',
  'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  'Vince Gilligan','ABD','İngilizce',9,2),
(6,'Stranger Things','Stranger Things','TVShow',2016,NULL,
  '1980''lerin Indiana''sında küçük bir kasabada doğaüstü olaylar yaşanır.',
  'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
  'The Duffer Brothers','ABD','İngilizce',10,2),
(7,'The Matrix','The Matrix','Movie',1999,136,
  'Bir bilgisayar programcısı, gerçekliğin bir simülasyon olduğunu keşfeder.',
  'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  'The Wachowskis','ABD','İngilizce',5,2),
(8,'Avengers: Endgame','Avengers: Endgame','Movie',2019,181,
  'Yenilmezler, Thanos''un yaptıklarını geri almak için son bir hamle yapar.',
  'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  'Russo Brothers','ABD','İngilizce',4,2);

UPDATE Productions SET SeasonsCount=5,  EpisodesCount=62 WHERE Id=5;
UPDATE Productions SET SeasonsCount=4,  EpisodesCount=42 WHERE Id=6;

-- Production - Genre ilişkileri
INSERT INTO ProductionGenres (ProductionId, GenreId) VALUES
(1,3),(1,1),(1,7),
(2,1),(2,6),(2,4),
(3,4),(3,7),(3,5),
(4,3),(4,4),(4,2),
(5,6),(5,4),(5,7),
(6,8),(6,3),(6,7),
(7,3),(7,1),
(8,1),(8,2),(8,3);

-- Örnek puanlar
INSERT INTO Ratings (UserId, ProductionId, Score) VALUES
(3,1,9),(3,2,10),(3,4,9),(3,5,10),
(2,1,8),(2,3,9);

-- Örnek yorumlar
INSERT INTO Comments (UserId, ProductionId, Body) VALUES
(3,1,'Nolan''ın en iyi işlerinden biri, finalini hâlâ tartışıyoruz.'),
(3,2,'Heath Ledger''ın Joker''i sinema tarihine geçti.'),
(2,3,'Sınıf çatışmasını bu kadar çarpıcı anlatan az film vardır.');

-- Örnek izleme listeleri
INSERT INTO Watchlists (Id, UserId, Name, Description) VALUES
(1,3,'Favori Bilim Kurgu','Yıllar içinde topladığım sci-fi favorilerim'),
(2,3,'Sonra İzlerim','Henüz izlemediğim ama izlemek istediklerim');

INSERT INTO WatchlistItems (WatchlistId, ProductionId) VALUES
(1,1),(1,4),(1,7),
(2,3),(2,8);

-- İzleme geçmişi (öneri motoru girdisi)
INSERT INTO WatchHistory (UserId, ProductionId) VALUES
(3,1),(3,2),(3,4),(3,5),(3,7);
