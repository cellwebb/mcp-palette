/**
 * Tests for MCP Validator (table-driven)
 */

import {
  validateMcpConfig,
  validateMcpServerConfig,
  formatSingleServerConfig,
  formatServerListToMcpJson,
  applyAutoCorrections,
  getValidationSummary,
} from "../mcpValidator";

describe("validateMcpServerConfig", () => {
  const base = { name: "srv", command: "run", args: ["a"], env: { VAR: "1" } };
  test("valid config", () => {
    const { errors, warnings } = validateMcpServerConfig(base, "srv");
    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
  test.each([
    [{ ...base, command: null }, ["command"], []],
    [{ ...base, args: null }, ["args"], []],
    [{ ...base, args: ["a", 2] }, ["args[1]"], []],
    [{ ...base, command: "bad;cmd" }, [], ["command"]],
    [{ ...base, env: { "123": "v" } }, [], ["env.123"]],
  ])(
    "errors %p",
    (cfg, errPaths, warnPaths) => {
      const res = validateMcpServerConfig(cfg, "srv");
      errPaths.forEach(p => expect(res.errors.some(e => e.path === p)).toBe(true));
      warnPaths.forEach(p => expect(res.warnings.some(w => w.path === p)).toBe(true));
    }
  );
});

describe("validateMcpConfig", () => {
  test.each([
    [null, false, [""]],
    ["x", false, [""]],
    [{ mcpServers: [] }, false, ["mcpServers"]],
    [{ s: { command: "c", args: ["a"] } }, true, []],
    [{ mcpServers: { s: { command: "c", args: ["a"] } }}, true, []],
    [{ s: { args: ["a"] } }, false, ["s.command"]],
    [{ s: { command: "c" } }, false, ["s.args"]],
    [{}, false, ["mcpServers"], []],
  ])(
    "%p",
    (cfg, valid, paths) => {
      const res = validateMcpConfig(cfg);
      expect(res.valid).toBe(valid);
      paths.forEach(p => expect(res.errors.some(e => e.path.includes(p))).toBe(true));
    }
  );
});

describe("formatSingleServerConfig", () => {
  const full = {
    command: "c", args: ["a"], env: { V: "1" },
    resources: [{ name: "n", description: "d", parameters: {} }],
    transport: { type: "http", port: 1 },
    id: "x", name: "n", originalId: "o"
  };
  test.each([
    [full, true],
    [{ command: "c", args: ["a"] }, true],
    [null, false],
    [undefined, false],
  ])(
    "%p => %s",
    (cfg, ok) => {
      const res = formatSingleServerConfig(cfg);
      if (!ok) expect(res).toBeNull();
      else {
        expect(res.command).toBe(cfg.command);
        expect(res.args).toEqual(cfg.args);
        expect(res.env).toEqual(cfg.env);
        expect(res.resources).toEqual(cfg.resources);
        expect(res.transport).toEqual(cfg.transport);
        expect(res.id).toBeUndefined();
        expect(res.name).toBeUndefined();
        expect(res.originalId).toBeUndefined();
      }
    }
  );
});

describe("formatServerListToMcpJson", () => {
  const list = {
    a: { name: "n1", command: "c", args: ["a"] },
    b: { originalId: "o2", command: "c2", args: ["b"] },
  };
  test.each([
    [list, ["n1", "o2"]],
    [{}, []],
    [null, []],
    [undefined, []],
  ])(
    "%p => %p",
    (l, keys) => {
      const res = formatServerListToMcpJson(l);
      expect(Object.keys(res.mcpServers)).toEqual(keys);
    }
  );
});

describe("applyAutoCorrections", () => {
  test.each([
    [{ arr: ["a", "b", "c"] },
      [{ path: "arr[1]", suggestion: { action: "remove" } }],
      { arr: ["a", "c"] }
    ],
    [{ foo: [{ bar: 1 }, { bar: 2 }, { bar: 3 }] },
      [{ path: "foo[2]", suggestion: { action: "remove" } }],
      { foo: [{ bar:1 }, { bar:2 }] }
    ],
    [{ args: ["1", 2] },
      [{ path: "args[1]", suggestion: { action: "convert", type: "string" } }],
      { args: ["1", "2"] }
    ],
  ])(
    "%p + %p => %p",
    (cfg, issues, expected) => {
      const res = applyAutoCorrections(cfg, issues);
      expect(res).toEqual(expected);
    }
  );
});

describe("getValidationSummary", () => {
  test.each([
    [{ valid: true, errors: [], warnings: [] }, "Configuration is valid"],
    [{ valid: true, errors: [], warnings: [{}] }, "Configuration is valid with 1 warning(s)"],
    [{ valid: false, errors: [{},{}], warnings: [{}] }, "Configuration has 2 error(s) and 1 warning(s)"],
    [null, "Configuration not validated"],
    [undefined, "Configuration not validated"],
  ])(
    "%p => %p",
    (input, out) => {
      expect(getValidationSummary(input)).toBe(out);
    }
  );
});

// --- New Comprehensive BDD Tests ---

describe("MCP Configuration Validation (validateMcpConfig)", () => {
  const validServer = { command: "run", args: ["--start"] };
  const serverMissingArgs = { command: "run" };
  const serverMissingCommand = { args: ["--start"] };

  test.each`
    configInput                                    | expectedValid | expectedErrorPaths                      | expectedWarningPaths | description
    ${null}                                        | ${false}      | ${[""]}                                 | ${[]}                | ${'should invalidate null config'}
    ${undefined}                                  | ${false}      | ${[""]}                                 | ${[]}                | ${'should invalidate undefined config'}
    ${'not-an-object'}                            | ${false}      | ${[""]}                                 | ${[]}                | ${'should invalidate non-object config'}
    ${{}}                                          | ${false}      | ${["mcpServers"]}                       | ${[]}                | ${'should invalidate config without mcpServers or servers'}
    ${{ mcpServers: {} }}                           | ${false}      | ${["mcpServers"]}                       | ${[]}                | ${'should invalidate config with empty mcpServers object'}
    ${{ mcpServers: { server1: validServer } }}     | ${true}       | ${[]}                                   | ${[]}                | ${'should validate config with valid mcpServers'}
    ${{ servers: { server1: validServer } }}        | ${true}       | ${[]}                                   | ${[""]}                | ${'should validate legacy config with valid servers (with root warning)'}
    ${{ mcpServers: { server1: serverMissingArgs } }} | ${false}      | ${["mcpServers.server1.args"]}         | ${[]}                | ${'should invalidate config with server missing args'}
    ${{ mcpServers: { server1: serverMissingCommand } }} | ${false}      | ${["mcpServers.server1.command"]}     | ${[]}                | ${'should invalidate config with server missing command'}
    ${{ servers: { server1: serverMissingArgs } }}  | ${false}      | ${["servers.server1.args"]}             | ${[""]}                | ${'should invalidate legacy config with server missing args (with root warning)'}
  `(
    '$description', 
    ({ configInput, expectedValid, expectedErrorPaths, expectedWarningPaths }) => {
      const result = validateMcpConfig(configInput);
      expect(result.valid).toBe(expectedValid);
      expect(result.errors.map(e => e.path)).toEqual(expect.arrayContaining(expectedErrorPaths));
      expect(result.errors.length).toBe(expectedErrorPaths.length);
      expect(result.warnings.map(w => w.path)).toEqual(expect.arrayContaining(expectedWarningPaths));
      expect(result.warnings.length).toBe(expectedWarningPaths.length);
    }
  );
});

describe("Configuration Auto-Correction (applyAutoCorrections)", () => {
  test.each`
    originalConfig                      | issues                                                              | expectedConfig                        | description
    ${{ port: "8080" }}                 | ${[{ path: "port", suggestion: { action: "convert", type: "number" } }]} | ${{ port: 8080 }}                     | ${'should convert string port to number'}
    ${{ features: ["a", 1, "b"] }}    | ${[{ path: "features[1]", suggestion: { action: "convert", type: "string" } }]} | ${{ features: ["a", "1", "b"] }}   | ${'should convert number in string array to string'}
    ${{ options: { timeout: "30" } }} | ${[{ path: "options.timeout", suggestion: { action: "convert", type: "number" } }]} | ${{ options: { timeout: 30 } }}     | ${'should convert nested string to number'}
    ${{ list: ["x", "y", "z"] }}      | ${[{ path: "list[1]", suggestion: { action: "remove" } }]}           | ${{ list: ["x", "z"] }}             | ${'should remove item from array'}
    ${{ nested: { arr: [1, 2, 3] } }} | ${[{ path: "nested.arr[0]", suggestion: { action: "remove" } }]}     | ${{ nested: { arr: [2, 3] } }}      | ${'should remove item from nested array'}
    ${{ obj: { a: 1, b: 2 } }}         | ${[{ path: "obj.b", suggestion: { action: "remove" } }]}             | ${{ obj: { a: 1 } }}                | ${'should remove key from object'}
    ${{ user: { name: "old" } }}       | ${[{ path: "user.name", suggestion: { action: "replace", value: "new" } }]} | ${{ user: { name: "new" } }}        | ${'should replace value in object'}
    ${{ items: [{ id: 1 }, { id: 2 }] }} | ${[{ path: "items[0].id", suggestion: { action: "replace", value: 10 } }]} | ${{ items: [{ id: 10 }, { id: 2 }] }} | ${'should replace value in nested object within array'}
    ${{ config: {} }}                   | ${[{ path: "config.missing", suggestion: { action: "add", value: true } }]} | ${{ config: { missing: true } }}    | ${'should add key to object'}
    ${{ arr: [] }}                      | ${[{ path: "arr[0]", suggestion: { action: "add", value: "newItem" } }]} | ${{ arr: ["newItem"] }}             | ${'should add item to array'}
  `(
    '$description', 
    ({ originalConfig, issues, expectedConfig }) => {
      const corrected = applyAutoCorrections(originalConfig, issues);
      expect(corrected).toEqual(expectedConfig);
    }
  );

  test('should not modify original config object', () => {
    const original = { port: "8080" };
    const originalCopy = JSON.parse(JSON.stringify(original));
    const issues = [{ path: "port", suggestion: { action: "convert", type: "number" } }];
    applyAutoCorrections(original, issues);
    expect(original).toEqual(originalCopy); // Ensure original object is unchanged
  });
});

describe("Single Server Configuration Formatting (formatSingleServerConfig)", () => {
  const fullConfig = {
    id: "internal-id-123",
    name: "MyServer",
    originalId: "original-uuid-456",
    command: "node",
    args: ["server.js", "--port", "3000"],
    env: { NODE_ENV: "production" },
    resources: [{ name: "db", type: "postgres" }],
    transport: { type: "tcp", port: 5000 },
    _internal: "should be stripped",
  };

  const minimalConfig = {
    command: "java",
    args: ["-jar", "app.jar"],
  };

  test.each`
    serverInput      | expectedOutput                                                               | description
    ${fullConfig}    | ${{ command: "node", args: ["server.js", "--port", "3000"], env: { NODE_ENV: "production" }, resources: [{ name: "db", type: "postgres" }], transport: { type: "tcp", port: 5000 } }} | ${'should format a full server config, stripping internal fields'}
    ${minimalConfig} | ${{ command: "java", args: ["-jar", "app.jar"] }}                               | ${'should format a minimal server config'}
    ${{ command: "c" }} | ${{ command: "c", args: [] }}                                                 | ${'should provide default empty args array'}
    ${{ args: ["a"] }}  | ${{ command: "", args: ["a"] }}                                                  | ${'should provide default empty command string'}
    ${{}}            | ${{ command: "", args: [] }}                                                  | ${'should handle empty object with defaults'}
    ${null}          | ${null}                                                                      | ${'should return null for null input'}
    ${undefined}     | ${null}                                                                      | ${'should return null for undefined input'}
  `(
    '$description', 
    ({ serverInput, expectedOutput }) => {
      expect(formatSingleServerConfig(serverInput)).toEqual(expectedOutput);
    }
  );
});

describe("Server List to MCP JSON Formatting (formatServerListToMcpJson)", () => {
  const server1 = { name: "WebApp", command: "npm", args: ["start"] };
  const server2 = { originalId: "api-service-uuid", command: "python", args: ["api.py"] };
  const server3 = { command: "docker", args: ["compose", "up"] }; // No name or originalId
  const server4 = { name: "DB Migrator", originalId: "migrator-uuid", command: "flyway", args: ["migrate"] };

  test.each`
    serverListInput                                                              | expectedMcpServersKeys | description
    ${{ web: server1, api: server2, infra: server3, migrator: server4 }}         | ${["WebApp", "api-service-uuid", "infra", "DB Migrator"]} | ${'should use name, then originalId, then key as MCP server key'}
    ${{ onlyKey: server3 }}                                                      | ${["onlyKey"]}          | ${'should use object key when name and originalId are missing'}
    ${{ hasName: server1 }}                                                      | ${["WebApp"]}           | ${'should use name when present'}
    ${{ hasOrigId: server2 }}                                                    | ${["api-service-uuid"]} | ${'should use originalId when name is missing'}
    ${{}}                                                                        | ${[]}                   | ${'should handle empty server list object'}
    ${null}                                                                      | ${[]}                   | ${'should handle null input with empty mcpServers'}
    ${undefined}                                                                 | ${[]}                   | ${'should handle undefined input with empty mcpServers'}
    ${{ web: server1, api: null }}                                               | ${["WebApp"]}           | ${'should skip null server entries in the list'}
  `(
    '$description', 
    ({ serverListInput, expectedMcpServersKeys }) => {
      const result = formatServerListToMcpJson(serverListInput);
      expect(result).toHaveProperty('mcpServers');
      expect(Object.keys(result.mcpServers)).toEqual(expect.arrayContaining(expectedMcpServersKeys));
      expect(Object.keys(result.mcpServers).length).toBe(expectedMcpServersKeys.length);
      // Check if values are formatted correctly (basic check)
      expectedMcpServersKeys.forEach(key => {
        expect(result.mcpServers[key]).not.toBeNull();
        expect(result.mcpServers[key]).toHaveProperty('command');
        expect(result.mcpServers[key]).toHaveProperty('args');
        expect(result.mcpServers[key]).not.toHaveProperty('name');
        expect(result.mcpServers[key]).not.toHaveProperty('originalId');
      });
    }
  );
});

describe("Validation Summary Generation (getValidationSummary)", () => {
  test.each`
    validationResult                                  | expectedSummary                                           | description
    ${{ valid: true, errors: [], warnings: [] }}      | ${'Configuration is valid'}                               | ${'should report valid config with no warnings'}
    ${{ valid: true, errors: [], warnings: [{}] }}   | ${'Configuration is valid with 1 warning(s)'}             | ${'should report valid config with one warning'}
    ${{ valid: true, errors: [], warnings: [{}, {}] }} | ${'Configuration is valid with 2 warning(s)'}             | ${'should report valid config with multiple warnings'}
    ${{ valid: false, errors: [{}], warnings: [] }}   | ${'Configuration has 1 error(s) and 0 warning(s)'}      | ${'should report invalid config with one error and no warnings'}
    ${{ valid: false, errors: [{}, {}], warnings: [{}] }} | ${'Configuration has 2 error(s) and 1 warning(s)'}      | ${'should report invalid config with multiple errors and warnings'}
    ${{ valid: false, errors: [{}], warnings: [{}, {}] }} | ${'Configuration has 1 error(s) and 2 warning(s)'}      | ${'should report invalid config with errors and multiple warnings'}
    ${null}                                           | ${'Configuration not validated'}                          | ${'should report not validated for null input'}
    ${undefined}                                      | ${'Configuration not validated'}                          | ${'should report not validated for undefined input'}
  `(
    '$description', 
    ({ validationResult, expectedSummary }) => {
      expect(getValidationSummary(validationResult)).toBe(expectedSummary);
    }
  );
});
