namespace TransactionService.Clients;

public interface IProductsClient
{
    Task<IReadOnlyDictionary<int, ProductInfo>> GetByIdsAsync(
        IEnumerable<int> ids, CancellationToken ct = default);

    Task<ProductInfo?> GetByIdAsync(int id, CancellationToken ct = default);

    Task<ProductInfo> AdjustStockAsync(int productId, int delta, CancellationToken ct = default);
}