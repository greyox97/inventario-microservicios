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
    private readonly ILogger<TransactionsService> _logger;

    public TransactionsService(
        ITransactionRepository transactionRepository,
        IProductsClient productsClient,
        ILogger<TransactionsService> logger)
    {
        _transactionRepository = transactionRepository;
        _productsClient = productsClient;
        _logger = logger;
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
        var transaction = await GetExistingAsync(id, ct);
        var responses = await ToResponsesAsync([transaction], ct);

        return responses[0];
    }

    public async Task<TransactionResponse> CreateAsync(
        CreateTransactionRequest request, CancellationToken ct = default)
    {
        var type = request.TransactionType!.Value;

        var product = await _productsClient.GetByIdAsync(request.ProductId, ct)
            ?? throw new NotFoundException("El producto seleccionado no existe o fue eliminado.");

        var unitPrice = ResolveUnitPrice(type, request.UnitPrice, product);
        var delta = StockEffect(type, request.Quantity);

        // Atomic step that can be rejected (insufficient stock): done first.
        var updatedProduct = await _productsClient.AdjustStockAsync(product.Id, delta, ct);

        var transaction = new Transaction
        {
            TransactionDate = DateTime.UtcNow,
            TransactionType = type,
            ProductId = product.Id,
            Quantity = request.Quantity,
            UnitPrice = unitPrice,
            TotalPrice = request.Quantity * unitPrice,
            Detail = request.Detail?.Trim()
        };

        try
        {
            await _transactionRepository.AddAsync(transaction, ct);
            await _transactionRepository.SaveChangesAsync(ct);
        }
        catch
        {
            await CompensateAsync(product.Id, -delta);
            throw;
        }

        return ToResponse(transaction, updatedProduct);
    }

    public async Task<TransactionResponse> UpdateAsync(
        int id, UpdateTransactionRequest request, CancellationToken ct = default)
    {
        var transaction = await GetExistingAsync(id, ct);

        var unitPrice = transaction.TransactionType == TransactionType.Purchase && request.UnitPrice.HasValue
            ? RoundMoney(request.UnitPrice.Value)
            : transaction.UnitPrice;

        var delta = StockEffect(transaction.TransactionType, request.Quantity)
                  - StockEffect(transaction.TransactionType, transaction.Quantity);

        var updatedProduct = await _productsClient.AdjustStockAsync(transaction.ProductId, delta, ct);

        transaction.Quantity = request.Quantity;
        transaction.UnitPrice = unitPrice;
        transaction.TotalPrice = request.Quantity * unitPrice;
        transaction.Detail = request.Detail?.Trim();

        try
        {
            await _transactionRepository.SaveChangesAsync(ct);
        }
        catch
        {
            await CompensateAsync(transaction.ProductId, -delta);
            throw;
        }

        return ToResponse(transaction, updatedProduct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var transaction = await GetExistingAsync(id, ct);

        var delta = -StockEffect(transaction.TransactionType, transaction.Quantity);

        await _productsClient.AdjustStockAsync(transaction.ProductId, delta, ct);

        try
        {
            _transactionRepository.Remove(transaction);
            await _transactionRepository.SaveChangesAsync(ct);
        }
        catch
        {
            await CompensateAsync(transaction.ProductId, -delta);
            throw;
        }
    }

    private async Task<Transaction> GetExistingAsync(int id, CancellationToken ct)
    {
        return await _transactionRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"No se encontró la transacción con id {id}.");
    }

    private static int StockEffect(TransactionType type, int quantity)
    {
        return type == TransactionType.Purchase ? quantity : -quantity;
    }

    private static decimal ResolveUnitPrice(TransactionType type, decimal? requestedPrice, ProductInfo product)
    {
        if (type == TransactionType.Sale)
            return product.Price;

        return requestedPrice.HasValue
            ? RoundMoney(requestedPrice.Value)
            : throw new BusinessRuleException("El precio unitario es obligatorio en las compras.");
    }

    private static decimal RoundMoney(decimal value)
    {
        return Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    private async Task CompensateAsync(int productId, int delta)
    {
        if (delta == 0)
            return;

        try
        {
            await _productsClient.AdjustStockAsync(productId, delta, CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogCritical(ex,
                "Stock compensation failed for product {ProductId} (delta {Delta}). Manual reconciliation required.",
                productId, delta);
        }
    }

    private async Task<List<TransactionResponse>> ToResponsesAsync(
        IReadOnlyList<Transaction> transactions, CancellationToken ct)
    {
        var products = await _productsClient.GetByIdsAsync(transactions.Select(t => t.ProductId), ct);

        return transactions
            .Select(t => ToResponse(t, products.GetValueOrDefault(t.ProductId)))
            .ToList();
    }

    private static TransactionResponse ToResponse(Transaction transaction, ProductInfo? product)
    {
        return new TransactionResponse(
            transaction.Id,
            transaction.TransactionDate,
            transaction.TransactionType,
            transaction.ProductId,
            product?.Name ?? "Producto desconocido",
            product?.Stock,
            transaction.Quantity,
            transaction.UnitPrice,
            transaction.TotalPrice,
            transaction.Detail);
    }
}