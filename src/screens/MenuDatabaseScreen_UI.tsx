import React from 'react';
import { Coffee, DollarSign, Tag, AlertCircle } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface MenuDatabaseScreenUIProps {
  menuItems: MenuItem[];
  selectedMenuItem: MenuItem | null;
  onMenuItemClick: (menuItem: MenuItem) => void;
  onHoldStart: (menuItem: MenuItem, e: React.TouchEvent | React.MouseEvent) => void;
  onHoldEnd: () => void;
  onSwipeLeft: (menuItem: MenuItem, deltaX: number) => void;
}

const MenuDatabaseScreenUI: React.FC<MenuDatabaseScreenUIProps> = ({
  menuItems,
  selectedMenuItem,
  onMenuItemClick,
  onHoldStart,
  onHoldEnd,
  onSwipeLeft
}) => {
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent, menuItem: MenuItem) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(false);
    onHoldStart(menuItem, e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // If significant movement, consider it a drag
    if (Math.abs(deltaY) > 20) { // Only cancel on significant vertical movement
      setIsDragging(true);
      onHoldEnd(); // Cancel hold gesture if dragging
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, menuItem: MenuItem) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    onHoldEnd();
    
    console.log('Touch end - deltaX:', deltaX, 'deltaY:', deltaY, 'for item:', menuItem.name);
    
    // Check for swipe left gesture
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < -50) {
      console.log('Swipe left gesture detected, calling onSwipeLeft');
      onSwipeLeft(menuItem, deltaX);
    } else if (!isDragging && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      // Regular tap
      onMenuItemClick(menuItem);
    } else {
      console.log('No gesture detected - deltaX:', deltaX, 'deltaY:', deltaY, 'isDragging:', isDragging);
    }
    
    setTouchStart(null);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent, menuItem: MenuItem) => {
    onHoldStart(menuItem, e);
  };

  const handleMouseUp = () => {
    onHoldEnd();
  };

  const handleMouseLeave = () => {
    onHoldEnd();
  };
  return (
    <div className="w-full h-full bg-main-gray rounded-lg shadow-custom overflow-hidden">

      {/* Content */}
      <div className="p-6 h-full overflow-y-auto">
        {menuItems.length === 0 ? (
          <div className="text-center text-white text-lg opacity-80 mt-20">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No menu items found</p>
            <p className="text-sm mt-2">Menu items will appear here once they are created</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-4 font-semibold text-gray-700">
                <div className="flex items-center space-x-2">
                  <Coffee className="w-4 h-4" />
                  <span>Name</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>Category</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Price</span>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {menuItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors duration-200 select-none cursor-pointer touch-pan-y ${
                    selectedMenuItem?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onTouchStart={(e) => handleTouchStart(e, item)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e) => handleTouchEnd(e, item)}
                  onMouseDown={(e) => handleMouseDown(e, item)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => !isDragging && onMenuItemClick(item)}
                  style={{ touchAction: 'pan-y' }}
                >
                  <div className="grid grid-cols-3 gap-4 items-center">
                    {/* Name */}
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </div>

                    {/* Price */}
                    <div>
                      <span className="text-lg font-semibold text-green-600">
                        {Math.round(item.price).toLocaleString('de-DE')}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedMenuItem?.id === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3">Item Details:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">ID:</span>
                              <span className="text-gray-800 font-mono">{item.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="text-gray-800">{item.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <span className="text-gray-800">{item.category}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Price:</span>
                              <span className="text-gray-800 font-semibold">{Math.round(item.price).toLocaleString('de-DE')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className="text-green-600 font-medium">Available</span>
                            </div>
                            {item.description && (
                              <div>
                                <span className="text-gray-600">Description:</span>
                                <p className="text-gray-800 mt-1">{item.description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-300">
                        <div className="text-xs text-gray-500 text-center">
                          <div className="flex justify-center space-x-4">
                            <span>Double tap: View details</span>
                            <span>Hold: Edit</span>
                            <span>Swipe ←: Delete</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="mt-4 text-center text-white text-sm opacity-70">
          <div className="flex justify-center space-x-6">
            <span>Double tap: View details</span>
            <span>Hold: Edit item</span>
            <span>Swipe ←: Delete item</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuDatabaseScreenUI;