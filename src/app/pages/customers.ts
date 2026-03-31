import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { QBOService } from '../services/qbo.service';
import { Customer } from '../models/customer';
import { Toolbar } from './toolbar';

@Component({
  selector: 'app-customers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, Toolbar],
  template: `
    <qbo-toolbar [inTitle]="'Customers'" [showRefresh]="true" [showDownload]="true" [showQuery]="true" />

    @if (loading()) {
      <div class="flex items-center justify-center p-8">
        <span class="text-surface-400">Loading customers...</span>
      </div>
    } @else if (error()) {
      <div class="p-8 text-red-400">{{ error() }}</div>
    } @else {
      <div class="overflow-auto max-h-[calc(100vh-12rem)]">
        <table class="w-full text-left text-sm text-surface-300">
          <thead class="text-sm font-semibold text-surface-200 border-b border-surface-600 sticky top-0 bg-surface-800 z-10">
            <tr>
              <th class="px-4 py-3">Display Name</th>
              <th class="px-4 py-3">Company</th>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Phone</th>
              <th class="px-4 py-3 text-right">Balance</th>
              <th class="px-4 py-3 text-center">Active</th>
            </tr>
          </thead>
          <tbody>
            @for (cust of customers(); track cust.Id) {
              <tr class="border-b border-surface-700 hover:bg-surface-800/50">
                <td class="px-4 py-2">{{ cust.DisplayName }}</td>
                <td class="px-4 py-2">{{ cust.CompanyName ?? '' }}</td>
                <td class="px-4 py-2">{{ cust.PrimaryEmailAddr?.Address ?? '' }}</td>
                <td class="px-4 py-2">{{ cust.PrimaryPhone?.FreeFormNumber ?? '' }}</td>
                <td class="px-4 py-2 text-right">
                  {{ cust.Balance | currency: cust.CurrencyRef.value }}
                </td>
                <td class="px-4 py-2 text-center">
                  @if (cust.Active) {
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
  `,
})
export class CustomersComponent implements OnInit {
  private readonly qboService = inject(QBOService);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.qboService.getCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load customers. Retry after QBO Login.');
        this.loading.set(false);
      },
    });
  }
}
