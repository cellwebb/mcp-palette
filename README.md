# MCP Palette: Model Context Protocol Server Manager

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

## 💻 Installation

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Install dependencies:

```bash
npm install
```

2. Start the application in development mode:

```bash
npm run electron:dev
```

Alternatively, use the provided start script:

```bash
chmod +x start.sh  # Make the script executable (first time only)
./start.sh
```

## 🏗️ Development

This project uses Vite for frontend development and Electron for the desktop application wrapper.

```bash
# Start Vite development server
npm run dev

# Start Electron with Vite in development mode
npm run electron:dev
```

## 📦 Building for Production

Build the application for your current platform:

```bash
npm run electron:build
```

## 🧰 Architecture

MCP Palette uses a "Server Master List + Profile Overrides" architecture:

1. **Server Master List**: Contains base configurations for all MCP servers
2. **Profiles**: Reference servers from the master list and can override specific properties
3. **Overrides**: Profile-specific customizations that take precedence over master settings
4. **Inheritance**: Properties not explicitly overridden inherit from the master configuration

This architecture provides:

- **Single Source of Truth**: Update a server once, changes apply everywhere (unless overridden)
- **Customization**: Tailor server configurations to specific profiles without duplication
- **State Preservation**: Overrides are retained even when servers are disabled

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
├── scripts/                   # Helper scripts
│   ├── build.sh
│   ├── fix-and-rebuild.sh
│   └── ...
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

MIT

## 📚 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The official MCP specification
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) - Python implementation of MCP
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/ts-sdk) - TypeScript implementation of MCP

## 📊 What is MCP?

The Model Context Protocol (MCP) is a standardized protocol for enabling Large Language Models (LLMs) like Claude to access external tools, data sources, and APIs. MCP allows AI assistants to interact with the outside world, enhancing their capabilities with real-time data access, computations, and external services.

MCP Palette helps developers and teams manage the server configurations needed to enable these extended capabilities in a consistent, organized way.
