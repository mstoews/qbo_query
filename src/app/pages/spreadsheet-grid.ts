import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

export interface GridColumn {
  field: string;
  header: string;
  type: 'text' | 'number' | 'select';
  width?: string;
  options?: { label: string; value: string }[];
}

export type GridRow = Record<string, unknown> & { _rowId: number };

@Component({
  selector: 'app-spreadsheet-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormsModule, TableModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule],
  template: `
    <div class="flex items-center gap-2 mb-3">
      <button pButton label="Add Row" icon="pi pi-plus" class="p-button-sm p-button-outlined"
        (click)="addRow()"></button>
      <button pButton label="Delete Selected" icon="pi pi-trash" class="p-button-sm p-button-outlined p-button-danger"
        [disabled]="selectedRows().length === 0"
        (click)="deleteSelectedRows()"></button>
      <span class="text-surface-400 text-sm ml-auto">{{ rows().length }} rows</span>
    </div>

    <p-table
      [value]="rows()"
      [scrollable]="true"
      scrollHeight="70vh"
      [(selection)]="selectedRowsModel"
      dataKey="_rowId"
      editMode="cell"
      [tableStyle]="{ 'min-width': totalWidth() }"
      styleClass="p-datatable-gridlines p-datatable-sm">

      <ng-template #header>
        <tr>
          <th class="w-12! text-center!">
            <p-tableHeaderCheckbox />
          </th>
          <th class="w-12! text-center! text-surface-400! text-xs!">#</th>
          @for (col of columns(); track col.field) {
            <th [style.width]="col.width ?? '150px'">{{ col.header }}</th>
          }
        </tr>
      </ng-template>

      <ng-template #body let-row let-ri="rowIndex" let-columns="columns">
        <tr>
          <td class="text-center!">
            <p-tableCheckbox [value]="row" />
          </td>
          <td class="text-center! text-surface-500! text-xs!">{{ ri + 1 }}</td>
          @for (col of this.columns(); track col.field) {
            <td [pEditableColumn]="row[col.field]" [pEditableColumnField]="col.field"
              class="p-0! cursor-cell">
              <p-cellEditor>
                <ng-template #input>
                  @switch (col.type) {
                    @case ('number') {
                      <p-inputNumber [(ngModel)]="row[col.field]" [inputStyle]="cellInputStyle"
                        mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2"
                        (onBlur)="onCellEdit(row, col.field)" />
                    }
                    @case ('select') {
                      <p-select [(ngModel)]="row[col.field]" [options]="col.options ?? []"
                        optionLabel="label" optionValue="value" appendTo="body"
                        [style]="cellInputStyle"
                        (onChange)="onCellEdit(row, col.field)" />
                    }
                    @default {
                      <input pInputText [(ngModel)]="row[col.field]" [style]="cellInputStyle"
                        (blur)="onCellEdit(row, col.field)" />
                    }
                  }
                </ng-template>
                <ng-template #output>
                  <div class="px-2 py-1 min-h-7">
                    @if (col.type === 'number' && row[col.field] != null) {
                      {{ row[col.field] | number:'1.2-2' }}
                    } @else {
                      {{ row[col.field] ?? '' }}
                    }
                  </div>
                </ng-template>
              </p-cellEditor>
            </td>
          }
        </tr>
      </ng-template>
    </p-table>
  `,
  styles: [`
    :host ::ng-deep {
      .p-datatable-gridlines .p-datatable-tbody > tr > td {
        border-width: 1px;
      }
      .p-datatable-gridlines .p-datatable-thead > tr > th {
        border-width: 1px;
      }
      .p-datatable .p-datatable-tbody > tr > td.p-cell-editing {
        padding: 0 !important;
      }
    }
  `],
})
export class SpreadsheetGridComponent {
  columns = input.required<GridColumn[]>();
  initialRows = input<Record<string, unknown>[]>([]);

  rowsChanged = output<GridRow[]>();
  cellEdited = output<{ row: GridRow; field: string }>();

  private nextId = signal(1);
  rows = signal<GridRow[]>([]);
  selectedRowsModel: GridRow[] = [];
  selectedRows = signal<GridRow[]>([]);

  readonly cellInputStyle = { width: '100%', border: 'none', 'border-radius': '0' };

  totalWidth = computed(() => {
    const colWidths = this.columns().reduce((sum, col) => {
      const w = parseInt(col.width ?? '150', 10);
      return sum + w;
    }, 0);
    return (colWidths + 24 + 48) + 'px'; // checkbox + row number + columns
  });

  ngOnInit() {
    const initial = this.initialRows();
    if (initial.length > 0) {
      const rows = initial.map((r) => ({ ...r, _rowId: this.nextId() } as GridRow));
      this.nextId.set(rows.length + 1);
      this.rows.set(rows);
    } else {
      this.addRow();
    }
  }

  addRow() {
    const id = this.nextId();
    this.nextId.update((n) => n + 1);
    const newRow: GridRow = { _rowId: id };
    for (const col of this.columns()) {
      newRow[col.field] = col.type === 'number' ? null : '';
    }
    this.rows.update((rows) => [...rows, newRow]);
    this.rowsChanged.emit(this.rows());
  }

  deleteSelectedRows() {
    const selectedIds = new Set(this.selectedRowsModel.map((r) => r._rowId));
    this.rows.update((rows) => rows.filter((r) => !selectedIds.has(r._rowId)));
    this.selectedRowsModel = [];
    this.selectedRows.set([]);
    this.rowsChanged.emit(this.rows());
  }

  onCellEdit(row: GridRow, field: string) {
    this.cellEdited.emit({ row, field });
    this.rowsChanged.emit(this.rows());
  }
}
