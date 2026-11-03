namespace TransactionService.Entities;

public class Transaction
{
    public int Id { get; set; }
    public DateTime TransactionDate { get; set; }
    public TransactionType TransactionType { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Detail { get; set; }
}