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
          width: '1120px',
          height: '719px',
          background: '#ecffed',
          boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
        }}
      >
        {/* Title */}
        <div 
          className="absolute flex items-center justify-center"
          style={{
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '661px',
            height: '78px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '64px',
            lineHeight: '77px',
            textAlign: 'center',
            color: '#b5acac'
          }}
        >
          {title}
        </div>

        {/* Message */}
        <div 
          className="absolute flex items-center justify-center"
          style={{
            top: '200px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '870px',
            height: '124px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '32px',
            lineHeight: '39px',
            textAlign: 'center',
            color: '#333333'
          }}
        >
          {message}
        </div>

        {/* Cancel Button (NO) */}
        <div 
          className="absolute cursor-pointer flex items-center justify-center"
          style={{
            bottom: '100px',
            left: '180px',
            width: '360px',
            height: '160px',
            borderRadius: '10px',
            background: 'linear-gradient(180deg, #ffffff 0%, #ff5555 100%)',
            boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
          }}
          onClick={onCancelClick}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '64px',
              lineHeight: '77px',
              color: '#000000'
            }}
          >
            NO
          </span>
        </div>

        {/* Confirm Button (YES) */}
        <div 
          className="absolute cursor-pointer flex items-center justify-center"
          style={{
            bottom: '100px',
            right: '180px',
            width: '360px',
            height: '160px',
            borderRadius: '10px',
            background: 'linear-gradient(180deg, #ffffff 0%, #55f678 100%)',
            boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
          }}
          onClick={onConfirmClick}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '64px',
              lineHeight: '77px',
              color: '#000000'
            }}
          >
            YES
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreenUI;