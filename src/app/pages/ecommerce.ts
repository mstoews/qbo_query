import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-ecommerce',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    <p-card>
      <ng-template #header>
        <div class="px-6 pt-5">
          <h3 class="text-lg font-semibold text-surface-900">E-Commerce Dashboard</h3>
        </div>
      </ng-template>
      <p class="text-surface-600">E-Commerce dashboard content goes here.</p>
    </p-card>
  `,
})
export class Ecommerce {}
