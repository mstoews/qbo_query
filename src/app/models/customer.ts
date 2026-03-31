export interface CustomerResponse {
  QueryResponse: {
    Customer: Customer[];
    startPosition: number;
    maxResults: number;
  };
  time: string;
}

export interface Customer {
  Taxable: boolean;
  BillAddr?: Address;
  ShipAddr?: Address;
  Job: boolean;
  BillWithParent: boolean;
  ParentRef?: { value: string };
  Level?: number;
  Balance: number;
  BalanceWithJobs: number;
  CurrencyRef: {
    value: string;
    name: string;
  };
  PreferredDeliveryMethod: string;
  IsProject: boolean;
  ClientEntityId: string;
  domain: string;
  sparse: boolean;
  Id: string;
  SyncToken: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
  GivenName: string;
  MiddleName?: string;
  FamilyName: string;
  FullyQualifiedName: string;
  CompanyName?: string;
  DisplayName: string;
  PrintOnCheckName: string;
  Active: boolean;
  V4IDPseudonym: string;
  PrimaryPhone?: { FreeFormNumber: string };
  Mobile?: { FreeFormNumber: string };
  Fax?: { FreeFormNumber: string };
  PrimaryEmailAddr?: { Address: string };
  WebAddr?: { URI: string };
}

export interface Address {
  Id: string;
  Line1: string;
  City: string;
  Country?: string;
  CountrySubDivisionCode: string;
  PostalCode: string;
  Lat: string;
  Long: string;
}
