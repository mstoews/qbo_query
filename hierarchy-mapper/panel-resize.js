// panel-resize.js
// Draggable resize handles between panels

(function() {
    const LEFT_MIN = 280;
    const LEFT_MAX = 680;
    const RIGHT_MIN = 320;
    const RIGHT_MAX = 900;

    document.addEventListener("DOMContentLoaded", function() {
        const container = document.querySelector(".container");
        const leftPanel = document.querySelector(".left-panel");
        const middlePanel = document.querySelector(".middle-panel");
        const rightPanel = document.querySelector(".right-panel");
        if (!container || !leftPanel || !middlePanel || !rightPanel) return;

        // Create resize handle between left and middle
        const leftHandle = document.createElement("div");
        leftHandle.className = "panel-resize-handle";
        leftHandle.title = "Drag to resize";
        container.insertBefore(leftHandle, middlePanel);

        // Create resize handle between middle and right
        const rightHandle = document.createElement("div");
        rightHandle.className = "panel-resize-handle";
        rightHandle.title = "Drag to resize";
        container.insertBefore(rightHandle, rightPanel);

        let activeHandle = null;
        let startX = 0;
        let startWidth = 0;

        function onMouseDown(handle, panel, e) {
            activeHandle = { handle, panel, side: panel === leftPanel ? "left" : "right" };
            startX = e.clientX;
            startWidth = panel.offsetWidth;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
            handle.classList.add("active");
            e.preventDefault();
        }

        leftHandle.addEventListener("mousedown", function(e) {
            onMouseDown(leftHandle, leftPanel, e);
        });

        rightHandle.addEventListener("mousedown", function(e) {
            onMouseDown(rightHandle, rightPanel, e);
        });

        document.addEventListener("mousemove", function(e) {
            if (!activeHandle) return;
            const dx = e.clientX - startX;

            if (activeHandle.side === "left") {
                let newWidth = startWidth + dx;
                newWidth = Math.max(LEFT_MIN, Math.min(LEFT_MAX, newWidth));
                leftPanel.style.width = newWidth + "px";
            } else {
                // Right panel: dragging left makes it wider
                let newWidth = startWidth - dx;
                newWidth = Math.max(RIGHT_MIN, Math.min(RIGHT_MAX, newWidth));
                rightPanel.style.width = newWidth + "px";
            }
        });

        document.addEventListener("mouseup", function() {
            if (!activeHandle) return;
            activeHandle.handle.classList.remove("active");
            activeHandle = null;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        });
    });
})();
