using Microsoft.EntityFrameworkCore;
using TransactionService.Entities;

namespace TransactionService.Data;

public class InventoryDbContext : DbContext
{
    public InventoryDbContext(DbContextOptions<InventoryDbContext> options)
        : base(options)
    {
    }

    public DbSet<Transaction> Transactions => Set<Transaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("Transactions");
            entity.HasKey(t => t.Id);

            entity.Property(t => t.TransactionDate)
                .HasColumnType("datetime2(0)")
                .HasConversion(
                    v => v,
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.Property(t => t.TransactionType)
                .IsRequired()
                .HasMaxLength(10)
                .HasConversion(
                    v => v.ToString().ToUpperInvariant(),
                    v => Enum.Parse<TransactionType>(v, true));

            entity.Property(t => t.UnitPrice).HasPrecision(18, 2);
            entity.Property(t => t.TotalPrice).HasPrecision(18, 2);
            entity.Property(t => t.Detail).HasMaxLength(500);
        });
    }
}