import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Define the shape of our context data
interface ZoomContextType {
  scale: number;
  setZoom: (newScale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

// Create the context with a default (null) value
const ZoomContext = createContext<ZoomContextType | undefined>(undefined);

// Define the props for the ZoomProvider
interface ZoomProviderProps {
  children: ReactNode;
}

// ZoomProvider component
export const ZoomProvider: React.FC<ZoomProviderProps> = ({ children }) => {
  // Initial scale is 1.0 (100%)
  const [scale, setScale] = useState<number>(1.0);

  // Define min and max zoom levels
  const MIN_ZOOM = 0.4; // 40%
  const MAX_ZOOM = 1.05; // 105%
  const ZOOM_STEP = 0.1; // 10% increments

  // Function to update the zoom level, clamping it within min/max
  const setZoom = useCallback((newScale: number) => {
    setScale(prevScale => {
      const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
      console.log(`Zoom changed from ${(prevScale * 100).toFixed(0)}% to ${(clampedScale * 100).toFixed(0)}%`);
      return clampedScale;
    });
  }, []);

  // Helper functions for common zoom operations
  const zoomIn = useCallback(() => {
    setZoom(scale + ZOOM_STEP);
  }, [scale, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(scale - ZOOM_STEP);
  }, [scale, setZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1.0);
  }, [setZoom]);

  // The context value that will be provided to consumers
  const contextValue: ZoomContextType = {
    scale,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
  };

  return (
    <ZoomContext.Provider value={contextValue}>
      {children}
    </ZoomContext.Provider>
  );
};

// Custom hook to easily consume the ZoomContext
export const useZoom = () => {
  const context = useContext(ZoomContext);
  if (context === undefined) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
};