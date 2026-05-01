using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SahirAPI.Data;
using SahirAPI.DTOs;
using SahirAPI.Models;

namespace SahirAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductionsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public ProductionsController(ApplicationDbContext db) => _db = db;

    /// <summary>
    /// Filtreleme ve arama destekleyen liste endpoint'i.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? type,           // Movie | TVShow
        [FromQuery] int? categoryId,
        [FromQuery] int? year,
        [FromQuery] string? sort = "popular", // popular | newest | rating
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24)
    {
        var query = _db.Productions
            .Include(p => p.Category)
            .Include(p => p.Ratings)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var s = q.Trim().ToLower();
            query = query.Where(p =>
                p.Title.ToLower().Contains(s) ||
                (p.OriginalTitle != null && p.OriginalTitle.ToLower().Contains(s)) ||
                (p.Synopsis      != null && p.Synopsis.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(type) &&
            Enum.TryParse<ProductionType>(type, true, out var pt))
            query = query.Where(p => p.Type == pt);

        if (categoryId.HasValue)
        {
            // Kategori ağacında torunları da dahil et
            var ids = await GetCategoryAndDescendantsAsync(categoryId.Value);
            query = query.Where(p => p.CategoryId.HasValue && ids.Contains(p.CategoryId.Value));
        }

        if (year.HasValue)
            query = query.Where(p => p.ReleaseYear == year.Value);

        query = sort switch
        {
            "newest" => query.OrderByDescending(p => p.ReleaseYear),
            "rating" => query.OrderByDescending(p =>
                p.Ratings.Any() ? p.Ratings.Average(r => (double)r.Score) : 0),
            _        => query.OrderByDescending(p => p.Ratings.Count)
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductionListItemDto(
                p.Id, p.Title, p.Type.ToString(), p.ReleaseYear, p.PosterUrl,
                p.Ratings.Any() ? Math.Round(p.Ratings.Average(r => (double)r.Score), 1) : 0,
                p.Ratings.Count,
                p.Category != null ? p.Category.Name : null))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Productions
            .Include(x => x.Category)
            .Include(x => x.Genres)
            .Include(x => x.Ratings)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p is null) return NotFound();

        var dto = new ProductionDetailDto(
            p.Id, p.Title, p.OriginalTitle, p.Type.ToString(),
            p.ReleaseYear, p.EndYear, p.DurationMin,
            p.SeasonsCount, p.EpisodesCount,
            p.Synopsis, p.PosterUrl, p.BackdropUrl,
            p.TrailerUrl, p.Director, p.Country, p.Language,
            p.CategoryId, p.Category?.Name,
            p.Genres.Select(g => g.Name),
            p.Ratings.Any() ? Math.Round(p.Ratings.Average(r => (double)r.Score), 1) : 0,
            p.Ratings.Count);

        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> Create(ProductionUpsertDto dto)
    {
        if (!Enum.TryParse<ProductionType>(dto.Type, true, out var ptype))
            return BadRequest(new { message = "Type 'Movie' veya 'TVShow' olmalı." });

        var prod = new Production
        {
            Title = dto.Title, OriginalTitle = dto.OriginalTitle, Type = ptype,
            ReleaseYear = dto.ReleaseYear, EndYear = dto.EndYear,
            DurationMin = dto.DurationMin,
            SeasonsCount = dto.SeasonsCount, EpisodesCount = dto.EpisodesCount,
            Synopsis = dto.Synopsis,
            PosterUrl = dto.PosterUrl, BackdropUrl = dto.BackdropUrl,
            TrailerUrl = dto.TrailerUrl,
            Director = dto.Director, Country = dto.Country, Language = dto.Language,
            CategoryId = dto.CategoryId,
            CreatedById = CurrentUserId()
        };

        if (dto.GenreIds is { Count: > 0 })
        {
            var genres = await _db.Genres.Where(g => dto.GenreIds.Contains(g.Id)).ToListAsync();
            foreach (var g in genres) prod.Genres.Add(g);
        }

        _db.Productions.Add(prod);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = prod.Id }, new { id = prod.Id });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> Update(int id, ProductionUpsertDto dto)
    {
        var p = await _db.Productions.Include(x => x.Genres)
                                     .FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound();

        if (!Enum.TryParse<ProductionType>(dto.Type, true, out var ptype))
            return BadRequest(new { message = "Type 'Movie' veya 'TVShow' olmalı." });

        p.Title = dto.Title; p.OriginalTitle = dto.OriginalTitle; p.Type = ptype;
        p.ReleaseYear = dto.ReleaseYear; p.EndYear = dto.EndYear;
        p.DurationMin = dto.DurationMin;
        p.SeasonsCount = dto.SeasonsCount; p.EpisodesCount = dto.EpisodesCount;
        p.Synopsis = dto.Synopsis;
        p.PosterUrl = dto.PosterUrl; p.BackdropUrl = dto.BackdropUrl;
        p.TrailerUrl = dto.TrailerUrl;
        p.Director = dto.Director; p.Country = dto.Country; p.Language = dto.Language;
        p.CategoryId = dto.CategoryId;
        p.UpdatedAt = DateTime.UtcNow;

        p.Genres.Clear();
        if (dto.GenreIds is { Count: > 0 })
        {
            var genres = await _db.Genres.Where(g => dto.GenreIds.Contains(g.Id)).ToListAsync();
            foreach (var g in genres) p.Genres.Add(g);
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _db.Productions.FindAsync(id);
        if (p is null) return NotFound();
        _db.Productions.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ---------- yardımcılar ----------
    private async Task<List<int>> GetCategoryAndDescendantsAsync(int rootId)
    {
        var all = await _db.Categories.AsNoTracking()
            .Select(c => new { c.Id, c.ParentId }).ToListAsync();
        var result = new List<int> { rootId };
        var queue  = new Queue<int>();
        queue.Enqueue(rootId);
        while (queue.Count > 0)
        {
            var cur = queue.Dequeue();
            foreach (var ch in all.Where(c => c.ParentId == cur))
            {
                result.Add(ch.Id);
                queue.Enqueue(ch.Id);
            }
        }
        return result;
    }

    private int? CurrentUserId()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}
