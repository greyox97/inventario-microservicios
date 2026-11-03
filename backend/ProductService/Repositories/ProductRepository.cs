using Microsoft.EntityFrameworkCore;
using ProductService.Data;
using ProductService.Dtos;
using ProductService.Entities;

namespace ProductService.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly InventoryDbContext _context;

    public ProductRepository(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task<(IReadOnlyList<Product> Items, int TotalCount)> GetPagedAsync(
        ProductFilter filter, CancellationToken ct = default)
    {
        IQueryable<Product> query = _context.Products.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter.Name))
            query = query.Where(p => p.Name.Contains(filter.Name));

        if (!string.IsNullOrWhiteSpace(filter.Category))
            query = query.Where(p => p.Category == filter.Category);

        if (filter.MinPrice.HasValue)
            query = query.Where(p => p.Price >= filter.MinPrice.Value);

        if (filter.MaxPrice.HasValue)
            query = query.Where(p => p.Price <= filter.MaxPrice.Value);

        if (filter.InStock == true)
            query = query.Where(p => p.Stock > 0);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderBy(p => p.Name)
            .ThenBy(p => p.Id)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<Product?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<IReadOnlyList<string>> GetCategoriesAsync(CancellationToken ct = default)
    {
        return await _context.Products
            .AsNoTracking()
            .Select(p => p.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(ct);
    }

    public async Task AddAsync(Product product, CancellationToken ct = default)
    {
        await _context.Products.AddAsync(product, ct);
    }

    public async Task SaveChangesAsync(CancellationToken ct = default)
    {
        await _context.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<Product>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default)
    {
        var idList = ids.Distinct().ToList();

        return await _context.Products
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(p => idList.Contains(p.Id))
            .ToListAsync(ct);
    }
}