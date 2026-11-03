using System.ComponentModel.DataAnnotations;

namespace ProductService.Dtos;

public class AdjustStockRequest
{
    [Range(-1000000, 1000000, ErrorMessage = "El ajuste debe estar entre -1.000.000 y 1.000.000.")]
    public int Delta { get; set; }
}