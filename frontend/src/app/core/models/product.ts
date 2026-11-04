export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  price: number;
  stock: number;
}

export interface ProductQuery {
  name?: string;
  category?: string;
  inStock?: boolean;
  page: number;
  pageSize: number;
}

export interface ProductInput {
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  price: number;
}

export interface NewProductInput extends ProductInput {
  stock: number;
}
