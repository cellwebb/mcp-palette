import { mcpConfigSchema, transportSchemas, validationPatterns } from '../mcpSchema';

describe('mcpConfigSchema', () => {
  test('required includes mcpServers', () => {
    expect(Array.isArray(mcpConfigSchema.required)).toBe(true);
    expect(mcpConfigSchema.required).toContain('mcpServers');
  });

  test('mcpServers property schema type object', () => {
    expect(mcpConfigSchema.properties.mcpServers.type).toBe('object');
  });

  test('serverConfig definition requires command and args', () => {
    const defs = mcpConfigSchema.definitions.serverConfig;
    expect(Array.isArray(defs.required)).toBe(true);
    expect(defs.required).toEqual(expect.arrayContaining(['command', 'args']));
  });
});

describe('transportSchemas', () => {
  test('http schema has port, host, ssl with correct types and defaults', () => {
    const http = transportSchemas.http;
    expect(http.type).toBe('object');
    expect(http.properties.port.type).toBe('number');
    expect(http.properties.host.default).toBe('localhost');
    expect(http.properties.ssl.default).toBe(false);
  });

  test('websocket schema has default path "/mcp"', () => {
    expect(transportSchemas.websocket.properties.path.default).toBe('/mcp');
  });

  test('stdio schema has default bufferSize 4096', () => {
    expect(transportSchemas.stdio.properties.bufferSize.default).toBe(4096);
  });
});

describe('validationPatterns', () => {
  test('envVarName matches valid and rejects invalid names', () => {
    expect(validationPatterns.envVarName.test('FOO_BAR')).toBe(true);
    expect(validationPatterns.envVarName.test('1FOO')).toBe(false);
  });

  test('safeCommand rejects unsafe characters', () => {
    expect(validationPatterns.safeCommand.test('echo test')).toBe(true);
    // semicolon is disallowed
    expect(validationPatterns.safeCommand.test('rm -rf /; echo')).toBe(false);
  });

  test('resourceName matches camelCase pattern', () => {
    expect(validationPatterns.resourceName.test('fooBar')).toBe(true);
    expect(validationPatterns.resourceName.test('FooBar')).toBe(false);
    expect(validationPatterns.resourceName.test('foo_bar')).toBe(false);
  });
});
