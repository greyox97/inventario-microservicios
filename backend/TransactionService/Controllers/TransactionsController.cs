using Microsoft.AspNetCore.Mvc;
using TransactionService.Dtos;
using TransactionService.Services;

namespace TransactionService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionsService _transactionsService;

    public TransactionsController(ITransactionsService transactionsService)
    {
        _transactionsService = transactionsService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TransactionResponse>>> GetAll(
        [FromQuery] TransactionFilter filter, CancellationToken ct)
    {
        return Ok(await _transactionsService.GetPagedAsync(filter, ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TransactionResponse>> GetById(int id, CancellationToken ct)
    {
        return Ok(await _transactionsService.GetByIdAsync(id, ct));
    }

    [HttpPost]
    public async Task<ActionResult<TransactionResponse>> Create(
        CreateTransactionRequest request, CancellationToken ct)
    {
        var created = await _transactionsService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TransactionResponse>> Update(
        int id, UpdateTransactionRequest request, CancellationToken ct)
    {
        return Ok(await _transactionsService.UpdateAsync(id, request, ct));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _transactionsService.DeleteAsync(id, ct);
        return NoContent();
    }
}