/**
 * Utility functions for managing profiles and server configurations
 */

/**
 * Generates a final JSON configuration object for a profile.
 * This JSON represents the actual configuration that would be used:
 * - Only includes enabled servers
 * - Inherits values from master servers
 * - Applies overrides from profile configuration
 *
 * @param {Object} profile - The profile object with server configurations
 * @param {Object} masterServers - Master server configurations
 * @returns {Object} - Final configuration object
 */
export const generateFinalProfileConfig = (profile, masterServers) => {
  if (!profile || !profile.servers || !masterServers) {
    return { name: profile?.name || "Unknown Profile" };
  }

  // Create a clean output object
  const finalConfig = {
    name: profile.name,
    servers: {},
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

    // Add to final configuration
    finalConfig.servers[serverId] = serverConfig;
  });

  return finalConfig;
};

/**
 * Converts a final (user-facing) profile configuration back to the internal format
 * by calculating the overrides needed to achieve the same configuration
 *
 * @param {Object} finalConfig - The final profile configuration
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
    name: finalConfig.name,
    servers: { ...currentProfile.servers }, // Start with current servers
  };

  // Add or update servers from the final config
  if (finalConfig.servers) {
    Object.entries(finalConfig.servers).forEach(([serverId, serverConfig]) => {
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
  }

  // Mark any servers not in final config as disabled (but don't remove them)
  if (currentProfile.servers) {
    Object.keys(currentProfile.servers).forEach((serverId) => {
      if (!finalConfig.servers || !finalConfig.servers[serverId]) {
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
const calculateOverrides = (masterConfig, targetConfig) => {
  const overrides = {};

  // Compare each property in targetConfig with masterConfig
  Object.entries(targetConfig).forEach(([key, value]) => {
    // Skip comparing if the key doesn't exist in master config
    if (!(key in masterConfig)) {
      overrides[key] = value;
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
const applyOverrides = (target, overrides) => {
  if (!overrides || typeof overrides !== "object") return;

  Object.entries(overrides).forEach(([key, value]) => {
    // If the value is an object and the target has the same key with an object value,
    // recursively apply overrides
    if (
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
