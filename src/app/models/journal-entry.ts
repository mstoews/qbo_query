export interface JournalEntryResponse {
  count: number;
  journal_entries: JournalEntry[];
  year: string;
}

export interface JournalEntry {
  Adjustment: boolean;
  TotalAmt: number;
  domain: string;
  sparse: boolean;
  Id: string;
  SyncToken: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
  DocNumber?: string;
  TxnDate: string;
  CurrencyRef: {
    value: string;
    name: string;
  };
  PrivateNote: string;
  Line: JournalEntryLine[];
  TxnTaxDetail: Record<string, unknown>;
}

export interface JournalEntryLine {
  Id: string;
  Description: string;
  Amount: number;
  DetailType: string;
  JournalEntryLineDetail: {
    PostingType: 'Debit' | 'Credit';
    AccountRef: {
      value: string;
      name: string;
    };
    DepartmentRef?: {
      value: string;
      name: string;
    };
    Entity?: {
      Type: string;
      EntityRef: {
        value: string;
        name: string;
      };
    };
  };
  CustomExtensions?: unknown[];
}
