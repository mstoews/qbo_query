import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'hierarchy-mapper', loadComponent: () => import('./pages/hierarchy-mapper/hierarchy-mapper.component').then(m => m.HierarchyMapperComponent) },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard_tab').then(m => m.Dashboard) },
      { path: 'journal-entries', loadComponent: () => import('./pages/journal-entries').then(m => m.JournalEntriesComponent) },
      { path: 'transactions', loadComponent: () => import('./pages/transactions').then(m => m.TransactionsComponent) },
      { path: 'general-ledger', loadComponent: () => import('./pages/general-ledger').then(m => m.GeneralLedgerComponent) },
      { path: 'accounts', loadComponent: () => import('./pages/accounts').then(m => m.AccountsComponent) },
      { path: 'customers', loadComponent: () => import('./pages/customers').then(m => m.CustomersComponent) },
      { path: 'vendors', loadComponent: () => import('./pages/vendors').then(m => m.VendorsComponent) },
      { path: 'trial-balance', loadComponent: () => import('./pages/trial-balance').then(m => m.TrialBalanceComponent) },
      { path: 'balance-sheet', loadComponent: () => import('./pages/balance-sheet').then(m => m.BalanceSheetComponent) },
      { path: 'profit-and-loss', loadComponent: () => import('./pages/profit-and-loss').then(m => m.ProfitAndLossComponent) },
    ],
  },
];
