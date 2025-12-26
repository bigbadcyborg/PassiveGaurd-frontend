import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Scans from './pages/Scans';
import ScanDetail from './pages/ScanDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import AdminUsers from './pages/AdminUsers';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminTraffic from './pages/AdminTraffic';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import './App.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/home" />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
}

function MainContent({ isAuthenticated }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/home';
  
  return (
    <main className={isAuthenticated && !isHomePage ? "main-content" : ""}>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/scans"
          element={
            <PrivateRoute>
              <Scans />
            </PrivateRoute>
          }
        />
        <Route
          path="/scans/:scanId"
          element={
            <PrivateRoute>
              <ScanDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/blog"
          element={
            <PrivateRoute>
              <Blog />
            </PrivateRoute>
          }
        />
        <Route
          path="/blog/:postId"
          element={
            <PrivateRoute>
              <BlogPost />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <AdminRoute>
              <AdminUserDetail />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/traffic"
          element={
            <AdminRoute>
              <AdminTraffic />
            </AdminRoute>
          }
        />
      </Routes>
    </main>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/80376fec-ba63-42de-a07a-af79a6d957d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:116',message:'App mounted',data:{isAuthenticated,pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
  }, [isAuthenticated]);
  // #endregion

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      setIsAuthenticated(!!token);
    };

    // Listen for storage changes to update auth state across tabs/windows
    window.addEventListener('storage', checkAuth);
    
    // Initial check
    checkAuth();

    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className="App">
        <div className="global-scanline"></div>
        <Navbar />
        <MainContent isAuthenticated={isAuthenticated} />
      </div>
    </Router>
  );
}

export default App;

