import React from 'react';
import { ArrowLeft, RefreshCw, DollarSign, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

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

interface TransactionScreenUIProps {
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  onTransactionClick: (transaction: Transaction) => void;
  onBackClick: () => void;
  onRefresh: () => void;
}

const TransactionScreenUI: React.FC<TransactionScreenUIProps> = ({
  transactions,
  selectedTransaction,
  onTransactionClick,
  onBackClick,
  onRefresh
}) => {
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full h-full bg-main-gray rounded-lg shadow-custom overflow-hidden">
      {/* Header */}
      <div className="bg-gray-700 p-4 flex items-center justify-between">
        <button
          onClick={onBackClick}
          className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-all duration-200 transform hover:scale-105"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 h-[calc(100%-80px)] overflow-y-auto">
        <div className="grid gap-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              onClick={() => onTransactionClick(transaction)}
              className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-102 ${
                selectedTransaction?.id === transaction.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              {/* Transaction Header */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono text-gray-600">#{transaction.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(transaction.status)}
                      <span className="capitalize">{transaction.status}</span>
                    </div>
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">{transaction.date}</div>
                  <div className="text-sm text-gray-600">{transaction.time}</div>
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  {transaction.items.length} item{transaction.items.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center space-x-1 text-lg font-bold text-green-600">
                  <DollarSign className="w-5 h-5" />
                  <span>{Math.round(transaction.total).toLocaleString('de-DE')}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedTransaction?.id === transaction.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2">Items:</h4>
                  <div className="space-y-1 mb-3">
                    {transaction.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.quantity}x {item.name}</span>
                        <span className="text-gray-600">{Math.round(item.price * item.quantity).toLocaleString('de-DE')}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span>{Math.round(transaction.subtotal).toLocaleString('de-DE')}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Tax:</span>
                      <span>{Math.round(transaction.tax).toLocaleString('de-DE')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-800 pt-1 border-t border-gray-200">
                      <span>Total:</span>
                      <span>{Math.round(transaction.total).toLocaleString('de-DE')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {transactions.length === 0 && (
          <div className="text-center text-white text-lg opacity-80 mt-20">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionScreenUI;