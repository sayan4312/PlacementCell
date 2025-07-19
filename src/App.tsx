import React from 'react';
import { useAuthStore, initializeAuth } from './store/authStore';
import AppRoutes from './routes';
import './index.css';

initializeAuth();

function App() {
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-700 dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <AppRoutes />
    </div>
  );
}

export default App;