using System.ComponentModel.DataAnnotations;

namespace SahirAPI.Models;

public enum ProductionType { Movie, TVShow }

public class Production
{
    public int Id { get; set; }

    [Required, MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? OriginalTitle { get; set; }

    public ProductionType Type { get; set; } = ProductionType.Movie;

    public int ReleaseYear { get; set; }
    public int? EndYear { get; set; }
    public int? DurationMin { get; set; }
    public int? SeasonsCount { get; set; }
    public int? EpisodesCount { get; set; }

    public string? Synopsis { get; set; }

    [MaxLength(500)] public string? PosterUrl   { get; set; }
    [MaxLength(500)] public string? BackdropUrl { get; set; }
    [MaxLength(500)] public string? TrailerUrl  { get; set; }
    [MaxLength(255)] public string? Director    { get; set; }
    [MaxLength(100)] public string? Country     { get; set; }
    [MaxLength(50)]  public string? Language    { get; set; }

    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    public int? CreatedById { get; set; }
    public User? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Genre> Genres { get; set; } = new List<Genre>();
    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
