import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal, effect } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, merge, of, startWith } from 'rxjs';
import { apiErrorMessage } from '../../../core/http/api-error';
import { Product } from '../../../core/models/product';
import { Transaction, TransactionType } from '../../../core/models/transaction';
import { Notifier } from '../../../core/services/notifier';
import { ProductsApi } from '../../../core/services/products-api';
import { TransactionsApi } from '../../../core/services/transactions-api';

type Field = 'productId' | 'quantity' | 'unitPrice' | 'detail';
type LoadState = 'loading' | 'ready' | 'notFound' | 'error';

@Component({
  selector: 'app-transaction-form',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.scss',
})
export class TransactionForm {
  private readonly transactionsApi = inject(TransactionsApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);
  private readonly destroyRef = inject(DestroyRef);

  private readonly idParam = inject(ActivatedRoute).snapshot.paramMap.get('id');
  private readonly presetProductId =
    inject(ActivatedRoute).snapshot.queryParamMap.get('productId') ?? '';
  protected readonly isEdit = this.idParam !== null;
  private readonly transactionId = Number(this.idParam);

  protected readonly loadState = signal<LoadState>(this.isEdit ? 'loading' : 'ready');
  protected readonly loaded = signal<Transaction | null>(null);
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly products = toSignal(
    this.productsApi.list({ page: 1, pageSize: 100 }).pipe(
      map((result) => result.items),
      catchError(() => of([] as Product[])),
    ),
    { initialValue: [] as Product[] },
  );

  /** Sales cannot exceed the stock shown in the product list (create mode only). */
  private readonly stockLimit: ValidatorFn = (control) => {
    const parent = control.parent;
    const quantity = control.value as number | null;
    if (!parent || this.isEdit || quantity === null) return null;
    if (parent.get('type')?.value !== 'SALE') return null;

    const productId = Number(parent.get('productId')?.value);
    const product = this.products().find((p) => p.id === productId);

    return product && quantity > product.stock
      ? { exceedsStock: { available: product.stock } }
      : null;
  };

  /** The unit price is only typed in purchases. */
  private readonly purchasePrice: ValidatorFn = (control) => {
    if (control.parent?.get('type')?.value !== 'PURCHASE') return null;

    const value = control.value as number | null;
    if (value === null) return { required: true };
    if (value < 0.01) return { min: true };
    if (value > 1_000_000) return { max: true };
    return null;
  };

  protected readonly form = this.fb.group({
    type: this.fb.control<TransactionType>('SALE'),
    productId: [this.presetProductId, Validators.required],
    quantity: this.fb.control<number | null>(1, [
      Validators.required,
      Validators.min(1),
      Validators.max(1_000_000),
      Validators.pattern(/^\d+$/),
      this.stockLimit,
    ]),
    unitPrice: this.fb.control<number | null>(null, [this.purchasePrice]),
    detail: ['', Validators.maxLength(500)],
  });

  protected readonly values = toSignal(
    this.form.valueChanges.pipe(
      startWith(null),
      map(() => this.form.getRawValue()),
    ),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly isSale = computed(() => this.values().type === 'SALE');

  protected readonly product = computed(() => {
    const id = Number(this.values().productId);
    return this.products().find((p) => p.id === id) ?? null;
  });

  protected readonly unitPrice = computed(() => {
    const v = this.values();
    if (v.type === 'PURCHASE') return v.unitPrice;
    return this.isEdit ? (this.loaded()?.unitPrice ?? null) : (this.product()?.price ?? null);
  });

  protected readonly total = computed(() => {
    const quantity = this.values().quantity;
    const price = this.unitPrice();
    return quantity !== null && quantity > 0 && price !== null
      ? Math.round(quantity * price * 100) / 100
      : null;
  });

  private readonly messages: Record<Field, Record<string, string>> = {
    productId: { required: 'Selecciona un producto.' },
    quantity: {
      required: 'Escribe la cantidad.',
      min: 'La cantidad debe ser al menos 1.',
      max: 'La cantidad no puede superar 1.000.000.',
      pattern: 'La cantidad debe ser un número entero.',
    },
    unitPrice: {
      required: 'Escribe el precio de compra.',
      min: 'El precio debe ser mayor que cero.',
      max: 'El precio no puede superar 1.000.000.',
    },
    detail: { maxlength: 'El detalle no puede superar los 500 caracteres.' },
  };

  constructor() {
    // The quantity and price rules depend on the type and the product.
    merge(this.form.controls.type.valueChanges, this.form.controls.productId.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.form.controls.quantity.updateValueAndValidity();
        this.form.controls.unitPrice.updateValueAndValidity();
      });

    // Switching between sale and purchase starts again from 1 unit.
    this.form.controls.type.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (!this.isEdit) this.form.controls.quantity.setValue(1);
    });

    if (this.isEdit) {
      this.form.controls.type.disable();
      this.form.controls.productId.disable();
      this.load();
    }

    effect(() => {
      this.products();
      this.form.controls.quantity.updateValueAndValidity();
    });
  }

  protected load(): void {
    if (!Number.isInteger(this.transactionId)) {
      this.loadState.set('notFound');
      return;
    }

    this.loadState.set('loading');
    this.transactionsApi
      .get(this.transactionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (t) => {
          this.loaded.set(t);
          this.form.patchValue({
            type: t.transactionType,
            productId: String(t.productId),
            quantity: t.quantity,
            unitPrice: t.transactionType === 'PURCHASE' ? t.unitPrice : null,
            detail: t.detail ?? '',
          });
          this.loadState.set('ready');
        },
        error: (err: HttpErrorResponse) =>
          this.loadState.set(err.status === 404 ? 'notFound' : 'error'),
      });
  }

  protected typeLabel(type: TransactionType): string {
    return type === 'SALE' ? 'Venta' : 'Compra';
  }

  protected optionLabel(p: Product): string {
    return `${p.name} · ${p.stock === 0 ? 'agotado' : `${p.stock} en stock`}`;
  }

  protected submitLabel(): string {
    if (this.saving()) return 'Guardando…';
    if (this.isEdit) return 'Guardar cambios';
    return this.isSale() ? 'Registrar venta' : 'Registrar compra';
  }

  protected step(delta: number): void {
    const control = this.form.controls.quantity;
    control.setValue(Math.max(1, (control.value ?? 0) + delta));
    control.markAsDirty();
  }

  protected error(field: Field): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || control.dirty || this.submitted())) return null;

    const errors = control.errors ?? {};
    if (typeof errors['server'] === 'string') return errors['server'];

    if (errors['exceedsStock']) {
      const available = errors['exceedsStock'].available as number;
      if (available === 0) return 'Este producto está agotado.';
      return `Solo hay ${available} ${available === 1 ? 'unidad disponible' : 'unidades disponibles'}.`;
    }

    const key = Object.keys(errors)[0];
    return this.messages[field][key] ?? 'El valor no es válido.';
  }

  protected submit(): void {
    this.submitted.set(true);
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    const v = this.form.getRawValue();
    const quantity = v.quantity as number;
    const detail = v.detail.trim() || null;
    const unitPrice = v.type === 'PURCHASE' ? v.unitPrice : null;

    this.saving.set(true);

    const request$ = this.isEdit
      ? this.transactionsApi.update(this.transactionId, { quantity, unitPrice, detail })
      : this.transactionsApi.create({
          transactionType: v.type,
          productId: Number(v.productId),
          quantity,
          unitPrice,
          detail,
        });

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (t) => {
        const stock = t.currentStock === null ? '' : ` Stock actual: ${t.currentStock}.`;
        this.notifier.success(
          this.isEdit
            ? `Movimiento actualizado.${stock}`
            : `${this.typeLabel(t.transactionType)} registrada: ${t.productName}.${stock}`,
        );
        this.router.navigate(['/movimientos']);
      },
      error: (err: unknown) => this.onSaveError(err),
    });
  }

  private onSaveError(err: unknown): void {
    this.saving.set(false);

    if (err instanceof HttpErrorResponse && err.status === 409) {
      this.form.controls.quantity.setErrors({
        server: apiErrorMessage(err, 'No hay stock suficiente para esta operación.'),
      });
      this.form.controls.quantity.markAsTouched();
      document.getElementById('f-quantity')?.focus();
      return;
    }

    this.formError.set(
      apiErrorMessage(err, 'No pudimos guardar el movimiento. Inténtalo de nuevo.'),
    );
  }

  private focusFirstInvalid(): void {
    const order: Field[] = ['productId', 'quantity', 'unitPrice', 'detail'];
    const first = order.find((f) => this.form.controls[f].invalid);
    if (first) document.getElementById(`f-${first}`)?.focus();
  }
}
