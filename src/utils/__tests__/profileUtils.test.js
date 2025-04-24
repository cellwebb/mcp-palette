import { findProfileByIdOrName, getServerDisplayName } from '../profileUtils';

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
});
