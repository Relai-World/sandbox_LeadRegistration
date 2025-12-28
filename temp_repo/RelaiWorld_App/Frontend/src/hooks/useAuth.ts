import { useState, useEffect } from 'react';

interface AuthData {
  isAuthenticated: boolean;
  userData?: any;
  userType?: 'admin' | 'agent';
}

export const useAuth = () => {
  const [authData, setAuthData] = useState<AuthData>({
    isAuthenticated: false,
    userData: null,
    userType: undefined
  });

  // Check for existing authentication on mount and validate session
  useEffect(() => {
    const validateSession = async () => {
      const storedAuth = localStorage.getItem('authData');
      if (storedAuth) {
        try {
          const parsedAuth = JSON.parse(storedAuth);
          
          // Validate the session by checking if the user data is still valid
          if (parsedAuth.userData && parsedAuth.userData.email) {
            // For now, we'll trust the stored data, but you can add server validation here
            setAuthData(parsedAuth);
          } else {
            // Invalid stored data, clear it
            localStorage.removeItem('authData');
          }
        } catch (error) {
          console.error('Error parsing stored auth data:', error);
          localStorage.removeItem('authData');
        }
      }
    };

    validateSession();
  }, []);

  const login = (userData: any, userType: 'admin' | 'agent') => {
    const newAuthData = {
      isAuthenticated: true,
      userData,
      userType
    };
    setAuthData(newAuthData);
    localStorage.setItem('authData', JSON.stringify(newAuthData));
  };

  const logout = () => {
    const newAuthData = {
      isAuthenticated: false,
      userData: null,
      userType: undefined
    };
    setAuthData(newAuthData);
    localStorage.removeItem('authData');
  };

  return {
    ...authData,
    user: authData.userData, // Add user alias for backward compatibility
    login,
    logout
  };
}; 