using System.ComponentModel.DataAnnotations;

namespace SahirAPI.DTOs;

public record RegisterDto(
    [Required, MinLength(3), MaxLength(50)] string Username,
    [Required, EmailAddress]                 string Email,
    [Required, MinLength(6), MaxLength(100)] string Password
);

public record LoginDto(
    [Required, EmailAddress]                 string Email,
    [Required]                               string Password
);

public record AuthResponse(string Token, int UserId, string Username, string Role);
