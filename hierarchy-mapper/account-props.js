// account-props.js
// Expandable per-account properties panel for dimension assignments
// Shows toggle chips for multi-select dims (funds, classes, nlProjects)
// and a dropdown for single-select dims (nlOrgs)

// Toggle the expanded state of an account's properties panel
App.prototype.toggleAccountProps = function(accountNumber) {
    if (!this.expandedAccountProps) this.expandedAccountProps = new Set();

    if (this.expandedAccountProps.has(accountNumber)) {
        this.expandedAccountProps.delete(accountNumber);
    } else {
        this.expandedAccountProps.add(accountNumber);
    }
};

// Build the properties panel DOM element for an account
App.prototype.buildPropsPanel = function(account) {
    ensureAccountDimensions(account);

    const panel = document.createElement("div");
    panel.className = "acct-props-panel";

    const enabledDims = this.getEnabledDimensions();
    const dimKeys = Object.keys(enabledDims);

    if (dimKeys.length === 0) {
        const msg = document.createElement("div");
        msg.className = "acct-props-empty";
        msg.textContent = "No dimensions enabled. Use the Dimensions button to configure.";
        panel.appendChild(msg);
        return panel;
    }

    dimKeys.forEach(dimKey => {
        const dim = enabledDims[dimKey];
        const colors = DIM_COLORS[dimKey];
        const section = document.createElement("div");
        section.className = "acct-props-section";

        const label = document.createElement("div");
        label.className = "acct-props-label";
        label.textContent = colors.label;
        label.style.color = colors.text;
        section.appendChild(label);

        if (dimKey === "nlOrgs") {
            // Single-select dropdown
            section.appendChild(this.buildOrgDropdown(account, dim));
        } else {
            // Multi-select toggle chips
            section.appendChild(this.buildToggleChips(account, dimKey, dim));
        }

        panel.appendChild(section);
    });

    return panel;
};

// Build toggle chips for multi-select dimensions (funds, classes, nlProjects)
App.prototype.buildToggleChips = function(account, dimKey, dim) {
    const container = document.createElement("div");
    container.className = "acct-props-chips";

    const selectedIds = this.getAccountDimSelected(account, dimKey);

    dim.values.forEach(val => {
        const chip = document.createElement("button");
        chip.className = "acct-prop-chip";
        const isSelected = selectedIds.includes(val.id);
        const colors = DIM_COLORS[dimKey];

        if (isSelected) {
            chip.classList.add("selected");
            chip.style.background = colors.bg;
            chip.style.borderColor = colors.border;
            chip.style.color = colors.text;
        }

        chip.textContent = val.code ? `${val.code}` : val.name;
        chip.title = val.name;

        chip.onclick = (e) => {
            e.stopPropagation();
            this.toggleAccountDimValue(account, dimKey, val.id);
            this.rerenderPropsPanel(account.number);
            this.rerenderDimBadges(account.number);
        };

        container.appendChild(chip);
    });

    if (dim.values.length === 0) {
        const empty = document.createElement("span");
        empty.className = "acct-props-no-values";
        empty.textContent = "No values defined";
        container.appendChild(empty);
    }

    return container;
};

// Build dropdown for single-select dimension (nlOrgs)
App.prototype.buildOrgDropdown = function(account, dim) {
    const select = document.createElement("select");
    select.className = "acct-props-dropdown";

    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "-- None --";
    select.appendChild(emptyOpt);

    dim.values.forEach(val => {
        const opt = document.createElement("option");
        opt.value = val.id;
        opt.textContent = val.code ? `${val.code} - ${val.name}` : val.name;
        if (account.dimensions.nlOrg === val.id) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });

    select.onchange = (e) => {
        e.stopPropagation();
        this.setAccountDimValue(account, "nlOrgs", select.value || null);
        this.rerenderDimBadges(account.number);
    };

    return select;
};

// Helper: get selected IDs for a multi-select dimension on an account
App.prototype.getAccountDimSelected = function(account, dimKey) {
    ensureAccountDimensions(account);
    if (dimKey === "funds") return account.dimensions.funds || [];
    if (dimKey === "classes") return account.dimensions.classes || [];
    if (dimKey === "nlProjects") return account.dimensions.nlProjects || [];
    return [];
};

// Re-render just the properties panel for one account (in-place update)
App.prototype.rerenderPropsPanel = function(accountNumber) {
    const account = this.data.accounts.find(a => a.number === accountNumber);
    if (!account) return;

    // Find all panels for this account (could be in pool and tree)
    document.querySelectorAll(`.acct-props-panel[data-account="${accountNumber}"]`).forEach(oldPanel => {
        const newPanel = this.buildPropsPanel(account);
        newPanel.dataset.account = accountNumber;
        oldPanel.replaceWith(newPanel);
    });
};

// Re-render dimension badges for one account (in-place update)
App.prototype.rerenderDimBadges = function(accountNumber) {
    const account = this.data.accounts.find(a => a.number === accountNumber);
    if (!account) return;

    document.querySelectorAll(`.dim-badges[data-account="${accountNumber}"]`).forEach(el => {
        el.innerHTML = this.renderDimBadges(account);
    });
};

// Build the expand arrow element for an account row
App.prototype.buildExpandArrow = function(accountNumber) {
    if (!this.expandedAccountProps) this.expandedAccountProps = new Set();

    const arrow = document.createElement("span");
    arrow.className = "acct-expand-arrow";
    const isExpanded = this.expandedAccountProps.has(accountNumber);
    arrow.textContent = isExpanded ? "▼" : "▶";
    arrow.title = isExpanded ? "Collapse properties" : "Expand properties";

    // Only show if there are enabled dimensions
    const enabledDims = this.getEnabledDimensions();
    if (Object.keys(enabledDims).length === 0) {
        arrow.style.visibility = "hidden";
    }

    arrow.onclick = (e) => {
        e.stopPropagation();
        this.toggleAccountProps(accountNumber);
        // Re-render the relevant list
        this.renderAccountsList();
        this.renderTree();
    };

    return arrow;
};

// Build a badges container element for an account
App.prototype.buildDimBadgesEl = function(account) {
    const badges = document.createElement("span");
    badges.className = "dim-badges";
    badges.dataset.account = account.number;
    badges.innerHTML = this.renderDimBadges(account);
    return badges;
};
