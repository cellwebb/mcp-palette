// This file is run before each test file
import "@testing-library/jest-dom";

// Mock window.api functions used in components
window.api = {
  getServerMasterList: jest.fn().mockResolvedValue({}),
  getProfiles: jest.fn().mockResolvedValue([]),
  getActiveProfile: jest.fn().mockResolvedValue(""),
  setActiveProfile: jest.fn().mockResolvedValue(true),
  addProfile: jest.fn().mockResolvedValue([]),
  updateProfile: jest.fn().mockResolvedValue([]),
  deleteProfile: jest.fn().mockResolvedValue([]),
  renameProfile: jest.fn().mockResolvedValue([]),
  addMasterServer: jest.fn().mockResolvedValue({}),
  updateMasterServer: jest.fn().mockResolvedValue({}),
  deleteMasterServer: jest.fn().mockResolvedValue({}),
  safeAlert: jest.fn().mockResolvedValue(undefined),
  safeConfirm: jest.fn().mockResolvedValue(true),
  importConfig: jest.fn().mockResolvedValue({}),
  exportConfig: jest.fn().mockResolvedValue(true),
  onProfilesUpdated: jest.fn(),
  onProfilesReset: jest.fn(),
  onMenuImportConfig: jest.fn(),
  onMenuExportConfig: jest.fn(),
  removeAllListeners: jest.fn(),
};

// Mock resize observer
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console errors during tests
console.error = jest.fn();
