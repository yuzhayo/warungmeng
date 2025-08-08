import React from 'react';
import MainLayout from './MainLayout';
import { ZoomProvider } from './contexts/ZoomContext';

function App() {
  return (
    <ZoomProvider>
      <MainLayout />
    </ZoomProvider>
  );
}

export default App;