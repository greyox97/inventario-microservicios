IF DB_ID('InventoryDb') IS NULL
    CREATE DATABASE InventoryDb;


GO
USE InventoryDb;


GO
-- Tables
IF OBJECT_ID('dbo.Products', 'U') IS NULL
    CREATE TABLE dbo.Products (
        Id          INT             IDENTITY (1, 1) NOT NULL,
        Name        NVARCHAR (150)  NOT NULL,
        Description NVARCHAR (500)  NULL,
        Category    NVARCHAR (100)  NOT NULL,
        ImageURL    NVARCHAR (500)  NULL,
        Price       DECIMAL (18, 2) NOT NULL,
        Stock       INT             CONSTRAINT DF_Products_Stock DEFAULT 0 NOT NULL,
        IsActive    BIT             CONSTRAINT DF_Products_Is_Active DEFAULT 1 NOT NULL,
        CONSTRAINT PK_Products PRIMARY KEY (Id),
        CONSTRAINT CK_Products_Price CHECK (Price >= 0),
        CONSTRAINT CK_Products_Stock CHECK (Stock >= 0)
    );


GO
IF OBJECT_ID('dbo.Transactions', 'U') IS NULL
    CREATE TABLE dbo.Transactions (
        Id              INT             IDENTITY (1, 1) NOT NULL,
        TransactionDate DATETIME2 (0)   CONSTRAINT DF_Transactions_Date DEFAULT SYSUTCDATETIME() NOT NULL,
        TransactionType NVARCHAR (10)   NOT NULL,
        ProductId       INT             NOT NULL,
        Quantity        INT             NOT NULL,
        UnitPrice       DECIMAL (18, 2) NOT NULL,
        TotalPrice      DECIMAL (18, 2) NOT NULL,
        Detail          NVARCHAR (500)  NULL,
        CONSTRAINT PK_Transactions PRIMARY KEY (Id),
        CONSTRAINT FK_Transactions_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products (Id),
        CONSTRAINT CK_Transactions_Type CHECK (TransactionType IN ('PURCHASE', 'SALE')),
        CONSTRAINT CK_Transactions_Quantity CHECK (Quantity > 0),
        CONSTRAINT CK_Transactions_UnitPrice CHECK (UnitPrice >= 0),
        CONSTRAINT CK_Transactions_Total CHECK (TotalPrice = Quantity * UnitPrice)
    );


GO
-- Indexes
CREATE INDEX IX_Products_Category
    ON dbo.Products(Category);

CREATE INDEX IX_Transactions_ProductId_Date
    ON dbo.Transactions(ProductId, TransactionDate DESC);


GO
-- Seed data
INSERT  INTO dbo.Products (
    Name,
    Description,
    Category,
    Price,
    Stock
)
VALUES                    (N'Vestido de lino verano', N'Vestido ligero color beige, tallas S a L', N'Ropa de mujer', 59.90, 24),
                          (N'Jean slim fit', N'Denim azul oscuro elástico, tallas 30 a 38', N'Ropa de hombre', 49.90, 32),
                          (N'Bolso bandolera de cuero', N'Cuero genuino con correa ajustable', N'Accesorios', 89.00, 12),
                          (N'Pañuelo de seda', N'Estampado 100% seda, 90x90 cm', N'Accesorios', 34.50, 20),
                          (N'Zapatillas blancas de cuero', N'Estilo minimalista, tallas 36 a 45', N'Calzado', 74.90, 16),
                          (N'Camiseta cuello redondo', N'Corte clásico de algodón, disponible en 5 colores', N'Ropa de hombre', 19.90, 45),
                          (N'Abrigo de lana', N'Abrigo largo color camel con forro interior', N'Ropa de mujer', 129.00, 8),
                          (N'Aretes de aro bañados en oro', N'Hipoalergénicos, 30 mm de diámetro', N'Joyería', 22.00, 38);


GO
INSERT  INTO dbo.Transactions (
    TransactionDate,
    TransactionType,
    ProductId,
    Quantity,
    UnitPrice,
    TotalPrice,
    Detail
)
VALUES                        ('2026-08-03T09:00:00', 'PURCHASE', 1, 30, 30.00, 900.00, N'Colección de verano - Proveedor Textil Andina'),
                              ('2026-08-03T09:15:00', 'PURCHASE', 2, 40, 25.00, 1000.00, N'Reposición de denim'),
                              ('2026-08-05T10:30:00', 'PURCHASE', 3, 15, 45.00, 675.00, N'Pedido de artículos de cuero'),
                              ('2026-08-05T10:45:00', 'PURCHASE', 4, 25, 15.00, 375.00, N'Lote de pañuelos de seda'),
                              ('2026-09-02T12:10:00', 'SALE', 1, 6, 59.90, 359.40, N'Ventas en tienda'),
                              ('2026-09-09T16:30:00', 'SALE', 2, 8, 49.90, 399.20, N'Pedidos en línea semana 36'),
                              ('2026-09-15T13:00:00', 'SALE', 3, 3, 89.00, 267.00, N'Venta en mostrador'),
                              ('2026-09-21T18:20:00', 'SALE', 4, 5, 34.50, 172.50, N'Sets de regalo');