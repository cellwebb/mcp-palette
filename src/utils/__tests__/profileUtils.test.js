import { findProfileByIdOrName, getServerDisplayName, generateFinalProfileConfig, convertFinalConfigToInternal, calculateOverrides, applyOverrides } from '../profileUtils';


describe('profileUtils', () => {
  describe('findProfileByIdOrName', () => {
    const uuid = '00000000-0000-4000-8000-000000000000';
    const profiles = [
      { id: uuid, name: 'Alice' },
      { id: '11111111-1111-4111-8111-111111111111', name: 'Bob' },
    ];

    test('returns null for missing arguments', () => {
      expect(findProfileByIdOrName(null, 'foo')).toBeNull();
      expect(findProfileByIdOrName(profiles, '')).toBeNull();
    });

    test('finds by valid UUID id', () => {
      expect(findProfileByIdOrName(profiles, uuid)).toEqual(profiles[0]);
    });

    test('finds by name when identifier not UUID', () => {
      expect(findProfileByIdOrName(profiles, 'Bob')).toEqual(profiles[1]);
    });

    test('returns null when not found', () => {
      expect(findProfileByIdOrName(profiles, 'Charlie')).toBeNull();
    });
    
    test('returns null for valid UUID not in list', () => {
      const missingUuid = '22222222-2222-4222-8222-222222222222';
      expect(findProfileByIdOrName(profiles, missingUuid)).toBeNull();
    });
  });

  describe('getServerDisplayName', () => {
    test('returns name when present', () => {
      expect(getServerDisplayName({ name: 'Server1', originalId: 'orig' })).toBe('Server1');
    });

    test('returns originalId when name absent', () => {
      expect(getServerDisplayName({ originalId: 'orig' })).toBe('orig');
    });

    test('returns Unknown Server for falsy config', () => {
      expect(getServerDisplayName(null)).toBe('Unknown Server');
    });

    test('returns Unnamed Server when no name or originalId', () => {
      expect(getServerDisplayName({})).toBe('Unnamed Server');
    });

    test('returns Unnamed Server for empty name and originalId strings', () => {
      expect(getServerDisplayName({ name: '', originalId: '' })).toBe('Unnamed Server');
    });
  });

  describe('generateFinalProfileConfig', () => {
    test('returns empty config when profile or masterServers missing', () => {
      expect(generateFinalProfileConfig(null, {})).toEqual({ mcpServers: {} });
      expect(generateFinalProfileConfig({ servers: {} }, null)).toEqual({ mcpServers: {} });
    });

    test('includes only enabled servers and applies overrides', () => {
      const masterServers = {
        s1: { id: 's1', name: 'Server1', command: 'c1', args: ['a'], env: { X: '1', Y: '2' } },
        s2: { id: 's2', name: 'Server2', command: 'c2', args: ['b'], env: {} },
      };
      const profile = {
        servers: {
          s1: { enabled: true, overrides: { name: 'New1', args: ['x'], env: { X: null, Z: '3' } } },
          s2: { enabled: false },
        },
      };
      const result = generateFinalProfileConfig(profile, masterServers);
      expect(result.mcpServers).toHaveProperty('New1');
      expect(result.mcpServers.New1).toEqual({
        command: 'c1',
        args: ['x'],
        env: { Y: '2', Z: '3' },
      });
      expect(result.mcpServers).not.toHaveProperty('Server2');
    });

    test('fallback to originalId when name missing, skip missing masters and omit empty env', () => {
      const masterServers = {
        s1: { id: 's1', originalId: 'orig1', command: 'c', args: ['a'], env: {} },
        s2: { id: 's2', name: 'Server2', command: 'c2', args: ['b'], env: { E: '1' } },
      };
      const profile = { servers: { s1: { enabled: true }, s3: { enabled: true } } };
      const result = generateFinalProfileConfig(profile, masterServers);
      expect(result.mcpServers).toHaveProperty('orig1');
      expect(result.mcpServers.orig1).toEqual({ command: 'c', args: ['a'] });
      expect(result.mcpServers).not.toHaveProperty('s3');
      expect(result.mcpServers.orig1).not.toHaveProperty('env');
    });

    test('fallback to serverId when name and originalId missing', () => {
      const masterServers = {
        s1: { id: 's1', command: 'cmd', args: [], env: {} },
      };
      const profile = { servers: { s1: { enabled: true } } };
      const result = generateFinalProfileConfig(profile, masterServers);
      expect(result.mcpServers).toHaveProperty('s1');
      expect(result.mcpServers.s1).toEqual({ command: 'cmd', args: [] });
    });

    test('includes only env when overrides only contain env keys', () => {
      const masterServers = {
        s1: { id: 's1', name: 'Server1', command: 'c1', args: ['a'], env: { X: '1', Y: '2' } },
      };
      const profile = {
        servers: {
          s1: { enabled: true, overrides: { env: { X: null, Z: '3' } } },
        },
      };
      const result = generateFinalProfileConfig(profile, masterServers);
      expect(result.mcpServers).toHaveProperty('Server1');
      expect(result.mcpServers.Server1).toEqual({ env: { Y: '2', Z: '3' } });
    });

    test('returns empty config when profile.servers is empty', () => {
      const masterServers = {
        s1: { id: 's1', name: 'Server1', command: 'c', args: [], env: {} },
      };
      const profile = { servers: {} };
      const result = generateFinalProfileConfig(profile, masterServers);
      expect(result).toEqual({ mcpServers: {} });
    });
  });

  describe('convertFinalConfigToInternal', () => {
    test('adds overrides based on finalConfig', () => {
      const masterServers = {
        mid: { id: 'mid', name: 'M', command: 'orig', args: ['o'], env: { A: '1' } },
      };
      const currentProfile = { id: 'pid', name: 'P', servers: {} };
      const finalConfig = {
        mcpServers: {
          M: { command: 'orig', args: ['o'], env: { A: '2' } },
        },
      };
      const updated = convertFinalConfigToInternal(finalConfig, currentProfile, masterServers);
      expect(updated.id).toBe('pid');
      expect(updated.name).toBe('P');
      expect(updated.servers.mid.enabled).toBe(true);
      expect(updated.servers.mid.overrides).toEqual({ env: { A: '2' } });
    });

    test('handles legacy format and disables missing servers', () => {
      const masterServers = {
        mid: { id: 'mid', name: 'M', command: 'orig', args: ['o'], env: { A: '1' } },
        sid: { id: 'sid', name: 'S', command: 'orig2', args: [], env: {} },
      };
      const currentProfile = {
        id: 'pid',
        name: 'P',
        servers: {
          mid: { enabled: false, overrides: {} },
          sid: { enabled: true, overrides: {} },
        },
      };
      const finalConfig = {
        servers: {
          mid: { command: 'orig', args: ['o'], env: { A: '2' } },
        },
      };
      const updated = convertFinalConfigToInternal(finalConfig, currentProfile, masterServers);
      expect(updated.servers.mid.enabled).toBe(true);
      expect(updated.servers.mid.overrides).toEqual({ env: { A: '2' } });
      expect(updated.servers.sid.enabled).toBe(false);
    });

    test('empty finalConfig disables all existing servers', () => {
      const masterServers = {
        a: { id: 'a', name: 'A', command: 'c', args: ['o'], env: {} },
        b: { id: 'b', name: 'B', command: 'd', args: ['n'], env: {} },
      };
      const currentProfile = {
        id: 'pid',
        name: 'P',
        servers: {
          a: { enabled: true, overrides: {} },
          b: { enabled: true, overrides: {} },
        },
      };
      const updated = convertFinalConfigToInternal({}, currentProfile, masterServers);
      expect(updated.servers.a.enabled).toBe(false);
      expect(updated.servers.b.enabled).toBe(false);
    });

    test('matches by originalId when name missing in new format', () => {
      const masterServers = {
        s1: { id: 's1', originalId: 'orig1', command: 'cmd', args: ['a'], env: {} },
        s2: { id: 's2', name: 'Name2', command: 'c2', args: ['b'], env: {} },
      };
      const currentProfile = { id: 'pid', name: 'P', servers: {} };
      const finalConfig = {
        mcpServers: {
          orig1: { command: 'cmd', args: ['a'], env: {} },
          Name2: { command: 'c2', args: ['b'], env: {} },
        },
      };
      const updated = convertFinalConfigToInternal(finalConfig, currentProfile, masterServers);
      expect(updated.servers.s1.enabled).toBe(true);
      expect(updated.servers.s1.overrides).toEqual({});
      expect(updated.servers.s2.enabled).toBe(true);
    });
  });

  describe('calculateOverrides', () => {
    test('calculates overrides for primitives, arrays, nested objects, and new keys', () => {
      const masterConfig = { a: 1, b: { x: 1, y: 2 }, c: [1, 2], originalId: 'id' };
      const targetConfig = { a: 1, b: { x: 5 }, c: [1, 2, 3], d: 4, originalId: 'ignore' };
      const overrides = calculateOverrides(masterConfig, targetConfig);
      expect(overrides).toEqual({ b: { x: 5 }, c: [1, 2, 3], d: 4 });
    });

    test('returns empty object when no differences', () => {
      const masterConfig = { a: 1, b: { x: 1 }, c: [1] };
      const overrides = calculateOverrides(masterConfig, { a: 1, b: { x: 1 }, c: [1] });
      expect(overrides).toEqual({});
    });
  });

  describe('applyOverrides', () => {
    test('applies primitive and nested object overrides deeply', () => {
      const target = { a: 1, b: { x: 1, y: 2 } };
      const overrides = { a: 2, b: { y: 3 } };
      applyOverrides(target, overrides);
      expect(target).toEqual({ a: 2, b: { x: 1, y: 3 } });
    });

    test('handles array overrides and deletion in env', () => {
      const target = { env: { X: '1', Y: '2' }, list: [1, 2] };
      const overrides = { list: [3, 4], env: { X: null, Z: '3' } };
      applyOverrides(target, overrides);
      expect(target).toEqual({ env: { Y: '2', Z: '3' }, list: [3, 4] });
    });
  });
});
