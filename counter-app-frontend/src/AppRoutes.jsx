import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/LoginView';
import Dashboard from './pages/Dashboard';

const AppRoutes = () => {
  const isLoggedIn = !!localStorage.getItem('userId'); // basic auth check

  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
