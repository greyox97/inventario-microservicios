using TransactionService.Dtos;

namespace TransactionService.Services;

public interface ITransactionsService
{
    Task<PagedResult<TransactionResponse>> GetPagedAsync(TransactionFilter filter, CancellationToken ct = default);
    Task<TransactionResponse> GetByIdAsync(int id, CancellationToken ct = default);
    Task<TransactionResponse> CreateAsync(CreateTransactionRequest request, CancellationToken ct = default);
    Task<TransactionResponse> UpdateAsync(int id, UpdateTransactionRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}