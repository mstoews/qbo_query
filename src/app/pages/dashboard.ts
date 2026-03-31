import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-0">Welcome, {{ authService.displayName() }}</h1>
        <p class="text-surface-400 mt-1">QBO Downloads Dashboard</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div (click)="navigate('/transactions')"
          class="bg-white/10 border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/20 transition-colors">
          <div class="flex items-center gap-3 mb-2">
            <i class="pi pi-bookmark text-xl text-primary-400"></i>
            <h2 class="text-lg font-semibold text-surface-0">Transactions</h2>
          </div>
          <p class="text-surface-400 text-sm">View and manage QBO transactions.</p>
        </div>

        <div (click)="navigate('/journal-entries')"
          class="bg-white/10 border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/20 transition-colors">
          <div class="flex items-center gap-3 mb-2">
            <i class="pi pi-book text-xl text-primary-400"></i>
            <h2 class="text-lg font-semibold text-surface-0">Journal Entries</h2>
          </div>
          <p class="text-surface-400 text-sm">Browse journal entries from QuickBooks Online.</p>
        </div>

        <div (click)="navigate('/qbo-login')"
          class="bg-white/10 border border-white/10 rounded-xl p-6 cursor-pointer hover:bg-white/20 transition-colors">
          <div class="flex items-center gap-3 mb-2">
            <i class="pi pi-sign-in text-xl text-primary-400"></i>
            <h2 class="text-lg font-semibold text-surface-0">QBO Connect</h2>
          </div>
          <p class="text-surface-400 text-sm">Connect to your QuickBooks Online account.</p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
