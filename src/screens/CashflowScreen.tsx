import React from 'react';
import { useCashflowScreenLogic } from './CashflowScreen_Logic';
import CashflowScreenUI from './CashflowScreen_UI';

const CashflowScreen: React.FC = () => {
  const {
    dailyRevenue,
    monthlyRevenue,
    yearlyRevenue,
    topSellingItems,
    recentTransactions,
    revenueByCategory,
    selectedPeriod,
    handlePeriodChange,
    handleCashIn,
    handleCashOut,
  } = useCashflowScreenLogic();

  return (
    <CashflowScreenUI
      dailyRevenue={dailyRevenue}
      monthlyRevenue={monthlyRevenue}
      yearlyRevenue={yearlyRevenue}
      topSellingItems={topSellingItems}
      recentTransactions={recentTransactions}
      revenueByCategory={revenueByCategory}
      selectedPeriod={selectedPeriod}
      onPeriodChange={handlePeriodChange}
      onCashIn={handleCashIn}
      onCashOut={handleCashOut}
    />
  );
};

export default CashflowScreen;