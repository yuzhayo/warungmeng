import { useState } from 'react';

export const useDatabaseTabLogic = () => {
  const [activeScreen, setActiveScreen] = useState<string>('menu'); // 'category', 'menu', 'cashflow', or 'extra'

  const handleCategoryClick = () => {
    console.log('Category button clicked');
    setActiveScreen('category');
  };

  const handleMenuClick = () => {
    console.log('Menu button clicked');
    setActiveScreen('menu');
  };

  const handleCashflowClick = () => {
    console.log('Cashflow button clicked');
    setActiveScreen('cashflow');
  };

  const handleExtraClick = () => {
    console.log('Extra button clicked');
    setActiveScreen('extra');
  };

  const handleRefresh = () => {
    console.log(`Refreshing ${activeScreen} data...`);
    // Dispatch a custom event that child screens can listen to for refreshing their data
    window.dispatchEvent(new CustomEvent('databaseRefresh', { detail: { screen: activeScreen } }));
  };

  return {
    activeScreen,
    handleCategoryClick,
    handleMenuClick,
    handleCashflowClick,
    handleExtraClick,
    handleRefresh
  };
};