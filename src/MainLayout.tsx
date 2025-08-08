import React, { useState } from 'react';
import MainScreen from './screens/MainScreen';
import HomeTab from './screens/Home_Tab';
import DatabaseTab from './screens/Database_Tab';
import SettingTab from './screens/Setting_Tab';
import FlyingItem from './FlyingItem';

interface FlyingItemState {
  source: DOMRect;
  target: DOMRect;
}

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('Home');
  const [isInvoiceVisible, setIsInvoiceVisible] = useState<boolean>(false);
  const [flyingItem, setFlyingItem] = useState<FlyingItemState | null>(null);
  const [cartTargetRect, setCartTargetRect] = useState<DOMRect | null>(null);

  // Listen for invoice visibility changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const invoiceState = localStorage.getItem('invoiceVisible');
      setIsInvoiceVisible(invoiceState === 'true');
    };

    const handleInvoiceToggle = () => {
      const invoiceState = localStorage.getItem('invoiceVisible');
      setIsInvoiceVisible(invoiceState === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('invoiceToggle', handleInvoiceToggle);
    handleStorageChange(); // Check initial state

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('invoiceToggle', handleInvoiceToggle);
    };
  }, []);

  // Listen for cart position ready event
  React.useEffect(() => {
    const handleCartPositionReady = (event: CustomEvent) => {
      const { targetRect } = event.detail;
      setCartTargetRect(targetRect);
    };

    window.addEventListener('cartPositionReady', handleCartPositionReady as EventListener);

    return () => {
      window.removeEventListener('cartPositionReady', handleCartPositionReady as EventListener);
    };
  }, []);

  // Listen for item added to cart animation event
  React.useEffect(() => {
    const handleItemAddedToCartAnimation = (event: CustomEvent) => {
      const { sourceRect } = event.detail;
      
      if (cartTargetRect && sourceRect) {
        setFlyingItem({
          source: sourceRect,
          target: cartTargetRect
        });
      }
    };

    window.addEventListener('itemAddedToCartAnimation', handleItemAddedToCartAnimation as EventListener);

    return () => {
      window.removeEventListener('itemAddedToCartAnimation', handleItemAddedToCartAnimation as EventListener);
    };
  }, [cartTargetRect]);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  const handleAnimationEnd = () => {
    setFlyingItem(null);
  };

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'Home':
        return <HomeTab />;
      case 'Database':
        return <DatabaseTab />;
      case 'Setting':
        return <SettingTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div 
        className="max-w-[1920px] max-h-[1200px] mx-auto h-screen flex flex-col space-y-4"
      >
        {/* MainScreen at top with tab navigation - Fixed height */}
        <div className="flex-shrink-0">
          <MainScreen onTabChange={handleTabChange} />
        </div>
        
        {/* Tab Content Section */}
        <div 
          className={`flex-1 min-h-0 transition-all duration-300 ease-in-out ${
            isInvoiceVisible ? 'mr-[485px]' : ''
          }`}
        >
          {renderCurrentTab()}
        </div>
      </div>

      {/* Flying Item Animation */}
      {flyingItem && (
        <FlyingItem
          source={flyingItem.source}
          target={flyingItem.target}
          onAnimationEnd={handleAnimationEnd}
        />
      )}
    </div>
  );
};

export default MainLayout;