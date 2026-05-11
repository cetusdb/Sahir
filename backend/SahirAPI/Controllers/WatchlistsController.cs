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
public class WatchlistsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public WatchlistsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var lists = await _db.Watchlists.AsNoTracking()
            .Where(w => w.UserId == userId)
            .Select(w => new WatchlistDto(
                w.Id, w.Name, w.Description, w.IsPublic, w.CreatedAt, w.Items.Count))
            .ToListAsync();
        return Ok(lists);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var w = await _db.Watchlists.AsNoTracking()
            .Include(x => x.Items).ThenInclude(i => i.Production)
                .ThenInclude(p => p!.Category)
            .Include(x => x.Items).ThenInclude(i => i.Production)
                .ThenInclude(p => p!.Ratings)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (w is null) return NotFound();

        var userId = CurrentUserId();
        if (!w.IsPublic && w.UserId != userId) return Forbid();

        var dto = new WatchlistDetailDto(
            w.Id, w.Name, w.Description, w.IsPublic, w.CreatedAt,
            w.Items.Select(i => new ProductionListItemDto(
                i.Production!.Id, i.Production.Title, i.Production.Type.ToString(),
                i.Production.ReleaseYear, i.Production.PosterUrl,
                i.Production.Ratings.Any()
                    ? Math.Round(i.Production.Ratings.Average(r => (double)r.Score), 1) : 0,
                i.Production.Ratings.Count,
                i.Production.Category?.Name)));
        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create(WatchlistCreateDto dto)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        if (!await _db.Users.AnyAsync(u => u.Id == userId))
            return Unauthorized(new { message = "Hesap bulunamadı, lütfen yeniden giriş yapın." });

        var w = new Watchlist
        {
            UserId = userId.Value,
            Name = dto.Name.Trim(),
            Description = dto.Description,
            IsPublic = dto.IsPublic
        };
        _db.Watchlists.Add(w);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = w.Id },
            new WatchlistDto(w.Id, w.Name, w.Description, w.IsPublic, w.CreatedAt, 0));
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem(WatchlistAddItemDto dto)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var w = await _db.Watchlists.FindAsync(dto.WatchlistId);
        if (w is null) return NotFound(new { message = "Liste bulunamadı." });
        if (w.UserId != userId) return Forbid();

        if (!await _db.Productions.AnyAsync(p => p.Id == dto.ProductionId))
            return NotFound(new { message = "Yapım bulunamadı." });

        if (await _db.WatchlistItems.AnyAsync(i =>
                i.WatchlistId == dto.WatchlistId && i.ProductionId == dto.ProductionId))
            return Conflict(new { message = "Bu yapım zaten listede." });

        _db.WatchlistItems.Add(new WatchlistItem
        {
            WatchlistId = dto.WatchlistId,
            ProductionId = dto.ProductionId
        });
        await _db.SaveChangesAsync();
        return Ok(new { message = "Eklendi." });
    }

    [HttpDelete("{watchlistId:int}/items/{productionId:int}")]
    public async Task<IActionResult> RemoveItem(int watchlistId, int productionId)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var w = await _db.Watchlists.FindAsync(watchlistId);
        if (w is null) return NotFound();
        if (w.UserId != userId) return Forbid();

        var item = await _db.WatchlistItems.FirstOrDefaultAsync(i =>
            i.WatchlistId == watchlistId && i.ProductionId == productionId);
        if (item is null) return NotFound();

        _db.WatchlistItems.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var w = await _db.Watchlists.FindAsync(id);
        if (w is null) return NotFound();
        if (w.UserId != userId) return Forbid();

        _db.Watchlists.Remove(w);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Kullanıcının izlediği yapımları döner (en son izlenen üstte).</summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var items = await _db.WatchHistory.AsNoTracking()
            .Where(h => h.UserId == userId)
            .Include(h => h.Production!).ThenInclude(p => p.Category)
            .Include(h => h.Production!).ThenInclude(p => p.Ratings)
            .OrderByDescending(h => h.WatchedAt)
            .Select(h => new
            {
                production = new ProductionListItemDto(
                    h.Production!.Id, h.Production.Title, h.Production.Type.ToString(),
                    h.Production.ReleaseYear, h.Production.PosterUrl,
                    h.Production.Ratings.Any()
                        ? Math.Round(h.Production.Ratings.Average(r => (double)r.Score), 1) : 0,
                    h.Production.Ratings.Count,
                    h.Production.Category != null ? h.Production.Category.Name : null),
                watchedAt = h.WatchedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    /// <summary>İzlediklerinden bir yapımı çıkar.</summary>
    [HttpDelete("history/{productionId:int}")]
    public async Task<IActionResult> RemoveFromHistory(int productionId)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var entry = await _db.WatchHistory.FirstOrDefaultAsync(h =>
            h.UserId == userId && h.ProductionId == productionId);
        if (entry is null) return NotFound();

        _db.WatchHistory.Remove(entry);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>İzleme geçmişine yapım ekle (öneri motoru girdisi).</summary>
    [HttpPost("history/{productionId:int}")]
    public async Task<IActionResult> MarkAsWatched(int productionId)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        if (!await _db.Productions.AnyAsync(p => p.Id == productionId))
            return NotFound();

        var exists = await _db.WatchHistory.AnyAsync(h =>
            h.UserId == userId && h.ProductionId == productionId);
        if (!exists)
        {
            _db.WatchHistory.Add(new WatchHistory
            {
                UserId = userId.Value,
                ProductionId = productionId
            });
            await _db.SaveChangesAsync();
        }
        return Ok(new { message = "İzlendi olarak işaretlendi." });
    }

    private int? CurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}