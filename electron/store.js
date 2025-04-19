/**
 * This module provides a centralized store instance for the application
 * to ensure consistent access to the electron-store throughout the app.
 */

const Store = require('electron-store');
const { app } = require('electron');

// Define the default schema and configurations
const schema = {
  serverMasterList: {
    type: 'object',
    default: {}
  },
  profiles: {
    type: 'array',
    default: [
      {
        name: 'Default',
        servers: {}
      }
    ]
  },
  activeProfile: {
    type: 'string',
    default: 'Default'
  }
};

// Create the store instance with defaults
const store = new Store({
  name: 'mcp-profiles',
  schema,
  migrations: {
    // Add any migrations for future versions here
    '1.0.0': store => {
      // Example migration from older formats
      if (!store.has('serverMasterList')) {
        // Handle legacy format without server master list
        const profiles = store.get('profiles');
        if (Array.isArray(profiles)) {
          const serverMasterList = {};
          
          // Extract servers to master list
          profiles.forEach(profile => {
            if (profile.servers) {
              Object.entries(profile.servers).forEach(([serverId, serverConfig]) => {
                if (!serverMasterList[serverId]) {
                  serverMasterList[serverId] = serverConfig;
                }
              });
            }
          });
          
          store.set('serverMasterList', serverMasterList);
        }
      }
    }
  }
});

/**
 * Sets up default MCP servers if not already present
 * @param {boolean} force - If true, will reset to defaults even if data exists
 */
function setupDefaultProfiles(force = false) {
  // Only set up defaults if this is the first run or force is true
  const currentServerMasterList = store.get('serverMasterList');
  const currentProfiles = store.get('profiles');

  if (
    force ||
    Object.keys(currentServerMasterList).length === 0 ||
    (currentProfiles.length === 1 &&
      Object.keys(currentProfiles[0].servers).length === 0)
  ) {
    // Setup default server master list
    const defaultServerMasterList = {
      filesystem: {
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: {
          BASE_DIRS: `${app.getPath('home')}/Documents,${app.getPath('home')}/Downloads`,
        },
      },
      memory: {
        name: 'memory',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        env: {
          MEMORY_FILE_PATH: `${app.getPath('userData')}/.mcp-memory.json`,
        },
      },
      puppeteer: {
        name: 'puppeteer',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        env: {
          PUPPETEER_LAUNCH_OPTIONS: '{ "headless": false}',
          ALLOW_DANGEROUS: 'false',
        },
      },
      'sequential-thinking': {
        name: 'sequential-thinking',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        env: {},
      },
    };

    // Create profiles with server references and optional overrides
    const defaultProfiles = [
      {
        name: 'Default',
        servers: {},
      },
      {
        name: 'Basic',
        servers: {
          filesystem: {
            enabled: true,
            overrides: {},
          },
          memory: {
            enabled: true,
            overrides: {},
          },
        },
      },
      {
        name: 'Complete',
        servers: {
          filesystem: {
            enabled: true,
            overrides: {},
          },
          memory: {
            enabled: true,
            overrides: {},
          },
          puppeteer: {
            enabled: true,
            overrides: {},
          },
          'sequential-thinking': {
            enabled: true,
            overrides: {},
          },
        },
      },
    ];

    // Update store with defaults
    store.set('serverMasterList', defaultServerMasterList);
    store.set('profiles', defaultProfiles);
  }
}

/**
 * Helper function to merge master server with profile overrides
 * @param {string} serverId - The server ID
 * @param {Object} profileOverrides - Profile-specific overrides
 * @returns {Object} The merged configuration
 */
function getMergedServerConfig(serverId, profileOverrides) {
  const master = store.get(`serverMasterList.${serverId}`);

  if (!master) return null;

  if (!profileOverrides) {
    return { ...master, enabled: false };
  }

  const { enabled, overrides } = profileOverrides;

  // Deep merge the master with overrides
  const merged = { ...master };

  // Apply overrides
  if (overrides) {
    if (overrides.name) merged.name = overrides.name;
    if (overrides.command) merged.command = overrides.command;

    if (overrides.args) {
      merged.args = [...overrides.args];
    }

    if (overrides.env) {
      merged.env = { ...merged.env, ...overrides.env };
    }
  }

  // Add enabled flag
  merged.enabled = !!enabled;

  return merged;
}

module.exports = {
  store,
  setupDefaultProfiles,
  getMergedServerConfig
};