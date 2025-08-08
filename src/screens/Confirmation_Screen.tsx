import React from 'react';
import { useConfirmationScreenLogic } from './Confirmation_Screen_Logic';
import ConfirmationScreenUI from './Confirmation_Screen_UI';

const ConfirmationScreen: React.FC = () => {
  const {
    isVisible,
    title,
    message,
    handleConfirmClick,
    handleCancelClick
  } = useConfirmationScreenLogic();

  return (
    <ConfirmationScreenUI
      isVisible={isVisible}
      title={title}
      message={message}
      onConfirmClick={handleConfirmClick}
      onCancelClick={handleCancelClick}
    />
  );
};

export default ConfirmationScreen;