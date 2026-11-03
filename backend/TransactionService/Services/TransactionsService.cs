using TransactionService.Clients;
using TransactionService.Dtos;
using TransactionService.Entities;
using TransactionService.Exceptions;
using TransactionService.Repositories;

namespace TransactionService.Services;

public class TransactionsService : ITransactionsService
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IProductsClient _productsClient;

    public TransactionsService(
        ITransactionRepository transactionRepository,
        IProductsClient productsClient)
    {
        _transactionRepository = transactionRepository;
        _productsClient = productsClient;
    }

    public async Task<PagedResult<TransactionResponse>> GetPagedAsync(
        TransactionFilter filter, CancellationToken ct = default)
    {
        if (filter.DateFrom > filter.DateTo)
            throw new BusinessRuleException("La fecha inicial no puede ser posterior a la fecha final.");

        var (items, totalCount) = await _transactionRepository.GetPagedAsync(filter, ct);
        var responses = await ToResponsesAsync(items, ct);

        return new PagedResult<TransactionResponse>(responses, filter.Page, filter.PageSize, totalCount);
    }

    public async Task<TransactionResponse> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var transaction = await _transactionRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"No se encontró la transacción con id {id}.");

        var responses = await ToResponsesAsync([transaction], ct);
        return responses[0];
    }

    private async Task<List<TransactionResponse>> ToResponsesAsync(
        IReadOnlyList<Transaction> transactions, CancellationToken ct)
    {
        var products = await _productsClient.GetByIdsAsync(transactions.Select(t => t.ProductId), ct);

        return transactions.Select(t =>
        {
            products.TryGetValue(t.ProductId, out var product);

            return new TransactionResponse(
                t.Id,
                t.TransactionDate,
                t.TransactionType,
                t.ProductId,
                product?.Name ?? "Producto desconocido",
                product?.Stock,
                t.Quantity,
                t.UnitPrice,
                t.TotalPrice,
                t.Detail);
        }).ToList();
    }
}