using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
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

        return await CallAsync(async () =>
        {
            var products = await _httpClient.GetFromJsonAsync<List<ProductInfo>>(
                $"api/products/batch?{query}", ct);

            return (products ?? []).ToDictionary(p => p.Id);
        }, ct);
    }

    public async Task<ProductInfo?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await CallAsync(async () =>
        {
            using var response = await _httpClient.GetAsync($"api/products/{id}", ct);

            if (response.StatusCode == HttpStatusCode.NotFound)
                return null;

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ProductInfo>(ct);
        }, ct);
    }

    public async Task<ProductInfo> AdjustStockAsync(
        int productId, int delta, CancellationToken ct = default)
    {
        return await CallAsync(async () =>
        {
            using var response = await _httpClient.PostAsJsonAsync(
                $"api/products/{productId}/stock-adjustments", new { delta }, ct);

            if (response.StatusCode == HttpStatusCode.Conflict)
            {
                var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(ct);
                throw new InsufficientStockException(
                    problem?.Detail ?? "Stock insuficiente para aplicar el ajuste.");
            }

            if (response.StatusCode == HttpStatusCode.NotFound)
                throw new NotFoundException("El producto no existe o fue eliminado.");

            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadFromJsonAsync<ProductInfo>(ct))!;
        }, ct);
    }

    private async Task<T> CallAsync<T>(Func<Task<T>> action, CancellationToken ct)
    {
        try
        {
            return await action();
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