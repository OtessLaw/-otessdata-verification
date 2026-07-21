import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

// Configure axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      
      // Fetch profile
      axios.get('/api/auth/profile')
        .then(res => {
          setAdmin(res.data.admin || { email: 'admin@nvs.com' });
        })
        .catch(err => {
          console.error("Profile load failed, resetting token", err);
          if (err.response?.status === 401) {
            logout();
          } else {
            setAdmin({ email: 'admin@nvs.com' });
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setAdmin(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: receivedToken, admin: adminData } = response.data;
      setToken(receivedToken);
      setAdmin(adminData || { email });
      toast.success('Successfully logged in!');
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ admin, user: admin, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
