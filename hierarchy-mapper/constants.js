// constants.js
// Contains global constants and utility functions

const LEVEL_COLORS = ["#17375E", "#4a90d9", "#6ba3e5", "#9ebce8", "#c6dff5", "#e8f0fe"];

const DEFAULT_LEVEL_LABELS = ["Statement", "Section", "Subsection", "Group", "Line Item", "Detail"];

// Dimension display colors (badge backgrounds + text)
const DIM_COLORS = {
    funds:      { bg: "#f3e8ff", border: "#c084fc", text: "#6b21a8", label: "Funds" },
    classes:    { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", label: "QBO Classes" },
    nlOrgs:     { bg: "#dcfce7", border: "#86efac", text: "#166534", label: "NL Organizations" },
    nlProjects: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", label: "NL Projects" }
};

// Dimension display modes for report options
const DIM_DISPLAY_MODES = ["separate", "columns", "filter", "none"];

function generateId() {
            return crypto.randomUUID();
        }
