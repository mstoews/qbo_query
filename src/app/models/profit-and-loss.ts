export interface ProfitAndLossResponse {
  Header: ProfitAndLossHeader;
  Columns: {
    Column: ProfitAndLossColumn[];
  };
  Rows: {
    Row: ProfitAndLossRow[];
  };
}

export interface ProfitAndLossHeader {
  Time: string;
  ReportName: string;
  ReportBasis: string;
  StartPeriod: string;
  EndPeriod: string;
  SummarizeColumnsBy: string;
  Currency: string;
  Option: { Name: string; Value: string }[];
}

export interface ProfitAndLossColumn {
  ColTitle: string;
  ColType: string;
  MetaData?: { Name: string; Value: string }[];
}

export interface ProfitAndLossRow {
  Header?: {
    ColData: ColData[];
  };
  Rows?: {
    Row: ProfitAndLossRow[];
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
