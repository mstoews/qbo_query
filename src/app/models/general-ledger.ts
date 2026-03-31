
export interface GeneralLedgerResponse {
  Header: GeneralLedgerHeader;
  Columns: GeneralLedgerColumns;
  Rows: GeneralLedgerRows;
}

export interface GeneralLedgerHeader {
Time: string;
ReportName: string;
ReportBasis: string;
StartPeriod: string;
EndPeriod: string;
Currency: string;
Option: GeneralLedgerHeaderOptionItem[];
}

export interface GeneralLedgerHeaderOptionItem {
Name: string;
Value: string;
}

export interface GeneralLedgerColumns {
Column: GeneralLedgerColumnsColumnItem[];
}

export interface GeneralLedgerColumnsColumnItem {
ColTitle: string;
ColType: string;
}

export interface GeneralLedgerRows {
Row: GeneralLedgerRowsRowItem[];
}

export interface GeneralLedgerRowsRowItem {
Header: GeneralLedgerRowsRowItemHeader;
Rows: GeneralLedgerRowsRowItemRows;
Summary: GeneralLedgerRowsRowItemSummary;
type: string;
}

export interface GeneralLedgerRowsRowItemHeader {
ColData: GeneralLedgerRowsRowItemHeaderColDataItem[];
}

export interface GeneralLedgerRowsRowItemHeaderColDataItem {
value: string;
id: string;
}

export interface GeneralLedgerRowsRowItemRows {
Row: GeneralLedgerRowsRowItemRowsRowItem[];
}

export interface GeneralLedgerRowsRowItemRowsRowItem {
ColData: GeneralLedgerRowsRowItemRowsRowItemColDataItem[];
type: string;
}

export interface GeneralLedgerRowsRowItemRowsRowItemColDataItem {
value: string;
id: string;
}

export interface GeneralLedgerRowsRowItemSummary {
ColData: GeneralLedgerRowsRowItemSummaryColDataItem[];
}

export interface GeneralLedgerRowsRowItemSummaryColDataItem {
value: string;
}

export interface GeneralLedgerFlatRow {
  account: string;
  date: string;
  transactionType: string;
  num: string;
  name: string;
  memo: string;
  split: string;
  amount: string;
  balance: string;
}

export function flattenGeneralLedger(
  sections: GeneralLedgerRowsRowItem[],
  columns: GeneralLedgerColumnsColumnItem[],
): GeneralLedgerFlatRow[] {
  const rows: GeneralLedgerFlatRow[] = [];
  for (const section of sections) {
    if (section.Header === undefined || section.Rows === undefined) continue;
    if (!section.Header?.ColData || !section.Rows?.Row) continue;
    const account = section.Header.ColData[0]?.value ?? '';
    for (const row of section.Rows.Row) {
      const r: GeneralLedgerFlatRow = { account, date: '', transactionType: '', num: '', name: '', memo: '', split: '', amount: '', balance: '' };
      if (!row.ColData) continue;
      for (let i = 0; i < row.ColData.length && i < columns.length; i++) {
        switch (columns[i].ColType) {
          case 'tx_date': r.date = row.ColData[i].value; break;
          case 'txn_type': r.transactionType = row.ColData[i].value; break;
          case 'doc_num': r.num = row.ColData[i].value; break;
          case 'name': r.name = row.ColData[i].value; break;
          case 'memo': r.memo = row.ColData[i].value; break;
          case 'split_acc': r.split = row.ColData[i].value; break;
          case 'subt_nat_amount': r.amount = row.ColData[i].value; break;
          case 'rbal_nat_amount': r.balance = row.ColData[i].value; break;
        }
      }
      rows.push(r);
    }
  }
  return rows;
}
