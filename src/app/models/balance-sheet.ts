export interface BalanceSheetResponse {
  Header: BalanceSheetHeader;
  Columns: {
    Column: BalanceSheetColumn[];
  };
  Rows: {
    Row: BalanceSheetRow[];
  };
}

export interface BalanceSheetHeader {
  Time: string;
  ReportName: string;
  ReportBasis: string;
  StartPeriod: string;
  EndPeriod: string;
  SummarizeColumnsBy: string;
  Currency: string;
  Option: { Name: string; Value: string }[];
}

export interface BalanceSheetColumn {
  ColTitle: string;
  ColType: string;
  MetaData?: { Name: string; Value: string }[];
}

export interface BalanceSheetRow {
  Header?: {
    ColData: ColData[];
  };
  Rows?: {
    Row: BalanceSheetRow[];
  };
  Summary?: {
    ColData: ColData[];
  };
  ColData?: ColData[];
  type?: string;
  group?: string;
}

export interface ColData {
  value: string;
  id?: string;
}
