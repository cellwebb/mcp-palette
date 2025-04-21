/**
 * MCP Schema Validator
 * Validates JSON configurations against the Model Context Protocol specification
 */

/**
 * Validates a complete MCP configuration object
 * @param {Object} config - The MCP configuration to validate
 * @returns {Object} Validation result: { valid: boolean, errors: Array }
 */
export const validateMcpConfig = (config) => {
  const errors = [];

  // Check if config is an object
  if (!config || typeof config !== "object") {
    return {
      valid: false,
      errors: ["Invalid configuration: Must be a JSON object"],
    };
  }

  // Check for mcpServers property (required for profiles)
  if (config.mcpServers !== undefined) {
    if (typeof config.mcpServers !== "object") {
      errors.push("mcpServers property must be an object");
    } else {
      // Validate each server in mcpServers
      Object.entries(config.mcpServers).forEach(
        ([serverName, serverConfig]) => {
          const serverErrors = validateMcpServerConfig(
            serverConfig,
            serverName,
          );
          errors.push(...serverErrors);
        },
      );
    }
  }
  // For server master list, validate each individual server
  else {
    Object.entries(config).forEach(([serverId, serverConfig]) => {
      const serverErrors = validateMcpServerConfig(
        serverConfig,
        serverConfig.name || serverId,
      );
      errors.push(...serverErrors);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validates a single MCP server configuration
 * @param {Object} serverConfig - The server configuration to validate
 * @param {string} serverName - The name of the server (for error messages)
 * @returns {Array} List of validation errors
 */
export const validateMcpServerConfig = (serverConfig, serverName) => {
  const errors = [];

  // Server must be an object
  if (!serverConfig || typeof serverConfig !== "object") {
    return [`Server '${serverName}': Configuration must be an object`];
  }

  // Required properties
  if (!serverConfig.command) {
    errors.push(`Server '${serverName}': Missing required 'command' property`);
  } else if (typeof serverConfig.command !== "string") {
    errors.push(`Server '${serverName}': 'command' must be a string`);
  }

  // args property (required)
  if (!Array.isArray(serverConfig.args)) {
    errors.push(`Server '${serverName}': 'args' must be an array`);
  } else {
    // Validate each arg is a string
    serverConfig.args.forEach((arg, index) => {
      if (typeof arg !== "string") {
        errors.push(`Server '${serverName}': args[${index}] must be a string`);
      }
    });
  }

  // env property (optional)
  if (serverConfig.env !== undefined) {
    if (
      typeof serverConfig.env !== "object" ||
      Array.isArray(serverConfig.env)
    ) {
      errors.push(`Server '${serverName}': 'env' must be an object`);
    } else {
      // Validate each env var is a string
      Object.entries(serverConfig.env).forEach(([key, value]) => {
        if (typeof value !== "string") {
          errors.push(`Server '${serverName}': env.${key} must be a string`);
        }
      });
    }
  }

  // originalId property (optional for internal use)
  if (
    serverConfig.originalId !== undefined &&
    typeof serverConfig.originalId !== "string"
  ) {
    errors.push(`Server '${serverName}': 'originalId' must be a string`);
  }

  // name property (optional for internal use)
  if (
    serverConfig.name !== undefined &&
    typeof serverConfig.name !== "string"
  ) {
    errors.push(`Server '${serverName}': 'name' must be a string`);
  }

  return errors;
};

/**
 * Formats server configuration in MCP standard format
 * @param {Object} serverConfig - The server configuration object
 * @returns {Object} Properly formatted single server object
 */
export const formatSingleServerConfig = (serverConfig) => {
  // Create expected MCP server object format
  return {
    command: serverConfig.command || "",
    args: Array.isArray(serverConfig.args) ? [...serverConfig.args] : [],
    ...(serverConfig.env && Object.keys(serverConfig.env).length > 0
      ? { env: { ...serverConfig.env } }
      : {}),
  };
};

/**
 * Formats a server list into MCP server object
 * @param {Object} serverList - The server list from master list
 * @returns {Object} Properly formatted mcpServers object
 */
export const formatServerListToMcpJson = (serverList) => {
  if (!serverList || typeof serverList !== "object") {
    return { mcpServers: {} };
  }

  const mcpServers = {};

  Object.entries(serverList).forEach(([serverId, server]) => {
    // Use name as key, fallback to originalId or serverId
    const serverName = server.name || server.originalId || serverId;

    // Format in MCP standard format
    mcpServers[serverName] = formatSingleServerConfig(server);
  });

  return { mcpServers };
};
