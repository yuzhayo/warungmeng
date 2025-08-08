import React, { useState, useEffect } from 'react';

interface FlyingItemProps {
  source: DOMRect;
  target: DOMRect;
  onAnimationEnd: () => void;
}

const FlyingItem: React.FC<FlyingItemProps> = ({ source, target, onAnimationEnd }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  const handleTransitionEnd = () => {
    onAnimationEnd();
  };

  return (
    <div
      className={`flying-item ${isAnimating ? 'flying' : ''}`}
      style={{
        left: source.left + source.width / 2,
        top: source.top + source.height / 2,
        transform: isAnimating 
          ? `translate(${target.left + target.width / 2 - (source.left + source.width / 2)}px, ${target.top + target.height / 2 - (source.top + source.height / 2)}px) scale(0.1)`
          : 'translate(0, 0) scale(1)',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
        <span className="text-white text-xs font-bold">+</span>
      </div>
    </div>
  );
};

export default FlyingItem;