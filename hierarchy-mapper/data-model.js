// data-model.js
// Contains default data structure and data helpers

const DEFAULT_DIMENSIONS = {
    funds: {
        enabled: true,
        label: "Funds",
        values: [
            { id: "fund-1", name: "Operating Fund", code: "OPR" },
            { id: "fund-2", name: "Reserve Fund", code: "RSV" }
        ]
    },
    classes: {
        enabled: true,
        label: "QBO Classes",
        values: [
            { id: "cls-1", name: "Administration", code: "ADMIN" },
            { id: "cls-2", name: "Building Maintenance", code: "BLDG" }
        ]
    },
    nlOrgs: {
        enabled: false,
        label: "NL Organizations",
        values: []
    },
    nlProjects: {
        enabled: false,
        label: "NL Projects",
        values: []
    }
};

const DEFAULT_REPORT_OPTIONS = {
    fundDisplay: "separate",
    fundFilter: [],
    fundShowTotal: true,
    classDisplay: "columns",
    classFilter: [],
    classShowTotal: true,
    nlOrgFilter: [],
    nlProjectFilter: []
};

// Helper: create empty dimension mappings for an account
function createEmptyAccountDimensions() {
    return {
        funds: [],
        classes: [],
        nlOrg: null,
        nlProjects: []
    };
}

// Helper: ensure an account has a dimensions object
function ensureAccountDimensions(account) {
    if (!account.dimensions) {
        account.dimensions = createEmptyAccountDimensions();
    }
    return account;
}

// Build default data - starts empty, user imports accounts via CSV/JSON
function buildDefaultData() {
    return {
        orgName: "Organization Name",
        dimensions: JSON.parse(JSON.stringify(DEFAULT_DIMENSIONS)),
        views: [
            {
                name: "Primary View",
                maxDepth: 6,
                levelLabels: DEFAULT_LEVEL_LABELS.slice(0, 6),
                reportOptions: JSON.parse(JSON.stringify(DEFAULT_REPORT_OPTIONS)),
                statements: []
            }
        ],
        accounts: []
    };
}

const DEFAULT_DATA = buildDefaultData();

function createDefaultData() {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

// Helper: create a calculated account
// Single source (flow): pulls signed total from one node (negated for cross-statement flows)
// Multi source (total line): sums absolute totals from multiple nodes (display-only)
function createCalculatedAccount(name, sourceNodeIds, options) {
    var opts = options || {};
    var ids = Array.isArray(sourceNodeIds) ? sourceNodeIds : [sourceNodeIds];
    return {
        id: generateId(),
        name: name,
        sourceNodeIds: ids,
        calculated: true,
        bold: opts.bold !== undefined ? opts.bold : (ids.length > 1),
        underlineAbove: opts.underlineAbove !== undefined ? opts.underlineAbove : (ids.length > 1)
    };
}

// Migration: ensure older JSON imports get dimensions added
function migrateData(data) {
    // Add top-level dimensions if missing
    if (!data.dimensions) {
        data.dimensions = JSON.parse(JSON.stringify(DEFAULT_DIMENSIONS));
    }
    // Ensure all dimension types exist
    for (const key of Object.keys(DEFAULT_DIMENSIONS)) {
        if (!data.dimensions[key]) {
            data.dimensions[key] = JSON.parse(JSON.stringify(DEFAULT_DIMENSIONS[key]));
        }
    }
    // Add reportOptions to views if missing
    if (data.views) {
        data.views.forEach(view => {
            if (!view.reportOptions) {
                view.reportOptions = JSON.parse(JSON.stringify(DEFAULT_REPORT_OPTIONS));
            }
        });
    }
    // Add dimensions to accounts if missing
    if (data.accounts) {
        data.accounts.forEach(acct => {
            ensureAccountDimensions(acct);
        });
    }
    return data;
}
