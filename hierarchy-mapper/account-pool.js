// account-pool.js
// Left panel: account list, search, filters, and bulk select

App.prototype.renderAccountsList = function() {
                const container = document.getElementById("accountsList");
                container.innerHTML = "";

                let visibleAccounts = this.data.accounts;

                if (this.accountSearchText) {
                    visibleAccounts = visibleAccounts.filter(a =>
                        a.number.toLowerCase().includes(this.accountSearchText) ||
                        a.name.toLowerCase().includes(this.accountSearchText)
                    );
                }

                if (this.rangeFilter.from || this.rangeFilter.to) {
                    const from = parseInt(this.rangeFilter.from) || 0;
                    const to = parseInt(this.rangeFilter.to) || Infinity;
                    visibleAccounts = visibleAccounts.filter(a => {
                        const num = parseInt(a.number);
                        return num >= from && num <= to;
                    });
                }

                if (this.showUnmappedOnly) {
                    const mappedNumbers = new Set();
                    this.collectMappedAccounts(this.data.views[this.currentViewIndex].statements, mappedNumbers);
                    visibleAccounts = visibleAccounts.filter(a => !mappedNumbers.has(a.number));
                }

                // Sort by account number numerically
                visibleAccounts.sort(function(a, b) {
                    var numA = parseInt(a.number) || 0;
                    var numB = parseInt(b.number) || 0;
                    return numA - numB;
                });

                visibleAccounts.forEach(account => {
                    const wrapper = document.createElement("div");
                    wrapper.className = "account-item-wrapper";

                    const item = document.createElement("div");
                    item.className = "account-item";
                    item.draggable = true;
                    item.dataset.accountNumber = account.number;

                    // Expand arrow (for dimension properties)
                    const arrow = this.buildExpandArrow(account.number);
                    item.appendChild(arrow);

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.checked = this.selectedAccounts.has(account.number);
                    checkbox.onclick = (e) => this.toggleAccountSelection(account.number, checkbox.checked, e.shiftKey, visibleAccounts);

                    const dragHandle = document.createElement("span");
                    dragHandle.className = "drag-handle";
                    dragHandle.textContent = "⋮⋮";

                    const number = document.createElement("span");
                    number.className = "account-number";
                    number.textContent = account.number;

                    const name = document.createElement("span");
                    name.className = "account-name";
                    name.textContent = account.name;

                    item.appendChild(checkbox);
                    item.appendChild(dragHandle);
                    item.appendChild(number);
                    item.appendChild(name);

                    // Dimension badges
                    item.appendChild(this.buildDimBadgesEl(account));

                    const mappedNode = this.findNodeContainingAccount(this.data.views[this.currentViewIndex].statements, account.number);
                    if (mappedNode) {
                        item.classList.add("mapped");
                        const badge = document.createElement("span");
                        badge.className = "mapped-badge";
                        badge.textContent = mappedNode.name;
                        item.appendChild(badge);
                    }

                    wrapper.appendChild(item);

                    // Properties panel (if expanded)
                    if (this.expandedAccountProps && this.expandedAccountProps.has(account.number)) {
                        const panel = this.buildPropsPanel(account);
                        panel.dataset.account = account.number;
                        wrapper.appendChild(panel);
                    }

                    container.appendChild(wrapper);
                });

                this.updateBulkSelectUI();
            }

App.prototype.toggleAccountSelection = function(accountNumber, selected, shiftKey, visibleAccounts) {
                // Shift-click: select range from last checked to current
                if (shiftKey && this._lastCheckedPoolAccount && visibleAccounts) {
                    const lastNum = this._lastCheckedPoolAccount;
                    const numbers = visibleAccounts.map(a => a.number);
                    const lastIdx = numbers.indexOf(lastNum);
                    const curIdx = numbers.indexOf(accountNumber);
                    if (lastIdx !== -1 && curIdx !== -1) {
                        const start = Math.min(lastIdx, curIdx);
                        const end = Math.max(lastIdx, curIdx);
                        for (let i = start; i <= end; i++) {
                            this.selectedAccounts.add(numbers[i]);
                        }
                        this._lastCheckedPoolAccount = accountNumber;
                        this.renderAccountsList();
                        this.updateBulkSelectUI();
                        return;
                    }
                }

                if (selected) {
                    this.selectedAccounts.add(accountNumber);
                } else {
                    this.selectedAccounts.delete(accountNumber);
                }
                this._lastCheckedPoolAccount = selected ? accountNumber : null;
                this.updateBulkSelectUI();
            }

App.prototype.toggleBulkSelect = function() {
                const bulkSelectCheckbox = document.getElementById("bulkSelectAll");
                const allCheckboxes = Array.from(document.querySelectorAll(".account-item input[type='checkbox']"));

                if (bulkSelectCheckbox.checked) {
                    allCheckboxes.forEach(cb => {
                        cb.checked = true;
                        this.selectedAccounts.add(cb.closest(".account-item").dataset.accountNumber);
                    });
                } else {
                    allCheckboxes.forEach(cb => {
                        cb.checked = false;
                    });
                    this.selectedAccounts.clear();
                }
                this.updateBulkSelectUI();
            }

App.prototype.toggleFilter = function(type) {
                if (type === "all") {
                    this.showUnmappedOnly = false;
                    document.getElementById("filterAll").checked = true;
                    document.getElementById("filterUnmapped").checked = false;
                } else if (type === "unmapped") {
                    this.showUnmappedOnly = true;
                    document.getElementById("filterAll").checked = false;
                    document.getElementById("filterUnmapped").checked = true;
                }
                this.renderAccountsList();
            }

App.prototype.applyRangeFilter = function() {
                this.rangeFilter.from = document.getElementById("rangeFrom").value;
                this.rangeFilter.to = document.getElementById("rangeTo").value;
                this.renderAccountsList();
            }

App.prototype.clearFilters = function() {
                document.getElementById("accountSearch").value = "";
                document.getElementById("rangeFrom").value = "";
                document.getElementById("rangeTo").value = "";
                this.searchQuery = "";
                this.rangeFilter = { from: "", to: "" };
                this.showUnmappedOnly = false;
                document.getElementById("filterAll").checked = true;
                document.getElementById("filterUnmapped").checked = false;
                document.querySelectorAll(".filter-chip").forEach((chip, i) => {
                    if (i === 0) chip.classList.add("active");
                    else chip.classList.remove("active");
                });
                this.selectedAccounts.clear();
                document.getElementById("bulkSelectAll").checked = false;
                this.renderAccountsList();
            }

App.prototype.findNodeContainingAccount = function(nodes, accountNumber) {
                for (let node of nodes) {
                    if (node.accounts && node.accounts.some(a => a.number === accountNumber)) {
                        return node;
                    }
                    if (node.children) {
                        const found = this.findNodeContainingAccount(node.children, accountNumber);
                        if (found) return found;
                    }
                }
                return null;
            }

App.prototype.collectMappedAccounts = function(nodes, set) {
                nodes.forEach(node => {
                    if (node.accounts) {
                        node.accounts.forEach(acc => set.add(acc.number));
                    }
                    if (node.children) {
                        this.collectMappedAccounts(node.children, set);
                    }
                });
            }

App.prototype.updateBulkSelectUI = function() {
                const bulkSelectCheckbox = document.getElementById("bulkSelectAll");
                const bulkAssignBtn = document.getElementById("bulkAssignBtn");
                const allCheckboxes = Array.from(document.querySelectorAll(".account-item input[type='checkbox']"));

                const allChecked = allCheckboxes.length > 0 && allCheckboxes.every(cb => cb.checked);
                bulkSelectCheckbox.checked = allChecked;
                bulkAssignBtn.disabled = this.selectedAccounts.size === 0;
            }

