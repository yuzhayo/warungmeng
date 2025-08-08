import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
}

export const useTransactionScreenLogic = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Load transactions from localStorage or initialize with sample data
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      try {
        const parsedTransactions = JSON.parse(savedTransactions);
        setTransactions(parsedTransactions);
      } catch (error) {
        console.error('Error parsing transactions:', error);
        initializeDefaultTransactions();
      }
    } else {
      initializeDefaultTransactions();
    }
  }, []);

  const initializeDefaultTransactions = () => {
    const defaultTransactions: Transaction[] = [
      {
        id: 'txn001',
        date: '2025-01-18',
        time: '10:30 AM',
        items: [
          { name: 'Espresso', quantity: 2, price: 2.50 },
          { name: 'Croissant', quantity: 1, price: 3.25 }
        ],
        subtotal: 8.25,
        tax: 0.66,
        total: 8.91,
        status: 'completed'
      },
      {
        id: 'txn002',
        date: '2025-01-18',
        time: '11:15 AM',
        items: [
          { name: 'Latte', quantity: 1, price: 4.25 },
          { name: 'Sandwich', quantity: 1, price: 8.99 }
        ],
        subtotal: 13.24,
        tax: 1.06,
        total: 14.30,
        status: 'completed'
      },
      {
        id: 'txn003',
        date: '2025-01-18',
        time: '12:45 PM',
        items: [
          { name: 'Cappuccino', quantity: 1, price: 3.75 }
        ],
        subtotal: 3.75,
        tax: 0.30,
        total: 4.05,
        status: 'pending'
      }
    ];
    
    setTransactions(defaultTransactions);
    localStorage.setItem('transactions', JSON.stringify(defaultTransactions));
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(selectedTransaction?.id === transaction.id ? null : transaction);
  };

  const handleBackClick = () => {
    console.log('Back button clicked from transaction screen');
    setSelectedTransaction(null);
  };

  const handleRefresh = () => {
    console.log('Refreshing transactions...');
    // In a real app, this would fetch from a database
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      try {
        const parsedTransactions = JSON.parse(savedTransactions);
        setTransactions(parsedTransactions);
      } catch (error) {
        console.error('Error refreshing transactions:', error);
      }
    }
  };

  return {
    transactions,
    selectedTransaction,
    handleTransactionClick,
    handleBackClick,
    handleRefresh
  };
};