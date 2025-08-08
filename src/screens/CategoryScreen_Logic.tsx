import { useState, useEffect } from 'react';
import { useConfirmationScreenLogic } from './Confirmation_Screen_Logic';

interface Category {
  id: string;
  label: string;
  createdAt?: string;
  itemCount?: number;
}

export const useCategoryScreenLogic = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const {
    isVisible: isConfirmationVisible,
    title: confirmationTitle,
    message: confirmationMessage,
    showConfirmation,
    handleConfirmClick,
    handleCancelClick
  } = useConfirmationScreenLogic();

  // Load categories from localStorage
  useEffect(() => {
    loadCategories();
    
    // Listen for database refresh events
    const handleDatabaseRefresh = (event: CustomEvent) => {
      if (event.detail.screen === 'category') {
        console.log('Refreshing categories from database refresh event');
        loadCategories();
      }
    };

    window.addEventListener('databaseRefresh', handleDatabaseRefresh as EventListener);

    return () => {
      window.removeEventListener('databaseRefresh', handleDatabaseRefresh as EventListener);
    };
  }, []);

  const loadCategories = () => {
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      try {
        const parsedCategories = JSON.parse(savedCategories);
        // Add additional metadata for display
        const enrichedCategories = parsedCategories.map((cat: any) => ({
          ...cat,
          createdAt: cat.createdAt || new Date().toISOString(),
          itemCount: getItemCountForCategory(cat.id)
        }));
        setCategories(enrichedCategories);
      } catch (error) {
        console.error('Error parsing categories:', error);
        initializeDefaultCategories();
      }
    } else {
      initializeDefaultCategories();
    }
  };

  const initializeDefaultCategories = () => {
    const defaultCategories: Category[] = [
      { 
        id: 'categoryA', 
        label: 'Category A',
        createdAt: new Date().toISOString(),
        itemCount: 0
      },
      { 
        id: 'categoryB', 
        label: 'Category B',
        createdAt: new Date().toISOString(),
        itemCount: 0
      }
    ];
    
    setCategories(defaultCategories);
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
  };

  const getItemCountForCategory = (categoryId: string): number => {
    // Get menu items and count how many belong to this category
    const savedMenuItems = localStorage.getItem('menuItems');
    if (savedMenuItems) {
      try {
        const menuItems = JSON.parse(savedMenuItems);
        return menuItems.filter((item: any) => item.categoryId === categoryId).length;
      } catch (error) {
        console.error('Error counting category items:', error);
      }
    }
    return 0;
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(selectedCategory?.id === category.id ? null : category);
  };


  const handleDeleteCategory = (categoryId: string) => {
    const categoryToDelete = categories.find(cat => cat.id === categoryId);
    if (categoryToDelete) {
      showConfirmation(
        'Delete Category',
        `Are you sure you want to delete "${categoryToDelete.label}"?`,
        () => confirmDeleteCategory(categoryId),
        () => console.log('Delete cancelled')
      );
    }
  };

  const confirmDeleteCategory = (categoryId: string) => {
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    
    // Clear selection if deleted category was selected
    if (selectedCategory?.id === categoryId) {
      setSelectedCategory(null);
    }
    
    console.log('Category deleted:', categoryId);
  };

  return {
    categories,
    selectedCategory,
    isConfirmationVisible,
    confirmationTitle,
    confirmationMessage,
    handleCategoryClick,
    handleDeleteCategory,
    handleConfirmClick,
    handleCancelClick
  };
};