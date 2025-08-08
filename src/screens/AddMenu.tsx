import React from 'react';
import { useAddMenuLogic } from './AddMenu_Logic';
import AddMenuUI from './AddMenu_UI';

const AddMenu: React.FC = () => {
  const {
    isVisible,
    menuName,
    category,
    price,
    imageUrl,
    availableCategories,
    handleMenuNameChange,
    handleCategoryChange,
    handlePriceChange,
    handleImageChange,
    handleSaveClick,
    handleCancelClick
  } = useAddMenuLogic();

  return (
    <AddMenuUI
      isVisible={isVisible}
      menuName={menuName}
      category={category}
      price={price}
      imageUrl={imageUrl}
      categories={availableCategories}
      onMenuNameChange={handleMenuNameChange}
      onCategoryChange={handleCategoryChange}
      onPriceChange={handlePriceChange}
      onImageChange={handleImageChange}
      onSaveClick={handleSaveClick}
      onCancelClick={handleCancelClick}
    />
  );
};

export default AddMenu;