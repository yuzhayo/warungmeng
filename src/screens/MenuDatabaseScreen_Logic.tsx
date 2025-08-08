import { useState, useEffect } from 'react';
import { useConfirmationScreenLogic } from './Confirmation_Screen_Logic';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
}

interface Category {
  id: string;
  label: string;
}
export const useMenuDatabaseScreenLogic = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isEditVisible, setIsEditVisible] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editMenuName, setEditMenuName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [swipeStartX, setSwipeStartX] = useState<number>(0);
  const [swipeStartY, setSwipeStartY] = useState<number>(0);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [lastTappedItem, setLastTappedItem] = useState<string | null>(null);

  const {
    isVisible: isConfirmationVisible,
    title: confirmationTitle,
    message: confirmationMessage,
    showConfirmation,
    handleConfirmClick,
    handleCancelClick
  } = useConfirmationScreenLogic();

  // Load menu items from localStorage
  useEffect(() => {
    loadMenuItems();
    loadCategories();
    
    // Listen for menu updates and database refresh events
    const handleMenuUpdate = () => {
      loadMenuItems();
    };

    const handleDatabaseRefresh = (event: CustomEvent) => {
      if (event.detail.screen === 'menu') {
        console.log('Refreshing menu items from database refresh event');
        loadMenuItems();
        loadCategories();
      }
    };

    window.addEventListener('menuUpdated', handleMenuUpdate);
    window.addEventListener('databaseRefresh', handleDatabaseRefresh as EventListener);

    return () => {
      window.removeEventListener('menuUpdated', handleMenuUpdate);
      window.removeEventListener('databaseRefresh', handleDatabaseRefresh as EventListener);
    };
  }, []);

  const loadMenuItems = () => {
    const savedMenuItems = localStorage.getItem('menuItems');
    if (savedMenuItems) {
      try {
        const parsedItems = JSON.parse(savedMenuItems);
        setMenuItems(parsedItems);
      } catch (error) {
        console.error('Error parsing menu items:', error);
        initializeDefaultMenu();
      }
    } else {
      initializeDefaultMenu();
    }
  };

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
  const initializeDefaultMenu = () => {
    const defaultMenu: MenuItem[] = [
      { id: 'item1', name: 'Espresso', price: 2.50, category: 'Beverages', description: 'Rich and bold coffee shot', imageUrl: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' },
      { id: 'item2', name: 'Cappuccino', price: 3.75, category: 'Beverages', description: 'Espresso with steamed milk foam', imageUrl: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' },
      { id: 'item3', name: 'Latte', price: 4.25, category: 'Beverages', description: 'Espresso with steamed milk', imageUrl: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' },
      { id: 'item4', name: 'Club Sandwich', price: 8.99, category: 'Food', description: 'Triple-layer sandwich with bacon', imageUrl: 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' },
      { id: 'item5', name: 'Caesar Salad', price: 7.50, category: 'Food', description: 'Fresh romaine with parmesan', imageUrl: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' },
      { id: 'item6', name: 'Chocolate Cake', price: 5.25, category: 'Desserts', description: 'Rich chocolate layer cake', imageUrl: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' }
    ];
    setMenuItems(defaultMenu);
    localStorage.setItem('menuItems', JSON.stringify(defaultMenu));
  };

  const handleMenuItemClick = (menuItem: MenuItem) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastTapTime;
    
    // Double tap detection (within 300ms)
    if (timeDiff < 300 && lastTappedItem === menuItem.id) {
      // Double tap detected - toggle selection
      setSelectedMenuItem(selectedMenuItem?.id === menuItem.id ? null : menuItem);
      setLastTapTime(0);
      setLastTappedItem(null);
    } else {
      // First tap - just record the time and item
      setLastTapTime(currentTime);
      setLastTappedItem(menuItem.id);
    }
  };


  const handleHoldStart = (menuItem: MenuItem, e: React.TouchEvent | React.MouseEvent) => {
    const timer = setTimeout(() => {
      // Start edit mode
      setEditingItem(menuItem);
      setEditMenuName(menuItem.name);
      setEditCategory(menuItem.category);
      setEditPrice(menuItem.price.toString());
      setEditImageUrl(menuItem.imageUrl || '');
      setIsEditVisible(true);
      console.log('Hold gesture detected - opening edit mode for:', menuItem.name);
    }, 800); // 800ms hold time
    setHoldTimer(timer);
  };

  const handleHoldEnd = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  };

  const handleSwipeLeft = (menuItem: MenuItem, deltaX: number) => {
    if (deltaX < -50) { // Swipe left threshold - match UI threshold
      console.log('Swipe left detected - requesting delete for:', menuItem.name);
      showConfirmation(
        'Delete Menu Item',
        `Are you sure you want to delete "${menuItem.name}"?`,
        () => confirmDeleteMenuItem(menuItem.id),
        () => console.log('Delete cancelled')
      );
    } else {
      console.log('Swipe left not strong enough:', deltaX, 'for item:', menuItem.name);
    }
  };

  const confirmDeleteMenuItem = (itemId: string) => {
    const updatedMenuItems = menuItems.filter(item => item.id !== itemId);
    setMenuItems(updatedMenuItems);
    localStorage.setItem('menuItems', JSON.stringify(updatedMenuItems));
    
    // Clear selection if deleted item was selected
    if (selectedMenuItem?.id === itemId) {
      setSelectedMenuItem(null);
    }
    
    // Dispatch event to refresh menu screen
    window.dispatchEvent(new Event('menuUpdated'));
    
    console.log('Menu item deleted:', itemId);
  };

  const handleEditMenuNameChange = (name: string) => {
    setEditMenuName(name);
  };

  const handleEditCategoryChange = (category: string) => {
    setEditCategory(category);
  };

  const handleEditPriceChange = (price: string) => {
    setEditPrice(price);
  };

  const handleEditImageChange = (imageUrl: string) => {
    setEditImageUrl(imageUrl);
  };

  const handleSaveEdit = () => {
    if (editingItem && editMenuName.trim() && editCategory.trim() && editPrice.trim() && parseFloat(editPrice) > 0) {
      const updatedMenuItem: MenuItem = {
        ...editingItem,
        name: editMenuName.trim(),
        category: editCategory.trim(),
        price: parseFloat(editPrice),
        description: `${editMenuName.trim()} - ${editCategory.trim()}`,
        imageUrl: editImageUrl || undefined
      };

      const updatedMenuItems = menuItems.map(item => 
        item.id === editingItem.id ? updatedMenuItem : item
      );
      
      setMenuItems(updatedMenuItems);
      localStorage.setItem('menuItems', JSON.stringify(updatedMenuItems));
      
      // Update selected item if it was the one being edited
      if (selectedMenuItem?.id === editingItem.id) {
        setSelectedMenuItem(updatedMenuItem);
      }
      
      // Dispatch event to refresh menu screen
      window.dispatchEvent(new Event('menuUpdated'));
      
      console.log('Menu item updated:', updatedMenuItem);
      handleCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    setIsEditVisible(false);
    setEditingItem(null);
    setEditMenuName('');
    setEditCategory('');
    setEditPrice('');
    setEditImageUrl('');
  };
  return {
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
  };
};