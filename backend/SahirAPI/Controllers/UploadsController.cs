using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SahirAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Editor,Admin")]
[ApiExplorerSettings(IgnoreApi = true)]   // Swagger bu controller'ı yoksaysın
public class UploadsController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private static readonly string[] AllowedExt = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private const long MaxBytes = 5 * 1024 * 1024;   // 5 MB

    public UploadsController(IWebHostEnvironment env) => _env = env;

    [HttpPost("image")]
    [RequestSizeLimit(MaxBytes)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Dosya seçilmedi." });

        if (file.Length > MaxBytes)
            return BadRequest(new { message = "Dosya 5 MB sınırını aşıyor." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExt.Contains(ext))
            return BadRequest(new
            {
                message = $"Geçersiz uzantı. İzin verilenler: {string.Join(", ", AllowedExt)}"
            });

        var webRoot = _env.WebRootPath
            ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var folder = Path.Combine(webRoot, "uploads", "posters");
        Directory.CreateDirectory(folder);

        var safeName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(folder, safeName);

        await using (var stream = System.IO.File.Create(fullPath))
            await file.CopyToAsync(stream);

        var url = $"{Request.Scheme}://{Request.Host}/uploads/posters/{safeName}";
        return Ok(new { url, fileName = safeName, size = file.Length });
    }
}