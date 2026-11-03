using System.ComponentModel.DataAnnotations;

namespace TransactionService.Dtos;

public class UpdateTransactionRequest
{
    [Range(1, 1000000, ErrorMessage = "La cantidad debe ser al menos 1.")]
    public int Quantity { get; set; }

    [Range(0.01, 1000000, ErrorMessage = "El precio unitario debe ser mayor que cero.")]
    public decimal? UnitPrice { get; set; }

    [StringLength(500, ErrorMessage = "El detalle no puede superar los 500 caracteres.")]
    public string? Detail { get; set; }
}