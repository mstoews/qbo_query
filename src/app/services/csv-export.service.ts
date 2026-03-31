import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  download<T extends Record<string, unknown>>(data: T[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => this.escapeCell(String(row[h] ?? ''))).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
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
