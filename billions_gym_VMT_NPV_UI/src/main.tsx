import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import HomePage from './pages/home';
import AdminDashboard from './pages/admin.tsx';
import LoginPage from './pages/login';
import { auth } from './services/api';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import BubbleChat from './components/BubbleChat';

const rootEl = document.getElementById('root')!;
const root = createRoot(rootEl);

// Component to handle token expiration
function AppWithNotifications() {
    const path = window.location.hash.replace('#', '') || window.location.pathname;

    if (path.startsWith('/admin')) {
        // Check authentication for admin routes
        if (!auth.isAuthenticated()) {
            window.location.hash = '/login';
            return null;
        }
        return <AdminDashboard />;
    } else if (path === '/login') {
        return <LoginPage />;
    } else {
        return <HomePage />;
    }
}

// Token expiration handler component
function TokenExpirationHandler() {
    const { showError } = useNotification();

    // Listen for token expiration events
    React.useEffect(() => {
        const handleTokenExpired = (event: CustomEvent) => {
            showError(event.detail.message);
            // Redirect to login after showing notification
            setTimeout(() => {
                window.location.hash = '/login';
            }, 2000);
        };

        window.addEventListener('tokenExpired', handleTokenExpired as EventListener);
        return () => {
            window.removeEventListener('tokenExpired', handleTokenExpired as EventListener);
        };
    }, [showError]);

    return null; // This component doesn't render anything
}

function render() {
    root.render(
        <NotificationProvider>
            <TokenExpirationHandler />
            <AppWithNotifications />
            <BubbleChat isAuthenticated={auth.isAuthenticated()} />
        </NotificationProvider>
    );
}

window.addEventListener('popstate', render);
window.addEventListener('hashchange', render);
render();
