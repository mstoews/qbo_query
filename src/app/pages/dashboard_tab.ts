import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Tag],
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Sales Performance -->
      <p-card>
        <ng-template #header>
          <div class="px-6 pt-5">
            <h3 class="text-lg font-semibold text-white">Sales Performance</h3>
          </div>
        </ng-template>
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p class="text-2xl font-bold text-white">$2,302</p>
            <div class="flex items-center gap-1">
              <p-tag severity="success" value="29%" [rounded]="true" />
            </div>
            <p class="text-sm text-slate-300 mt-1">Weekly Revenue</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">$72,302</p>
            <div class="flex items-center gap-1">
              <p-tag severity="success" value="48%" [rounded]="true" />
            </div>
            <p class="text-sm text-slate-300 mt-1">Monthly Income</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">$780,302</p>
            <div class="flex items-center gap-1">
              <p-tag severity="success" value="64%" [rounded]="true" />
            </div>
            <p class="text-sm text-slate-300 mt-1">Annual Income</p>
          </div>
        </div>
        <!-- Chart placeholder -->
        <div class="h-48 bg-slate-700 rounded-lg flex items-center justify-center">
          <span class="text-slate-500">Sales chart area</span>
        </div>
      </p-card>

      <!-- Inventory Management -->
      <p-card>
        <ng-template #header>
          <div class="px-6 pt-5">
            <h3 class="text-lg font-semibold text-white">Inventory Management</h3>
          </div>
        </ng-template>
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p class="text-2xl font-bold text-white">22,543</p>
            <div class="flex items-center gap-1">
              <p-tag severity="success" value="24%" [rounded]="true" />
            </div>
            <p class="text-sm text-slate-300 mt-1">Stock Status</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">17,472</p>
            <div class="flex items-center gap-1">
              <p-tag severity="warn" value="28%" [rounded]="true" />
            </div>
            <p class="text-sm text-slate-300 mt-1">Inventory Turnover</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">19,582</p>
            <div class="flex items-center gap-1">
              <p-tag severity="danger" value="22%" [rounded]="true" />
            </div>
            <p class="text-sm text-slate-300 mt-1">Products Ordered</p>
          </div>
        </div>
        <!-- Chart placeholder -->
        <div class="h-48 bg-slate-700 rounded-lg flex items-center justify-center">
          <span class="text-slate-500">Inventory chart area</span>
        </div>
      </p-card>

      <!-- Promotion and Campaign Performance -->
      <p-card>
        <ng-template #header>
          <div class="px-6 pt-5">
            <h3 class="text-lg font-semibold text-white">Promotion and Campaign Performance</h3>
          </div>
        </ng-template>
        <div class="h-64 bg-slate-700 rounded-lg flex items-center justify-center">
          <span class="text-slate-500">Campaign heatmap area</span>
        </div>
      </p-card>

      <!-- Email Data Chart -->
      <p-card>
        <ng-template #header>
          <div class="px-6 pt-5 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">Email Data Chart</h3>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
                <span class="text-xs text-slate-300">Click Through Rate</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                <span class="text-xs text-slate-300">Open Rate</span>
              </div>
            </div>
          </div>
        </ng-template>
        <div class="h-64 bg-slate-700 rounded-lg flex items-center justify-center">
          <span class="text-slate-500">Email data chart area</span>
        </div>
      </p-card>
    </div>
  `,
})
export class Dashboard {}
