import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, map, of, startWith, switchMap } from 'rxjs';
import { PagedResult } from '../../../core/models/paged-result';
import { Product, ProductQuery } from '../../../core/models/product';
import { ProductsApi } from '../../../core/services/products-api';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Confirm } from '../../../core/services/confirm';
import { Notifier } from '../../../core/services/notifier';

type ListState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: PagedResult<Product> };

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
  private readonly api = inject(ProductsApi);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly confirm = inject(Confirm);
  private readonly notifier = inject(Notifier);

  protected readonly actionError = signal<string | null>(null);

  protected readonly filtersOpen = signal(false);
  protected readonly filters = this.fb.group({
    name: '',
    category: '',
    inStock: false,
  });

  private readonly query = signal<ProductQuery>({ page: 1, pageSize: 10 });

  protected readonly categories = toSignal(
    this.api.categories().pipe(catchError(() => of([] as string[]))),
    { initialValue: [] as string[] },
  );

  protected readonly state = toSignal(
    toObservable(this.query).pipe(
      switchMap((q) =>
        this.api.list(q).pipe(
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
    if (s.status === 'loading') return 'Cargando productos…';
    if (s.status === 'error') return '';
    const n = s.data.totalCount;
    return `${n} ${n === 1 ? 'producto' : 'productos'}`;
  });

  constructor() {
    this.filters.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((v) => {
      this.query.update((q) => ({
        ...q,
        name: v.name?.trim() || undefined,
        category: v.category || undefined,
        inStock: v.inStock || undefined,
        page: 1,
      }));
    });
  }

  protected toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  protected clearFilters(): void {
    this.filters.reset();
  }

  protected goToPage(page: number): void {
    this.query.update((q) => ({ ...q, page }));
  }

  protected reload(): void {
    this.query.update((q) => ({ ...q }));
  }

  protected totalPages(data: PagedResult<Product>): number {
    return Math.max(1, Math.ceil(data.totalCount / data.pageSize));
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

  protected async remove(p: Product): Promise<void> {
    this.actionError.set(null);

    const accepted = await this.confirm.ask({
      title: '¿Eliminar este producto?',
      message: `«${p.name}» dejará de aparecer en el catálogo. Su historial de movimientos se conserva.`,
      confirmLabel: 'Eliminar producto',
    });
    if (!accepted) return;

    this.api.remove(p.id).subscribe({
      next: () => {
        this.notifier.success(`Producto «${p.name}» eliminado.`);
        this.refreshAfterDelete();
      },
      error: (err: unknown) =>
        this.actionError.set(
          `No se pudo eliminar «${p.name}». ${apiErrorMessage(err, 'Inténtalo de nuevo.')}`,
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
}
