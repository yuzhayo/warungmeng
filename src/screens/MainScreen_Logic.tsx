import { useState } from 'react';

export const useMainScreenLogic = () => {
  const [activeButton, setActiveButton] = useState<string>('Home');

  const handleButtonClick = (buttonName: string) => {
    setActiveButton(buttonName);
    console.log(`${buttonName} button clicked`);
  };

  return {
    activeButton,
    handleButtonClick
  };
};