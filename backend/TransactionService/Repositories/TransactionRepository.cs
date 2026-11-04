using Microsoft.EntityFrameworkCore;
using TransactionService.Data;
using TransactionService.Dtos;
using TransactionService.Entities;

namespace TransactionService.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly InventoryDbContext _context;

    public TransactionRepository(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<Transaction> Items, int TotalCount)> GetPagedAsync(
        TransactionFilter filter, CancellationToken ct = default)
    {
        IQueryable<Transaction> query = _context.Transactions.AsNoTracking();

        if (filter.Type.HasValue)
            query = query.Where(t => t.TransactionType == filter.Type.Value);

        if (filter.ProductId.HasValue)
            query = query.Where(t => t.ProductId == filter.ProductId.Value);

        if (filter.DateFrom.HasValue)
        {
            var from = filter.DateFrom.Value.UtcDateTime;
            query = query.Where(t => t.TransactionDate >= from);
        }

        if (filter.DateTo.HasValue)
        {
            var to = filter.DateTo.Value.UtcDateTime;
            query = query.Where(t => t.TransactionDate < to);
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.Id)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<Transaction?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id, ct);
    }

    public async Task AddAsync(Transaction transaction, CancellationToken ct = default)
    {
        await _context.Transactions.AddAsync(transaction, ct);
    }

    public void Remove(Transaction transaction)
    {
        _context.Transactions.Remove(transaction);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }
}