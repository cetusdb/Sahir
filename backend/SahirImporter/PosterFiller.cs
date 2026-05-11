using System.Net.Http.Json;
using System.Text.Json;
using MySqlConnector;

namespace SahirImporter;

/// <summary>
/// Postersiz filmleri TMDB arama API'siyle doldurur.
///
/// Kullanım:
///   dotnet run --project SahirImporter.csproj -- fill-posters \
///       --password ROOT_SIFREN --tmdb-key TMDB_API_KEY
///
/// Veya Program.cs'in Main'inden direkt PosterFiller.RunAsync(...) çağırılabilir.
/// </summary>
internal static class PosterFiller
{
    private const string SearchUrl = "https://api.themoviedb.org/3/search/movie";
    private const string ImgBase   = "https://image.tmdb.org/t/p/w500";

    public static async Task<int> RunAsync(
        string connStr, string tmdbKey, int? limit = null)
    {
        await using var conn = new MySqlConnection(connStr);
        await conn.OpenAsync();

        // Postersiz filmleri çek
        var sql = @"SELECT Id, Title, ReleaseYear FROM Productions
                    WHERE PosterUrl IS NULL OR PosterUrl = ''
                    ORDER BY Id";
        if (limit.HasValue) sql += $" LIMIT {limit.Value}";

        var missing = new List<(int Id, string Title, int Year)>();
        await using (var cmd = new MySqlCommand(sql, conn))
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
                missing.Add((reader.GetInt32(0), reader.GetString(1), reader.GetInt32(2)));
        }

        Console.WriteLine($"Postersiz film: {missing.Count}");
        if (missing.Count == 0) return 0;

        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };

        int updated = 0, notFound = 0;
        foreach (var (id, title, year) in missing)
        {
            try
            {
                // TMDB arama
                var uri = $"{SearchUrl}?api_key={Uri.EscapeDataString(tmdbKey)}" +
                          $"&query={Uri.EscapeDataString(title)}&year={year}";
                var json = await http.GetFromJsonAsync<TmdbSearchResult>(uri);
                var poster = json?.results?.FirstOrDefault()?.poster_path;

                if (string.IsNullOrEmpty(poster))
                {
                    notFound++;
                    Console.WriteLine($"  ✗ Bulunamadı: {title} ({year})");
                    continue;
                }

                var url = $"{ImgBase}{poster}";
                await using var upd = new MySqlCommand(
                    "UPDATE Productions SET PosterUrl = @u WHERE Id = @id", conn);
                upd.Parameters.AddWithValue("@u", url);
                upd.Parameters.AddWithValue("@id", id);
                await upd.ExecuteNonQueryAsync();
                updated++;

                if (updated % 25 == 0)
                    Console.WriteLine($"  ... {updated} poster eklendi");

                // TMDB rate limit: 50 req / sec - güvenlik için 100ms bekle
                await Task.Delay(100);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ✗ Hata ({title}): {ex.Message}");
                notFound++;
            }
        }

        Console.WriteLine($"\nÖzet: {updated} poster eklendi, {notFound} bulunamadı.");
        return updated;
    }

    private record TmdbSearchResult(List<TmdbMovie>? results);
    private record TmdbMovie(int id, string? title, string? poster_path);
}
