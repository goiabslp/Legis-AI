import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import NewDocument from '../pages/NewDocument';
import DocumentHistory from '../pages/DocumentHistory';
import Templates from '../pages/Templates';
import Settings from '../pages/Settings';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return children;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />

          {/* Rotas Privadas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/documentos/novo"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <NewDocument />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/documentos"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <DocumentHistory />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/modelos"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Templates />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          {/* Redirecionamentos */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
export default AppRoutes;
