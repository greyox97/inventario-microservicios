using System.ComponentModel.DataAnnotations;
using TransactionService.Entities;

namespace TransactionService.Dtos;

public class CreateTransactionRequest
{
    [Required(ErrorMessage = "El tipo de transacción es obligatorio.")]
    public TransactionType? TransactionType { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Debes seleccionar un producto.")]
    public int ProductId { get; set; }

    [Range(1, 1000000, ErrorMessage = "La cantidad debe ser al menos 1.")]
    public int Quantity { get; set; }

    [Range(0.01, 1000000, ErrorMessage = "El precio unitario debe ser mayor que cero.")]
    public decimal? UnitPrice { get; set; }

    [StringLength(500, ErrorMessage = "El detalle no puede superar los 500 caracteres.")]
    public string? Detail { get; set; }
}