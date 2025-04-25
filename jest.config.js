module.exports = {
  // The root directory that Jest should scan for tests and modules
  rootDir: ".",

  // The test environment that will be used for testing
  testEnvironment: "jsdom",

  // The glob patterns Jest uses to detect test files
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],

  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],

  // Transform files with babel-jest or other transformers
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },

  // Ensure ESM modules like react-monaco-editor and monaco-editor are transformed
  transformIgnorePatterns: [
    "/node_modules/(?!(react-monaco-editor|monaco-editor)/)"
  ],

  // Remove extensionsToTreatAsEsm (not needed for .js), keep moduleFileExtensions for completeness
  moduleFileExtensions: ["js", "jsx", "json", "node", "mjs", "cjs"],

  // Set up Jest to use testing-library
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],

  // Mock files like CSS, images, etc.
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
    // Mock react-monaco-editor and monaco-editor to avoid ESM import issues in tests
    "^react-monaco-editor$": "<rootDir>/__mocks__/monacoMock.js",
    "^monaco-editor$": "<rootDir>/__mocks__/monacoMock.js",
  },

  // Coverage configuration
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.d.ts"],

  // Verbose output
  verbose: true,
};
