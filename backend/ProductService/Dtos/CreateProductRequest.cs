using System.ComponentModel.DataAnnotations;

namespace ProductService.Dtos;

public class CreateProductRequest
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(150, ErrorMessage = "El nombre no puede superar los 150 caracteres.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "La descripción no puede superar los 500 caracteres.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "La categoría es obligatoria.")]
    [StringLength(100, ErrorMessage = "La categoría no puede superar los 100 caracteres.")]
    public string Category { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "La ruta de la imagen no puede superar los 500 caracteres.")]
    public string? ImageUrl { get; set; }

    [Range(0.01, 1000000, ErrorMessage = "El precio debe ser mayor que cero.")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "El stock no puede ser negativo.")]
    public int Stock { get; set; }
}