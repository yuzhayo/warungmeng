import { useState, useEffect } from 'react';

interface Category {
  id: string;
  label: string;
}

export const useAddCategoryLogic = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      try {
        const parsedCategories = JSON.parse(savedCategories);
        setCategories(parsedCategories);
      } catch (error) {
        console.error('Error parsing saved categories:', error);
        // Initialize with default categories if parsing fails
        const defaultCategories = [
          { id: 'categoryA', label: 'Category A' },
          { id: 'categoryB', label: 'Category B' }
        ];
        setCategories(defaultCategories);
        localStorage.setItem('categories', JSON.stringify(defaultCategories));
      }
    } else {
      // Initialize with default categories
      const defaultCategories = [
        { id: 'categoryA', label: 'Category A' },
        { id: 'categoryB', label: 'Category B' }
      ];
      setCategories(defaultCategories);
      localStorage.setItem('categories', JSON.stringify(defaultCategories));
    }
  }, []);

  const showAddCategoryScreen = () => {
    setIsVisible(true);
    setNewCategoryName('');
  };

  const hideAddCategoryScreen = () => {
    setIsVisible(false);
    setNewCategoryName('');
  };

  const handleCategoryNameChange = (name: string) => {
    setNewCategoryName(name);
  };

  const handleYesClick = () => {
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: `category${Date.now()}`, // Generate unique ID
        label: newCategoryName.trim()
      };
      
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      
      // Save to localStorage
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      
      console.log('New category saved:', newCategory);
    }
    hideAddCategoryScreen();
  };

  const handleNoClick = () => {
    hideAddCategoryScreen();
  };

  return {
    isVisible,
    newCategoryName,
    categories,
    setCategories,
    showAddCategoryScreen,
    handleCategoryNameChange,
    handleYesClick,
    handleNoClick
  };
};