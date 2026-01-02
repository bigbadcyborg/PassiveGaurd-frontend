import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { scansAPI } from '../services/api';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailNotVerified(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else if (data.email_not_verified) {
        setEmailNotVerified(true);
        setUnverifiedEmail(data.email || '');
        setError(data.error);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>PassiveGuard</h1>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          {successMessage && <div style={{ color: '#28a745', marginBottom: '20px', textAlign: 'center', backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px', border: '1px solid #c3e6cb' }}>{successMessage}</div>}
          {error && !emailNotVerified && <div className="error-message">{error}</div>}
          
          {emailNotVerified && (
            <div className="verification-required">
              <div className="verification-icon">✉️</div>
              <p><strong>Email verification required</strong></p>
              <p>{error}</p>
              <Link 
                to="/resend-verification" 
                state={{ email: unverifiedEmail }}
                className="resend-link"
              >
                Resend verification email
              </Link>
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
          Don't have an account? <Link to="/register" style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}>Register here</Link>
        </div>
        <div className="login-hint">
          <p>Default credentials:</p>
          <p>Admin: admin / admin123</p>
          <p>User: user / user123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

