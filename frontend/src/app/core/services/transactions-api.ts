import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/paged-result';
import {
  Transaction,
  TransactionQuery,
  NewTransactionInput,
  UpdateTransactionInput,
} from '../models/transaction';

@Injectable({ providedIn: 'root' })
export class TransactionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.transactionsApiUrl}/transactions`;

  list(query: TransactionQuery): Observable<PagedResult<Transaction>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);

    if (query.type) params = params.set('type', query.type);
    if (query.productId) params = params.set('productId', query.productId);
    if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params = params.set('dateTo', query.dateTo);

    return this.http.get<PagedResult<Transaction>>(this.baseUrl, { params });
  }

  get(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.baseUrl}/${id}`);
  }

  create(body: NewTransactionInput): Observable<Transaction> {
    return this.http.post<Transaction>(this.baseUrl, body);
  }

  update(id: number, body: UpdateTransactionInput): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.baseUrl}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
