import React from 'react';
import { useExtraScreenLogic } from './ExtraScreen_Logic';
import ExtraScreenUI from './ExtraScreen_UI';
import Button1Screen from './Button1Screen';
import Button2Screen from './Button2Screen';
import Button3Screen from './Button3Screen';
import Button4Screen from './Button4Screen';

const ExtraScreen: React.FC = () => {
  const {
    data,
    activeScreen,
    handleAction,
    handleBackToMain
  } = useExtraScreenLogic();

  const renderContent = () => {
    switch (activeScreen) {
      case 'button1':
        return <Button1Screen onClose={handleBackToMain} />;
      case 'button2':
        return <Button2Screen onClose={handleBackToMain} />;
      case 'button3':
        return <Button3Screen onClose={handleBackToMain} />;
      case 'button4':
        return <Button4Screen onClose={handleBackToMain} />;
      default:
        return (
          <ExtraScreenUI
            data={data}
            onAction={handleAction}
          />
        );
    }
  };

  return renderContent();
};

export default ExtraScreen;