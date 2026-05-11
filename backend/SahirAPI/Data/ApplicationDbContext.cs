using Microsoft.EntityFrameworkCore;
using SahirAPI.Models;

namespace SahirAPI.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User>           Users          => Set<User>();
    public DbSet<Category>       Categories     => Set<Category>();
    public DbSet<Production>     Productions    => Set<Production>();
    public DbSet<Genre>          Genres         => Set<Genre>();
    public DbSet<Rating>         Ratings        => Set<Rating>();
    public DbSet<Comment>        Comments       => Set<Comment>();
    public DbSet<Watchlist>      Watchlists     => Set<Watchlist>();
    public DbSet<WatchlistItem>  WatchlistItems => Set<WatchlistItem>();
    public DbSet<WatchHistory>   WatchHistory   => Set<WatchHistory>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // ----- User -----
        b.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Role).HasConversion<string>();
        });

        // ----- Category (self ref) -----
        b.Entity<Category>(e =>
        {
            e.ToTable("Categories");
            e.HasIndex(c => c.Slug).IsUnique();
            e.HasOne(c => c.Parent)
             .WithMany(c => c.Children)
             .HasForeignKey(c => c.ParentId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // ----- Production -----
        b.Entity<Production>(e =>
        {
            e.ToTable("Productions");
            e.Property(p => p.Type).HasConversion<string>();

            e.HasOne(p => p.Category)
             .WithMany(c => c.Productions)
             .HasForeignKey(p => p.CategoryId)
             .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(p => p.CreatedBy)
             .WithMany()
             .HasForeignKey(p => p.CreatedById)
             .OnDelete(DeleteBehavior.SetNull);

            // M:N Production - Genre
            // SQL şemasındaki sütun adlarına (ProductionId / GenreId) açıkça bağlıyoruz;
            // aksi halde EF Core "ProductionsId / GenresId" arar.
            e.HasMany(p => p.Genres)
             .WithMany(g => g.Productions)
             .UsingEntity<Dictionary<string, object>>(
                 "ProductionGenres",
                 j => j.HasOne<Genre>().WithMany()
                       .HasForeignKey("GenreId")
                       .OnDelete(DeleteBehavior.Cascade),
                 j => j.HasOne<Production>().WithMany()
                       .HasForeignKey("ProductionId")
                       .OnDelete(DeleteBehavior.Cascade),
                 j =>
                 {
                     j.HasKey("ProductionId", "GenreId");
                     j.ToTable("ProductionGenres");
                 });
        });

        b.Entity<Genre>().ToTable("Genres");

        // ----- Rating -----
        b.Entity<Rating>(e =>
        {
            e.ToTable("Ratings");
            e.HasIndex(r => new { r.UserId, r.ProductionId }).IsUnique();
            e.HasOne(r => r.User)
             .WithMany(u => u.Ratings)
             .HasForeignKey(r => r.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Production)
             .WithMany(p => p.Ratings)
             .HasForeignKey(r => r.ProductionId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ----- Comment -----
        b.Entity<Comment>(e =>
        {
            e.ToTable("Comments");
            e.HasOne(c => c.User)
             .WithMany(u => u.Comments)
             .HasForeignKey(c => c.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.Production)
             .WithMany(p => p.Comments)
             .HasForeignKey(c => c.ProductionId)
             .OnDelete(DeleteBehavior.Cascade);
            // Self-reference: yorum bir başka yoruma cevap olabilir
            e.HasOne(c => c.ParentComment)
             .WithMany(c => c.Replies)
             .HasForeignKey(c => c.ParentCommentId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ----- Watchlist -----
        b.Entity<Watchlist>(e =>
        {
            e.ToTable("Watchlists");
            e.HasOne(w => w.User)
             .WithMany(u => u.Watchlists)
             .HasForeignKey(w => w.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<WatchlistItem>(e =>
        {
            e.ToTable("WatchlistItems");
            e.HasIndex(i => new { i.WatchlistId, i.ProductionId }).IsUnique();
            e.HasOne(i => i.Watchlist)
             .WithMany(w => w.Items)
             .HasForeignKey(i => i.WatchlistId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(i => i.Production)
             .WithMany()
             .HasForeignKey(i => i.ProductionId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ----- WatchHistory -----
        b.Entity<WatchHistory>(e =>
        {
            e.ToTable("WatchHistory");
            e.HasIndex(h => new { h.UserId, h.ProductionId }).IsUnique();
            e.HasOne(h => h.User)
             .WithMany(u => u.WatchHistory)
             .HasForeignKey(h => h.UserId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(h => h.Production)
             .WithMany()
             .HasForeignKey(h => h.ProductionId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
