// hierarchy-tree.js
// Right panel: tree rendering, node operations, and assignments

App.prototype.renderTree = function() {
                const container = document.getElementById("treeContainer");
                container.innerHTML = "";

                // If import tab is active, show import screen instead
                if (this.importTabActive) {
                    this.renderImportScreen();
                    return;
                }

                const view = this.data.views[this.currentViewIndex];

                // Selection banner: shown when accounts are selected in the pool
                if (this.selectedAccounts.size > 0) {
                    const banner = document.createElement("div");
                    banner.className = "assign-banner";
                    const count = this.selectedAccounts.size;
                    banner.innerHTML = '<span class="assign-banner-icon">&#9654;</span> <strong>' + count + ' account' + (count !== 1 ? 's' : '') + ' selected</strong> &mdash; click any node below to assign';
                    const clearBtn = document.createElement("button");
                    clearBtn.className = "assign-banner-clear";
                    clearBtn.textContent = "Clear";
                    clearBtn.onclick = () => {
                        this.selectedAccounts.clear();
                        this.render();
                    };
                    banner.appendChild(clearBtn);
                    container.appendChild(banner);
                }

                // Color legend bar
                const legend = document.createElement("div");
                legend.className = "tree-legend";
                const legendItems = [
                    { color: "#17375E", label: "Statement" },
                    { color: "#4a90d9", label: "Group" },
                    { color: "#22863a", label: "Mapped" },
                    { color: "#eab308", label: "Calculated" },
                    { color: "#d1d5db", label: "Empty" }
                ];
                legendItems.forEach(item => {
                    const chip = document.createElement("span");
                    chip.className = "tree-legend-item";
                    chip.innerHTML = '<span class="tree-legend-dot" style="background:' + item.color + '"></span>' + item.label;
                    legend.appendChild(chip);
                });
                container.appendChild(legend);

                view.statements.forEach((stmt, index) => {
                    const el = this.renderNode(stmt, 0, view.maxDepth);
                    container.appendChild(el);
                });

                // Add Statement button at the bottom
                const addStmtBtn = document.createElement("button");
                addStmtBtn.style.cssText = "margin:12px 0;padding:8px 16px;font-size:13px;color:#4a90d9;background:#f9f9f9;border:1px dashed #b8d4e8;border-radius:4px;cursor:pointer;display:block;width:100%;text-align:center;";
                addStmtBtn.textContent = "+ Add Statement / Schedule";
                addStmtBtn.onmouseenter = () => { addStmtBtn.style.background = "#f0f5ff"; addStmtBtn.style.borderColor = "#4a90d9"; };
                addStmtBtn.onmouseleave = () => { addStmtBtn.style.background = "#f9f9f9"; addStmtBtn.style.borderColor = "#b8d4e8"; };
                addStmtBtn.onclick = () => this.showCreateNodeModal(null, 0);
                container.appendChild(addStmtBtn);
            }

App.prototype.renderNode = function(node, level, maxDepth) {
                const nodeEl = document.createElement("div");
                nodeEl.className = "tree-node";
                nodeEl.id = `node-${node.id}`;

                const header = document.createElement("div");
                header.className = "node-header";
                header.draggable = true;

                const hasChildren = (node.children || []).length > 0;
                const hasAccounts = (node.accounts || []).length > 0;
                const hasCalcs = (node.calculatedAccounts || []).length > 0;

                // Node type class for color-coded left border
                if (level === 0) {
                    header.classList.add("node-type-statement");
                } else if (hasAccounts || hasCalcs) {
                    header.classList.add("node-type-mapped");
                } else if (hasChildren) {
                    header.classList.add("node-type-group");
                } else {
                    header.classList.add("node-type-empty");
                }
                const isExpandable = hasChildren || hasAccounts || level > 0;
                const toggle = document.createElement("div");
                toggle.className = `toggle-arrow ${!isExpandable ? "no-children" : ""} ${this.collapseStates[node.id] ? "expanded" : ""}`;
                toggle.textContent = "▶";
                toggle.onclick = () => this.toggleNodeCollapse(node.id);

                // Drag event handlers for node reordering and re-parenting
                // Entire header is draggable (buttons/toggles still respond to click)
                header.ondragstart = (e) => {
                    // Don't drag if user clicked a button or input
                    const tag = (e.target.tagName || "").toLowerCase();
                    if (tag === "button" || tag === "input" || tag === "select" || e.target.closest(".action-btn") || e.target.closest(".sign-toggle-btn") || e.target.closest(".visibility-toggle")) {
                        e.preventDefault();
                        return;
                    }
                    this.draggedNodeId = node.id;
                    this.dragSource = "node";
                    header.classList.add("drag-source");
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("nodeId", node.id);
                };

                header.ondragover = (e) => {
                    // Handle node reordering / re-parenting
                    if (this.dragSource === "node" && this.draggedNodeId !== node.id) {
                        // Don't allow dropping onto own descendants
                        if (!this.isDescendant(this.draggedNodeId, node.id)) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";

                            const rect = header.getBoundingClientRect();
                            const height = rect.height;
                            const offsetY = e.clientY - rect.top;

                            // Clear all indicators
                            document.querySelectorAll(".drop-indicator-top, .drop-indicator-bottom, .node-drop-target").forEach(el => {
                                el.classList.remove("drop-indicator-top", "drop-indicator-bottom", "node-drop-target");
                            });

                            // Top 25% = insert before, Bottom 25% = insert after, Middle 50% = make child
                            if (offsetY < height * 0.25) {
                                header.classList.add("drop-indicator-top");
                            } else if (offsetY > height * 0.75) {
                                header.classList.add("drop-indicator-bottom");
                            } else {
                                header.classList.add("node-drop-target");
                            }
                        }
                    }
                    // Handle account drops on node header (from pool OR from another tree node)
                    if (this.dragSource === "pool" || this.dragSource === "tree") {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        // Clear other highlights first
                        document.querySelectorAll(".node-header.account-drop-target").forEach(el => {
                            if (el !== header) el.classList.remove("account-drop-target");
                        });
                        header.classList.add("account-drop-target");
                        header.classList.add("drop-indicator-bottom");
                        // Auto-expand collapsed node after 500ms
                        if (!this.collapseStates[node.id]) {
                            if (!this.expandTimers[node.id]) {
                                this.expandTimers[node.id] = setTimeout(() => {
                                    this.collapseStates[node.id] = true;
                                    this.renderTree();
                                    delete this.expandTimers[node.id];
                                }, 500);
                            }
                        }
                    }
                };

                header.ondragleave = (e) => {
                    header.classList.remove("drop-indicator-top", "drop-indicator-bottom", "node-drop-target", "account-drop-target");
                    if (this.expandTimers[node.id]) {
                        clearTimeout(this.expandTimers[node.id]);
                        delete this.expandTimers[node.id];
                    }
                };

                header.ondrop = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasDropTop = header.classList.contains("drop-indicator-top");
                    const wasDropBottom = header.classList.contains("drop-indicator-bottom");
                    const wasDropChild = header.classList.contains("node-drop-target");
                    header.classList.remove("drop-indicator-top", "drop-indicator-bottom", "node-drop-target", "account-drop-target");

                    // Handle account drop on node header (from pool or tree)
                    if (this.dragSource === "pool" || this.dragSource === "tree") {
                        const accountNumber = e.dataTransfer.getData("accountNumber");
                        // Multi-drag: use dragAccountNumbers if available (works for both pool and tree)
                        const numbersToMap = (this.dragAccountNumbers && this.dragAccountNumbers.length > 0)
                            ? this.dragAccountNumbers
                            : (accountNumber ? [accountNumber] : []);

                        numbersToMap.forEach(num => {
                            // Always remove from any existing node first to prevent double mapping
                            const stmts = this.data.views[this.currentViewIndex].statements;
                            this.removeAccountFromNodes(stmts, num);
                            const account = this.data.accounts.find(a => a.number === num);
                            if (account) {
                                if (!node.accounts) node.accounts = [];
                                node.accounts.push(account);
                            }
                        });

                        if (numbersToMap.length > 0) {
                            // Clear selection after multi-drag
                            if (this.dragAccountNumbers && this.dragAccountNumbers.length > 1) {
                                if (this.dragSource === "pool") this.selectedAccounts.clear();
                                if (this.dragSource === "tree") this.checkedMappedAccounts.clear();
                            }
                            this.collapseStates[node.id] = true;
                            this.dragAccountNumbers = null;
                            this.render();
                        }
                        return;
                    }

                    // Handle node reordering / re-parenting
                    if (this.dragSource !== "node" || !this.draggedNodeId || this.draggedNodeId === node.id) return;
                    if (this.isDescendant(this.draggedNodeId, node.id)) return;

                    const view = this.data.views[this.currentViewIndex];
                    const draggedNode = this.findNodeById(view.statements, this.draggedNodeId);
                    if (!draggedNode) return;

                    // Remove dragged node from its current location
                    const draggedParentArr = this.findParentArray({ id: this.draggedNodeId });
                    if (!draggedParentArr) return;
                    const draggedIdx = draggedParentArr.findIndex(n => n.id === this.draggedNodeId);
                    if (draggedIdx === -1) return;
                    draggedParentArr.splice(draggedIdx, 1);

                    if (wasDropChild) {
                        // Re-parent: make dragged node a child of this node
                        if (!node.children) node.children = [];
                        node.children.push(draggedNode);
                        this.collapseStates[node.id] = true;
                    } else {
                        // Sibling reorder: insert before or after this node
                        const targetParentArr = this.findParentArray(node);
                        if (!targetParentArr) return;
                        let newIdx = targetParentArr.findIndex(n => n.id === node.id);
                        if (wasDropBottom) newIdx++;
                        targetParentArr.splice(newIdx, 0, draggedNode);
                    }

                    this.draggedNodeId = null;
                    this.dragSource = null;
                    this.render();
                };

                header.ondragend = () => {
                    header.classList.remove("drag-source");
                    document.querySelectorAll(".drop-indicator-top, .drop-indicator-bottom, .node-drop-target, .account-drop-target").forEach(el => {
                        el.classList.remove("drop-indicator-top", "drop-indicator-bottom", "node-drop-target", "account-drop-target");
                    });
                    this.draggedNodeId = null;
                    this.dragSource = null;
                };

                // Right-click context menu
                header.oncontextmenu = (e) => {
                    this.showNodeContextMenu(e, node);
                };

                const icon = document.createElement("div");
                icon.className = "level-icon";
                icon.style.backgroundColor = LEVEL_COLORS[level] || LEVEL_COLORS[0];
                icon.textContent = level === 0 ? "S" : (level + 1);

                const name = document.createElement("span");
                name.className = "node-name";
                if (!node.visible) name.classList.add("not-visible");
                name.textContent = node.name;
                name.ondblclick = (e) => {
                    e.stopPropagation();
                    this.editNodeName(node, name);
                };

                const visibilityBtn = document.createElement("button");
                visibilityBtn.className = "visibility-toggle" + (node.visible ? "" : " hidden-node");
                visibilityBtn.innerHTML = node.visible
                    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2.5-5 6.5-8 10-8s7.5 3 10 8c-2.5 5-6.5 8-10 8s-7.5-3-10-8z"/><circle cx="12" cy="12" r="3.5"/></svg>'
                    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2.5-5 6.5-8 10-8s7.5 3 10 8c-2.5 5-6.5 8-10 8s-7.5-3-10-8z"/><circle cx="12" cy="12" r="3.5"/><line x1="5" y1="19" x2="19" y2="5"/></svg>';
                visibilityBtn.title = node.visible ? "Visible on printed statement (click to hide)" : "Hidden from printed statement (click to show)";
                visibilityBtn.onclick = (e) => {
                    e.stopPropagation();
                    node.visible = !node.visible;
                    this.render();
                };

                // Sign toggle button (+/-)
                const currentSign = node.defaultSign || 1;
                const signBtn = document.createElement("button");
                signBtn.className = "sign-toggle-btn" + (currentSign === -1 ? " credit" : "");
                signBtn.textContent = currentSign === 1 ? "+" : "\u2212";
                signBtn.title = currentSign === 1 ? "Debit normal (click to switch to credit)" : "Credit normal (click to switch to debit)";
                signBtn.onclick = (e) => {
                    e.stopPropagation();
                    node.defaultSign = (node.defaultSign || 1) === 1 ? -1 : 1;
                    this.render();
                };

                const directCount = (node.accounts || []).length;
                const totalCount = this.countAccounts(node);
                const accountBadge = document.createElement("div");
                accountBadge.className = "node-badge";
                accountBadge.textContent = directCount > 0 && totalCount > directCount
                    ? `${directCount} here / ${totalCount} total`
                    : `${totalCount} acct${totalCount !== 1 ? 's' : ''}`;
                accountBadge.title = `${directCount} accounts mapped directly to this node, ${totalCount} total (including children)`;

                const actions = document.createElement("div");
                actions.className = "node-actions";

                const moveUpBtn = document.createElement("button");
                moveUpBtn.className = "action-btn";
                moveUpBtn.textContent = "▲";
                moveUpBtn.title = "Move up";
                moveUpBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.moveNodeUp(node);
                };
                actions.appendChild(moveUpBtn);

                const moveDownBtn = document.createElement("button");
                moveDownBtn.className = "action-btn";
                moveDownBtn.textContent = "▼";
                moveDownBtn.title = "Move down";
                moveDownBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.moveNodeDown(node);
                };
                actions.appendChild(moveDownBtn);

                // Assign accounts button - only for non-top-level
                const assignBtn = document.createElement("button");
                assignBtn.className = "action-btn";
                assignBtn.textContent = "🎯";
                assignBtn.title = "Assign accounts";
                assignBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.toggleAssignPanel(node);
                };

                const deleteBtn = document.createElement("button");
                deleteBtn.className = "action-btn delete-btn";
                deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
                deleteBtn.title = "Delete";
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.deleteNode(node);
                };

                // Only add assign button if not level 0
                if (level > 0) {
                    actions.appendChild(assignBtn);
                }
                actions.appendChild(deleteBtn);

                const spacer = document.createElement("div");
                spacer.className = "node-spacer";

                header.appendChild(toggle);
                header.appendChild(icon);
                header.appendChild(name);
                header.appendChild(signBtn);
                header.appendChild(visibilityBtn);
                header.appendChild(accountBadge);
                header.appendChild(spacer);
                header.appendChild(actions);

                // Click-to-assign: when accounts are selected in the pool, clicking a node assigns them
                if (level > 0 && this.selectedAccounts.size > 0) {
                    header.classList.add("assign-target");
                    header.onclick = (e) => {
                        // Don't intercept clicks on buttons, toggles, inputs
                        const tag = (e.target.tagName || "").toLowerCase();
                        if (tag === "button" || tag === "input" || tag === "select" || tag === "svg" || tag === "path" || tag === "line" || tag === "polyline" ||
                            e.target.closest(".action-btn") || e.target.closest(".toggle-arrow") || e.target.closest(".sign-toggle-btn") || e.target.closest(".visibility-toggle")) {
                            return;
                        }
                        this.clickAssignSelectedTo(node, header);
                    };
                }

                nodeEl.appendChild(header);

                // Inline assign panel
                if (this.activeAssignNode === node.id) {
                    const panel = this.createAssignPanel(node);
                    nodeEl.appendChild(panel);
                }

                const childrenContainer = document.createElement("div");
                childrenContainer.className = `node-children ${!this.collapseStates[node.id] ? "hidden" : ""}`;

                if (hasChildren) {
                    (node.children || []).forEach(child => {
                        childrenContainer.appendChild(this.renderNode(child, level + 1, maxDepth));
                    });
                }

                // Inline "Add ___" button (shown when expanded)
                if (this.collapseStates[node.id]) {
                    const view = this.data.views[this.currentViewIndex];
                    const childLevel = level + 1;
                    const isAtMaxDepth = childLevel >= maxDepth;

                    const addBtn = document.createElement("button");
                    addBtn.className = "add-child-inline-btn";

                    if (isAtMaxDepth) {
                        addBtn.textContent = "Increase Tree Depth to add more levels";
                        addBtn.classList.add("disabled-hint");
                        addBtn.onclick = (e) => {
                            e.stopPropagation();
                            const selector = document.getElementById("depthSelector");
                            if (selector) {
                                const currentDepth = parseInt(selector.value);
                                if (currentDepth < 6) {
                                    selector.value = currentDepth + 1;
                                    this.changeDepth();
                                }
                            }
                        };
                    } else {
                        const childLevelName = (view.levelLabels && view.levelLabels[childLevel]) || DEFAULT_LEVEL_LABELS[childLevel] || "Child";
                        addBtn.textContent = "+ Add " + childLevelName;
                        addBtn.onclick = (e) => {
                            e.stopPropagation();
                            this.addChild(node);
                        };
                    }

                    childrenContainer.appendChild(addBtn);
                }

                // Mapped accounts section (show when expanded, for ALL levels)
                if (this.collapseStates[node.id]) {
                    const mappedAccountsContainer = document.createElement("div");
                    mappedAccountsContainer.style.marginLeft = "20px";
                    mappedAccountsContainer.style.marginTop = "4px";

                    const nodeAccounts = node.accounts || [];
                    const checkedAccounts = Array.from(this.checkedMappedAccounts.get(node.id) || []);

                    // Column headers for amounts (only if there are accounts)
                    if (nodeAccounts.length > 0) {
                        const headerRow = document.createElement("div");
                        headerRow.className = "mapped-col-header-row";
                        const spacer = document.createElement("span");
                        spacer.style.flex = "1";
                        headerRow.appendChild(spacer);
                        const hdrContainer = document.createElement("div");
                        hdrContainer.className = "mapped-amounts-header";
                        ["CY", "PY", "Diff", "% Chg"].forEach((label, i) => {
                            const s = document.createElement("span");
                            s.textContent = label;
                            if (i === 3) s.className = "hdr-pct";
                            hdrContainer.appendChild(s);
                        });
                        headerRow.appendChild(hdrContainer);
                        // Small spacer for the unmap button column
                        const unmapSpacer = document.createElement("span");
                        unmapSpacer.style.width = "24px";
                        unmapSpacer.style.flexShrink = "0";
                        headerRow.appendChild(unmapSpacer);
                        mappedAccountsContainer.appendChild(headerRow);
                    }

                    if (checkedAccounts.length > 0) {
                        const unmapBar = document.createElement("div");
                        unmapBar.className = "unmap-selected-bar";

                        const label = document.createElement("span");
                        label.textContent = `${checkedAccounts.length} selected`;
                        unmapBar.appendChild(label);

                        const unmapBtn = document.createElement("button");
                        unmapBtn.onclick = () => this.unmapSelectedFromNode(node);
                        unmapBtn.textContent = "Unmap Selected";
                        unmapBar.appendChild(unmapBtn);

                        mappedAccountsContainer.appendChild(unmapBar);
                    }

                    nodeAccounts.forEach(account => {
                        const acctWrapper = document.createElement("div");
                        acctWrapper.className = "mapped-account-wrapper";

                        const row = document.createElement("div");
                        row.className = "mapped-account-row";
                        row.dataset.accountNumber = account.number;
                        row.draggable = true;

                        // Look up the master account for dimension data
                        const masterAccount = this.data.accounts.find(a => a.number === account.number) || account;

                        // Expand arrow
                        const arrow = this.buildExpandArrow(account.number);

                        const checkbox = document.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.style.width = "14px";
                        checkbox.style.height = "14px";
                        checkbox.checked = checkedAccounts.includes(account.number);
                        checkbox.onclick = (e) => this.toggleMappedAccountCheck(node.id, account.number, checkbox.checked, e.shiftKey, nodeAccounts);

                        const number = document.createElement("span");
                        number.className = "acct-number";
                        number.textContent = account.number;

                        const name = document.createElement("span");
                        name.className = "acct-name";
                        name.textContent = account.name;

                        const sign = document.createElement("span");
                        sign.className = "acct-sign";
                        sign.textContent = account.sign;

                        // Amount columns: CY, PY, Diff, %Diff
                        const cy = (account.amountCY !== undefined) ? account.amountCY : 0;
                        const py = (account.amountPY !== undefined) ? account.amountPY : 0;
                        const diff = cy - py;
                        const pctDiff = py !== 0 ? ((diff / Math.abs(py)) * 100) : (cy !== 0 ? 100 : 0);

                        const amountsContainer = document.createElement("div");
                        amountsContainer.className = "mapped-amounts";

                        const cyEl = document.createElement("span");
                        cyEl.className = "mapped-amt";
                        cyEl.textContent = this.formatTreeAmount(cy);
                        cyEl.title = "Current Year";

                        const pyEl = document.createElement("span");
                        pyEl.className = "mapped-amt";
                        pyEl.textContent = this.formatTreeAmount(py);
                        pyEl.title = "Prior Year";

                        const diffEl = document.createElement("span");
                        diffEl.className = "mapped-amt" + (diff < 0 ? " amt-negative" : "");
                        diffEl.textContent = this.formatTreeAmount(diff);
                        diffEl.title = "Difference (CY - PY)";

                        const pctEl = document.createElement("span");
                        pctEl.className = "mapped-amt mapped-pct" + (pctDiff < 0 ? " amt-negative" : "");
                        pctEl.textContent = py === 0 && cy === 0 ? "-" : (pctDiff < 0 ? "(" + Math.abs(pctDiff).toFixed(1) + "%)" : pctDiff.toFixed(1) + "%");
                        pctEl.title = "% Change";

                        amountsContainer.appendChild(cyEl);
                        amountsContainer.appendChild(pyEl);
                        amountsContainer.appendChild(diffEl);
                        amountsContainer.appendChild(pctEl);

                        const unmapBtn = document.createElement("button");
                        unmapBtn.className = "unmap-btn";
                        unmapBtn.textContent = "↩";
                        unmapBtn.title = "Unmap account";
                        unmapBtn.onclick = (e) => {
                            e.stopPropagation();
                            this.unmapAccount(account.number);
                        };

                        row.appendChild(arrow);
                        row.appendChild(checkbox);
                        row.appendChild(number);
                        row.appendChild(name);
                        row.appendChild(this.buildDimBadgesEl(masterAccount));
                        row.appendChild(sign);
                        row.appendChild(amountsContainer);
                        row.appendChild(unmapBtn);

                        acctWrapper.appendChild(row);

                        // Properties panel (if expanded)
                        if (this.expandedAccountProps && this.expandedAccountProps.has(account.number)) {
                            const panel = this.buildPropsPanel(masterAccount);
                            panel.dataset.account = account.number;
                            acctWrapper.appendChild(panel);
                        }

                        mappedAccountsContainer.appendChild(acctWrapper);
                    });

                    // Calculated accounts
                    const calcView = this.data.views[this.currentViewIndex];
                    const calcAccounts = node.calculatedAccounts || [];
                    calcAccounts.forEach(calc => {
                        const calcWrapper = document.createElement("div");
                        calcWrapper.className = "mapped-account-wrapper calc-account-wrapper";

                        const row = document.createElement("div");
                        row.className = "mapped-account-row calc-account-row";

                        // Formula icon
                        const icon = document.createElement("span");
                        icon.className = "calc-icon";
                        icon.textContent = "fx";
                        icon.title = "Calculated account";

                        const nameEl = document.createElement("span");
                        nameEl.className = "acct-name calc-name";
                        nameEl.textContent = calc.name;
                        if (calc.bold) nameEl.style.fontWeight = "bold";

                        // Resolve source nodes (backward compat: sourceNodeId or sourceNodeIds)
                        const ids = calc.sourceNodeIds || (calc.sourceNodeId ? [calc.sourceNodeId] : []);
                        const sourceNodes = ids.map(id => this.findNodeById(calcView.statements, id)).filter(Boolean);
                        const isMulti = ids.length > 1;

                        // Source label
                        const sourceLabel = document.createElement("span");
                        sourceLabel.className = "calc-source-label";
                        if (isMulti) {
                            const names = sourceNodes.map(sn => sn.name);
                            sourceLabel.textContent = "= " + names.join(" + ");
                            sourceLabel.title = "Sums totals from: " + names.join(", ");
                        } else {
                            const sourceName = sourceNodes.length > 0 ? sourceNodes[0].name : "(deleted)";
                            sourceLabel.textContent = "= " + sourceName;
                            sourceLabel.title = "Pulls total from: " + sourceName;
                        }

                        // Amount columns - compute totals from all sources
                        const amountsContainer = document.createElement("div");
                        amountsContainer.className = "mapped-amounts";

                        let cy = 0, py = 0;
                        sourceNodes.forEach(sn => {
                            cy += Math.abs(this.sumNodeAmountsSigned(sn, "amountCY"));
                            py += Math.abs(this.sumNodeAmountsSigned(sn, "amountPY"));
                        });
                        const diff = cy - py;
                        const pctDiff = py !== 0 ? ((diff / Math.abs(py)) * 100) : (cy !== 0 ? 100 : 0);

                        const cyEl = document.createElement("span");
                        cyEl.className = "mapped-amt";
                        cyEl.textContent = this.formatTreeAmount(cy);

                        const pyEl = document.createElement("span");
                        pyEl.className = "mapped-amt";
                        pyEl.textContent = this.formatTreeAmount(py);

                        const diffEl = document.createElement("span");
                        diffEl.className = "mapped-amt" + (diff < 0 ? " amt-negative" : "");
                        diffEl.textContent = this.formatTreeAmount(diff);

                        const pctEl = document.createElement("span");
                        pctEl.className = "mapped-amt mapped-pct" + (pctDiff < 0 ? " amt-negative" : "");
                        pctEl.textContent = py === 0 && cy === 0 ? "-" : (pctDiff < 0 ? "(" + Math.abs(pctDiff).toFixed(1) + "%)" : pctDiff.toFixed(1) + "%");

                        amountsContainer.appendChild(cyEl);
                        amountsContainer.appendChild(pyEl);
                        amountsContainer.appendChild(diffEl);
                        amountsContainer.appendChild(pctEl);

                        const removeBtn = document.createElement("button");
                        removeBtn.className = "unmap-btn";
                        removeBtn.textContent = "\u00D7";
                        removeBtn.title = "Remove calculated account";
                        removeBtn.onclick = (e) => {
                            e.stopPropagation();
                            this.removeCalculatedAccount(node, calc.id);
                        };

                        row.appendChild(icon);
                        row.appendChild(nameEl);
                        row.appendChild(sourceLabel);
                        row.appendChild(amountsContainer);
                        row.appendChild(removeBtn);
                        calcWrapper.appendChild(row);
                        mappedAccountsContainer.appendChild(calcWrapper);
                    });

                    childrenContainer.appendChild(mappedAccountsContainer);
                }

                nodeEl.appendChild(childrenContainer);

                return nodeEl;
            }

App.prototype.renderViewTabs = function() {
                const tabsContainer = document.getElementById("viewTabs");
                tabsContainer.innerHTML = "";

                // Import Accounts tab (always first)
                const importTab = document.createElement("button");
                importTab.className = "view-tab import-tab" + (this.importTabActive ? " active" : "");
                importTab.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Import';
                importTab.onclick = () => {
                    if (this.importTabActive) {
                        this.hideImportTab();
                    } else {
                        this.showImportTab();
                    }
                };
                tabsContainer.appendChild(importTab);

                this.data.views.forEach((view, index) => {
                    const tab = document.createElement("button");
                    tab.className = `view-tab ${!this.importTabActive && index === this.currentViewIndex ? "active" : ""}`;
                    tab.textContent = view.name;
                    tab.ondblclick = (e) => {
                        e.stopPropagation();
                        this.renameView(index);
                    };
                    tab.onclick = () => {
                        this.importTabActive = false;
                        this.importState = null;
                        this.currentViewIndex = index;
                        this.render();
                    };
                    tabsContainer.appendChild(tab);
                });

                const newViewBtn = document.createElement("button");
                newViewBtn.className = "view-tab new-view";
                newViewBtn.textContent = "+ New View";
                newViewBtn.onclick = () => this.createNewView();
                tabsContainer.appendChild(newViewBtn);
            }

App.prototype.renderOrgName = function() {
                const orgNameEl = document.getElementById("orgName");
                if (orgNameEl && !this.editingOrgName) {
                    orgNameEl.textContent = this.data.orgName;
                }
            }

App.prototype.renderToolbar = function() {
                const view = this.data.views[this.currentViewIndex];
                document.getElementById("depthSelector").value = view.maxDepth;

                const labels = view.levelLabels.map(l => l || "Level").join(" → ");
                document.getElementById("depthLabels").textContent = labels;
            }

App.prototype.renderLevelLegend = function() {
                const view = this.data.views[this.currentViewIndex];
                const legendEl = document.getElementById("levelLegend");
                legendEl.innerHTML = "";

                for (let i = 0; i < view.maxDepth; i++) {
                    const item = document.createElement("div");
                    item.className = "level-item";

                    const dot = document.createElement("div");
                    dot.className = "level-dot";
                    dot.style.backgroundColor = LEVEL_COLORS[i] || LEVEL_COLORS[0];

                    const label = document.createElement("span");
                    label.className = "level-label";
                    label.textContent = view.levelLabels[i] || `Level ${i}`;
                    label.ondblclick = (e) => {
                        e.stopPropagation();
                        this.editLevelLabel(view, i, label);
                    };

                    item.appendChild(dot);
                    item.appendChild(label);
                    legendEl.appendChild(item);
                }
            }

App.prototype.editLevelLabel = function(view, index, labelEl) {
                const input = document.createElement("input");
                input.type = "text";
                input.className = "level-label-input";
                input.value = view.levelLabels[index];
                labelEl.replaceWith(input);
                input.focus();
                input.select();

                const finish = () => {
                    view.levelLabels[index] = input.value || DEFAULT_LEVEL_LABELS[index];
                    this.render();
                };

                input.addEventListener("blur", finish);
                input.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") finish();
                    if (e.key === "Escape") this.render();
                });
            }

App.prototype.toggleNodeCollapse = function(nodeId) {
                this.collapseStates[nodeId] = !this.collapseStates[nodeId];
                this.renderTree();
            }

// Collect all node IDs from a tree (recursively)
App.prototype.collectNodeIds = function(nodes) {
    let ids = [];
    (nodes || []).forEach(node => {
        ids.push(node.id);
        if (node.children && node.children.length > 0) {
            ids = ids.concat(this.collectNodeIds(node.children));
        }
    });
    return ids;
}

// Expand All: set all nodes to expanded
App.prototype.expandAll = function() {
    const view = this.data.views[this.currentViewIndex];
    const ids = this.collectNodeIds(view.statements);
    ids.forEach(id => { this.collapseStates[id] = true; });
    this.renderTree();
}

// Collapse All: set all nodes to collapsed
App.prototype.collapseAll = function() {
    this.collapseStates = {};
    this.renderTree();
}

// Expand all descendants of a given node
App.prototype.expandAllBelow = function(nodeId) {
    const view = this.data.views[this.currentViewIndex];
    const node = this.findNodeById(view.statements, nodeId);
    if (!node) return;
    // Expand this node and all its descendants
    this.collapseStates[nodeId] = true;
    const childIds = this.collectNodeIds(node.children || []);
    childIds.forEach(id => { this.collapseStates[id] = true; });
    this.renderTree();
}

// Collapse all descendants of a given node
App.prototype.collapseAllBelow = function(nodeId) {
    const view = this.data.views[this.currentViewIndex];
    const node = this.findNodeById(view.statements, nodeId);
    if (!node) return;
    // Collapse this node and all its descendants
    delete this.collapseStates[nodeId];
    const childIds = this.collectNodeIds(node.children || []);
    childIds.forEach(id => { delete this.collapseStates[id]; });
    this.renderTree();
}

// Show right-click context menu on a node
App.prototype.showNodeContextMenu = function(e, node) {
    e.preventDefault();
    e.stopPropagation();

    // Remove any existing context menu
    this.closeContextMenu();

    const menu = document.createElement("div");
    menu.className = "node-context-menu";
    menu.id = "nodeContextMenu";

    const isExpanded = this.collapseStates[node.id];
    const hasChildren = (node.children || []).length > 0;

    // Toggle this node
    const toggleItem = document.createElement("div");
    toggleItem.className = "ctx-item";
    toggleItem.innerHTML = isExpanded
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>Collapse'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>Expand';
    toggleItem.onclick = () => {
        this.toggleNodeCollapse(node.id);
        this.closeContextMenu();
    };
    menu.appendChild(toggleItem);

    if (hasChildren) {
        const divider = document.createElement("div");
        divider.className = "ctx-divider";
        menu.appendChild(divider);

        // Expand All Below
        const expandBelow = document.createElement("div");
        expandBelow.className = "ctx-item";
        expandBelow.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>Expand All Below';
        expandBelow.onclick = () => {
            this.expandAllBelow(node.id);
            this.closeContextMenu();
        };
        menu.appendChild(expandBelow);

        // Collapse All Below
        const collapseBelow = document.createElement("div");
        collapseBelow.className = "ctx-item";
        collapseBelow.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 11 12 6 17 11"/><polyline points="7 18 12 13 17 18"/></svg>Collapse All Below';
        collapseBelow.onclick = () => {
            this.collapseAllBelow(node.id);
            this.closeContextMenu();
        };
        menu.appendChild(collapseBelow);
    }

    // --- Preview Display Options ---
    const view = this.data.views[this.currentViewIndex];
    const isStatement = view && view.statements && view.statements.some(s => s.id === node.id);
    const isLeaf = !hasChildren;

    const prevDivider = document.createElement("div");
    prevDivider.className = "ctx-divider";
    menu.appendChild(prevDivider);

    const prevLabel = document.createElement("div");
    prevLabel.className = "ctx-label";
    prevLabel.textContent = "Preview Options";
    menu.appendChild(prevLabel);

    // Toggle: Bold in preview
    const boldCurrent = node.previewBold || false;
    const boldItem = document.createElement("div");
    boldItem.className = "ctx-item";
    boldItem.innerHTML = (boldCurrent ? '&#10003; ' : '&nbsp;&nbsp;&nbsp; ') + 'Bold';
    boldItem.onclick = () => {
        this.saveState();
        node.previewBold = !boldCurrent;
        this.closeContextMenu();
        this.renderPreview();
    };
    menu.appendChild(boldItem);

    // Toggle: Show amounts on line (default true for leaf, false for groups)
    const showAmtDefault = isLeaf;
    const showAmtCurrent = node.previewShowAmounts !== undefined ? node.previewShowAmounts : showAmtDefault;
    const showAmtItem = document.createElement("div");
    showAmtItem.className = "ctx-item";
    showAmtItem.innerHTML = (showAmtCurrent ? '&#10003; ' : '&nbsp;&nbsp;&nbsp; ') + 'Show Amounts on Line';
    showAmtItem.onclick = () => {
        this.saveState();
        node.previewShowAmounts = !showAmtCurrent;
        this.closeContextMenu();
        this.renderPreview();
    };
    menu.appendChild(showAmtItem);

    // Toggle: Show total line (default true for groups with children, true for statements)
    if (!isLeaf || isStatement) {
        const showTotDefault = isStatement ? true : (hasChildren);
        const showTotCurrent = node.previewShowTotal !== undefined ? node.previewShowTotal : showTotDefault;
        const showTotItem = document.createElement("div");
        showTotItem.className = "ctx-item";
        showTotItem.innerHTML = (showTotCurrent ? '&#10003; ' : '&nbsp;&nbsp;&nbsp; ') + 'Show Total Line';
        showTotItem.onclick = () => {
            this.saveState();
            node.previewShowTotal = !showTotCurrent;
            this.closeContextMenu();
            this.renderPreview();
        };
        menu.appendChild(showTotItem);

        // Edit total name
        const totalNameItem = document.createElement("div");
        totalNameItem.className = "ctx-item";
        totalNameItem.innerHTML = '&nbsp;&nbsp;&nbsp; Edit Total Name...';
        totalNameItem.onclick = () => {
            this.closeContextMenu();
            const currentName = node.previewTotalName || ("Total " + node.name);
            const bodyHTML = '<div style="margin-bottom:8px;">' +
                '<label style="display:block;font-size:12px;font-weight:600;color:#17375E;margin-bottom:4px;">Total Line Label</label>' +
                '<input type="text" id="modalTotalName" value="' + this.escapeHtml(currentName) + '" ' +
                'style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:14px;font-family:inherit;box-sizing:border-box;">' +
                '</div>';
            this.showModal("Edit Total Name", bodyHTML, [
                { label: "Save", onclick: () => {
                    const val = document.getElementById("modalTotalName").value.trim();
                    this.saveState();
                    node.previewTotalName = val || ("Total " + node.name);
                    this.renderPreview();
                }},
                { label: "Cancel", style: "cancel" }
            ]);
            setTimeout(() => {
                const inp = document.getElementById("modalTotalName");
                if (inp) { inp.focus(); inp.select(); }
            }, 50);
        };
        menu.appendChild(totalNameItem);
    }

    // Statement-level: Total method (Sum vs Net)
    if (isStatement) {
        const methDivider = document.createElement("div");
        methDivider.className = "ctx-divider";
        menu.appendChild(methDivider);

        const methLabel = document.createElement("div");
        methLabel.className = "ctx-label";
        methLabel.textContent = "Total Method";
        menu.appendChild(methLabel);

        const currentMethod = node.totalMethod || "sum";

        const sumItem = document.createElement("div");
        sumItem.className = "ctx-item";
        sumItem.innerHTML = (currentMethod === "sum" ? '&#9679; ' : '&#9675; ') + 'Sum (add all amounts)';
        sumItem.onclick = () => {
            this.saveState();
            node.totalMethod = "sum";
            this.closeContextMenu();
            this.renderPreview();
        };
        menu.appendChild(sumItem);

        const netItem = document.createElement("div");
        netItem.className = "ctx-item";
        netItem.innerHTML = (currentMethod === "net" ? '&#9679; ' : '&#9675; ') + 'Net (debits minus credits)';
        netItem.onclick = () => {
            this.saveState();
            node.totalMethod = "net";
            this.closeContextMenu();
            this.renderPreview();
        };
        menu.appendChild(netItem);
    }

    // --- Calculated Account ---
    if (!isStatement) {
        const calcDivider = document.createElement("div");
        calcDivider.className = "ctx-divider";
        menu.appendChild(calcDivider);

        const calcItem = document.createElement("div");
        calcItem.className = "ctx-item";
        calcItem.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>Add Calculated Account...';
        calcItem.onclick = () => {
            this.closeContextMenu();
            this.showAddCalculatedAccountModal(node);
        };
        menu.appendChild(calcItem);
    }

    // Position menu at cursor
    document.body.appendChild(menu);
    const menuRect = menu.getBoundingClientRect();
    let x = e.clientX;
    let y = e.clientY;
    // Keep within viewport
    if (x + menuRect.width > window.innerWidth) x = window.innerWidth - menuRect.width - 8;
    if (y + menuRect.height > window.innerHeight) y = window.innerHeight - menuRect.height - 8;
    menu.style.left = x + "px";
    menu.style.top = y + "px";

    // Close on click outside
    setTimeout(() => {
        document.addEventListener("click", this._ctxCloseHandler = () => this.closeContextMenu(), { once: true });
        document.addEventListener("contextmenu", this._ctxCloseHandler2 = () => this.closeContextMenu(), { once: true });
    }, 0);
}

App.prototype.closeContextMenu = function() {
    const existing = document.getElementById("nodeContextMenu");
    if (existing) existing.remove();
    if (this._ctxCloseHandler) {
        document.removeEventListener("click", this._ctxCloseHandler);
        this._ctxCloseHandler = null;
    }
    if (this._ctxCloseHandler2) {
        document.removeEventListener("contextmenu", this._ctxCloseHandler2);
        this._ctxCloseHandler2 = null;
    }
}

// Collect all nodes in the hierarchy as flat list with indented names (for dropdowns)
App.prototype.collectNodeOptions = function(nodes, depth) {
    let options = [];
    nodes.forEach(node => {
        const indent = '\u00A0\u00A0'.repeat(depth);
        options.push({ id: node.id, name: indent + node.name, rawName: node.name });
        if (node.children) {
            options = options.concat(this.collectNodeOptions(node.children, depth + 1));
        }
    });
    return options;
};

// Show modal to add a calculated account to a node
App.prototype.showAddCalculatedAccountModal = function(targetNode) {
    const view = this.data.views[this.currentViewIndex];
    const nodeOptions = this.collectNodeOptions(view.statements, 0);

    let checkboxesHTML = '<div style="max-height:180px;overflow-y:auto;border:1px solid #ddd;border-radius:4px;padding:6px 8px;">';
    nodeOptions.forEach(opt => {
        checkboxesHTML += '<label style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px;cursor:pointer;">' +
            '<input type="checkbox" class="calc-source-cb" value="' + opt.id + '" style="width:14px;height:14px;">' +
            '<span>' + this.escapeHtml(opt.name) + '</span></label>';
    });
    checkboxesHTML += '</div>';

    const bodyHTML = '<div style="margin-bottom:12px;">' +
        '<label style="display:block;font-size:12px;font-weight:600;color:#17375E;margin-bottom:4px;">Name</label>' +
        '<input type="text" id="modalCalcName" placeholder="e.g., Total Liabilities and Net Assets" ' +
        'style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:14px;font-family:inherit;box-sizing:border-box;">' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
        '<label style="display:block;font-size:12px;font-weight:600;color:#17375E;margin-bottom:4px;">Source nodes (select one or more)</label>' +
        checkboxesHTML +
        '</div>' +
        '<div style="margin-bottom:12px;display:flex;gap:16px;">' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">' +
        '<input type="checkbox" id="modalCalcBold" checked style="width:14px;height:14px;"> <strong>Bold</strong></label>' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">' +
        '<input type="checkbox" id="modalCalcUnderline" checked style="width:14px;height:14px;"> Underline above</label>' +
        '</div>' +
        '<div style="font-size:11px;color:#888;line-height:1.4;">' +
        'Creates a calculated line that sums the totals of the selected sources. ' +
        'Does not change the trial balance.' +
        '</div>';

    this.showModal("Add Calculated Account", bodyHTML, [
        { label: "Cancel", style: "cancel" },
        {
            label: "Add",
            style: "primary",
            onclick: () => {
                const name = document.getElementById("modalCalcName").value.trim();
                const checked = document.querySelectorAll(".calc-source-cb:checked");
                const sourceIds = Array.from(checked).map(cb => cb.value);
                if (!name || sourceIds.length === 0) return;

                const bold = document.getElementById("modalCalcBold").checked;
                const underlineAbove = document.getElementById("modalCalcUnderline").checked;

                this.saveState();
                if (!targetNode.calculatedAccounts) targetNode.calculatedAccounts = [];
                targetNode.calculatedAccounts.push(createCalculatedAccount(name, sourceIds, {
                    bold: bold,
                    underlineAbove: underlineAbove
                }));
                this.render();
            }
        }
    ]);

    setTimeout(() => {
        const inp = document.getElementById("modalCalcName");
        if (inp) inp.focus();
    }, 50);
};

// Remove a calculated account from a node
App.prototype.removeCalculatedAccount = function(node, calcId) {
    this.saveState();
    node.calculatedAccounts = (node.calculatedAccounts || []).filter(c => c.id !== calcId);
    this.render();
};

App.prototype.toggleAssignPanel = function(node) {
                // Toggle - if there's already a panel for this node, close it
                if (this.activeAssignNode === node.id) {
                    this.activeAssignNode = null;
                    this.renderTree();
                    return;
                }
                this.activeAssignNode = node.id;
                this.renderTree();
            }

App.prototype.createAssignPanel = function(node) {
                const panel = document.createElement("div");
                panel.className = "assign-panel";
                panel.onclick = (e) => e.stopPropagation();

                const title = document.createElement("div");
                title.style.fontWeight = "600";
                title.style.fontSize = "13px";
                title.style.color = "#17375E";
                title.style.marginBottom = "10px";
                title.textContent = `Assign accounts to: ${node.name}`;
                panel.appendChild(title);

                // Range section
                const rangeRow = document.createElement("div");
                rangeRow.style.display = "flex";
                rangeRow.style.alignItems = "center";
                rangeRow.style.gap = "6px";
                rangeRow.style.marginBottom = "8px";

                const rangeLabel = document.createElement("span");
                rangeLabel.style.fontSize = "12px";
                rangeLabel.style.color = "#666";
                rangeLabel.textContent = "Range:";

                const fromInput = document.createElement("input");
                fromInput.type = "text";
                fromInput.placeholder = "From";
                fromInput.style.width = "80px";
                fromInput.style.padding = "4px 8px";
                fromInput.style.border = "1px solid #ddd";
                fromInput.style.borderRadius = "4px";
                fromInput.style.fontSize = "12px";

                const toInput = document.createElement("input");
                toInput.type = "text";
                toInput.placeholder = "To";
                toInput.style.width = "80px";
                toInput.style.padding = "4px 8px";
                toInput.style.border = "1px solid #ddd";
                toInput.style.borderRadius = "4px";
                toInput.style.fontSize = "12px";

                const assignRangeBtn = document.createElement("button");
                assignRangeBtn.textContent = "Assign Range";
                assignRangeBtn.style.fontSize = "11px";
                assignRangeBtn.style.padding = "4px 10px";

                rangeRow.appendChild(rangeLabel);
                rangeRow.appendChild(fromInput);
                rangeRow.appendChild(document.createTextNode(" to "));
                rangeRow.appendChild(toInput);
                rangeRow.appendChild(assignRangeBtn);
                panel.appendChild(rangeRow);

                // Search section
                const searchRow = document.createElement("div");
                searchRow.style.display = "flex";
                searchRow.style.alignItems = "center";
                searchRow.style.gap = "6px";
                searchRow.style.marginBottom = "8px";

                const searchLabel = document.createElement("span");
                searchLabel.style.fontSize = "12px";
                searchLabel.style.color = "#666";
                searchLabel.textContent = "Search:";

                const searchInput = document.createElement("input");
                searchInput.type = "text";
                searchInput.placeholder = "Search account name...";
                searchInput.style.width = "200px";
                searchInput.style.padding = "4px 8px";
                searchInput.style.border = "1px solid #ddd";
                searchInput.style.borderRadius = "4px";
                searchInput.style.fontSize = "12px";

                const searchBtn = document.createElement("button");
                searchBtn.textContent = "Show Matches";
                searchBtn.style.fontSize = "11px";
                searchBtn.style.padding = "4px 10px";

                searchRow.appendChild(searchLabel);
                searchRow.appendChild(searchInput);
                searchRow.appendChild(searchBtn);
                panel.appendChild(searchRow);

                // Results area
                const resultsDiv = document.createElement("div");
                resultsDiv.style.maxHeight = "200px";
                resultsDiv.style.overflowY = "auto";
                resultsDiv.style.border = "1px solid #eee";
                resultsDiv.style.borderRadius = "4px";
                resultsDiv.style.display = "none";
                panel.appendChild(resultsDiv);

                // Actions row
                const actionsRow = document.createElement("div");
                actionsRow.style.display = "none";
                actionsRow.style.justifyContent = "space-between";
                actionsRow.style.alignItems = "center";
                actionsRow.style.marginTop = "8px";
                actionsRow.style.fontSize = "12px";
                panel.appendChild(actionsRow);

                const selectedAccountsSet = new Set();

                const showResults = (accounts) => {
                    resultsDiv.innerHTML = "";
                    resultsDiv.style.display = "block";
                    actionsRow.style.display = "flex";
                    selectedAccountsSet.clear();

                    if (accounts.length === 0) {
                        resultsDiv.innerHTML = '<div style="padding:8px;color:#999;font-size:12px;">No unmapped accounts found</div>';
                        return;
                    }

                    accounts.forEach(acc => {
                        const row = document.createElement("div");
                        row.style.display = "flex";
                        row.style.alignItems = "center";
                        row.style.gap = "6px";
                        row.style.padding = "4px 8px";
                        row.style.borderBottom = "1px solid #f5f5f5";
                        row.style.fontSize = "12px";

                        const cb = document.createElement("input");
                        cb.type = "checkbox";
                        cb.onchange = () => {
                            if (cb.checked) selectedAccountsSet.add(acc.number);
                            else selectedAccountsSet.delete(acc.number);
                            countLabel.textContent = `${selectedAccountsSet.size} selected`;
                        };

                        const num = document.createElement("span");
                        num.style.fontFamily = "monospace";
                        num.style.color = "#17375E";
                        num.style.fontWeight = "600";
                        num.style.fontSize = "11px";
                        num.textContent = acc.number;

                        const nameSpan = document.createElement("span");
                        nameSpan.textContent = acc.name;
                        nameSpan.style.flex = "1";

                        row.appendChild(cb);
                        row.appendChild(num);
                        row.appendChild(nameSpan);
                        resultsDiv.appendChild(row);
                    });

                    // Actions
                    actionsRow.innerHTML = "";
                    const selectAllLink = document.createElement("a");
                    selectAllLink.href = "#";
                    selectAllLink.style.color = "#2e86de";
                    selectAllLink.style.fontSize = "11px";
                    selectAllLink.textContent = "Select All";
                    selectAllLink.onclick = (e) => {
                        e.preventDefault();
                        resultsDiv.querySelectorAll("input[type=checkbox]").forEach(cb => {
                            cb.checked = true;
                            const accNum = cb.parentElement.querySelector("span").textContent;
                            selectedAccountsSet.add(accNum);
                        });
                        countLabel.textContent = `${selectedAccountsSet.size} selected`;
                    };

                    const countLabel = document.createElement("span");
                    countLabel.style.color = "#888";
                    countLabel.textContent = "0 selected";

                    const assignAllBtn = document.createElement("button");
                    assignAllBtn.textContent = "Assign Selected";
                    assignAllBtn.style.fontSize = "11px";
                    assignAllBtn.style.padding = "4px 10px";
                    assignAllBtn.onclick = () => {
                        const accsToAssign = Array.from(selectedAccountsSet)
                            .map(num => this.data.accounts.find(a => a.number === num))
                            .filter(a => a);
                        if (accsToAssign.length === 0) return;
                        var stmts = this.data.views[this.currentViewIndex].statements;
                        if (!node.accounts) node.accounts = [];
                        accsToAssign.forEach(acc => {
                            this.removeAccountFromNodes(stmts, acc.number);
                            node.accounts.push(acc);
                        });
                        this.activeAssignNode = null;
                        this.render();
                    };

                    const closeLink = document.createElement("a");
                    closeLink.href = "#";
                    closeLink.style.color = "#999";
                    closeLink.style.fontSize = "11px";
                    closeLink.textContent = "Close";
                    closeLink.onclick = (e) => {
                        e.preventDefault();
                        this.activeAssignNode = null;
                        this.renderTree();
                    };

                    actionsRow.appendChild(selectAllLink);
                    actionsRow.appendChild(countLabel);
                    actionsRow.appendChild(assignAllBtn);
                    actionsRow.appendChild(closeLink);
                };

                // Get unmapped accounts
                const getUnmapped = () => {
                    const view = this.data.views[this.currentViewIndex];
                    const mappedNumbers = new Set();
                    const collectMapped = (n) => {
                        (n.accounts || []).forEach(a => mappedNumbers.add(a.number));
                        (n.children || []).forEach(c => collectMapped(c));
                    };
                    view.statements.forEach(s => collectMapped(s));
                    return this.data.accounts.filter(a => !mappedNumbers.has(a.number));
                };

                assignRangeBtn.onclick = () => {
                    const from = parseInt(fromInput.value) || 0;
                    const to = parseInt(toInput.value) || 99999;
                    const unmapped = getUnmapped();
                    const matches = unmapped.filter(a => {
                        const num = parseInt(a.number);
                        return num >= from && num <= to;
                    });
                    showResults(matches);
                };

                searchBtn.onclick = () => {
                    const query = searchInput.value.toLowerCase().trim();
                    if (!query) return;
                    const unmapped = getUnmapped();
                    const matches = unmapped.filter(a =>
                        a.name.toLowerCase().includes(query) || a.number.includes(query)
                    );
                    showResults(matches);
                };

                return panel;
            }

App.prototype.addChild = function(node) {
                const view = this.data.views[this.currentViewIndex];
                // Find the level of this node
                let nodeLevel = 0;
                const findLevel = (nodes, target, level) => {
                    for (const n of nodes) {
                        if (n.id === target.id) return level;
                        if (n.children) {
                            const found = findLevel(n.children, target, level + 1);
                            if (found !== -1) return found;
                        }
                    }
                    return -1;
                };
                nodeLevel = findLevel(view.statements, node, 0);
                this.showCreateNodeModal(node, nodeLevel + 1);
            }

App.prototype.deleteNode = function(node) {
                this.showDeleteConfirmModal(node);
            }

App.prototype.editNodeName = function(node, nameEl) {
                const input = document.createElement("input");
                input.type = "text";
                input.className = "node-name-input";
                input.value = node.name;
                nameEl.replaceWith(input);
                input.focus();
                input.select();

                const finish = () => {
                    node.name = input.value || "Unnamed";
                    this.render();
                };

                input.addEventListener("blur", finish);
                input.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") finish();
                    if (e.key === "Escape") this.render();
                });
            }

App.prototype.renameView = function(index) {
                this.showRenameViewModal(index);
            }

App.prototype.createNewView = function() {
                this.showNewViewModal();
            }

App.prototype.changeDepth = function() {
                const view = this.data.views[this.currentViewIndex];
                const newDepth = parseInt(document.getElementById("depthSelector").value);

                if (newDepth < view.maxDepth) {
                    view.statements.forEach(stmt => {
                        this.collapseDepth(stmt, view.maxDepth, newDepth);
                    });
                }

                view.maxDepth = newDepth;
                view.levelLabels = DEFAULT_LEVEL_LABELS.slice(0, newDepth);
                this.render();
            }

App.prototype.collapseDepth = function(node, currentDepth, targetDepth, currentLevel = 0) {
                if (currentLevel >= targetDepth - 1) {
                    if (node.children && node.children.length > 0) {
                        node.children.forEach(child => {
                            if (child.accounts && child.accounts.length > 0) {
                                if (!node.accounts) node.accounts = [];
                                node.accounts.push(...child.accounts);
                            }
                        });
                        node.children = [];
                    }
                } else {
                    node.children?.forEach(child => {
                        this.collapseDepth(child, currentDepth, targetDepth, currentLevel + 1);
                    });
                }
            }

App.prototype.countAccounts = function(node) {
                let count = (node.accounts || []).length + (node.calculatedAccounts || []).length;
                (node.children || []).forEach(child => {
                    count += this.countAccounts(child);
                });
                return count;
            }

App.prototype.findNodeById = function(nodes, id) {
                for (let node of nodes) {
                    if (node.id === id) return node;
                    if (node.children) {
                        const found = this.findNodeById(node.children, id);
                        if (found) return found;
                    }
                }
                return null;
            }

App.prototype.isDescendant = function(ancestorId, potentialDescendantId) {
                // Returns true if potentialDescendantId is a descendant of ancestorId
                const view = this.data.views[this.currentViewIndex];
                const ancestor = this.findNodeById(view.statements, ancestorId);
                if (!ancestor) return false;
                const check = (nodes) => {
                    for (const n of nodes) {
                        if (n.id === potentialDescendantId) return true;
                        if (n.children && check(n.children)) return true;
                    }
                    return false;
                };
                return check(ancestor.children || []);
            }

App.prototype.findParentArray = function(node) {
                const view = this.data.views[this.currentViewIndex];
                // Check if it's a top-level statement
                const idx = view.statements.findIndex(s => s.id === node.id);
                if (idx !== -1) return view.statements;

                // Search children recursively
                const search = (nodes) => {
                    for (const n of nodes) {
                        if (n.children) {
                            const childIdx = n.children.findIndex(c => c.id === node.id);
                            if (childIdx !== -1) return n.children;
                            const found = search(n.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                return search(view.statements);
            }

App.prototype.moveNodeUp = function(node) {
                const arr = this.findParentArray(node);
                if (!arr) return;
                const idx = arr.findIndex(n => n.id === node.id);
                if (idx > 0) {
                    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                    this.render();
                }
            }

App.prototype.moveNodeDown = function(node) {
                const arr = this.findParentArray(node);
                if (!arr) return;
                const idx = arr.findIndex(n => n.id === node.id);
                if (idx < arr.length - 1) {
                    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                    this.render();
                }
            }

App.prototype.toggleMappedAccountCheck = function(nodeId, accountNumber, checked, shiftKey, nodeAccounts) {
                if (!this.checkedMappedAccounts.has(nodeId)) {
                    this.checkedMappedAccounts.set(nodeId, new Set());
                }
                const set = this.checkedMappedAccounts.get(nodeId);

                // Shift-click: select range from last checked to current
                if (shiftKey && this._lastCheckedAccount && this._lastCheckedAccount.nodeId === nodeId && nodeAccounts) {
                    const lastNum = this._lastCheckedAccount.accountNumber;
                    const numbers = nodeAccounts.map(a => a.number);
                    const lastIdx = numbers.indexOf(lastNum);
                    const curIdx = numbers.indexOf(accountNumber);
                    if (lastIdx !== -1 && curIdx !== -1) {
                        const start = Math.min(lastIdx, curIdx);
                        const end = Math.max(lastIdx, curIdx);
                        for (let i = start; i <= end; i++) {
                            set.add(numbers[i]);
                        }
                        this._lastCheckedAccount = { nodeId, accountNumber };
                        this.renderTree();
                        return;
                    }
                }

                if (checked) {
                    set.add(accountNumber);
                } else {
                    set.delete(accountNumber);
                }
                this._lastCheckedAccount = checked ? { nodeId, accountNumber } : null;
                this.renderTree();
            }

App.prototype.removeNode = function(nodes, targetNode) {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].id === targetNode.id) {
                        nodes.splice(i, 1);
                        return true;
                    }
                    if (nodes[i].children && this.removeNode(nodes[i].children, targetNode)) {
                        return true;
                    }
                }
                return false;
            }

App.prototype.removeAccountFromNodes = function(nodes, accountNumber) {
                nodes.forEach(node => {
                    if (node.accounts) {
                        node.accounts = node.accounts.filter(a => a.number !== accountNumber);
                    }
                    if (node.children) {
                        this.removeAccountFromNodes(node.children, accountNumber);
                    }
                });
            }

App.prototype.unmapNodeAccounts = function(node) {
                // Clear accounts from this node (they stay in the master accounts list)
                node.accounts = [];
                // Recursively clear children
                (node.children || []).forEach(child => this.unmapNodeAccounts(child));
            }

App.prototype.unmapSelectedFromNode = function(node) {
                const checked = this.checkedMappedAccounts.get(node.id) || new Set();
                node.accounts = (node.accounts || []).filter(a => !checked.has(a.number));
                this.checkedMappedAccounts.delete(node.id);
                this.render();
            }

