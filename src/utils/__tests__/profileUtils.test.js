import { findProfileByIdOrName, getServerDisplayName, generateFinalProfileConfig, convertFinalConfigToInternal } from '../profileUtils';

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
  });
});
