# MCP Palette: Model Context Protocol Server Manager
[![Build Status](https://github.com/cellwebb/mcp-palette/actions/workflows/ci.yml/badge.svg)](https://github.com/cellwebb/mcp-palette/actions/workflows/ci.yml)
[![Coverage Status](https://codecov.io/gh/cellwebb/mcp-palette/branch/main/graph/badge.svg)](https://codecov.io/gh/cellwebb/mcp-palette)
[![npm version](https://img.shields.io/npm/v/mcp-palette.svg)](https://www.npmjs.com/package/mcp-palette)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?logo=opensourceinitiative&logoColor=white)](https://opensource.org/licenses/MIT)
[![MCPAmpel](https://img.shields.io/endpoint?url=https://mcpampel.com/badge/cellwebb/mcp-palette.json)](https://mcpampel.com/repo/cellwebb/mcp-palette)

MCP Palette is a modern, user-friendly desktop application for managing Model Context Protocol (MCP) server configurations. It provides a centralized interface to configure, manage, and deploy MCP servers for use with Large Language Models (LLMs) and AI assistants.

## 🚀 Features
- **Profile Management**: Create, edit, rename, and organize server configurations in profiles
- **Server Master List**: Maintain a reusable library of server configurations
- **Profile-Specific Overrides**: Customize servers for specific profiles without duplicating configuration
- **Enable/Disable Servers**: Temporarily disable servers while preserving customizations
- **JSON Editing**: Direct editing of configuration files for advanced users
- **Import/Export**: Share configurations between teams and environments
- **UI Optimizations**: Keyboard support for common operations (Enter to save, Escape to cancel)

## 🔧 Use Cases
- Configure local development environments for AI agents
- Maintain different server setups for various projects
- Set up standardized server configurations for team members
- Create specialized profiles for different AI assistant use cases
- Deploy consistent MCP server configurations in production environments

## 🖥️ Installation & Usage
### For End Users
1. Download the installer from the [Releases page](https://github.com/cellwebb/mcp-palette/releases).
2. Run the installer for your OS.
3. Launch MCP Palette from your Applications folder or Start Menu.

See the [Usage Guide](docs/USAGE.md) for feature explanations.

### For Developers
1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/cellwebb/mcp-palette.git
   cd mcp-palette
   npm install
   ```
2. Run in development mode:
   ```bash
   npm run electron:dev
   ```
3. Build a distributable version:
   ```bash
   npm run electron:build
   ```

**Cross-platform builds:**  
If you need a Windows or Linux installer and are on a Mac, use GitHub Actions or a Windows/Linux machine.

---

## 📚 Documentation
- [Installation Guide](docs/INSTALLATION.md)
- [Usage Guide](docs/USAGE.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Contributing Guide](docs/CONTRIBUTING.md)
- [Release Guide](docs/RELEASING.md)

## 🏗️ Development
This project uses Vite (frontend) and Electron (desktop wrapper).
See [Architecture Overview](docs/ARCHITECTURE.md) for project structure.

**Note for Contributors:**  
See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for dev instructions, including React DevTools usage.

---

## 🤖 Continuous Integration
- CI/CD powered by GitHub Actions.
- Tests and coverage run on each push/PR to `main`.
- See [Electron Builder docs](https://www.electron.build/auto-update#github-actions) for cross-platform build automation.

---

## 📁 Project Structure
```
mcp-palette/
├── electron/                  # Electron-specific code
│   ├── main.js                # Main process entry
│   ├── preload.js             # Preload script
│   └── store.js               # Data storage management
├── public/                    # Static assets
├── src/                       # Frontend React code
│   ├── App.jsx                # Main React component
│   ├── components/            # React components
│   │   ├── ProfileSelector.jsx
│   │   ├── ServerMasterList.jsx
│   │   └── ...
│   ├── styles/                # CSS styles
│   ├── utils/                 # Utility functions
│   │   └── profileUtils.js
│   └── main.jsx               # Frontend entry point
├── package.json
└── vite.config.js             # Vite configuration
```

## 🤝 Contributing
Contributions are welcome! Feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License
MIT License

See [LICENSE](./LICENSE) for details.

## 📚 Related Projects
- [Model Context Protocol](https://modelcontextprotocol.io/) - The official MCP specification
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) - Python implementation of MCP
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/ts-sdk) - TypeScript implementation of MCP

## 📊 What is MCP?
The Model Context Protocol (MCP) is a standardized protocol for enabling Large Language Models (LLMs) like Claude to access external tools, data sources, and APIs. MCP allows AI assistants to interact with the outside world, enhancing their capabilities with real-time data access, computations, and external services.

MCP Palette helps developers and teams manage the server configurations needed to enable these extended capabilities in a consistent, organized way.
