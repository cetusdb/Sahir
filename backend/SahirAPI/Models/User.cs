using System.ComponentModel.DataAnnotations;

namespace SahirAPI.Models;

public enum UserRole { User, Editor, Admin }

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(150), EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.User;

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    public string? Bio { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Watchlist> Watchlists { get; set; } = new List<Watchlist>();
    public ICollection<WatchHistory> WatchHistory { get; set; } = new List<WatchHistory>();
}
