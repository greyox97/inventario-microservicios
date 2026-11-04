import { TestBed } from '@angular/core/testing';
import { TransactionsApi } from './transactions-api';

describe('TransactionsApi', () => {
  let service: TransactionsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TransactionsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
