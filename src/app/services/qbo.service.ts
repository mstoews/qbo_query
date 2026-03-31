import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { JournalEntry, JournalEntryResponse } from '../models/journal-entry';
import { BalanceSheetResponse } from '../models/balance-sheet';
import { ProfitAndLossResponse } from '../models/profit-and-loss';
import { TransactionListResponse } from '../models/transaction-list';
import { TrialBalanceResponse } from '../models/trial-balance';
import { Account, AccountResponse } from '../models/account';
import { Customer, CustomerResponse } from '../models/customer';
import { Vendor, VendorResponse } from '../models/vendor';
import { GeneralLedgerResponse } from '../models/general-ledger';

@Injectable({ providedIn: 'root' })
export class QBOService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  login(): void {
    window.open(`${this.apiUrl}qbo_login`, '_blank');
  }

  getTransactions(): Observable<TransactionListResponse> {
    return this.http.get<TransactionListResponse>(
      `${this.apiUrl}qbo/transaction_list?start_date=2025-01-01&end_date=2025-12-31`);
  }

  getGeneralLedger(startDate: string, endDate: string): Observable<GeneralLedgerResponse> {
    return this.http.get<GeneralLedgerResponse>(
      `${this.apiUrl}qbo/general_ledger?start_date=${startDate}&end_date=${endDate}`
    );
  }

  getJournalEntries(): Observable<JournalEntry[]> {
    const url = `${this.apiUrl}qbo/journal_entries?year=2025`;
    return this.http
      .get<JournalEntryResponse>(url)
      .pipe(map((res) => res.journal_entries));
  }

  getTrialBalance(startDate: string, endDate: string): Observable<TrialBalanceResponse> {
    return this.http.get<TrialBalanceResponse>(
      `${this.apiUrl}qbo/trial_balance?start_date=${startDate}&end_date=${endDate}`);
  }

  query(query: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}qbo/query`, { query });
  }

  getAccounts(): Observable<Account[]> {
    return this.http.get<AccountResponse>(`${this.apiUrl}qbo/accounts`)
      .pipe(map((res) => res.QueryResponse.Account));
  }

  getProfitAndLoss(startDate: string, endDate: string): Observable<ProfitAndLossResponse> {
    return this.http.get<ProfitAndLossResponse>(
      `${this.apiUrl}qbo/profit_and_loss?start_date=${startDate}&end_date=${endDate}`);
  }

  getBalanceSheet(startDate: string, endDate: string): Observable<BalanceSheetResponse> {
    return this.http.get<BalanceSheetResponse>(
      `${this.apiUrl}qbo/balance_sheet?start_date=${startDate}&end_date=${endDate}`);
  }

  getBankTransactions(startDate: string, endDate: string, account: string): Observable<unknown> {
    return this.http.get(
      `${this.apiUrl}qbo/bank_transactions?start_date=${startDate}&end_date=${endDate}&account=${account}`);
  }

  getVendors(): Observable<Vendor[]> {
    return this.http.get<VendorResponse>(`${this.apiUrl}qbo/vendors`)
      .pipe(map((res) => res.QueryResponse.Vendor));
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}qbo/customers`)
      .pipe(map((res) => res.QueryResponse.Customer));
  }
}


