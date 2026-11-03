using TransactionService.Entities;

namespace TransactionService.Dtos;

public record TransactionResponse(
    int Id,
    DateTime TransactionDate,
    TransactionType TransactionType,
    int ProductId,
    string ProductName,
    int? CurrentStock,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    string? Detail);