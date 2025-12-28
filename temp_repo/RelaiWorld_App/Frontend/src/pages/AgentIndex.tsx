import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AgentAuth from './AgentAuth';
import AgentDashboard from './AgentDashboard';

const AgentIndex: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Remove the forced logout - let authentication persist
  // useEffect(() => {
  //   logout();
  // }, []);

  const handleAuth = (data: any) => {
    console.log('AgentIndex: handleAuth called with data:', data);
    console.log('AgentIndex: data.email:', data?.email);
    console.log('AgentIndex: data.name:', data?.name);
    console.log('AgentIndex: data.keys:', data ? Object.keys(data) : 'data is null/undefined');
    login(data, 'agent');
    console.log('AgentIndex: login() called, checking auth state...');
    console.log('AgentIndex: isAuthenticated:', isAuthenticated);
    console.log('AgentIndex: user:', user);
  };

  if (isAuthenticated && user) {
    return <AgentDashboard agentData={user} onLogout={logout} />;
  }

  return <AgentAuth onAuth={handleAuth} />;
};

export default AgentIndex;