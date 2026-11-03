using TransactionService.Dtos;
using TransactionService.Entities;

namespace TransactionService.Repositories;

public interface ITransactionRepository
{
    Task<(IReadOnlyList<Transaction> Items, int TotalCount)> GetPagedAsync(
        TransactionFilter filter, CancellationToken ct = default);

    Task<Transaction?> GetByIdAsync(int id, CancellationToken ct = default);

    Task AddAsync(Transaction transaction, CancellationToken ct = default);

    void Remove(Transaction transaction);

    Task SaveChangesAsync(CancellationToken ct = default);
}