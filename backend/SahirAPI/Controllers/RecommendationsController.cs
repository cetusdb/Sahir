using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SahirAPI.Services;

namespace SahirAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RecommendationsController : ControllerBase
{
    private readonly IRecommendationService _svc;
    public RecommendationsController(IRecommendationService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetForMe([FromQuery] int take = 12)
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(sub, out var userId)) return Unauthorized();

        var items = await _svc.GetForUserAsync(userId, take);
        return Ok(items);
    }
}
