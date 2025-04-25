import { validateResourceDefinitions, validateTransportConfig, validateInternalProperties } from '../mcpValidator';

describe('mcpValidator helpers', () => {
  describe('validateResourceDefinitions', () => {
    test('adds error when resources is not array', () => {
      const result = { errors: [], warnings: [] };
      validateResourceDefinitions(null, result);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toBe('resources');
    });

    test('no errors for valid resources array', () => {
      const resources = [
        { name: 'getDoc', description: 'Retrieves doc', parameters: {} },
      ];
      const result = { errors: [], warnings: [] };
      validateResourceDefinitions(resources, result);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('reports missing properties and warnings for invalid names', () => {
      const resources = [
        { name: 123, description: true, parameters: null },
        { name: 'Bad-Name', parameters: {} },
      ];
      const result = { errors: [], warnings: [] };
      validateResourceDefinitions(resources, result);
      // errors for name type, description missing/type, parameters missing/type
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      // warning for invalid camelCase name
      expect(result.warnings.some(w => w.path === 'resources[1].name')).toBe(true);
    });
  });

  describe('validateTransportConfig', () => {
    test('adds error when transport is not object', () => {
      const result = { errors: [], warnings: [] };
      validateTransportConfig(null, result);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toBe('transport');
    });

    test('adds error when type missing', () => {
      const result = { errors: [], warnings: [] };
      validateTransportConfig({}, result);
      expect(result.errors[0].path).toBe('transport.type');
    });

    test('adds error for unsupported type', () => {
      const result = { errors: [], warnings: [] };
      validateTransportConfig({ type: 'foo' }, result);
      expect(result.errors[0].path).toBe('transport.type');
    });

    test('warns on unknown property', () => {
      const result = { errors: [], warnings: [] };
      validateTransportConfig({ type: 'http', foo: 'bar' }, result);
      expect(result.warnings[0].path).toBe('transport.foo');
    });

    test('adds error for invalid property types', () => {
      const result = { errors: [], warnings: [] };
      validateTransportConfig({ type: 'http', port: '8080' }, result);
      expect(result.errors[0].path).toBe('transport.port');
    });
  });

  describe('validateInternalProperties', () => {
    test('adds errors for invalid internal props', () => {
      const cfg = { originalId: 123, name: 456, enabled: 'yes', overrides: [] };
      const result = { errors: [], warnings: [] };
      validateInternalProperties(cfg, result);
      const paths = result.errors.map(e => e.path);
      expect(paths).toEqual(expect.arrayContaining(['originalId', 'name', 'enabled', 'overrides']));
    });

    test('no errors when props are correct types', () => {
      const cfg = { originalId: 'id', name: 'n', enabled: true, overrides: {} };
      const result = { errors: [], warnings: [] };
      validateInternalProperties(cfg, result);
      expect(result.errors).toHaveLength(0);
    });
  });
});
