using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SahirAPI.Data;
using SahirAPI.DTOs;
using SahirAPI.Models;

namespace SahirAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public CategoriesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Categories.AsNoTracking()
            .OrderBy(c => c.ParentId).ThenBy(c => c.Name)
            .ToListAsync();
        return Ok(list);
    }

    /// <summary>Kategori ağacı (parent -> children) yapısında dönüş.</summary>
    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        var all = await _db.Categories.AsNoTracking()
            .OrderBy(c => c.Name).ToListAsync();

        CategoryNodeDto Build(Category c) => new(
            c.Id, c.Name, c.Slug, c.ParentId, c.Description,
            all.Where(x => x.ParentId == c.Id).Select(Build).ToList());

        var roots = all.Where(c => c.ParentId == null).Select(Build).ToList();
        return Ok(roots);
    }

    [HttpPost]
    [Authorize(Roles = "Editor,Admin")]
    public async Task<IActionResult> Create([FromBody] Category input)
    {
        if (string.IsNullOrWhiteSpace(input.Name) || string.IsNullOrWhiteSpace(input.Slug))
            return BadRequest(new { message = "Name ve Slug zorunlu." });

        if (await _db.Categories.AnyAsync(c => c.Slug == input.Slug))
            return Conflict(new { message = "Slug kullanılıyor." });

        _db.Categories.Add(input);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = input.Id }, input);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Categories.FindAsync(id);
        if (c is null) return NotFound();
        _db.Categories.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
