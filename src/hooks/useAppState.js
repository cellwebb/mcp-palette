import { useState } from 'react';

/**
 * Custom hook for managing app-level state
 */
export function useAppState() {
  const [activePage, setActivePage] = useState('profiles'); // 'profiles' or 'serverMasterList'
  const [editMode, setEditMode] = useState('form'); // 'form' or 'json'

  return {
    activePage,
    setActivePage,
    editMode,
    setEditMode,
  };
}
