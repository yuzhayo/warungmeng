import React from 'react';
import { RefreshCw } from 'lucide-react';


interface DatabaseTabUIProps {
  activeScreen: string;
  onCategoryClick: () => void;
  onMenuClick: () => void;
  onCashflowClick: () => void;
  onRefresh: () => void;
}

const DatabaseTabUI: React.FC<DatabaseTabUIProps> = ({ 
  activeScreen,
  onCategoryClick,
  onMenuClick,
  onCashflowClick,
  onRefresh
}) => {
  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'category':
        return 'Categories';
      case 'menu':
        return 'Menu Items';
      case 'cashflow':
        return 'Cashflow Analytics';
      default:
        return 'Menu Items';
    }
  };

  return (
    <div className="flex-shrink-0 h-20 bg-main-gray rounded-lg shadow-custom flex items-center justify-between px-6">
      {/* Left side - Back button or menu buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onCategoryClick}
          className="bg-gray-600 text-white hover:bg-gray-500 px-4 py-2 rounded-md font-medium transition-all duration-300 ease-in-out min-w-[100px] text-sm whitespace-nowrap border border-gray-500"
        >
          Category
        </button>
        <button
          onClick={onMenuClick}
          className="bg-gray-600 text-white hover:bg-gray-500 px-4 py-2 rounded-md font-medium transition-all duration-300 ease-in-out min-w-[100px] text-sm whitespace-nowrap border border-gray-500"
        >
          Menu
        </button>
        <button
          onClick={onCashflowClick}
          className="bg-gray-600 text-white hover:bg-gray-500 px-4 py-2 rounded-md font-medium transition-all duration-300 ease-in-out min-w-[100px] text-sm whitespace-nowrap border border-gray-500"
        >
          Cashflow
        </button>
      </div>

      {/* Center - Screen title */}
      <div className="text-white text-lg font-medium">
        {getScreenTitle()}
      </div>

      {/* Right side - placeholder for future actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-md font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
        >
          <RefreshCw className="w-6 h-6" />
          <span className="text-lg">Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default DatabaseTabUI;