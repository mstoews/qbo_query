import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Ripple],
  template: `
    <aside
      class="fixed top-0 left-0 z-40 h-screen transition-transform bg-slate-900 border-r border-slate-700"
      [class.w-64]="!collapsed()"
      [class.w-0]="collapsed()"
      [class.overflow-hidden]="collapsed()"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 py-4 border-b border-slate-700">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-contrast">
          <i class="pi pi-bolt text-lg"></i>
        </div>
        <span class="text-xl font-bold text-white">NBL API</span>
      </div>

      <!-- Menu -->
      <nav class="flex flex-col h-[calc(100vh-65px)] px-3 py-4">
        @for (section of menuSections; track section.title) {
          <div class="mb-4">
            <p class="px-3 mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
              {{ section.title }}
            </p>
            <ul class="space-y-1">
              @for (item of section.items; track item.label) {
                @if (item.route) {
                  <li>
                    <a [routerLink]="item.route"  routerLinkActive="bg-primary/10 text-primary"
                      pRipple  class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"                    >
                      <i [class]="item.icon"></i>
                      <span class="text-sm font-medium">{{ item.label }}</span>
                    </a>
                  </li>
                }
              }
            </ul>
          </div>
        }
        <div class="mt-auto border-t border-slate-700 pt-4">
          <a pRipple
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            (click)="loginQBO()" >
            <i class="pi pi-sign-out"></i>
            <span class="text-sm font-medium">Login QBO</span>
          </a>
          <a pRipple
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            (click)="logout()" >
            <i class="pi pi-sign-in"></i>
            <span class="text-sm font-medium">Log Out</span>
          </a>
        </div>
      </nav>
    </aside>
  `,
})
export class Sidebar {
  private authService = inject(AuthService);
  collapsed = input(false);

  menuSections: MenuSection[] = [
    {
      title: 'Dashboards',
      items: [
        { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/dashboard' },
      ],
    },
    {
      title: 'Transactions',
      items: [
        { label: 'Journal Entries', icon: 'pi pi-book', route: '/journal-entries' },
        { label: 'Transactions', icon: 'pi pi-arrow-right-arrow-left', route: '/transactions' },
        { label: 'General Ledger', icon: 'pi pi-list', route: '/general-ledger' },
      ],
    },
    {
      title: 'Lists',
      items: [
        { label: 'Accounts', icon: 'pi pi-wallet', route: '/accounts' },
        { label: 'Customers', icon: 'pi pi-users', route: '/customers' },
        { label: 'Vendors', icon: 'pi pi-truck', route: '/vendors' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { label: 'Trial Balance', icon: 'pi pi-file-edit', route: '/trial-balance' },
        { label: 'Balance Sheet', icon: 'pi pi-chart-pie', route: '/balance-sheet' },
        { label: 'Profit & Loss', icon: 'pi pi-chart-line', route: '/profit-and-loss' },
      ],
    },
  ];

  loginQBO() {

    var path = environment.apiUrl + 'qbo_login';
    var parameters = "location=1,width=650,height=650";
    parameters += ",left=" + (screen.width - 650) / 2 + ",top=" + (screen.height - 650) / 2;

    console.log('Opening QBO login popup with URL:', path);

    var win = window.open(path, 'connectPopup', parameters);

    // Poll for popup closure as a fallback (some browsers block postMessage cross-origin)
    var pollTimer = setInterval(function () {
      if (win && win.closed) {
        clearInterval(pollTimer);
      }
    }, 500);

  }

  logout() {
    this.authService.logout();
  }
}
