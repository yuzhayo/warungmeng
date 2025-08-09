import React from 'react';

interface ConfirmationScreenUIProps {
  isVisible: boolean;
  title: string;
  message: string;
  onConfirmClick: () => void;
  onCancelClick: () => void;
}

const ConfirmationScreenUI: React.FC<ConfirmationScreenUIProps> = ({
  isVisible,
  title,
  message,
  onConfirmClick,
  onCancelClick
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="relative rounded-md shadow-custom"
        style={{
          background: '#ecffed',
          boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
        }}
        className="w-11/12 max-w-3xl h-auto max-h-[90vh] p-6 flex flex-col items-center space-y-8 overflow-y-auto"
      >
        {/* Title */}
        <div className="w-full text-center text-6xl font-normal text-gray-500 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          {title}
        </div>

        {/* Message */}
        <div className="w-full text-center text-3xl font-normal text-gray-700 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          {message}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-2xl flex justify-between space-x-4 mt-auto p-4">
          {/* Cancel Button (NO) */}
          <div 
            className="flex-1 py-6 cursor-pointer flex items-center justify-center"
            style={{
              borderRadius: '10px',
              background: 'linear-gradient(180deg, #ffffff 0%, #ff5555 100%)',
              boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
            }}
            onClick={onCancelClick}
          >
            <span
              className="text-7xl font-normal text-black"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              NO
            </span>
          </div>

          {/* Confirm Button (YES) */}
          <div 
            className="flex-1 py-6 cursor-pointer flex items-center justify-center"
            style={{
              borderRadius: '10px',
              background: 'linear-gradient(180deg, #ffffff 0%, #55f678 100%)',
              boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
            }}
            onClick={onConfirmClick}
          >
            <span
              className="text-7xl font-normal text-black"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              YES
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreenUI;