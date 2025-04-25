# MCP Palette: Model Context Protocol Server Manager
[![Build Status](https://github.com/cellwebb/mcp-palette/actions/workflows/ci.yml/badge.svg)](https://github.com/cellwebb/mcp-palette/actions/workflows/ci.yml)
[![Coverage Status](https://codecov.io/gh/cellwebb/mcp-palette/branch/main/graph/badge.svg)](https://codecov.io/gh/cellwebb/mcp-palette)
[![npm version](https://img.shields.io/npm/v/mcp-palette.svg)](https://www.npmjs.com/package/mcp-palette)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?logo=opensourceinitiative&logoColor=white)](https://opensource.org/licenses/MIT)

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

For installation instructions, see the [Installation Guide](docs/INSTALLATION.md).

**For End Users:**

1. Go to the [Releases page](https://github.com/cellwebb/mcp-palette/releases) and download the installer or binary for your operating system (e.g., `.dmg` for Mac, `.exe` for Windows).
2. Run the installer and follow the prompts to install MCP Palette on your computer.
3. Launch MCP Palette from your Applications folder (Mac) or Start Menu/Desktop (Windows).

For usage details and feature explanations, see the [Usage Guide](docs/USAGE.md).

**For Developers/Contributors:**

1. Clone the repository:
   ```bash
   git clone https://github.com/cellwebb/mcp-palette.git
   cd mcp-palette
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the app in development mode:
   ```bash
   npm run electron:dev
   ```
4. Build a distributable version (installer/binary):
   ```bash
   npm run electron:build
   ```
   The output will appear in the `dist/` directory.

**Note:**
- If you need a Windows or Linux installer and are on a Mac, use GitHub Actions or a Windows/Linux machine to build for those platforms. See below for cross-platform automation.

## 📖 Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Usage Guide](docs/USAGE.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Contributing Guide](docs/CONTRIBUTING.md)
- [Release Guide](docs/RELEASING.md)

## 🏗️ Development

This project uses Vite for frontend development and Electron for the desktop application wrapper.

For an overview of the project structure and core concepts, see the [Architecture Overview](docs/ARCHITECTURE.md).

### Continuous Integration

This project uses GitHub Actions for continuous integration. On each push or pull request to the `main` branch, the CI workflow installs dependencies, runs tests with coverage, and uploads coverage reports to Codecov.

```bash
# Start Vite development server
npm run dev

# Start Electron with Vite in development mode
npm run electron:dev
```

### Cross-Platform Builds & Automated Releases

To build installers for all platforms and automate uploading to GitHub Releases:
- Use GitHub Actions to build on Windows, Mac, and Linux runners.
- Configure Electron Builder in your workflow to upload artifacts to Releases automatically.
- See the [Electron Builder docs on CI/CD](https://www.electron.build/auto-update#github-actions) for sample workflows.

If you need help setting up a workflow, let us know!

## 📦 Building for Production

Build the application for your current platform:

```bash
npm run electron:build
```

## 🧪 Testing

MCP Palette includes comprehensive testing capabilities, powered by [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/):

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Test coverage
npm test:coverage

# Run specific test suites
npm test:validator  # MCP validation tests
npm test:components # Component tests
npm test:validation # Validation tests
```

**Testing Notes:**
- All necessary dev dependencies (`jest`, `@testing-library/react`, `babel-jest`, etc.) are included in `package.json`.
- File and style mocks are provided in `__mocks__/` for robust component testing.
- Babel is used for modern JS/React syntax support (see `.babelrc`).

For contributing, see the [Contributing Guide](docs/CONTRIBUTING.md).

For release instructions, see the [Release Guide](docs/RELEASING.md).

## 🛠️ Babel

MCP Palette uses [Babel](https://babeljs.io/) (see `.babelrc`) to enable modern JavaScript and React features, and to support Jest-based testing.

## ⚡️ What’s New in 1.2.0

- Full Jest + React Testing Library support
- Babel configuration for modern JS/React and tests
- File/style mocks for testing
- Updated documentation

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

MIT License

See [LICENSE](./LICENSE) for details.

## 📚 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The official MCP specification
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) - Python implementation of MCP
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/ts-sdk) - TypeScript implementation of MCP

## 📊 What is MCP?

The Model Context Protocol (MCP) is a standardized protocol for enabling Large Language Models (LLMs) like Claude to access external tools, data sources, and APIs. MCP allows AI assistants to interact with the outside world, enhancing their capabilities with real-time data access, computations, and external services.

MCP Palette helps developers and teams manage the server configurations needed to enable these extended capabilities in a consistent, organized way.
