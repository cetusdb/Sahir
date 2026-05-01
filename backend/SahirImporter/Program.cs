using System.Globalization;
using System.Text.Json;
using CsvHelper;
using MySqlConnector;

namespace SahirImporter;

/// <summary>
/// Kaggle TMDB 5000 Movies CSV'sini sahir_db'ye aktarır.
///
/// Kullanım:
///   dotnet run -- --csv tmdb_5000_movies.csv --password ROOT_SIFREN
///
/// Opsiyonel parametreler:
///   --limit 1000     en fazla 1000 satır al (varsayılan 500)
///   --host localhost --port 3306 --user root --db sahir_db
/// </summary>
internal class Program
{
    /// <summary>TMDB'nin İngilizce tür adlarını Türkçeye çevirir.</summary>
    private static readonly Dictionary<string, string> GenreTr = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Action"]          = "Aksiyon",
        ["Adventure"]       = "Macera",
        ["Science Fiction"] = "Bilim Kurgu",
        ["Drama"]           = "Drama",
        ["Comedy"]          = "Komedi",
        ["Crime"]           = "Suç",
        ["Thriller"]        = "Gerilim",
        ["Fantasy"]         = "Fantastik",
        ["Romance"]         = "Romantik",
        ["Horror"]          = "Korku",
        ["Documentary"]     = "Belgesel",
        ["Animation"]       = "Animasyon",
        ["Mystery"]         = "Gizem",
        ["Family"]          = "Aile",
        ["War"]             = "Savaş",
        ["History"]         = "Tarihi",
        ["Music"]           = "Müzik",
        ["Western"]         = "Western",
        ["TV Movie"]        = "TV Filmi"
    };

    private static async Task<int> Main(string[] args)
    {
        var opts = ParseArgs(args);
        if (opts is null) return 1;

        Console.WriteLine($"[1/4] CSV okunuyor: {opts.CsvPath}");
        List<Dictionary<string, string>> rows;
        try { rows = ReadCsv(opts.CsvPath, opts.Limit); }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"      CSV okuma hatası: {ex.Message}");
            return 2;
        }
        Console.WriteLine($"      İşlenecek satır: {rows.Count}");

        var connStr = $"Server={opts.Host};Port={opts.Port};Database={opts.Database};" +
                      $"User={opts.User};Password={opts.Password};AllowUserVariables=true;";

        Console.WriteLine($"[2/4] MySQL'e bağlanılıyor: {opts.Host}:{opts.Port}/{opts.Database}");
        await using var conn = new MySqlConnection(connStr);
        try { await conn.OpenAsync(); }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"      Bağlantı başarısız: {ex.Message}");
            return 3;
        }

        // Film kategori id'sini al
        int? filmCatId = await GetFilmCategoryIdAsync(conn);
        if (filmCatId is null)
            Console.WriteLine("      UYARI: 'film' kategorisi yok, kategorisiz eklenecek.");

        // Mevcut türleri / kategorileri / filmleri yükle
        var genreMap    = await LoadGenresAsync(conn);
        var categoryMap = await LoadCategoriesAsync(conn);   // Name → Id
        var existing    = await LoadExistingTitlesAsync(conn);

        Console.WriteLine($"[3/4] Filmler işleniyor ({genreMap.Count} mevcut tür, " +
                          $"{categoryMap.Count} kategori, {existing.Count} mevcut yapım)...");

        int inserted = 0, skipped = 0;
        foreach (var row in rows)
        {
            try
            {
                var ok = await TryInsertAsync(conn, row, filmCatId, genreMap, categoryMap, existing);
                if (ok) { inserted++; if (inserted % 50 == 0)
                            Console.WriteLine($"      ... {inserted} eklendi"); }
                else     skipped++;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"      Satır atlandı: {ex.Message}");
                skipped++;
            }
        }

        Console.WriteLine($"[4/4] Bitti.");
        Console.WriteLine($"      Eklenen:    {inserted}");
        Console.WriteLine($"      Atlanan:    {skipped}");
        Console.WriteLine($"      Tür sayısı: {genreMap.Count}");
        return 0;
    }

    // ----------------------------------------------------------------------
    // İşin kalbi: tek satır CSV → INSERT
    // ----------------------------------------------------------------------
    private static async Task<bool> TryInsertAsync(
        MySqlConnection conn,
        Dictionary<string, string> row,
        int? filmCatId,
        Dictionary<string, int> genreMap,
        Dictionary<string, int> categoryMap,
        HashSet<(string, int)> existing)
    {
        var title = Truncate(row.GetValueOrDefault("title")
                          ?? row.GetValueOrDefault("original_title"), 255);
        if (string.IsNullOrWhiteSpace(title)) return false;

        var year = ParseYear(row.GetValueOrDefault("release_date"));
        if (year is null) return false;

        if (existing.Contains((title, year.Value))) return false;

        var originalTitle = Truncate(row.GetValueOrDefault("original_title"), 255);
        var synopsis      = NullIfEmpty(row.GetValueOrDefault("overview"));
        var posterPath    = row.GetValueOrDefault("poster_path");
        var posterUrl     = !string.IsNullOrWhiteSpace(posterPath)
                            ? $"https://image.tmdb.org/t/p/w500{posterPath}"
                            : null;
        var language      = Truncate(row.GetValueOrDefault("original_language"), 50);
        var country       = Truncate(
            ParseTmdbJsonArray(row.GetValueOrDefault("production_countries"))
                .FirstOrDefault(),
            100);

        int? duration = null;
        if (double.TryParse(row.GetValueOrDefault("runtime"),
                            NumberStyles.Any, CultureInfo.InvariantCulture, out var rt)
            && rt > 0)
            duration = (int)rt;

        // İngilizce TMDB türlerini Türkçeye çevir
        var rawGenres = ParseTmdbJsonArray(row.GetValueOrDefault("genres"));
        var trGenres  = rawGenres
            .Select(g => GenreTr.TryGetValue(g, out var tr) ? tr : g)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        // Türlerden uygun bir alt kategori bul (yoksa Film köküne düşer)
        int? assignedCatId = filmCatId;
        foreach (var gn in trGenres)
        {
            if (categoryMap.TryGetValue(gn, out var cid))
            {
                assignedCatId = cid;
                break;     // ilk eşleşmeyi al — alt kategoriler önce kontrol edilebilir
            }
        }

        // Yapımı ekle
        const string sqlInsert = @"
INSERT INTO Productions
  (Title, OriginalTitle, Type, ReleaseYear, DurationMin,
   Synopsis, PosterUrl, Language, Country, CategoryId)
VALUES
  (@title, @origTitle, 'Movie', @year, @duration,
   @synopsis, @posterUrl, @language, @country, @catId);
SELECT LAST_INSERT_ID();";

        await using var cmd = new MySqlCommand(sqlInsert, conn);
        cmd.Parameters.AddWithValue("@title",     title);
        cmd.Parameters.AddWithValue("@origTitle", (object?)originalTitle ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@year",      year);
        cmd.Parameters.AddWithValue("@duration",  (object?)duration  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@synopsis",  (object?)synopsis  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@posterUrl", (object?)posterUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@language",  (object?)language  ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@country",   (object?)country   ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@catId",     (object?)assignedCatId ?? DBNull.Value);

        var idObj = await cmd.ExecuteScalarAsync();
        var prodId = Convert.ToInt32(idObj);

        // Türleri bağla (yoksa Türkçe adıyla ekle)
        foreach (var gname in trGenres)
        {
            if (!genreMap.TryGetValue(gname, out var gid))
            {
                await using var addG = new MySqlCommand(
                    "INSERT INTO Genres (Name) VALUES (@n); SELECT LAST_INSERT_ID();", conn);
                addG.Parameters.AddWithValue("@n", gname);
                gid = Convert.ToInt32(await addG.ExecuteScalarAsync());
                genreMap[gname] = gid;
            }
            await using var pgCmd = new MySqlCommand(
                "INSERT IGNORE INTO ProductionGenres (ProductionId, GenreId) VALUES (@p, @g)",
                conn);
            pgCmd.Parameters.AddWithValue("@p", prodId);
            pgCmd.Parameters.AddWithValue("@g", gid);
            await pgCmd.ExecuteNonQueryAsync();
        }

        existing.Add((title, year.Value));
        return true;
    }

    // ----------------------------------------------------------------------
    // CSV / yardımcılar
    // ----------------------------------------------------------------------
    private static List<Dictionary<string, string>> ReadCsv(string path, int limit)
    {
        var result = new List<Dictionary<string, string>>(limit);
        using var reader = new StreamReader(path);
        using var csv    = new CsvReader(reader, CultureInfo.InvariantCulture);
        csv.Read();
        csv.ReadHeader();
        var headers = csv.HeaderRecord!;
        while (csv.Read() && result.Count < limit)
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var h in headers)
                dict[h] = csv.GetField(h) ?? string.Empty;
            result.Add(dict);
        }
        return result;
    }

    private static List<string> ParseTmdbJsonArray(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return new();
        try
        {
            // TMDB CSV'sinde Python-style: [{'id': 28, 'name': 'Action'}, ...]
            var json = raw.Replace("'", "\"");
            using var doc = JsonDocument.Parse(json);
            var names = new List<string>();
            foreach (var el in doc.RootElement.EnumerateArray())
            {
                if (el.TryGetProperty("name", out var n) && n.ValueKind == JsonValueKind.String)
                    names.Add(n.GetString()!);
                else if (el.TryGetProperty("iso_3166_1", out var c)
                         && c.ValueKind == JsonValueKind.String)
                    names.Add(c.GetString()!);
            }
            return names.Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
        }
        catch { return new(); }
    }

    private static int? ParseYear(string? releaseDate)
    {
        if (string.IsNullOrWhiteSpace(releaseDate) || releaseDate.Length < 4) return null;
        return int.TryParse(releaseDate.AsSpan(0, 4), out var y) ? y : null;
    }

    private static string? Truncate(string? s, int max)
    {
        if (s is null) return null;
        s = s.Trim();
        return s.Length switch
        {
            0    => null,
            <= 0 => null,
            _    => s.Length <= max ? s : s[..max]
        };
    }

    private static string? NullIfEmpty(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s;

    // ----------------------------------------------------------------------
    // DB ön-yükleme
    // ----------------------------------------------------------------------
    private static async Task<int?> GetFilmCategoryIdAsync(MySqlConnection conn)
    {
        await using var cmd = new MySqlCommand(
            "SELECT Id FROM Categories WHERE Slug='film' LIMIT 1", conn);
        var r = await cmd.ExecuteScalarAsync();
        return r is null || r is DBNull ? null : Convert.ToInt32(r);
    }

    private static async Task<Dictionary<string, int>> LoadGenresAsync(MySqlConnection conn)
    {
        var dict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        await using var cmd = new MySqlCommand("SELECT Id, Name FROM Genres", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            dict[reader.GetString(1)] = reader.GetInt32(0);
        return dict;
    }

    /// <summary>
    /// Kategori adı → Id eşlemesi. Alt kategoriler (ParentId IS NOT NULL)
    /// köklere tercih edilsin diye önce yaprakları döndürür.
    /// </summary>
    private static async Task<Dictionary<string, int>> LoadCategoriesAsync(MySqlConnection conn)
    {
        var dict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        await using var cmd = new MySqlCommand(
            @"SELECT Id, Name FROM Categories
              ORDER BY CASE WHEN ParentId IS NOT NULL THEN 0 ELSE 1 END, Id", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var name = reader.GetString(1);
            // Aynı isim varsa ilki (yaprak) galip
            if (!dict.ContainsKey(name)) dict[name] = reader.GetInt32(0);
        }
        return dict;
    }

    private static async Task<HashSet<(string, int)>> LoadExistingTitlesAsync(MySqlConnection conn)
    {
        var set = new HashSet<(string, int)>();
        await using var cmd = new MySqlCommand(
            "SELECT Title, ReleaseYear FROM Productions", conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            set.Add((reader.GetString(0), reader.GetInt32(1)));
        return set;
    }

    // ----------------------------------------------------------------------
    // CLI argümanları
    // ----------------------------------------------------------------------
    private record Options(
        string CsvPath, string Password,
        string Host, int Port, string User, string Database, int Limit);

    private static Options? ParseArgs(string[] args)
    {
        string? csv = null, password = null;
        string host = "localhost", user = "root", db = "sahir_db";
        int port = 3306, limit = 500;

        for (int i = 0; i < args.Length; i++)
        {
            string? Next() => i + 1 < args.Length ? args[++i] : null;
            switch (args[i])
            {
                case "--csv":      csv      = Next(); break;
                case "--password": password = Next(); break;
                case "--host":     host     = Next() ?? host; break;
                case "--port":     port     = int.Parse(Next() ?? "3306"); break;
                case "--user":     user     = Next() ?? user; break;
                case "--db":       db       = Next() ?? db; break;
                case "--limit":    limit    = int.Parse(Next() ?? "500"); break;
            }
        }

        if (string.IsNullOrEmpty(csv) || string.IsNullOrEmpty(password))
        {
            Console.WriteLine("Kullanım:");
            Console.WriteLine("  dotnet run -- --csv <CSV_YOLU> --password <MYSQL_SIFRE>");
            Console.WriteLine();
            Console.WriteLine("Opsiyonel:");
            Console.WriteLine("  --limit 1000   (varsayılan 500)");
            Console.WriteLine("  --host localhost --port 3306 --user root --db sahir_db");
            return null;
        }
        return new Options(csv, password, host, port, user, db, limit);
    }
}
