using System.ComponentModel.DataAnnotations;
using TransactionService.Entities;

namespace TransactionService.Dtos;

public class TransactionFilter
{
    public TransactionType? Type { get; set; }
    public int? ProductId { get; set; }
    public DateTimeOffset? DateFrom { get; set; }
    public DateTimeOffset? DateTo { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La página debe ser mayor o igual a 1.")]
    public int Page { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "El tamaño de página debe estar entre 1 y 100.")]
    public int PageSize { get; set; } = 10;
}