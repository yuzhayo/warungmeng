import React from 'react';
import { useMenuScreenLogic } from './MenuScreen_Logic';
import MenuScreenUI from './MenuScreen_UI';

const MenuScreen: React.FC = () => {
  const {
    menuItems,
    selectedItems,
    handleMenuItemClick,
    handleAddToCart,
    handleBackClick
  } = useMenuScreenLogic();

  return (
    <MenuScreenUI
      menuItems={menuItems}
      selectedItems={selectedItems}
      onMenuItemClick={handleMenuItemClick}
      onAddToCart={handleAddToCart}
      onBackClick={handleBackClick}
    />
  );
};

export default MenuScreen;