import React from 'react';
import AdminAuth from './AdminAuth';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '@/hooks/useAuth';

const AdminIndex = () => {
  const { isAuthenticated, login, logout } = useAuth();

  const handleAuth = (adminData: any) => {
    console.log('AdminIndex: handleAuth called with data:', adminData);
    login(adminData, 'admin');
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return <AdminAuth onAuth={handleAuth} />;
  }

  // If authenticated, show dashboard
  return <AdminDashboard onLogout={logout} />;
};

export default AdminIndex;
