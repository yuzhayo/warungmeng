import React from 'react';
import { useAddCategoryLogic } from './Add_Category_Logic';
import AddCategoryUI from './Add_Category_UI';

const AddCategory: React.FC = () => {
  const {
    isVisible,
    newCategoryName,
    handleCategoryNameChange,
    handleYesClick,
    handleNoClick
  } = useAddCategoryLogic();

  return (
    <AddCategoryUI
      isVisible={isVisible}
      newCategoryName={newCategoryName}
      onCategoryNameChange={handleCategoryNameChange}
      onYesClick={handleYesClick}
      onNoClick={handleNoClick}
    />
  );
};

export default AddCategory;