export interface TrialBalanceResponse {
  Header: TrialBalanceHeader;
  Columns: {
    Column: TrialBalanceColumn[];
  };
  Rows: {
    Row: TrialBalanceRow[];
  };
}

export interface TrialBalanceHeader {
  Time: string;
  ReportName: string;
  ReportBasis: string;
  StartPeriod: string;
  EndPeriod: string;
  SummarizeColumnsBy: string;
  Currency: string;
  Option: { Name: string; Value: string }[];
}

export interface TrialBalanceColumn {
  ColTitle: string;
  ColType: string;
}

export interface TrialBalanceRow {
  ColData?: ColData[];
  Summary?: {
    ColData: ColData[];
  };
  type?: string;
  group?: string;
}

export interface ColData {
  value: string;
  id?: string;
}
