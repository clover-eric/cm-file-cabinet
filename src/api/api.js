import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3302',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    console.log('发送请求:', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers
    });

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('收到响应:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('响应错误:', error);
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ message: '请求超时，请检查网络连接' });
    }
    if (!error.response) {
      return Promise.reject({ message: '网络错误，请检查服务器是否正常运行' });
    }
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
