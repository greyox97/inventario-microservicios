import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { apiErrorMessage } from '../../../core/http/api-error';
import { ProductInput } from '../../../core/models/product';
import { Notifier } from '../../../core/services/notifier';
import { ProductsApi } from '../../../core/services/products-api';
import { notBlank } from '../../../core/validators/not-blank';

type Field = 'name' | 'category' | 'description' | 'price' | 'stock' | 'imageUrl';
type LoadState = 'loading' | 'ready' | 'notFound' | 'error';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm {
  private readonly api = inject(ProductsApi);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);
  private readonly destroyRef = inject(DestroyRef);

  private readonly idParam = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly isEdit = this.idParam !== null;
  private readonly productId = Number(this.idParam);

  protected readonly loadState = signal<LoadState>(this.isEdit ? 'loading' : 'ready');
  protected readonly currentStock = signal(0);
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly categories = toSignal(
    this.api.categories().pipe(catchError(() => of([] as string[]))),
    { initialValue: [] as string[] },
  );

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, notBlank, Validators.maxLength(150)]],
    category: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    price: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(1_000_000),
    ]),
    stock: this.fb.control<number | null>(0, [
      Validators.required,
      Validators.min(0),
      Validators.pattern(/^\d+$/),
    ]),
    imageUrl: ['', Validators.maxLength(500)],
  });

  private readonly messages: Record<Field, Record<string, string>> = {
    name: {
      required: 'Escribe el nombre del producto.',
      notBlank: 'Escribe el nombre del producto.',
      maxlength: 'El nombre no puede superar los 150 caracteres.',
    },
    category: {
      required: 'Escribe o elige una categoría.',
      notBlank: 'Escribe o elige una categoría.',
      maxlength: 'La categoría no puede superar los 100 caracteres.',
    },
    description: { maxlength: 'La descripción no puede superar los 500 caracteres.' },
    price: {
      required: 'Escribe el precio.',
      min: 'El precio debe ser mayor que cero.',
      max: 'El precio no puede superar 1.000.000.',
    },
    stock: {
      required: 'Escribe el stock inicial.',
      min: 'El stock no puede ser negativo.',
      pattern: 'El stock debe ser un número entero.',
    },
    imageUrl: { maxlength: 'La ruta de la imagen no puede superar los 500 caracteres.' },
  };

  constructor() {
    if (this.isEdit) {
      this.form.controls.stock.disable();
      this.load();
    }
  }

  protected load(): void {
    if (!Number.isInteger(this.productId)) {
      this.loadState.set('notFound');
      return;
    }

    this.loadState.set('loading');
    this.api
      .get(this.productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.form.patchValue({
            name: p.name,
            category: p.category,
            description: p.description ?? '',
            price: p.price,
            imageUrl: p.imageUrl ?? '',
          });
          this.currentStock.set(p.stock);
          this.loadState.set('ready');
        },
        error: (err: HttpErrorResponse) =>
          this.loadState.set(err.status === 404 ? 'notFound' : 'error'),
      });
  }

  protected error(field: Field): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || this.submitted())) return null;

    const errors = control.errors ?? {};
    if (typeof errors['duplicate'] === 'string') return errors['duplicate'];

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
    const body: ProductInput = {
      name: v.name.trim(),
      category: v.category.trim(),
      description: v.description.trim() || null,
      imageUrl: v.imageUrl.trim() || null,
      price: v.price as number,
    };

    this.saving.set(true);

    const request$ = this.isEdit
      ? this.api.update(this.productId, body)
      : this.api.create({ ...body, stock: v.stock as number });

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (product) => {
        this.notifier.success(
          `Producto «${product.name}» ${this.isEdit ? 'actualizado' : 'creado'}.`,
        );
        this.router.navigate(['/productos']);
      },
      error: (err: unknown) => this.onSaveError(err),
    });
  }

  private onSaveError(err: unknown): void {
    this.saving.set(false);

    if (err instanceof HttpErrorResponse && err.status === 409) {
      this.form.controls.name.setErrors({
        duplicate: apiErrorMessage(err, 'Ya existe un producto con ese nombre.'),
      });
      this.form.controls.name.markAsTouched();
      document.getElementById('f-name')?.focus();
      return;
    }

    this.formError.set(apiErrorMessage(err, 'No pudimos guardar el producto. Inténtalo de nuevo.'));
  }

  private focusFirstInvalid(): void {
    const order: Field[] = ['name', 'category', 'description', 'price', 'stock', 'imageUrl'];
    const first = order.find((f) => this.form.controls[f].invalid);
    if (first) document.getElementById(`f-${first}`)?.focus();
  }
}
