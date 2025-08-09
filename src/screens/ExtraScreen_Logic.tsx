import { useState, useEffect } from 'react';

export const useExtraScreenLogic = () => {
  const [data, setData] = useState<string>('Extra screen initialized');
  const [activeScreen, setActiveScreen] = useState<string>('main');

  useEffect(() => {
    // Listen for database refresh events
    const handleDatabaseRefresh = (event: CustomEvent) => {
      if (event.detail.screen === 'extra') {
        console.log('Refreshing extra screen from database refresh event');
        loadExtraData();
      }
    };

    window.addEventListener('databaseRefresh', handleDatabaseRefresh as EventListener);

    return () => {
      window.removeEventListener('databaseRefresh', handleDatabaseRefresh as EventListener);
    };
  }, []);

  const loadExtraData = () => {
    console.log('Loading extra screen data...');
    setData('Extra data refreshed at ' + new Date().toLocaleTimeString());
  };

  const handleAction = (buttonId: string) => {
    console.log('Extra screen action triggered:', buttonId);
    setActiveScreen(buttonId);
    setData(`${buttonId} screen active`);
  };

  const handleBackToMain = () => {
    setActiveScreen('main');
    setData('Extra screen initialized');
  };

  return {
    data,
    activeScreen,
    handleAction,
    handleBackToMain
  };
};