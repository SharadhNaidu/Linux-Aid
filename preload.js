// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendPrompt: (prompt) => ipcRenderer.send('send-prompt', prompt),
    onTerminalOutput: (callback) => ipcRenderer.on('terminal-output', (event, data) => callback(data)),
    sendTerminalInput: (input) => ipcRenderer.send('terminal-input', input),
    sendTerminalResize: (size) => ipcRenderer.send('terminal-resize', size),
    onSystemInfoReady: (callback) => ipcRenderer.on('system-info-ready', (event, info) => callback(info)),
    onSystemInfoError: (callback) => ipcRenderer.on('system-info-error', (event, errorMsg) => callback(errorMsg)),
    onProgressUpdate: (callback) => ipcRenderer.on('progress-update', (event, message) => callback(message)),
    onAIResponse: (callback) => ipcRenderer.on('ai-response', (event, response) => callback(response)),
    onNotification: (callback) => ipcRenderer.on('app-notification', (event, message) => callback(message)),
    onAuthRequest: (callback) => ipcRenderer.on('request-auth-input', (event, type, message) => callback(type, message)),
    onShowAuthModal: (callback) => ipcRenderer.on('show-auth-modal', (event, type, message) => callback(type, message)),
    sendAuthInput: (input) => ipcRenderer.invoke('auth-input-received', input),
    sendAuthInputResponse: (input) => ipcRenderer.send('auth-input-response', input),
    rendererReady: () => ipcRenderer.send('renderer-ready'),
    
    // Remove all listeners for cleanup
    removeAllListeners: () => {
        ipcRenderer.removeAllListeners('terminal-output');
        ipcRenderer.removeAllListeners('system-info-ready');
        ipcRenderer.removeAllListeners('system-info-error');
        ipcRenderer.removeAllListeners('progress-update');
        ipcRenderer.removeAllListeners('ai-response');
        ipcRenderer.removeAllListeners('app-notification');
        ipcRenderer.removeAllListeners('request-auth-input');
        ipcRenderer.removeAllListeners('show-auth-modal');
    }
});
