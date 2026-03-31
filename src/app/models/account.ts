export interface AccountResponse {
  QueryResponse: {
    Account: Account[];
    startPosition: number;
    maxResults: number;
  };
  time: string;
}

export interface Account {
  Name: string;
  SubAccount: boolean;
  ParentRef?: { value: string };
  FullyQualifiedName: string;
  Active: boolean;
  Classification: string;
  AccountType: string;
  AccountSubType: string;
  CurrentBalance: number;
  CurrentBalanceWithSubAccounts: number;
  CurrencyRef: {
    value: string;
    name: string;
  };
  domain: string;
  sparse: boolean;
  Id: string;
  SyncToken: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}
