import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RepoProvider } from './context/RepoContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/layout/Navbar';
import MobileTabBar from './components/layout/MobileTabBar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import GraphPage from './pages/GraphPage';
import EvaluationPage from './pages/EvaluationPage';
import DocsPage from './pages/DocsPage';
import InstallPWA from './components/common/InstallPWA';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-sm">
        Initializing CodeChat AI...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicHomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

const AppLayout = () => {
  return (
    <RepoProvider>
      <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 overflow-hidden">
        <Navbar />
        <div className="flex-1 flex overflow-hidden relative">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/eval" element={<EvaluationPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
        {/* Mobile bottom tab bar on small screens */}
        <MobileTabBar />
      </div>
    </RepoProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InstallPWA />
        <Router>
          <Routes>
            <Route path="/" element={<PublicHomeRoute />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
