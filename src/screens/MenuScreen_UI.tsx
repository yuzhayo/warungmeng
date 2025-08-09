import React from 'react';
import { ArrowLeft, Plus, ShoppingCart } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
}

interface MenuScreenUIProps {
  menuItems: MenuItem[];
  selectedItems: {[key: string]: number};
  onMenuItemClick: (itemId: string, e: React.MouseEvent<HTMLDivElement>) => void;
  onAddToCart: () => void;
  onBackClick: () => void;
}

const MenuScreenUI: React.FC<MenuScreenUIProps> = ({
  menuItems,
  selectedItems,
  onMenuItemClick,
  onAddToCart,
  onBackClick
}) => {
  const totalSelectedItems = Object.values(selectedItems).reduce((sum, quantity) => sum + quantity, 0);

  return (
    <div className="w-full h-full bg-main-gray rounded-lg shadow-custom overflow-hidden">

      {/* Menu Items Grid */}
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex flex-wrap gap-4 justify-start">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={(e) => onMenuItemClick(item.id, e)}
              className="bg-menu-item-gradient rounded-md shadow-custom cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex flex-col w-[200px] h-[200px] flex-shrink-0"
            >
              {/* Image Placeholder */}
              <div 
                className="rounded-lg mx-1 mt-1 mb-2 flex-shrink-0"
                style={{
                  width: '194.29px',
                  height: '114.29px',
                  background: 'linear-gradient(180deg, #ffffff 46.37%, #e2e2e2 100%)'
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
              </div>
              
              {/* Menu Name */}
              <div 
                className="flex items-center justify-center text-center font-normal text-4xl leading-tight whitespace-nowrap overflow-hidden text-ellipsis px-1"
                style={{
                  width: '194.29px',
                  height: '28.57px',
                  fontFamily: 'Inter, sans-serif',
                  color: '#b5acac',
                  fontSize: '19px',
                  lineHeight: '22px'
                }}
              >
                {item.name}
              </div>
              
              {/* Menu Price */}
              <div 
                className="flex items-center justify-center text-center font-normal text-4xl leading-tight whitespace-nowrap px-1 mt-2"
                style={{
                  width: '194.29px',
                  height: '28.57px',
                  fontFamily: 'Inter, sans-serif',
                  color: '#b5acac',
                  fontSize: '19px',
                  lineHeight: '22px'
                }}
              >
                {Math.round(item.price).toLocaleString('de-DE')}
              </div>
            </div>
          ))}
        </div>
        
        {menuItems.length === 0 && (
          <div className="text-center text-white text-lg opacity-80 mt-20">
            No menu items available
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuScreenUI;