
import React, { useState } from 'react';
import Auth from './Auth';
import Dashboard from './Dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuth = () => {
    setIsAuthenticated(true);
  };

  return (
    <div className="min-h-screen">
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <Auth onAuth={handleAuth} />
      )}
    </div>
  );
};

export default Index;
