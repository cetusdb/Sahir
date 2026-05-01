using System.ComponentModel.DataAnnotations;

namespace SahirAPI.DTOs;

public record ProductionListItemDto(
    int Id, string Title, string Type, int ReleaseYear,
    string? PosterUrl, double AverageScore, int RatingCount,
    string? CategoryName);

public record ProductionDetailDto(
    int Id, string Title, string? OriginalTitle, string Type,
    int ReleaseYear, int? EndYear, int? DurationMin,
    int? SeasonsCount, int? EpisodesCount,
    string? Synopsis, string? PosterUrl, string? BackdropUrl,
    string? TrailerUrl, string? Director, string? Country, string? Language,
    int? CategoryId, string? CategoryName,
    IEnumerable<string> Genres,
    double AverageScore, int RatingCount);

public record ProductionUpsertDto(
    [Required, MaxLength(255)] string Title,
    string? OriginalTitle,
    [Required] string Type,                    // "Movie" veya "TVShow"
    [Range(1888, 2100)] int ReleaseYear,
    int? EndYear, int? DurationMin,
    int? SeasonsCount, int? EpisodesCount,
    string? Synopsis,
    string? PosterUrl, string? BackdropUrl, string? TrailerUrl,
    string? Director, string? Country, string? Language,
    int? CategoryId,
    List<int>? GenreIds);

public record CategoryNodeDto(
    int Id, string Name, string Slug, int? ParentId,
    string? Description, List<CategoryNodeDto> Children);

public record RatingDto(
    [Required] int ProductionId,
    [Range(1, 10)] byte Score);

public record CommentCreateDto(
    [Required] int ProductionId,
    [Required, MinLength(1), MaxLength(2000)] string Body);

public record CommentDto(
    int Id, int UserId, string Username, string? AvatarUrl,
    int ProductionId, string Body, int LikeCount, DateTime CreatedAt);

public record WatchlistDto(
    int Id, string Name, string? Description, bool IsPublic,
    DateTime CreatedAt, int ItemCount);

public record WatchlistDetailDto(
    int Id, string Name, string? Description, bool IsPublic,
    DateTime CreatedAt, IEnumerable<ProductionListItemDto> Items);

public record WatchlistCreateDto(
    [Required, MaxLength(120)] string Name,
    [MaxLength(500)] string? Description,
    bool IsPublic = true);

public record WatchlistAddItemDto([Required] int WatchlistId, [Required] int ProductionId);
