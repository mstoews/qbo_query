// drag-drop.js
// Drag and drop functionality for mapping accounts to nodes

App.prototype.handleDragStart = function(e) {
                const accountItem = e.target.closest(".account-item");
                const mappedRow = e.target.closest(".mapped-account-row");
                const nodeHeader = e.target.closest(".node-header");

                if (accountItem) {
                    this.dragSource = "pool";
                    const draggedNumber = accountItem.dataset.accountNumber;
                    accountItem.classList.add("dragging");
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("accountNumber", draggedNumber);

                    // Multi-drag: if the dragged account is selected, drag all selected
                    if (this.selectedAccounts.has(draggedNumber) && this.selectedAccounts.size > 1) {
                        this.dragAccountNumbers = Array.from(this.selectedAccounts);
                        // Highlight all selected items
                        document.querySelectorAll(".account-item").forEach(el => {
                            if (this.selectedAccounts.has(el.dataset.accountNumber)) {
                                el.classList.add("dragging");
                            }
                        });
                        // Custom drag image showing count
                        const ghost = document.createElement("div");
                        ghost.className = "drag-ghost";
                        ghost.textContent = `${this.selectedAccounts.size} accounts`;
                        ghost.style.cssText = "position:absolute;top:-1000px;padding:6px 14px;background:#17375E;color:white;border-radius:6px;font-size:13px;font-weight:600;white-space:nowrap;";
                        document.body.appendChild(ghost);
                        e.dataTransfer.setDragImage(ghost, 0, 0);
                        setTimeout(() => ghost.remove(), 0);
                    } else {
                        this.dragAccountNumbers = [draggedNumber];
                    }
                } else if (mappedRow) {
                    this.dragSource = "tree";
                    mappedRow.classList.add("dragging");
                    e.dataTransfer.effectAllowed = "move";
                    const draggedNumber = mappedRow.dataset.accountNumber;
                    e.dataTransfer.setData("accountNumber", draggedNumber);

                    // Multi-drag: find the parent node and check if this account is among checked ones
                    const treeNode = mappedRow.closest(".tree-node");
                    if (treeNode) {
                        const nodeId = treeNode.id.replace("node-", "");
                        const checkedSet = this.checkedMappedAccounts.get(nodeId);
                        if (checkedSet && checkedSet.has(draggedNumber) && checkedSet.size > 1) {
                            this.dragAccountNumbers = Array.from(checkedSet);
                            // Highlight all checked rows in this node
                            treeNode.querySelectorAll(".mapped-account-row").forEach(row => {
                                if (checkedSet.has(row.dataset.accountNumber)) {
                                    row.classList.add("dragging");
                                }
                            });
                            // Custom drag image showing count
                            const ghost = document.createElement("div");
                            ghost.className = "drag-ghost";
                            ghost.textContent = `${checkedSet.size} accounts`;
                            ghost.style.cssText = "position:absolute;top:-1000px;padding:6px 14px;background:#17375E;color:white;border-radius:6px;font-size:13px;font-weight:600;white-space:nowrap;";
                            document.body.appendChild(ghost);
                            e.dataTransfer.setDragImage(ghost, 0, 0);
                            setTimeout(() => ghost.remove(), 0);
                        } else {
                            this.dragAccountNumbers = [draggedNumber];
                        }
                    } else {
                        this.dragAccountNumbers = [draggedNumber];
                    }
                } else if (nodeHeader && this.dragSource === "node") {
                    // Node drag was already initiated by the header's own ondragstart
                    // (which uses mousedown tracking on the handle)
                    nodeHeader.classList.add("dragging");
                }
            }

App.prototype.handleDragOver = function(e) {
                e.preventDefault();

                if (this.dragSource === "tree" || this.dragSource === "pool") {
                    // Show pool drop target when dragging from tree
                    if (this.dragSource === "tree") {
                        const accountPool = document.getElementById("accountPool");
                        const isOverPool = e.target.closest("#accountPool");
                        if (isOverPool) {
                            accountPool.classList.add("drop-target");
                        } else {
                            accountPool.classList.remove("drop-target");
                        }
                    }

                    // Highlight node headers as drop targets
                    const nodeHeader = e.target.closest(".node-header");
                    if (nodeHeader) {
                        const treeNode = nodeHeader.closest(".tree-node");
                        if (treeNode) {
                            const nodeId = treeNode.id.replace("node-", "");
                            // Clear other header highlights
                            document.querySelectorAll(".node-header.header-drop-target, .node-header.account-drop-target").forEach(el => {
                                if (el !== nodeHeader) el.classList.remove("header-drop-target", "account-drop-target");
                            });
                            nodeHeader.classList.add("header-drop-target");
                            nodeHeader.classList.add("account-drop-target");
                            e.dataTransfer.dropEffect = "move";

                            // Auto-expand collapsed node after 500ms
                            if (!this.collapseStates[nodeId]) {
                                if (!this.expandTimers[nodeId]) {
                                    this.expandTimers[nodeId] = setTimeout(() => {
                                        this.collapseStates[nodeId] = true;
                                        this.renderTree();
                                        delete this.expandTimers[nodeId];
                                    }, 500);
                                }
                            }
                        }
                    } else {
                        // Clear header highlights when not over a header
                        document.querySelectorAll(".node-header.header-drop-target, .node-header.account-drop-target").forEach(el => {
                            el.classList.remove("header-drop-target", "account-drop-target");
                        });
                    }
                }
            }

App.prototype.handleDragLeave = function(e) {
                if (!e.relatedTarget || !e.relatedTarget.closest) {
                    const accountPool = document.getElementById("accountPool");
                    accountPool.classList.remove("drop-target");
                }

                const dropZones = document.querySelectorAll(".drop-zone.drag-over");
                dropZones.forEach(zone => zone.classList.remove("drag-over"));
            }

App.prototype.handleDrop = function(e) {
                e.preventDefault();
                const accountPool = document.getElementById("accountPool");
                accountPool.classList.remove("drop-target");

                const accountNumber = e.dataTransfer.getData("accountNumber");

                if (this.dragSource === "tree" && e.target.closest("#accountPool")) {
                    // Dropping mapped account(s) back to the pool - unmap them
                    const numbersToUnmap = (this.dragAccountNumbers && this.dragAccountNumbers.length > 0)
                        ? this.dragAccountNumbers
                        : (accountNumber ? [accountNumber] : []);
                    numbersToUnmap.forEach(num => {
                        this.removeAccountFromNodes(this.data.views[this.currentViewIndex].statements, num);
                    });
                    if (numbersToUnmap.length > 1) this.checkedMappedAccounts.clear();
                    this.dragAccountNumbers = null;
                    this.render();
                } else if (this.dragSource === "pool" || this.dragSource === "tree") {
                    let targetNode = null;

                    // Check if dropped on a drop zone
                    const dropZone = e.target.closest(".drop-zone");
                    if (dropZone && accountNumber) {
                        const nodeId = dropZone.closest(".tree-node")?.id.replace("node-", "");
                        if (nodeId) {
                            targetNode = this.findNodeById(this.data.views[this.currentViewIndex].statements, nodeId);
                        }
                    }

                    // Check if dropped on a node header (or any child inside a node header)
                    if (!targetNode && accountNumber) {
                        const nodeHeader = e.target.closest(".node-header");
                        if (nodeHeader) {
                            const treeNode = nodeHeader.closest(".tree-node");
                            if (treeNode) {
                                const nodeId = treeNode.id.replace("node-", "");
                                const candidate = this.findNodeById(this.data.views[this.currentViewIndex].statements, nodeId);
                                if (candidate) {
                                    targetNode = candidate;
                                }
                            }
                        }
                    }

                    if (targetNode) {
                        // Get all account numbers to map (multi-drag or single, from pool or tree)
                        const numbersToMap = (this.dragAccountNumbers && this.dragAccountNumbers.length > 0)
                            ? this.dragAccountNumbers
                            : (accountNumber ? [accountNumber] : []);

                        numbersToMap.forEach(num => {
                            // Always remove from any existing node first to prevent double mapping
                            this.removeAccountFromNodes(this.data.views[this.currentViewIndex].statements, num);
                            const account = this.data.accounts.find(a => a.number === num);
                            if (account) {
                                if (!targetNode.accounts) targetNode.accounts = [];
                                targetNode.accounts.push(account);
                            }
                        });

                        // Clear selection after multi-drag
                        if (this.dragAccountNumbers && this.dragAccountNumbers.length > 1) {
                            if (this.dragSource === "pool") this.selectedAccounts.clear();
                            // Clear checked mapped accounts for the source node
                            if (this.dragSource === "tree") this.checkedMappedAccounts.clear();
                        }

                        this.collapseStates[targetNode.id] = true;
                        this.dragAccountNumbers = null;
                        this.render();
                    }
                }

                const dropZones = document.querySelectorAll(".drop-zone");
                dropZones.forEach(zone => zone.classList.remove("drag-over"));
                document.querySelectorAll(".drop-indicator-top, .drop-indicator-bottom, .node-drop-target, .account-drop-target").forEach(el => {
                    el.classList.remove("drop-indicator-top", "drop-indicator-bottom", "node-drop-target", "account-drop-target");
                });
                document.querySelectorAll(".node-header.header-drop-target").forEach(el => {
                    el.classList.remove("header-drop-target");
                });
            }

App.prototype.handleDragEnd = function(e) {
                const items = document.querySelectorAll(".account-item.dragging, .mapped-account-row.dragging, .node-header.dragging");
                items.forEach(item => item.classList.remove("dragging"));

                const accountPool = document.getElementById("accountPool");
                accountPool.classList.remove("drop-target");

                const dropZones = document.querySelectorAll(".drop-zone.drag-over");
                dropZones.forEach(zone => zone.classList.remove("drag-over"));

                document.querySelectorAll(".node-header.header-drop-target").forEach(el => {
                    el.classList.remove("header-drop-target");
                });
                document.querySelectorAll(".drop-indicator-top, .drop-indicator-bottom, .node-drop-target, .account-drop-target").forEach(el => {
                    el.classList.remove("drop-indicator-top", "drop-indicator-bottom", "node-drop-target", "account-drop-target");
                });

                this.dragSource = null;
                this.dragAccountNumbers = null;

                Object.values(this.expandTimers).forEach(timer => clearTimeout(timer));
                this.expandTimers = {};
            }

App.prototype.unmapAccount = function(accountNumber) {
                const nodes = this.data.views[this.currentViewIndex].statements;
                this.removeAccountFromNodes(nodes, accountNumber);
                this.render();
            }

