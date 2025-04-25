/**
 * MCP Schema Validator
 * Validates JSON configurations against the Model Context Protocol specification
 */

import {
  mcpConfigSchema,
  transportSchemas,
  validationPatterns,
} from "./mcpSchema";

/**
 * Validates a complete MCP configuration object
 * @param {Object} config - The MCP configuration to validate
 * @returns {Object} Validation result: { valid: boolean, errors: Array, warnings: Array }
 */
export const validateMcpConfig = (config) => {
  const result = {
    valid: false, // Start assuming invalid
    errors: [],
    warnings: [],
  };
  let serverCount = 0;

  // Check if config is an object
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    result.errors.push({
      path: "",
      message: "Invalid configuration: Must be a non-array JSON object",
    });
    // No need to set valid = false, it defaults to false
    return result;
  }

  const processServer = (serverConfig, serverKey, pathPrefix) => {
    const serverValidation = validateMcpServerConfig(serverConfig, serverKey);
    serverCount++;

    serverValidation.errors.forEach((error) => {
      result.errors.push({
        path: `${pathPrefix}${serverKey}${error.path ? "." + error.path : ""}`,
        message: error.message,
        suggestion: error.suggestion,
      });
    });

    serverValidation.warnings.forEach((warning) => {
      result.warnings.push({
        path: `${pathPrefix}${serverKey}${warning.path ? "." + warning.path : ""}`,
        message: warning.message,
        suggestion: warning.suggestion,
      });
    });
  };

  // Preferred format: mcpServers property
  if ("mcpServers" in config) {
    if (
      config.mcpServers === null ||
      typeof config.mcpServers !== "object" ||
      Array.isArray(config.mcpServers)
    ) {
      result.errors.push({
        path: "mcpServers",
        message: "mcpServers property must be a non-null object",
        suggestion: { action: "replace", value: {}, description: "Replace with an empty object" },
      });
    } else {
      // Validate each server in mcpServers
      Object.entries(config.mcpServers).forEach(([serverName, serverConfig]) => {
        processServer(serverConfig, serverName, "mcpServers.");
      });
    }
  }
  // Legacy format: servers property
  else if ("servers" in config) {
    result.warnings.push({
      path: "",
      message: "Configuration uses deprecated 'servers' key. Use 'mcpServers' instead.",
    });

    if (
      config.servers === null ||
      typeof config.servers !== "object" ||
      Array.isArray(config.servers)
    ) {
      result.errors.push({
        path: "servers",
        message: "servers property must be a non-null object",
        suggestion: { action: "replace", value: {}, description: "Replace with an empty object" },
      });
    } else {
      // Validate each server in servers
      Object.entries(config.servers).forEach(([serverName, serverConfig]) => {
        processServer(serverConfig, serverName, "servers.");
      });
    }
  }
  // Neither mcpServers nor servers found
  else {
    // Check if it MIGHT be the very old format (top-level keys are servers)
    // Only treat as legacy if it's not completely empty
    const keys = Object.keys(config);
    if (keys.length > 0) {
       result.warnings.push({
        path: "",
        message: "Configuration uses deprecated top-level server definitions. Use 'mcpServers' object instead.",
      });
      keys.forEach((serverId) => {
        processServer(config[serverId], serverId, ""); // No prefix for oldest format
      });
    } else {
      // Config is just an empty object {}
       result.errors.push({
          path: "mcpServers", // Expect mcpServers primarily
          message: "Configuration is empty. Must contain server definitions under 'mcpServers' key.",
        });
    }

  }

  // Final check: Ensure at least one server was defined if no other errors occurred yet
  if (result.errors.length === 0 && serverCount === 0) {
     result.errors.push({
        path: "mcpServers", // Default path for this error
        message: "Configuration must contain at least one server definition.",
      });
  }

  // Set final valid flag based ONLY on errors count
  result.valid = result.errors.length === 0;

  return result;
};

/**
 * Validates a single MCP server configuration
 * @param {Object} serverConfig - The server configuration to validate
 * @param {string} serverName - The name of the server (for error messages)
 * @returns {Object} { errors: Array, warnings: Array }
 */
export const validateMcpServerConfig = (serverConfig, serverName) => {
  const result = {
    errors: [],
    warnings: [],
  };

  // Server must be an object
  if (!serverConfig || typeof serverConfig !== "object") {
    result.errors.push({
      path: "",
      message: `Server '${serverName}': Configuration must be an object`,
    });
    return result;
  }

  // Validate command property (required)
  if (!serverConfig.command) {
    result.errors.push({
      path: "command",
      message: `Missing required 'command' property`,
      suggestion: {
        action: "add",
        value: "python -m my_mcp_server",
        description: "Add a command to run the server",
      },
    });
  } else if (typeof serverConfig.command !== "string") {
    result.errors.push({
      path: "command",
      message: `'command' must be a string`,
      suggestion: {
        action: "convert",
        description: "Convert command to string",
      },
    });
  } else if (!validationPatterns.safeCommand.test(serverConfig.command)) {
    result.warnings.push({
      path: "command",
      message: `Command contains potentially unsafe characters`,
      suggestion: {
        action: "review",
        description: "Review for shell metacharacters (;&|<>$\\)",
      },
    });
  }

  // Validate args property (required)
  if (!Array.isArray(serverConfig.args)) {
    result.errors.push({
      path: "args",
      message: `'args' must be an array`,
      suggestion: {
        action: "replace",
        value: [],
        description: "Replace with an empty array",
      },
    });
  } else {
    // Validate each arg is a string
    serverConfig.args.forEach((arg, index) => {
      if (typeof arg !== "string") {
        result.errors.push({
          path: `args[${index}]`,
          message: `args[${index}] must be a string`,
          suggestion: {
            action: "convert",
            description: "Convert argument to string",
          },
        });
      }
    });
  }

  // Validate env property (optional)
  if (serverConfig.env !== undefined) {
    if (
      typeof serverConfig.env !== "object" ||
      Array.isArray(serverConfig.env)
    ) {
      result.errors.push({
        path: "env",
        message: `'env' must be an object`,
        suggestion: {
          action: "replace",
          value: {},
          description: "Replace with an empty object",
        },
      });
    } else {
      // Validate each env var is a string and follows naming patterns
      Object.entries(serverConfig.env).forEach(([key, value]) => {
        if (typeof value !== "string") {
          result.errors.push({
            path: `env.${key}`,
            message: `env.${key} must be a string`,
            suggestion: {
              action: "convert",
              description: "Convert value to string",
            },
          });
        }

        // Check environment variable name pattern
        if (!validationPatterns.envVarName.test(key)) {
          result.warnings.push({
            path: `env.${key}`,
            message: `Environment variable name '${key}' does not follow standard pattern`,
            suggestion: {
              action: "rename",
              description:
                "Rename to follow pattern: letters, numbers, underscores (starting with letter/underscore)",
            },
          });
        }
      });
    }
  }

  // Validate resources property (optional)
  if (serverConfig.resources !== undefined) {
    validateResourceDefinitions(serverConfig.resources, result);
  }

  // Validate transport property (optional)
  if (serverConfig.transport !== undefined) {
    validateTransportConfig(serverConfig.transport, result);
  }

  // Validate internal properties (not in MCP spec but used by the application)
  validateInternalProperties(serverConfig, result);

  return result;
};

/**
 * Validates resource definitions
 * @param {Array} resources - Array of resource definition objects
 * @param {Object} result - Validation result to append to
 */
export const validateResourceDefinitions = (resources, result) => {
  if (!Array.isArray(resources)) {
    result.errors.push({
      path: "resources",
      message: "Resources must be an array",
      suggestion: {
        action: "replace",
        value: [],
        description: "Replace with an empty array",
      },
    });
    return;
  }

  resources.forEach((resource, index) => {
    const basePath = `resources[${index}]`;

    // Check for required properties
    if (!resource.name) {
      result.errors.push({
        path: `${basePath}.name`,
        message: "Missing required resource name",
        suggestion: {
          action: "add",
          description: "Add a name property",
        },
      });
    } else if (typeof resource.name !== "string") {
      result.errors.push({
        path: `${basePath}.name`,
        message: "Resource name must be a string",
        suggestion: {
          action: "convert",
          description: "Convert to string",
        },
      });
    } else if (!validationPatterns.resourceName.test(resource.name)) {
      result.warnings.push({
        path: `${basePath}.name`,
        message: `Resource name '${resource.name}' should follow camelCase pattern`,
        suggestion: {
          action: "rename",
          description: "Rename to follow camelCase pattern",
        },
      });
    }

    if (!resource.description) {
      result.errors.push({
        path: `${basePath}.description`,
        message: "Missing required resource description",
        suggestion: {
          action: "add",
          description: "Add a description property",
        },
      });
    } else if (typeof resource.description !== "string") {
      result.errors.push({
        path: `${basePath}.description`,
        message: "Resource description must be a string",
        suggestion: {
          action: "convert",
          description: "Convert to string",
        },
      });
    }

    if (!resource.parameters) {
      result.errors.push({
        path: `${basePath}.parameters`,
        message: "Missing required parameters definition",
        suggestion: {
          action: "add",
          value: { type: "object", properties: {} },
          description: "Add a parameters object",
        },
      });
    } else if (typeof resource.parameters !== "object") {
      result.errors.push({
        path: `${basePath}.parameters`,
        message: "Parameters must be an object",
        suggestion: {
          action: "replace",
          value: { type: "object", properties: {} },
          description: "Replace with a valid parameters object",
        },
      });
    }
  });
};

/**
 * Validates transport configuration
 * @param {Object} transport - Transport configuration
 * @param {Object} result - Validation result to append to
 */
export const validateTransportConfig = (transport, result) => {
  if (!transport || typeof transport !== "object" || Array.isArray(transport)) {
    result.errors.push({
      path: "transport",
      message: "Transport must be an object",
      suggestion: {
        action: "replace",
        value: { type: "http" },
        description: "Replace with a basic HTTP transport configuration",
      },
    });
    return;
  }

  // Check for required transport type
  if (!transport.type) {
    result.errors.push({
      path: "transport.type",
      message: "Missing required transport type",
      suggestion: {
        action: "add",
        value: "http",
        description: "Add a transport type",
      },
    });
    return;
  }

  // Validate based on transport type
  const supportedTypes = Object.keys(transportSchemas);
  if (!supportedTypes.includes(transport.type)) {
    result.errors.push({
      path: "transport.type",
      message: `Unsupported transport type: ${transport.type}`,
      suggestion: {
        action: "replace",
        value: "http",
        description: `Supported types: ${supportedTypes.join(", ")}`,
      },
    });
    return;
  }

  // Get the schema for this transport type
  const schema = transportSchemas[transport.type];

  // Validate properties against schema
  Object.entries(transport).forEach(([key, value]) => {
    if (key === "type") return; // Already validated

    const propertySchema = schema.properties[key];

    // Check if property is defined in schema
    if (!propertySchema) {
      result.warnings.push({
        path: `transport.${key}`,
        message: `Unknown property for ${transport.type} transport: ${key}`,
        suggestion: {
          action: "remove",
          description: `This property is not defined in the ${transport.type} transport schema`,
        },
      });
      return;
    }

    // Validate property type
    const expectedType = propertySchema.type;
    const actualType = Array.isArray(value) ? "array" : typeof value;

    if (actualType !== expectedType) {
      result.errors.push({
        path: `transport.${key}`,
        message: `Property ${key} must be type: ${expectedType}, found: ${actualType}`,
        suggestion: {
          action: "replace",
          value: propertySchema.default,
          description: `Replace with a value of type: ${expectedType}`,
        },
      });
    }
  });
};

/**
 * Validates internal properties used by the application
 * @param {Object} serverConfig - Server configuration
 * @param {Object} result - Validation result to append to
 */
export const validateInternalProperties = (serverConfig, result) => {
  // originalId property (optional for internal use)
  if (
    serverConfig.originalId !== undefined &&
    typeof serverConfig.originalId !== "string"
  ) {
    result.errors.push({
      path: "originalId",
      message: "originalId must be a string",
      suggestion: {
        action: "convert",
        description: "Convert to string",
      },
    });
  }

  // name property (optional for internal use)
  if (
    serverConfig.name !== undefined &&
    typeof serverConfig.name !== "string"
  ) {
    result.errors.push({
      path: "name",
      message: "name must be a string",
      suggestion: {
        action: "convert",
        description: "Convert to string",
      },
    });
  }

  // enabled property (optional for profile servers)
  if (
    serverConfig.enabled !== undefined &&
    typeof serverConfig.enabled !== "boolean"
  ) {
    result.errors.push({
      path: "enabled",
      message: "enabled must be a boolean",
      suggestion: {
        action: "convert",
        value: Boolean(serverConfig.enabled),
        description: "Convert to boolean",
      },
    });
  }

  // overrides property (optional for profile servers)
  if (
    serverConfig.overrides !== undefined &&
    (typeof serverConfig.overrides !== "object" ||
      Array.isArray(serverConfig.overrides))
  ) {
    result.errors.push({
      path: "overrides",
      message: "overrides must be an object",
      suggestion: {
        action: "replace",
        value: {},
        description: "Replace with an empty object",
      },
    });
  }
};

/**
 * Formats a single server configuration to MCP standard
 * @param {Object} serverConfig - Server configuration object
 * @returns {Object} MCP-compliant server configuration
 */
export const formatSingleServerConfig = (serverConfig) => {
  if (!serverConfig) return null;

  // Create base configuration with required properties
  const formatted = {
    command: serverConfig.command || "",
    args: Array.isArray(serverConfig.args) ? [...serverConfig.args] : [],
  };

  // Add optional properties if they exist
  if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
    formatted.env = { ...serverConfig.env };
  }

  if (
    serverConfig.resources &&
    Array.isArray(serverConfig.resources) &&
    serverConfig.resources.length > 0
  ) {
    formatted.resources = [...serverConfig.resources];
  }

  if (serverConfig.transport && typeof serverConfig.transport === "object") {
    formatted.transport = { ...serverConfig.transport };
  }

  return formatted;
};

/**
 * Formats server list into MCP-compliant JSON
 * @param {Object} serverList - Server list object
 * @returns {Object} MCP-compliant configuration
 */
export const formatServerListToMcpJson = (serverList) => {
  if (!serverList || typeof serverList !== "object") {
    return { mcpServers: {} };
  }

  const mcpServers = {};

  Object.entries(serverList).forEach(([serverId, server]) => {
    // Skip null or undefined server entries
    if (!server) {
      return; // Continue to next iteration
    }

    // Use name as key, fallback to originalId or serverId
    const serverName = server.name || server.originalId || serverId;

    // Format in MCP standard format
    mcpServers[serverName] = formatSingleServerConfig(server);
  });

  return { mcpServers };
};

/**
 * Applies auto-correction to fix common validation issues
 * @param {Object} config - Original configuration
 * @param {Array} issues - Validation errors/warnings with suggestions
 * @returns {Object} Corrected configuration
 */
export const applyAutoCorrections = (config, issues) => {
  // Create a deep copy of the configuration
  const corrected = JSON.parse(JSON.stringify(config));

  // Helper functions defined within the scope of applyAutoCorrections
  function parsePath(path) {
    return path.split(/\.|(?=\[\d+\])/).map(part =>
      part.startsWith('[') ? parseInt(part.slice(1, -1), 10) : part
    );
  }

  function setByPath(obj, path, value) {
    const parts = parsePath(path);
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      // Create object/array path if it doesn't exist
      if (curr[part] === undefined || curr[part] === null) {
        curr[part] = typeof nextPart === 'number' ? [] : {};
      }
      curr = curr[part];
    }
    curr[parts[parts.length - 1]] = value;
  }

  function getByPath(obj, path) {
    const parts = parsePath(path);
    let curr = obj;
    for (let i = 0; i < parts.length; i++) {
      if (curr === undefined || curr === null) return undefined; // Path doesn't exist
      curr = curr[parts[i]];
    }
    return curr;
  }

  function removeByPath(obj, path) {
    const parts = parsePath(path);
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (curr === undefined || curr === null) return; // Path doesn't exist
      curr = curr[parts[i]];
    }
    if (curr !== undefined && curr !== null) {
      const lastPart = parts[parts.length - 1];
      if (Array.isArray(curr) && typeof lastPart === 'number') {
        curr.splice(lastPart, 1);
      } else {
        delete curr[lastPart];
      }
    }
  }

  // Apply corrections for each issue that has a suggestion
  issues.forEach((issue) => {
    if (issue.suggestion && issue.suggestion.action) {
      try {
        let valueToSet;
        switch (issue.suggestion.action) {
          case "add":
          case "replace":
            valueToSet = issue.suggestion.value;
            setByPath(corrected, issue.path, valueToSet);
            break;
          case "remove":
            removeByPath(corrected, issue.path);
            break;
          case "convert": {
            const currentValue = getByPath(corrected, issue.path);
            const valueToConvert = typeof issue.suggestion.value !== 'undefined'
              ? issue.suggestion.value
              : currentValue;

            if (issue.suggestion.type === "string") {
              valueToSet = String(valueToConvert);
            } else if (issue.suggestion.type === "number") {
              valueToSet = Number(valueToConvert);
              if (isNaN(valueToSet)) {
                console.warn(`Could not convert '${valueToConvert}' to number at path ${issue.path}`);
                valueToSet = valueToConvert; // Keep original on failed conversion
              }
            } else if (issue.suggestion.type === "boolean") {
              if (typeof valueToConvert === 'string') {
                const lowerCaseValue = valueToConvert.toLowerCase();
                if (lowerCaseValue === 'true') valueToSet = true;
                else if (lowerCaseValue === 'false') valueToSet = false;
                else valueToSet = Boolean(valueToConvert);
              } else {
                 valueToSet = Boolean(valueToConvert);
              }
            } else {
              console.warn(`Unknown conversion type '${issue.suggestion.type}' at path ${issue.path}. Defaulting to string.`);
              valueToSet = String(valueToConvert);
            }
            setByPath(corrected, issue.path, valueToSet);
            break;
          }
          // Legacy action - keep for compatibility but warn
          case "ConvertToString": {
            console.warn(`Deprecated suggestion action 'ConvertToString' used for path ${issue.path}. Use 'convert' with type: 'string'.`);
            const currentValue = getByPath(corrected, issue.path);
            const strValue = typeof issue.suggestion.value !== "undefined"
              ? String(issue.suggestion.value)
              : String(currentValue);
            setByPath(corrected, issue.path, strValue);
            break;
          }
          default:
            console.warn(`Unknown suggestion action '${issue.suggestion.action}' for path ${issue.path}`);
        }
      } catch (error) {
        console.error(`Error applying correction for path ${issue.path}:`, error);
      }
    }
  });

  return corrected;
};

/**
 * Get a human-readable validation summary
 * @param {Object} validationResult - Validation result from validateMcpConfig
 * @returns {string} A summary of validation issues
 */
export const getValidationSummary = (validationResult) => {
  if (!validationResult) {
    return "Configuration not validated";
  }

  if (validationResult.valid && validationResult.warnings.length === 0) {
    return "Configuration is valid";
  }

  if (validationResult.valid && validationResult.warnings.length > 0) {
    return `Configuration is valid with ${validationResult.warnings.length} warning(s)`;
  }

  return `Configuration has ${validationResult.errors.length} error(s) and ${validationResult.warnings.length} warning(s)`;
};
