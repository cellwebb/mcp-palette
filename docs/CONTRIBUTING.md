# Contributing Guide

Thank you for your interest in improving MCP Palette!

## How to Contribute

1. **Fork** this repository on GitHub.
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/mcp-palette.git
   cd mcp-palette
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and commit with clear messages.
5. **Push** your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** on GitHub and describe your changes.

## Code Style & Practices
- Follow existing code style and structure.
- Write clear, descriptive commit messages.
- Add or update tests as needed.
- Run tests locally with `npm test` before submitting a PR.

## Reporting Issues
- Use GitHub Issues for bugs or feature requests.
- Include details and steps to reproduce if reporting a bug.

## Using React Developer Tools
- React DevTools are auto-installed in dev mode via `electron-devtools-installer`.
- To use:
  1. Run `npm run electron:dev`
  2. Open Electron DevTools (`Cmd+Opt+I`/`Ctrl+Shift+I`)
  3. Look for the "React" tab.
- No browser extension or standalone CLI needed.
