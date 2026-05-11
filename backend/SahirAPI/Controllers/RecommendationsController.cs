using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SahirAPI.Data;
using SahirAPI.DTOs;
using SahirAPI.Services;

namespace SahirAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecommendationsController : ControllerBase
{
    private readonly IRecommendationService _svc;
    private readonly IGeminiService          _gemini;
    private readonly ApplicationDbContext    _db;

    public RecommendationsController(
        IRecommendationService svc, IGeminiService gemini, ApplicationDbContext db)
    {
        _svc    = svc;
        _gemini = gemini;
        _db     = db;
    }

    /// <summary>İçerik tabanlı (klasik) öneri — local algorithm.</summary>
    [HttpGet]
    public async Task<IActionResult> GetForMe([FromQuery] int take = 12)
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(sub, out var userId)) return Unauthorized();
        var items = await _svc.GetForUserAsync(userId, take);
        return Ok(items);
    }

    /// <summary>
    /// Gemini AI tabanlı öneri.
    /// - Kullanıcının geçmişi varsa: izleme geçmişi + puanları ile prompt hazırlar.
    /// - Geçmişi yoksa (cold start): body'de tercih bilgisi (AIPreferencesDto) bekler.
    /// </summary>
    [HttpPost("ai")]
    public async Task<IActionResult> GetAIRecommendations(
        [FromBody] AIPreferencesDto? prefs,
        [FromQuery] int take = 12)
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(sub, out var userId)) return Unauthorized();

        // Kullanıcının verisi var mı?
        var hasHistory    = await _db.WatchHistory.AnyAsync(h => h.UserId == userId);
        var hasRatings    = await _db.Ratings    .AnyAsync(r => r.UserId == userId);
        var hasWatchlists = await _db.Watchlists .AnyAsync(w => w.UserId == userId);
        var coldStart     = !hasHistory && !hasRatings && !hasWatchlists;

        // Tercih bilgisi gönderilmiş mi (kullanıcı formla gönderdi mi)
        var hasPrefs = prefs is not null && (
            (prefs.Genres is { Count: > 0 }) ||
            !string.IsNullOrWhiteSpace(prefs.Mood) ||
            !string.IsNullOrWhiteSpace(prefs.Era));

        // Soğuk başlangıçta VE prefs gönderilmemişse formu iste
        if (coldStart && !hasPrefs)
        {
            return Ok(new
            {
                requiresPreferences = true,
                message = "Geçmişin olmadığı için tercihlerini sormamız gerek."
            });
        }

        // Kullanıcı bağlamını oluştur:
        //   - prefs varsa onu kullan (kullanıcı her oturumda farklı seçim yapabilsin)
        //   - yoksa izleme geçmişine bak
        string userContext;
        if (hasPrefs)
        {
            var sb = new System.Text.StringBuilder();
            if (prefs!.Genres is { Count: > 0 })
                sb.AppendLine($"Sevdiği türler: {string.Join(", ", prefs.Genres)}");
            if (!string.IsNullOrWhiteSpace(prefs.Mood))
                sb.AppendLine($"Ruh hali: {prefs.Mood}");
            if (!string.IsNullOrWhiteSpace(prefs.Era))
                sb.AppendLine($"Yapım dönemi tercihi: {prefs.Era}");
            userContext = sb.ToString();
        }
        else
        {
            // İzleme geçmişi + yüksek puanlı yapımlar
            var watched = await _db.WatchHistory.AsNoTracking()
                .Where(h => h.UserId == userId)
                .Include(h => h.Production).ThenInclude(p => p!.Genres)
                .OrderByDescending(h => h.WatchedAt)
                .Take(15)
                .Select(h => new
                {
                    h.Production!.Title,
                    h.Production.ReleaseYear,
                    Genres = h.Production.Genres.Select(g => g.Name).ToList()
                })
                .ToListAsync();

            var topRated = await _db.Ratings.AsNoTracking()
                .Where(r => r.UserId == userId && r.Score >= 7)
                .Include(r => r.Production).ThenInclude(p => p!.Genres)
                .OrderByDescending(r => r.Score)
                .Take(10)
                .Select(r => new
                {
                    r.Production!.Title,
                    r.Score,
                    Genres = r.Production.Genres.Select(g => g.Name).ToList()
                })
                .ToListAsync();

            var sb = new System.Text.StringBuilder();
            if (watched.Count > 0)
            {
                sb.AppendLine("Son izlediği yapımlar:");
                foreach (var w in watched)
                    sb.AppendLine($"- {w.Title} ({w.ReleaseYear}) [{string.Join(", ", w.Genres)}]");
            }
            if (topRated.Count > 0)
            {
                sb.AppendLine("Yüksek puan verdikleri:");
                foreach (var r in topRated)
                    sb.AppendLine($"- {r.Title} ({r.Score}/10) [{string.Join(", ", r.Genres)}]");
            }
            userContext = sb.ToString();
        }

        // Aday yapımlar — kullanıcının izlemediği popüler 150 film
        var seenIds = await _db.WatchHistory.AsNoTracking()
            .Where(h => h.UserId == userId)
            .Select(h => h.ProductionId)
            .ToListAsync();

        var candidates = await _db.Productions.AsNoTracking()
            .Include(p => p.Genres)
            .Include(p => p.Ratings)
            .Where(p => !seenIds.Contains(p.Id))
            .OrderByDescending(p => p.Ratings.Count)
            .Take(150)
            .Select(p => new
            {
                p.Id, p.Title, p.ReleaseYear,
                Genres = p.Genres.Select(g => g.Name).ToList(),
                Avg = p.Ratings.Any() ? p.Ratings.Average(r => (double)r.Score) : 0
            })
            .ToListAsync();

        if (candidates.Count == 0)
            return Ok(new AIRecommendationResultDto(
                Enumerable.Empty<ProductionListItemDto>(),
                "Önerilebilecek yapım kalmadı.", coldStart));

        var catalog = string.Join("\n", candidates.Select(c =>
            $"{c.Id}: {c.Title} ({c.ReleaseYear}) [{string.Join(", ", c.Genres)}] ★{c.Avg:0.0}"));

        var prompt = $@"
Sen bir film/dizi öneri uzmanısın. Görevin: kullanıcıya en uygun {take} yapımı seçmek.

KESİN KURAL: Cevabın SADECE aşağıdaki JSON olmalı. Markdown kod bloğu (```), ön yazı, son yazı, ek açıklama YASAK. Sadece açılış {{ ile başla, kapanış }} ile bitir.

ŞEMA:
{{""ids"":[int,int,...],""reason"":""Türkçe en fazla 2 cümle""}}

KULLANICI:
{userContext}

KATALOG (id: başlık (yıl) [türler] ★puan):
{catalog}

Kurallar:
- Sadece kataloğdaki id'leri kullan, uydurma
- Tam {take} id ver
- reason Türkçe ve kullanıcının zevkine atıfta bulunsun
".Trim();

        string aiText;
        try { aiText = await _gemini.GenerateAsync(prompt); }
        catch (Exception ex)
        {
            return StatusCode(502, new
            {
                message = "Gemini API çağrısı başarısız.",
                detail  = ex.Message
            });
        }

        // Debug için log'a yaz — backend terminalinde görünür
        Console.WriteLine("===== GEMINI RAW RESPONSE =====");
        Console.WriteLine(aiText);
        Console.WriteLine("===============================");

        // Markdown kod bloklarını temizle (```json ... ``` veya ``` ... ```)
        var cleaned = Regex.Replace(aiText, @"```(?:json)?\s*", "", RegexOptions.IgnoreCase);
        cleaned = cleaned.Replace("```", "").Trim();

        AIResult? parsed = null;

        // 1. Yol: Düzgün JSON parse
        var match = Regex.Match(cleaned, @"\{[\s\S]*\}", RegexOptions.Singleline);
        if (match.Success)
        {
            try
            {
                parsed = JsonSerializer.Deserialize<AIResult>(match.Value, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    AllowTrailingCommas = true,
                    ReadCommentHandling = JsonCommentHandling.Skip
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Gemini] Tam JSON parse hatası: {ex.Message}");
            }
        }

        // 2. Yol (fallback): Cevap kesilmiş olabilir. Sadece ids dizisini regex ile çek.
        if (parsed?.ids is null || parsed.ids.Count == 0)
        {
            var idsMatch = Regex.Match(cleaned, @"""ids""\s*:\s*\[([\d,\s]+)\]");
            if (idsMatch.Success)
            {
                var ids = idsMatch.Groups[1].Value
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(s => int.TryParse(s, out var n) ? n : (int?)null)
                    .Where(n => n.HasValue).Select(n => n!.Value).ToList();

                var reasonMatch = Regex.Match(cleaned, @"""reason""\s*:\s*""([^""]*)");
                var reason = reasonMatch.Success ? reasonMatch.Groups[1].Value : null;

                if (ids.Count > 0)
                {
                    Console.WriteLine($"[Gemini] Fallback parse: {ids.Count} id kurtarıldı.");
                    parsed = new AIResult(ids, reason);
                }
            }
        }

        if (parsed is null)
        {
            Console.WriteLine("[Gemini] Hiçbir parse yöntemi çalışmadı.");
            return StatusCode(502, new { message = "AI cevabı işlenemedi.", aiText });
        }

        if (parsed?.ids is null || parsed.ids.Count == 0)
            return Ok(new AIRecommendationResultDto(
                Enumerable.Empty<ProductionListItemDto>(),
                "AI uygun film bulamadı.", coldStart));

        // ID'leri DB'den getir, sırayı koru
        var dict = await _db.Productions.AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Ratings)
            .Where(p => parsed.ids.Contains(p.Id))
            .Select(p => new ProductionListItemDto(
                p.Id, p.Title, p.Type.ToString(), p.ReleaseYear, p.PosterUrl,
                p.Ratings.Any() ? Math.Round(p.Ratings.Average(r => (double)r.Score), 1) : 0,
                p.Ratings.Count,
                p.Category != null ? p.Category.Name : null))
            .ToListAsync();

        var byId   = dict.ToDictionary(x => x.Id);
        var sorted = parsed.ids.Where(id => byId.ContainsKey(id))
                               .Select(id => byId[id]).ToList();

        return Ok(new AIRecommendationResultDto(sorted, parsed.reason, coldStart));
    }

    private record AIResult(List<int> ids, string? reason);
}
