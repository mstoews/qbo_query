import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { QBOService } from '../services/qbo.service';
import { ExportService } from '../services/export.service';
import { JournalEntry } from '../models/journal-entry';
import { TransactionListRow, TransactionListColumn } from '../models/transaction-list';
import { GeneralLedgerRowsRowItem, GeneralLedgerColumnsColumnItem } from '../models/general-ledger';
import { Account } from '../models/account';
import { Customer } from '../models/customer';
import { Vendor } from '../models/vendor';

interface QBOState {
  journalEntryCount: number;
  transactionCount: number;
  generalLedgerSectionCount: number;
  journalEntries: JournalEntry[];
  Accounts: Account[];
  Customers: Customer[];
  Vendors: Vendor[];
  transactionRows: TransactionListRow[];
  transactionColumns: TransactionListColumn[];
  generalLedgerSections: GeneralLedgerRowsRowItem[];
  generalLedgerColumns: GeneralLedgerColumnsColumnItem[];
  loading: boolean;
  error: string;
}

const initialState: QBOState = {
  journalEntries: [],
  transactionRows: [],
  transactionColumns: [],
  generalLedgerSections: [],
  generalLedgerColumns: [],
  Accounts: [],
  Customers: [],
  Vendors: [],
  journalEntryCount: 0,
  transactionCount: 0,
  generalLedgerSectionCount: 0,
  loading: false,
  error: '',
};

export const QBOStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    journalEntryCount: computed(() => store.journalEntries().length),
    transactionCount: computed(() => store.transactionRows().length),
    generalLedgerSectionCount: computed(() => store.generalLedgerSections().length),
  })),
  withMethods((store, qboService = inject(QBOService), exportService = inject(ExportService)) => ({
    loadJournalEntries: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: '' })),
        switchMap(() =>
          qboService.getJournalEntries().pipe(
            tap((entries) => patchState(store, { journalEntries: entries, loading: false })),
            catchError(() => {
              patchState(store, { error: 'Failed to load. Retry after QBO Login', loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    loadAccounts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: '' })),
        switchMap(() =>
          qboService.getAccounts().pipe(
            tap((accounts) => patchState(store, {
              Accounts: accounts, loading: false
            })),
            catchError(() => {
              patchState(store, { error: 'Failed to load accounts. Retry after QBO Login.', loading: false });
              return EMPTY;
            }
            ),
          ),
        ),
      )
    ),

    loadVendors: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: '' })),
        switchMap(() =>
          qboService.getVendors().pipe(
            tap((vendors) => patchState(store, { Vendors: vendors, loading: false })),
            catchError(() => {
              patchState(store, { error: 'Failed to load vendors. Retry after QBO Login.', loading: false });
              return EMPTY;
            }
            ),
          ),
        ),
      )
    ),

    loadCustomers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: '' })),
        switchMap(() =>
          qboService.getCustomers().pipe(
            tap((customers) => patchState(store, { Customers: customers, loading: false })),
            catchError(() => {
              patchState(store, { error: 'Failed to load customers. Retry after QBO Login.', loading: false });
              return EMPTY;
            }
            ),
          ),
        ),
      )
    ),

    downloadJournalEntries(): void {
      const entries = store.journalEntries();
      const rows = entries.flatMap((entry) =>
        entry.Line.map((line) => ({
          DocNumber: entry.DocNumber,
          TxnDate: entry.TxnDate,
          Account: line.JournalEntryLineDetail.AccountRef.name,
          Department: line.JournalEntryLineDetail.DepartmentRef?.name ?? '',
          Description: line.Description,
          PostingType: line.JournalEntryLineDetail.PostingType,
          Amount: line.Amount,
          Currency: entry.CurrencyRef.value,
        })),
      );
      exportService.downloadCsv(rows, 'journal-entries.csv');
    },

    downloadJournalEntriesExcel(): void {
      const entries = store.journalEntries();
      const rows = entries.flatMap((entry) =>
        entry.Line.map((line) => ({
          DocNumber: entry.DocNumber,
          TxnDate: entry.TxnDate,
          Account: line.JournalEntryLineDetail.AccountRef.name,
          Department: line.JournalEntryLineDetail.DepartmentRef?.name ?? '',
          Description: line.Description,
          PostingType: line.JournalEntryLineDetail.PostingType,
          Amount: line.Amount,
          Currency: entry.CurrencyRef.value,
        })),
      );
      exportService.downloadExcel(rows, 'journal-entries.xlsx', 'Journal Entries');
    },

    downloadTransactions(): void {
      const columns = store.transactionColumns();
      const rows = store.transactionRows().map((row) => {
        const obj: Record<string, string> = {};
        row.ColData.forEach((cell, i) => {
          obj[columns[i]?.ColTitle ?? `Col${i}`] = cell.value;
        });
        return obj;
      });
      exportService.downloadCsv(rows, 'transactions.csv');
    },

    downloadTransactionsExcel(): void {
      const columns = store.transactionColumns();
      const rows = store.transactionRows().map((row) => {
        const obj: Record<string, string> = {};
        row.ColData.forEach((cell, i) => {
          obj[columns[i]?.ColTitle ?? `Col${i}`] = cell.value;
        });
        return obj;
      });
      exportService.downloadExcel(rows, 'transactions.xlsx', 'Transactions');
    },

    loadTransactions: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: '' })),
        switchMap(() =>
          qboService.getTransactions().pipe(
            tap((data) =>
              patchState(store, {
                transactionRows: data.Rows.Row,
                transactionColumns: data.Columns.Column,
                loading: false,
              }),
            ),
            catchError(() => {
              patchState(store, { error: 'Failed to load transactions. Retry after QBO Login.', loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    loadGeneralLedger: rxMethod<{ startDate: string; endDate: string }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: '' })),
        switchMap(({ startDate, endDate }) =>
          qboService.getGeneralLedger(startDate, endDate).pipe(
            tap((data) =>
              patchState(store, {
                generalLedgerSections: data.Rows.Row,
                generalLedgerColumns: data.Columns.Column,
                loading: false,
              }),
            ),
            catchError(() => {
              patchState(store, { error: 'Failed to load general ledger. Retry after QBO Login.', loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    ),

    downloadGeneralLedger(): void {
      const columns = store.generalLedgerColumns();
      const rows = store.generalLedgerSections().flatMap((section) =>
        section.Rows.Row.map((row) => {
          const obj: Record<string, string> = { Account: section.Header.ColData[0].value };
          row.ColData.forEach((cell, i) => {
            obj[columns[i]?.ColTitle ?? `Col${i}`] = cell.value;
          });
          return obj;
        }),
      );
      exportService.downloadCsv(rows, 'general-ledger.csv');
    },

    downloadGeneralLedgerExcel(): void {
      const columns = store.generalLedgerColumns();
      const rows = store.generalLedgerSections().flatMap((section) =>
        section.Rows.Row.map((row) => {
          const obj: Record<string, string> = { Account: section.Header.ColData[0].value };
          row.ColData.forEach((cell, i) => {
            obj[columns[i]?.ColTitle ?? `Col${i}`] = cell.value;
          });
          return obj;
        }),
      );

      exportService.downloadExcel(rows, 'general-ledger.xlsx', 'General Ledger');
    },
  })),
);
