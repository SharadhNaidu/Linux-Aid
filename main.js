// main.js
require('dotenv').config(); // Load environment variables
const fetch = require('node-fetch'); // Add this line for fetch API
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const pty = require('node-pty');
const os = require('os');
const { detectSystemInfo } = require('./systemInfo');

let mainWindow;
let ptyProcess;
let terminalBuffer = '';
let chatHistory = [];
let currentSystemInfo = {};
let isAwaitingAuth = false; // Global flag to prevent multiple auth prompts
let authInputResolver = null; // Global resolver for auth input promises

// Gemini API Configuration
const API_KEY = process.env.GEMINI_API_KEY || '';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, 'assets/icon.png'),
        title: 'Linux Aid - AI Terminal Assistant'
    });

    mainWindow.loadFile('index.html');

    // Enable DevTools only in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
    
    // Log when renderer is ready
    mainWindow.webContents.on('dom-ready', () => {
        console.log("[Main] DOM ready event fired");
    });
    
    mainWindow.webContents.on('did-finish-load', () => {
        console.log("[Main] did-finish-load event fired");
    });
}

// Initialize PTY
function initPty() {
    try {
        console.log("[Main] Initializing PTY...");
        const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash';
        console.log("[Main] Using shell:", shell);
        
        // Create PTY process
        ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-256color', // Better color support
            cols: 80,
            rows: 24,
            cwd: process.env.HOME,
            env: {
                ...process.env,
                TERM: 'xterm-256color',
                COLORTERM: 'truecolor'
            }
        });

        console.log("[Main] PTY process spawned successfully");

        ptyProcess.onData(async (data) => {
            const dataString = data.toString();
            console.log("[Main] PTY data received:", dataString.length, "chars:", dataString.slice(0, 100));
            
            // Send data to renderer for display
            mainWindow.webContents.send('terminal-output', dataString);
            // Append to buffer for AI monitoring
            terminalBuffer += dataString;
            // Limit buffer size to prevent memory issues
            if (terminalBuffer.length > 50000) {
                terminalBuffer = terminalBuffer.slice(-25000);
            }

            // Check for sudo password prompt
            if ((dataString.includes('[sudo] password for') || dataString.includes('Password:')) && !isAwaitingAuth) {
                console.log("[Main CRITICAL Debug] Sudo prompt detected. isAwaitingAuth:", isAwaitingAuth); // NEW CRITICAL LOG
                isAwaitingAuth = true;
                mainWindow.webContents.send('progress-update', { percentage: 70, text: 'Awaiting password...' });
                
                try {
                    const password = await requestAuthInputFromRenderer('sudo', 'Please enter your sudo password:');
                    console.log("[Main CRITICAL Debug] Password PROMISE RESOLVED! Password length:", password.length); // NEW CRITICAL LOG
                    if (password.length === 0) {
                        console.warn("[Main CRITICAL Debug] WARNING: Resolved password is empty!"); // CRITICAL LOG
                    }
                    if (password && ptyProcess) {
                        ptyProcess.write(password + '\r');
                        console.log("[Main CRITICAL Debug] Password WRITTEN to PTY. isAwaitingAuth set to FALSE."); // NEW CRITICAL LOG
                    }
                    isAwaitingAuth = false; // Reset flag on success
                    console.log("[Main CRITICAL Debug] Sudo authentication completed"); // CRITICAL LOG
                } catch (error) {
                    console.error('[Main CRITICAL Error] Sudo password input cancelled or failed:', error); // CRITICAL LOG
                    mainWindow.webContents.send('app-notification', 'Sudo input cancelled or failed.');
                    isAwaitingAuth = false; // Reset flag on failure/cancellation
                }
            }
            // Check for y/n confirmation
            else if (dataString.match(/\(y\/n\)|\[Y\/n\]/i) && !isAwaitingAuth) {
                console.log("[Main Debug] Y/N confirmation prompt detected. isAwaitingAuth:", isAwaitingAuth); // CRITICAL LOG
                isAwaitingAuth = true;
                mainWindow.webContents.send('progress-update', { percentage: 70, text: 'Awaiting confirmation...' });
                
                try {
                    const confirmation = await requestAuthInputFromRenderer('y/n', 'Confirm action (y/n):');
                    console.log("[Main Debug] Confirmation PROMISE RESOLVED. Attempting to write to PTY. Confirmation:", confirmation); // CRITICAL LOG
                    if (confirmation && ptyProcess) {
                        ptyProcess.write(confirmation + '\r');
                        console.log("[Main Debug] Confirmation WRITTEN to PTY."); // CRITICAL LOG
                    }
                    isAwaitingAuth = false;
                    console.log("[Main Debug] Y/N confirmation completed"); // CRITICAL LOG
                } catch (error) {
                    console.error('[Main Error] Y/N confirmation cancelled or failed:', error); // CRITICAL LOG
                    mainWindow.webContents.send('app-notification', 'Confirmation cancelled or failed.');
                    isAwaitingAuth = false;
                }
            }
        });

        ptyProcess.onExit((code, signal) => {
            console.log(`[Main] PTY exited with code ${code}, signal ${signal}`);
            mainWindow.webContents.send('terminal-output', '\r\n--- Terminal Session Ended ---\r\n');
        });

    } catch (error) {
        console.error("[Main] Error initializing PTY:", error);
        mainWindow.webContents.send('terminal-output', '\r\n--- PTY initialization failed ---\r\n');
        mainWindow.webContents.send('app-notification', {
            type: 'error',
            title: 'Terminal Error',
            message: 'Failed to initialize PTY: ' + error.message
        });
    }
}

// Gemini API Client
async function callGemini(prompt, systemInfo, terminalLog) {
    const systemPrompt = `You are Linux Aid, an expert Linux terminal assistant. Your primary goal is to provide direct, executable Linux commands or a list of command options to solve the user's problem.

The user's system is ${systemInfo.distro} (${systemInfo.arch}) with ${systemInfo.desktopEnv} desktop environment.

Current terminal log (last 5000 chars): ${terminalLog.slice(-5000)}

User's request: "${prompt}"

Based on the user's request and system context, provide a solution.

**If a single, direct command can solve the problem, respond with a JSON object of type "text" containing ONLY the command string, prefixed with "COMMAND:".** For example:
\`\`\`json
{ "type": "text", "content": "COMMAND: sudo pacman -Syu" }
\`\`\`

**If multiple commands or steps are involved, or if user choice/confirmation is required, provide a JSON array of up to 3 options.** Each option must have:
- \`command\`: The executable Linux command string.
- \`description\`: A brief explanation of what the command does.
- \`risk_percentage\`: A number from 0-100 indicating potential risk (0 for safe, 100 for very risky).

Example for options:
\`\`\`json
{
  "type": "options",
  "content": [
    { "command": "sudo pacman -S nmap", "description": "Install Nmap network scanner package.", "risk_percentage": 5 },
    { "command": "ip a", "description": "Show network interfaces to identify one for scanning.", "risk_percentage": 0 }
  ]
}
\`\`\`

**If the problem is solved or no further action is needed, respond with a JSON object of type "solved" containing a brief confirmation message.**
\`\`\`json
{ "type": "solved", "content": "The network scan is complete." }
\`\`\`

**If you need more information from the user before suggesting a command, respond with a JSON object of type "text" containing a clear question.**
\`\`\`json
{ "type": "text", "content": "Please tell me which network interface you want to scan (e.g., eth0, wlan0)." }
\`\`\`

Do NOT include conversational filler like "Certainly, I can help with that." or "Here are the steps." unless explicitly asking for more information. Prioritize direct, actionable JSON responses.

Ensure all commands are safe and appropriate for ${systemInfo.distro}. Use pacman for Arch Linux, apt for Ubuntu/Debian, dnf for Fedora, etc.`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [{ text: systemPrompt }]
            }
        ],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    type: { type: "STRING", enum: ["text", "options", "solved"] },
                    content: {
                        oneOf: [
                            { type: "STRING" },
                            {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        command: { type: "STRING" },
                                        description: { type: "STRING" },
                                        risk_percentage: { type: "NUMBER" }
                                    },
                                    required: ["command", "description", "risk_percentage"]
                                }
                            }
                        ]
                    }
                },
                required: ["type", "content"]
            }
        }
    };

    try {
        if (!API_KEY) {
            throw new Error('Gemini API key not found. Please set the GEMINI_API_KEY environment variable.');
        }
        
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const jsonString = result.candidates[0].content.parts[0].text;
            return JSON.parse(jsonString);
        } else {
            throw new Error("Gemini API response structure unexpected or empty.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
}

// Execute command in terminal
async function executeCommandInTerminal(command) {
    return new Promise((resolve, reject) => {
        if (!ptyProcess) {
            return reject(new Error("Terminal not initialized (ptyProcess is null)."));
        }

        let initialBufferLength = terminalBuffer.length; // Snapshot buffer state before command

        // The primary ptyProcess.onData (from initPty) already handles sending to renderer
        // and updating the global terminalBuffer. We don't need a temporary one here.

        // Send the command to the PTY
        ptyProcess.write(command + '\r'); // Execute the command

        // To resolve this promise when the command is "done", we rely on the AI's
        // ability to parse the full terminalBuffer. For a more immediate resolution,
        // we capture new output after the command with a short delay.
        setTimeout(() => {
            // Capture only the *new* output generated by this command for the promise resolution
            const newOutput = terminalBuffer.substring(initialBufferLength);
            resolve(newOutput); // Resolve with the output specifically from this command
        }, 1000); // Small delay to capture output
    });
}

// Handle AI responses
function handleAIResponse(response) {
    if (response.type === 'text') {
        const commandPrefix = "COMMAND: ";
        if (response.content.startsWith(commandPrefix)) {
            const commandToExecute = response.content.substring(commandPrefix.length).trim();
            mainWindow.webContents.send('ai-response', { type: 'text', content: `**Linux Aid:** Executing: \`${commandToExecute}\`` });
            mainWindow.webContents.send('progress-update', { percentage: 50, text: `Executing: ${commandToExecute}` });
            
            // Auto-execute the command by emitting a send-prompt event
            setTimeout(() => {
                ipcMain.emit('send-prompt', null, { type: 'execute', command: commandToExecute });
            }, 500); // Small delay to ensure UI updates
        } else {
            // Regular text response from AI (e.g., asking for clarification)
            mainWindow.webContents.send('ai-response', { type: 'text', content: response.content });
            mainWindow.webContents.send('progress-update', { percentage: 100, text: 'Awaiting user input...' });
        }
    } else if (response.type === 'options') {
        mainWindow.webContents.send('ai-response', { type: 'options', content: response.content });
        mainWindow.webContents.send('progress-update', { percentage: 60, text: 'Awaiting user selection...' });
    } else if (response.type === 'solved') {
        mainWindow.webContents.send('ai-response', { type: 'solved', content: response.content });
        mainWindow.webContents.send('progress-update', { percentage: 100, text: 'Problem Solved!' });
    } else {
        mainWindow.webContents.send('ai-response', { type: 'text', content: 'AI provided an unexpected response format.' });
        mainWindow.webContents.send('progress-update', { percentage: 0, text: 'Error' });
    }
}

// App initialization
app.whenReady().then(async () => {
    createWindow();
    initPty();

    // Wait for the renderer to be ready before sending system info
    // DISABLED: Let the renderer-ready handler do this instead
    /*
    mainWindow.webContents.once('did-finish-load', async () => {
        console.log("[Main] Page loaded, starting system detection...");
        // Add sufficient delay to ensure DOM and scripts are loaded
        setTimeout(async () => {
            try {
                console.log("[Main] Starting system info detection...");
                currentSystemInfo = await detectSystemInfo();
                console.log("[Main] Sending 'system-info-ready' with:", currentSystemInfo);
                mainWindow.webContents.send('system-info-ready', currentSystemInfo);
            } catch (err) {
                console.error("[Main] Failed to detect system info:", err);
                console.error("[Main] Sending 'system-info-error' with:", err.message);
                mainWindow.webContents.send('system-info-error', err.message);
            }
        }, 1000); // 1 second delay to ensure everything is loaded
    });
    */

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers
ipcMain.on('renderer-ready', () => {
    console.log("[Main] Received renderer-ready signal");
    // Now we know the renderer is fully loaded and ready
    // Trigger system info detection
    setTimeout(async () => {
        try {
            console.log("[Main] Starting system info detection after renderer ready...");
            currentSystemInfo = await detectSystemInfo();
            console.log("[Main] Sending 'system-info-ready' with:", currentSystemInfo);
            mainWindow.webContents.send('system-info-ready', currentSystemInfo);
        } catch (err) {
            console.error("[Main] Failed to detect system info:", err);
            console.error("[Main] Sending 'system-info-error' with:", err.message);
            mainWindow.webContents.send('system-info-error', err.message);
        }
    }, 100);
});

ipcMain.on('terminal-input', (event, input) => {
    console.log("[Main] Received terminal input:", input);
    if (ptyProcess) {
        ptyProcess.write(input);
    }
});

ipcMain.on('terminal-resize', (event, size) => {
    console.log("[Main] Received terminal resize:", size);
    if (ptyProcess) {
        ptyProcess.resize(size.cols, size.rows);
    }
});

ipcMain.on('send-prompt', async (event, { type, text, command }) => {
    try {
        if (type === 'user-prompt') {
            chatHistory.push({ role: "user", parts: [{ text: text }] });
            mainWindow.webContents.send('progress-update', { percentage: 20, text: 'Analyzing prompt...' });
            
            const aiResponse = await callGemini(text, currentSystemInfo, terminalBuffer);
            handleAIResponse(aiResponse);
            
        } else if (type === 'execute') {
            mainWindow.webContents.send('progress-update', { percentage: 50, text: `Executing: ${command}` });
            mainWindow.webContents.send('ai-response', { type: 'text', content: `Executing command: \`${command}\`` });
            
            try {
                const output = await executeCommandInTerminal(command);
                chatHistory.push({ role: "user", parts: [{ text: `Command executed: ${command}\nOutput:\n${output}` }] });
                mainWindow.webContents.send('progress-update', { percentage: 80, text: 'Analyzing output...' });
                
                const systemContext = `The user's system is ${currentSystemInfo.distro} (${currentSystemInfo.arch}) with ${currentSystemInfo.desktopEnv}.`;
                const terminalLogContext = terminalBuffer ? `Full current terminal log: \`\`\`\n${terminalBuffer}\n\`\`\`` : '';
                const previousActionContext = `Previous command executed: \`${command}\`. Output: \n\`\`\`\n${output}\n\`\`\``;

                const followUpPrompt = `You are Linux Aid, an expert Linux terminal assistant. Your primary goal is to provide direct, executable Linux commands or a list of command options to solve the user's problem.
${systemContext}
${previousActionContext}
${terminalLogContext}

Based on the previous action's outcome and the full terminal log, what is the next logical step?

**If a single, direct command can solve the problem or is the next immediate step, respond with a JSON object of type "text" containing ONLY the command string, prefixed with "COMMAND:".**

**If multiple commands or steps are involved, or if user choice/confirmation is required, provide a JSON array of up to 3 options.** Each option must have:
- \`command\`: The executable Linux command string.
- \`description\`: A brief explanation of what the command does.
- \`risk_percentage\`: A number from 0-100 indicating potential risk.

**If the problem is solved or no further action is needed, respond with a JSON object of type "solved" containing a brief confirmation message.**

**If you need more information from the user before suggesting a command, respond with a JSON object of type "text" containing a clear question.**

Do NOT include conversational filler. Prioritize direct, actionable JSON responses.`;

                const aiResponse = await callGemini(followUpPrompt, currentSystemInfo, terminalBuffer);
                handleAIResponse(aiResponse);
                
            } catch (cmdError) {
                mainWindow.webContents.send('ai-response', { type: 'text', content: `Command failed: ${cmdError.message}` });
                chatHistory.push({ role: "user", parts: [{ text: `Command failed: ${command}\nError:\n${cmdError.message}` }] });
                mainWindow.webContents.send('progress-update', { percentage: 80, text: 'Analyzing error...' });
                
                const systemContext = `The user's system is ${currentSystemInfo.distro} (${currentSystemInfo.arch}) with ${currentSystemInfo.desktopEnv}.`;
                const terminalLogContext = terminalBuffer ? `Full current terminal log: \`\`\`\n${terminalBuffer}\n\`\`\`` : '';
                
                const errorPrompt = `You are Linux Aid, an expert Linux terminal assistant. Your primary goal is to provide direct, executable Linux commands or a list of command options to solve the user's problem.
${systemContext}
${terminalLogContext}

The command "${command}" failed with error: ${cmdError.message}. Based on this error, what should we do next?

**If a single, direct command can fix the problem, respond with a JSON object of type "text" containing ONLY the command string, prefixed with "COMMAND:".**

**If multiple commands or steps are involved, or if user choice/confirmation is required, provide a JSON array of up to 3 options.** Each option must have:
- \`command\`: The executable Linux command string.
- \`description\`: A brief explanation of what the command does.
- \`risk_percentage\`: A number from 0-100 indicating potential risk.

**If the problem cannot be solved or requires user intervention, respond with a JSON object of type "text" containing a clear explanation.**

Do NOT include conversational filler. Prioritize direct, actionable JSON responses.`;

                const aiResponse = await callGemini(errorPrompt, currentSystemInfo, terminalBuffer);
                handleAIResponse(aiResponse);
            }
        }
    } catch (error) {
        console.error("AI Logic Handler error:", error);
        mainWindow.webContents.send('ai-response', { type: 'text', content: `An internal error occurred: ${error.message}. Please try again.` });
        mainWindow.webContents.send('progress-update', { percentage: 0, text: 'Error' });
    }
});

// Add auth-input-response handler
ipcMain.on('auth-input-response', (event, input) => {
    console.log("[Main CRITICAL Debug] 'auth-input-response' RECEIVED from renderer!"); // NEW CRITICAL LOG
    console.log("[Main CRITICAL Debug] Received input length:", input.length); // NEW CRITICAL LOG
    console.log("[Main CRITICAL Debug] Is authInputResolver currently null?", authInputResolver === null); // NEW CRITICAL LOG
    if (authInputResolver) {
        authInputResolver(input); // This resolves the promise in requestAuthInputFromRenderer
        authInputResolver = null;
    } else {
        console.error("[Main CRITICAL Error] authInputResolver was NULL when 'auth-input-response' received. This is a major flow error!"); // CRITICAL ERROR LOG
    }
});

// Function to request auth input from renderer
async function requestAuthInputFromRenderer(type, message) {
    console.log(`[Main CRITICAL Debug] Requesting auth input from renderer (type: ${type}).`); // CRITICAL LOG
    return new Promise(resolve => {
        authInputResolver = resolve;
        mainWindow.webContents.send('show-auth-modal', type, message);
        console.log("[Main CRITICAL Debug] Sent 'show-auth-modal' to renderer."); // CRITICAL LOG
    });
}

ipcMain.handle('auth-input-received', (event, input) => {
    console.log("[Main] Received auth input");
    if (ptyProcess) {
        ptyProcess.write(input + '\r');
        isAwaitingAuth = false; // Reset the flag when auth input is received
    }
});

// Global error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception in Main Process:', error);
    if (mainWindow) {
        mainWindow.webContents.send('app-notification', `A critical error occurred: ${error.message}. Please restart the app.`);
    }
});

// Function to get current terminal buffer (for AI)
function getTerminalBuffer() {
    return terminalBuffer;
}

module.exports = { getTerminalBuffer };
