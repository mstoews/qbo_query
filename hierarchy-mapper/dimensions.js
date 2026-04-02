// dimensions.js
// Dimension management logic on App.prototype
// Handles CRUD for dimension master lists (funds, classes, nlOrgs, nlProjects)

// Get the dimensions object from the data model
App.prototype.getDimensions = function() {
    return this.data.dimensions;
};

// Get a specific dimension config by key (e.g., "funds", "classes")
App.prototype.getDimension = function(dimKey) {
    return this.data.dimensions[dimKey];
};

// Get enabled dimensions only
App.prototype.getEnabledDimensions = function() {
    const result = {};
    for (const [key, dim] of Object.entries(this.data.dimensions)) {
        if (dim.enabled) {
            result[key] = dim;
        }
    }
    return result;
};

// Add a value to a dimension's master list
App.prototype.addDimensionValue = function(dimKey, name, code) {
    const dim = this.data.dimensions[dimKey];
    if (!dim) return null;

    const newValue = {
        id: generateId(),
        name: name.trim(),
        code: (code || "").trim().toUpperCase()
    };
    dim.values.push(newValue);
    return newValue;
};

// Update a value in a dimension's master list
App.prototype.updateDimensionValue = function(dimKey, valueId, name, code) {
    const dim = this.data.dimensions[dimKey];
    if (!dim) return;

    const value = dim.values.find(v => v.id === valueId);
    if (value) {
        value.name = name.trim();
        value.code = (code || "").trim().toUpperCase();
    }
};

// Remove a value from a dimension's master list
// Also cleans up any account references to this value
App.prototype.removeDimensionValue = function(dimKey, valueId) {
    const dim = this.data.dimensions[dimKey];
    if (!dim) return;

    // Remove from master list
    dim.values = dim.values.filter(v => v.id !== valueId);

    // Clean up account references
    this.data.accounts.forEach(acct => {
        ensureAccountDimensions(acct);
        const ad = acct.dimensions;

        if (dimKey === "funds") {
            ad.funds = (ad.funds || []).filter(id => id !== valueId);
        } else if (dimKey === "classes") {
            ad.classes = (ad.classes || []).filter(id => id !== valueId);
        } else if (dimKey === "nlOrgs") {
            if (ad.nlOrg === valueId) ad.nlOrg = null;
        } else if (dimKey === "nlProjects") {
            ad.nlProjects = (ad.nlProjects || []).filter(id => id !== valueId);
        }
    });
};

// Toggle a dimension enabled/disabled
App.prototype.toggleDimensionEnabled = function(dimKey) {
    const dim = this.data.dimensions[dimKey];
    if (dim) {
        dim.enabled = !dim.enabled;
    }
};

// Get the dimension mapping summary for an account (for badges)
App.prototype.getAccountDimSummary = function(account) {
    ensureAccountDimensions(account);
    const ad = account.dimensions;
    const dims = this.data.dimensions;
    const summary = {};

    if (dims.funds.enabled) {
        const count = (ad.funds || []).length;
        summary.funds = count > 0 ? `${count} fund${count !== 1 ? 's' : ''}` : null;
    }
    if (dims.classes.enabled) {
        const count = (ad.classes || []).length;
        summary.classes = count > 0 ? `${count} class${count !== 1 ? 'es' : ''}` : null;
    }
    if (dims.nlOrgs.enabled) {
        if (ad.nlOrg) {
            const org = dims.nlOrgs.values.find(v => v.id === ad.nlOrg);
            summary.nlOrgs = org ? org.code : "?";
        } else {
            summary.nlOrgs = null;
        }
    }
    if (dims.nlProjects.enabled) {
        const count = (ad.nlProjects || []).length;
        summary.nlProjects = count > 0 ? `${count} proj` : null;
    }

    return summary;
};

// Toggle an account's membership in a multi-select dimension (funds, classes, nlProjects)
App.prototype.toggleAccountDimValue = function(account, dimKey, valueId) {
    ensureAccountDimensions(account);

    let arr;
    if (dimKey === "funds") arr = account.dimensions.funds;
    else if (dimKey === "classes") arr = account.dimensions.classes;
    else if (dimKey === "nlProjects") arr = account.dimensions.nlProjects;
    else return;

    const idx = arr.indexOf(valueId);
    if (idx >= 0) {
        arr.splice(idx, 1);
    } else {
        arr.push(valueId);
    }
};

// Set an account's single-select dimension (nlOrg)
App.prototype.setAccountDimValue = function(account, dimKey, valueId) {
    ensureAccountDimensions(account);

    if (dimKey === "nlOrgs") {
        account.dimensions.nlOrg = valueId || null;
    }
};

// Render dimension badges HTML for an account
App.prototype.renderDimBadges = function(account) {
    const summary = this.getAccountDimSummary(account);
    let html = '';

    for (const [dimKey, colors] of Object.entries(DIM_COLORS)) {
        const dim = this.data.dimensions[dimKey];
        if (!dim || !dim.enabled) continue;

        const value = summary[dimKey];
        if (value) {
            html += `<span class="dim-badge" style="background:${colors.bg};color:${colors.text};border:1px solid ${colors.border};">${value}</span>`;
        }
    }

    return html;
};
