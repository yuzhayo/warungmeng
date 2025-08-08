import React from 'react';
import { useCategoryScreenLogic } from './CategoryScreen_Logic';
import CategoryScreenUI from './CategoryScreen_UI';
import ConfirmationScreenUI from './Confirmation_Screen_UI';

const CategoryScreen: React.FC = () => {
  const {
    categories,
    selectedCategory,
    isConfirmationVisible,
    confirmationTitle,
    confirmationMessage,
    handleCategoryClick,
    handleDeleteCategory,
    handleConfirmClick,
    handleCancelClick
  } = useCategoryScreenLogic();

  return (
    <>
      <CategoryScreenUI
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryClick={handleCategoryClick}
        onDeleteCategory={handleDeleteCategory}
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

export default CategoryScreen;