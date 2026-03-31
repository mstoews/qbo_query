import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { QBOService } from '../services/qbo.service';
import { TrialBalanceColumn, TrialBalanceRow } from '../models/trial-balance';
import { Toolbar } from './toolbar';

@Component({
  selector: 'app-trial-balance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Toolbar],
  template: `
    <qbo-toolbar [inTitle]="'Trial Balance'" [showRefresh]="true" [showDownload]="true" [showQuery]="true" />

    @if (loading()) {
      <div class="flex items-center justify-center p-8">
        <span class="text-surface-400">Loading trial balance...</span>
      </div>
    } @else if (error()) {
      <div class="p-8 text-red-400">{{ error() }}</div>
    } @else {
      <div class="overflow-auto max-h-[calc(100vh-12rem)]">
        <table class="w-full text-left text-sm text-surface-300">
          <thead class="text-sm font-semibold text-surface-200 border-b border-surface-600 sticky top-0 bg-surface-800 z-10">
            <tr>
              @for (col of columns(); track col.ColType) {
                <th class="px-4 py-3" [class.text-right]="col.ColType === 'Money'">
                  {{ col.ColTitle }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track $index) {
              @if (row.ColData) {
                <tr class="border-b border-surface-700 hover:bg-surface-800/50">
                  @for (cell of row.ColData; track $index) {
                    <td class="px-4 py-2" [class.text-right]="columns()[$index]?.ColType === 'Money'">
                      {{ cell.value }}
                    </td>
                  }
                </tr>
              }
              @if (row.Summary) {
                <tr class="bg-surface-800 border-t border-surface-600 font-semibold">
                  @for (cell of row.Summary.ColData; track $index) {
                    <td class="px-4 py-2" [class.text-right]="columns()[$index]?.ColType === 'Money'">
                      {{ cell.value }}
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class TrialBalanceComponent implements OnInit {
  private readonly qboService = inject(QBOService);

  protected readonly columns = signal<TrialBalanceColumn[]>([]);
  protected readonly rows = signal<TrialBalanceRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.qboService.getTrialBalance('2024-01-01', '2026-12-31').subscribe({
      next: (data) => {
        this.columns.set(data.Columns.Column);
        this.rows.set(data.Rows.Row);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load trial balance. Retry after QBO Login.');
        this.loading.set(false);
      },
    });
  }
}
