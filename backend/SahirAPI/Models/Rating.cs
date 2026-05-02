using System.ComponentModel.DataAnnotations;

namespace SahirAPI.Models;

public class Rating
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int ProductionId { get; set; }
    public Production? Production { get; set; }

    [Range(1, 10)]
    public byte Score { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
