import React from 'react';
import { useMenuDatabaseScreenLogic } from './MenuDatabaseScreen_Logic';
import MenuDatabaseScreenUI from './MenuDatabaseScreen_UI';
import ConfirmationScreenUI from './Confirmation_Screen_UI';
import EditMenuUI from './EditMenu_UI';

const MenuDatabaseScreen: React.FC = () => {
  const {
    menuItems,
    selectedMenuItem,
    isEditVisible,
    editingItem,
    editMenuName,
    editCategory,
    editPrice,
    editImageUrl,
    availableCategories,
    isConfirmationVisible,
    confirmationTitle,
    confirmationMessage,
    handleMenuItemClick,
    handleHoldStart,
    handleHoldEnd,
    handleSwipeLeft,
    handleEditMenuNameChange,
    handleEditCategoryChange,
    handleEditPriceChange,
    handleEditImageChange,
    handleSaveEdit,
    handleCancelEdit,
    handleConfirmClick,
    handleCancelClick
  } = useMenuDatabaseScreenLogic();

  return (
    <>
      <MenuDatabaseScreenUI
        menuItems={menuItems}
        selectedMenuItem={selectedMenuItem}
        onMenuItemClick={handleMenuItemClick}
        onHoldStart={handleHoldStart}
        onHoldEnd={handleHoldEnd}
        onSwipeLeft={handleSwipeLeft}
      />
      
      <EditMenuUI
        isVisible={isEditVisible}
        menuName={editMenuName}
        category={editCategory}
        price={editPrice}
        imageUrl={editImageUrl}
        categories={availableCategories}
        onMenuNameChange={handleEditMenuNameChange}
        onCategoryChange={handleEditCategoryChange}
        onPriceChange={handleEditPriceChange}
        onImageChange={handleEditImageChange}
        onSaveClick={handleSaveEdit}
        onCancelClick={handleCancelEdit}
      />
      
      <ConfirmationScreenUI
        isVisible={isConfirmationVisible}
        title={confirmationTitle}
        message={confirmationMessage}
        onConfirmClick={handleConfirmClick}
        onCancelClick={handleCancelClick}
      />
    </>
  );
};

export default MenuDatabaseScreen;