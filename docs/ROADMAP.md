# MCP-Palette Improvement Roadmap

## Milestone 1 – Core Stability

1. Audit and fix critical bugs in profile/server CRUD flows
2. Add descriptive logging and error handling around IPC handlers
3. Clean up any broken scripts (e.g. `scripts/run-tests.sh`)
4. Verify manual smoke-tests: create/edit/delete profiles & servers

## Milestone 2 – Essential Tests

1. Write unit tests for store migrations and JSON import/export logic
2. Add Jest tests for any utility functions (e.g. `profileUtils.js`)
3. Mock IPC in a couple of key React component tests
4. Ensure test suite passes 100% locally

## Milestone 3 – CI Basics

1. Create a GitHub Actions workflow that on every push:
   - Installs deps (`npm ci`)
   - Runs lint (`npm run lint`)
   - Runs tests (`npm test`)
2. Enforce a minimal coverage threshold (e.g. 80%)
3. Badges in README for build & coverage status

## Milestone 4 – Incremental TypeScript

1. Add `tsconfig.json` and adjust [vite.config.js](cci:7://file:///Users/cell/projects/mcp-palette/vite.config.js:0:0-0:0)/`electron-builder`
2. Rename one hot-path module (e.g. `store.js → store.ts`) and convert it
3. Gradually convert IPC handler files and utility modules
4. Keep JSX files as `.jsx` until you feel comfortable switching to `.tsx`

## Milestone 5 – Docs & Feedback Loop

1. Polish README “Getting Started” with exact commands
2. Add a “How to Contribute” section and issue templates
3. Publish a v1.4.0 release and share with peers for early feedback
4. Collect user pain-points and iterate

---

**Next step:** pick Milestone 1 and let’s triage its bug list!
