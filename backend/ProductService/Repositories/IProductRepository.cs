using ProductService.Dtos;
using ProductService.Entities;

namespace ProductService.Repositories;

public interface IProductRepository
{
    Task<(IReadOnlyList<Product> Items, int TotalCount)> GetPagedAsync(
        ProductFilter filter, CancellationToken ct = default);

    Task<Product?> GetByIdAsync(int id, CancellationToken ct = default);

    Task<IReadOnlyList<string>> GetCategoriesAsync(CancellationToken ct = default);

    Task AddAsync(Product product, CancellationToken ct = default);

    Task SaveChangesAsync(CancellationToken ct = default);
}