import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { QBOService } from '../services/qbo.service';
import { ProfitAndLossColumn, ProfitAndLossRow } from '../models/profit-and-loss';
import { Toolbar } from './toolbar';

@Component({
  selector: 'app-profit-and-loss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, Toolbar],
  template: `
    <qbo-toolbar [inTitle]="'Profit and Loss'"></qbo-toolbar>

    @if (loading()) {
      <div class="flex items-center justify-center p-8">
        <span class="text-surface-400">Loading profit &amp; loss...</span>
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
              <ng-container *ngTemplateOutlet="rowTpl; context: { $implicit: row, depth: 0 }" />
            }
          </tbody>
        </table>
      </div>
    }

    <ng-template #rowTpl let-row let-depth="depth">
      @if (row.Header) {
        <tr class="bg-surface-800/80">
          <td class="px-4 py-2 font-semibold text-surface-100" [style.padding-left.px]="16 + depth * 16"
            [attr.colspan]="columns().length">
            {{ row.Header.ColData[0].value }}
          </td>
        </tr>
      }
      @if (row.Rows?.Row) {
        @for (child of row.Rows.Row; track $index) {
          <ng-container *ngTemplateOutlet="rowTpl; context: { $implicit: child, depth: depth + 1 }" />
        }
      }
      @if (row.ColData) {
        <tr class="border-b border-surface-700 hover:bg-surface-800/50">
          @for (cell of row.ColData; track $index; let first = $first) {
            <td class="px-4 py-2"
              [style.padding-left.px]="first ? 16 + depth * 16 : 16"
              [class.text-right]="columns()[$index]?.ColType === 'Money'">
              {{ cell.value }}
            </td>
          }
        </tr>
      }
      @if (row.Summary) {
        <tr class="bg-surface-800 border-t border-surface-600">
          @for (cell of row.Summary.ColData; track $index; let first = $first) {
            <td class="px-4 py-2 font-semibold"
              [style.padding-left.px]="first ? 16 + depth * 16 : 16"
              [class.text-right]="columns()[$index]?.ColType === 'Money'">
              {{ cell.value }}
            </td>
          }
        </tr>
      }
    </ng-template>
  `,
})
export class ProfitAndLossComponent implements OnInit {
  private readonly qboService = inject(QBOService);

  protected readonly columns = signal<ProfitAndLossColumn[]>([]);
  protected readonly rows = signal<ProfitAndLossRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.qboService.getProfitAndLoss('2024-01-01', '2026-12-31').subscribe({
      next: (data) => {
        this.columns.set(data.Columns.Column);
        this.rows.set(data.Rows.Row);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load profit & loss. Retry after QBO Login.');
        this.loading.set(false);
      },
    });
  }
}
