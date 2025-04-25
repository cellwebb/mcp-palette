/**
 * Utility functions for managing profiles and server configurations
 */

import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * Generates a final JSON configuration object for a profile.
 * This JSON represents the actual configuration that would be used:
 * - Only includes enabled servers
 * - Inherits values from master servers
 * - Applies overrides from profile configuration
 * - Formats output according to the MCP specification format
 *
 * @param {Object} profile - The profile object with server configurations
 * @param {Object} masterServers - Master server configurations
 * @returns {Object} - Final configuration object formatted for MCP
 */
export const generateFinalProfileConfig = (profile, masterServers) => {
  if (!profile || !profile.servers || !masterServers) {
    return {
      mcpServers: {},
    };
  }

  // Create a clean output object in the MCP specification format
  const finalConfig = {
    mcpServers: {},
  };

  // Process each server in the profile
  Object.entries(profile.servers).forEach(([serverId, profileServer]) => {
    // Skip disabled servers
    if (!profileServer.enabled) return;

    // Get the master server configuration
    const masterServer = masterServers[serverId];
    if (!masterServer) return; // Skip if master server doesn't exist

    // Create a deep copy of the master server
    const serverConfig = JSON.parse(JSON.stringify(masterServer));

    // Apply overrides from profile
    if (profileServer.overrides) {
      applyOverrides(serverConfig, profileServer.overrides);
    }

    // Remove internal implementation details
    if ("id" in serverConfig) {
      delete serverConfig.id;
    }

    // Get the server name to use as the key (use originalId as fallback)
    const serverKey = serverConfig.name || serverConfig.originalId || serverId;

    // Determine if overrides only contain env key
    const overrideKeys = profileServer.overrides ? Object.keys(profileServer.overrides) : [];
    const onlyEnvOverride = overrideKeys.length === 1 && overrideKeys[0] === 'env';

    if (onlyEnvOverride) {
      // Only env overrides: omit command and args
      finalConfig.mcpServers[serverKey] = {};
      if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
        finalConfig.mcpServers[serverKey].env = serverConfig.env;
      }
    } else {
      // Extract only the command and args properties for the MCP spec format
      finalConfig.mcpServers[serverKey] = {
        command: serverConfig.command,
        args: serverConfig.args,
      };

      // Include environment variables if they exist
      if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
        finalConfig.mcpServers[serverKey].env = serverConfig.env;
      }
    }
  });

  return finalConfig;
};

/**
 * Converts a final (user-facing) profile configuration back to the internal format
 * by calculating the overrides needed to achieve the same configuration
 *
 * Handles both the new MCP spec format and the legacy format for backward compatibility
 *
 * @param {Object} finalConfig - The final profile configuration (in mcpServers format or legacy format)
 * @param {Object} currentProfile - The current internal profile configuration
 * @param {Object} masterServers - The master server configurations
 * @returns {Object} - Updated internal profile configuration
 */
export const convertFinalConfigToInternal = (
  finalConfig,
  currentProfile,
  masterServers,
) => {
  // Create a new profile with existing settings
  const updatedProfile = {
    id: currentProfile.id || uuidv4(),
    name: currentProfile.name, // Keep the original name
    servers: { ...currentProfile.servers }, // Start with current servers
  };

  // Determine if we're using the new format (mcpServers) or legacy format
  const isNewFormat = finalConfig.mcpServers !== undefined;
  const serverEntries = isNewFormat
    ? Object.entries(finalConfig.mcpServers || {})
    : Object.entries(finalConfig.servers || {});

  // Add or update servers from the final config
  serverEntries.forEach(([serverKey, serverConfig]) => {
    // In the new format, serverKey is the name, not the UUID
    // We need to find the corresponding server UUID in the master list
    let serverId;

    if (isNewFormat) {
      // Find the server in the master list by name or originalId
      const matchingServer = Object.entries(masterServers).find(
        ([_, server]) =>
          server.name === serverKey || server.originalId === serverKey,
      );

      if (!matchingServer) return; // Skip if we can't find the server
      serverId = matchingServer[0]; // Get the UUID
    } else {
      // In the legacy format, the key is already the UUID
      serverId = serverKey;
    }

    const masterServer = masterServers[serverId];

    // Skip if master server doesn't exist
    if (!masterServer) return;

    // Calculate overrides by comparing with master server
    const overrides = calculateOverrides(masterServer, serverConfig);

    // Create or update server entry
    updatedProfile.servers[serverId] = {
      enabled: true, // It's in the final config so it's enabled
      overrides,
    };
  });

  // Mark any servers not in final config as disabled (but don't remove them)
  if (currentProfile.servers) {
    Object.keys(currentProfile.servers).forEach((serverId) => {
      const masterServer = masterServers[serverId];
      if (!masterServer) return; // Skip if server no longer exists in master list

      const serverName =
        masterServer.name || masterServer.originalId || serverId;

      // Check if this server is in the final config
      const isInConfig = isNewFormat
        ? finalConfig.mcpServers && finalConfig.mcpServers[serverName]
        : finalConfig.servers && finalConfig.servers[serverId];

      if (!isInConfig) {
        if (updatedProfile.servers[serverId]) {
          updatedProfile.servers[serverId].enabled = false;
        }
      }
    });
  }

  return updatedProfile;
};

/**
 * Calculates the overrides needed to transform masterConfig into targetConfig
 *
 * @param {Object} masterConfig - The master server configuration
 * @param {Object} targetConfig - The target server configuration
 * @returns {Object} - Overrides object
 */
export const calculateOverrides = (masterConfig, targetConfig) => {
  const overrides = {};

  // Compare each property in targetConfig with masterConfig
  Object.entries(targetConfig).forEach(([key, value]) => {
    // Skip comparing if the key doesn't exist in master config
    if (!(key in masterConfig)) {
      overrides[key] = value;
      return;
    }

    // Skip internal properties like originalId
    if (key === "originalId") {
      return;
    }

    const masterValue = masterConfig[key];

    // If values are different
    if (JSON.stringify(value) !== JSON.stringify(masterValue)) {
      // For nested objects, calculate nested overrides
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        masterValue !== null &&
        typeof masterValue === "object" &&
        !Array.isArray(masterValue)
      ) {
        const nestedOverrides = calculateOverrides(masterValue, value);
        if (Object.keys(nestedOverrides).length > 0) {
          overrides[key] = nestedOverrides;
        }
      } else {
        // For primitives or arrays, directly override
        overrides[key] = value;
      }
    }
  });

  return overrides;
};

/**
 * Recursively applies overrides to a configuration object
 *
 * @param {Object} target - Target configuration object
 * @param {Object} overrides - Overrides to apply
 */
export const applyOverrides = (target, overrides) => {
  if (!overrides || typeof overrides !== "object") return;

  // Special handling for environment variables
  if (overrides.env && typeof overrides.env === "object") {
    // Handle env vars specially to support "deletion" overrides
    if (!target.env) {
      target.env = {};
    }

    // First, check for special null value which indicates deletion
    Object.entries(overrides.env).forEach(([key, value]) => {
      if (value === null) {
        // If value is explicitly null, remove this env var
        if (target.env[key] !== undefined) {
          delete target.env[key];
        }
      } else {
        // Otherwise apply the override normally
        target.env[key] = value;
      }
    });
    
    // Skip normal processing for env since we handled it specially
    const { env, ...otherOverrides } = overrides;
    applyOverrides(target, otherOverrides);
    return;
  }

  // Normal override processing for other properties
  Object.entries(overrides).forEach(([key, value]) => {
    // If the value is an object and the target has the same key with an object value,
    // recursively apply overrides
    if (
      key !== "env" && // Skip env, we handled it above
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] !== null &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      applyOverrides(target[key], value);
    } else {
      // Otherwise, directly override the value
      target[key] = value;
    }
  });
};

/**
 * Finds a profile by ID or name in the profiles array
 * @param {Array} profiles - Array of profile objects
 * @param {string} identifier - Profile ID or name
 * @returns {Object|null} The profile object or null if not found
 */
export const findProfileByIdOrName = (profiles, identifier) => {
  if (!profiles || !identifier) {
    return null;
  }

  // Check if identifier looks like a UUID first
  if (uuidValidate(identifier)) {
    const found = profiles.find((p) => p.id === identifier);
    if (found) {
      return found;
    }
  }

  // Try to find by name
  return profiles.find((p) => p.name === identifier) || null;
};

/**
 * Gets a server's display name considering originalId
 * @param {Object} serverConfig - Server configuration object
 * @returns {string} Display name for the server
 */
export const getServerDisplayName = (serverConfig) => {
  if (!serverConfig) return "Unknown Server";

  if (serverConfig.name) return serverConfig.name;
  if (serverConfig.originalId) return serverConfig.originalId;

  return "Unnamed Server";
};
