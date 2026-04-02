// import-accounts.js
// Account upload/import screen with drag-drop, column mapping via header dropdowns,
// full data preview with pagination, period selection, date entry, row ignore, and CY/PY merge support

var IMPORT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
var IMPORT_PAGE_SIZE = 200;

var IMPORT_COLUMN_TYPES = [
    { value: "skip", label: "Skip" },
    { value: "accountNum", label: "Account #" },
    { value: "accountName", label: "Account Name" },
    { value: "extractNum", label: "Extract # from Name" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
    { value: "netAmount", label: "Net Amount" }
];

App.prototype.showImportTab = function() {
    this.importTabActive = true;
    this.render();
};

App.prototype.hideImportTab = function() {
    this.importTabActive = false;
    this.importState = null;
    this.render();
};

App.prototype.renderImportScreen = function() {
    const container = document.getElementById("treeContainer");
    if (!container) return;

    if (!this.importState) {
        this.renderImportDropZone(container);
    } else if (this.importState.step === "mapping") {
        this.renderColumnMapping(container);
    } else if (this.importState.step === "validation") {
        this.renderValidationScreen(container);
    } else if (this.importState.step === "preview") {
        this.renderImportPreview(container);
    } else if (this.importState.step === "merge-confirm") {
        this.renderMergeConfirm(container);
    }
};

// ===== Step 1: Drop zone =====

App.prototype.renderImportDropZone = function(container) {
    const hasExistingAccounts = this.data.accounts && this.data.accounts.length > 0;

    let html = '<div class="import-screen">';
    html += '<div class="import-header">Import Trial Balance</div>';

    if (hasExistingAccounts) {
        html += '<div class="import-info-box">';
        html += '<strong>' + this.data.accounts.length + ' accounts</strong> already loaded. ';
        html += 'Importing another file will match accounts by number and merge the amounts.';
        html += '</div>';
    }

    html += '<div class="import-desc">Upload a trial balance or chart of accounts from QuickBooks Online, Sage, or any CSV/JSON file.</div>';

    html += '<div class="import-drop-zone" id="importDropZone">';
    html += '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
    html += '<div class="import-drop-text">Drag & drop a CSV or JSON file here</div>';
    html += '<div class="import-drop-hint">or click to browse (max 5 MB)</div>';
    html += '<input type="file" id="importFileInput" accept=".csv,.json,.CSV,.JSON" style="display:none">';
    html += '</div>';

    if (!hasExistingAccounts) {
        html += '<div class="import-sample-btn-area">';
        html += '<div class="import-or-divider"><span>or</span></div>';
        html += '<button class="import-sample-btn" onclick="app.loadSampleData()">';
        html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
        html += ' Try with Sample Data';
        html += '</button>';
        html += '<div class="import-sample-hint">Loads a sample condo corporation trial balance with a partially built hierarchy so you can explore the app.</div>';
        html += '</div>';
    }

    html += '<div class="import-format-info">';
    html += '<div class="import-format-title">Supported formats:</div>';
    html += '<div class="import-format-item"><strong>QBO Trial Balance</strong> - "Account full name, Debit, Credit" with colon-separated hierarchy</div>';
    html += '<div class="import-format-item"><strong>CSV</strong> - Any CSV with account number, name, and amount columns</div>';
    html += '<div class="import-format-item"><strong>JSON</strong> - Array of account objects with number, name, and amounts</div>';
    html += '</div>';

    html += '<div class="import-sample-link">';
    html += '<a href="sample-tb.csv" download>Download sample condo trial balance (CSV with CY & PY)</a>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;

    const dropZone = document.getElementById("importDropZone");
    const fileInput = document.getElementById("importFileInput");

    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); };
    dropZone.ondragleave = () => { dropZone.classList.remove("drag-over"); };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) this.handleImportFile(file);
    };
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) this.handleImportFile(file);
    };
};

// ===== File handling =====

App.prototype.handleImportFile = function(file) {
    if (file.size > IMPORT_MAX_FILE_SIZE) {
        this.showModal("File Too Large",
            '<p>The selected file is ' + (file.size / (1024 * 1024)).toFixed(1) + ' MB, which exceeds the 5 MB limit.</p>' +
            '<p>Please use a smaller file or remove unnecessary rows before importing.</p>',
            [{ label: "OK" }]
        );
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const ext = file.name.split(".").pop().toLowerCase();
        if (ext === "json") {
            this.parseImportJSON(content, file.name);
        } else {
            this.parseImportCSV(content, file.name);
        }
    };
    reader.readAsText(file);
};

App.prototype.parseImportCSV = function(content, fileName) {
    const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    let headerRowIndex = -1;
    let metaRows = [];

    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const cols = this.parseCSVLine(lines[i]);
        const lower = cols.map(c => c.toLowerCase().trim());
        if (lower.some(c => c.includes("account") || c.includes("debit") || c.includes("credit") || c.includes("balance") || c.includes("amount"))) {
            headerRowIndex = i;
            break;
        }
        metaRows.push(cols);
    }

    if (headerRowIndex === -1) {
        headerRowIndex = 0;
        metaRows = [];
    }

    const headers = this.parseCSVLine(lines[headerRowIndex]);
    const dataRows = [];

    for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const cols = this.parseCSVLine(lines[i]);
        if (cols.length === 0) continue;
        const first = cols[0].trim().toUpperCase();
        if (first === "TOTAL" || first.startsWith("ACCRUAL BASIS") || first.startsWith("CASH BASIS")) continue;
        if (cols.every(c => c.trim() === "")) continue;
        dataRows.push(cols);
    }

    let orgName = "";
    let dateLine = "";
    metaRows.forEach(row => {
        const text = row.join(" ").trim();
        if (!text) return;
        if (text.toLowerCase().includes("as of") || text.toLowerCase().includes("period")) {
            dateLine = text;
        } else if (text.toLowerCase() !== "trial balance" && text.toLowerCase() !== "balance sheet" && text.length > 3) {
            if (!orgName) orgName = text;
        }
    });

    const columnMappings = this.autoDetectColumnTypes(headers);
    const hasExisting = this.data.accounts && this.data.accounts.length > 0;

    // Try to parse a date from the meta date line
    const detectedDate = this.parseDateFromMeta(dateLine);

    this.importState = {
        step: "mapping",
        fileName: fileName,
        headers: headers,
        dataRows: dataRows,
        metaOrgName: orgName,
        metaDateLine: dateLine,
        columnMappings: columnMappings,
        period: hasExisting ? "py" : "cy",
        periodDate: detectedDate || "",
        ignoredRows: {},
        page: 0,
        format: "csv",
        parseQboHierarchy: true
    };

    this.renderImportScreen();
};

App.prototype.parseImportJSON = function(content, fileName) {
    try {
        const data = JSON.parse(content);
        const arr = Array.isArray(data) ? data : (data.accounts || data.data || []);
        if (!arr.length) {
            this.showModal("Import Error", "No account data found in JSON file.", [{ label: "OK" }]);
            return;
        }

        const keys = Object.keys(arr[0]);
        const headers = keys;
        const dataRows = arr.map(obj => keys.map(k => String(obj[k] || "")));
        const columnMappings = this.autoDetectColumnTypes(headers);
        const hasExisting = this.data.accounts && this.data.accounts.length > 0;

        this.importState = {
            step: "mapping",
            fileName: fileName,
            headers: headers,
            dataRows: dataRows,
            metaOrgName: data.orgName || "",
            metaDateLine: "",
            columnMappings: columnMappings,
            period: hasExisting ? "py" : "cy",
            periodDate: "",
            ignoredRows: {},
            page: 0,
            format: "json",
            parseQboHierarchy: true
        };

        this.renderImportScreen();
    } catch (e) {
        this.showModal("Import Error", "Invalid JSON file: " + this.escapeHtml(e.message), [{ label: "OK" }]);
    }
};

// Try to extract a YYYY-MM-DD date from a meta line like "As of December 31, 2025"
App.prototype.parseDateFromMeta = function(text) {
    if (!text) return "";
    // Try ISO format first
    const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
    // Try "Month DD, YYYY"
    const dateMatch = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i);
    if (dateMatch) {
        var months = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
                       july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" };
        var mon = months[dateMatch[1].toLowerCase()];
        var day = dateMatch[2].padStart(2, "0");
        return dateMatch[3] + "-" + mon + "-" + day;
    }
    // Try "MM/DD/YYYY"
    const slashMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
        return slashMatch[3] + "-" + slashMatch[1].padStart(2, "0") + "-" + slashMatch[2].padStart(2, "0");
    }
    return "";
};

// Format a YYYY-MM-DD date to a display label like "Dec 31, 2025"
App.prototype.formatDateLabel = function(isoDate) {
    if (!isoDate) return "";
    var parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    return monthNames[m] + " " + d + ", " + parts[0];
};

App.prototype.parseCSVLine = function(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
};

// ===== Auto-detect column types for each header =====

App.prototype.autoDetectColumnTypes = function(headers) {
    const mappings = headers.map(() => "skip");

    headers.forEach((h, i) => {
        const lower = h.toLowerCase().trim();
        if (lower.includes("account") && (lower.includes("num") || lower.includes("#") || lower.includes("code"))) {
            mappings[i] = "accountNum";
        } else if (lower.includes("account") && lower.includes("name")) {
            mappings[i] = "accountName";
        } else if (lower === "account" || lower === "account full name" || (lower.includes("account") && lower.includes("full"))) {
            mappings[i] = "extractNum";
        } else if (lower === "debit" || lower.includes("debit")) {
            mappings[i] = "debit";
        } else if (lower === "credit" || lower.includes("credit")) {
            mappings[i] = "credit";
        } else if (lower.includes("balance") || lower.includes("amount") || lower.includes("total") ||
                   lower.includes("current") || lower.includes("cy") || lower.includes("net")) {
            mappings[i] = "netAmount";
        }
    });

    const hasAcctCol = mappings.some(m => m === "accountNum" || m === "accountName" || m === "extractNum");
    if (!hasAcctCol && mappings.length > 0) {
        mappings[0] = "extractNum";
    }

    return mappings;
};

// ===== Step 2: Column mapping + full data preview =====

App.prototype.renderColumnMapping = function(container) {
    const state = this.importState;
    const totalRows = state.dataRows.length;
    const ignoredCount = Object.keys(state.ignoredRows).length;
    const activeRows = totalRows - ignoredCount;
    const totalPages = Math.ceil(totalRows / IMPORT_PAGE_SIZE);
    const page = state.page || 0;
    const startRow = page * IMPORT_PAGE_SIZE;
    const endRow = Math.min(startRow + IMPORT_PAGE_SIZE, totalRows);
    const pageRows = state.dataRows.slice(startRow, endRow);

    let html = '<div class="import-screen import-screen-wide">';

    // Header
    html += '<div class="import-top-bar">';
    html += '<div>';
    html += '<div class="import-header">Map Columns & Review Data</div>';
    html += '<div class="import-desc">File: <strong>' + this.escapeHtml(state.fileName) + '</strong>';
    if (state.metaOrgName) html += ' &mdash; ' + this.escapeHtml(state.metaOrgName);
    if (state.metaDateLine) html += ' &mdash; ' + this.escapeHtml(state.metaDateLine);
    html += ' &mdash; ' + activeRows + ' rows' + (ignoredCount > 0 ? ' (' + ignoredCount + ' ignored)' : '') + '</div>';
    html += '</div>';
    html += '</div>';

    // Period selector + date
    html += '<div class="import-period-bar">';
    html += '<span class="import-period-label">This data is for:</span>';
    html += '<label class="import-period-option">';
    html += '<input type="radio" name="importPeriod" value="cy"' + (state.period === "cy" ? ' checked' : '') + ' onchange="app.importState.period=\'cy\'; app.renderColumnMapping(document.getElementById(\'treeContainer\'))">';
    html += ' Current Year (CY)';
    html += '</label>';
    html += '<label class="import-period-option">';
    html += '<input type="radio" name="importPeriod" value="py"' + (state.period === "py" ? ' checked' : '') + ' onchange="app.importState.period=\'py\'; app.renderColumnMapping(document.getElementById(\'treeContainer\'))">';
    html += ' Prior Year (PY)';
    html += '</label>';

    // Date input
    html += '<span class="import-period-separator">|</span>';
    html += '<span class="import-period-label">As of:</span>';
    html += '<input type="date" class="import-date-input" id="importPeriodDate" value="' + (state.periodDate || '') + '" onchange="app.importState.periodDate = this.value">';

    // QBO hierarchy checkbox
    html += '<span class="import-period-separator">|</span>';
    html += '<label class="import-period-option">';
    html += '<input type="checkbox" id="importQboHierarchy" ' + (state.parseQboHierarchy !== false ? 'checked' : '') + ' onchange="app.importState.parseQboHierarchy = this.checked">';
    html += ' Parse QBO hierarchy (colon-separated)';
    html += '</label>';
    html += '</div>';

    // Data table with dropdown headers + row checkboxes
    html += '<div class="import-data-table-wrap">';
    html += '<table class="import-preview-table import-full-table">';

    // Dropdown header row
    html += '<thead>';
    html += '<tr class="import-dropdown-row">';
    html += '<th class="import-row-check-header"></th>'; // checkbox column header
    state.headers.forEach((h, i) => {
        const currentType = state.columnMappings[i] || "skip";
        const isSkipped = currentType === "skip";
        const isActive = !isSkipped;
        html += '<th class="import-col-dropdown-cell' + (isActive ? ' mapped' : '') + (isSkipped ? ' col-skipped' : '') + '">';
        html += '<select class="import-col-select' + (isActive ? ' active' : '') + '" data-col="' + i + '" onchange="app.updateColumnType(this)">';
        IMPORT_COLUMN_TYPES.forEach(type => {
            html += '<option value="' + type.value + '"' + (currentType === type.value ? ' selected' : '') + '>' + type.label + '</option>';
        });
        html += '</select>';
        html += '</th>';
    });
    html += '</tr>';

    // Original header row
    html += '<tr>';
    html += '<th class="import-row-check-header"></th>';
    state.headers.forEach((h, i) => {
        const currentType = state.columnMappings[i] || "skip";
        const isSkipped = currentType === "skip";
        const isActive = !isSkipped;
        html += '<th class="' + (isActive ? 'mapped' : '') + (isSkipped ? ' col-skipped' : '') + '">' + this.escapeHtml(h || "Col " + (i + 1)) + '</th>';
    });
    html += '</tr>';
    html += '</thead>';

    // Data rows with checkboxes
    html += '<tbody>';
    pageRows.forEach((row, ri) => {
        const globalIdx = startRow + ri;
        const isIgnored = !!state.ignoredRows[globalIdx];
        html += '<tr class="' + (isIgnored ? 'import-row-ignored' : '') + '">';
        html += '<td class="import-row-check-cell">';
        html += '<input type="checkbox" class="import-row-cb" data-row="' + globalIdx + '" ' + (isIgnored ? '' : 'checked') + ' onchange="app.toggleImportRow(' + globalIdx + ', this.checked)" title="' + (isIgnored ? 'Row ignored' : 'Uncheck to ignore this row') + '">';
        html += '</td>';
        state.headers.forEach((_, ci) => {
            const currentType = state.columnMappings[ci] || "skip";
            const isSkipped = currentType === "skip";
            const isActive = !isSkipped;
            html += '<td class="' + (isActive ? 'col-active' : '') + (isSkipped ? ' col-skipped' : '') + '">' + this.escapeHtml(row[ci] || "") + '</td>';
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';

    // Pagination
    if (totalPages > 1) {
        html += '<div class="import-pagination">';
        html += '<button class="import-page-btn" ' + (page === 0 ? 'disabled' : '') + ' onclick="app.importSetPage(' + (page - 1) + ')">&laquo; Prev</button>';
        html += '<span class="import-page-info">Rows ' + (startRow + 1) + '-' + endRow + ' of ' + totalRows + ' (Page ' + (page + 1) + ' of ' + totalPages + ')</span>';
        html += '<button class="import-page-btn" ' + (page >= totalPages - 1 ? 'disabled' : '') + ' onclick="app.importSetPage(' + (page + 1) + ')">Next &raquo;</button>';
        html += '</div>';
    } else {
        html += '<div class="import-pagination">';
        html += '<span class="import-page-info">' + totalRows + ' rows</span>';
        html += '</div>';
    }

    // Mapping summary
    html += this.renderMappingSummary();

    // Buttons
    html += '<div class="import-actions">';
    html += '<button class="import-btn-secondary" onclick="app.importState = null; app.renderImportScreen();">Back</button>';
    html += '<button class="import-btn-primary" onclick="app.processImportMapping()">Import Accounts</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
};

App.prototype.renderMappingSummary = function() {
    const m = this.importState.columnMappings;
    const headers = this.importState.headers;
    let html = '<div class="import-mapping-summary">';

    const mapped = [];
    m.forEach((type, i) => {
        if (type !== "skip") {
            const typeLabel = IMPORT_COLUMN_TYPES.find(t => t.value === type);
            mapped.push('<span class="import-mapped-tag">' + (typeLabel ? typeLabel.label : type) + ': <strong>' + this.escapeHtml(headers[i]) + '</strong></span>');
        }
    });

    if (mapped.length === 0) {
        html += '<span class="import-mapping-warn">No columns mapped. Use the dropdowns above each column to assign types.</span>';
    } else {
        html += mapped.join('');
    }

    const hasAcct = m.some(t => t === "accountNum" || t === "accountName" || t === "extractNum");
    const hasAmount = m.some(t => t === "debit" || t === "credit" || t === "netAmount");
    if (!hasAcct) {
        html += '<span class="import-mapping-warn">Missing account column (Account #, Account Name, or Extract # from Name)</span>';
    }
    if (!hasAmount) {
        html += '<span class="import-mapping-warn">Missing amount column (Debit/Credit or Net Amount)</span>';
    }

    html += '</div>';
    return html;
};

App.prototype.updateColumnType = function(selectEl) {
    const colIndex = parseInt(selectEl.dataset.col);
    this.importState.columnMappings[colIndex] = selectEl.value;
    this.renderColumnMapping(document.getElementById("treeContainer"));
};

App.prototype.importSetPage = function(page) {
    this.importState.page = Math.max(0, page);
    this.renderColumnMapping(document.getElementById("treeContainer"));
};

App.prototype.toggleImportRow = function(rowIndex, isChecked) {
    if (isChecked) {
        delete this.importState.ignoredRows[rowIndex];
    } else {
        this.importState.ignoredRows[rowIndex] = true;
    }
    // Update the row styling without full re-render (faster for large tables)
    var row = document.querySelector('.import-row-cb[data-row="' + rowIndex + '"]');
    if (row) {
        var tr = row.closest("tr");
        if (tr) {
            if (isChecked) tr.classList.remove("import-row-ignored");
            else tr.classList.add("import-row-ignored");
        }
    }
    // Update row count in header desc
    var descEl = document.querySelector(".import-desc");
    if (descEl) {
        var total = this.importState.dataRows.length;
        var ignored = Object.keys(this.importState.ignoredRows).length;
        var active = total - ignored;
        var extra = ignored > 0 ? " (" + ignored + " ignored)" : "";
        // Just update the count portion
        descEl.innerHTML = descEl.innerHTML.replace(/\d+ rows(\s*\(\d+ ignored\))?/, active + " rows" + extra);
    }
};

// ===== Process mapping into accounts =====

App.prototype.processImportMapping = function() {
    const state = this.importState;
    const m = state.columnMappings;
    const parseHierarchy = state.parseQboHierarchy !== false;

    const hasAcct = m.some(t => t === "accountNum" || t === "accountName" || t === "extractNum");
    const hasAmount = m.some(t => t === "debit" || t === "credit" || t === "netAmount");

    if (!hasAcct) {
        this.showModal("Missing Column", "Please map at least one account column (Account #, Account Name, or Extract # from Name).", [{ label: "OK" }]);
        return;
    }
    if (!hasAmount) {
        this.showModal("Missing Column", "Please map at least one amount column (Debit, Credit, or Net Amount).", [{ label: "OK" }]);
        return;
    }

    const colOf = function(type) { return m.indexOf(type); };

    const acctNumCol = colOf("accountNum");
    const acctNameCol = colOf("accountName");
    const extractNumCol = colOf("extractNum");
    const debitCol = colOf("debit");
    const creditCol = colOf("credit");
    const netAmountCol = colOf("netAmount");

    const accounts = [];

    state.dataRows.forEach((row, rowIdx) => {
        // Skip ignored rows
        if (state.ignoredRows[rowIdx]) return;

        let number = "";
        let name = "";
        let amount = 0;
        let sign = "+";

        if (extractNumCol >= 0) {
            let fullName = (row[extractNumCol] || "").trim();
            if (parseHierarchy && fullName.includes(":")) {
                const parts = fullName.split(":");
                fullName = parts[parts.length - 1].trim();
            }
            const match = fullName.match(/^(\d+)\s+(.*)/);
            if (match) {
                number = match[1];
                name = match[2];
            } else {
                number = String(1000 + rowIdx);
                name = fullName;
            }
        }

        if (acctNumCol >= 0) {
            number = (row[acctNumCol] || "").trim();
        }
        if (acctNameCol >= 0) {
            name = (row[acctNameCol] || "").trim();
        }

        if (!number) number = String(1000 + rowIdx);
        if (!name) name = "Account " + number;

        if (debitCol >= 0 || creditCol >= 0) {
            const debit = this.parseImportNumber(row[debitCol] || "0");
            const credit = this.parseImportNumber(row[creditCol] || "0");
            if (credit > debit) {
                amount = credit - debit;
                sign = "-";
            } else {
                amount = debit - credit;
                sign = "+";
            }
        } else if (netAmountCol >= 0) {
            const val = this.parseImportNumber(row[netAmountCol] || "0");
            amount = Math.abs(val);
            sign = val < 0 ? "-" : "+";
        }

        if (!name || name.trim() === "") return;

        const acctObj = {
            number: number,
            name: name,
            sign: sign,
            dimensions: createEmptyAccountDimensions()
        };

        if (state.period === "cy") {
            acctObj.amountCY = amount;
            acctObj.amountPY = 0;
        } else {
            acctObj.amountCY = 0;
            acctObj.amountPY = amount;
        }

        accounts.push(acctObj);
    });

    state.parsedAccounts = accounts;

    // Validate before proceeding
    var issues = this.validateImportAccounts(accounts, state);
    if (issues.hasDuplicates || issues.outOfBalance) {
        state.validationIssues = issues;
        state.step = "validation";
        state.page = 0;
        this.renderImportScreen();
        return;
    }

    this.proceedAfterValidation();
};

App.prototype.proceedAfterValidation = function() {
    var state = this.importState;
    var accounts = state.parsedAccounts;
    var hasExisting = this.data.accounts && this.data.accounts.length > 0;

    if (hasExisting) {
        this.buildMergePreview(accounts);
        state.step = "merge-confirm";
        state.page = 0;
    } else {
        state.step = "preview";
        state.page = 0;
    }

    this.renderImportScreen();
};

// ===== Validation: duplicates + balance check =====

App.prototype.validateImportAccounts = function(accounts, state) {
    var issues = { hasDuplicates: false, duplicates: [], outOfBalance: false, balanceDiff: 0, totalDebits: 0, totalCredits: 0 };

    // Check for duplicate account numbers
    var seen = {};
    accounts.forEach(function(acct, idx) {
        var num = acct.number;
        if (!seen[num]) {
            seen[num] = [];
        }
        seen[num].push({ index: idx, account: acct });
    });

    for (var num in seen) {
        if (seen[num].length > 1) {
            issues.hasDuplicates = true;
            issues.duplicates.push({ number: num, entries: seen[num] });
        }
    }

    // Check debit/credit balance
    // Sum using the original sign convention: + sign = debit, - sign = credit
    var amtField = state.period === "cy" ? "amountCY" : "amountPY";
    var totalDebits = 0;
    var totalCredits = 0;
    accounts.forEach(function(acct) {
        var amt = acct[amtField] || 0;
        if (acct.sign === "+") {
            totalDebits += amt;
        } else {
            totalCredits += amt;
        }
    });

    issues.totalDebits = totalDebits;
    issues.totalCredits = totalCredits;
    var diff = Math.abs(totalDebits - totalCredits);
    // Allow a small rounding tolerance of $1
    if (diff > 1) {
        issues.outOfBalance = true;
        issues.balanceDiff = totalDebits - totalCredits;
    }

    return issues;
};

App.prototype.renderValidationScreen = function(container) {
    var state = this.importState;
    var issues = state.validationIssues;
    var amtField = state.period === "cy" ? "amountCY" : "amountPY";

    var html = '<div class="import-screen import-screen-wide">';
    html += '<div class="import-header">Import Issues Found</div>';
    html += '<div class="import-desc">The following issues must be resolved before importing.</div>';

    // Duplicate account numbers
    if (issues.hasDuplicates) {
        html += '<div class="validation-section">';
        html += '<div class="validation-section-title">Duplicate Account Numbers</div>';
        html += '<div class="validation-section-desc">Each account number must be unique. Remove duplicates to continue.</div>';
        html += '<div class="import-data-table-wrap">';
        html += '<table class="import-preview-table">';
        html += '<thead><tr><th>Account #</th><th>Account Name</th><th>Sign</th><th>Amount</th><th>Action</th></tr></thead>';
        html += '<tbody>';

        issues.duplicates.forEach(function(dup) {
            dup.entries.forEach(function(entry, i) {
                var acct = entry.account;
                var rowClass = i === 0 ? "validation-dup-first" : "validation-dup-row";
                html += '<tr class="' + rowClass + '">';
                html += '<td style="font-family:monospace;font-weight:600;color:#dc2626;">' + acct.number + '</td>';
                html += '<td>' + acct.name + '</td>';
                html += '<td style="text-align:center;">' + acct.sign + '</td>';
                html += '<td style="text-align:right;font-family:monospace;">' + app.formatAmount(acct[amtField]) + '</td>';
                html += '<td><button class="validation-remove-btn" onclick="app.removeValidationDuplicate(' + entry.index + ')">Remove</button></td>';
                html += '</tr>';
            });
        });

        html += '</tbody></table></div>';
        html += '</div>';
    }

    // Balance check
    if (issues.outOfBalance) {
        var diffAbs = Math.abs(issues.balanceDiff);
        var diffDir = issues.balanceDiff > 0 ? "more debits than credits" : "more credits than debits";
        html += '<div class="validation-section">';
        html += '<div class="validation-section-title">Trial Balance Does Not Balance</div>';
        html += '<div class="validation-section-desc">Debits must equal credits. The trial balance is out of balance by <strong>' + app.formatAmount(diffAbs) + '</strong> (' + diffDir + ').</div>';
        html += '<div class="validation-balance-summary">';
        html += '<div class="validation-balance-row"><span>Total Debits (+ sign accounts):</span><span class="validation-balance-amt">' + app.formatAmount(issues.totalDebits) + '</span></div>';
        html += '<div class="validation-balance-row"><span>Total Credits (- sign accounts):</span><span class="validation-balance-amt">' + app.formatAmount(issues.totalCredits) + '</span></div>';
        html += '<div class="validation-balance-row validation-balance-diff"><span>Difference:</span><span class="validation-balance-amt">' + app.formatAmount(diffAbs) + '</span></div>';
        html += '</div>';
        html += '<div class="validation-section-desc" style="margin-top:8px;">Please fix the source file and re-upload, or map the difference to Retained Earnings.</div>';
        html += '</div>';
    }

    // Action buttons
    html += '<div class="import-actions">';
    html += '<button class="import-btn-secondary" onclick="app.importState.step = \'mapping\'; app.importState.page = 0; app.importState.validationIssues = null; app.renderImportScreen();">Back to Mapping</button>';

    // Only allow re-upload
    html += '<button class="import-btn-secondary" onclick="app.importState = null; app.renderImportScreen();">Re-upload File</button>';

    // If only out of balance (no duplicates), offer to map difference to RE
    if (issues.outOfBalance && !issues.hasDuplicates) {
        html += '<button class="import-btn-primary" onclick="app.addRetainedEarningsAdjustment()">Map Difference to Retained Earnings</button>';
    }

    // If no issues remain after removing duplicates, show continue
    if (!issues.hasDuplicates && !issues.outOfBalance) {
        html += '<button class="import-btn-primary" onclick="app.proceedAfterValidation()">Continue Import</button>';
    }

    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
};

App.prototype.removeValidationDuplicate = function(accountIndex) {
    var state = this.importState;
    // Remove the account at this index
    state.parsedAccounts.splice(accountIndex, 1);

    // Re-validate
    var issues = this.validateImportAccounts(state.parsedAccounts, state);
    if (issues.hasDuplicates || issues.outOfBalance) {
        state.validationIssues = issues;
        this.renderImportScreen();
    } else {
        // All clear, proceed
        state.validationIssues = null;
        this.proceedAfterValidation();
    }
};

App.prototype.addRetainedEarningsAdjustment = function() {
    var state = this.importState;
    var issues = state.validationIssues;
    var amtField = state.period === "cy" ? "amountCY" : "amountPY";
    var diff = issues.balanceDiff; // positive means more debits

    // Create a Retained Earnings adjustment account
    var reAcct = {
        number: "RE-ADJ",
        name: "Retained Earnings (Import Adjustment)",
        sign: diff > 0 ? "-" : "+",
        dimensions: createEmptyAccountDimensions()
    };
    reAcct.amountCY = 0;
    reAcct.amountPY = 0;
    reAcct[amtField] = Math.abs(diff);

    state.parsedAccounts.push(reAcct);

    // Re-validate
    var newIssues = this.validateImportAccounts(state.parsedAccounts, state);
    if (newIssues.hasDuplicates || newIssues.outOfBalance) {
        state.validationIssues = newIssues;
        this.renderImportScreen();
    } else {
        state.validationIssues = null;
        this.proceedAfterValidation();
    }
};

App.prototype.parseImportNumber = function(str) {
    if (!str || typeof str !== "string") return 0;
    str = str.trim();
    if (!str || str === "-") return 0;
    const isNeg = str.startsWith("(") || str.startsWith("-");
    const cleaned = str.replace(/[$(),\s]/g, "").replace(/^-/, "");
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return isNeg ? -num : num;
};

// ===== Step 3: Preview & confirm (first import) =====

App.prototype.renderImportPreview = function(container) {
    const state = this.importState;
    const accounts = state.parsedAccounts;
    const totalRows = accounts.length;
    const totalPages = Math.ceil(totalRows / IMPORT_PAGE_SIZE);
    const page = state.page || 0;
    const startRow = page * IMPORT_PAGE_SIZE;
    const endRow = Math.min(startRow + IMPORT_PAGE_SIZE, totalRows);
    const pageAccounts = accounts.slice(startRow, endRow);

    const periodLabel = state.period === "cy" ? "Current Year" : "Prior Year";
    const dateLabel = state.periodDate ? " (as of " + this.formatDateLabel(state.periodDate) + ")" : "";
    const amtField = state.period === "cy" ? "amountCY" : "amountPY";

    let html = '<div class="import-screen import-screen-wide">';
    html += '<div class="import-header">Review Import</div>';
    html += '<div class="import-desc">' + accounts.length + ' accounts parsed from <strong>' + this.escapeHtml(state.fileName) + '</strong> as <strong>' + periodLabel + dateLabel + '</strong> data</div>';

    html += '<div class="import-warning">';
    html += 'This will <strong>replace all existing accounts</strong> and clear all mappings. Use undo (Ctrl+Z) to revert if needed.';
    html += '</div>';

    html += '<div class="import-data-table-wrap">';
    html += '<table class="import-preview-table">';
    html += '<thead><tr><th>#</th><th>Account #</th><th>Account Name</th><th>Sign</th><th>' + periodLabel + '</th></tr></thead>';
    html += '<tbody>';
    pageAccounts.forEach((acct, i) => {
        html += '<tr>';
        html += '<td style="color:#94a3b8;">' + (startRow + i + 1) + '</td>';
        html += '<td style="font-family:monospace;font-weight:600;color:#17375E;">' + this.escapeHtml(acct.number) + '</td>';
        html += '<td>' + this.escapeHtml(acct.name) + '</td>';
        html += '<td style="text-align:center;">' + acct.sign + '</td>';
        html += '<td style="text-align:right;font-family:monospace;">' + this.formatAmount(acct[amtField]) + '</td>';
        html += '</tr>';
    });
    html += '</tbody></table></div>';

    if (totalPages > 1) {
        html += '<div class="import-pagination">';
        html += '<button class="import-page-btn" ' + (page === 0 ? 'disabled' : '') + ' onclick="app.importState.page=' + (page - 1) + '; app.renderImportScreen()">&laquo; Prev</button>';
        html += '<span class="import-page-info">Rows ' + (startRow + 1) + '-' + endRow + ' of ' + totalRows + ' (Page ' + (page + 1) + ' of ' + totalPages + ')</span>';
        html += '<button class="import-page-btn" ' + (page >= totalPages - 1 ? 'disabled' : '') + ' onclick="app.importState.page=' + (page + 1) + '; app.renderImportScreen()">Next &raquo;</button>';
        html += '</div>';
    }

    if (state.metaOrgName) {
        html += '<div class="import-options">';
        html += '<label class="import-option-label">';
        html += '<input type="checkbox" id="importSetOrgName" checked>';
        html += ' Set organization name to: <strong>' + this.escapeHtml(state.metaOrgName) + '</strong>';
        html += '</label>';
        html += '</div>';
    }

    html += '<div class="import-actions">';
    html += '<button class="import-btn-secondary" onclick="app.importState.step = \'mapping\'; app.importState.page = 0; app.renderImportScreen();">Back</button>';
    html += '<button class="import-btn-primary" onclick="app.confirmImport()">Import ' + accounts.length + ' Accounts</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
};

App.prototype.confirmImport = function() {
    const state = this.importState;
    const accounts = state.parsedAccounts;

    this.saveState();

    if (state.metaOrgName) {
        const checkbox = document.getElementById("importSetOrgName");
        if (checkbox && checkbox.checked) {
            this.data.orgName = state.metaOrgName;
        }
    }

    this.data.accounts = accounts;

    // Clear all mappings
    this.data.views.forEach(view => {
        const clearMappings = (nodes) => {
            nodes.forEach(node => {
                node.accounts = [];
                if (node.children) clearMappings(node.children);
            });
        };
        clearMappings(view.statements);
    });

    // Flow date to preview column headers
    this.applyImportDate(state.period, state.periodDate);

    this.importTabActive = false;
    this.importState = null;
    this.render();
};

// Update preview column header labels with the imported date
App.prototype.applyImportDate = function(period, dateStr) {
    if (!dateStr) return;
    var label = this.formatDateLabel(dateStr);
    if (!label) return;
    if (period === "cy") {
        this.previewCYDate = label;
    } else {
        this.previewPYDate = label;
    }
};

// ===== Merge: auto-match + confirm =====

App.prototype.buildMergePreview = function(newAccounts) {
    const state = this.importState;
    const existing = this.data.accounts;

    const matched = [];
    const unmatched = [];

    const existingByNum = {};
    existing.forEach((acct, idx) => {
        existingByNum[acct.number] = { acct: acct, index: idx };
    });

    newAccounts.forEach(newAcct => {
        const match = existingByNum[newAcct.number];
        if (match) {
            matched.push({
                existingAcct: match.acct,
                newAcct: newAcct,
                existingIndex: match.index
            });
            delete existingByNum[newAcct.number];
        } else {
            unmatched.push(newAcct);
        }
    });

    const untouched = Object.values(existingByNum).map(e => e.acct);

    state.mergeData = {
        matched: matched,
        unmatched: unmatched,
        untouched: untouched
    };
};

App.prototype.renderMergeConfirm = function(container) {
    const state = this.importState;
    const merge = state.mergeData;
    const periodLabel = state.period === "cy" ? "Current Year" : "Prior Year";
    const existingPeriodLabel = state.period === "cy" ? "Prior Year" : "Current Year";
    const dateLabel = state.periodDate ? " (as of " + this.formatDateLabel(state.periodDate) + ")" : "";

    let html = '<div class="import-screen import-screen-wide">';
    html += '<div class="import-header">Confirm Merge</div>';
    html += '<div class="import-desc">Merging <strong>' + periodLabel + dateLabel + '</strong> data from <strong>' + this.escapeHtml(state.fileName) + '</strong> into existing accounts</div>';

    html += '<div class="import-merge-summary">';
    html += '<div class="merge-stat merge-stat-good"><span class="merge-stat-num">' + merge.matched.length + '</span> Matched</div>';
    html += '<div class="merge-stat merge-stat-warn"><span class="merge-stat-num">' + merge.unmatched.length + '</span> New (unmatched)</div>';
    html += '<div class="merge-stat merge-stat-info"><span class="merge-stat-num">' + merge.untouched.length + '</span> Unchanged</div>';
    html += '</div>';

    if (merge.matched.length > 0) {
        html += '<div class="import-merge-section">';
        html += '<div class="import-merge-section-header">Matched Accounts (' + merge.matched.length + ')</div>';
        html += '<div class="import-data-table-wrap" style="max-height:300px;">';
        html += '<table class="import-preview-table">';
        html += '<thead><tr><th>Account #</th><th>Account Name</th><th>' + existingPeriodLabel + '</th><th>' + periodLabel + ' (new)</th></tr></thead>';
        html += '<tbody>';
        merge.matched.forEach(m => {
            const existingAmt = state.period === "cy" ? m.existingAcct.amountPY : m.existingAcct.amountCY;
            const newAmt = state.period === "cy" ? m.newAcct.amountCY : m.newAcct.amountPY;
            html += '<tr>';
            html += '<td style="font-family:monospace;font-weight:600;color:#17375E;">' + this.escapeHtml(m.existingAcct.number) + '</td>';
            html += '<td>' + this.escapeHtml(m.existingAcct.name) + '</td>';
            html += '<td style="text-align:right;font-family:monospace;">' + this.formatAmount(existingAmt) + '</td>';
            html += '<td style="text-align:right;font-family:monospace;color:#16a34a;font-weight:600;">' + this.formatAmount(newAmt) + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        html += '</div>';
    }

    if (merge.unmatched.length > 0) {
        html += '<div class="import-merge-section">';
        html += '<div class="import-merge-section-header" style="color:#b45309;">New Accounts - Not Matched (' + merge.unmatched.length + ')</div>';
        html += '<div class="import-merge-section-desc">These accounts will be added to the account pool. You can map them to the hierarchy afterward.</div>';
        html += '<div class="import-data-table-wrap" style="max-height:200px;">';
        html += '<table class="import-preview-table">';
        html += '<thead><tr><th>Account #</th><th>Account Name</th><th>Sign</th><th>' + periodLabel + '</th></tr></thead>';
        html += '<tbody>';
        merge.unmatched.forEach(acct => {
            const amt = state.period === "cy" ? acct.amountCY : acct.amountPY;
            html += '<tr>';
            html += '<td style="font-family:monospace;font-weight:600;color:#b45309;">' + this.escapeHtml(acct.number) + '</td>';
            html += '<td>' + this.escapeHtml(acct.name) + '</td>';
            html += '<td style="text-align:center;">' + acct.sign + '</td>';
            html += '<td style="text-align:right;font-family:monospace;">' + this.formatAmount(amt) + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        html += '</div>';
    }

    if (merge.untouched.length > 0) {
        html += '<div class="import-merge-section">';
        html += '<div class="import-merge-section-header" style="color:#64748b;">Unchanged Accounts (' + merge.untouched.length + ')</div>';
        html += '<div class="import-merge-section-desc">These existing accounts were not found in the new file and will keep their current values.</div>';
        html += '</div>';
    }

    html += '<div class="import-actions">';
    html += '<button class="import-btn-secondary" onclick="app.importState.step = \'mapping\'; app.importState.page = 0; app.renderImportScreen();">Back</button>';
    html += '<button class="import-btn-primary" onclick="app.confirmMerge()">Merge ' + periodLabel + ' Data</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
};

App.prototype.confirmMerge = function() {
    const state = this.importState;
    const merge = state.mergeData;
    const period = state.period;

    this.saveState();

    merge.matched.forEach(m => {
        if (period === "cy") {
            m.existingAcct.amountCY = m.newAcct.amountCY;
        } else {
            m.existingAcct.amountPY = m.newAcct.amountPY;
        }
    });

    merge.unmatched.forEach(acct => {
        this.data.accounts.push(acct);
    });

    // Flow date to preview column headers
    this.applyImportDate(state.period, state.periodDate);

    this.importTabActive = false;
    this.importState = null;
    this.render();
};
