import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import PackageDetail from './pages/PackageDetail'
import Checkout from './pages/Checkout'
import PaymentSuccess from './pages/PaymentSuccess'
import PackageWorkflow from './pages/PackageWorkflow'
import { authUtils } from './utils/auth'
import { NotificationProvider, useNotification } from './contexts/NotificationContext'
import { LanguageProvider } from './contexts/LanguageContext'
import './styles/globals.css'
import './styles/responsive.css'
import './styles/header-responsive.css'
import ProfileScreen from './pages/Profile'
import ProfileEdit from './pages/ProfileEdit'

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const { showSessionExpired } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authUtils.isAuthenticated();
      setIsAuthenticated(isAuth);
      setIsLoading(false);
    };

    checkAuth();

    const authCheckInterval = setInterval(() => {
      const isAuth = authUtils.isAuthenticated();
      if (isAuthenticated && !isAuth) {
        setIsAuthenticated(false);
        showSessionExpired();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(authCheckInterval);
  }, [isAuthenticated, showSessionExpired]);

  useEffect(() => {
    const handleStorageChange = () => {
      const isAuth = authUtils.isAuthenticated();
      if (isAuth && !isAuthenticated) {
        setIsTransitioning(true);
        setTimeout(() => {
          setIsAuthenticated(true);
          setIsTransitioning(false);
        }, 500);
      } else if (!isAuth && isAuthenticated) {
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const navigateToPage = (page) => {
    setIsPageTransitioning(true);
    setTimeout(() => {
      navigate(`/${page}`);
      setTimeout(() => {
        setIsPageTransitioning(false);
      }, 50);
    }, 250);
  };

  return (
    <div className="relative overflow-hidden">
      {isPageTransitioning ? (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128] mx-auto mb-4"></div>
            <p className="text-white text-lg">Đang chuyển trang...</p>
          </div>
        </div>
      ) : (
        <div className={`transition-all duration-300 ease-in-out ${isPageTransitioning
          ? 'opacity-0 scale-95 translate-x-4'
          : 'opacity-100'
          }`}>
          <Routes>
            <Route path="/" element={<Home onNavigateToLogin={() => navigateToPage('login')} onNavigateToRegister={() => navigateToPage('register')} />} />
            <Route path="/home" element={<Home onNavigateToLogin={() => navigateToPage('login')} onNavigateToRegister={() => navigateToPage('register')} />} />
            <Route path="/goi-tap/:id" element={<PackageDetail onNavigateToLogin={() => navigateToPage('login')} onNavigateToRegister={() => navigateToPage('register')} />} />
            <Route path="/checkout/:id" element={<Checkout onNavigateToLogin={() => navigateToPage('login')} onNavigateToRegister={() => navigateToPage('register')} />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/package-workflow/:registrationId" element={<PackageWorkflow />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path='/profile' element={<ProfileScreen />} />
            <Route path='/profile/edit' element={<ProfileEdit />} />
          </Routes>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <LanguageProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </LanguageProvider>
    </Router>
  )
}

export default App