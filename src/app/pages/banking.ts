import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-banking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    <p-card >
      <ng-template #header>
        <div class="px-6 pt-5 ">
          <h3 class="text-lg font-semibold">Banking Dashboard</h3>
        </div>
      </ng-template>
      <p>Banking dashboard content goes here.</p>
    </p-card>
  `,
})
export class Banking {}
