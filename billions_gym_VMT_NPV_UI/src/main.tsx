import { createRoot } from 'react-dom/client';
import './styles/index.css';
import HomePage from './pages/home';
import AdminDashboard from './pages/admin.tsx';
import LoginPage from './pages/login';
import { auth } from './services/api';

const rootEl = document.getElementById('root')!;
const root = createRoot(rootEl);

function render() {
    const path = window.location.hash.replace('#', '') || window.location.pathname;

    if (path.startsWith('/admin')) {
        // Check authentication for admin routes
        if (!auth.isAuthenticated()) {
            window.location.hash = '/login';
            return;
        }
        root.render(<AdminDashboard />);
    } else if (path === '/login') {
        root.render(<LoginPage />);
    } else {
        root.render(<HomePage />);
    }
}

window.addEventListener('popstate', render);
window.addEventListener('hashchange', render);
render();
