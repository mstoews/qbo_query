// undo-redo.js
// Undo/redo state history for the app

App.prototype.initUndoRedo = function() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 50;
    // Save initial state
    this.saveState();
};

// Save a snapshot of the current data to the undo stack
App.prototype.saveState = function() {
    const snapshot = JSON.stringify(this.data);
    // Don't save if identical to the last snapshot
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === snapshot) {
        return;
    }
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
    }
    // Any new action clears the redo stack
    this.redoStack = [];
    this.updateUndoRedoButtons();
};

// Undo: restore previous state
App.prototype.undo = function() {
    if (this.undoStack.length <= 1) return; // Need at least 2: previous + current
    // Push current state to redo
    this.redoStack.push(this.undoStack.pop());
    // Restore previous state
    const prevState = this.undoStack[this.undoStack.length - 1];
    this.data = JSON.parse(prevState);
    this.render();
    this.updateUndoRedoButtons();
};

// Redo: restore next state
App.prototype.redo = function() {
    if (this.redoStack.length === 0) return;
    const nextState = this.redoStack.pop();
    this.undoStack.push(nextState);
    this.data = JSON.parse(nextState);
    this.render();
    this.updateUndoRedoButtons();
};

// Update button disabled states
App.prototype.updateUndoRedoButtons = function() {
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");
    if (undoBtn) {
        undoBtn.disabled = this.undoStack.length <= 1;
        undoBtn.classList.toggle("toolbar-btn-disabled", this.undoStack.length <= 1);
    }
    if (redoBtn) {
        redoBtn.disabled = this.redoStack.length === 0;
        redoBtn.classList.toggle("toolbar-btn-disabled", this.redoStack.length === 0);
    }
};
