import React from 'react';
import { X } from 'lucide-react';

interface Button3ScreenProps {
  onClose: () => void;
}

const Button3Screen: React.FC<Button3ScreenProps> = ({ onClose }) => {
  return (
    <div className="w-full h-full bg-main-gray rounded-lg shadow-custom overflow-hidden">
      {/* Header with X button */}
      <div className="bg-gray-700 p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Button 3 Screen</h1>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors duration-200 p-2 hover:bg-gray-600 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Empty Content Area */}
      <div className="p-6 h-[calc(100%-80px)] overflow-y-auto flex items-center justify-center">
        <div className="text-center text-white opacity-70">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-2">Empty Screen</h2>
          <p className="text-lg">Features will be added here later</p>
        </div>
      </div>
    </div>
  );
};

export default Button3Screen;