using ProductService.Dtos;

namespace ProductService.Services;

public interface IProductsService
{
    Task<PagedResult<ProductResponse>> GetPagedAsync(ProductFilter filter, CancellationToken ct = default);
    Task<ProductResponse> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<ProductResponse>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetCategoriesAsync(CancellationToken ct = default);
    Task<ProductResponse> CreateAsync(CreateProductRequest request, CancellationToken ct = default);
    Task<ProductResponse> UpdateAsync(int id, UpdateProductRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}