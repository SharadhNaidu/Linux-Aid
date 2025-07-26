# Contributing to Linux Aid

Thank you for your interest in contributing to Linux Aid! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git
- A Google Gemini API key (for testing)

### Setting up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/yourusername/linux-aid.git
   cd linux-aid
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
5. Add your Gemini API key to `.env`
6. Start the development server:
   ```bash
   npm start
   ```

## 📝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/linux-aid/issues)
2. If not, create a new issue with:
   - Clear bug description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Node.js version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check existing [Issues](https://github.com/yourusername/linux-aid/issues) and [Discussions](https://github.com/yourusername/linux-aid/discussions)
2. Create a new issue with:
   - Clear feature description
   - Use case and motivation
   - Possible implementation approach

### Code Contributions

#### Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes following our coding standards
3. Test your changes thoroughly
4. Commit with clear, descriptive messages:
   ```bash
   git commit -m "Add: Feature description"
   ```
5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. Create a Pull Request on GitHub

#### Coding Standards

##### JavaScript Style
- Use 4 spaces for indentation
- Use semicolons consistently
- Prefer `const` and `let` over `var`
- Use descriptive variable names
- Comment complex logic

##### Example:
```javascript
// Good
const systemInfo = await detectSystemInfo();
console.log("[Main] System detected:", systemInfo);

// Bad
var si = await detectSystemInfo();
console.log("detected:", si)
```

##### File Organization
- Keep functions focused and single-purpose
- Group related functionality
- Use consistent naming conventions
- Add JSDoc comments for public functions

##### Commit Messages
Follow the format: `Type: Description`

Types:
- `Add:` New features
- `Fix:` Bug fixes
- `Update:` Changes to existing features
- `Remove:` Removing code/features
- `Docs:` Documentation changes
- `Style:` Formatting changes
- `Refactor:` Code improvements without feature changes

Examples:
```
Add: Support for Fedora package manager
Fix: Authentication modal not closing properly
Update: Improve error handling in PTY communication
Docs: Add installation instructions for Ubuntu
```

## 🧪 Testing

### Manual Testing
- Test on different Linux distributions
- Verify command execution with various scenarios
- Test authentication flows (sudo, confirmations)
- Check UI responsiveness and error handling

### Test Cases to Cover
1. System detection on different distributions
2. Command execution with and without sudo
3. Authentication modal behavior
4. Terminal output display
5. Error handling and recovery

## 📁 Project Structure

```
linux-aid/
├── main.js              # Main Electron process
├── renderer.js          # Renderer process logic
├── index.html           # Application UI
├── styles.css           # Application styling
├── systemInfo.js        # System detection utilities
├── preload.js           # Electron preload script
├── package.json         # Dependencies and scripts
├── assets/              # Images and icons
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
├── LICENSE              # MIT License
├── README.md           # Project documentation
└── CONTRIBUTING.md     # This file
```

## 🔍 Code Areas Needing Help

### High Priority
- [ ] Better error handling and recovery
- [ ] Command interruption support
- [ ] Improved terminal color rendering
- [ ] Unit and integration tests

### Medium Priority
- [ ] Command history and favorites
- [ ] Custom command templates
- [ ] Plugin system architecture
- [ ] Performance optimizations

### Documentation
- [ ] API documentation
- [ ] User guide with examples
- [ ] Video tutorials
- [ ] Troubleshooting guide

## 🐛 Common Issues

### Development Setup
- **Node-pty compilation issues**: Ensure you have build tools installed
- **API key errors**: Check `.env` file is properly configured
- **Electron version conflicts**: Clear `node_modules` and reinstall

### Authentication Problems
- Modal not appearing: Check IPC communication in DevTools
- Password not working: Verify PTY process state
- Hanging after auth: Check promise resolution flow

## 📚 Resources

### Documentation
- [Electron Documentation](https://electronjs.org/docs)
- [Node-pty Documentation](https://github.com/microsoft/node-pty)
- [Google Gemini API](https://ai.google.dev/)

### Learning Resources
- [Electron Tutorial](https://electronjs.org/tutorial)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)

## 🤝 Code of Conduct

### Our Standards
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other contributors

### Unacceptable Behavior
- Harassment or discriminatory language
- Personal attacks or insults
- Public or private harassment
- Publishing private information without permission
- Any conduct inappropriate in a professional setting

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: maintainer@linux-aid.com (for sensitive matters)

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Special contributor badge eligibility

Thank you for contributing to Linux Aid! 🐧✨
