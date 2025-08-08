import React from 'react';
import { useMainScreenLogic } from './MainScreen_Logic';
import MainScreenUI from './MainScreen_UI';

interface MainScreenProps {
  onTabChange: (tab: string) => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ onTabChange }) => {
  const { activeButton, handleButtonClick } = useMainScreenLogic();

  const handleButtonClickWithTabChange = (buttonName: string) => {
    handleButtonClick(buttonName);
    onTabChange(buttonName);
  };

  return (
    <MainScreenUI 
      activeButton={activeButton}
      onButtonClick={handleButtonClickWithTabChange}
    />
  );
};

export default MainScreen;