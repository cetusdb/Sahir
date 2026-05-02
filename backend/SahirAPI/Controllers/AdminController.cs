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
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public AdminController(ApplicationDbContext db) => _db = db;

    /// <summary>Tüm kullanıcıları döner (Admin yetkisi gerekir).</summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? q)
    {
        var query = _db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var s = q.Trim().ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(s) ||
                u.Email.ToLower().Contains(s));
        }

        var list = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserDto(
                u.Id, u.Username, u.Email, u.Role.ToString(),
                u.AvatarUrl, u.CreatedAt,
                u.Ratings.Count, u.Comments.Count, u.Watchlists.Count))
            .ToListAsync();

        return Ok(list);
    }

    /// <summary>Kullanıcının rolünü değiştirir.</summary>
    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, ChangeRoleDto dto)
    {
        if (!Enum.TryParse<UserRole>(dto.Role, out var newRole))
            return BadRequest(new { message = "Geçersiz rol." });

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        // Kendi rolünü düşürmeyi engelle (sistemde admin kalmama riski)
        var currentUserId = CurrentUserId();
        if (user.Id == currentUserId && user.Role == UserRole.Admin && newRole != UserRole.Admin)
        {
            // Başka admin var mı?
            var otherAdminExists = await _db.Users
                .AnyAsync(u => u.Id != id && u.Role == UserRole.Admin);
            if (!otherAdminExists)
                return BadRequest(new
                {
                    message = "Sistemdeki tek admin kendisin; rolünü düşüremezsin."
                });
        }

        user.Role = newRole;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Rol güncellendi.", user.Id, role = user.Role.ToString() });
    }

    /// <summary>Kullanıcıyı tamamen siler (yorumları, puanları, listeleri dahil).</summary>
    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var currentUserId = CurrentUserId();
        if (id == currentUserId)
            return BadRequest(new { message = "Kendi hesabını silemezsin." });

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Tüm yorumları listele (moderasyon için).</summary>
    [HttpGet("comments")]
    public async Task<IActionResult> GetComments(
        [FromQuery] string? q,
        [FromQuery] int? userId,
        [FromQuery] int? productionId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.Comments
            .Include(c => c.User)
            .Include(c => c.Production)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var s = q.Trim().ToLower();
            query = query.Where(c => c.Body.ToLower().Contains(s));
        }
        if (userId.HasValue)       query = query.Where(c => c.UserId == userId);
        if (productionId.HasValue) query = query.Where(c => c.ProductionId == productionId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminCommentDto(
                c.Id,
                c.UserId, c.User!.Username,
                c.ProductionId, c.Production!.Title,
                c.Body, c.LikeCount, c.CreatedAt))
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>Yorumu sil (admin yetkisi).</summary>
    [HttpDelete("comments/{id:int}")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        var c = await _db.Comments.FindAsync(id);
        if (c is null) return NotFound();
        _db.Comments.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>İstatistik özeti - admin dashboard'u için.</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = new
        {
            totalUsers       = await _db.Users.CountAsync(),
            totalAdmins      = await _db.Users.CountAsync(u => u.Role == UserRole.Admin),
            totalEditors     = await _db.Users.CountAsync(u => u.Role == UserRole.Editor),
            totalProductions = await _db.Productions.CountAsync(),
            totalRatings     = await _db.Ratings.CountAsync(),
            totalComments    = await _db.Comments.CountAsync(),
            totalWatchlists  = await _db.Watchlists.CountAsync()
        };
        return Ok(stats);
    }

    private int? CurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}
