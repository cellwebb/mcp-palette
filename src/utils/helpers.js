// Helper function to deep merge objects
export function deepMerge(target, source) {
  const result = { ...target };

  if (typeof target !== "object" || typeof source !== "object") {
    return source;
  }

  Object.keys(source).forEach((key) => {
    if (source[key] instanceof Object && key in target) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  });

  return result;
}

// Helper function to detect overrides
export function hasOverrides(overrides) {
  if (!overrides) return false;

  if (overrides.name || overrides.command) return true;
  if (overrides.args && overrides.args.length > 0) return true;
  if (overrides.env && Object.keys(overrides.env).length > 0) return true;

  return false;
}

// Helper function to filter out internal implementation details from MCP configurations
export function filterInternalFields(serverConfig) {
  if (!serverConfig) return null;

  const result = { ...serverConfig };

  // Remove internal fields that are not part of MCP specifications
  delete result.id;

  return result;
}

// Helper function to get effective server configuration
export function getEffectiveConfig(masterServer, profileServer) {
  if (!masterServer) return null;
  if (!profileServer) return { ...masterServer, enabled: false };

  const { enabled, overrides } = profileServer;

  const result = { ...masterServer };

  if (overrides) {
    if (overrides.name) result.name = overrides.name;
    if (overrides.command) result.command = overrides.command;
    if (overrides.args) result.args = [...overrides.args];
    if (overrides.env) result.env = { ...result.env, ...overrides.env };
  }

  result.enabled = !!enabled;

  // Remove internal implementation details that are not part of MCP specifications
  delete result.id;

  return result;
}

/**
 * Generates a UUID v4 string
 * This is a lightweight implementation that doesn't require additional dependencies
 * @returns {string} A UUID v4 formatted string
 */
export function generateUUID() {
  // Implementation based on RFC4122 version 4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Checks if a string is a valid UUID v4
 * @param {string} uuid - The string to validate as a UUID
 * @returns {boolean} True if the string is a valid UUID v4
 */
export function isValidUUID(uuid) {
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}
