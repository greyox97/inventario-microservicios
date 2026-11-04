import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, debounceTime, map, of, startWith, switchMap } from 'rxjs';
import { PagedResult } from '../../../core/models/paged-result';
import { Product } from '../../../core/models/product';
import { Transaction, TransactionQuery, TransactionType } from '../../../core/models/transaction';
import { ProductsApi } from '../../../core/services/products-api';
import { TransactionsApi } from '../../../core/services/transactions-api';
import { startOfLocalDay } from '../../../core/utils/local-day';

type ListState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: PagedResult<Transaction> };

@Component({
  selector: 'app-transaction-list',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.scss',
})
export class TransactionList {
  private readonly transactionsApi = inject(TransactionsApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly initialProductId =
    Number(inject(ActivatedRoute).snapshot.queryParamMap.get('productId')) || undefined;

  protected readonly filtersOpen = signal(false);
  protected readonly rangeError = signal(false);

  protected readonly filters = this.fb.group({
    type: '',
    productId: this.initialProductId ? String(this.initialProductId) : '',
    dateFrom: '',
    dateTo: '',
  });

  private readonly query = signal<TransactionQuery>({
    productId: this.initialProductId,
    page: 1,
    pageSize: 10,
  });

  protected readonly products = toSignal(
    this.productsApi.list({ page: 1, pageSize: 100 }).pipe(
      map((result) => result.items),
      catchError(() => of([] as Product[])),
    ),
    { initialValue: [] as Product[] },
  );

  protected readonly state = toSignal(
    toObservable(this.query).pipe(
      switchMap((q) =>
        this.transactionsApi.list(q).pipe(
          map((data): ListState => ({ status: 'ready', data })),
          catchError(() => of<ListState>({ status: 'error' })),
          startWith<ListState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as ListState },
  );

  protected readonly summary = computed(() => {
    const s = this.state();
    if (s.status === 'loading') return 'Cargando movimientos…';
    if (s.status === 'error') return '';
    const n = s.data.totalCount;
    return `${n} ${n === 1 ? 'movimiento' : 'movimientos'}`;
  });

  constructor() {
    this.filters.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((v) => {
      const from = v.dateFrom || undefined;
      const to = v.dateTo || undefined;

      if (from && to && from > to) {
        this.rangeError.set(true);
        return;
      }
      this.rangeError.set(false);

      this.query.update((q) => ({
        ...q,
        type: (v.type as TransactionType) || undefined,
        productId: v.productId ? Number(v.productId) : undefined,
        dateFrom: from ? startOfLocalDay(from) : undefined,
        dateTo: to ? startOfLocalDay(to, 1) : undefined,
        page: 1,
      }));
    });
  }

  protected toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  protected clearFilters(): void {
    this.filters.reset({ type: '', productId: '', dateFrom: '', dateTo: '' });
  }

  protected goToPage(page: number): void {
    this.query.update((q) => ({ ...q, page }));
  }

  protected reload(): void {
    this.query.update((q) => ({ ...q }));
  }

  protected totalPages(data: PagedResult<Transaction>): number {
    return Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  }

  protected typeLabel(t: Transaction): string {
    return t.transactionType === 'SALE' ? 'Venta' : 'Compra';
  }

  protected stockText(t: Transaction): string {
    return t.currentStock === null ? 'No disponible' : String(t.currentStock);
  }
}
