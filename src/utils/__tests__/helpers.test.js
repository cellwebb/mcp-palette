import { deepMerge, hasOverrides, filterInternalFields, getEffectiveConfig, generateUUID, isValidUUID } from '../helpers';

describe('helpers', () => {
  describe('deepMerge', () => {
    test('merges nested objects', () => {
      const a = { x: 1, y: { z: 2 } };
      const b = { y: { w: 3 }, u: 4 };
      expect(deepMerge(a, b)).toEqual({ x: 1, y: { z: 2, w: 3 }, u: 4 });
    });

    test('returns source when target or source is not object', () => {
      expect(deepMerge(null, 5)).toBe(5);
      expect(deepMerge({ a: 1 }, 'string')).toBe('string');
    });
  });

  describe('hasOverrides', () => {
    test('returns false for null or empty overrides', () => {
      expect(hasOverrides(null)).toBe(false);
      expect(hasOverrides({})).toBe(false);
    });

    test('detects name override', () => {
      expect(hasOverrides({ name: 'test' })).toBe(true);
    });

    test('detects command override', () => {
      expect(hasOverrides({ command: 'cmd' })).toBe(true);
    });

    test('detects args override', () => {
      expect(hasOverrides({ args: [1] })).toBe(true);
    });

    test('detects env override', () => {
      expect(hasOverrides({ env: { A: 'B' } })).toBe(true);
    });
  });

  describe('filterInternalFields', () => {
    test('returns null for falsy serverConfig', () => {
      expect(filterInternalFields(null)).toBeNull();
    });

    test('removes id field', () => {
      const config = { id: 1, name: 'n' };
      expect(filterInternalFields(config)).toEqual({ name: 'n' });
    });
  });

  describe('getEffectiveConfig', () => {
    test('returns null when no masterServer', () => {
      expect(getEffectiveConfig(null, {})).toBeNull();
    });

    test('returns disabled config when no profileServer', () => {
      const master = { id: 1, env: { A: '1' }, name: 'n', command: 'c', args: [1], enabled: true };
      const expected = { env: { A: '1' }, name: 'n', command: 'c', args: [1], enabled: false };
      expect(getEffectiveConfig(master, null)).toEqual(expected);
    });

    test('applies overrides', () => {
      const master = { id: 1, env: { A: '1' }, name: 'n', command: 'c', args: [1] };
      const profile = { enabled: true, overrides: { name: 'new', command: 'nc', args: [2], env: { B: '2' } } };
      const result = getEffectiveConfig(master, profile);
      expect(result).toMatchObject({ name: 'new', command: 'nc', args: [2], env: { A: '1', B: '2' }, enabled: true });
      expect(result.id).toBeUndefined();
    });
  });

  describe('UUID functions', () => {
    test('generateUUID returns valid UUID', () => {
      const uuid = generateUUID();
      expect(isValidUUID(uuid)).toBe(true);
    });

    test('isValidUUID rejects invalid strings', () => {
      expect(isValidUUID('invalid')).toBe(false);
    });
  });
});
