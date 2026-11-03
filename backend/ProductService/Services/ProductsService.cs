using ProductService.Dtos;
using ProductService.Entities;
using ProductService.Exceptions;
using ProductService.Repositories;

namespace ProductService.Services;

public class ProductsService : IProductsService
{
    private readonly IProductRepository _productRepository;

    public ProductsService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<PagedResult<ProductResponse>> GetPagedAsync(
        ProductFilter filter, CancellationToken ct = default)
    {
        var (items, totalCount) = await _productRepository.GetPagedAsync(filter, ct);
        var responses = items.Select(ToResponse).ToList();

        return new PagedResult<ProductResponse>(responses, filter.Page, filter.PageSize, totalCount);
    }

    public async Task<ProductResponse> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var product = await GetExistingAsync(id, ct);
        return ToResponse(product);
    }

    public Task<IReadOnlyList<string>> GetCategoriesAsync(CancellationToken ct = default)
    {
        return _productRepository.GetCategoriesAsync(ct);
    }

    public async Task<ProductResponse> CreateAsync(
        CreateProductRequest request, CancellationToken ct = default)
    {
        var product = new Product
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Category = request.Category.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            Price = request.Price,
            Stock = request.Stock
        };

        await _productRepository.AddAsync(product, ct);
        await _productRepository.SaveChangesAsync(ct);

        return ToResponse(product);
    }

    public async Task<ProductResponse> UpdateAsync(
        int id, UpdateProductRequest request, CancellationToken ct = default)
    {
        var product = await GetExistingAsync(id, ct);

        product.Name = request.Name.Trim();
        product.Description = request.Description?.Trim();
        product.Category = request.Category.Trim();
        product.ImageUrl = request.ImageUrl?.Trim();
        product.Price = request.Price;

        await _productRepository.SaveChangesAsync(ct);

        return ToResponse(product);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var product = await GetExistingAsync(id, ct);

        product.IsActive = false;

        await _productRepository.SaveChangesAsync(ct);
    }

    private async Task<Product> GetExistingAsync(int id, CancellationToken ct)
    {
        return await _productRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"No se encontró el producto con id {id}.");
    }

    private static ProductResponse ToResponse(Product product)
    {
        return new ProductResponse(
            product.Id,
            product.Name,
            product.Description,
            product.Category,
            product.ImageUrl,
            product.Price,
            product.Stock);
    }
   
    public async Task<IReadOnlyList<ProductResponse>> GetByIdsAsync(
        IEnumerable<int> ids, CancellationToken ct = default)
    {
        var products = await _productRepository.GetByIdsAsync(ids, ct);
        return products.Select(ToResponse).ToList();
    }
   
    public async Task<ProductResponse> AdjustStockAsync(
    int id, AdjustStockRequest request, CancellationToken ct = default)
    {
        var adjusted = await _productRepository.TryAdjustStockAsync(id, request.Delta, ct);
        var product = await GetExistingAsync(id, ct);

        if (!adjusted)
            throw new InsufficientStockException(
                $"Stock insuficiente para aplicar el ajuste. Stock disponible: {product.Stock}.");

        return ToResponse(product);
    }
}