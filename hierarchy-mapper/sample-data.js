// sample-data.js
// Sample trial balance and pre-built hierarchy for first-time users
// Based on a small not-for-profit condominium corporation
// Pre-closing trial balance: debits = credits for both CY and PY

// Account ranges: 1000-1999 Assets, 2000-2999 Liabilities,
// 3000-3999 Fund Balances, 4000-4999 Revenue,
// 5000-5999 Operating Expenses, 6000-6999 Reserve Fund Expenditures
//
// CY (Dec 31, 2025): Debits = Credits = 748,000
//   Assets: 449,800 | Expenses: 298,200
//   Liabilities: 21,800 | Fund Balances: 387,200 | Revenue: 339,000
//   Net Surplus CY = 339,000 - 298,200 = 40,800
//
// PY (Dec 31, 2024): Debits = Credits = 707,650
//   Assets: 409,600 | Expenses: 298,050
//   Liabilities: 19,200 | Fund Balances: 367,200 | Revenue: 321,250
//   Net Surplus PY = 321,250 - 298,050 = 23,200

function buildSampleAccounts() {
    return [
        // ===== BALANCE SHEET =====

        // Assets - Cash & Investments
        { number: "1000", name: "Operating Bank Account", sign: "+", amountCY: 42200, amountPY: 35400, dimensions: createEmptyAccountDimensions() },
        { number: "1010", name: "Reserve Fund Bank Account", sign: "+", amountCY: 151000, amountPY: 135400, dimensions: createEmptyAccountDimensions() },
        { number: "1020", name: "Reserve Fund GIC", sign: "+", amountCY: 240000, amountPY: 225000, dimensions: createEmptyAccountDimensions() },

        // Assets - Receivables
        { number: "1100", name: "Condo Fees Receivable", sign: "+", amountCY: 6400, amountPY: 4500, dimensions: createEmptyAccountDimensions() },
        { number: "1110", name: "Interest Receivable", sign: "+", amountCY: 1100, amountPY: 900, dimensions: createEmptyAccountDimensions() },

        // Assets - Prepaid
        { number: "1200", name: "Prepaid Insurance", sign: "+", amountCY: 9100, amountPY: 8400, dimensions: createEmptyAccountDimensions() },

        // Liabilities
        { number: "2000", name: "Accounts Payable", sign: "-", amountCY: 7200, amountPY: 5900, dimensions: createEmptyAccountDimensions() },
        { number: "2010", name: "Accrued Liabilities", sign: "-", amountCY: 3400, amountPY: 2600, dimensions: createEmptyAccountDimensions() },
        { number: "2020", name: "Condo Fees Received in Advance", sign: "-", amountCY: 11200, amountPY: 10700, dimensions: createEmptyAccountDimensions() },

        // Fund Balances (Operating Fund + Reserve Fund)
        { number: "3000", name: "Operating Fund Balance", sign: "-", amountCY: 25200, amountPY: 22200, dimensions: createEmptyAccountDimensions() },
        { number: "3010", name: "Reserve Fund Balance", sign: "-", amountCY: 362000, amountPY: 345000, dimensions: createEmptyAccountDimensions() },

        // ===== STATEMENT OF OPERATIONS =====

        // Revenue - Condo Fees
        { number: "4000", name: "Condo Fees - Operating", sign: "+", amountCY: 234000, amountPY: 222750, dimensions: createEmptyAccountDimensions() },
        { number: "4010", name: "Condo Fees - Reserve", sign: "+", amountCY: 78000, amountPY: 74250, dimensions: createEmptyAccountDimensions() },

        // Revenue - Other
        { number: "4100", name: "Parking Revenue", sign: "+", amountCY: 9300, amountPY: 8700, dimensions: createEmptyAccountDimensions() },
        { number: "4110", name: "Locker Rental Revenue", sign: "+", amountCY: 4800, amountPY: 4600, dimensions: createEmptyAccountDimensions() },
        { number: "4200", name: "Interest Income", sign: "+", amountCY: 11100, amountPY: 9350, dimensions: createEmptyAccountDimensions() },
        { number: "4300", name: "Status Certificate Fees", sign: "+", amountCY: 1800, amountPY: 1600, dimensions: createEmptyAccountDimensions() },

        // Expenses - Utilities
        { number: "5000", name: "Hydro / Electricity", sign: "-", amountCY: 36200, amountPY: 34100, dimensions: createEmptyAccountDimensions() },
        { number: "5010", name: "Water & Sewer", sign: "-", amountCY: 19250, amountPY: 17900, dimensions: createEmptyAccountDimensions() },
        { number: "5020", name: "Natural Gas", sign: "-", amountCY: 22600, amountPY: 21050, dimensions: createEmptyAccountDimensions() },

        // Expenses - Building & Grounds
        { number: "5100", name: "Building Repairs & Maintenance", sign: "-", amountCY: 14200, amountPY: 12300, dimensions: createEmptyAccountDimensions() },
        { number: "5110", name: "Elevator Maintenance", sign: "-", amountCY: 8400, amountPY: 7950, dimensions: createEmptyAccountDimensions() },
        { number: "5120", name: "Cleaning & Janitorial", sign: "-", amountCY: 18000, amountPY: 17100, dimensions: createEmptyAccountDimensions() },
        { number: "5130", name: "Landscaping", sign: "-", amountCY: 7100, amountPY: 6750, dimensions: createEmptyAccountDimensions() },
        { number: "5140", name: "Snow Removal", sign: "-", amountCY: 9250, amountPY: 8400, dimensions: createEmptyAccountDimensions() },

        // Expenses - Insurance & Professional
        { number: "5200", name: "Property Insurance", sign: "-", amountCY: 26400, amountPY: 23100, dimensions: createEmptyAccountDimensions() },
        { number: "5210", name: "Management Fees", sign: "-", amountCY: 21000, amountPY: 20100, dimensions: createEmptyAccountDimensions() },
        { number: "5220", name: "Audit & Accounting", sign: "-", amountCY: 4250, amountPY: 4100, dimensions: createEmptyAccountDimensions() },
        { number: "5230", name: "Legal Fees", sign: "-", amountCY: 3100, amountPY: 2400, dimensions: createEmptyAccountDimensions() },

        // Expenses - Administration
        { number: "5300", name: "Office & Printing", sign: "-", amountCY: 1200, amountPY: 1100, dimensions: createEmptyAccountDimensions() },
        { number: "5310", name: "Bank Charges", sign: "-", amountCY: 900, amountPY: 800, dimensions: createEmptyAccountDimensions() },

        // Expenses - Reserve Fund
        { number: "5400", name: "Reserve Fund Contribution", sign: "-", amountCY: 78000, amountPY: 74250, dimensions: createEmptyAccountDimensions() },

        // Reserve Fund Expenditures
        { number: "6000", name: "Parking Garage Repairs", sign: "-", amountCY: 14200, amountPY: 7500, dimensions: createEmptyAccountDimensions() },
        { number: "6010", name: "Elevator Modernization", sign: "-", amountCY: 0, amountPY: 35000, dimensions: createEmptyAccountDimensions() },
        { number: "6020", name: "Lobby Renovation", sign: "-", amountCY: 8950, amountPY: 250, dimensions: createEmptyAccountDimensions() },
        { number: "6030", name: "Common Area Flooring", sign: "-", amountCY: 5200, amountPY: 3900, dimensions: createEmptyAccountDimensions() },
    ];
}

function buildSampleHierarchy(accounts) {
    var acct = function(num) { return accounts.find(function(a) { return a.number === num; }); };

    // Pre-generate ID for Statement of Operations so the calculated account can reference it
    var stmtOpsId = generateId();

    return [
        {
            id: generateId(),
            name: "Balance Sheet",
            visible: true,
            sortOrder: 0,
            defaultSign: 1,
            accounts: [],
            children: [
                {
                    id: generateId(),
                    name: "Assets",
                    visible: true,
                    sortOrder: 0,
                    defaultSign: 1,
                    accounts: [],
                    children: [
                        {
                            id: generateId(),
                            name: "Cash & Investments",
                            visible: true,
                            sortOrder: 0,
                            defaultSign: 1,
                            accounts: [acct("1000"), acct("1010"), acct("1020")],
                            children: []
                        },
                        {
                            id: generateId(),
                            name: "Receivables",
                            visible: true,
                            sortOrder: 1,
                            defaultSign: 1,
                            accounts: [acct("1100")],
                            children: []
                            // 1110 Interest Receivable left unmapped
                        },
                        {
                            id: generateId(),
                            name: "Prepaid Expenses",
                            visible: true,
                            sortOrder: 2,
                            defaultSign: 1,
                            accounts: [acct("1200")],
                            children: []
                        }
                    ]
                },
                {
                    id: generateId(),
                    name: "Liabilities",
                    visible: true,
                    sortOrder: 1,
                    defaultSign: -1,
                    accounts: [acct("2000"), acct("2010")],
                    children: []
                    // 2020 Condo Fees Received in Advance left unmapped
                },
                {
                    id: generateId(),
                    name: "Fund Balances",
                    visible: true,
                    sortOrder: 2,
                    defaultSign: -1,
                    accounts: [acct("3000"), acct("3010")],
                    children: [],
                    calculatedAccounts: [
                        createCalculatedAccount("Current Year Surplus", stmtOpsId)
                    ]
                }
            ]
        },
        {
            id: stmtOpsId,
            name: "Statement of Operations",
            visible: true,
            sortOrder: 1,
            defaultSign: 1,
            accounts: [],
            children: [
                {
                    id: generateId(),
                    name: "Revenue",
                    visible: true,
                    sortOrder: 0,
                    defaultSign: 1,
                    accounts: [acct("4000"), acct("4010"), acct("4100")],
                    children: []
                    // 4110 Locker Rental, 4200 Interest Income, 4300 Status Cert left unmapped
                },
                {
                    id: generateId(),
                    name: "Expenses",
                    visible: true,
                    sortOrder: 1,
                    defaultSign: -1,
                    accounts: [],
                    children: [
                        {
                            id: generateId(),
                            name: "Utilities",
                            visible: true,
                            sortOrder: 0,
                            defaultSign: -1,
                            accounts: [acct("5000"), acct("5010"), acct("5020")],
                            children: []
                        },
                        {
                            id: generateId(),
                            name: "Building & Grounds",
                            visible: true,
                            sortOrder: 1,
                            defaultSign: -1,
                            accounts: [acct("5100"), acct("5110"), acct("5120")],
                            children: []
                            // 5130 Landscaping, 5140 Snow Removal left unmapped
                        },
                        {
                            id: generateId(),
                            name: "Insurance & Professional",
                            visible: true,
                            sortOrder: 2,
                            defaultSign: -1,
                            accounts: [acct("5200"), acct("5210")],
                            children: []
                            // 5220 Audit, 5230 Legal left unmapped
                        },
                        {
                            id: generateId(),
                            name: "Administration",
                            visible: true,
                            sortOrder: 3,
                            defaultSign: -1,
                            accounts: [acct("5300")],
                            children: []
                            // 5310 Bank Charges left unmapped
                        }
                    ]
                },
                {
                    id: generateId(),
                    name: "Reserve Fund",
                    visible: true,
                    sortOrder: 2,
                    defaultSign: -1,
                    accounts: [acct("5400")],
                    children: []
                    // 6000, 6010, 6020 Reserve expenditures left unmapped
                }
            ]
        }
    ];
}

App.prototype.loadSampleData = function() {
    this.saveState();

    var accounts = buildSampleAccounts();
    var statements = buildSampleHierarchy(accounts);

    this.data.orgName = "Maple Ridge Condominium Corp. No. 245";
    this.data.accounts = accounts;
    this.data.views[this.currentViewIndex].statements = statements;

    this.previewCYDate = "Dec 31, 2025";
    this.previewPYDate = "Dec 31, 2024";

    this.importTabActive = false;
    this.importState = null;
    this.render();
};

App.prototype.clearAllData = function() {
    this.showModal(
        "Clear All Data",
        "<p>Are you sure you want to clear all accounts, mappings, and statements?</p><p>This cannot be undone.</p>",
        [
            { label: "Cancel" },
            {
                label: "Clear Everything",
                style: "danger",
                onclick: function() {
                    app.saveState();
                    app.data = createDefaultData();
                    app.importTabActive = true;
                    app.importState = null;
                    app.selectedAccounts.clear();
                    app.checkedMappedAccounts.clear();
                    app.collapseStates = {};
                    app.previewCYDate = "Dec 31, 2025";
                    app.previewPYDate = "Dec 31, 2024";
                    app.render();
                }
            }
        ]
    );
};
