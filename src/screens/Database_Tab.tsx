import React from 'react';
import { useDatabaseTabLogic } from './Database_Tab_Logic';
import DatabaseTabUI from './Database_Tab_UI';
import CategoryScreen from './CategoryScreen';
import MenuDatabaseScreen from './MenuDatabaseScreen';
import CashflowScreen from './CashflowScreen';

const DatabaseTab: React.FC = () => {
  const { 
    activeScreen,
    handleCategoryClick,
    handleMenuClick,
    handleCashflowClick,
    handleRefresh
  } = useDatabaseTabLogic();

  const renderContent = () => {
    switch (activeScreen) {
      case 'category':
        return <CategoryScreen />;
      case 'menu':
        return <MenuDatabaseScreen />;
      case 'cashflow':
        return <CashflowScreen />;
      default:
        return (
          <div className="w-full h-full bg-main-gray rounded-lg shadow-custom flex items-center justify-center">
            <div className="text-white text-lg font-medium">
              Select a database option from the menu above
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-4 transition-all duration-300 ease-in-out w-full">
      {/* Navigation Header - Always Visible */}
      <div className="flex-shrink-0">
        <DatabaseTabUI 
          activeScreen={activeScreen}
          onCategoryClick={handleCategoryClick}
          onMenuClick={handleMenuClick}
          onCashflowClick={handleCashflowClick}
          onRefresh={handleRefresh}
        />
      </div>
      
      {/* Dynamic Content Area */}
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default DatabaseTab;