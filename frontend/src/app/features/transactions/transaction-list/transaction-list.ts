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
import { Confirm } from '../../../core/services/confirm';
import { Notifier } from '../../../core/services/notifier';
import { apiErrorMessage } from '../../../core/http/api-error';

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
  private readonly confirm = inject(Confirm);
  private readonly notifier = inject(Notifier);

  protected readonly actionError = signal<string | null>(null);

  protected async remove(t: Transaction): Promise<void> {
    this.actionError.set(null);

    const units = `${t.quantity} ${t.quantity === 1 ? 'unidad' : 'unidades'}`;
    const effect =
      t.transactionType === 'SALE'
        ? `Se devolverán ${units} al stock de «${t.productName}».`
        : `Se descontarán ${units} del stock de «${t.productName}».`;

    const accepted = await this.confirm.ask({
      title: '¿Eliminar este movimiento?',
      message: `${effect} Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar movimiento',
    });
    if (!accepted) return;

    this.transactionsApi.remove(t.id).subscribe({
      next: () => {
        this.notifier.success('Movimiento eliminado y stock actualizado.');
        this.refreshAfterDelete();
      },
      error: (err: unknown) =>
        this.actionError.set(
          `No se pudo eliminar el movimiento. ${apiErrorMessage(err, 'Inténtalo de nuevo.')}`,
        ),
    });
  }

  protected dismissError(): void {
    this.actionError.set(null);
  }

  private refreshAfterDelete(): void {
    const s = this.state();
    const wasLastOnPage = s.status === 'ready' && s.data.items.length === 1 && s.data.page > 1;

    if (wasLastOnPage) this.goToPage(s.data.page - 1);
    else this.reload();

    document.getElementById('contenido')?.focus();
  }

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
