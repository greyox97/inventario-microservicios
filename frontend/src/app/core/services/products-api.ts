import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result';
import { Product, ProductQuery } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.productsApiUrl}/products`;

  list(query: ProductQuery): Observable<PagedResult<Product>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);

    if (query.name) params = params.set('name', query.name);
    if (query.category) params = params.set('category', query.category);
    if (query.inStock) params = params.set('inStock', true);

    return this.http.get<PagedResult<Product>>(this.baseUrl, { params });
  }

  categories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/categories`);
  }
}
