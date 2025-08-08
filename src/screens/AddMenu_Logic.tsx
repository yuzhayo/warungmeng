import { useState, useEffect } from 'react';

interface Category {
  id: string;
  label: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

export const useAddMenuLogic = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [menuName, setMenuName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  // Listen for show AddMenu event
  useEffect(() => {
    const handleShowAddMenu = () => {
      showAddMenuScreen();
    };

    window.addEventListener('showAddMenu', handleShowAddMenu);

    return () => {
      window.removeEventListener('showAddMenu', handleShowAddMenu);
    };
  }, []);

  // Load categories from localStorage when component mounts or becomes visible
  useEffect(() => {
    if (isVisible) {
      loadCategories();
    }
  }, [isVisible]);

  const loadCategories = () => {
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      try {
        const parsedCategories = JSON.parse(savedCategories);
        setAvailableCategories(parsedCategories);
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
      { id: 'beverages', label: 'Beverages' },
      { id: 'food', label: 'Food' },
      { id: 'desserts', label: 'Desserts' }
    ];
    setAvailableCategories(defaultCategories);
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
  };

  const showAddMenuScreen = () => {
    setIsVisible(true);
    setMenuName('');
    setCategory('');
    setPrice('');
    setImageUrl('');
  };

  const hideAddMenuScreen = () => {
    setIsVisible(false);
    setMenuName('');
    setCategory('');
    setPrice('');
    setImageUrl('');
  };

  const handleMenuNameChange = (name: string) => {
    setMenuName(name);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
  };

  const handlePriceChange = (priceValue: string) => {
    setPrice(priceValue);
  };

  const handleImageChange = (image: string) => {
    setImageUrl(image);
  };

  const handleSaveClick = () => {
    if (menuName.trim() && category.trim() && price.trim() && parseFloat(price) > 0) {
      const newMenuItem: MenuItem = {
        id: `menu_${Date.now()}`,
        name: menuName.trim(),
        price: parseFloat(price),
        category: category.trim(),
        description: `${menuName.trim()} - ${category.trim()}`,
        imageUrl: imageUrl || undefined
      };

      // Get existing menu items
      const existingMenuItems = localStorage.getItem('menuItems');
      let currentMenuItems: MenuItem[] = [];
      
      if (existingMenuItems) {
        try {
          currentMenuItems = JSON.parse(existingMenuItems);
        } catch (error) {
          console.error('Error parsing existing menu items:', error);
        }
      }

      // Add new menu item
      currentMenuItems.push(newMenuItem);
      
      // Save to localStorage
      localStorage.setItem('menuItems', JSON.stringify(currentMenuItems));
      
      console.log('New menu item saved:', newMenuItem);
      
      // Hide the screen
      hideAddMenuScreen();
      
      // Dispatch event to refresh menu screen
      window.dispatchEvent(new Event('menuUpdated'));
    }
  };

  const handleCancelClick = () => {
    hideAddMenuScreen();
  };

  return {
    isVisible,
    menuName,
    category,
    price,
    imageUrl,
    availableCategories,
    showAddMenuScreen,
    hideAddMenuScreen,
    handleMenuNameChange,
    handleCategoryChange,
    handlePriceChange,
    handleImageChange,
    handleSaveClick,
    handleCancelClick
  };
};