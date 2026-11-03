namespace TransactionService.Clients;

public interface IProductsClient
{
    Task<IReadOnlyDictionary<int, ProductInfo>> GetByIdsAsync(
        IEnumerable<int> ids, CancellationToken ct = default);
}