import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal, OnInit } from '@angular/core';
import { TransactionListRow, TransactionListColumn } from '../models/transaction-list';
import { QBOService } from '../services/qbo.service';
import { Toolbar } from './toolbar';
import { QBOStore } from '../store/qbo.store';

@Component({
  selector: 'app-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Toolbar],
  template: `
    <qbo-toolbar [inTitle]="'Transactions'"
      [showRefresh]="true"
      [showDownload]="true"
      [showQuery]="true"
      (refresh)="loadData()"
      (download)="downloadData()"
      (query)="queryData()"
    ></qbo-toolbar>

    @if (loading()) {
      <div class="flex items-center justify-center p-8">
        <span class="text-surface-400">Loading transactions...</span>
      </div>
    } @else if (error()) {
      <div class="p-8 text-red-400">{{ error() }}</div>
    } @else {
      <div class="overflow-auto max-h-[calc(100vh-12rem)]">
        <table class="w-full text-left text-sm text-surface-300">
          <thead class="text-sm font-semibold text-surface-200 border-b border-surface-600 sticky top-0 bg-surface-800 z-10">
            <tr>
              @for (col of columns(); track col.ColType) {
                <th class="px-4 py-3 whitespace-nowrap" [class.text-right]="col.ColType === 'subt_nat_amount'" [style.width]="$first ? '120px' : null">{{ col.ColTitle }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track $index) {
              <tr class="border-b border-surface-700 hover:bg-surface-800/50">
                @for (cell of row.ColData; track $index) {
                  <td class="px-4 py-2 whitespace-nowrap" [class.text-right]="columns()[$index]?.ColType === 'subt_nat_amount'">
                    {{ cell.value }}
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class TransactionsComponent implements OnInit {
  private readonly qboService = inject(QBOService);
  private readonly qboStore = inject(QBOStore);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly columns = signal<TransactionListColumn[]>([]);
  protected readonly rows = signal<TransactionListRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.error.set('');
    this.qboService.getTransactions().subscribe({
      next: (data) => {
        this.columns.set(data.Columns.Column);
        this.rows.set(data.Rows.Row);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('Failed to load. Retry after QBO Login');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  loadData() {
    this.loadTransactions();
  }
  downloadData() {
    this.qboStore.downloadTransactions();
  }
  queryData() {
    throw new Error('Method not implemented.');
  }

}
