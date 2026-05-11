using System.ComponentModel.DataAnnotations;

namespace SahirAPI.Models;

public class Comment
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int ProductionId { get; set; }
    public Production? Production { get; set; }

    public int? ParentCommentId { get; set; }
    public Comment? ParentComment { get; set; }
    public ICollection<Comment> Replies { get; set; } = new List<Comment>();

    [Required]
    public string Body { get; set; } = string.Empty;

    public bool IsSpoiler { get; set; } = false;

    public int LikeCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
