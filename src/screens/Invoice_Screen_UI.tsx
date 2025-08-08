import React from 'react';
import { Trash2, ShoppingCart, X, DollarSign } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface InvoiceScreenUIProps {
  isVisible: boolean;
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
  isEditingTax: boolean;
  editTaxRate: string;
  onPrintInvoice: () => void;
  onSaveInvoice: () => void;
  onClearCart: () => void;
  onCloseInvoice: () => void;
  onTaxHoldStart: () => void;
  onTaxHoldEnd: () => void;
  onTaxRateChange: (value: string) => void;
  onSaveTaxRate: () => void;
  onCancelTaxEdit: () => void;
}

const InvoiceScreenUI: React.FC<InvoiceScreenUIProps> = ({
  isVisible,
  cartItems,
  subtotal,
  tax,
  total,
  taxRate,
  isEditingTax,
  editTaxRate,
  onPrintInvoice,
  onSaveInvoice,
  onClearCart,
  onCloseInvoice,
  onTaxHoldStart,
  onTaxHoldEnd,
  onTaxRateChange,
  onSaveTaxRate,
  onCancelTaxEdit
}) => {
  return (
    <div 
      className={`fixed top-0 right-0 w-[485px] transform transition-transform duration-300 ease-in-out z-40 ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ 
        top: '104px',
        height: 'calc(100vh - 124px)',
        borderRadius: '5px',
        background: '#fafff0',
        boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-800">Invoice</h2>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {cartItems.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800 text-sm">{Math.round(item.price * item.quantity).toLocaleString('de-DE')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals Section */}
      {cartItems.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-800">{Math.round(subtotal).toLocaleString('de-DE')}</span>
            </div>
            {isEditingTax ? (
              <div className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded">
                <span className="text-gray-600">Tax Rate (%):</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={editTaxRate}
                    onChange={(e) => onTaxRateChange(e.target.value)}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                    min="0"
                    max="100"
                    step="0.1"
                    autoFocus
                  />
                  <button
                    onClick={onSaveTaxRate}
                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    ✓
                  </button>
                  <button
                    onClick={onCancelTaxEdit}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="flex justify-between text-sm cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors duration-200"
                onMouseDown={onTaxHoldStart}
                onMouseUp={onTaxHoldEnd}
                onMouseLeave={onTaxHoldEnd}
                onTouchStart={onTaxHoldStart}
                onTouchEnd={onTaxHoldEnd}
                title="Hold to edit tax rate"
              >
                <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(1)}%):</span>
                <span className="text-gray-800">{Math.round(tax).toLocaleString('de-DE')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-1">
              <span className="text-gray-800">Total:</span>
              <span className="text-green-600">{Math.round(total).toLocaleString('de-DE')}</span>
            </div>
          </div>
          {!isEditingTax && (
            <div className="text-xs text-gray-500 text-center mt-2">
              Hold tax line to edit rate
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-3 space-y-2 flex-shrink-0">
        {cartItems.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                className="flex items-center justify-center space-x-1 bg-green-500 text-white py-4 px-2 rounded-md text-sm font-medium hover:bg-green-600 transition-colors duration-200"
              >
                <DollarSign className="w-4 h-4" />
                <span>Cash</span>
              </button>
              <button
                className="flex items-center justify-center space-x-1 bg-purple-500 text-white py-4 px-2 rounded-md text-sm font-medium hover:bg-purple-600 transition-colors duration-200"
              >
                <span>📱</span>
                <span>Qris</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                className="flex items-center justify-center space-x-1 bg-yellow-500 text-white py-4 px-2 rounded-md text-sm font-medium hover:bg-yellow-600 transition-colors duration-200"
              >
                <span>⏳</span>
                <span>Pending</span>
              </button>
              <button
                className="flex items-center justify-center space-x-1 bg-blue-600 text-white py-4 px-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                <span>▶️</span>
                <span>Proceed</span>
              </button>
            </div>
          </>
        )}
        <button
          onClick={onClearCart}
          className="w-full flex items-center justify-center space-x-1 bg-red-500 text-white py-4 px-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors duration-200"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Cart</span>
        </button>
      </div>
    </div>
  );
};

export default InvoiceScreenUI;