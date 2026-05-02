using Microsoft.AspNetCore.Mvc;
using SahirAPI.DTOs;
using SahirAPI.Services;

namespace SahirAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var result = await _auth.RegisterAsync(dto);
        if (result is null)
            return Conflict(new { message = "E-posta veya kullanıcı adı zaten kayıtlı." });
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await _auth.LoginAsync(dto);
        if (result is null)
            return Unauthorized(new { message = "Geçersiz kimlik bilgileri." });
        return Ok(result);
    }
}
