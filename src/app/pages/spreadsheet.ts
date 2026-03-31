import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Toolbar } from './toolbar';
import { GridColumn, GridRow, SpreadsheetGridComponent } from './spreadsheet-grid';

@Component({
  selector: 'app-spreadsheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Toolbar, SpreadsheetGridComponent],
  template: `
    <qbo-toolbar [inTitle]="'Spreadsheet'" [showRefresh]="false" [showDownload]="false" [showQuery]="false" />

    <div class="mt-4">
      <app-spreadsheet-grid
        [columns]="columns"
        (rowsChanged)="onRowsChanged($event)"
        (cellEdited)="onCellEdited($event)" />
    </div>
  `,
})
export class SpreadsheetComponent {
  columns: GridColumn[] = [
    { field: 'date', header: 'Date', type: 'text', width: '120px' },
    { field: 'account', header: 'Account', type: 'text', width: '200px' },
    { field: 'description', header: 'Description', type: 'text', width: '250px' },
    { field: 'debit', header: 'Debit', type: 'number', width: '130px' },
    { field: 'credit', header: 'Credit', type: 'number', width: '130px' },
    {
      field: 'type',
      header: 'Type',
      type: 'select',
      width: '140px',
      options: [
        { label: 'Journal Entry', value: 'journal' },
        { label: 'Invoice', value: 'invoice' },
        { label: 'Payment', value: 'payment' },
        { label: 'Expense', value: 'expense' },
      ],
    },
  ];

  onRowsChanged(rows: GridRow[]) {
    console.log('Rows updated:', rows);
  }

  onCellEdited(event: { row: GridRow; field: string }) {
    console.log('Cell edited:', event.field, '=', event.row[event.field]);
  }
}
