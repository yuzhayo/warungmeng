import React from 'react';
import { ShoppingCart, Menu } from 'lucide-react';
import AddCategoryUI from './Add_Category_UI';
import MenuScreen from './MenuScreen';
import TransactionScreen from './TransactionScreen';

interface Category {
  id: string;
  label: string;
}

interface HomeTabUIProps {
  data: string;
  onHomeAction: (itemId?: string) => void;
  onCartClick: () => void;
  isAllExpanded: boolean;
  selectedCategory: string | null;
  categories: Category[];
  onAllClick: () => void;
  onCategoryClick: (category: string) => void;
  onAllMouseDown: () => void;
  onAllMouseUp: () => void;
  isAddCategoryVisible: boolean;
  newCategoryName: string;
  onCategoryNameChange: (name: string) => void;
  onYesClick: () => void;
  onNoClick: () => void;
  activeScreen: string;
  onBackToHome: () => void;
}

const HomeTabUI: React.FC<HomeTabUIProps> = ({ 
  data, 
  onHomeAction, 
  onCartClick,
  isAllExpanded, 
  selectedCategory, 
  categories,
  onAllClick, 
  onCategoryClick,
  onAllMouseDown,
  onAllMouseUp,
  isAddCategoryVisible,
  newCategoryName,
  onCategoryNameChange,
  onYesClick,
  onNoClick,
  activeScreen,
  onBackToHome
}) => {
  // Get invoice visibility state from localStorage or context if needed
  const [isInvoiceVisible, setIsInvoiceVisible] = React.useState(false);
  const [cartItemCount, setCartItemCount] = React.useState(0);

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

    const handleCartUpdate = () => {
      const cartItems = localStorage.getItem('cartItems');
      if (cartItems) {
        try {
          const items = JSON.parse(cartItems);
          const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartItemCount(totalItems);
        } catch (error) {
          console.error('Error parsing cart items:', error);
          setCartItemCount(0);
        }
      } else {
        setCartItemCount(0);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('invoiceToggle', handleInvoiceToggle);
    window.addEventListener('cartUpdated', handleCartUpdate);
    handleStorageChange(); // Check initial state
    handleCartUpdate(); // Check initial cart state

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('invoiceToggle', handleInvoiceToggle);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Dispatch cart position ready event
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const cartButton = document.getElementById('cart-button');
      if (cartButton) {
        const targetRect = cartButton.getBoundingClientRect();
        const cartPositionEvent = new CustomEvent('cartPositionReady', {
          detail: { targetRect }
        });
        window.dispatchEvent(cartPositionEvent);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isInvoiceVisible]);

  const staticMenuItems = [
    { id: 'addMenu', label: 'ADD MENU' },
    { id: 'transaction', label: 'Transaction' }
  ];

  const handleMenuClick = (itemId: string) => {
    console.log(`Menu item clicked: ${itemId}`);
    onHomeAction(itemId);
  };

  const renderAllButton = () => {
    if (selectedCategory) {
      const selectedCat = categories.find(cat => cat.id === selectedCategory);
      return (
        <button
          onClick={onAllClick}
          onMouseDown={onAllMouseDown}
          onMouseUp={onAllMouseUp}
          onMouseLeave={onAllMouseUp}
          onTouchStart={onAllMouseDown}
          onTouchEnd={onAllMouseUp}
          className="bg-gray-600 text-white hover:bg-gray-500 px-4 py-2 rounded-md font-medium transition-colors duration-200 min-w-[100px] text-sm whitespace-nowrap border border-gray-500"
        >
          {selectedCat?.label}
        </button>
      );
    }
    
    return (
      <button
        onClick={onAllClick}
        onMouseDown={onAllMouseDown}
        onMouseUp={onAllMouseUp}
        onMouseLeave={onAllMouseUp}
        onTouchStart={onAllMouseDown}
        onTouchEnd={onAllMouseUp}
        className="bg-gray-600 text-white hover:bg-gray-500 px-4 py-2 rounded-md font-medium transition-all duration-300 ease-in-out min-w-[100px] text-sm whitespace-nowrap border border-gray-500 transform hover:scale-105"
      >
        ALL
      </button>
    );
  };

  // Render content based on active screen
  const renderContent = () => {
    switch (activeScreen) {
      case 'menu':
        return <MenuScreen />;
      case 'transaction':
        return <TransactionScreen />;
      default:
        // Default to menu screen instead of welcome message
        return <MenuScreen />;
    }
  };

  return (
    <div className="flex flex-col space-y-4 transition-all duration-300 ease-in-out w-full">
      {/* Navigation Header - Always Visible */}
      <div 
        className="flex-shrink-0 h-20 bg-main-gray rounded-lg shadow-custom flex items-center justify-between px-6"
      >
        {/* Left-aligned menu buttons */}
        <div className="flex items-center space-x-4">
          {/* Static menu items */}
          {staticMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className="bg-gray-600 text-white hover:bg-gray-500 px-4 py-2 rounded-md font-medium transition-all duration-300 ease-in-out min-w-[100px] text-sm whitespace-nowrap border border-gray-500"
            >
              {item.label}
            </button>
          ))}
          
          {/* ALL button with dynamic behavior */}
          {renderAllButton()}
          
          {/* Category buttons - only show when ALL is expanded and no category is selected */}
          <div className={`flex items-center space-x-4 transition-all duration-300 ease-in-out ${
            isAllExpanded && !selectedCategory 
              ? 'opacity-100 max-w-full transform translate-x-0' 
              : 'opacity-0 max-w-0 overflow-hidden transform -translate-x-4'
          }`}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className="bg-gray-600 text-white hover:bg-gray-500 px-4 py-2 rounded-md font-medium transition-all duration-300 ease-in-out min-w-[100px] text-sm whitespace-nowrap border border-gray-500 transform hover:scale-105"
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right-aligned Cart button */}
        <div className="relative">
          <button
            id="cart-button"
            onClick={onCartClick}
            className="flex items-center space-x-2 bg-gray-600 text-white hover:bg-gray-500 px-4 py-2 rounded-md font-medium transition-all duration-300 ease-in-out min-w-[80px] text-sm border border-gray-500 transform hover:scale-105"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>CART</span>
          </button>
          {cartItemCount > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Dynamic Content Area */}
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>

      {/* Add Category Modal */}
      <AddCategoryUI
        isVisible={isAddCategoryVisible}
        newCategoryName={newCategoryName}
        onCategoryNameChange={onCategoryNameChange}
        onYesClick={onYesClick}
        onNoClick={onNoClick}
      />
    </div>
  );
};

export default HomeTabUI;