using System.ComponentModel.DataAnnotations;

namespace SahirAPI.DTOs;

public record AdminUserDto(
    int Id,
    string Username,
    string Email,
    string Role,
    string? AvatarUrl,
    DateTime CreatedAt,
    int RatingCount,
    int CommentCount,
    int WatchlistCount);

public record ChangeRoleDto(
    [Required, RegularExpression("^(User|Editor|Admin)$")]
    string Role);

public record AdminCommentDto(
    int Id,
    int UserId, string Username,
    int ProductionId, string ProductionTitle,
    string Body,
    int LikeCount,
    DateTime CreatedAt);
