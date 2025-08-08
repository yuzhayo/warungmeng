import { useState } from 'react';
import { useAddCategoryLogic } from './Add_Category_Logic';
import { useConfirmationScreenLogic } from './Confirmation_Screen_Logic';
import { useInvoiceScreenLogic } from './Invoice_Screen_Logic';

interface Category {
  id: string;
  label: string;
}

export const useHomeTabLogic = () => {
  const [data, setData] = useState<string>('Ready for menu interactions');
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [activeScreen, setActiveScreen] = useState<string>('menu'); // Default to menu screen
  
  const {
    isVisible: isAddCategoryVisible,
    newCategoryName,
    categories,
    setCategories,
    showAddCategoryScreen,
    handleCategoryNameChange,
    handleYesClick,
    handleNoClick
  } = useAddCategoryLogic();

  const {
    isVisible: isConfirmationVisible,
    title: confirmationTitle,
    message: confirmationMessage,
    showConfirmation,
    handleConfirmClick,
    handleCancelClick
  } = useConfirmationScreenLogic();

  const {
    isVisible: isInvoiceVisible,
    taxRate,
    isEditingTax,
    editTaxRate,
    handleTaxHoldStart,
    handleTaxHoldEnd,
    handleTaxRateChange,
    handleSaveTaxRate,
    handleCancelTaxEdit,
    showInvoiceScreen,
    hideInvoiceScreen
  } = useInvoiceScreenLogic();

  const handleHomeAction = (itemId?: string) => {
    console.log(`Home menu action triggered: ${itemId}`);
    
    // Handle screen navigation based on button clicks
    if (itemId === 'addMenu') {
      // Dispatch event to show AddMenu screen
      window.dispatchEvent(new CustomEvent('showAddMenu'));
      setData('Add Menu screen active');
    } else if (itemId === 'transaction') {
      setActiveScreen('transaction');
      setData('Transaction screen active');
    } else if (itemId === 'all') {
      setActiveScreen('menu');
      setData('Menu screen active');
    } else {
      setActiveScreen('menu');
      setData('Menu item selected');
    }
  };

  const handleCartClick = () => {
    console.log('Cart button clicked - showing invoice screen');
    // Toggle invoice screen visibility
    if (isInvoiceVisible) {
      hideInvoiceScreen();
    } else {
      showInvoiceScreen();
    }
  };

  const handleAllClick = () => {
    // Navigate to menu screen when ALL button is clicked
    setActiveScreen('menu');
    setData('Menu screen active');
    
    if (selectedCategory) {
      // If a category is selected, expand to show ALL + categories
      setSelectedCategory(null);
      setIsAllExpanded(true);
    } else {
      // Toggle expand/collapse
      setIsAllExpanded(!isAllExpanded);
    }
    handleHomeAction('all');
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setIsAllExpanded(false);
    // Also navigate to menu screen when category is clicked
    setActiveScreen('menu');
    setData('Menu screen active - Category: ' + category);
    handleHomeAction(category);
  };

  const handleAllMouseDown = () => {
    if (selectedCategory) {
      // If a category is selected, hold to delete it
      const timer = setTimeout(() => {
        const categoryToDelete = categories.find(cat => cat.id === selectedCategory);
        if (categoryToDelete) {
          showConfirmation(
            'Delete Category',
            `Are you sure you want to delete "${categoryToDelete.label}"?`,
            () => handleDeleteCategory(selectedCategory),
            () => console.log('Delete cancelled')
          );
        }
      }, 800); // 800ms hold time
      setHoldTimer(timer);
    } else {
      // If no category is selected, hold to add new category
      const timer = setTimeout(() => {
        showAddCategoryScreen(); 
      }, 800); // 800ms hold time
      setHoldTimer(timer);
    }
  };

  const handleAllMouseUp = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);
    
    // Save to localStorage
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    
    // Reset selected category
    setSelectedCategory(null);
    setIsAllExpanded(true);
    
    console.log('Category deleted:', categoryId);
  };

  const handleBackToHome = () => {
    setActiveScreen('menu'); // Changed from 'home' to 'menu'
    setData('Ready for menu interactions');
  };

  return {
    data,
    handleHomeAction,
    handleCartClick,
    isAllExpanded,
    selectedCategory,
    categories,
    handleAllClick,
    handleCategoryClick,
    handleAllMouseDown,
    handleAllMouseUp,
    isAddCategoryVisible,
    newCategoryName,
    handleCategoryNameChange,
    handleYesClick,
    handleNoClick,
    isConfirmationVisible,
    confirmationTitle,
    confirmationMessage,
    handleConfirmClick,
    handleCancelClick,
    isInvoiceVisible,
    activeScreen,
    handleBackToHome,
    taxRate,
    isEditingTax,
    editTaxRate,
    handleTaxHoldStart,
    handleTaxHoldEnd,
    handleTaxRateChange,
    handleSaveTaxRate,
    handleCancelTaxEdit
  };
};