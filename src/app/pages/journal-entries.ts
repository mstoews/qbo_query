import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { QBOStore } from '../store/qbo.store';
import { Toolbar } from "./toolbar";

@Component({
  selector: 'app-journal-entries',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, CurrencyPipe, Toolbar],
  template: `
    <qbo-toolbar [inTitle]="'Journal Entries'"></qbo-toolbar>

    @if (store.loading()) {
      <div class="flex items-center justify-center p-8">
        <span class="text-surface-400">Loading journal entries...</span>
      </div>
    } @else if (store.error()) {
      <div class="p-8 text-red-400">{{ store.error() }}</div>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-surface-300">
          <thead class="text-sm font-semibold text-surface-200 border-b border-surface-600 sticky top-0 bg-surface-800 z-10">
            <tr>
              <th class="px-4 py-3">Doc #</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Account</th>
              <th class="px-4 py-3">Department</th>
              <th class="px-4 py-3">Description</th>
              <th class="px-4 py-3 text-right">Debit</th>
              <th class="px-4 py-3 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of store.journalEntries(); track entry.Id) {
              @for (line of entry.Line; track line.Id; let first = $first) {
                <tr class="border-b border-surface-700 hover:bg-surface-800/50">
                  <td class="px-4 py-2">{{ first ? entry.DocNumber : '' }}</td>
                  <td class="px-4 py-2">{{ first ? (entry.TxnDate | date: 'mediumDate') : '' }}</td>
                  <td class="px-4 py-2">{{ line.JournalEntryLineDetail.AccountRef.name }}</td>
                  <td class="px-4 py-2">{{ line.JournalEntryLineDetail.DepartmentRef?.name }}</td>
                  <td class="px-4 py-2">{{ line.Description }}</td>
                  <td class="px-4 py-2 text-right">
                    {{ line.JournalEntryLineDetail.PostingType === 'Debit' ? (line.Amount | currency: entry.CurrencyRef.value) : '' }}
                  </td>
                  <td class="px-4 py-2 text-right">
                    {{ line.JournalEntryLineDetail.PostingType === 'Credit' ? (line.Amount | currency: entry.CurrencyRef.value) : '' }}
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class JournalEntriesComponent implements OnInit {
  protected readonly store = inject(QBOStore);

  ngOnInit(): void {
    this.store.loadJournalEntries();
  }

  refresh(): void {
    this.store.loadJournalEntries();
  }

  downloadData(): void {
    // this.qboService.downloadAccounts();
  }

  queryData(): void {

  }

  runQuery(): void {
  }

}
