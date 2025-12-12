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
import UserProfile from './pages/UserProfile'
import ActivePackage from './pages/ActivePackage'
import Schedule from './pages/Schedule'
import CheckInOut from './pages/CheckInOut'
import Exercises from './pages/Exercises'
import ChatWithPT from './pages/ChatWithPT'
import BodyMetrics from './pages/BodyMetrics'
import Nutrition from './pages/Nutrition'
import MyMeals from './pages/MyMeals'
import BubbleChat from './components/BubbleChat'
// PT Pages
import PTDashboard from './pages/pt/PTDashboard'
import PTProfile from './pages/pt/PTProfile'
import PTSchedule from './pages/pt/PTSchedule'
import PTWorkSchedule from './pages/pt/PTWorkSchedule'
import PTStudents from './pages/pt/PTStudents'
import PTStudentDetail from './pages/pt/PTStudentDetail'
import PTSessions from './pages/pt/PTSessions'
import PTAssignExercises from './pages/pt/PTAssignExercises'
import PTChat from './pages/pt/PTChat'
import PTStatistics from './pages/pt/PTStatistics'
import PTHistory from './pages/pt/PTHistory'
import PTTemplates from './pages/pt/PTTemplates'
import PTReviews from './pages/pt/PTReviews'
import PTCheckInOut from './pages/pt/PTCheckInOut'

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
      if (!isAuth && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register') {
        navigate('/');
      }
    };

    checkAuth();

    const authCheckInterval = setInterval(() => {
      const isAuth = authUtils.isAuthenticated();
      if (isAuthenticated && !isAuth) {
        setIsAuthenticated(false);
        showSessionExpired();
        if (location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register') {
          navigate('/');
        }
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(authCheckInterval);
  }, [isAuthenticated, showSessionExpired, location.pathname, navigate]);

  useEffect(() => {
    const handleStorageChange = () => {
      const isAuth = authUtils.isAuthenticated();
      if (isAuth && !isAuthenticated) {
        setIsPageTransitioning(true);
        setTimeout(() => {
          setIsAuthenticated(true);
          setIsPageTransitioning(false);
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
    // Remove global overflow-hidden so pages can scroll on the viewport level.
    <div className="relative" key={location.pathname}>
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
          <Routes location={location}>
            <Route path="/" element={<Home onNavigateToLogin={() => navigateToPage('login')} onNavigateToRegister={() => navigateToPage('register')} />} />
            <Route path="/home" element={<Home onNavigateToLogin={() => navigateToPage('login')} onNavigateToRegister={() => navigateToPage('register')} />} />
            <Route path="/goi-tap/:id" element={<PackageDetail onNavigateToLogin={() => navigateToPage('login')} onNavigateToRegister={() => navigateToPage('register')} />} />
            <Route path="/checkout/:id" element={<Checkout onNavigateToLogin={() => navigateToPage('login')} onNavigateToRegister={() => navigateToPage('register')} />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/package-workflow/:registrationId" element={<PackageWorkflow />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path='/profile' element={<UserProfile />} />
            <Route path='/profile/old' element={<ProfileScreen />} />
            <Route path='/profile/edit' element={<ProfileEdit />} />
            <Route path='/active-package' element={<ActivePackage />} />
            <Route path='/schedule' element={<Schedule />} />
            <Route path='/checkin-out' element={<CheckInOut />} />
            <Route path='/workouts' element={<Exercises />} />
            <Route path='/chat-with-pt' element={<ChatWithPT />} />
            <Route path='/body-metrics' element={<BodyMetrics />} />
            <Route path='/nutrition' element={<Nutrition />} />
            <Route path='/my-meals' element={<MyMeals />} />
            {/* PT Routes */}
            <Route path='/pt/dashboard' element={<PTDashboard />} />
            <Route path='/pt/profile' element={<PTProfile />} />
            <Route path='/pt/statistics' element={<PTStatistics />} />
            <Route path='/pt/work-schedule' element={<PTWorkSchedule />} />
            <Route path='/pt/schedule' element={<PTSchedule />} />
            <Route path='/pt/students' element={<PTStudents />} />
            <Route path='/pt/students/:id' element={<PTStudentDetail />} />
            <Route path='/pt/sessions' element={<PTSessions />} />
            <Route path='/pt/work-history' element={<PTHistory />} />
            <Route path='/pt/templates' element={<PTTemplates />} />
            <Route path='/pt/assign-exercises' element={<PTAssignExercises />} />
            <Route path='/pt/chat' element={<PTChat />} />
            <Route path='/pt/reviews' element={<PTReviews />} />
            <Route path='/pt/checkin-out' element={<PTCheckInOut />} />
          </Routes>

          {/* Bubble Chat AI - Only show for authenticated users */}
          {isAuthenticated && <BubbleChat isAuthenticated={isAuthenticated} />}
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