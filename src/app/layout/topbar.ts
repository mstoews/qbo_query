import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Avatar } from 'primeng/avatar';
import { BadgeDirective } from 'primeng/badge';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Avatar, BadgeDirective],
  template: `
    <header class="sticky top-0 z-50 flex items-center justify-between h-16 px-6 bg-slate-900 border-b border-slate-700 text-slate-200">
      <!-- Left side -->
      <div class="flex items-center gap-4">
        <p-button
          icon="pi pi-bars"
          [text]="true"
          [rounded]="true"
          severity="secondary"
          (onClick)="toggleSidebar.emit()"
        />
        <span class="text-lg font-semibold "></span>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-2">
        <p-button icon="pi pi-search" [text]="true" [rounded]="true" severity="secondary" />
        <p-button icon="pi pi-cog" [text]="true" [rounded]="true" severity="secondary" />
        <p-button
          icon="pi pi-bell"
          [text]="true"
          [rounded]="true"
          severity="secondary"
          pBadge
          value="4"
          badgeSeverity="danger"
        />
        <p-avatar
          image="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"
          shape="circle"
          class="ml-2 cursor-pointer"
        />
        <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary" />
      </div>
    </header>
  `,
})
export class Topbar {
  toggleSidebar = output();
}
