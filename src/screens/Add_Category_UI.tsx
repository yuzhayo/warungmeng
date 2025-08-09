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
          background: '#ecffed',
          boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
        }}
        className="w-11/12 max-w-3xl h-auto max-h-[90vh] p-6 flex flex-col items-center space-y-8 overflow-y-auto"
      >
        {/* Add New Category Title */}
        <div className="w-full text-center text-6xl font-normal text-gray-500 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          Add New Category
        </div>

        {/* Input Box */}
        <div className="w-full max-w-2xl h-auto min-h-[124px] flex items-center justify-center">
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

        {/* Action Buttons */}
        <div className="w-full max-w-2xl flex justify-between space-x-4 mt-auto p-4">
          {/* No Button */}
          <div 
            className="flex-1 py-6 cursor-pointer flex items-center justify-center"
            style={{
              borderRadius: '10px',
              background: 'linear-gradient(180deg, #ffffff 0%, #ff5555 100%)',
              boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
            }}
            onClick={onNoClick}
          >
            <span
              className="text-7xl font-normal text-black"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              NO
            </span>
          </div>

          {/* Yes Button */}
          <div 
            className={`flex-1 py-6 flex items-center justify-center ${
              newCategoryName.trim() ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
            }`}
            style={{
              borderRadius: '10px',
              background: 'linear-gradient(180deg, #ffffff 0%, #55f678 100%)',
              boxShadow: '0px 4px 4px rgba(0,0,0,0.25)'
            }}
            onClick={newCategoryName.trim() ? onYesClick : undefined}
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

export default AddCategoryUI;