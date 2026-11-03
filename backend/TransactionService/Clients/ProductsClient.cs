using System.Net.Http.Json;
using TransactionService.Exceptions;

namespace TransactionService.Clients;

public class ProductsClient : IProductsClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ProductsClient> _logger;

    public ProductsClient(HttpClient httpClient, ILogger<ProductsClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<IReadOnlyDictionary<int, ProductInfo>> GetByIdsAsync(
        IEnumerable<int> ids, CancellationToken ct = default)
    {
        var idList = ids.Distinct().ToList();

        if (idList.Count == 0)
            return new Dictionary<int, ProductInfo>();

        var query = string.Join("&", idList.Select(id => $"ids={id}"));

        try
        {
            var products = await _httpClient.GetFromJsonAsync<List<ProductInfo>>(
                $"api/products/batch?{query}", ct);

            return (products ?? []).ToDictionary(p => p.Id);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "ProductService request failed");
            throw new ServiceUnavailableException(
                "El servicio de productos no está disponible. Intenta nuevamente.");
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            _logger.LogError(ex, "ProductService request timed out");
            throw new ServiceUnavailableException(
                "El servicio de productos tardó demasiado en responder. Intenta nuevamente.");
        }
    }
}