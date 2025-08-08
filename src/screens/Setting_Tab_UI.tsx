import React from 'react';
import { RefreshCw, Settings, Download } from 'lucide-react';

interface SettingTabUIProps {
  theme: string;
  activeScreen: string;
  onUpdateClick: () => void;
  onGeneralClick: () => void;
  onThemeChange: () => void;
}

const SettingTabUI: React.FC<SettingTabUIProps> = ({ 
  theme, 
  activeScreen,
  onUpdateClick,
  onGeneralClick,
  onThemeChange 
}) => {
  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'general':
        return 'General Settings';
      case 'update':
        return 'Update Settings';
      default:
        return 'General Settings';
    }
  };

  return (
    <div className="flex-shrink-0 h-20 bg-main-gray rounded-lg shadow-custom flex items-center justify-between px-6">
      {/* Left side - Navigation buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onGeneralClick}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-300 ease-in-out min-w-[100px] text-sm whitespace-nowrap border ${
            activeScreen === 'general' 
              ? 'bg-blue-600 text-white border-blue-500' 
              : 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>General</span>
        </button>
        <button
          onClick={onUpdateClick}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-300 ease-in-out min-w-[100px] text-sm whitespace-nowrap border ${
            activeScreen === 'update' 
              ? 'bg-blue-600 text-white border-blue-500' 
              : 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Update</span>
        </button>
      </div>

      {/* Center - Screen title */}
      <div className="text-white text-lg font-medium">
        {getScreenTitle()}
      </div>

      {/* Right side - Theme toggle for general screen */}
      <div className="flex items-center space-x-4">
        {activeScreen === 'general' && (
          <button
            onClick={onThemeChange}
            className="bg-gray-600 text-white hover:bg-gray-500 px-4 py-2 rounded-md font-medium transition-all duration-300 ease-in-out text-sm border border-gray-500"
          >
            Theme: {theme}
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingTabUI;