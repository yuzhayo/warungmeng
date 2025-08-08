import { useState } from 'react';

export const useSettingTabLogic = () => {
  const [theme, setTheme] = useState<string>('Dark');
  const [activeScreen, setActiveScreen] = useState<string>('general');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [lastUpdateCheck, setLastUpdateCheck] = useState<string>('');

  const handleThemeChange = () => {
    console.log('Theme change triggered');
    setTheme(theme === 'Dark' ? 'Light' : 'Dark');
  };

  const handleUpdateClick = () => {
    console.log('Update button clicked');
    setActiveScreen('update');
  };

  const handleGeneralClick = () => {
    console.log('General button clicked');
    setActiveScreen('general');
  };

  const handleCheckUpdate = async () => {
    console.log('Checking for updates...');
    setIsCheckingUpdate(true);
    setUpdateStatus('Checking for updates...');
    
    // Simulate update check process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      // Simulate random update result
      const hasUpdate = Math.random() > 0.5;
      
      if (hasUpdate) {
        const version = `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
        setUpdateStatus(`Update available: ${version}`);
      } else {
        setUpdateStatus('You are using the latest version');
      }
      
      setLastUpdateCheck(new Date().toLocaleString());
    } catch (error) {
      setUpdateStatus('Failed to check for updates');
      console.error('Update check failed:', error);
    } finally {
      setIsCheckingUpdate(false);
    }
  };
  return {
    theme,
    activeScreen,
    isCheckingUpdate,
    updateStatus,
    lastUpdateCheck,
    handleThemeChange,
    handleUpdateClick,
    handleGeneralClick,
    handleCheckUpdate
  };
};