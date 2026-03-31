import { Component, computed, input, output } from '@angular/core';
import { ImportsModule } from '../services/primeng_imports';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  color: string;
  visible?: boolean;
}

@Component({
  selector: 'qbo-toolbar',
  imports: [ImportsModule],
  template: `
      <div class="w-full bg-slate-800 dark:bg-slate-950 px-6 py-2 overflow-x-auto">
        <div class="flex items-center gap-1 min-w-max">
        <div class="text-slate-200 text-lg font-semibold">
          {{ inTitle() }}
        </div>

        @for (nav of navItems(); track nav.label) {
            @if (nav.visible === true) {
              <button
                class="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap"
                (click)="navigate(nav.route)">
                <div class="w-7 h-7 rounded-full flex items-center justify-center" [style.background]="nav.color">
                  <i [class]="nav.icon + ' text-white text-xs'"></i>
                </div>
                {{ nav.label }}
              </button>
            }
           }
           <span class="flex-1"></span>

      </div>
  </div>

    `,
  styles: [`
    /* Add your styles here */
  `],
})
export class Toolbar {

  inTitle = input<string>("Menu Bar Title");

  showRefresh = input<boolean>(true);
  showDownload = input<boolean>(true);
  showQuery = input<boolean>(true);


  refresh = output();
  download = output();
  query = output();



  readonly navItems = computed<NavItem[]>(() => [
    { label: "Refresh", icon: "pi pi-save", route: "refresh", color: "#1a6b3c", visible: this.showRefresh() },
    { label: "Download", icon: "pi pi-plus", route: "download", color: "#ef4444", visible: this.showDownload() },
    { label: "Query", icon: "pi pi-copy", route: "query", color: "#2563eb", visible: this.showQuery() },

  ]);

  navigate(route: string) {
    const actions: Record<string, () => void> =
    {
      'refresh': () => this.refresh.emit(),
      'download': () => this.download.emit(),
      'query': () => this.query.emit(),
    };
    actions[route]?.();
  }

}
