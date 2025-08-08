import { useState, useEffect } from 'react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
}

export const useMenuScreenLogic = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: number}>({});

  // Load menu items from localStorage or initialize with sample data
  useEffect(() => {
    const handleMenuUpdate = () => {
      loadMenuItems();
    };

    window.addEventListener('menuUpdated', handleMenuUpdate);
    const savedMenuItems = localStorage.getItem('menuItems');
    loadMenuItems();

    return () => {
      window.removeEventListener('menuUpdated', handleMenuUpdate);
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

  const handleMenuItemClick = (itemId: string, e: React.MouseEvent<HTMLDivElement>) => {
    // Get the source rectangle for animation
    const sourceRect = e.currentTarget.getBoundingClientRect();
    
    // Find the menu item
    const menuItem = menuItems.find(item => item.id === itemId);
    if (menuItem) {
      const cartItem = {
        id: itemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        category: menuItem.category
      };

      // Get existing cart items
      const existingCart = localStorage.getItem('cartItems');
      let currentCart = [];
      
      if (existingCart) {
        try {
          currentCart = JSON.parse(existingCart);
        } catch (error) {
          console.error('Error parsing existing cart:', error);
        }
      }

      // Check if item already exists in cart
      const existingItemIndex = currentCart.findIndex(item => item.id === itemId);
      if (existingItemIndex >= 0) {
        // Increase quantity if item exists
        currentCart[existingItemIndex].quantity += 1;
      } else {
        // Add new item to cart
        currentCart.push(cartItem);
      }

      localStorage.setItem('cartItems', JSON.stringify(currentCart));
      console.log('Item added to cart:', cartItem);
      
      // Update selected items for visual feedback
      setSelectedItems(prev => ({
        ...prev,
        [itemId]: (prev[itemId] || 0) + 1
      }));
      
      // Dispatch event to update cart badge
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Dispatch animation event with source rectangle
      const animationEvent = new CustomEvent('itemAddedToCartAnimation', {
        detail: { sourceRect }
      });
      window.dispatchEvent(animationEvent);
    }
  };

  const handleAddToCart = () => {
    // This function is no longer needed but kept for compatibility
    console.log('Add to cart function called');
  };

  const handleBackClick = () => {
    console.log('Back button clicked from menu screen');
    // This will be handled by the parent component to hide the menu screen
  };

  return {
    menuItems,
    selectedItems,
    handleMenuItemClick,
    handleAddToCart,
    handleBackClick
  };
};