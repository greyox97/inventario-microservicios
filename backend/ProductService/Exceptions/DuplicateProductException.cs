namespace ProductService.Exceptions;

public class DuplicateProductException(string name)
    : Exception($"Ya existe un producto con el nombre '{name}'.");