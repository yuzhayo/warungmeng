import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
}

interface RevenueData {
  period: string;
  amount: number;
  transactions: number;
  growth: number;
}

interface TopSellingItem {
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}

interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

export const useCashflowScreenLogic = () => {
  const [dailyRevenue, setDailyRevenue] = useState<RevenueData>({ period: 'Today', amount: 0, transactions: 0, growth: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState<RevenueData>({ period: 'This Month', amount: 0, transactions: 0, growth: 0 });
  const [yearlyRevenue, setYearlyRevenue] = useState<RevenueData>({ period: 'This Year', amount: 0, transactions: 0, growth: 0 });
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<CategoryRevenue[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('daily');

  useEffect(() => {
    loadCashflowData();
    
    // Listen for database refresh events
    const handleDatabaseRefresh = (event: CustomEvent) => {
      if (event.detail.screen === 'cashflow') {
        console.log('Refreshing cashflow data from database refresh event');
        loadCashflowData();
      }
    };

    window.addEventListener('databaseRefresh', handleDatabaseRefresh as EventListener);

    return () => {
      window.removeEventListener('databaseRefresh', handleDatabaseRefresh as EventListener);
    };
  }, [selectedPeriod]);

  const loadCashflowData = () => {
    // Load data from localStorage or generate sample data
    const transactions = getTransactionsFromStorage();
    const menuItems = getMenuItemsFromStorage();
    
    calculateRevenue(transactions);
    calculateTopSellingItems(transactions, menuItems);
    calculateRevenueByCategory(transactions);
    setRecentTransactions(transactions.slice(0, 10));
  };

  const getTransactionsFromStorage = (): Transaction[] => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing transactions:', error);
      }
    }
    
    // Generate sample cashflow data
    return generateSampleTransactions();
  };

  const getMenuItemsFromStorage = () => {
    const saved = localStorage.getItem('menuItems');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing menu items:', error);
      }
    }
    return [];
  };

  const generateSampleTransactions = (): Transaction[] => {
    const categories = ['Beverages', 'Food', 'Desserts'];
    const items = [
      { name: 'Espresso', category: 'Beverages', price: 2.50 },
      { name: 'Cappuccino', category: 'Beverages', price: 3.75 },
      { name: 'Latte', category: 'Beverages', price: 4.25 },
      { name: 'Club Sandwich', category: 'Food', price: 8.99 },
      { name: 'Caesar Salad', category: 'Food', price: 7.50 },
      { name: 'Chocolate Cake', category: 'Desserts', price: 5.25 }
    ];

    const transactions: Transaction[] = [];
    
    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const transactionItems = [];
      const numItems = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numItems; j++) {
        const item = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        transactionItems.push({
          name: item.name,
          quantity,
          price: item.price,
          category: item.category
        });
      }
      
      const subtotal = transactionItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.08;
      const total = subtotal + tax;
      
      transactions.push({
        id: `txn_${String(i + 1).padStart(3, '0')}`,
        date: date.toISOString().split('T')[0],
        time: `${Math.floor(Math.random() * 12) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
        items: transactionItems,
        subtotal,
        tax,
        total,
        status: 'completed'
      });
    }
    
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const calculateRevenue = (transactions: Transaction[]) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const thisYear = String(now.getFullYear());

    // Daily revenue
    const dailyTransactions = transactions.filter(t => t.date === today);
    const dailyAmount = dailyTransactions.reduce((sum, t) => sum + t.total, 0);
    
    // Monthly revenue
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(thisMonth));
    const monthlyAmount = monthlyTransactions.reduce((sum, t) => sum + t.total, 0);
    
    // Yearly revenue
    const yearlyTransactions = transactions.filter(t => t.date.startsWith(thisYear));
    const yearlyAmount = yearlyTransactions.reduce((sum, t) => sum + t.total, 0);

    setDailyRevenue({
      period: 'Today',
      amount: dailyAmount,
      transactions: dailyTransactions.length,
      growth: Math.floor(Math.random() * 20) - 10 // Simulate growth percentage
    });

    setMonthlyRevenue({
      period: 'This Month',
      amount: monthlyAmount,
      transactions: monthlyTransactions.length,
      growth: Math.floor(Math.random() * 30) - 5
    });

    setYearlyRevenue({
      period: 'This Year',
      amount: yearlyAmount,
      transactions: yearlyTransactions.length,
      growth: Math.floor(Math.random() * 50) + 5
    });
  };

  const calculateTopSellingItems = (transactions: Transaction[], menuItems: any[]) => {
    const itemSales: { [key: string]: { quantity: number; revenue: number; category: string } } = {};
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = { quantity: 0, revenue: 0, category: item.category };
        }
        itemSales[item.name].quantity += item.quantity;
        itemSales[item.name].revenue += item.price * item.quantity;
      });
    });

    const topItems = Object.entries(itemSales)
      .map(([name, data]) => ({
        name,
        category: data.category,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setTopSellingItems(topItems);
  };

  const calculateRevenueByCategory = (transactions: Transaction[]) => {
    const categoryRevenue: { [key: string]: number } = {};
    let totalRevenue = 0;
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const revenue = item.price * item.quantity;
        categoryRevenue[item.category] = (categoryRevenue[item.category] || 0) + revenue;
        totalRevenue += revenue;
      });
    });

    const revenueData = Object.entries(categoryRevenue)
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    setRevenueByCategory(revenueData);
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleCashIn = () => {
    console.log('Cash In button clicked');
    // TODO: Implement cash in functionality
    alert('Cash In functionality - Coming soon!');
  };

  const handleCashOut = () => {
    console.log('Cash Out button clicked');
    // TODO: Implement cash out functionality
    alert('Cash Out functionality - Coming soon!');
  };

  return {
    dailyRevenue,
    monthlyRevenue,
    yearlyRevenue,
    topSellingItems,
    recentTransactions,
    revenueByCategory,
    selectedPeriod,
    handlePeriodChange,
    handleCashIn,
    handleCashOut
  };
};