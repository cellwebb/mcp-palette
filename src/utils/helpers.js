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
  if (!profileServer) {
    const { id, ...rest } = masterServer;
    return { ...rest, enabled: false };
  }

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
