import React, { useState } from 'react';
import { useZoom } from './ZoomContext';
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
  const { scale, setZoom } = useZoom();
  const [currentTab, setCurrentTab] = useState<string>('Home');
  const [isInvoiceVisible, setIsInvoiceVisible] = useState<boolean>(false);
  const [flyingItem, setFlyingItem] = useState<FlyingItemState | null>(null);
  const [cartTargetRect, setCartTargetRect] = useState<DOMRect | null>(null);
  
  // Touch gesture state for pinch-to-zoom
  const [touchState, setTouchState] = React.useState<{
    initialDistance: number;
    initialScale: number;
    isZooming: boolean;
  } | null>(null);

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

  // Gesture handlers for zoom functionality
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      setTouchState({
        initialDistance: distance,
        initialScale: scale,
        isZooming: true
      });
      
      e.preventDefault();
    }
  }, [scale]);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchState?.isZooming) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scaleChange = distance / touchState.initialDistance;
      const newScale = touchState.initialScale * scaleChange;
      
      setZoom(newScale);
      e.preventDefault();
    }
  }, [touchState, setZoom]);

  const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setTouchState(null);
    }
  }, []);

  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    // Only zoom when Ctrl/Cmd key is pressed (standard zoom gesture)
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05; // Zoom out or in
      const newScale = scale * zoomFactor;
      
      setZoom(newScale);
    }
  }, [scale, setZoom]);
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
    <div 
      className="min-h-screen bg-gray-100 p-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ touchAction: 'none' }}
    >
      <div 
        className="max-w-[1920px] max-h-[1200px] mx-auto h-screen flex flex-col space-y-4"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          transition: touchState?.isZooming ? 'none' : 'transform 0.2s ease-out'
        }}
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