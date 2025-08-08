import { useState } from 'react';

export const useConfirmationScreenLogic = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('Confirmation');
  const [message, setMessage] = useState<string>('Are you sure?');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
  const [onCancel, setOnCancel] = useState<(() => void) | null>(null);

  const showConfirmation = (
    confirmationTitle: string,
    confirmationMessage: string,
    confirmCallback: () => void,
    cancelCallback?: () => void
  ) => {
    setTitle(confirmationTitle);
    setMessage(confirmationMessage);
    setOnConfirm(() => confirmCallback);
    setOnCancel(() => cancelCallback || (() => {}));
    setIsVisible(true);
  };

  const hideConfirmation = () => {
    setIsVisible(false);
    setTitle('Confirmation');
    setMessage('Are you sure?');
    setOnConfirm(null);
    setOnCancel(null);
  };

  const handleConfirmClick = () => {
    if (onConfirm) {
      onConfirm();
    }
    hideConfirmation();
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    }
    hideConfirmation();
  };

  return {
    isVisible,
    title,
    message,
    showConfirmation,
    hideConfirmation,
    handleConfirmClick,
    handleCancelClick
  };
};