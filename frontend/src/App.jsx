import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import './App.css';

// Clears session and redirects to login
function LogoutPage() {
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.clear();
    navigate('/login', { replace: true });
  }, [navigate]);
  return null;
}

// Redirects to role's home dashboard, or login if not authenticated
function HomeRedirect() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(userStr);
    if (user.role === 'SYSTEM_ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'STORE_OWNER')  return <Navigate to="/owner" replace />;
    return <Navigate to="/stores" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
}

// Only requires the user to be logged in — no role restriction
function RequireAuth({ children }) {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<HomeRedirect />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/admin"  element={<RequireAuth><AdminDashboard /></RequireAuth>} />
        <Route path="/stores" element={<RequireAuth><UserDashboard /></RequireAuth>} />
        <Route path="/owner"  element={<RequireAuth><OwnerDashboard /></RequireAuth>} />
        <Route path="*"       element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
