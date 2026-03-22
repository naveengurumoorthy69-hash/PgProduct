import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { UpdatePassword } from './pages/UpdatePassword';
import { PGSelection } from './pages/PGSelection';
import { Dashboard } from './pages/Dashboard';
import { Rooms } from './pages/Rooms';
import { Tenants } from './pages/Tenants';
import { Rent } from './pages/Rent';
import { Expenses } from './pages/Expenses';
import { Advance } from './pages/Advance';
import { Reports } from './pages/Reports';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/select-pg" element={<PGSelection />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/rent" element={<Rent />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/advance" element={<Advance />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          
          <Route path="*" element={<Navigate to={{ pathname: "/", hash: window.location.hash }} replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
