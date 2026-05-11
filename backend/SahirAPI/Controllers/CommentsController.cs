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
public class CommentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public CommentsController(ApplicationDbContext db) => _db = db;

    /// <summary>Bir yapımın yorumlarını döner (en yeniden eskiye).</summary>
    [HttpGet("{productionId:int}")]
    public async Task<IActionResult> GetForProduction(int productionId)
    {
        var list = await _db.Comments.AsNoTracking()
            .Include(c => c.User)
            .Where(c => c.ProductionId == productionId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CommentDto(
                c.Id, c.UserId, c.User!.Username, c.User.AvatarUrl,
                c.ProductionId, c.ParentCommentId,
                c.Body, c.IsSpoiler, c.LikeCount, c.CreatedAt))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(CommentCreateDto dto)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        // Token geçerli ama kullanıcı DB'de yoksa (ör. DB resetlendiyse) — 401 dön
        if (!await _db.Users.AnyAsync(u => u.Id == userId))
            return Unauthorized(new { message = "Hesap bulunamadı, lütfen yeniden giriş yapın." });

        if (!await _db.Productions.AnyAsync(p => p.Id == dto.ProductionId))
            return NotFound(new { message = "Yapım bulunamadı." });

        // Parent kontrolü: cevap veriliyorsa parent aynı yapımda olmalı
        if (dto.ParentCommentId.HasValue)
        {
            var parent = await _db.Comments.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == dto.ParentCommentId.Value);
            if (parent is null)
                return NotFound(new { message = "Yanıtlanacak yorum bulunamadı." });
            if (parent.ProductionId != dto.ProductionId)
                return BadRequest(new { message = "Yanıtlanan yorum farklı bir yapıma ait." });
        }

        var c = new Comment
        {
            UserId = userId.Value,
            ProductionId = dto.ProductionId,
            ParentCommentId = dto.ParentCommentId,
            Body = dto.Body.Trim(),
            IsSpoiler = dto.IsSpoiler
        };
        _db.Comments.Add(c);
        await _db.SaveChangesAsync();

        var u = await _db.Users.FindAsync(userId.Value);
        return Ok(new CommentDto(
            c.Id, c.UserId, u!.Username, u.AvatarUrl,
            c.ProductionId, c.ParentCommentId,
            c.Body, c.IsSpoiler, c.LikeCount, c.CreatedAt));
    }

    [HttpPost("{id:int}/like")]
    [Authorize]
    public async Task<IActionResult> Like(int id)
    {
        var c = await _db.Comments.FindAsync(id);
        if (c is null) return NotFound();
        c.LikeCount += 1;
        await _db.SaveChangesAsync();
        return Ok(new { c.Id, c.LikeCount });
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var c = await _db.Comments.FindAsync(id);
        if (c is null) return NotFound();

        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (c.UserId != userId && role != "Admin") return Forbid();

        _db.Comments.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private int? CurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}
