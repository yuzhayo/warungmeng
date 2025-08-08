import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, Calendar, Receipt, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

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

interface CashflowScreenUIProps {
  dailyRevenue: RevenueData;
  monthlyRevenue: RevenueData;
  yearlyRevenue: RevenueData;
  topSellingItems: TopSellingItem[];
  recentTransactions: Transaction[];
  revenueByCategory: CategoryRevenue[];
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  onCashIn: () => void;
  onCashOut: () => void;
}

const CashflowScreenUI: React.FC<CashflowScreenUIProps> = ({
  dailyRevenue,
  monthlyRevenue,
  yearlyRevenue,
  topSellingItems,
  recentTransactions,
  revenueByCategory,
  selectedPeriod,
  onPeriodChange,
  onCashIn,
  onCashOut,
}) => {
  const formatCurrency = (amount: number) => {
    return Math.round(amount).toLocaleString('de-DE');
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="w-full h-full bg-main-gray rounded-lg shadow-custom overflow-hidden">
      {/* Content */}
      <div className="p-6 h-full overflow-y-auto">
        {/* Cash In/Out Buttons - Top Left */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onCashIn}
            className="flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-md font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            <ArrowDownCircle className="w-5 h-5" />
            <span>Cash In</span>
          </button>
          <button
            onClick={onCashOut}
            className="flex items-center space-x-2 bg-red-600 text-white hover:bg-red-700 px-6 py-3 rounded-md font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
          >
            <ArrowUpCircle className="w-5 h-5" />
            <span>Cash Out</span>
          </button>
        </div>

        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Daily Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{dailyRevenue.period}</h3>
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(dailyRevenue.amount)}
              </div>
              <div className="text-sm text-gray-600">
                {dailyRevenue.transactions} transactions
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(dailyRevenue.growth)}`}>
                {getGrowthIcon(dailyRevenue.growth)}
                <span>{Math.abs(dailyRevenue.growth)}% vs yesterday</span>
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{monthlyRevenue.period}</h3>
              <BarChart3 className="w-6 h-6 text-green-500" />
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(monthlyRevenue.amount)}
              </div>
              <div className="text-sm text-gray-600">
                {monthlyRevenue.transactions} transactions
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(monthlyRevenue.growth)}`}>
                {getGrowthIcon(monthlyRevenue.growth)}
                <span>{Math.abs(monthlyRevenue.growth)}% vs last month</span>
              </div>
            </div>
          </div>

          {/* Yearly Revenue */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{yearlyRevenue.period}</h3>
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(yearlyRevenue.amount)}
              </div>
              <div className="text-sm text-gray-600">
                {yearlyRevenue.transactions} transactions
              </div>
              <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(yearlyRevenue.growth)}`}>
                {getGrowthIcon(yearlyRevenue.growth)}
                <span>{Math.abs(yearlyRevenue.growth)}% vs last year</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">Top Selling Items</h3>
            </div>
            <div className="space-y-4">
              {topSellingItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(item.revenue)}</div>
                    <div className="text-sm text-gray-600">{item.quantity} sold</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <PieChart className="w-6 h-6 text-green-500" />
              <h3 className="text-xl font-bold text-gray-800">Revenue by Category</h3>
            </div>
            <div className="space-y-4">
              {revenueByCategory.map((category, index) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{category.category}</span>
                    <span className="font-bold text-green-600">{formatCurrency(category.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 text-right">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Receipt className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-bold text-gray-800">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">ID</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Time</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Items</th>
                  <th className="text-right py-2 px-4 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 font-mono text-sm">{transaction.id}</td>
                    <td className="py-2 px-4">{transaction.date}</td>
                    <td className="py-2 px-4">{transaction.time}</td>
                    <td className="py-2 px-4">
                      <div className="text-sm">
                        {transaction.items.slice(0, 2).map((item, index) => (
                          <div key={index}>{item.quantity}x {item.name}</div>
                        ))}
                        {transaction.items.length > 2 && (
                          <div className="text-gray-500">+{transaction.items.length - 2} more</div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-green-600">
                      {formatCurrency(transaction.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashflowScreenUI;