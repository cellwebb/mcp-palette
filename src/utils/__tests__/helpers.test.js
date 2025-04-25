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

    test('returns source when target is not an object', () => {
      const target = null;
      const source = { a: 1 };
      expect(deepMerge(target, source)).toEqual({ a: 1 });

      const target2 = 'string';
      expect(deepMerge(target2, source)).toEqual({ a: 1 });
    });

    test('returns source when source is not an object', () => {
      const target = { a: 1 };
      const source = null;
      expect(deepMerge(target, source)).toBeNull();

      const source2 = 'string';
      expect(deepMerge(target, source2)).toBe('string');
    });

    test('handles null/undefined inputs gracefully', () => {
      expect(deepMerge(null, null)).toBeNull();
      expect(deepMerge(undefined, undefined)).toBeUndefined();
      expect(deepMerge({a: 1}, null)).toBeNull();
      expect(deepMerge(null, {a: 1})).toEqual({a: 1});
      expect(deepMerge({a: 1}, undefined)).toBeUndefined();
      expect(deepMerge(undefined, {a: 1})).toEqual({a: 1});
    });

    test('replaces arrays, does not merge them', () => {
      const target = { a: [1, 2] };
      const source = { a: [3, 4] };
      expect(deepMerge(target, source)).toEqual({ a: [3, 4] });
    });

    test('source value replaces target value if not an object', () => {
      const target = { a: { b: 1 } };
      const source = { a: 'string' };
      expect(deepMerge(target, source)).toEqual({ a: 'string' });

      const target2 = { a: 'string' };
      const source2 = { a: { b: 1 } };
      expect(deepMerge(target2, source2)).toEqual({ a: { b: 1 } });
    });

    test('does not modify original objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const targetCopy = JSON.parse(JSON.stringify(target));
      const sourceCopy = JSON.parse(JSON.stringify(source));

      deepMerge(target, source);

      expect(target).toEqual(targetCopy);
      expect(source).toEqual(sourceCopy);
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

    test('returns false for empty name or command strings', () => {
      expect(hasOverrides({ name: '' })).toBe(false);
      expect(hasOverrides({ command: '' })).toBe(false);
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

    test('handles config without id field (no changes)', () => {
      const config = { name: 'server', command: 'run' };
      expect(filterInternalFields(config)).toEqual({ name: 'server', command: 'run' });
    });

    test('removes id when id is null', () => {
      const config = { id: null, name: 'n' };
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

    test('handles profileServer with enabled false and no overrides', () => {
      const master = { id: '1', name: 'm', command: 'cmd', args: [], env: { X: 'x' } };
      const expected = { name: 'm', command: 'cmd', args: [], env: { X: 'x' }, enabled: false };
      expect(getEffectiveConfig(master, { enabled: false })).toEqual(expected);
    });

    test('applies partial overrides correctly', () => {
      const master = { id: '1', name: 'master', command: 'run', args: [1, 2], env: { A: '1', C: '3' } };
      const profile = { enabled: true, overrides: { command: 'exec', args: [], env: { B: '2' } } };
      const expected = { name: 'master', command: 'exec', args: [], env: { A: '1', C: '3', B: '2' }, enabled: true };
      expect(getEffectiveConfig(master, profile)).toEqual(expected);
    });
  });
});
