import React from 'react';
import { useHomeTabLogic } from './Home_Tab_Logic';
import HomeTabUI from './Home_Tab_UI';
import ConfirmationScreenUI from './Confirmation_Screen_UI';
import InvoiceScreenUI from './Invoice_Screen_UI';
import AddMenu from './AddMenu';
import { useInvoiceScreenLogic } from './Invoice_Screen_Logic';

const HomeTab: React.FC = () => {
  const { 
    data, 
    handleHomeAction, 
    handleCartClick,
    isAllExpanded, 
    selectedCategory, 
    categories,
    handleAllClick, 
    handleCategoryClick,
    handleAllMouseDown,
    handleAllMouseUp,
    isAddCategoryVisible,
    newCategoryName,
    handleCategoryNameChange,
    handleYesClick,
    handleNoClick,
    isConfirmationVisible,
    confirmationTitle,
    confirmationMessage,
    handleConfirmClick,
    handleCancelClick,
    isInvoiceVisible,
    activeScreen,
    handleBackToHome
  } = useHomeTabLogic();

  // Get invoice screen logic for the UI props
  const {
    cartItems,
    subtotal,
    tax,
    total,
    taxRate,
    isEditingTax,
    editTaxRate,
    handleTaxHoldStart,
    handleTaxHoldEnd,
    handleTaxRateChange,
    handleSaveTaxRate,
    handleCancelTaxEdit,
    handlePrintInvoice,
    handleSaveInvoice,
    handleClearCart,
    handleCloseInvoice
  } = useInvoiceScreenLogic();

  return (
    <>
      <HomeTabUI 
        data={data}
        onHomeAction={handleHomeAction}
        onCartClick={handleCartClick}
        isAllExpanded={isAllExpanded}
        selectedCategory={selectedCategory}
        categories={categories}
        onAllClick={handleAllClick}
        onCategoryClick={handleCategoryClick}
        onAllMouseDown={handleAllMouseDown}
        onAllMouseUp={handleAllMouseUp}
        isAddCategoryVisible={isAddCategoryVisible}
        newCategoryName={newCategoryName}
        onCategoryNameChange={handleCategoryNameChange}
        onYesClick={handleYesClick}
        onNoClick={handleNoClick}
        activeScreen={activeScreen}
        onBackToHome={handleBackToHome}
      />
      
      <ConfirmationScreenUI
        isVisible={isConfirmationVisible}
        title={confirmationTitle}
        message={confirmationMessage}
        onConfirmClick={handleConfirmClick}
        onCancelClick={handleCancelClick}
      />
      
      <InvoiceScreenUI
        isVisible={isInvoiceVisible}
        cartItems={cartItems}
        subtotal={subtotal}
        tax={tax}
        total={total}
        taxRate={taxRate}
        isEditingTax={isEditingTax}
        editTaxRate={editTaxRate}
        onPrintInvoice={handlePrintInvoice}
        onSaveInvoice={handleSaveInvoice}
        onClearCart={handleClearCart}
        onCloseInvoice={handleCloseInvoice}
        onTaxHoldStart={handleTaxHoldStart}
        onTaxHoldEnd={handleTaxHoldEnd}
        onTaxRateChange={handleTaxRateChange}
        onSaveTaxRate={handleSaveTaxRate}
        onCancelTaxEdit={handleCancelTaxEdit}
      />
      
      <AddMenu />
    </>
  );
};

export default HomeTab;