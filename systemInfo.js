// systemInfo.js
const { exec } = require('child_process');

async function detectSystemInfo() {
    console.log("[SystemInfo] Starting system detection...");
    let distro = 'Unknown';
    let arch = 'Unknown';
    let desktopEnv = 'Unknown';

    try {
        // Detect Distro
        console.log("[SystemInfo] Attempting to detect distro with lsb_release -a...");
        const lsbRelease = await new Promise((resolve, reject) => {
            exec('lsb_release -a', (error, stdout, stderr) => {
                if (error) {
                    console.warn("[SystemInfo] lsb_release failed, trying /etc/os-release. Error:", error.message, "Stderr:", stderr);
                    exec('cat /etc/os-release', (err2, stdout2, stderr2) => {
                        if (err2) {
                            console.error("[SystemInfo] /etc/os-release also failed. Error:", err2.message, "Stderr:", stderr2);
                            reject(err2);
                        } else {
                            console.log("[SystemInfo] /etc/os-release stdout:", stdout2);
                            resolve(stdout2);
                        }
                    });
                } else {
                    console.log("[SystemInfo] lsb_release stdout:", stdout);
                    resolve(stdout);
                }
            });
        });

        if (lsbRelease.includes('Description:')) {
            const match = lsbRelease.match(/Description:\s*(.*)/);
            if (match && match[1]) distro = match[1].trim();
        } else if (lsbRelease.includes('NAME=')) { // For /etc/os-release
            const nameMatch = lsbRelease.match(/NAME="?([^"\n]+)"?/);
            const versionMatch = lsbRelease.match(/VERSION="?([^"\n]+)"?/);
            if (nameMatch && nameMatch[1]) distro = nameMatch[1].trim();
            if (versionMatch && versionMatch[1]) distro += ` ${versionMatch[1].trim()}`;
        }
        console.log("[SystemInfo] Distro detected:", distro);

        // Detect Architecture
        console.log("[SystemInfo] Attempting to detect architecture with uname -m...");
        const unameM = await new Promise((resolve, reject) => {
            exec('uname -m', (error, stdout, stderr) => {
                if (error) {
                    console.error("[SystemInfo] uname -m failed. Error:", error.message, "Stderr:", stderr);
                    reject(error);
                } else {
                    console.log("[SystemInfo] uname -m stdout:", stdout);
                    resolve(stdout);
                }
            });
        });
        arch = unameM.trim();
        console.log("[SystemInfo] Architecture detected:", arch);

        // Detect Desktop Environment
        console.log("[SystemInfo] Attempting to detect desktop environment with $XDG_CURRENT_DESKTOP...");
        const xdgCurrentDesktop = await new Promise((resolve, reject) => {
            exec('echo $XDG_CURRENT_DESKTOP', (error, stdout, stderr) => {
                if (error) {
                    console.error("[SystemInfo] $XDG_CURRENT_DESKTOP failed. Error:", error.message, "Stderr:", stderr);
                    reject(error);
                } else {
                    console.log("[SystemInfo] $XDG_CURRENT_DESKTOP stdout:", stdout);
                    resolve(stdout);
                }
            });
        });
        desktopEnv = xdgCurrentDesktop.trim() || process.env.DESKTOP_SESSION || 'Unknown';
        console.log("[SystemInfo] Desktop Environment detected:", desktopEnv);

    } catch (error) {
        console.error("[SystemInfo] Critical error during system info detection:", error);
    }

    console.log("[SystemInfo] Final detected info:", { distro, arch, desktopEnv });
    return { distro, arch, desktopEnv };
}

module.exports = { detectSystemInfo };
