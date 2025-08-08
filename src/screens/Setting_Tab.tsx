import React from 'react';
import { useSettingTabLogic } from './Setting_Tab_Logic';
import SettingTabUI from './Setting_Tab_UI';
import UpdateScreen from './UpdateScreen';

const SettingTab: React.FC = () => {
  const { 
    theme, 
    activeScreen,
    isCheckingUpdate,
    updateStatus,
    lastUpdateCheck,
    handleThemeChange,
    handleUpdateClick,
    handleGeneralClick,
    handleCheckUpdate
  } = useSettingTabLogic();

  const renderContent = () => {
    switch (activeScreen) {
      case 'update':
        return (
          <UpdateScreen
            isCheckingUpdate={isCheckingUpdate}
            updateStatus={updateStatus}
            lastUpdateCheck={lastUpdateCheck}
            onCheckUpdate={handleCheckUpdate}
          />
        );
      case 'general':
      default:
        return (
          <div className="w-full h-full bg-main-gray rounded-lg shadow-custom flex items-center justify-center">
            <div className="text-white text-lg font-medium">
              General Settings - Theme: {theme}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-4 transition-all duration-300 ease-in-out w-full">
      {/* Navigation Header - Always Visible */}
      <div className="flex-shrink-0">
        <SettingTabUI 
          theme={theme}
          activeScreen={activeScreen}
          onUpdateClick={handleUpdateClick}
          onGeneralClick={handleGeneralClick}
          onThemeChange={handleThemeChange}
        />
      </div>
      
      {/* Dynamic Content Area */}
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingTab;