import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { QBOStore } from '../store/qbo.store';
import { Toolbar } from './toolbar';
import { flattenGeneralLedger } from '../models/general-ledger';

@Component({
  selector: 'app-general-ledger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Toolbar],
  template: `
    <qbo-toolbar [inTitle]="'General Ledger'"></qbo-toolbar>

    @if (store.loading()) {
      <div class="flex items-center justify-center p-8">
        <span class="text-surface-400">Loading general ledger...</span>
      </div>
    } @else if (store.error()) {
      <div class="p-8 text-red-400">{{ store.error() }}</div>
    } @else {
      <div class="overflow-auto max-h-[calc(100vh-12rem)]">
        <table class="w-full text-left text-sm text-surface-300">
          <thead class="text-sm font-semibold text-surface-200 border-b border-surface-600 sticky top-0 bg-surface-800 z-10">
            <tr>
              <th class="px-4 py-3">Account</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Transaction Type</th>
              <th class="px-4 py-3">Num</th>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Memo/Description</th>
              <th class="px-4 py-3">Split</th>
              <th class="px-4 py-3 text-right">Amount</th>
              <th class="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            @for (row of flatRows(); track $index) {
              <tr class="border-b border-surface-700 hover:bg-surface-800/50">
                <td class="px-4 py-2">{{ row.account }}</td>
                <td class="px-4 py-2">{{ row.date }}</td>
                <td class="px-4 py-2">{{ row.transactionType }}</td>
                <td class="px-4 py-2">{{ row.num }}</td>
                <td class="px-4 py-2">{{ row.name }}</td>
                <td class="px-4 py-2">{{ row.memo }}</td>
                <td class="px-4 py-2">{{ row.split }}</td>
                <td class="px-4 py-2 text-right">{{ row.amount }}</td>
                <td class="px-4 py-2 text-right">{{ row.balance }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class GeneralLedgerComponent implements OnInit {
  protected readonly store = inject(QBOStore);

  protected readonly flatRows = computed(() =>
    flattenGeneralLedger(this.store.generalLedgerSections(), this.store.generalLedgerColumns()),
  );

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.store.loadGeneralLedger({ startDate: '2025-01-01', endDate: '2025-12-31' });
  }
}
