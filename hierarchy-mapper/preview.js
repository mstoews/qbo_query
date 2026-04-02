// preview.js
// Live financial statement preview panel
// Renders a read-only preview with configurable columns
// Supports per-node display options: showAmounts, bold, showTotal, totalName
// Supports per-statement total method: "sum" or "net", with visible toggle

// Available column types that can be added
App.prototype.getAvailableColumnTypes = function() {
    return [
        { id: "py", label: "Prior Year", field: "amountPY" },
        { id: "diff", label: "Difference", computed: true },
        { id: "pctDiff", label: "% Variance", computed: true }
    ];
};

App.prototype.renderPreview = function() {
    const container = document.getElementById("previewContainer");
    if (!container) return;

    const view = this.data.views[this.currentViewIndex];
    if (!view || !view.statements || view.statements.length === 0) {
        container.innerHTML = '<div class="preview-placeholder">Map accounts to see a live preview of your financial statement here.</div>';
        return;
    }

    const totalMapped = this.countAllMappedAccounts(view.statements);
    if (totalMapped === 0) {
        container.innerHTML = '<div class="preview-placeholder">Map accounts to see a live preview of your financial statement here.</div>';
        return;
    }

    const cols = this.previewColumns;

    let html = '<div class="preview-statement">';

    // Org name and view name
    html += '<div class="preview-org-name">' + this.escapeHtml(this.data.orgName) + '</div>';
    html += '<div class="preview-view-name">' + this.escapeHtml(view.name) + '</div>';

    // Column header row with editable dates and + button
    html += '<div class="preview-date-row">';
    html += '<span class="preview-date-spacer"></span>';

    cols.forEach((col, i) => {
        const colLabel = this.getPreviewColumnLabel(col);
        const removable = col.removable !== false;
        const colBoldCls = col.bold ? ' col-header-bold' : '';
        html += '<span class="preview-col-header' + colBoldCls + '" draggable="true" data-col-index="' + i + '" data-col-id="' + col.id + '" title="' + (col.id === "cy" || col.id === "py" ? "Double-click to edit, right-click for options, drag to reorder" : "Right-click for options, drag to reorder") + '">';
        if (removable) {
            html += '<span class="col-remove-btn" data-col-index="' + i + '" title="Remove column">&times;</span>';
        }
        html += '<span class="col-label-text">' + this.escapeHtml(colLabel) + '</span>';
        html += '</span>';
    });

    // Add column button
    html += '<span class="preview-add-col-btn" title="Add column">+</span>';
    html += '</div>';

    view.statements.forEach(stmt => {
        html += this.renderPreviewNode(stmt, 0);
    });

    // Unmapped accounts indicator
    html += this.renderUnmappedIndicator();

    html += '</div>';
    container.innerHTML = html;

    // Attach handlers
    this.attachPreviewHandlers(container);
};

App.prototype.getPreviewColumnLabel = function(col) {
    if (col.id === "cy") return this.previewCYDate || "Dec 31, 2025";
    if (col.id === "py") return this.previewPYDate || "Dec 31, 2024";
    if (col.id === "diff") return "Difference";
    if (col.id === "pctDiff") return "% Variance";
    return col.label || col.id;
};

App.prototype.attachPreviewHandlers = function(container) {
    // Double-click to edit CY/PY date labels
    container.querySelectorAll(".preview-col-header").forEach(el => {
        const colId = el.dataset.colId;
        if (colId === "cy" || colId === "py") {
            el.ondblclick = (e) => {
                if (e.target.classList.contains("col-remove-btn")) return;
                const currentVal = colId === "cy" ? (this.previewCYDate || "Dec 31, 2025") : (this.previewPYDate || "Dec 31, 2024");
                const labelSpan = el.querySelector(".col-label-text");
                const input = document.createElement("input");
                input.type = "text";
                input.value = currentVal;
                input.style.cssText = "width:100%;font-size:11px;text-align:center;padding:2px;border:1px solid #4a90d9;border-radius:2px;font-family:inherit;";
                labelSpan.innerHTML = "";
                labelSpan.appendChild(input);
                input.focus();
                input.select();

                const finish = () => {
                    const val = input.value.trim() || currentVal;
                    if (colId === "cy") this.previewCYDate = val;
                    else this.previewPYDate = val;
                    this.renderPreview();
                };
                input.onblur = finish;
                input.onkeydown = (ev) => {
                    if (ev.key === "Enter") finish();
                    if (ev.key === "Escape") this.renderPreview();
                };
            };
        }
    });

    // Remove column buttons
    container.querySelectorAll(".col-remove-btn").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.colIndex);
            this.previewColumns.splice(idx, 1);
            this.renderPreview();
        };
    });

    // Column drag-to-reorder
    let dragColIndex = null;
    container.querySelectorAll(".preview-col-header").forEach(el => {
        el.ondragstart = (e) => {
            if (e.target.classList.contains("col-remove-btn")) { e.preventDefault(); return; }
            dragColIndex = parseInt(el.dataset.colIndex);
            el.classList.add("col-dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", dragColIndex.toString());
        };

        el.ondragover = (e) => {
            if (dragColIndex === null) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            container.querySelectorAll(".preview-col-header").forEach(h => h.classList.remove("col-drop-left", "col-drop-right"));
            const targetIdx = parseInt(el.dataset.colIndex);
            if (targetIdx !== dragColIndex) {
                const rect = el.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;
                if (e.clientX < midX) el.classList.add("col-drop-left");
                else el.classList.add("col-drop-right");
            }
        };

        el.ondragleave = () => { el.classList.remove("col-drop-left", "col-drop-right"); };

        el.ondrop = (e) => {
            e.preventDefault();
            const fromIdx = dragColIndex;
            const toIdx = parseInt(el.dataset.colIndex);
            if (fromIdx !== null && fromIdx !== toIdx) {
                const rect = el.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;
                let insertIdx = e.clientX < midX ? toIdx : toIdx + 1;
                if (fromIdx < insertIdx) insertIdx--;
                const col = this.previewColumns.splice(fromIdx, 1)[0];
                this.previewColumns.splice(insertIdx, 0, col);
                this.renderPreview();
            }
            dragColIndex = null;
        };

        el.ondragend = () => {
            dragColIndex = null;
            container.querySelectorAll(".preview-col-header").forEach(h => {
                h.classList.remove("col-dragging", "col-drop-left", "col-drop-right");
            });
        };
    });

    // Right-click on column headers for bold toggle
    container.querySelectorAll(".preview-col-header").forEach(el => {
        el.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const colIndex = parseInt(el.dataset.colIndex);
            this.showColContextMenu(e, colIndex);
        };
    });

    // Add column button
    const addBtn = container.querySelector(".preview-add-col-btn");
    if (addBtn) {
        addBtn.onclick = (e) => {
            e.stopPropagation();
            this.showAddColumnMenu(addBtn);
        };
    }
};

App.prototype.showColContextMenu = function(e, colIndex) {
    // Close any existing context menus
    const existing = document.getElementById("nodeContextMenu");
    if (existing) existing.remove();
    const existingCol = document.getElementById("colContextMenu");
    if (existingCol) existingCol.remove();

    const col = this.previewColumns[colIndex];
    if (!col) return;

    const menu = document.createElement("div");
    menu.className = "node-context-menu";
    menu.id = "colContextMenu";

    // Bold toggle
    const isBold = col.bold || false;
    const boldItem = document.createElement("div");
    boldItem.className = "ctx-item";
    boldItem.innerHTML = (isBold ? '&#10003; ' : '&nbsp;&nbsp;&nbsp; ') + 'Bold Column';
    boldItem.onclick = () => {
        col.bold = !isBold;
        menu.remove();
        this.renderPreview();
    };
    menu.appendChild(boldItem);

    // Position at cursor
    document.body.appendChild(menu);
    const menuRect = menu.getBoundingClientRect();
    let x = e.clientX;
    let y = e.clientY;
    if (x + menuRect.width > window.innerWidth) x = window.innerWidth - menuRect.width - 8;
    if (y + menuRect.height > window.innerHeight) y = window.innerHeight - menuRect.height - 8;
    menu.style.left = x + "px";
    menu.style.top = y + "px";

    setTimeout(() => {
        document.addEventListener("click", function handler() {
            menu.remove();
            document.removeEventListener("click", handler);
        }, { once: true });
    }, 0);
};

App.prototype.showAddColumnMenu = function(anchorEl) {
    const existing = document.getElementById("addColMenu");
    if (existing) { existing.remove(); return; }

    const menu = document.createElement("div");
    menu.id = "addColMenu";
    menu.className = "node-context-menu";

    const currentIds = this.previewColumns.map(c => c.id);
    const types = this.getAvailableColumnTypes();
    let hasOptions = false;

    types.forEach(type => {
        if (type.id === "py" && currentIds.includes("py")) return;
        hasOptions = true;
        const item = document.createElement("div");
        item.className = "ctx-item";
        item.textContent = type.label;
        item.onclick = () => {
            const newCol = { id: type.id, label: type.label, removable: true };
            if (type.field) newCol.field = type.field;
            if (type.computed) newCol.computed = true;
            this.previewColumns.push(newCol);
            menu.remove();
            this.renderPreview();
        };
        menu.appendChild(item);
    });

    if (!hasOptions) {
        const item = document.createElement("div");
        item.className = "ctx-item";
        item.style.color = "#94a3b8";
        item.style.fontStyle = "italic";
        item.textContent = "All columns added";
        menu.appendChild(item);
    }

    document.body.appendChild(menu);
    const rect = anchorEl.getBoundingClientRect();
    menu.style.left = Math.min(rect.left, window.innerWidth - 200) + "px";
    menu.style.top = (rect.bottom + 4) + "px";

    setTimeout(() => {
        document.addEventListener("click", function handler() {
            menu.remove();
            document.removeEventListener("click", handler);
        }, { once: true });
    }, 0);
};

// Compute a column value for a single account
App.prototype.getColValue = function(col, account) {
    if (col.field) return (account[col.field] !== undefined) ? account[col.field] : 0;
    if (col.id === "diff") {
        const cy = (account.amountCY !== undefined) ? account.amountCY : 0;
        const py = (account.amountPY !== undefined) ? account.amountPY : 0;
        return cy - py;
    }
    if (col.id === "pctDiff") {
        const cy = (account.amountCY !== undefined) ? account.amountCY : 0;
        const py = (account.amountPY !== undefined) ? account.amountPY : 0;
        if (py === 0) return cy !== 0 ? 100 : 0;
        return ((cy - py) / Math.abs(py)) * 100;
    }
    return 0;
};

// Compute a column value summed for a node (respects account signs for "net" mode)
App.prototype.getColNodeTotal = function(col, node, useNet) {
    if (col.field) {
        return useNet ? this.sumNodeAmountsSigned(node, col.field) : this.sumNodeAmounts(node, col.field);
    }
    if (col.id === "diff") {
        const cy = useNet ? this.sumNodeAmountsSigned(node, "amountCY") : this.sumNodeAmounts(node, "amountCY");
        const py = useNet ? this.sumNodeAmountsSigned(node, "amountPY") : this.sumNodeAmounts(node, "amountPY");
        return cy - py;
    }
    if (col.id === "pctDiff") {
        const cy = useNet ? this.sumNodeAmountsSigned(node, "amountCY") : this.sumNodeAmounts(node, "amountCY");
        const py = useNet ? this.sumNodeAmountsSigned(node, "amountPY") : this.sumNodeAmounts(node, "amountPY");
        if (py === 0) return cy !== 0 ? 100 : 0;
        return ((cy - py) / Math.abs(py)) * 100;
    }
    return 0;
};

// Format column value for display
App.prototype.formatColValue = function(col, value, isDollarRow) {
    if (col.id === "pctDiff") {
        if (value === 0) return "-";
        if (value < 0) return "(" + Math.abs(value).toFixed(1) + "%)";
        return value.toFixed(1) + "%";
    }
    return isDollarRow ? this.formatAmountWithDollar(value) : this.formatAmount(value);
};

// Build CSS class string for an amount cell, considering column bold
App.prototype.amountClass = function(col, extraClasses) {
    let cls = "preview-amount";
    if (col.id === "pctDiff") cls += " preview-pct";
    if (col.bold) cls += " col-bold";
    if (extraClasses) cls += " " + extraClasses;
    return cls;
};

// Recursively render a node in the preview
// Per-node options: node.previewBold, node.previewShowAmounts, node.previewShowTotal, node.previewTotalName
App.prototype.renderPreviewNode = function(node, depth) {
    if (!node.visible) return '';

    let html = '';
    const hasAccounts = (node.accounts || []).length > 0;
    const hasChildren = (node.children || []).length > 0;
    const cols = this.previewColumns;

    const indent = depth * 16;
    const isStatement = depth === 0;
    const isLeaf = !hasChildren;

    // Per-node display options (with defaults)
    const showAmounts = node.previewShowAmounts !== undefined ? node.previewShowAmounts : isLeaf;
    const isBold = node.previewBold !== undefined ? node.previewBold : false;
    const showTotal = node.previewShowTotal !== undefined ? node.previewShowTotal : (hasChildren && depth > 0);
    const totalName = node.previewTotalName || ("Total " + node.name);

    // Statement total method
    const totalMethod = isStatement ? (node.totalMethod || "sum") : "sum";
    const useNet = totalMethod === "net";

    if (isStatement) {
        html += '<div class="preview-section-header" style="margin-left:' + indent + 'px;">';
        html += '<span class="preview-header-name">' + this.escapeHtml(node.name) + '</span>';
        html += '</div>';
    } else if (showAmounts) {
        // Show amounts on this line (leaf nodes default to this, groups can opt-in)
        const boldCls = isBold ? ' preview-bold' : '';
        html += '<div class="preview-account-line' + boldCls + '" style="margin-left:' + indent + 'px;">';
        html += '<span class="preview-acct-name">' + this.escapeHtml(node.name) + '</span>';
        cols.forEach(col => {
            const val = this.getColNodeTotal(col, node, false);
            html += '<span class="' + this.amountClass(col) + '">' + this.formatColValue(col, val, false) + '</span>';
        });
        html += '</div>';
    } else {
        // Group header without amounts (default for groups with children)
        const boldCls = isBold ? ' preview-bold' : '';
        html += '<div class="preview-group-header' + boldCls + '" style="margin-left:' + indent + 'px;">' + this.escapeHtml(node.name) + '</div>';

        // If group has direct accounts, show them as a rolled-up "Other" line
        if (hasAccounts) {
            html += '<div class="preview-account-line" style="margin-left:' + (indent + 16) + 'px;">';
            html += '<span class="preview-acct-name">Other ' + this.escapeHtml(node.name) + '</span>';
            cols.forEach(col => {
                let val;
                if (col.field) {
                    val = (node.accounts || []).reduce((sum, a) => sum + ((a[col.field] !== undefined) ? a[col.field] : 0), 0);
                } else if (col.id === "diff") {
                    const cy = (node.accounts || []).reduce((sum, a) => sum + ((a.amountCY !== undefined) ? a.amountCY : 0), 0);
                    const py = (node.accounts || []).reduce((sum, a) => sum + ((a.amountPY !== undefined) ? a.amountPY : 0), 0);
                    val = cy - py;
                } else if (col.id === "pctDiff") {
                    const cy = (node.accounts || []).reduce((sum, a) => sum + ((a.amountCY !== undefined) ? a.amountCY : 0), 0);
                    const py = (node.accounts || []).reduce((sum, a) => sum + ((a.amountPY !== undefined) ? a.amountPY : 0), 0);
                    val = py === 0 ? (cy !== 0 ? 100 : 0) : ((cy - py) / Math.abs(py)) * 100;
                } else {
                    val = 0;
                }
                html += '<span class="' + this.amountClass(col) + '">' + this.formatColValue(col, val, false) + '</span>';
            });
            html += '</div>';
        }
    }

    // Recurse into children (only if not showing amounts inline, or always for groups)
    // Skip for statements - they handle their own recursion in the statement total block below
    if (hasChildren && !showAmounts && !isStatement) {
        (node.children || []).forEach(child => {
            html += this.renderPreviewNode(child, depth + 1);
        });
    }

    // Render calculated accounts as individual lines
    if (!showAmounts && !isStatement) {
        html += this.renderCalcAccountLines(node, depth + 1);
    }

    // Subtotal line (controlled by showTotal flag)
    if (depth > 0 && showTotal && !showAmounts) {
        html += '<div class="preview-subtotal" style="margin-left:' + indent + 'px;">';
        html += '<span class="preview-subtotal-label">' + this.escapeHtml(totalName) + '</span>';
        cols.forEach(col => {
            const val = this.getColNodeTotal(col, node, false);
            html += '<span class="' + this.amountClass(col, "preview-subtotal-amount") + '">' + this.formatColValue(col, val, true) + '</span>';
        });
        html += '</div>';
    }

    // Statement total
    if (isStatement) {
        const totalAccounts = this.countAccounts(node);
        const stmtTotalVisible = node.previewShowTotal !== undefined ? node.previewShowTotal : true;
        const stmtTotalName = node.previewTotalName || ("Total " + node.name);

        // Recurse children for statement (always)
        if (hasChildren) {
            (node.children || []).forEach(child => {
                html += this.renderPreviewNode(child, depth + 1);
            });
        }

        // Render calculated accounts for the statement
        html += this.renderCalcAccountLines(node, depth + 1);

        if (totalAccounts > 0 && stmtTotalVisible) {
            html += '<div class="preview-total" style="margin-left:' + indent + 'px;">';
            html += '<span class="preview-total-label">' + this.escapeHtml(stmtTotalName) + '</span>';
            cols.forEach(col => {
                const val = this.getColNodeTotal(col, node, useNet);
                html += '<span class="' + this.amountClass(col, "preview-total-amount") + '">' + this.formatColValue(col, val, true) + '</span>';
            });
            html += '</div>';
        }
    }

    return html;
};

// Render calculated account lines in the preview
App.prototype.renderCalcAccountLines = function(node, depth) {
    const calcs = node.calculatedAccounts || [];
    if (calcs.length === 0) return '';

    const cols = this.previewColumns;
    const indent = depth * 16;
    const view = this.data.views[this.currentViewIndex];
    const self = this;
    let html = '';

    calcs.forEach(calc => {
        const ids = calc.sourceNodeIds || (calc.sourceNodeId ? [calc.sourceNodeId] : []);
        const isMulti = ids.length > 1;

        // Resolve source nodes
        const sourceNodes = ids.map(id => self.findNodeById(view.statements, id)).filter(Boolean);

        // Build CSS classes
        let lineClass = 'preview-account-line preview-calc-line';
        if (calc.bold) lineClass += ' preview-calc-bold';
        if (calc.underlineAbove) lineClass += ' preview-calc-underline-above';

        html += '<div class="' + lineClass + '" style="margin-left:' + indent + 'px;">';
        html += '<span class="preview-acct-name">' + self.escapeHtml(calc.name) + '</span>';
        cols.forEach(col => {
            let val = 0;
            if (isMulti) {
                // Multi-source total line: sum absolute signed totals from each source
                sourceNodes.forEach(sn => {
                    if (col.field) {
                        val += Math.abs(self.sumNodeAmountsSigned(sn, col.field));
                    } else if (col.id === "diff") {
                        val += Math.abs(self.sumNodeAmountsSigned(sn, "amountCY")) - Math.abs(self.sumNodeAmountsSigned(sn, "amountPY"));
                    }
                });
                if (col.id === "pctDiff") {
                    let totalCY = 0, totalPY = 0;
                    sourceNodes.forEach(sn => {
                        totalCY += Math.abs(self.sumNodeAmountsSigned(sn, "amountCY"));
                        totalPY += Math.abs(self.sumNodeAmountsSigned(sn, "amountPY"));
                    });
                    val = totalPY === 0 ? (totalCY !== 0 ? 100 : 0) : ((totalCY - totalPY) / Math.abs(totalPY)) * 100;
                }
            } else if (sourceNodes.length === 1) {
                // Single source: negate (flowing between statements inverts the sign)
                const sn = sourceNodes[0];
                if (col.field) {
                    val = -self.sumNodeAmountsSigned(sn, col.field);
                } else if (col.id === "diff") {
                    const cy = -self.sumNodeAmountsSigned(sn, "amountCY");
                    const py = -self.sumNodeAmountsSigned(sn, "amountPY");
                    val = cy - py;
                } else if (col.id === "pctDiff") {
                    const cy = -self.sumNodeAmountsSigned(sn, "amountCY");
                    const py = -self.sumNodeAmountsSigned(sn, "amountPY");
                    val = py === 0 ? (cy !== 0 ? 100 : 0) : ((cy - py) / Math.abs(py)) * 100;
                }
            }
            html += '<span class="' + self.amountClass(col) + '">' + self.formatColValue(col, val, false) + '</span>';
        });
        html += '</div>';
    });

    return html;
};

// Sum all account amounts for a node recursively (absolute values)
// Includes calculated accounts that pull totals from source nodes
// Multi-source calc accounts are display-only (skipped to prevent double-counting)
App.prototype.sumNodeAmounts = function(node, field, _visited) {
    if (!_visited) _visited = new Set();
    if (_visited.has(node.id)) return 0; // prevent circular
    _visited.add(node.id);

    let total = 0;
    (node.accounts || []).forEach(acct => {
        total += (acct[field] !== undefined) ? acct[field] : 0;
    });
    // Add calculated account values (single-source only; multi-source are display-only)
    (node.calculatedAccounts || []).forEach(calc => {
        const ids = calc.sourceNodeIds || (calc.sourceNodeId ? [calc.sourceNodeId] : []);
        if (ids.length !== 1) return; // multi-source = display-only, skip
        const view = this.data.views[this.currentViewIndex];
        const sourceNode = this.findNodeById(view.statements, ids[0]);
        if (sourceNode) {
            total += Math.abs(this.sumNodeAmountsSigned(sourceNode, field, new Set(_visited)));
        }
    });
    (node.children || []).forEach(child => {
        total += this.sumNodeAmounts(child, field, _visited);
    });
    return total;
};

// Sum with sign awareness: credit accounts (sign "-") subtract, debit accounts (sign "+") add
// Single-source calc accounts contribute (negated for cross-statement flow)
// Multi-source calc accounts are display-only (skipped to prevent double-counting)
App.prototype.sumNodeAmountsSigned = function(node, field, _visited) {
    if (!_visited) _visited = new Set();
    if (_visited.has(node.id)) return 0; // prevent circular
    _visited.add(node.id);

    let total = 0;
    (node.accounts || []).forEach(acct => {
        const amt = (acct[field] !== undefined) ? acct[field] : 0;
        const sign = acct.sign === "-" ? -1 : 1;
        total += amt * sign;
    });
    // Single-source calc accounts: negated (flowing between statements inverts the sign)
    // e.g. Statement of Operations surplus +46,000 becomes -46,000 credit on Balance Sheet
    // Multi-source calc accounts: display-only, skip to prevent double-counting
    (node.calculatedAccounts || []).forEach(calc => {
        const ids = calc.sourceNodeIds || (calc.sourceNodeId ? [calc.sourceNodeId] : []);
        if (ids.length !== 1) return; // multi-source = display-only, skip
        const view = this.data.views[this.currentViewIndex];
        const sourceNode = this.findNodeById(view.statements, ids[0]);
        if (sourceNode) {
            total -= this.sumNodeAmountsSigned(sourceNode, field, new Set(_visited));
        }
    });
    (node.children || []).forEach(child => {
        total += this.sumNodeAmountsSigned(child, field, _visited);
    });
    return total;
};

// Format amount for preview lines (no $ sign, parentheses for negatives)
App.prototype.formatAmount = function(amount) {
    if (amount === 0) return "-";
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (amount < 0) return "(" + formatted + ")";
    return formatted;
};

// Format amount for preview totals (with $ sign)
App.prototype.formatAmountWithDollar = function(amount) {
    if (amount === 0) return "$-";
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (amount < 0) return "($" + formatted + ")";
    return "$" + formatted;
};

// Format amount for mapped account rows in tree (compact, no $)
App.prototype.formatTreeAmount = function(amount) {
    if (amount === 0) return "-";
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (amount < 0) return "(" + formatted + ")";
    return formatted;
};

// Count all mapped accounts across all statements
App.prototype.countAllMappedAccounts = function(nodes) {
    let count = 0;
    nodes.forEach(node => {
        count += (node.accounts || []).length + (node.calculatedAccounts || []).length;
        if (node.children) {
            count += this.countAllMappedAccounts(node.children);
        }
    });
    return count;
};

// Escape HTML helper
App.prototype.escapeHtml = function(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
};

// Render unmapped accounts indicator at the bottom of the preview
App.prototype.renderUnmappedIndicator = function() {
    const view = this.data.views[this.currentViewIndex];
    const cols = this.previewColumns;
    const mappedNumbers = new Set();
    this.collectMappedAccounts(view.statements, mappedNumbers);

    const unmapped = this.data.accounts.filter(a => !mappedNumbers.has(a.number));
    if (unmapped.length === 0) return '';

    // Calculate debit and credit totals for unmapped accounts
    let unmappedDebitsCY = 0;
    let unmappedCreditsCY = 0;
    let unmappedDebitsPY = 0;
    let unmappedCreditsPY = 0;

    unmapped.forEach(a => {
        const cy = a.amountCY || 0;
        const py = a.amountPY || 0;
        if (a.sign === '+') {
            unmappedDebitsCY += cy;
            unmappedDebitsPY += py;
        } else {
            unmappedCreditsCY += cy;
            unmappedCreditsPY += py;
        }
    });

    const fmtAmt = function(val) {
        if (val === 0) return '-';
        return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    // Helper to get value for a column given debit and credit totals for CY and PY
    const colVal = function(col, debitCY, creditCY, debitPY, creditPY) {
        const cy = debitCY + creditCY;
        const py = debitPY + creditPY;
        if (col.id === 'cy' || (col.field === 'amountCY')) return cy;
        if (col.id === 'py' || (col.field === 'amountPY')) return py;
        if (col.id === 'diff') return cy - py;
        if (col.id === 'pctDiff') return py === 0 ? (cy !== 0 ? 100 : 0) : ((cy - py) / Math.abs(py)) * 100;
        return 0;
    };

    let html = '<div class="preview-unmapped-indicator">';

    // Header
    html += '<div class="preview-unmapped-header">';
    html += '<span class="preview-unmapped-icon">&#9888;</span> ';
    html += unmapped.length + ' Unmapped Account' + (unmapped.length !== 1 ? 's' : '');
    html += '</div>';

    // Debits row - aligned with preview columns
    html += '<div class="preview-unmapped-line">';
    html += '<span class="preview-unmapped-label">Unmapped Debits</span>';
    cols.forEach(col => {
        const val = colVal(col, unmappedDebitsCY, 0, unmappedDebitsPY, 0);
        const cls = col.id === 'pctDiff' ? 'preview-amount preview-pct' : 'preview-amount';
        html += '<span class="' + cls + '">' + (col.id === 'pctDiff' ? (val === 0 ? '-' : val.toFixed(1) + '%') : fmtAmt(val)) + '</span>';
    });
    html += '</div>';

    // Credits row - aligned with preview columns
    html += '<div class="preview-unmapped-line">';
    html += '<span class="preview-unmapped-label">Unmapped Credits</span>';
    cols.forEach(col => {
        const val = colVal(col, 0, unmappedCreditsCY, 0, unmappedCreditsPY);
        const cls = col.id === 'pctDiff' ? 'preview-amount preview-pct' : 'preview-amount';
        html += '<span class="' + cls + '">' + (col.id === 'pctDiff' ? (val === 0 ? '-' : val.toFixed(1) + '%') : fmtAmt(val)) + '</span>';
    });
    html += '</div>';

    // Net unmapped row
    html += '<div class="preview-unmapped-line preview-unmapped-net">';
    html += '<span class="preview-unmapped-label">Net Unmapped</span>';
    cols.forEach(col => {
        const val = colVal(col, unmappedDebitsCY, unmappedCreditsCY, unmappedDebitsPY, unmappedCreditsPY);
        const cls = col.id === 'pctDiff' ? 'preview-amount preview-pct' : 'preview-amount';
        html += '<span class="' + cls + '">' + (col.id === 'pctDiff' ? (val === 0 ? '-' : val.toFixed(1) + '%') : fmtAmt(val)) + '</span>';
    });
    html += '</div>';

    html += '</div>';
    return html;
};
