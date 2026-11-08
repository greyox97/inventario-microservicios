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
IF NOT EXISTS (SELECT 1
               FROM   sys.indexes
               WHERE  name = 'UX_Products_Name_Active'
                      AND object_id = OBJECT_ID('dbo.Products'))
    CREATE UNIQUE INDEX UX_Products_Name_Active
        ON dbo.Products(Name) WHERE IsActive = 1;


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
IF NOT EXISTS (SELECT 1
               FROM   sys.indexes
               WHERE  name = 'IX_Products_Category'
                      AND object_id = OBJECT_ID('dbo.Products'))
    CREATE INDEX IX_Products_Category
        ON dbo.Products(Category);

IF NOT EXISTS (SELECT 1
               FROM   sys.indexes
               WHERE  name = 'IX_Transactions_ProductId_Date'
                      AND object_id = OBJECT_ID('dbo.Transactions'))
    CREATE INDEX IX_Transactions_ProductId_Date
        ON dbo.Transactions(ProductId, TransactionDate DESC);


GO
-- Seed data
IF NOT EXISTS (SELECT 1
               FROM   dbo.Products)
    BEGIN
        INSERT  INTO dbo.Products (
            Name,
            Description,
            Category,
            Price,
            Stock
        )
        VALUES                    (N'Blusa de satén estampada', N'Manga larga con estampado floral, tallas S a L', N'Blusas', 34.90, 16),
                                  (N'Blusa de lino blanca', N'Corte holgado con botones al frente, tallas S a XL', N'Blusas', 29.90, 19),
                                  (N'Vestido midi floral', N'Vestido cruzado con cinturón, tallas S a L', N'Vestidos', 54.90, 15),
                                  (N'Vestido rojo de fiesta', N'Largo con escote en V, tallas S a L', N'Vestidos', 79.90, 8),
                                  (N'Conjunto de tweed rosa', N'Chaqueta y falda a juego, tallas S a L', N'Conjuntos', 89.00, 8),
                                  (N'Enterizo negro', N'Pantalón amplio con cinturón, tallas S a L', N'Enterizos', 64.90, 7),
                                  (N'Loafers de cuero beige', N'Suela gruesa, tallas 35 a 40', N'Calzado', 59.90, 11),
                                  (N'Cartera de mano dorada', N'Cadena extraíble y cierre magnético', N'Accesorios', 39.50, 20);
    END


GO
IF NOT EXISTS (SELECT 1
               FROM   dbo.Transactions)
    BEGIN
        INSERT  INTO dbo.Transactions (
            TransactionDate,
            TransactionType,
            ProductId,
            Quantity,
            UnitPrice,
            TotalPrice,
            Detail
        )
        VALUES                        -- Purchases (UnitPrice = supplier cost)
                                      ('2026-09-02T14:00:00', 'PURCHASE', 1, 20, 18.00, 360.00, N'Pedido inicial de blusas'),
                                      ('2026-09-02T14:20:00', 'PURCHASE', 2, 25, 15.00, 375.00, N'Reposición de blusas de lino'),
                                      ('2026-09-08T15:00:00', 'PURCHASE', 3, 18, 28.00, 504.00, N'Pedido de vestidos de temporada'),
                                      ('2026-09-08T15:15:00', 'PURCHASE', 4, 10, 42.00, 420.00, N'Vestidos de fiesta'),
                                      ('2026-09-15T16:00:00', 'PURCHASE', 5, 8, 50.00, 400.00, N'Conjuntos de tweed'),
                                      ('2026-09-15T16:30:00', 'PURCHASE', 6, 12, 34.00, 408.00, N'Pedido de enterizos'),
                                      ('2026-09-22T14:45:00', 'PURCHASE', 7, 14, 32.00, 448.00, N'Pedido de loafers'),
                                      ('2026-09-22T15:10:00', 'PURCHASE', 8, 30, 17.00, 510.00, N'Lote de carteras y accesorios'),
                                      -- Sales (UnitPrice = selling price)
                                      ('2026-10-03T17:10:00', 'SALE', 1, 4, 34.90, 139.60, N'Ventas en tienda'),
                                      ('2026-10-06T18:25:00', 'SALE', 2, 6, 29.90, 179.40, N'Pedidos en línea'),
                                      ('2026-10-10T20:05:00', 'SALE', 3, 3, 54.90, 164.70, N'Venta en mostrador'),
                                      ('2026-10-17T22:30:00', 'SALE', 4, 2, 79.90, 159.80, N'Ventas de fin de semana'),
                                      ('2026-10-21T16:40:00', 'SALE', 6, 5, 64.90, 324.50, N'Promoción de temporada'),
                                      ('2026-10-24T19:15:00', 'SALE', 7, 3, 59.90, 179.70, N'Pedido en línea'),
                                      ('2026-10-28T21:00:00', 'SALE', 8, 10, 39.50, 395.00, N'Ventas de la semana');
    END