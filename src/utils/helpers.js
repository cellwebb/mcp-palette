// Helper function to deep merge objects
export function deepMerge(target, source) {
  // If source is not an object (or null), return source directly
  if (typeof source !== "object" || source === null) {
    return source;
  }

  // Start with a shallow copy of target, or an empty object if target isn't an object/null
  const result = (typeof target === 'object' && target !== null) ? { ...target } : {};

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = result[key]; // Check against the current result/target value

    // If both sourceValue and targetValue are non-null, non-array objects, recurse
    if (
      sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
      targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      // Otherwise, source value replaces target value (handles primitives, arrays, nulls, etc.)
      result[key] = sourceValue;
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
