// import-export.js
// Import and export functionality for JSON and CSV formats

App.prototype.exportJSON = function() {
                const json = JSON.stringify(this.data, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "hierarchy.json";
                a.click();
                URL.revokeObjectURL(url);
            }

App.prototype.importJSON = function() {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            this.data = migrateData(JSON.parse(event.target.result));
                            this.render();
                        } catch (err) {
                            this.showAlertModal("Import Error", "The file could not be parsed. Please check that it's a valid JSON file.");
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
            }

App.prototype.exportCSV = function() {
                const rows = [];
                rows.push(["Account Number", "Account Name", "Sign", "Node Path"]);

                const processNode = (node, path) => {
                    const currentPath = path ? `${path} > ${node.name}` : node.name;
                    (node.accounts || []).forEach(account => {
                        rows.push([account.number, account.name, account.sign, currentPath]);
                    });
                    (node.children || []).forEach(child => {
                        processNode(child, currentPath);
                    });
                };

                this.data.views[this.currentViewIndex].statements.forEach(stmt => {
                    processNode(stmt, "");
                });

                const csv = rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "hierarchy.csv";
                a.click();
                URL.revokeObjectURL(url);
            }

App.prototype.importCSV = function() {
                this.showAlertModal("Coming Soon", "CSV import is not yet implemented. Use JSON import/export for now.");
            }

App.prototype.openBulkAssignModal = function() {
                const modal = document.getElementById("bulkAssignModal");
                modal.classList.add("show");

                const container = document.getElementById("modalHierarchyContainer");
                container.innerHTML = "";

                this.renderDestinationTree(this.data.views[this.currentViewIndex].statements, container, 0);
            }

App.prototype.renderDestinationTree = function(nodes, container, level) {
                nodes.forEach(node => {
                    const nodeDiv = document.createElement("div");
                    nodeDiv.style.marginLeft = `${level * 20}px`;
                    nodeDiv.style.marginBottom = "2px";

                    const header = document.createElement("div");
                    header.style.display = "flex";
                    header.style.alignItems = "center";
                    header.style.gap = "6px";
                    header.style.padding = "4px 8px";
                    header.style.borderRadius = "4px";
                    header.style.cursor = level > 0 ? "pointer" : "default";
                    if (level > 0) {
                        header.onmouseenter = () => { header.style.backgroundColor = "#e8f0fe"; };
                        header.onmouseleave = () => { header.style.backgroundColor = "transparent"; };
                    }

                    // Expand/collapse toggle
                    const toggle = document.createElement("span");
                    toggle.style.width = "16px";
                    toggle.style.cursor = "pointer";
                    toggle.style.userSelect = "none";
                    toggle.style.fontSize = "10px";
                    toggle.style.textAlign = "center";

                    const childrenDiv = document.createElement("div");
                    childrenDiv.style.display = "none";

                    let expanded = false;
                    if (node.children?.length > 0) {
                        toggle.textContent = "▶";
                        toggle.onclick = (e) => {
                            e.stopPropagation();
                            expanded = !expanded;
                            toggle.textContent = expanded ? "▼" : "▶";
                            childrenDiv.style.display = expanded ? "block" : "none";
                        };
                    } else {
                        toggle.textContent = "";
                    }

                    const dot = document.createElement("div");
                    dot.style.width = "10px";
                    dot.style.height = "10px";
                    dot.style.borderRadius = "2px";
                    dot.style.backgroundColor = LEVEL_COLORS[level] || LEVEL_COLORS[0];
                    dot.style.flexShrink = "0";

                    const nameEl = document.createElement("span");
                    nameEl.style.flex = "1";
                    nameEl.style.fontSize = "13px";
                    nameEl.textContent = node.name;

                    header.appendChild(toggle);
                    header.appendChild(dot);
                    header.appendChild(nameEl);

                    // Only allow assignment to levels > 0 (not top-level statements)
                    if (level > 0) {
                        const selectBtn = document.createElement("button");
                        selectBtn.textContent = "Select";
                        selectBtn.style.fontSize = "11px";
                        selectBtn.style.padding = "2px 8px";
                        selectBtn.style.background = "#17375E";
                        selectBtn.style.color = "white";
                        selectBtn.style.border = "none";
                        selectBtn.style.borderRadius = "3px";
                        selectBtn.style.cursor = "pointer";
                        selectBtn.style.opacity = "0.7";
                        selectBtn.onmouseenter = () => { selectBtn.style.opacity = "1"; };
                        selectBtn.onmouseleave = () => { selectBtn.style.opacity = "0.7"; };
                        selectBtn.onclick = (e) => {
                            e.stopPropagation();
                            this.assignSelectedTo(node);
                        };
                        header.appendChild(selectBtn);

                        // Also allow clicking the row itself to select (not just the button)
                        header.onclick = (e) => {
                            if (e.target === toggle) return; // don't assign when clicking toggle
                            this.assignSelectedTo(node);
                        };
                    }

                    nodeDiv.appendChild(header);

                    if (node.children?.length > 0) {
                        this.renderDestinationTree(node.children, childrenDiv, level + 1);
                        nodeDiv.appendChild(childrenDiv);
                    }

                    container.appendChild(nodeDiv);
                });
            }

App.prototype.assignSelectedTo = function(targetNode) {
                const accounts = Array.from(this.selectedAccounts)
                    .map(num => this.data.accounts.find(a => a.number === num))
                    .filter(a => a);

                // Remove from any existing nodes first to prevent double mapping
                const stmts = this.data.views[this.currentViewIndex].statements;
                accounts.forEach(acc => {
                    this.removeAccountFromNodes(stmts, acc.number);
                });

                if (!targetNode.accounts) {
                    targetNode.accounts = [];
                }
                targetNode.accounts.push(...accounts);

                this.selectedAccounts.clear();
                this.closeModal();
                this.render();
            }

// Click-to-assign: assign selected pool accounts to a tree node with flash animation
App.prototype.clickAssignSelectedTo = function(targetNode, headerEl) {
                if (this.selectedAccounts.size === 0) return;
                this.saveState();

                const count = this.selectedAccounts.size;
                const accounts = Array.from(this.selectedAccounts)
                    .map(num => this.data.accounts.find(a => a.number === num))
                    .filter(a => a);

                // Remove from any existing nodes first
                const stmts = this.data.views[this.currentViewIndex].statements;
                accounts.forEach(acc => {
                    this.removeAccountFromNodes(stmts, acc.number);
                });

                if (!targetNode.accounts) targetNode.accounts = [];
                targetNode.accounts.push(...accounts);

                this.selectedAccounts.clear();
                this.collapseStates[targetNode.id] = true; // expand to show assigned

                // Flash animation: briefly highlight the node green before re-render
                headerEl.classList.add("assign-flash");
                const nodeId = targetNode.id;
                setTimeout(() => {
                    this.render();
                    // Re-apply flash to the new DOM element after render
                    const newHeader = document.querySelector('#node-' + nodeId + ' > .node-header');
                    if (newHeader) {
                        newHeader.classList.add("assign-flash");
                        setTimeout(() => newHeader.classList.remove("assign-flash"), 600);
                    }
                }, 150);
            }

