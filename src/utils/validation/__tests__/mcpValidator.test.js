/**
 * Tests for MCP Validator
 *
 * These tests verify the validation logic for Model Context Protocol
 * server configurations.
 */

import {
  validateMcpConfig,
  validateMcpServerConfig,
  formatSingleServerConfig,
  formatServerListToMcpJson,
  applyAutoCorrections,
  getValidationSummary,
} from "../mcpValidator";

describe("MCP Validator", () => {
  describe("validateMcpServerConfig", () => {
    test("validates a valid server configuration", () => {
      const serverConfig = {
        name: "test-server",
        command: "python",
        args: ["-m", "mcp_server"],
        env: {
          PORT: "8000",
          NODE_ENV: "development",
        },
      };

      const result = validateMcpServerConfig(serverConfig, "test-server");
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test("validates a server with missing required properties", () => {
      const serverConfig = {
        name: "test-server",
        command: "python",
        // Missing args property
      };

      const result = validateMcpServerConfig(serverConfig, "test-server");
      expect(result.errors.length).toBeGreaterThan(0);
      // Check that we get an error about the missing args property
      expect(result.errors.some((e) => e.path === "args")).toBe(true);
    });

    test("validates a server with invalid property types", () => {
      const serverConfig = {
        name: "test-server",
        command: 123, // Should be a string
        args: "not-an-array", // Should be an array
      };

      const result = validateMcpServerConfig(serverConfig, "test-server");
      expect(result.errors.length).toBeGreaterThan(0);
      // Check for errors about invalid types
      expect(result.errors.some((e) => e.path === "command")).toBe(true);
      expect(result.errors.some((e) => e.path === "args")).toBe(true);
    });

    test("validates a server with invalid args items", () => {
      const serverConfig = {
        name: "test-server",
        command: "python",
        args: ["valid", 123, false], // All items should be strings
      };

      const result = validateMcpServerConfig(serverConfig, "test-server");
      expect(result.errors.length).toBeGreaterThan(0);
      // Check for errors about invalid arg types
      expect(result.errors.some((e) => e.path === "args[1]")).toBe(true);
      expect(result.errors.some((e) => e.path === "args[2]")).toBe(true);
    });

    test("validates a server with invalid env values", () => {
      const serverConfig = {
        name: "test-server",
        command: "python",
        args: ["-m", "server"],
        env: {
          PORT: 8000, // Should be a string
          DEBUG: true, // Should be a string
        },
      };

      const result = validateMcpServerConfig(serverConfig, "test-server");
      expect(result.errors.length).toBeGreaterThan(0);
      // Check for errors about invalid env value types
      expect(result.errors.some((e) => e.path === "env.PORT")).toBe(true);
      expect(result.errors.some((e) => e.path === "env.DEBUG")).toBe(true);
    });

    test("warns about potentially unsafe command characters", () => {
      const serverConfig = {
        name: "test-server",
        command: "python -m server; rm -rf /", // Contains shell metacharacters
        args: [],
      };

      const result = validateMcpServerConfig(serverConfig, "test-server");
      expect(result.warnings.length).toBeGreaterThan(0);
      // Check for warning about unsafe command
      expect(result.warnings.some((w) => w.path === "command")).toBe(true);
    });

    test("warns about non-standard env variable names", () => {
      const serverConfig = {
        name: "test-server",
        command: "python",
        args: ["-m", "server"],
        env: {
          "123_invalid": "value", // Should start with letter or underscore
          "-invalid-var": "value", // Should only contain letters, numbers, underscores
        },
      };

      const result = validateMcpServerConfig(serverConfig, "test-server");
      expect(result.warnings.length).toBeGreaterThan(0);
      // Check for warnings about env variable names
      expect(result.warnings.some((w) => w.path === "env.123_invalid")).toBe(
        true,
      );
      expect(result.warnings.some((w) => w.path === "env.-invalid-var")).toBe(
        true,
      );
    });
  });

  describe("validateMcpConfig", () => {
    test("validates a valid MCP configuration", () => {
      const config = {
        mcpServers: {
          server1: {
            command: "python",
            args: ["-m", "server1"],
          },
          server2: {
            command: "node",
            args: ["server2.js"],
          },
        },
      };

      const result = validateMcpConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("validates an invalid MCP configuration", () => {
      const config = {
        mcpServers: {
          server1: {
            command: "python",
            // Missing args property
          },
          server2: {
            // Missing command property
            args: ["server2.js"],
          },
        },
      };

      const result = validateMcpConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Check for errors about the missing properties
      expect(result.errors.some((e) => e.path.includes("server1.args"))).toBe(
        true,
      );
      expect(
        result.errors.some((e) => e.path.includes("server2.command")),
      ).toBe(true);
    });

    test("validates a server master list format", () => {
      const config = {
        "server1-id": {
          name: "server1",
          command: "python",
          args: ["-m", "server1"],
        },
        "server2-id": {
          name: "server2",
          command: "node",
          args: ["server2.js"],
        },
      };

      const result = validateMcpConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("handles null or non-object config", () => {
      const nullResult = validateMcpConfig(null);
      expect(nullResult.valid).toBe(false);
      expect(nullResult.errors.length).toBeGreaterThan(0);

      const stringResult = validateMcpConfig("not an object");
      expect(stringResult.valid).toBe(false);
      expect(stringResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe("formatSingleServerConfig", () => {
    test("formats a server config with all properties", () => {
      const serverConfig = {
        name: "test-server",
        command: "python",
        args: ["-m", "server"],
        env: {
          PORT: "8000",
          DEBUG: "true",
        },
        resources: [
          {
            name: "getDocument",
            description: "Retrieves a document",
            parameters: { type: "object" },
          },
        ],
        transport: {
          type: "http",
          port: 8000,
        },
        // Internal properties that should be excluded
        id: "123",
        originalId: "test-server",
      };

      const formatted = formatSingleServerConfig(serverConfig);

      // Required properties should be included
      expect(formatted.command).toBe("python");
      expect(formatted.args).toEqual(["-m", "server"]);

      // Optional properties should be included if present
      expect(formatted.env).toEqual({ PORT: "8000", DEBUG: "true" });
      expect(formatted.resources).toHaveLength(1);
      expect(formatted.transport).toBeDefined();

      // Internal properties should be excluded
      expect(formatted.id).toBeUndefined();
      expect(formatted.originalId).toBeUndefined();
      expect(formatted.name).toBeUndefined();
    });

    test("formats a minimal server config", () => {
      const serverConfig = {
        command: "python",
        args: ["-m", "server"],
      };

      const formatted = formatSingleServerConfig(serverConfig);

      // Required properties should be included
      expect(formatted.command).toBe("python");
      expect(formatted.args).toEqual(["-m", "server"]);

      // Optional properties should be excluded
      expect(formatted.env).toBeUndefined();
      expect(formatted.resources).toBeUndefined();
      expect(formatted.transport).toBeUndefined();
    });

    test("handles null or undefined config", () => {
      const nullResult = formatSingleServerConfig(null);
      expect(nullResult).toBeNull();

      const undefinedResult = formatSingleServerConfig(undefined);
      expect(undefinedResult).toBeNull();
    });
  });

  describe("formatServerListToMcpJson", () => {
    test("formats a server list to MCP JSON format", () => {
      const serverList = {
        "server1-id": {
          name: "server1",
          command: "python",
          args: ["-m", "server1"],
          env: { PORT: "8001" },
        },
        "server2-id": {
          name: "server2",
          command: "node",
          args: ["server2.js"],
          env: { PORT: "8002" },
        },
      };

      const formatted = formatServerListToMcpJson(serverList);

      // Should have mcpServers property
      expect(formatted.mcpServers).toBeDefined();

      // Should use names as keys
      expect(formatted.mcpServers.server1).toBeDefined();
      expect(formatted.mcpServers.server2).toBeDefined();

      // Should format each server correctly
      expect(formatted.mcpServers.server1.command).toBe("python");
      expect(formatted.mcpServers.server1.args).toEqual(["-m", "server1"]);
      expect(formatted.mcpServers.server1.env).toEqual({ PORT: "8001" });

      expect(formatted.mcpServers.server2.command).toBe("node");
      expect(formatted.mcpServers.server2.args).toEqual(["server2.js"]);
      expect(formatted.mcpServers.server2.env).toEqual({ PORT: "8002" });
    });

    test("handles empty server list", () => {
      const formatted = formatServerListToMcpJson({});
      expect(formatted.mcpServers).toEqual({});
    });

    test("handles null or undefined server list", () => {
      const nullResult = formatServerListToMcpJson(null);
      expect(nullResult.mcpServers).toEqual({});

      const undefinedResult = formatServerListToMcpJson(undefined);
      expect(undefinedResult.mcpServers).toEqual({});
    });

    test("uses fallback IDs if name is missing", () => {
      const serverList = {
        "server1-id": {
          // No name property
          command: "python",
          args: ["-m", "server1"],
        },
        "server2-id": {
          // No name property
          originalId: "original-server2",
          command: "node",
          args: ["server2.js"],
        },
      };

      const formatted = formatServerListToMcpJson(serverList);

      // Should use originalId or ID as fallback
      expect(formatted.mcpServers["server1-id"]).toBeDefined();
      expect(formatted.mcpServers["original-server2"]).toBeDefined();
    });
  });

  describe("applyAutoCorrections", () => {
    test("applies add/replace suggestions", () => {
      const config = {
        name: "test-server",
        command: "python",
        // Missing args property
        env: {
          PORT: 8000, // Should be a string
        },
      };

      const issues = [
        {
          path: "args",
          message: "Missing required args property",
          suggestion: {
            action: "add",
            value: ["-m", "server"],
          },
        },
        {
          path: "env.PORT",
          message: "env.PORT must be a string",
          suggestion: {
            action: "replace",
            value: "8000",
          },
        },
      ];

      const corrected = applyAutoCorrections(config, issues);

      // Should have added args property
      expect(corrected.args).toEqual(["-m", "server"]);

      // Should have replaced env.PORT with string value
      expect(corrected.env.PORT).toBe("8000");
    });

    test("applies remove suggestions", () => {
      const config = {
        name: "test-server",
        command: "python",
        args: ["-m", "server"],
        invalidProp: "should be removed",
      };

      const issues = [
        {
          path: "invalidProp",
          message: "Unknown property: invalidProp",
          suggestion: {
            action: "remove",
          },
        },
      ];

      const corrected = applyAutoCorrections(config, issues);

      // Should have removed the invalid property
      expect(corrected.invalidProp).toBeUndefined();
    });

    test("applies convert suggestions", () => {
      const config = {
        name: "test-server",
        command: "python",
        args: ["-m", "server", 123, true], // 123 and true should be converted to strings
      };

      const issues = [
        {
          path: "args[1]",
          message: "Args must be strings",
          suggestion: {
            action: "convert",
          },
        },
        {
          path: "args[2]",
          message: "Args must be strings",
          suggestion: {
            action: "convert",
          },
        },
      ];

      const corrected = applyAutoCorrections(config, issues);

      // Should have converted non-string args to strings
      expect(corrected.args[1]).toBe("123");
      expect(corrected.args[2]).toBe("true");
    });

    test("handles deep paths", () => {
      const config = {
        resources: [
          {
            name: "resource1",
            description: "A resource",
            parameters: {
              type: "string", // Should be 'object'
            },
          },
        ],
      };

      const issues = [
        {
          path: "resources[0].parameters.type",
          message: 'Parameters type must be "object"',
          suggestion: {
            action: "replace",
            value: "object",
          },
        },
      ];

      const corrected = applyAutoCorrections(config, issues);

      // Should have corrected the deep property
      expect(corrected.resources[0].parameters.type).toBe("object");
    });

    test("ignores issues without suggestions", () => {
      const config = {
        name: "test-server",
        command: "python",
        args: ["-m", "server"],
      };

      const issues = [
        {
          path: "name",
          message: "Invalid name format",
          // No suggestion
        },
      ];

      const corrected = applyAutoCorrections(config, issues);

      // Config should remain unchanged
      expect(corrected).toEqual(config);
    });
  });

  describe("getValidationSummary", () => {
    test("summarizes a valid configuration", () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
      };

      const summary = getValidationSummary(result);
      expect(summary).toBe("Configuration is valid");
    });

    test("summarizes a valid configuration with warnings", () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [
          { path: "command", message: "Unsafe command" },
          { path: "env.VAR", message: "Invalid variable name" },
        ],
      };

      const summary = getValidationSummary(result);
      expect(summary).toBe("Configuration is valid with 2 warning(s)");
    });

    test("summarizes an invalid configuration", () => {
      const result = {
        valid: false,
        errors: [
          { path: "command", message: "Missing command" },
          { path: "args", message: "Invalid args" },
        ],
        warnings: [{ path: "env.VAR", message: "Invalid variable name" }],
      };

      const summary = getValidationSummary(result);
      expect(summary).toBe("Configuration has 2 error(s) and 1 warning(s)");
    });

    test("handles null or undefined result", () => {
      const nullSummary = getValidationSummary(null);
      expect(nullSummary).toBe("Configuration not validated");

      const undefinedSummary = getValidationSummary(undefined);
      expect(undefinedSummary).toBe("Configuration not validated");
    });
  });
});
