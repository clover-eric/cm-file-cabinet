import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [hasRegisteredUser, setHasRegisteredUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkInitialUser();
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const checkInitialUser = async () => {
    try {
      console.log('开始检查用户...');
      const response = await api.get('/check-user');
      console.log('检查用户响应:', response.data);
      setHasRegisteredUser(response.data.hasUser);
    } catch (error) {
      console.error('检查用户失败:', error);
      // 如果是网络错误或超时，假设没有注册用户
      setHasRegisteredUser(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, password) => {
    try {
      console.log('开始注册:', { username });
      const response = await api.post('/register', { 
        username, 
        password 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('注册响应:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser({ username });
        setIsAuthenticated(true);
        setHasRegisteredUser(true);
        return { success: true };
      }
      return { success: false, error: '注册失败：未收到token' };
    } catch (error) {
      console.error('注册失败:', error.response || error);
      let errorMessage = '注册失败，请重试';
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
        
        switch (error.response.status) {
          case 409:
            errorMessage = '用户名已存在';
            break;
          case 400:
            errorMessage = '无效的用户名或密码';
            break;
          case 500:
            errorMessage = '服务器错误，请稍后重试';
            break;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/login', { 
        username, 
        password 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser({ username });
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: '登录失败：未收到token' };
    } catch (error) {
      console.error('登录失败:', error.response || error);
      let errorMessage = '登录失败，请检查用户名和密码';
      
      if (error.response?.status === 401) {
        errorMessage = '用户名或密码错误';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      hasRegisteredUser,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);