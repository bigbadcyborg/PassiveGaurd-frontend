import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './ResendVerification.css';

function ResendVerification() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [status, setStatus] = useState('idle'); // 'idle', 'sending', 'sent', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('sent');
        setMessage(data.message || 'If that email is registered, a verification link will be sent.');
      } else {
        if (data.error && data.error.includes('already verified')) {
          setStatus('verified');
          setMessage(data.error);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to resend verification email.');
        }
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="resend-verification-container">
      <div className="resend-verification-card">
        <h1>PassiveGuard</h1>
        <h2>Resend Verification Email</h2>

        {status === 'sent' && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>{message}</p>
            <p className="check-inbox">Please check your inbox and spam folder.</p>
          </div>
        )}

        {status === 'verified' && (
          <div className="info-message">
            <p>{message}</p>
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>
          </div>
        )}

        {(status === 'idle' || status === 'sending' || status === 'error') && (
          <form onSubmit={handleSubmit}>
            {status === 'error' && (
              <div className="error-message">{message}</div>
            )}
            
            <p className="instructions">
              Enter your email address and we'll send you a new verification link.
            </p>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
          <span className="separator">|</span>
          <Link to="/register">Create New Account</Link>
        </div>
      </div>
    </div>
  );
}

export default ResendVerification;
