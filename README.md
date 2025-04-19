# MCP Server Manager (Vite + Electron)

A modern Electron application for managing Model Context Protocol (MCP) server configurations with a Server Master List architecture.

## Features

- **Server Master List**: Central repository of all MCP server configurations
- **Profile-Specific Overrides**: Customize servers for specific profiles without duplicating configuration
- **Multiple Profiles**: Group different sets of MCP servers for various use cases
- **Enable/Disable Servers**: Temporarily disable servers while preserving customizations
- **JSON Configuration**: Edit configurations directly in JSON format with Monaco Editor
- **Import/Export**: Share configurations between machines

## Installation

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

## Development

This project uses Vite for frontend development and Electron for the desktop application wrapper.

```bash
# Start Vite development server
npm run dev

# Start Electron with Vite in development mode
npm run electron:dev
```

## Building for Production

Build the application for your current platform:

```bash
npm run electron:build
```

## Architecture

MCP Server Manager uses a "Server Master List + Profile Overrides" architecture:

1. **Server Master List**: Contains base configurations for all MCP servers
2. **Profiles**: Reference servers from the master list and can override specific properties
3. **Overrides**: Profile-specific customizations that take precedence over master settings
4. **Inheritance**: Properties not explicitly overridden inherit from the master configuration

This architecture provides:

- **Single Source of Truth**: Update a server once, changes apply everywhere (unless overridden)
- **Customization**: Tailor server configurations to specific profiles without duplication
- **State Preservation**: Overrides are retained even when servers are disabled

## Project Structure

```
mcp-palette-vite/
├── electron/                  # Electron-specific code
│   ├── main.js                # Main process entry
│   └── preload.js             # Preload script
├── public/                    # Static assets
├── src/                       # Frontend React code
│   ├── App.jsx                # Main React component
│   ├── components/            # React components
│   │   ├── ProfileSelector.jsx
│   │   ├── ServerMasterList.jsx
│   │   └── ...
│   ├── styles/                # CSS styles
│   │   └── index.css
│   ├── utils/                 # Utility functions
│   │   └── helpers.js
│   └── main.jsx               # Frontend entry point
├── .gitignore
├── index.html                 # Vite entry HTML
├── package.json
└── vite.config.js             # Vite configuration
```

## License

MIT
