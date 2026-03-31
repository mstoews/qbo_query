export interface TransactionListResponse {
  Header: TransactionListHeader;
  Columns: TransactionListColumns;
  Rows: TransactionListRows;
}

export interface TransactionListHeader {
  Time: string;
  ReportName: string;
  StartPeriod: string;
  EndPeriod: string;
  Currency: string;
  Option: { Name: string; Value: string }[];
}

export interface TransactionListColumns {
  Column: TransactionListColumn[];
}

export interface TransactionListColumn {
  ColTitle: string;
  ColType: string;
}

export interface TransactionListRows {
  Row: TransactionListRow[];
}

export interface TransactionListRow {
  ColData: ColData[];
  type: string;
}

export interface ColData {
  value: string;
  id?: string;
}
