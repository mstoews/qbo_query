// app.js
// Main App class definition and core methods

class App {
    constructor() {
                this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
                this.currentViewIndex = 0;
                this.selectedAccounts = new Set();
                this.accountSearchText = "";
                this.rangeFilter = { from: "", to: "" };
                this.showUnmappedOnly = false;
                this.dragSource = null;
                this.collapseStates = {};
                this.expandTimers = {};
                this.checkedMappedAccounts = new Map();
                this.editingOrgName = false;
                this.activeAssignNode = null;
                this.draggedNodeId = null;
                this.expandedAccountProps = new Set();
                this.previewCYDate = "Dec 31, 2025";
                this.previewPYDate = "Dec 31, 2024";
                this.importTabActive = false;
                this.importState = null;
                // Preview columns: "cy" is required, others can be added/removed
                this.previewColumns = [
                    { id: "cy", label: "Current Year", field: "amountCY", removable: false },
                    { id: "py", label: "Prior Year", field: "amountPY", removable: true }
                ];
                this.init();
            }

    render() {
                this.renderOrgName();
                this.renderViewTabs();
                this.renderToolbar();
                this.renderLevelLegend();
                this.renderAccountsList();
                this.renderTree();
                this.renderPreview();
                // Save state for undo/redo after each render
                if (this.undoStack) this.saveState();
            }

    init() {
                // Auto-open import screen when no accounts are loaded
                if (this.data.accounts.length === 0) {
                    this.importTabActive = true;
                }
                this.render();
                this.attachEventListeners();
            }

    attachEventListeners() {
                document.getElementById("accountSearch").addEventListener("input", (e) => {
                    this.accountSearchText = e.target.value.toLowerCase();
                    this.renderAccountsList();
                });

                document.getElementById("orgName").addEventListener("click", () => {
                    this.editOrgName();
                });

                document.addEventListener("dragstart", (e) => this.handleDragStart(e));
                document.addEventListener("dragover", (e) => this.handleDragOver(e));
                document.addEventListener("drop", (e) => this.handleDrop(e));
                document.addEventListener("dragend", (e) => this.handleDragEnd(e));
                document.addEventListener("dragleave", (e) => this.handleDragLeave(e));

                document.addEventListener("keydown", (e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                        e.preventDefault();
                        this.undo();
                    } else if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
                        e.preventDefault();
                        this.redo();
                    } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                        e.preventDefault();
                        this.redo();
                    }
                });
            }

    editOrgName() {
                if (this.editingOrgName) return;
                this.editingOrgName = true;
                const orgNameEl = document.getElementById("orgName");
                const input = document.createElement("input");
                input.type = "text";
                input.className = "org-name-input";
                input.value = this.data.orgName;
                input.style.width = "500px";
                orgNameEl.replaceWith(input);
                input.focus();
                input.select();

                const finish = () => {
                    this.data.orgName = input.value || "Organization Name";
                    this.editingOrgName = false;
                    this.render();
                };

                input.addEventListener("blur", finish);
                input.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") finish();
                    if (e.key === "Escape") {
                        this.editingOrgName = false;
                        this.render();
                    }
                });
            }
}
