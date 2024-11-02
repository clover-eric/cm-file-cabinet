import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import Login from './components/Login';
import Register from './components/Register';
import Cabinet from './components/Cabinet';
import Upload from './components/Upload';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/cabinet" /> : <Login />
        } />
        <Route path="/register" element={<Register />} />
        <Route path="/cabinet" element={
          <PrivateRoute>
            <Cabinet />
          </PrivateRoute>
        } />
        <Route path="/upload" element={
          <PrivateRoute>
            <Upload />
          </PrivateRoute>
        } />
      </Routes>
    </ThemeProvider>
  );
}

export default App;