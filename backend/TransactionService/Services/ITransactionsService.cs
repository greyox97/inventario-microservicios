using TransactionService.Dtos;

namespace TransactionService.Services;

public interface ITransactionsService
{
    Task<PagedResult<TransactionResponse>> GetPagedAsync(TransactionFilter filter, CancellationToken ct = default);
    Task<TransactionResponse> GetByIdAsync(int id, CancellationToken ct = default);
}