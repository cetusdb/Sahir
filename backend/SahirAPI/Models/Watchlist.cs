using System.ComponentModel.DataAnnotations;

namespace SahirAPI.Models;

public class Watchlist
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsPublic { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WatchlistItem> Items { get; set; } = new List<WatchlistItem>();
}

public class WatchlistItem
{
    public int Id { get; set; }

    public int WatchlistId { get; set; }
    public Watchlist? Watchlist { get; set; }

    public int ProductionId { get; set; }
    public Production? Production { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}

public class WatchHistory
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int ProductionId { get; set; }
    public Production? Production { get; set; }

    public DateTime WatchedAt { get; set; } = DateTime.UtcNow;
}
