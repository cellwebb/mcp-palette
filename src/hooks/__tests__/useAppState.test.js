import { renderHook, act } from '@testing-library/react';
import { useAppState } from '../useAppState';

describe('useAppState', () => {
  test('initializes with default values', () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.activePage).toBe('profiles');
    expect(result.current.editMode).toBe('form');
  });

  test('updates activePage when setActivePage is called', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setActivePage('serverMasterList');
    });

    expect(result.current.activePage).toBe('serverMasterList');
  });

  test('updates editMode when setEditMode is called', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setEditMode('json');
    });

    expect(result.current.editMode).toBe('json');
  });

  test('can switch activePage multiple times', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setActivePage('serverMasterList');
    });
    expect(result.current.activePage).toBe('serverMasterList');

    act(() => {
      result.current.setActivePage('profiles');
    });
    expect(result.current.activePage).toBe('profiles');
  });

  test('can switch editMode multiple times', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setEditMode('json');
    });
    expect(result.current.editMode).toBe('json');

    act(() => {
      result.current.setEditMode('form');
    });
    expect(result.current.editMode).toBe('form');
  });

  test('activePage and editMode are independent', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.setActivePage('serverMasterList');
      result.current.setEditMode('json');
    });

    expect(result.current.activePage).toBe('serverMasterList');
    expect(result.current.editMode).toBe('json');

    act(() => {
      result.current.setActivePage('profiles');
    });

    // editMode should not change when activePage changes
    expect(result.current.activePage).toBe('profiles');
    expect(result.current.editMode).toBe('json');
  });
});
