import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExportService {
  downloadCsv<T extends Record<string, unknown>>(data: T[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => this.escapeCell(String(row[h] ?? ''))).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    this.saveFile(new Blob([csv], { type: 'text/csv' }), filename);
  }

  downloadExcel<T extends Record<string, unknown>>(data: T[], filename: string, sheetName = 'Sheet1'): void {
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    this.saveFile(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename,
    );
  }

  private saveFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private escapeCell(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
