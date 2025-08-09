import React from 'react';
import MainLayout from './MainLayout';
import { ZoomProvider } from './ZoomContext';

function App() {
  return (
    <ZoomProvider>
      <MainLayout />
    </ZoomProvider>
  );
}

export default App;