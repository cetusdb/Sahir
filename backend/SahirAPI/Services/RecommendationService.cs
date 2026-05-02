using Microsoft.EntityFrameworkCore;
using SahirAPI.Data;
using SahirAPI.DTOs;

namespace SahirAPI.Services;

public interface IRecommendationService
{
    Task<IEnumerable<ProductionListItemDto>> GetForUserAsync(int userId, int take = 12);
}

/// <summary>
/// Basit ama gerçek bir öneri motoru:
///   1) Kullanıcının izleme geçmişi + yüksek puanladığı yapımları analiz eder.
///   2) Bu yapımların türlerine ağırlık verir (yüksek puan = daha çok ağırlık).
///   3) Henüz izlenmemiş yapımları, tür eşleşmesi + ortalama puana göre skorlar.
///   4) En yüksek skorlu yapımları döner.
///
/// Bu, klasik "content-based filtering" yaklaşımının kompakt bir gerçeklenmesidir.
/// </summary>
public class RecommendationService : IRecommendationService
{
    private readonly ApplicationDbContext _db;
    public RecommendationService(ApplicationDbContext db) => _db = db;

    public async Task<IEnumerable<ProductionListItemDto>> GetForUserAsync(int userId, int take = 12)
    {
        // ---- 1) Kullanıcı sinyalleri: izleme geçmişi + puanları ----
        var watchedIds = await _db.WatchHistory.AsNoTracking()
            .Where(h => h.UserId == userId)
            .Select(h => h.ProductionId).ToListAsync();

        var ratings = await _db.Ratings.AsNoTracking()
            .Where(r => r.UserId == userId)
            .Select(r => new { r.ProductionId, r.Score }).ToListAsync();

        var seenIds = watchedIds
            .Concat(ratings.Select(r => r.ProductionId))
            .Distinct().ToList();

        // Yeni kullanıcı: izleme/puanlama yok → en popüler yapımları döndür (cold start).
        if (seenIds.Count == 0)
        {
            return await _db.Productions.AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Ratings)
                .OrderByDescending(p => p.Ratings.Count)
                .Take(take)
                .Select(p => new ProductionListItemDto(
                    p.Id, p.Title, p.Type.ToString(), p.ReleaseYear, p.PosterUrl,
                    p.Ratings.Any() ? Math.Round(p.Ratings.Average(r => (double)r.Score), 1) : 0,
                    p.Ratings.Count,
                    p.Category != null ? p.Category.Name : null))
                .ToListAsync();
        }

        // ---- 2) Tür ağırlıklarını hesapla ----
        var seenWithGenres = await _db.Productions.AsNoTracking()
            .Include(p => p.Genres)
            .Where(p => seenIds.Contains(p.Id))
            .Select(p => new { p.Id, GenreIds = p.Genres.Select(g => g.Id).ToList() })
            .ToListAsync();

        var ratingMap = ratings.ToDictionary(r => r.ProductionId, r => (double)r.Score);

        var genreWeights = new Dictionary<int, double>();
        foreach (var item in seenWithGenres)
        {
            // Puanlanmadıysa nötr ağırlık (5.0/10), yoksa kullanıcının verdiği puan
            var w = ratingMap.TryGetValue(item.Id, out var s) ? s : 5.0;
            // Yüksek puanlar (7+) öne çıksın, düşük puanlar negatif sinyal versin
            var contribution = (w - 5.0) / 5.0;   // -0.8 .. +1.0
            foreach (var gid in item.GenreIds)
            {
                if (!genreWeights.ContainsKey(gid)) genreWeights[gid] = 0;
                genreWeights[gid] += contribution;
            }
        }

        // ---- 3) Aday yapımlar: kullanıcının izlemediği/puanlamadığı tüm yapımlar ----
        var candidates = await _db.Productions.AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Ratings)
            .Include(p => p.Genres)
            .Where(p => !seenIds.Contains(p.Id))
            .ToListAsync();

        // ---- 4) Skorlama ----
        var scored = candidates
            .Select(p =>
            {
                var avg = p.Ratings.Count > 0
                    ? p.Ratings.Average(r => (double)r.Score) : 0;
                var ratingCount = p.Ratings.Count;

                double genreScore = 0;
                foreach (var g in p.Genres)
                    if (genreWeights.TryGetValue(g.Id, out var w)) genreScore += w;

                // Bayes-benzeri yumuşatma: az oylu yapımlar globalin etkisinde kalsın
                const double C = 5.0;        // küçük yumuşatma sabiti
                const double m = 6.5;        // varsayılan global ortalama
                var smoothedAvg = (C * m + avg * ratingCount) / (C + ratingCount);

                // Birleşik skor: tür eşleşmesi + kalite
                var finalScore = (genreScore * 1.5) + smoothedAvg;

                return new { Production = p, Score = finalScore, Avg = avg, ratingCount };
            })
            .OrderByDescending(x => x.Score)
            .Take(take)
            .Select(x => new ProductionListItemDto(
                x.Production.Id, x.Production.Title, x.Production.Type.ToString(),
                x.Production.ReleaseYear, x.Production.PosterUrl,
                Math.Round(x.Avg, 1), x.ratingCount,
                x.Production.Category?.Name))
            .ToList();

        return scored;
    }
}
