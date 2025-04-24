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
    valid: false,
    errors: [],
    warnings: [],
  };

  // Check if config is an object
  if (!config || typeof config !== "object") {
    result.errors.push({
      path: "",
      message: "Invalid configuration: Must be a JSON object",
    });
    return result;
  }

  // For profiles format (mcpServers property)
  if ("mcpServers" in config) {
    if (
      typeof config.mcpServers !== "object" ||
      Array.isArray(config.mcpServers)
    ) {
      result.errors.push({
        path: "mcpServers",
        message: "mcpServers property must be an object",
        suggestion: {
          action: "replace",
          value: {},
          description: "Replace with an empty object",
        },
      });
    } else {
      // Validate each server in mcpServers
      Object.entries(config.mcpServers).forEach(
        ([serverName, serverConfig]) => {
          const serverValidation = validateMcpServerConfig(
            serverConfig,
            serverName,
          );

          // Add server errors with prefixed path
          serverValidation.errors.forEach((error) => {
            result.errors.push({
              path: `mcpServers.${serverName}${error.path ? "." + error.path : ""}`,
              message: error.message,
              suggestion: error.suggestion,
            });
          });

          // Add server warnings with prefixed path
          serverValidation.warnings.forEach((warning) => {
            result.warnings.push({
              path: `mcpServers.${serverName}${warning.path ? "." + warning.path : ""}`,
              message: warning.message,
              suggestion: warning.suggestion,
            });
          });
        },
      );
    }
  }
  // For server master list format
  else {
    Object.entries(config).forEach(([serverId, serverConfig]) => {
      const serverValidation = validateMcpServerConfig(
        serverConfig,
        serverConfig.name || serverId,
      );

      // Add server errors with prefixed path
      serverValidation.errors.forEach((error) => {
        result.errors.push({
          path: `${serverId}${error.path ? "." + error.path : ""}`,
          message: error.message,
          suggestion: error.suggestion,
        });
      });

      // Add server warnings with prefixed path
      serverValidation.warnings.forEach((warning) => {
        result.warnings.push({
          path: `${serverId}${warning.path ? "." + warning.path : ""}`,
          message: warning.message,
          suggestion: warning.suggestion,
        });
      });
    });
  }

  // Set valid flag based on errors count
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
const validateResourceDefinitions = (resources, result) => {
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
const validateTransportConfig = (transport, result) => {
  if (typeof transport !== "object" || Array.isArray(transport)) {
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
const validateInternalProperties = (serverConfig, result) => {
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

  // Apply corrections for each issue that has a suggestion
  issues.forEach((issue) => {
    if (!issue.suggestion) return;

    // Parse the path to navigate the object
    const pathParts = issue.path.split(".");

    // Navigate to the parent object
    let current = corrected;
    let parent = null;
    let lastKey = null;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      // Handle array path segments
      if (part.includes("[") && part.includes("]")) {
        const arrName = part.substring(0, part.indexOf("["));
        const index = parseInt(
          part.substring(part.indexOf("[") + 1, part.indexOf("]"))
        );
        if (!current[arrName] || !Array.isArray(current[arrName])) {
          current[arrName] = [];
        }
        // Ensure the array element exists as object
        if (!current[arrName][index] || typeof current[arrName][index] !== "object") {
          current[arrName][index] = {};
        }
        parent = current[arrName];
        current = current[arrName][index];
        lastKey = index;
      } else {
        // Handle object path segments
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {};
        }
        parent = current;
        current = current[part];
        lastKey = part;
      }
    }

    // Get the final property name
    const finalProp = pathParts[pathParts.length - 1];

    // Apply the correction based on the suggestion type
    switch (issue.suggestion.action) {
      case "add":
      case "replace":
        if (finalProp.includes("[") && finalProp.includes("]")) {
          const arrName = finalProp.substring(0, finalProp.indexOf("["));
          const index = parseInt(
            finalProp.substring(
              finalProp.indexOf("[") + 1,
              finalProp.indexOf("]"),
            ),
          );

          if (!current[arrName]) current[arrName] = [];
          if (typeof issue.suggestion.value !== "undefined") {
            current[arrName][index] = issue.suggestion.value;
          }
        } else {
          if (typeof issue.suggestion.value !== "undefined") {
            current[finalProp] = issue.suggestion.value;
          }
        }
        break;

      case "remove":
        if (finalProp.includes("[") && finalProp.includes("]")) {
          const arrName = finalProp.substring(0, finalProp.indexOf("["));
          const index = parseInt(
            finalProp.substring(
              finalProp.indexOf("[") + 1,
              finalProp.indexOf("]"),
            ),
          );

          if (current[arrName] && Array.isArray(current[arrName])) {
            current[arrName].splice(index, 1);
          }
        } else {
          delete current[finalProp];
        }
        break;

      case "convert":
        // More robust path walker for mixed object/array paths
        function parsePath(path) {
          // Splits 'args[1].foo[2].bar' -> ['args', 1, 'foo', 2, 'bar']
          const parts = [];
          path.split('.').forEach(seg => {
            const match = seg.match(/([a-zA-Z0-9_$]+)(\[(\d+)\])?/);
            if (match) {
              parts.push(match[1]);
              if (match[3] !== undefined) parts.push(Number(match[3]));
            }
          });
          return parts;
        }
        function setByPath(obj, path, val) {
          const parts = parsePath(path);
          let curr = obj;
          for (let i = 0; i < parts.length - 1; i++) {
            curr = curr[parts[i]];
          }
          curr[parts[parts.length - 1]] = val;
        }
        function getByPath(obj, path) {
          const parts = parsePath(path);
          let curr = obj;
          for (let i = 0; i < parts.length; i++) {
            curr = curr[parts[i]];
          }
          return curr;
        }
        const valueToSet = typeof issue.suggestion.value !== "undefined"
          ? String(issue.suggestion.value)
          : String(getByPath(corrected, issue.path));
        setByPath(corrected, issue.path, valueToSet);
        break;
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
