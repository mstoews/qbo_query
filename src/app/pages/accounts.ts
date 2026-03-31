import { CurrencyPipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QBOService } from '../services/qbo.service';
import { Account } from '../models/account';
import { Toolbar } from './toolbar';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-accounts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, JsonPipe, FormsModule, Toolbar, DialogModule, ButtonModule, InputTextModule],
  template: `
    <qbo-toolbar [inTitle]="'Chart of Accounts'"
      [showRefresh]="true"
      [showDownload]="true"
      [showQuery]="true"
      (refresh)="loadData()"
      (download)="downloadData()"
      (query)="queryData()" />

    @if (loading()) {
      <div class="flex items-center justify-center p-8">
        <span class="text-surface-400">Loading accounts...</span>
      </div>
    } @else if (error()) {
      <div class="p-8 text-red-400">{{ error() }}</div>
    } @else {
      <div class="overflow-auto max-h-[calc(100vh-12rem)]">
        <table class="w-full text-left text-sm text-surface-300">
          <thead class="text-sm font-semibold text-surface-200 border-b border-surface-600 sticky top-0 bg-surface-800 z-10">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Type</th>
              <th class="px-4 py-3">Sub Type</th>
              <th class="px-4 py-3">Classification</th>
              <th class="px-4 py-3 text-right">Balance</th>
              <th class="px-4 py-3 text-center">Active</th>
            </tr>
          </thead>
          <tbody>
            @for (acct of accounts(); track acct.Id) {
              <tr class="border-b border-surface-700 hover:bg-surface-800/50">
                <td class="px-4 py-2" [style.padding-left.px]="acct.SubAccount ? 32 : 16">
                  {{ acct.FullyQualifiedName }}
                </td>
                <td class="px-4 py-2">{{ acct.AccountType }}</td>
                <td class="px-4 py-2">{{ acct.AccountSubType }}</td>
                <td class="px-4 py-2">{{ acct.Classification }}</td>
                <td class="px-4 py-2 text-right"
                  [class.text-green-400]="acct.CurrentBalance > 0"
                  [class.text-red-400]="acct.CurrentBalance < 0">
                  {{ acct.CurrentBalance | currency: acct.CurrencyRef.value }}
                </td>
                <td class="px-4 py-2 text-center">
                  @if (acct.Active) {
                    <span class="text-green-400">Yes</span>
                  } @else {
                    <span class="text-red-400">No</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <p-dialog header="Query Accounts" [(visible)]="queryDialogVisible" [modal]="true" [style]="{ width: '36rem' }">
      <div class="flex flex-col gap-4 p-2">
        <label class="text-sm text-surface-400">QBO Query</label>
        <input type="text" pInputText [(ngModel)]="queryText"
          placeholder="SELECT * FROM Account WHERE AccountType = 'Bank'" class="w-full" />
        @if (queryError()) {
          <div class="text-red-400 text-sm">{{ queryError() }}</div>
        }
        @if (queryResult()) {
          <pre class="text-xs text-surface-300 bg-surface-800 p-3 rounded overflow-auto max-h-64">{{ queryResult() | json }}</pre>
        }
      </div>
      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button label="Cancel" severity="secondary" (onClick)="queryDialogVisible.set(false)" />
          <p-button label="Run Query" (onClick)="runQuery()" [loading]="queryLoading()" />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class AccountsComponent implements OnInit {
  private readonly qboService = inject(QBOService);

  protected readonly accounts = signal<Account[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly queryDialogVisible = signal(false);
  protected readonly queryText = signal("SELECT * FROM Account WHERE AccountType = 'Bank'");
  protected readonly queryLoading = signal(false);
  protected readonly queryError = signal('');
  protected readonly queryResult = signal<unknown>(null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.qboService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load accounts. Retry after QBO Login.');
        this.loading.set(false);
      },
    });
  }

  downloadData(): void {
    // this.qboService.downloadAccounts();
  }

  queryData(): void {
    this.queryError.set('');
    this.queryResult.set(null);
    this.queryDialogVisible.set(true);
  }

  runQuery(): void {
    const q = this.queryText();
    if (!q.trim()) return;
    this.queryLoading.set(true);
    this.queryError.set('');
    this.queryResult.set(null);
    this.qboService.query(q).subscribe({
      next: (result) => {
        this.queryResult.set(result);
        this.queryLoading.set(false);
      },
      error: () => {
        this.queryError.set('Query failed. Check syntax or retry after QBO Login.');
        this.queryLoading.set(false);
      },
    });
  }
}
