import React from 'react';

interface ExtraScreenUIProps {
  data: string;
  onAction: (buttonId: string) => void;
}

const ExtraScreenUI: React.FC<ExtraScreenUIProps> = ({
  data,
  onAction
}) => {
  return (
    <div className="w-full h-full bg-main-gray rounded-lg shadow-custom overflow-hidden">
      {/* Content */}
      <div className="p-6 h-full overflow-y-auto">
        {/* Four Empty Buttons */}
        <div className="grid grid-cols-2 gap-6">
          <button
            onClick={() => onAction('button1')}
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">Tasbih</div>
              <div className="text-gray-600">Click to open</div>
            </div>
          </button>

          <button
            onClick={() => onAction('button2')}
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">Button 2</div>
              <div className="text-gray-600">Click to open</div>
            </div>
          </button>

          <button
            onClick={() => onAction('button3')}
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">Button 3</div>
              <div className="text-gray-600">Click to open</div>
            </div>
          </button>

          <button
            onClick={() => onAction('button4')}
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-2">Button 4</div>
              <div className="text-gray-600">Click to open</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtraScreenUI;