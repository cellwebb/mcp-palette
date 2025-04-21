/**
 * MCP Schema Definitions
 * Based on Model Context Protocol specification
 */

// Base MCP configuration schema
export const mcpConfigSchema = {
  type: "object",
  required: ["mcpServers"],
  properties: {
    mcpServers: {
      type: "object",
      additionalProperties: {
        $ref: "#/definitions/serverConfig",
      },
    },
  },
  definitions: {
    serverConfig: {
      type: "object",
      required: ["command", "args"],
      properties: {
        command: { type: "string" },
        args: {
          type: "array",
          items: { type: "string" },
        },
        env: {
          type: "object",
          additionalProperties: { type: "string" },
        },
        resources: {
          type: "array",
          items: { $ref: "#/definitions/resource" },
        },
      },
    },
    resource: {
      type: "object",
      required: ["name", "description", "parameters"],
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        parameters: { type: "object" },
      },
    },
  },
};

// Transport-specific schemas
export const transportSchemas = {
  http: {
    type: "object",
    properties: {
      port: { type: "number" },
      host: { type: "string", default: "localhost" },
      ssl: { type: "boolean", default: false },
    },
  },
  websocket: {
    type: "object",
    properties: {
      port: { type: "number" },
      host: { type: "string", default: "localhost" },
      path: { type: "string", default: "/mcp" },
      ssl: { type: "boolean", default: false },
    },
  },
  stdio: {
    type: "object",
    properties: {
      bufferSize: { type: "number", default: 4096 },
    },
  },
};

// Common patterns for validation
export const validationPatterns = {
  // Environment variable name pattern
  envVarName: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  // Command pattern (no shell metacharacters)
  safeCommand: /^[^;&|<>$\\]*$/,
  // Resource name pattern (camelCase)
  resourceName: /^[a-z][a-zA-Z0-9]*$/,
};
