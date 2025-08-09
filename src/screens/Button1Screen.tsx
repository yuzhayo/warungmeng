import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Plus, Minus } from 'lucide-react';

interface Button1ScreenProps {
  onClose: () => void;
}

const Button1Screen: React.FC<Button1ScreenProps> = ({ onClose }) => {
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(33);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [rounds, setRounds] = useState<number>(0);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState<boolean>(true);

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('tasbihData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setCount(data.count || 0);
        setTarget(data.target || 33);
        setTotalCount(data.totalCount || 0);
        setRounds(data.rounds || 0);
        setIsVibrationEnabled(data.isVibrationEnabled !== false);
      } catch (error) {
        console.error('Error loading tasbih data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const data = {
      count,
      target,
      totalCount,
      rounds,
      isVibrationEnabled
    };
    localStorage.setItem('tasbihData', JSON.stringify(data));
  }, [count, target, totalCount, rounds, isVibrationEnabled]);

  const handleIncrement = () => {
    const newCount = count + 1;
    const newTotalCount = totalCount + 1;
    
    setCount(newCount);
    setTotalCount(newTotalCount);

    // Check if target reached
    if (newCount >= target) {
      setCount(0);
      setRounds(rounds + 1);
      
      // Vibrate if enabled and supported
      if (isVibrationEnabled && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } else if (isVibrationEnabled && navigator.vibrate) {
      // Light vibration for regular count
      navigator.vibrate(50);
    }
  };

  const handleDecrement = () => {
    if (count > 0) {
      setCount(count - 1);
      if (totalCount > 0) {
        setTotalCount(totalCount - 1);
      }
    }
  };

  const handleReset = () => {
    setCount(0);
    setTotalCount(0);
    setRounds(0);
  };

  const handleTargetChange = (newTarget: number) => {
    if (newTarget > 0 && newTarget <= 999) {
      setTarget(newTarget);
    }
  };

  const getProgressPercentage = () => {
    return (count / target) * 100;
  };

  const getMotivationalMessage = () => {
    const percentage = getProgressPercentage();
    if (percentage === 0) return "Begin your dhikr journey";
    if (percentage < 25) return "Keep going, every count matters";
    if (percentage < 50) return "You're making great progress";
    if (percentage < 75) return "Almost halfway there!";
    if (percentage < 90) return "So close to completion!";
    return "Just a few more to go!";
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-custom overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 flex items-center justify-between text-white">
        <h1 className="text-2xl font-bold">Tasbih Counter</h1>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors duration-200 p-2 hover:bg-white/20 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6 h-[calc(100%-80px)] overflow-y-auto flex flex-col items-center justify-center space-y-8">
        
        {/* Progress Circle */}
        <div className="relative w-64 h-64">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
              className="transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-gray-800 mb-2">{count}</div>
            <div className="text-lg text-gray-600">of {target}</div>
            <div className="text-sm text-gray-500 mt-1">{getMotivationalMessage()}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 w-full max-w-md">
          <div className="bg-white rounded-lg p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-green-600">{rounds}</div>
            <div className="text-sm text-gray-600">Rounds</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
            <div className="text-sm text-gray-600">Total Count</div>
          </div>
        </div>

        {/* Main Counter Button */}
        <button
          onClick={handleIncrement}
          className="w-32 h-32 bg-gradient-to-br from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-full shadow-lg transform transition-all duration-150 hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <span className="text-2xl font-bold">TAP</span>
        </button>

        {/* Control Buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleDecrement}
            className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-md transition-all duration-200 transform hover:scale-105"
            disabled={count === 0}
          >
            <Minus className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleReset}
            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-all duration-200 transform hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Target Setting */}
        <div className="bg-white rounded-lg p-4 shadow-md w-full max-w-md">
          <div className="text-center mb-3">
            <label className="text-sm font-medium text-gray-700">Target Count</label>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => handleTargetChange(target - 1)}
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors duration-200"
              disabled={target <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <input
              type="number"
              value={target}
              onChange={(e) => handleTargetChange(parseInt(e.target.value) || 1)}
              className="w-20 text-center text-xl font-bold border-2 border-gray-200 rounded-lg py-2 focus:border-blue-500 focus:outline-none"
              min="1"
              max="999"
            />
            
            <button
              onClick={() => handleTargetChange(target + 1)}
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors duration-200"
              disabled={target >= 999}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Quick target buttons */}
          <div className="flex justify-center space-x-2 mt-3">
            {[33, 99, 100].map((quickTarget) => (
              <button
                key={quickTarget}
                onClick={() => handleTargetChange(quickTarget)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  target === quickTarget
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {quickTarget}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg p-4 shadow-md w-full max-w-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Vibration</span>
            <button
              onClick={() => setIsVibrationEnabled(!isVibrationEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                isVibrationEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  isVibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {!navigator.vibrate && (
            <p className="text-xs text-gray-500 mt-1">Vibration not supported on this device</p>
          )}
        </div>

        {/* Islamic Phrases */}
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 w-full max-w-md text-center">
          <div className="text-sm text-gray-600 mb-2">Common Dhikr</div>
          <div className="space-y-2 text-sm">
            <div className="font-arabic text-lg">سُبْحَانَ اللهِ</div>
            <div className="text-gray-700">SubhanAllah (Glory be to Allah)</div>
            <div className="font-arabic text-lg mt-2">الْحَمْدُ لِلّهِ</div>
            <div className="text-gray-700">Alhamdulillah (Praise be to Allah)</div>
            <div className="font-arabic text-lg mt-2">اللّهُ أَكْبَر</div>
            <div className="text-gray-700">Allahu Akbar (Allah is Greatest)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Button1Screen;