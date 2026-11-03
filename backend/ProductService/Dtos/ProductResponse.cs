namespace ProductService.Dtos;

public record ProductResponse(
    int Id,
    string Name,
    string? Description,
    string Category,
    string? ImageUrl,
    decimal Price,
    int Stock);