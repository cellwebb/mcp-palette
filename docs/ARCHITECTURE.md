# Architecture Overview

MCP Palette is a cross-platform desktop application built with Electron, Vite, and React. It is designed to provide a modern, user-friendly interface for managing Model Context Protocol (MCP) server configurations.

## High-Level Structure

```
mcp-palette/
├── electron/                  # Electron main process and preload scripts
│   ├── main.js                # Main process entry (window, IPC, menu)
│   ├── preload.js             # Preload script for secure IPC
│   └── store.js               # Data storage management (Electron Store)
├── public/                    # Static assets (icons, etc.)
├── src/                       # Frontend React code (render process)
│   ├── App.jsx                # Main React component
│   ├── components/            # UI components (ProfileSelector, ServerMasterList, etc.)
│   ├── styles/                # CSS styles
│   ├── utils/                 # Utility functions (profileUtils, helpers, validation)
│   └── main.jsx               # Frontend entry point
├── scripts/                   # Helper scripts for build/dev
├── package.json               # Project manifest, scripts, dependencies
└── vite.config.js             # Vite configuration
```

## Key Concepts

### 1. Electron Main Process (`electron/main.js`)
- Responsible for creating application windows, handling IPC, and managing the app lifecycle.
- Loads the frontend (React app) via Vite dev server (development) or built files (production).
- Sets up a secure context via `preload.js` for communication between renderer and main process.

### 2. Renderer Process (React + Vite)
- The UI is built with React and bundled by Vite for fast development and production builds.
- Main entry: `src/main.jsx` → `src/App.jsx` → `src/components/`
- Handles all user interactions, configuration editing, and state management.

### 3. Data Storage
- Uses `electron-store` for persistent storage of MCP profiles and server configurations on the user's machine.
- Data is accessed and mutated via IPC between renderer and main process.

### 4. Profiles & Server Master List
- **Server Master List:** Central repository of base server configurations.
- **Profiles:** User-defined collections of servers, with optional overrides for customization.
- **Overrides:** Profile-specific changes that take precedence over master server settings.

### 5. Testing
- Uses Jest and React Testing Library for robust unit and integration tests.
- Mocks and utilities are provided for testing Electron and React components.

## Build & Release
- Vite is used for fast frontend builds and hot module replacement.
- Electron Builder packages the app for Mac, Windows, and Linux.
- GitHub Actions automate CI (tests) and multi-platform releases.

## Extensibility
- Modular React components and utilities for easy feature expansion.
- IPC and Electron Store usage make it easy to add new data types or settings.

---

For more details, see the [Usage Guide](./USAGE.md) and [Release Guide](./RELEASING.md).
