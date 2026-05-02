using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SahirAPI.Data;
using SahirAPI.DTOs;
using SahirAPI.Models;

namespace SahirAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RatingsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public RatingsController(ApplicationDbContext db) => _db = db;

    /// <summary>Yapımı puanla / puanı güncelle (upsert).</summary>
    [HttpPost]
    public async Task<IActionResult> Upsert(RatingDto dto)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        // Token geçerli ama kullanıcı DB'de yoksa (ör. DB resetlendiyse) — 401 dön
        if (!await _db.Users.AnyAsync(u => u.Id == userId))
            return Unauthorized(new { message = "Hesap bulunamadı, lütfen yeniden giriş yapın." });

        var prodExists = await _db.Productions.AnyAsync(p => p.Id == dto.ProductionId);
        if (!prodExists) return NotFound(new { message = "Yapım bulunamadı." });

        var existing = await _db.Ratings.FirstOrDefaultAsync(r =>
            r.UserId == userId && r.ProductionId == dto.ProductionId);

        if (existing is null)
        {
            _db.Ratings.Add(new Rating
            {
                UserId = userId.Value,
                ProductionId = dto.ProductionId,
                Score = dto.Score
            });
        }
        else
        {
            existing.Score = dto.Score;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "Puan kaydedildi.", dto.Score });
    }

    [HttpGet("me/{productionId:int}")]
    public async Task<IActionResult> GetMyRating(int productionId)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var r = await _db.Ratings.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && x.ProductionId == productionId);
        return Ok(new { score = r?.Score });
    }

    [HttpDelete("{productionId:int}")]
    public async Task<IActionResult> Remove(int productionId)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var r = await _db.Ratings.FirstOrDefaultAsync(x =>
            x.UserId == userId && x.ProductionId == productionId);
        if (r is null) return NotFound();
        _db.Ratings.Remove(r);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private int? CurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}
