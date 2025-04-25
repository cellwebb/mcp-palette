import { deepMerge, hasOverrides, filterInternalFields, getEffectiveConfig } from '../helpers';

describe('helpers', () => {
  describe('deepMerge', () => {
    test('merges nested objects', () => {
      const a = { x: 1, y: { z: 2 } };
      const b = { y: { w: 3 }, u: 4 };
      expect(deepMerge(a, b)).toEqual({ x: 1, y: { z: 2, w: 3 }, u: 4 });
    });

    test('merges multiple nested levels', () => {
      const a = { a: { b: { c: 1 } } };
      const b = { a: { b: { d: 2 } } };
      expect(deepMerge(a, b)).toEqual({ a: { b: { c: 1, d: 2 } } });
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

    test('returns false for empty args and env', () => {
      expect(hasOverrides({ args: [], env: {} })).toBe(false);
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
      const master = { id: '1', name: 'master', command: 'run', args: [] };
      const expected = { name: 'master', command: 'run', args: [], enabled: false };
      expect(getEffectiveConfig(master, null)).toEqual(expected);
    });

    test('applies overrides', () => {
      const master = { id: '1', name: 'master', command: 'run', args: [], env: { A: '1' } };
      const profile = {
        enabled: true,
        overrides: { name: 'override', command: 'exec', args: ['a'], env: { B: '2' } },
      };
      const expected = {
        name: 'override',
        command: 'exec',
        args: ['a'],
        env: { A: '1', B: '2' },
        enabled: true,
      };
      expect(getEffectiveConfig(master, profile)).toEqual(expected);
    });

    test('returns default enabled config when no overrides', () => {
      const master = { id: '1', name: 'master', command: 'run', args: [] };
      const profile = { enabled: true }; // No overrides property
      const expected = { name: 'master', command: 'run', args: [], enabled: true };
      expect(getEffectiveConfig(master, profile)).toEqual(expected);
    });
  });
});
