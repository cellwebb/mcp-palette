# Installation Guide

## For End Users

1. Visit the [GitHub Releases page](https://github.com/cellwebb/mcp-palette/releases).
2. Download the installer or binary for your operating system (e.g., `.dmg` for Mac, `.exe` for Windows).
3. Run the installer and follow the prompts to install MCP Palette.
4. Launch MCP Palette from your Applications folder (Mac) or Start Menu/Desktop (Windows).

## For Developers/Contributors

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
- For Windows/Linux builds on Mac, use GitHub Actions or a native machine.
