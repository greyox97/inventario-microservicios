export type TransactionType = 'PURCHASE' | 'SALE';

export interface Transaction {
  id: number;
  transactionDate: string;
  transactionType: TransactionType;
  productId: number;
  productName: string;
  currentStock: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  detail: string | null;
}

export interface TransactionQuery {
  type?: TransactionType;
  productId?: number;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}
