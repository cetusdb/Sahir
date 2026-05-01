using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SahirAPI.Data;

namespace SahirAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GenresController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    public GenresController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Genres.AsNoTracking()
            .OrderBy(g => g.Name)
            .Select(g => new { g.Id, g.Name })
            .ToListAsync();
        return Ok(list);
    }
}
