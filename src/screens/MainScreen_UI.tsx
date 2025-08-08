import React from 'react';

interface MainScreenUIProps {
  activeButton: string;
  onButtonClick: (buttonName: string) => void;
}

const MainScreenUI: React.FC<MainScreenUIProps> = ({ activeButton, onButtonClick }) => {
  const buttons = [
    { id: 'home', label: 'Home' },
    { id: 'database', label: 'Database' },
    { id: 'setting', label: 'Setting' }
  ];

  return (
    <div className="w-full h-20 bg-main-gray rounded-lg shadow-custom flex items-center justify-start px-6">
      <div className="flex space-x-6">
        {buttons.map((button) => (
          <button
            key={button.id}
            onClick={() => onButtonClick(button.label)}
            className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
              activeButton === button.label
                ? 'bg-white text-gray-800 shadow-md'
                : 'text-white hover:bg-gray-600 hover:text-gray-100'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainScreenUI;