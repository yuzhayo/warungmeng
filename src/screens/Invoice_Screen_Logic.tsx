import { useState, useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export const useInvoiceScreenLogic = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0.08); // 8% default tax rate
  const [isEditingTax, setIsEditingTax] = useState<boolean>(false);
  const [editTaxRate, setEditTaxRate] = useState<string>('8');
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);

  // Load cart items from localStorage
  useEffect(() => {
    const loadCartItems = () => {
      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
        } catch (error) {
          console.error('Error parsing cart items:', error);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    };

    const handleCartUpdate = () => {
      loadCartItems();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    loadCartItems(); // Initial load

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Load tax rate from localStorage
  useEffect(() => {
    const savedTaxRate = localStorage.getItem('taxRate');
    if (savedTaxRate) {
      try {
        const parsedTaxRate = parseFloat(savedTaxRate);
        if (parsedTaxRate >= 0 && parsedTaxRate <= 1) {
          setTaxRate(parsedTaxRate);
        }
      } catch (error) {
        console.error('Error parsing tax rate:', error);
      }
    }
  }, []);
  // Auto-show invoice when items are added to cart
  useEffect(() => {
    // Don't auto-show invoice, only show when cart button is clicked
  }, [cartItems.length]);

  // Original useEffect for sample data (removed)
  /*
  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing cart items:', error);
        setCartItems([]);
      }
    } else {
      // Initialize with sample data for demonstration
      const sampleItems: CartItem[] = [
        { id: '1', name: 'Coffee', price: 3.50, quantity: 2, category: 'Beverages' },
        { id: '2', name: 'Sandwich', price: 8.99, quantity: 1, category: 'Food' },
        { id: '3', name: 'Pastry', price: 4.25, quantity: 3, category: 'Food' }
      ];
      setCartItems(sampleItems);
      localStorage.setItem('cartItems', JSON.stringify(sampleItems));
    }
  }, []); */

  // Calculate totals whenever cart items change
  useEffect(() => {
    const newSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTax = newSubtotal * taxRate;
    const newTotal = newSubtotal + newTax;
    
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);

    // Auto-show invoice when items are added, auto-hide when cart becomes empty
    if (cartItems.length > 0 && !isVisible) {
      showInvoiceScreen();
    } else if (cartItems.length === 0 && isVisible) {
      hideInvoiceScreen();
    }
  }, [cartItems, isVisible, taxRate]);

  const showInvoiceScreen = () => {
    setIsVisible(true);
    localStorage.setItem('invoiceVisible', 'true');
    window.dispatchEvent(new Event('invoiceToggle'));
  };

  const hideInvoiceScreen = () => {
    setIsVisible(false);
    localStorage.setItem('invoiceVisible', 'false');
    window.dispatchEvent(new Event('invoiceToggle'));
  };

  const handlePrintInvoice = () => {
    console.log('Printing invoice...');
    window.print();
  };

  const handleSaveInvoice = () => {
    console.log('Saving invoice...');
    const invoiceData = {
      items: cartItems,
      subtotal,
      tax,
      total,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage with timestamp
    const invoiceId = `invoice_${Date.now()}`;
    localStorage.setItem(invoiceId, JSON.stringify(invoiceData));
    
    alert('Invoice saved successfully!');
  };

  const handleClearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
    window.dispatchEvent(new Event('cartUpdated'));
    hideInvoiceScreen(); // Auto hide invoice when cart is cleared
    console.log('Cart cleared');
  };

  const handleCloseInvoice = () => {
    hideInvoiceScreen();
  };

  const handleTaxHoldStart = () => {
    const timer = setTimeout(() => {
      setEditTaxRate((taxRate * 100).toString());
      setIsEditingTax(true);
      console.log('Tax hold gesture detected - opening edit mode');
    }, 800); // 800ms hold time
    setHoldTimer(timer);
  };

  const handleTaxHoldEnd = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  };

  const handleTaxRateChange = (value: string) => {
    setEditTaxRate(value);
  };

  const handleSaveTaxRate = () => {
    const newTaxRatePercent = parseFloat(editTaxRate);
    if (!isNaN(newTaxRatePercent) && newTaxRatePercent >= 0 && newTaxRatePercent <= 100) {
      const newTaxRate = newTaxRatePercent / 100;
      setTaxRate(newTaxRate);
      localStorage.setItem('taxRate', newTaxRate.toString());
      console.log('Tax rate updated to:', newTaxRatePercent + '%');
    }
    setIsEditingTax(false);
  };

  const handleCancelTaxEdit = () => {
    setIsEditingTax(false);
    setEditTaxRate((taxRate * 100).toString());
  };
  return {
    isVisible,
    cartItems,
    subtotal,
    tax,
    total,
    taxRate,
    isEditingTax,
    editTaxRate,
    showInvoiceScreen,
    hideInvoiceScreen,
    handlePrintInvoice,
    handleSaveInvoice,
    handleClearCart,
    handleCloseInvoice,
    handleTaxHoldStart,
    handleTaxHoldEnd,
    handleTaxRateChange,
    handleSaveTaxRate,
    handleCancelTaxEdit
  };
};