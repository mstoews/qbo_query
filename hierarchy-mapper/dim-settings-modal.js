// dim-settings-modal.js
// Dimension Settings modal - manages master lists for funds, classes, orgs, projects

App.prototype.showDimensionSettingsModal = function() {
    const dims = this.data.dimensions;
    const dimKeys = ["funds", "classes", "nlOrgs", "nlProjects"];

    const bodyHTML = `
        <div class="dim-settings-tabs" id="dimSettingsTabs">
            ${dimKeys.map((key, i) => {
                const colors = DIM_COLORS[key];
                return `<button class="dim-tab ${i === 0 ? 'active' : ''}"
                    data-dim="${key}"
                    onclick="app.switchDimTab('${key}')"
                    style="${i === 0 ? `background:${colors.bg};color:${colors.text};border-color:${colors.border}` : ''}"
                    >${colors.label}</button>`;
            }).join('')}
        </div>
        <div id="dimSettingsContent"></div>
    `;

    this.showModal("Dimension Settings", bodyHTML, [
        { label: "Done", style: "primary" }
    ]);

    // Widen the modal for dimension settings
    const modalContent = document.querySelector("#appModal .modal-content");
    if (modalContent) modalContent.style.maxWidth = "600px";

    // Render first tab
    this.renderDimTabContent("funds");
};

App.prototype.switchDimTab = function(dimKey) {
    // Update tab active states
    const tabs = document.querySelectorAll("#dimSettingsTabs .dim-tab");
    tabs.forEach(tab => {
        const key = tab.dataset.dim;
        const colors = DIM_COLORS[key];
        if (key === dimKey) {
            tab.classList.add("active");
            tab.style.background = colors.bg;
            tab.style.color = colors.text;
            tab.style.borderColor = colors.border;
        } else {
            tab.classList.remove("active");
            tab.style.background = "";
            tab.style.color = "";
            tab.style.borderColor = "";
        }
    });

    this.renderDimTabContent(dimKey);
};

App.prototype.getDimExplainer = function(dimKey) {
    const explainers = {
        funds: {
            title: "Funds",
            desc: "Track money by purpose or restriction. Each fund represents a pool of resources earmarked for a specific use (e.g., General Fund, Restricted Grant, Endowment).",
            hint: "Common for nonprofits, government, and fund accounting."
        },
        classes: {
            title: "QBO Classes",
            desc: "Segment transactions by department, program, or business unit. Classes map directly to QuickBooks Online class tracking.",
            hint: "Use for departmental P&Ls or program-level reporting."
        },
        nlOrgs: {
            title: "NL Organizations",
            desc: "Assign accounts to specific legal entities in your organizational structure. Each account belongs to one organization.",
            hint: "Use for multi-entity consolidation or intercompany reporting."
        },
        nlProjects: {
            title: "NL Projects",
            desc: "Tag accounts to specific projects or grants. Projects can span across funds and classes for cross-cutting tracking.",
            hint: "Use for grant tracking, capital projects, or campaign reporting."
        }
    };
    return explainers[dimKey] || { title: "", desc: "", hint: "" };
};

App.prototype.renderDimTabContent = function(dimKey) {
    const container = document.getElementById("dimSettingsContent");
    if (!container) return;

    const dim = this.data.dimensions[dimKey];
    const colors = DIM_COLORS[dimKey];
    const explainer = this.getDimExplainer(dimKey);

    let html = '';

    // Explainer section
    html += `
        <div class="dim-explainer" style="background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;padding:12px 14px;margin-bottom:14px;">
            <div style="font-size:14px;font-weight:600;color:${colors.text};margin-bottom:4px;">${explainer.title}</div>
            <div style="font-size:13px;color:#334155;line-height:1.5;margin-bottom:4px;">${explainer.desc}</div>
            <div style="font-size:12px;color:#64748b;font-style:italic;">${explainer.hint}</div>
        </div>
    `;

    // Enabled toggle
    html += `
        <div class="dim-enabled-row">
            <label class="dim-toggle-label">
                <input type="checkbox" ${dim.enabled ? 'checked' : ''}
                    onchange="app.handleDimEnabledToggle('${dimKey}', this.checked)">
                <span>Enable ${colors.label}</span>
            </label>
            <span class="dim-enabled-status" style="margin-left:auto;font-size:12px;color:${dim.enabled ? '#166534' : '#94a3b8'};">${dim.enabled ? 'Active' : 'Disabled'}</span>
        </div>
    `;

    // Values list header
    html += `<div class="dim-values-section" ${!dim.enabled ? 'style="opacity:0.4;pointer-events:none;"' : ''}>`;

    if (dim.values.length > 0) {
        html += `
            <div class="dim-values-header">
                <span style="flex:1;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding-left:30px;">Name</span>
                <span style="width:80px;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Code</span>
                <span style="width:28px;"></span>
            </div>
        `;
    }

    html += `<div class="dim-values-list" id="dimValuesList">`;

    if (dim.values.length === 0) {
        html += `<div class="dim-empty-msg">No ${colors.label.toLowerCase()} defined yet. Add one below.</div>`;
    }

    dim.values.forEach((val, idx) => {
        html += `
            <div class="dim-value-row">
                <span class="dim-value-num">${idx + 1}.</span>
                <input type="text" class="dim-value-name" value="${this.escapeHtml(val.name)}"
                    data-dim="${dimKey}" data-id="${val.id}" data-field="name"
                    onchange="app.handleDimValueEdit(this)">
                <input type="text" class="dim-value-code" value="${this.escapeHtml(val.code)}"
                    placeholder="Code"
                    data-dim="${dimKey}" data-id="${val.id}" data-field="code"
                    onchange="app.handleDimValueEdit(this)">
                <button class="dim-remove-btn" onclick="app.handleDimValueRemove('${dimKey}', '${val.id}')" title="Remove">&#x2715;</button>
            </div>
        `;
    });

    html += `</div>`;

    // Add new row
    const placeholders = {
        funds: "e.g., General Fund",
        classes: "e.g., Administration",
        nlOrgs: "e.g., Main Entity LLC",
        nlProjects: "e.g., Capital Campaign"
    };

    html += `
        <div class="dim-add-row">
            <input type="text" class="dim-value-name" id="dimNewName" placeholder="${placeholders[dimKey] || 'Name'}">
            <input type="text" class="dim-value-code" id="dimNewCode" placeholder="Code">
            <button class="dim-add-btn" onclick="app.handleDimValueAdd('${dimKey}')">+ Add</button>
        </div>
    `;

    html += `</div>`; // close dim-values-section

    // Account count using this dimension
    const mappedCount = this.countAccountsWithDim(dimKey);
    const totalCount = this.data.accounts.length;
    html += `
        <div class="dim-stats-row">
            <span style="color:${colors.text};font-weight:500;">${mappedCount}</span> of ${totalCount} accounts have ${colors.label.toLowerCase()} assigned
        </div>
    `;

    container.innerHTML = html;
};

// Event handlers for the dimension settings modal

App.prototype.handleDimEnabledToggle = function(dimKey, checked) {
    this.data.dimensions[dimKey].enabled = checked;
    this.renderDimTabContent(dimKey);
};

App.prototype.handleDimValueEdit = function(inputEl) {
    const dimKey = inputEl.dataset.dim;
    const valueId = inputEl.dataset.id;
    const field = inputEl.dataset.field;
    const val = inputEl.value.trim();

    const dimVal = this.data.dimensions[dimKey].values.find(v => v.id === valueId);
    if (dimVal) {
        if (field === "name") dimVal.name = val;
        if (field === "code") dimVal.code = val.toUpperCase();
    }
};

App.prototype.handleDimValueRemove = function(dimKey, valueId) {
    const dim = this.data.dimensions[dimKey];
    const val = dim.values.find(v => v.id === valueId);
    if (!val) return;

    // Check if any accounts reference this value
    const refCount = this.countAccountsReferencingDimValue(dimKey, valueId);

    if (refCount > 0) {
        // Show confirmation
        const colors = DIM_COLORS[dimKey];
        this.showDimRemoveConfirm(dimKey, valueId, val.name, refCount);
    } else {
        this.removeDimensionValue(dimKey, valueId);
        this.renderDimTabContent(dimKey);
    }
};

App.prototype.showDimRemoveConfirm = function(dimKey, valueId, valueName, refCount) {
    const container = document.getElementById("dimSettingsContent");
    if (!container) return;

    container.innerHTML = `
        <div class="dim-confirm-box">
            <p style="margin-bottom:8px;"><strong>"${this.escapeHtml(valueName)}"</strong> is referenced by ${refCount} account${refCount !== 1 ? 's' : ''}.</p>
            <p style="color:#d33;font-size:13px;margin-bottom:12px;">Removing it will clear this value from all accounts.</p>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="dim-cancel-btn" onclick="app.renderDimTabContent('${dimKey}')">Cancel</button>
                <button class="dim-danger-btn" onclick="app.confirmDimValueRemove('${dimKey}','${valueId}')">Remove</button>
            </div>
        </div>
    `;
};

App.prototype.confirmDimValueRemove = function(dimKey, valueId) {
    this.removeDimensionValue(dimKey, valueId);
    this.renderDimTabContent(dimKey);
};

App.prototype.handleDimValueAdd = function(dimKey) {
    const nameInput = document.getElementById("dimNewName");
    const codeInput = document.getElementById("dimNewCode");
    if (!nameInput) return;

    const name = nameInput.value.trim();
    if (!name) {
        nameInput.focus();
        return;
    }

    const code = codeInput ? codeInput.value.trim() : "";
    this.addDimensionValue(dimKey, name, code);
    this.renderDimTabContent(dimKey);

    // Focus the name input for adding another
    setTimeout(() => {
        const newInput = document.getElementById("dimNewName");
        if (newInput) newInput.focus();
    }, 50);
};

// Count accounts that have at least one value mapped for a dimension
App.prototype.countAccountsWithDim = function(dimKey) {
    let count = 0;
    this.data.accounts.forEach(acct => {
        ensureAccountDimensions(acct);
        const ad = acct.dimensions;
        if (dimKey === "funds" && (ad.funds || []).length > 0) count++;
        else if (dimKey === "classes" && (ad.classes || []).length > 0) count++;
        else if (dimKey === "nlOrgs" && ad.nlOrg) count++;
        else if (dimKey === "nlProjects" && (ad.nlProjects || []).length > 0) count++;
    });
    return count;
};

// Count accounts referencing a specific dimension value
App.prototype.countAccountsReferencingDimValue = function(dimKey, valueId) {
    let count = 0;
    this.data.accounts.forEach(acct => {
        ensureAccountDimensions(acct);
        const ad = acct.dimensions;
        if (dimKey === "funds" && (ad.funds || []).includes(valueId)) count++;
        else if (dimKey === "classes" && (ad.classes || []).includes(valueId)) count++;
        else if (dimKey === "nlOrgs" && ad.nlOrg === valueId) count++;
        else if (dimKey === "nlProjects" && (ad.nlProjects || []).includes(valueId)) count++;
    });
    return count;
};

// Utility: escape HTML for safe rendering in inputs
App.prototype.escapeHtml = function(str) {
    if (!str) return "";
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
