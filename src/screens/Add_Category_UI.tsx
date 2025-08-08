import React from 'react';

interface AddCategoryUIProps {
  isVisible: boolean;
  newCategoryName: string;
  onCategoryNameChange: (name: string) => void;
  onYesClick: () => void;
  onNoClick: () => void;
}

const AddCategoryUI: React.FC<AddCategoryUIProps> = ({
  isVisible,
  newCategoryName,
  onCategoryNameChange,
  onYesClick,
  onNoClick
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
        {/* Add New Category Title */}
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
          Add New Category
        </div>

        {/* Input Box */}
        <div 
          className="absolute"
          style={{
            top: '200px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '870px',
            height: '124px'
          }}
        >
          <div
            className="w-full h-full rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #ffffff 46.37%, #e2e2e2 100%)'
            }}
          >
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => onCategoryNameChange(e.target.value)}
              placeholder="Enter category name..."
              className="w-4/5 h-3/5 text-center text-4xl font-normal bg-transparent border-none outline-none text-black placeholder-gray-500"
              style={{
                fontFamily: 'Inter, sans-serif'
              }}
            />
          </div>
        </div>

        {/* No Button */}
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
          onClick={onNoClick}
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

        {/* Yes Button */}
        <div 
          className={`absolute flex items-center justify-center ${
            newCategoryName.trim() ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          }`}
          style={{
            bottom: '100px',
            right: '180px',
            width: '360px',
            height: '160px',
            borderRadius: '10px',
            background: 'linear-gradient(180deg, #ffffff 0%, #55f678 100%)',
            boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
          }}
          onClick={newCategoryName.trim() ? onYesClick : undefined}
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

export default AddCategoryUI;