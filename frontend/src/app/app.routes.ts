import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'productos' },
  {
    path: 'productos',
    title: 'Productos · JM Boutique',
    loadComponent: () =>
      import('./features/products/product-list/product-list').then((m) => m.ProductList),
  },
  {
    path: 'productos/nuevo',
    title: 'Nuevo producto · JM Boutique',
    loadComponent: () =>
      import('./features/products/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'productos/:id/editar',
    title: 'Editar producto · JM Boutique',
    loadComponent: () =>
      import('./features/products/product-form/product-form').then((m) => m.ProductForm),
  },
  {
    path: 'movimientos',
    title: 'Movimientos · JM Boutique',
    loadComponent: () =>
      import('./features/transactions/transaction-list/transaction-list').then(
        (m) => m.TransactionList,
      ),
  },
  {
    path: 'movimientos/nuevo',
    title: 'Registrar movimiento · JM Boutique',
    loadComponent: () =>
      import('./features/transactions/transaction-form/transaction-form').then(
        (m) => m.TransactionForm,
      ),
  },
  {
    path: 'movimientos/:id/editar',
    title: 'Editar movimiento · JM Boutique',
    loadComponent: () =>
      import('./features/transactions/transaction-form/transaction-form').then(
        (m) => m.TransactionForm,
      ),
  },
  {
    path: '**',
    title: 'Página no encontrada · JM Boutique',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];