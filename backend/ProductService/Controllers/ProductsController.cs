using Microsoft.AspNetCore.Mvc;
using ProductService.Dtos;
using ProductService.Services;

namespace ProductService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductsService _productsService;

    public ProductsController(IProductsService productsService)
    {
        _productsService = productsService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductResponse>>> GetAll(
        [FromQuery] ProductFilter filter, CancellationToken ct)
    {
        return Ok(await _productsService.GetPagedAsync(filter, ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductResponse>> GetById(int id, CancellationToken ct)
    {
        return Ok(await _productsService.GetByIdAsync(id, ct));
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetCategories(CancellationToken ct)
    {
        return Ok(await _productsService.GetCategoriesAsync(ct));
    }

    [HttpGet("batch")]
    public async Task<ActionResult<IReadOnlyList<ProductResponse>>> GetByIds(
        [FromQuery] int[] ids, CancellationToken ct)
    {
        return Ok(await _productsService.GetByIdsAsync(ids, ct));
    }

    [HttpPost]
    public async Task<ActionResult<ProductResponse>> Create(
        CreateProductRequest request, CancellationToken ct)
    {
        var created = await _productsService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductResponse>> Update(
        int id, UpdateProductRequest request, CancellationToken ct)
    {
        return Ok(await _productsService.UpdateAsync(id, request, ct));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _productsService.DeleteAsync(id, ct);
        return NoContent();
    }
}