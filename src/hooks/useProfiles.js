import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { findProfileByIdOrName, getServerDisplayName } from '../utils/profileUtils';

/**
 * Custom hook for managing profiles and their servers
 */
export function useProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState('');
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedProfileServer, setSelectedProfileServer] = useState(null);
  const [isEditingOverrides, setIsEditingOverrides] = useState(false);
  const [showServerSelectionModal, setShowServerSelectionModal] = useState(false);

  // Get the current profile object
  const currentProfile = findProfileByIdOrName(profiles, activeProfile) || {};

  /**
   * Handle profile selection
   */
  const handleProfileSelect = async (profileId) => {
    try {
      await window.api.setActiveProfile(profileId);
      const profile = findProfileByIdOrName(profiles, profileId);
      setActiveProfile(profile ? profile.name : '');
      setSelectedProfileServer(null);
    } catch (error) {
      console.error('Failed to set active profile:', error);
    }
  };

  /**
   * Handle adding a new profile
   */
  const handleAddProfile = (profileName) => {
    if (!profileName || !profileName.trim()) {
      alert('Profile name cannot be empty');
      return;
    }

    // Check for duplicate names
    if (profiles.some((p) => p.name.toLowerCase() === profileName.toLowerCase())) {
      alert(`A profile with the name "${profileName}" already exists`);
      return;
    }

    // Create new profile object
    const newProfile = {
      id: uuidv4(),
      name: profileName.trim(),
      servers: {},
    };

    window.api
      .addProfile(newProfile)
      .then((updatedProfiles) => {
        console.log('Profile added successfully:', newProfile);
        setProfiles(updatedProfiles);
        setIsAddingProfile(false);
      })
      .catch((error) => {
        console.error('Failed to add profile:', error);
        alert('Error creating profile: ' + (error.message || 'Unknown error'));
      });
  };

  /**
   * Handle renaming a profile
   */
  const handleRenameProfile = async (params) => {
    // Ensure params have the correct format
    let oldName, newName;

    if (typeof params === 'object' && params.oldName && params.newName) {
      oldName = params.oldName;
      newName = params.newName;
    } else if (typeof params === 'string' && typeof arguments[1] === 'string') {
      // Handle legacy format with separate arguments
      oldName = params;
      newName = arguments[1];
      console.warn(
        'Deprecated: handleRenameProfile now expects an object with oldName and newName properties'
      );
    } else {
      console.error('Invalid parameters for handleRenameProfile:', params);
      throw new Error('Invalid parameters for profile rename');
    }

    console.log('handleRenameProfile called with:', { oldName, newName });

    try {
      // Call the API with the correct parameter structure
      const updatedProfiles = await window.api.renameProfile({
        oldName,
        newName,
      });

      // Update state based on returned profiles
      setProfiles([...updatedProfiles]); // Force a new array reference

      // Update active profile if it was renamed
      if (activeProfile === oldName) {
        setActiveProfile(newName);
      }

      console.log('Rename completed successfully');
      return updatedProfiles;
    } catch (error) {
      console.error('Failed to rename profile:', error);
      throw error; // Re-throw so caller can handle it
    }
  };

  /**
   * Handle deleting a profile
   */
  const handleDeleteProfile = async (profileId) => {
    const profile = findProfileByIdOrName(profiles, profileId);
    if (!profile) {
      console.error('Cannot find profile to delete');
      return;
    }

    const profileName = profile.name;
    console.log(`Attempting to delete profile: ${profileName}`);

    // Validate profile name
    if (!profileName) {
      console.error('Cannot delete profile with empty name');
      return;
    }

    // Check if this is the only profile
    if (profiles.length <= 1) {
      await window.api.safeAlert('Cannot delete the last remaining profile');
      return;
    }

    // Confirm deletion with user
    const confirmed = await window.api.safeConfirm(
      `Are you sure you want to delete the profile "${profileName}"?`
    );
    if (!confirmed) {
      console.log('Profile deletion cancelled by user');
      return;
    }

    console.log('User confirmed deletion, proceeding...');

    try {
      // Call API to delete profile
      console.log('Calling deleteProfile API');
      const updatedProfiles = await window.api.deleteProfile(profileId);
      console.log('API call successful, profiles updated', updatedProfiles);

      // Create new reference to force re-render
      setProfiles([...updatedProfiles]);

      // If the active profile was deleted, fetch the new active profile
      if (activeProfile === profileName) {
        console.log('Active profile was deleted, getting new active profile');
        const newActiveProfile = await window.api.getActiveProfile();
        console.log(`New active profile: ${newActiveProfile}`);
        setActiveProfile(newActiveProfile);
      }

      // Reset any selected server
      setSelectedProfileServer(null);

      console.log('Profile deletion completed successfully');
    } catch (error) {
      console.error('Failed to delete profile:', error);
      await window.api.safeAlert(error.message || 'Failed to delete profile');
    }
  };

  /**
   * Handle toggling a server in a profile
   */
  const handleToggleProfileServer = async (serverId) => {
    try {
      // Get current profile
      const profile = findProfileByIdOrName(profiles, activeProfile);
      if (!profile) return;

      // Create a copy of the profile
      const updatedProfile = { ...profile };

      // Make sure servers object exists
      if (!updatedProfile.servers) {
        updatedProfile.servers = {};
      }

      // Make sure server entry exists
      if (!updatedProfile.servers[serverId]) {
        updatedProfile.servers[serverId] = {
          enabled: false,
          overrides: {},
        };
      }

      // Toggle enabled state
      updatedProfile.servers[serverId].enabled = !updatedProfile.servers[serverId].enabled;

      // Update profile
      const updatedProfiles = await window.api.updateProfile(activeProfile, updatedProfile);
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Failed to toggle server:', error);
      await window.api.safeAlert('Failed to toggle server: ' + error.message);
    }
  };

  /**
   * Handle adding server to profile
   */
  const handleAddServerToProfile = async (serverId) => {
    try {
      // Get current profile
      const profile = findProfileByIdOrName(profiles, activeProfile);
      if (!profile) return;

      // Create a copy of the profile
      const updatedProfile = { ...profile };

      // Make sure servers object exists
      if (!updatedProfile.servers) {
        updatedProfile.servers = {};
      }

      // Add server if not already in profile
      if (!updatedProfile.servers[serverId]) {
        updatedProfile.servers[serverId] = {
          enabled: true,
          overrides: {},
        };
      }

      // Update profile
      const updatedProfiles = await window.api.updateProfile(activeProfile, updatedProfile);
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Failed to add server to profile:', error);
      await window.api.safeAlert('Failed to add server to profile: ' + error.message);
    }
  };

  /**
   * Handle editing profile server overrides
   */
  const handleEditOverrides = (serverId) => {
    setSelectedProfileServer(serverId);
    setIsEditingOverrides(true);
  };

  /**
   * Handle removing a server from profile
   */
  const handleRemoveServerFromProfile = async (serverId) => {
    try {
      // Get current profile
      const profile = findProfileByIdOrName(profiles, activeProfile);
      if (!profile) return;

      // Create a copy of the profile
      const updatedProfile = { ...profile };

      // Make sure servers object exists
      if (!updatedProfile.servers) return;

      // Remove server from profile
      if (updatedProfile.servers[serverId]) {
        delete updatedProfile.servers[serverId];
      }

      // Update profile
      const updatedProfiles = await window.api.updateProfile(activeProfile, updatedProfile);
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Failed to remove server from profile:', error);
      await window.api.safeAlert('Failed to remove server from profile: ' + error.message);
    }
  };

  /**
   * Handle saving server overrides
   */
  const handleSaveOverrides = async (updatedServer) => {
    try {
      // Get current profile
      const profile = findProfileByIdOrName(profiles, activeProfile);
      if (!profile) return;

      // Create a copy of the profile
      const updatedProfile = { ...profile };

      // Make sure servers object exists
      if (!updatedProfile.servers) {
        updatedProfile.servers = {};
      }

      // Update server in profile
      updatedProfile.servers[selectedProfileServer] = updatedServer;

      // Update profile
      const updatedProfiles = await window.api.updateProfile(activeProfile, updatedProfile);
      setProfiles(updatedProfiles);

      // Exit editing mode
      setIsEditingOverrides(false);
      setSelectedProfileServer(null);
    } catch (error) {
      console.error('Failed to save overrides:', error);
      await window.api.safeAlert('Failed to save overrides: ' + error.message);
    }
  };

  /**
   * Handle restoring profile server defaults
   */
  const handleRestoreProfileServerDefaults = async (serverId, profileName, serverMasterList) => {
    try {
      // Get current profile
      const profile = findProfileByIdOrName(profiles, profileName);
      if (!profile) return;

      // Create a copy of the profile
      const updatedProfile = { ...profile };

      // Reset server to default (remove all overrides) but keep enabled state
      if (updatedProfile.servers && updatedProfile.servers[serverId]) {
        const isEnabled = updatedProfile.servers[serverId].enabled;
        updatedProfile.servers[serverId] = {
          enabled: isEnabled,
          overrides: {}, // Empty overrides
        };
      }

      // Update profile
      const updatedProfiles = await window.api.updateProfile(profileName, updatedProfile);
      setProfiles(updatedProfiles);

      // Show confirmation
      const serverName = serverMasterList[serverId]
        ? getServerDisplayName(serverMasterList[serverId])
        : serverId;

      await window.api.safeAlert(
        `Server "${serverName}" in profile "${profileName}" restored to defaults.`
      );
    } catch (error) {
      console.error('Failed to restore server defaults:', error);
      await window.api.safeAlert(`Failed to restore defaults: ${error.message}`);
    }
  };

  return {
    // State
    profiles,
    setProfiles,
    activeProfile,
    setActiveProfile,
    currentProfile,
    isAddingProfile,
    setIsAddingProfile,
    showRenameModal,
    setShowRenameModal,
    selectedProfileServer,
    setSelectedProfileServer,
    isEditingOverrides,
    setIsEditingOverrides,
    showServerSelectionModal,
    setShowServerSelectionModal,

    // Handlers
    handleProfileSelect,
    handleAddProfile,
    handleRenameProfile,
    handleDeleteProfile,
    handleToggleProfileServer,
    handleAddServerToProfile,
    handleEditOverrides,
    handleRemoveServerFromProfile,
    handleSaveOverrides,
    handleRestoreProfileServerDefaults,
  };
}
