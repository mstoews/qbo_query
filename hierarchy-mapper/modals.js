// modals.js
// Modal dialogs for user interactions

App.prototype.showModal = function(title, bodyHTML, buttons) {
                const modal = document.getElementById("appModal");
                document.getElementById("appModalHeader").textContent = title;
                document.getElementById("appModalBody").innerHTML = bodyHTML;

                const footer = document.getElementById("appModalFooter");
                footer.innerHTML = "";

                buttons.forEach(btn => {
                    const button = document.createElement("button");
                    button.textContent = btn.label;
                    if (btn.style === "cancel") {
                        button.style.cssText = "background:#999;";
                    } else if (btn.style === "danger") {
                        button.style.cssText = "background:#d33;";
                    } else {
                        button.style.cssText = "background:#17375E;";
                    }
                    button.onclick = () => {
                        if (btn.onclick) btn.onclick();
                        if (btn.closeModal !== false) this.hideModal();
                    };
                    footer.appendChild(button);
                });

                modal.classList.add("show");
            }

App.prototype.hideModal = function() {
                document.getElementById("appModal").classList.remove("show");
            }

App.prototype.closeModal = function() {
                const modal = document.getElementById("bulkAssignModal");
                modal.classList.remove("show");
            }

App.prototype.showCreateNodeModal = function(parentNode, level) {
                const view = this.data.views[this.currentViewIndex];
                const levelName = level === 0 ? "Statement / Schedule" : (view.levelLabels[level] || "Child");

                const bodyHTML = `
                    <div style="margin-bottom:12px;">
                        <label style="display:block;font-size:12px;font-weight:600;color:#17375E;margin-bottom:4px;">Name</label>
                        <input type="text" id="modalNodeName" placeholder="e.g., Statement of Financial Position"
                            style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:14px;font-family:inherit;">
                    </div>
                    <div style="margin-bottom:12px;">
                        <label style="display:block;font-size:12px;font-weight:600;color:#17375E;margin-bottom:4px;">Visible on printed statement?</label>
                        <select id="modalNodeVisible" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:13px;">
                            <option value="true" selected>Yes - show this line on the statement</option>
                            <option value="false">No - use for grouping only</option>
                        </select>
                    </div>
                    <div style="margin-bottom:4px;">
                        <label style="display:block;font-size:12px;font-weight:600;color:#17375E;margin-bottom:4px;">Default sign for accounts under this node</label>
                        <select id="modalNodeSign" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:13px;">
                            <option value="1" selected>Debit normal (+1) - Assets, Expenses</option>
                            <option value="-1">Credit normal (-1) - Liabilities, Equity, Revenue</option>
                        </select>
                        <div style="font-size:11px;color:#999;margin-top:4px;">This sets the default sign for new accounts added under this node. Individual accounts can override this.</div>
                    </div>
                `;

                this.showModal(`Add New ${levelName}`, bodyHTML, [
                    {
                        label: "Cancel",
                        style: "cancel"
                    },
                    {
                        label: `Create ${levelName}`,
                        style: "primary",
                        onclick: () => {
                            const name = document.getElementById("modalNodeName").value.trim();
                            if (!name) return;

                            const visible = document.getElementById("modalNodeVisible").value === "true";
                            const sign = parseInt(document.getElementById("modalNodeSign").value);

                            const newNode = {
                                id: generateId(),
                                name: name,
                                visible: visible,
                                sortOrder: 0,
                                defaultSign: sign,
                                accounts: [],
                                children: []
                            };

                            if (parentNode === null) {
                                // Adding a top-level statement
                                view.statements.push(newNode);
                            } else {
                                if (!parentNode.children) parentNode.children = [];
                                parentNode.children.push(newNode);
                                this.collapseStates[parentNode.id] = true;
                            }

                            this.collapseStates[newNode.id] = true;
                            this.render();
                        }
                    }
                ]);

                // Focus the name input after modal shows
                setTimeout(() => {
                    const input = document.getElementById("modalNodeName");
                    if (input) {
                        input.focus();
                        input.addEventListener("keydown", (e) => {
                            if (e.key === "Enter") {
                                // Click the last button (the primary action)
                                const footer = document.getElementById("appModalFooter");
                                const buttons = footer.querySelectorAll("button");
                                if (buttons.length > 0) buttons[buttons.length - 1].click();
                            }
                        });
                    }
                }, 100);
            }

App.prototype.showDeleteConfirmModal = function(node) {
                const directCount = (node.accounts || []).length;
                const totalCount = this.countAccounts(node);
                const childCount = (node.children || []).length;

                let message = "";
                let canDelete = true;

                if (totalCount > 0 && childCount > 0) {
                    message = `<p style="margin-bottom:8px;"><strong>"${node.name}"</strong> contains:</p>
                        <ul style="margin:0 0 12px 20px;font-size:13px;">
                            <li>${childCount} child section${childCount !== 1 ? 's' : ''}</li>
                            <li>${totalCount} mapped account${totalCount !== 1 ? 's' : ''} (${directCount} direct)</li>
                        </ul>
                        <p style="color:#d33;font-size:13px;">Deleting will remove all children and unmap all accounts back to the pool.</p>`;
                } else if (totalCount > 0) {
                    message = `<p style="margin-bottom:8px;"><strong>"${node.name}"</strong> has ${totalCount} account${totalCount !== 1 ? 's' : ''} mapped to it.</p>
                        <p style="color:#d33;font-size:13px;">Deleting will unmap all accounts back to the pool.</p>`;
                } else if (childCount > 0) {
                    message = `<p style="margin-bottom:8px;"><strong>"${node.name}"</strong> has ${childCount} child section${childCount !== 1 ? 's' : ''}.</p>
                        <p style="color:#d33;font-size:13px;">Deleting will remove all children.</p>`;
                } else {
                    message = `<p>Delete <strong>"${node.name}"</strong>?</p>`;
                }

                this.showModal("Delete Node", message, [
                    {
                        label: "Cancel",
                        style: "cancel"
                    },
                    {
                        label: totalCount > 0 || childCount > 0 ? "Unmap All & Delete" : "Delete",
                        style: "danger",
                        onclick: () => {
                            // Unmap all accounts recursively
                            this.unmapNodeAccounts(node);
                            // Remove the node
                            const view = this.data.views[this.currentViewIndex];
                            this.removeNode(view.statements, node);
                            this.render();
                        }
                    }
                ]);
            }

App.prototype.showRenameViewModal = function(viewIndex) {
                const view = this.data.views[viewIndex];
                const bodyHTML = `
                    <div>
                        <label style="display:block;font-size:12px;font-weight:600;color:#17375E;margin-bottom:4px;">View Name</label>
                        <input type="text" id="modalViewName" value="${view.name}"
                            style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:14px;font-family:inherit;">
                    </div>
                `;

                this.showModal("Rename View", bodyHTML, [
                    {
                        label: "Cancel",
                        style: "cancel"
                    },
                    {
                        label: "Rename",
                        style: "primary",
                        onclick: () => {
                            const name = document.getElementById("modalViewName").value.trim();
                            if (name) {
                                view.name = name;
                                this.render();
                            }
                        }
                    }
                ]);

                setTimeout(() => {
                    const input = document.getElementById("modalViewName");
                    if (input) {
                        input.focus();
                        input.select();
                        input.addEventListener("keydown", (e) => {
                            if (e.key === "Enter") {
                                const footer = document.getElementById("appModalFooter");
                                const buttons = footer.querySelectorAll("button");
                                if (buttons.length > 0) buttons[buttons.length - 1].click();
                            }
                        });
                    }
                }, 100);
            }

App.prototype.showNewViewModal = function() {
                const bodyHTML = `
                    <div>
                        <label style="display:block;font-size:12px;font-weight:600;color:#17375E;margin-bottom:4px;">View Name</label>
                        <input type="text" id="modalNewViewName" placeholder="e.g., Management View"
                            style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:14px;font-family:inherit;">
                    </div>
                `;

                this.showModal("Create New View", bodyHTML, [
                    {
                        label: "Cancel",
                        style: "cancel"
                    },
                    {
                        label: "Create View",
                        style: "primary",
                        onclick: () => {
                            const name = document.getElementById("modalNewViewName").value.trim();
                            if (!name) return;

                            this.data.views.push({
                                name: name,
                                maxDepth: 5,
                                levelLabels: ["Statement", "Section", "Subsection", "Line Item", "Detail 1"],
                                statements: []
                            });
                            this.currentViewIndex = this.data.views.length - 1;
                            this.render();
                        }
                    }
                ]);

                setTimeout(() => {
                    const input = document.getElementById("modalNewViewName");
                    if (input) {
                        input.focus();
                        input.addEventListener("keydown", (e) => {
                            if (e.key === "Enter") {
                                const footer = document.getElementById("appModalFooter");
                                const buttons = footer.querySelectorAll("button");
                                if (buttons.length > 0) buttons[buttons.length - 1].click();
                            }
                        });
                    }
                }, 100);
            }

App.prototype.showAlertModal = function(title, message) {
                this.showModal(title, `<p>${message}</p>`, [
                    { label: "OK", style: "primary" }
                ]);
            }

