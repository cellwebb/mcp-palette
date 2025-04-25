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
      [{ path: "args[1]", suggestion: { action: "convert" } }],
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
