import React from 'react';
import { useTransactionScreenLogic } from './TransactionScreen_Logic';
import TransactionScreenUI from './TransactionScreen_UI';

const TransactionScreen: React.FC = () => {
  const {
    transactions,
    selectedTransaction,
    handleTransactionClick,
    handleBackClick,
    handleRefresh
  } = useTransactionScreenLogic();

  return (
    <TransactionScreenUI
      transactions={transactions}
      selectedTransaction={selectedTransaction}
      onTransactionClick={handleTransactionClick}
      onBackClick={handleBackClick}
      onRefresh={handleRefresh}
    />
  );
};

export default TransactionScreen;