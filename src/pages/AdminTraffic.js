import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './AdminTraffic.css';

function AdminTraffic() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workerError, setWorkerError] = useState('');
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    fetchTrafficData();
    const interval = setInterval(fetchTrafficData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchTrafficData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/admin/traffic', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      setWorkerError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch traffic analytics');
      setWorkerError(err.response?.data?.error || '');
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    setEmailTestLoading(true);
    setEmailTestResult(null);
    try {
      const token = localStorage.getItem('access_token');
      const payload = testEmail ? { email: testEmail } : {};
      const response = await axios.post('/api/scheduled-scans/test-email', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailTestResult({ success: true, message: response.data.message });
    } catch (err) {
      setEmailTestResult({ 
        success: false, 
        message: err.response?.data?.error || 'Failed to send test email' 
      });
    } finally {
      setEmailTestLoading(false);
    }
  };

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error-message">{error}</div>;

  const workerHealth = data.worker_health || {};
  const workers = workerHealth.workers || [];
  const lastChecked = workerHealth.checked_at ? new Date(workerHealth.checked_at).toLocaleTimeString() : '—';

  return (
    <div className="admin-traffic-page">
      <div className="admin-header">
        <h1>System Traffic Analytics</h1>
        <div className="admin-meta">Live Monitoring Active</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">TOTAL_REQUESTS (ALL_TIME)</div>
          <div className="stat-value">{data.total_requests}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">WORKER_NODE_STATUS</div>
          <div className="stat-value" style={{ color: data.worker_online ? 'var(--neon-green)' : 'var(--neon-pink)' }}>
            {data.worker_online ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">LAST_WORKER_CHECK</div>
          <div className="stat-value" style={{ fontSize: '14px' }}>{lastChecked}</div>
        </div>
      </div>

      <div className="card email-test-card">
        <h2 className="card-title">Email Configuration Test</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
          Send a test email with mock scan results to verify SMTP configuration is working correctly.
        </p>
        <div className="email-test-form">
          <input
            type="email"
            placeholder="Email address (leave blank to use your admin email)"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="form-control"
            style={{ flex: 1, marginRight: '12px' }}
          />
          <button 
            onClick={sendTestEmail}
            disabled={emailTestLoading}
            className="btn btn-primary"
          >
            {emailTestLoading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
        {emailTestResult && (
          <div 
            className={`email-test-result ${emailTestResult.success ? 'success' : 'error'}`}
            style={{ 
              marginTop: '16px', 
              padding: '12px', 
              borderRadius: '4px',
              backgroundColor: emailTestResult.success ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 77, 136, 0.1)',
              border: `1px solid ${emailTestResult.success ? 'var(--neon-green)' : 'var(--neon-pink)'}`,
              color: emailTestResult.success ? 'var(--neon-green)' : 'var(--neon-pink)'
            }}
          >
            {emailTestResult.message}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Worker Details</h2>
        {workerError && <div className="error-message">{workerError}</div>}
        {!workers.length && !workerError && (
          <div className="empty-state">No workers responded.</div>
        )}
        {workers.length > 0 && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>IMPLEMENTATION</th>
                  <th>PID</th>
                  <th>CLOCK</th>
                  <th>RAW PING</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w, idx) => (
                  <tr key={w.name || idx}>
                    <td style={{ fontFamily: 'monospace' }}>{w.name || 'unknown'}</td>
                    <td>{w.implementation || 'n/a'}</td>
                    <td>{w.pid ?? 'n/a'}</td>
                    <td>{w.clock ?? 'n/a'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                      {w.response ? JSON.stringify(w.response) : 'n/a'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="charts-grid">
        <div className="card">
          <h2 className="card-title">Traffic Volume (Last 24h)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.traffic_over_time}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--neon-cyan)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--neon-cyan)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="time" 
                tickFormatter={(time) => new Date(time).getHours() + ':00'}
                stroke="var(--text-secondary)"
              />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid var(--neon-cyan)' }}
                itemStyle={{ color: 'var(--neon-cyan)' }}
              />
              <Area type="monotone" dataKey="count" stroke="var(--neon-cyan)" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="card-title">Top API Endpoints</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.top_endpoints} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="var(--text-secondary)" />
              <YAxis dataKey="endpoint" type="category" stroke="var(--text-secondary)" width={150} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid var(--neon-cyan)' }}
                itemStyle={{ color: 'var(--neon-cyan)' }}
              />
              <Bar dataKey="count" fill="var(--neon-purple)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Live Request Stream</h2>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>USER</th>
                <th>METHOD</th>
                <th>ENDPOINT</th>
                <th>STATUS</th>
                <th>IP_ADDRESS</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '11px' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td style={{ color: log.username === 'Anonymous' ? 'var(--text-secondary)' : 'var(--neon-cyan)' }}>
                    {log.username}
                  </td>
                  <td>
                    <span className={`badge ${log.method === 'GET' ? 'badge-low' : 'badge-medium'}`}>
                      {log.method}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.endpoint}</td>
                  <td>
                    <span className={`status-badge ${log.status_code < 400 ? 'status-completed' : 'status-failed'}`}>
                      {log.status_code}
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminTraffic;

