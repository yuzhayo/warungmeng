import React from 'react';
import { useInvoiceScreenLogic } from './Invoice_Screen_Logic';
import InvoiceScreenUI from './Invoice_Screen_UI';

const InvoiceScreen: React.FC = () => {
  const {
    isVisible,
    cartItems,
    subtotal,
    tax,
    total,
    handlePrintInvoice,
    handleSaveInvoice,
    handleClearCart,
    handleCloseInvoice
  } = useInvoiceScreenLogic();

  return (
    <InvoiceScreenUI
      isVisible={isVisible}
      cartItems={cartItems}
      subtotal={subtotal}
      tax={tax}
      total={total}
      onPrintInvoice={handlePrintInvoice}
      onSaveInvoice={handleSaveInvoice}
      onClearCart={handleClearCart}
      onCloseInvoice={handleCloseInvoice}
    />
  );
};

export default InvoiceScreen;