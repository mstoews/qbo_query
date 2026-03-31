import { Address } from './customer';

export interface VendorResponse {
  QueryResponse: {
    Vendor: Vendor[];
    startPosition: number;
    maxResults: number;
  };
  time: string;
}

export interface Vendor {
  BillAddr?: Address;
  TermRef?: { value: string };
  Balance: number;
  BillRate?: number;
  AcctNum?: string;
  Vendor1099: boolean;
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
  Title?: string;
  GivenName?: string;
  MiddleName?: string;
  FamilyName?: string;
  Suffix?: string;
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
