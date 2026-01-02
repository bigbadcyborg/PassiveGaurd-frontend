import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './VerifyEmail.css';

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'expired'
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link.');
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch(`/api/auth/verify-email/${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { state: { message: 'Email verified! Please log in.' } });
        }, 3000);
      } else {
        if (data.error && data.error.includes('expired')) {
          setStatus('expired');
          setMessage(data.error);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <div className="spinner"></div>;
      case 'success':
        return <div className="status-icon success">✓</div>;
      case 'error':
      case 'expired':
        return <div className="status-icon error">✕</div>;
      default:
        return null;
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h1>PassiveGuard</h1>
        <h2>Email Verification</h2>
        
        <div className={`status-container ${status}`}>
          {getStatusIcon()}
          <p className="status-message">{message}</p>
        </div>

        {status === 'success' && (
          <p className="redirect-notice">Redirecting to login page...</p>
        )}

        {status === 'expired' && (
          <div className="expired-actions">
            <p>Need a new verification link?</p>
            <Link to="/resend-verification" className="btn btn-primary">
              Resend Verification Email
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="error-actions">
            <Link to="/login" className="btn btn-secondary">
              Go to Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Register Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
