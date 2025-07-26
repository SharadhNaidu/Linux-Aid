# Linux Aid - AI-Powered Terminal Assistant

![Linux Aid Logo](assets/icon.png)

Linux Aid is an intelligent Linux terminal assistant that provides AI-powered command suggestions, automated execution, and interactive authentication handling. Built with Electron and powered by Google's Gemini AI.

## 🚀 Features

- **AI-Powered Command Suggestions**: Get intelligent Linux command recommendations based on your system and needs
- **Automated Command Execution**: Commands are automatically executed with proper authentication handling
- **Interactive Authentication**: Secure sudo password and confirmation prompts with modal dialogs
- **Live Terminal Output**: Real-time display of command execution with proper formatting
- **System Detection**: Automatically detects your Linux distribution, architecture, and desktop environment
- **Multi-Distribution Support**: Works with Arch Linux, Ubuntu, Debian, Fedora, and other major distributions
- **Safe Command Execution**: Risk assessment for potentially dangerous operations

## 🖥️ Screenshots

*Coming soon - Screenshots of the application in action*

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)  
- **Linux Operating System** (Primary target - may work on other Unix-like systems)
- **Google Gemini API Key** (Free at [Google AI Studio](https://makersuite.google.com/app/apikey))

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/linux-aid.git
cd linux-aid
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and paste it in your `.env` file

### 5. Run the Application

```bash
npm start
```

## 🎯 Usage

1. **Launch the Application**: Run `npm start` to open the Linux Aid interface
2. **System Detection**: The app automatically detects your Linux system details
3. **Ask for Help**: Type what you want to accomplish in plain English
   - "Install Docker"
   - "Check system memory usage"
   - "Update all packages"  
   - "Find large files in home directory"
4. **Review Suggestions**: The AI provides command options with risk assessments
5. **Execute Commands**: Click to execute commands with automatic authentication handling
6. **Monitor Output**: Watch live terminal output in the integrated display

### 🖥️ System-Aware Solutions
- Automatically detects your Linux distribution, architecture, and desktop environment
- Provides commands specifically tailored to your system
- Supports all major Linux distributions

### 🔧 Integrated Terminal
- Full-featured terminal embedded in the application
- Real-time command execution and output monitoring
- Secure sudo password handling
- Interactive command confirmation

### 🎨 Modern Interface
- Clean, minimalist black and white design
- Responsive layout that works on all screen sizes
- Progress tracking for long-running operations
- Contextual notifications

### 🛡️ Security Features
- Secure sudo password handling (never stored)
- Command risk assessment before execution
- User confirmation for system-modifying commands
- Sandboxed execution environment

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Linux operating system

### Quick Start
1. Clone or download the Linux Aid project
2. Open terminal in the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the application:
   ```bash
   npm start
   ```

### Building for Distribution
To create a distributable package:
```bash
npm install electron-builder --save-dev
npm run build
```

## Usage

### Getting Started
1. Launch Linux Aid
2. Wait for system detection to complete
3. Type your request in natural language
4. Review AI-generated solutions and risk assessments
5. Select and execute commands with confidence

### Example Prompts
- "Install VS Code on my system"
- "My Wi-Fi isn't working, help me fix it"
- "Update all packages safely"
- "Check my disk usage and clean up space"
- "Install Docker and set it up"
- "Fix audio problems"
- "Set up a firewall"

### Command Risk Assessment
Each suggested command comes with a risk percentage:
- **0-30%**: Low risk, safe to execute
- **31-60%**: Medium risk, review before executing
- **61-100%**: High risk, understand implications first

### Authentication
- Linux Aid will prompt for sudo password when needed
- Passwords are never stored or logged
- All authentication is handled securely through the terminal

## Technical Details

### Architecture
- **Frontend**: Electron with HTML, CSS, JavaScript
- **Backend**: Node.js with system integration
- **Terminal**: xterm.js with node-pty for full PTY support
- **AI Integration**: Google Gemini API for command generation
- **Security**: Sandboxed execution with secure IPC communication

### System Requirements
- Linux (any distribution)
- 2GB RAM minimum
- 500MB disk space
- Internet connection for AI features

### Supported Distributions
- Ubuntu and derivatives
- Fedora and Red Hat-based systems
- Debian and derivatives
- Arch Linux and derivatives
- openSUSE and SUSE-based systems
- And many more...

## Development

### Project Structure
```
linux-aid/
├── main.js              # Electron main process
├── renderer.js          # Frontend logic
├── preload.js           # Secure IPC bridge
├── systemInfo.js        # System detection module
├── index.html           # Main UI
├── style.css            # Styling (strict B&W theme)
├── package.json         # Dependencies and scripts
└── assets/              # Application assets
```

### Key Components
1. **System Detection**: Automatically identifies distribution, architecture, and desktop environment
2. **AI Integration**: Communicates with Gemini API for intelligent command generation
3. **Terminal Manager**: Handles PTY creation and command execution
4. **Security Layer**: Manages sudo prompts and input sanitization
5. **Progress Tracking**: Real-time feedback during operations

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different Linux distributions
5. Submit a pull request

## Security Considerations

### Data Privacy
- No user data is stored permanently
- Terminal history is kept in memory only
- Sudo passwords are never logged or stored
- All communication with AI is over HTTPS

### Safe Command Execution
- All commands are previewed before execution
- Risk assessment helps users make informed decisions
- Dangerous commands require explicit confirmation
- Sandboxed execution prevents system damage

## Troubleshooting

### Common Issues
1. **Terminal not working**: Ensure node-pty is properly installed
2. **System detection fails**: Check if lsb_release is available
3. **AI responses fail**: Verify internet connection and API key
4. **Font issues**: Install recommended monospace fonts

### Getting Help
- Check the integrated terminal for error messages
- Review the console output for debugging information
- Ensure all dependencies are properly installed
- Try restarting the application

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini AI for intelligent command generation
- xterm.js and node-pty for terminal integration
- Electron for cross-platform desktop application framework
- The Linux community for inspiration and feedback

---

**Linux Aid** - Making Linux accessible to everyone through AI-powered assistance.
