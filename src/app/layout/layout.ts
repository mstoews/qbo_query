import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Sidebar, Topbar],
  template: `
    <div class="min-h-screen bg-slate-800 text-slate-200">
      <app-sidebar [collapsed]="sidebarCollapsed()" />

      <div
        class="transition-all"
        [class.ml-64]="!sidebarCollapsed()"
        [class.ml-0]="sidebarCollapsed()"
      >
        <app-topbar (toggleSidebar)="toggleSidebar()" />

        <main class="p-6 ">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Layout {
  sidebarCollapsed = signal(false);

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }
}
