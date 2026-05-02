using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SahirAPI.Data;
using SahirAPI.DTOs;
using SahirAPI.Models;

namespace SahirAPI.Services;

public interface IAuthService
{
    Task<AuthResponse?> RegisterAsync(RegisterDto dto);
    Task<AuthResponse?> LoginAsync(LoginDto dto);
}

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(ApplicationDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterDto dto)
    {
        // E-posta veya kullanıcı adı çakışması
        if (await _db.Users.AnyAsync(u =>
                u.Email == dto.Email || u.Username == dto.Username))
            return null;

        var user = new User
        {
            Username     = dto.Username.Trim(),
            Email        = dto.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role         = UserRole.User
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResponse(GenerateToken(user), user.Id, user.Username, user.Role.ToString());
    }

    public async Task<AuthResponse?> LoginAsync(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user  = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)) return null;

        return new AuthResponse(GenerateToken(user), user.Id, user.Username, user.Role.ToString());
    }

    private string GenerateToken(User user)
    {
        var key      = _config["Jwt:Key"]!;
        var issuer   = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];
        var minutes  = int.Parse(_config["Jwt:ExpireMinutes"] ?? "1440");

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("username", user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
        };

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer:   issuer,
            audience: audience,
            claims:   claims,
            expires:  DateTime.UtcNow.AddMinutes(minutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
