// renderer.js
// BASIC TEST VERSION - checking if renderer loads at all
console.log("[Renderer TEST] Renderer script is loading...");

// Terminal instance
let term;
let fitAddon;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Renderer TEST] DOM loaded!");
    
    // CRITICAL DEBUG: Check if electronAPI is available
    if (typeof window.electronAPI === 'undefined') {
        console.error("[Renderer TEST] ❌ window.electronAPI is UNDEFINED!");
        return;
    } else {
        console.log("[Renderer TEST] ✅ window.electronAPI is available.");
    }
    
    // Send renderer-ready signal
    console.log("[Renderer TEST] Sending renderer-ready signal...");
    try {
        window.electronAPI.rendererReady();
        console.log("[Renderer TEST] ✅ renderer-ready signal sent successfully.");
    } catch (error) {
        console.error("[Renderer TEST] ❌ Failed to send renderer-ready signal:", error);
    }
});

console.log("[Renderer TEST] Renderer script loaded successfully");
