using System.ComponentModel.DataAnnotations;

namespace SahirAPI.Models;

public class Genre
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    public ICollection<Production> Productions { get; set; } = new List<Production>();
}
