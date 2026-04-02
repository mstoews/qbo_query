// init.js
// Application initialization - loads all modules and creates app instance

document.addEventListener("DOMContentLoaded", () => {
    window.app = new App();
    app.initUndoRedo();
    app.init();
});
