import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product';
import { Transaction } from '../../../core/models/transaction';
import { ProductsApi } from '../../../core/services/products-api';
import { TransactionsApi } from '../../../core/services/transactions-api';

type LoadState = 'loading' | 'ready' | 'notFound' | 'error';
type HistoryState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private readonly productsApi = inject(ProductsApi);
  private readonly transactionsApi = inject(TransactionsApi);
  private readonly destroyRef = inject(DestroyRef);

  private readonly productId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly loadState = signal<LoadState>('loading');
  protected readonly product = signal<Product | null>(null);

  protected readonly historyState = signal<HistoryState>('loading');
  protected readonly recent = signal<Transaction[]>([]);
  protected readonly movementsTotal = signal(0);

  constructor() {
    this.load();
  }

  protected load(): void {
    if (!Number.isInteger(this.productId)) {
      this.loadState.set('notFound');
      return;
    }

    this.loadState.set('loading');
    this.productsApi
      .get(this.productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.product.set(p);
          this.loadState.set('ready');
          this.loadHistory();
        },
        error: (err: HttpErrorResponse) =>
          this.loadState.set(err.status === 404 ? 'notFound' : 'error'),
      });
  }

  protected loadHistory(): void {
    this.historyState.set('loading');
    this.transactionsApi
      .list({ productId: this.productId, page: 1, pageSize: 5 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.recent.set(result.items);
          this.movementsTotal.set(result.totalCount);
          this.historyState.set('ready');
        },
        error: () => this.historyState.set('error'),
      });
  }

  protected initial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  protected stockLabel(stock: number): string {
    if (stock === 0) return 'Agotado';
    if (stock === 1) return 'Queda 1';
    if (stock <= 5) return `Quedan ${stock}`;
    return `${stock} en stock`;
  }

  protected typeLabel(t: Transaction): string {
    return t.transactionType === 'SALE' ? 'Venta' : 'Compra';
  }
}
