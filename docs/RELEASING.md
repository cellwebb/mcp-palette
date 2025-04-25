# Release Guide

This guide explains how to create a new release of MCP Palette and automate multi-platform builds.

## Automated Release (Recommended)

1. **Update version:**
   - Bump the version in `package.json` (follow semantic versioning).
2. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "chore: bump version to vX.Y.Z"
   git push
   ```
3. **Create a new tag:**
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
4. **GitHub Actions will build and release:**
   - The `.github/workflows/release.yml` workflow will build installers for Mac, Windows, and Linux and attach them to a new GitHub Release.

## Manual Release (Advanced)

1. Run the build script locally for your OS:
   ```bash
   npm run electron:build
   ```
2. Test the generated installer in the `dist/` directory.
3. Go to the [GitHub Releases page](https://github.com/cellwebb/mcp-palette/releases), draft a new release, and upload the installer(s).

## Notes
- For cross-platform builds, prefer using GitHub Actions as described above.
- Ensure all tests pass before releasing (`npm test`).
- Update documentation and changelogs as needed for each release.
