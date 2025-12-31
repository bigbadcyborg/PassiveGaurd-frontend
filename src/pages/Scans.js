import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { scansAPI, utilsAPI, scheduledScansAPI } from '../services/api';
import socketService from '../services/socket';
import { formatDuration } from '../utils/format';
import './Scans.css';

const SCAN_TYPE_INFO = {
  full: {
    title: 'Full Scan',
    description: 'A comprehensive non-intrusive analysis combining Static Code Analysis (SAST), Taint Tracking, Dependency Scanning (SCA), Configuration Audits, and Network Traffic analysis.',
    details: [
      'SAST: Finds logical flaws and hardcoded secrets in source code.',
      'Taint Tracking: Maps data paths from untrusted sources to sensitive sinks.',
      'SCA: Identifies vulnerable 3rd-party libraries using the OSV database.',
      'Config: Ensures environment settings and IaC follow best practices.',
      'Network: Advanced analysis for insecure protocols, anomalies, and DNS exfiltration.'
    ]
  },
  code: {
    title: 'Code Analysis',
    description: 'Focuses on the application source code using SAST and Taint Tracking.',
    details: [
      'Identifies logical vulnerabilities (e.g., Command Injection, XSS).',
      'Detects hardcoded API keys, passwords, and tokens.',
      'Analyzes Abstract Syntax Trees (AST) for Python logic flaws.',
      'Traces unsanitized data flow from request parameters to database queries.'
    ]
  },
  config: {
    title: 'Configuration Analysis',
    description: 'Inspects infrastructure settings, environment variables, and deployment configs.',
    details: [
      'Flags insecure CORS, SSL/TLS, and Debug settings.',
      'Checks for exposed credentials in .env and config files.',
      'Audits Docker and environment configurations for best practices.'
    ]
  },
  traffic: {
    title: 'Network Traffic Analysis',
    description: 'Deep passive analysis of network logs and PCAP files for advanced security risks.',
    details: [
      'Detects insecure protocols (HTTP, FTP, SMTP, etc.) and legacy TLS (SSL 3.0, TLS 1.0/1.1).',
      'Flags plaintext credentials, bearer tokens, and JWTs in packet payloads.',
      'Advanced DNS security: Detects exfiltration, tunneling, and NXDOMAIN bursts.',
      'Flow Anomaly Detection: Identifies port scans, brute-force attempts, and C2 beaconing.',
      'Protocol-Aware Parsing: Verb-level analysis for FTP, SMTP, and SMBv1.'
    ]
  }
};

function Scans() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    severity: '',
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSentinel = user.role === 'sentinel';
  const canScheduleScans = user.role === 'overdrive' || user.role === 'nexus' || user.role === 'admin';
  console.log("Scans component initialized", { username: user.username, role: user.role, isSentinel });

  // Scheduled Scans State
  const [scheduledScans, setScheduledScans] = useState([]);
  const [scheduledScansLimits, setScheduledScansLimits] = useState({ max_scheduled_scans: 0, current_count: 0 });
  const [showScheduledForm, setShowScheduledForm] = useState(false);
  const [scheduledFormData, setScheduledFormData] = useState({
    name: '',
    target_path: '',
    scan_type: 'full',
    frequency: 'daily',
    day_of_week: 0,
    day_of_month: 1,
    time_of_day: '02:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    email_alerts_enabled: true,
    alert_on_severity: 'high'
  });
  const [editingScheduledScan, setEditingScheduledScan] = useState(null);
  const [scheduledScansLoading, setScheduledScansLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    target_path: '',
    scan_type: 'full',
    scan_location: isSentinel ? 'agent' : 'hub'
  });

  // Folder Picker State
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPath, setPickerPath] = useState('/app/projects');
  const [pickerItems, setPickerItems] = useState({ current: '/app/projects', parent: null, directories: [], files: [], is_agent: false });
  const [pickerLoading, setPickerLoading] = useState(false);
  const [browseTarget, setBrowseTarget] = useState(isSentinel ? 'agent' : 'hub'); // Default to agent if Sentinel

  useEffect(() => {
    loadScans();
    if (canScheduleScans) {
      loadScheduledScans();
    }
    
    // Listen for real-time scan updates
    socketService.connect();
    socketService.on('scan_progress', (data) => {
      setScans(prevScans => prevScans.map(scan => 
        scan.id === data.scan_id ? { ...scan, status: 'running' } : scan
      ));
    });

    socketService.on('scan_completed', (data) => {
      setScans(prevScans => prevScans.map(scan => 
        scan.id === data.scan_id ? { 
          ...scan, 
          status: 'completed',
          duration: data.duration,
          total_findings: data.total_findings,
          high_severity: data.high_severity,
          medium_severity: data.medium_severity,
          low_severity: data.low_severity
        } : scan
      ));
    });

    socketService.on('scan_failed', (data) => {
      setScans(prevScans => prevScans.map(scan => 
        scan.id === data.scan_id ? { ...scan, status: 'failed' } : scan
      ));
    });

    return () => {
      socketService.off('scan_progress');
      socketService.off('scan_completed');
      socketService.off('scan_failed');
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newParam = params.get('new');
    const severityParam = params.get('severity');

    if (newParam === 'true') {
      setShowForm(true);
    }

    if (severityParam) {
      setFilters(prev => ({ ...prev, severity: severityParam }));
    }

    if (newParam || severityParam) {
      // Clear parameters so they don't persist on refresh
      navigate('/scans', { replace: true });
    }
  }, [location.search, navigate]);

  const loadScans = async () => {
    try {
      const response = await scansAPI.list();
      setScans(response.data);
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledScans = async () => {
    setScheduledScansLoading(true);
    try {
      const response = await scheduledScansAPI.list();
      setScheduledScans(response.data.scheduled_scans || []);
      setScheduledScansLimits(response.data.limits || { max_scheduled_scans: 0, current_count: 0 });
    } catch (error) {
      console.error('Error loading scheduled scans:', error);
      // 403 means feature not available for this tier
      if (error.response?.status !== 403) {
        console.error('Unexpected error:', error);
      }
    } finally {
      setScheduledScansLoading(false);
    }
  };

  const handleScheduledSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingScheduledScan) {
        await scheduledScansAPI.update(editingScheduledScan.id, scheduledFormData);
      } else {
        await scheduledScansAPI.create(scheduledFormData);
      }
      setShowScheduledForm(false);
      setEditingScheduledScan(null);
      resetScheduledForm();
      loadScheduledScans();
    } catch (error) {
      console.error('Error saving scheduled scan:', error);
      alert(error.response?.data?.message || error.response?.data?.error || 'Error saving scheduled scan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetScheduledForm = () => {
    setScheduledFormData({
      name: '',
      target_path: '',
      scan_type: 'full',
      frequency: 'daily',
      day_of_week: 0,
      day_of_month: 1,
      time_of_day: '02:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      email_alerts_enabled: true,
      alert_on_severity: 'high'
    });
  };

  const handleEditScheduledScan = (scan) => {
    setEditingScheduledScan(scan);
    setScheduledFormData({
      name: scan.name,
      target_path: scan.target_path,
      scan_type: scan.scan_type || 'full',
      frequency: scan.frequency,
      day_of_week: scan.day_of_week || 0,
      day_of_month: scan.day_of_month || 1,
      time_of_day: scan.time_of_day || '02:00',
      timezone: scan.timezone || 'UTC',
      email_alerts_enabled: scan.email_alerts_enabled !== false,
      alert_on_severity: scan.alert_on_severity || 'high'
    });
    setShowScheduledForm(true);
  };

  const handleDeleteScheduledScan = async (id) => {
    if (window.confirm('Are you sure you want to delete this scheduled scan?')) {
      try {
        await scheduledScansAPI.delete(id);
        loadScheduledScans();
      } catch (error) {
        console.error('Error deleting scheduled scan:', error);
        alert('Failed to delete scheduled scan');
      }
    }
  };

  const handleRunNow = async (id) => {
    try {
      await scheduledScansAPI.runNow(id);
      alert('Scan queued for immediate execution');
      loadScans(); // Refresh scans list
    } catch (error) {
      console.error('Error running scan now:', error);
      alert(error.response?.data?.error || 'Failed to run scan');
    }
  };

  const handleToggleActive = async (scan) => {
    try {
      await scheduledScansAPI.update(scan.id, { is_active: !scan.is_active });
      loadScheduledScans();
    } catch (error) {
      console.error('Error toggling scan status:', error);
      alert('Failed to update scan status');
    }
  };

  const loadPickerData = async (path, target = browseTarget) => {
    setPickerLoading(true);
    console.log("Fetching directory list", { path, target, isSentinel });
    try {
      const useAgent = target === 'agent' || isSentinel;
      const response = await utilsAPI.ls(path, useAgent);
      console.log("Directory list response received", response.data);
      console.log("Directories:", response.data.directories);
      console.log("Files:", response.data.files);
      // Ensure files array exists, default to empty array if missing
      const pickerData = {
        ...response.data,
        directories: response.data.directories || [],
        files: response.data.files || []
      };
      setPickerItems(pickerData);
      setPickerPath(pickerData.current);
      setBrowseTarget(pickerData.is_agent ? 'agent' : 'hub');
    } catch (error) {
      console.error('Error loading directory:', error);
      const errorMessage = error.response?.data?.error || 'Could not read directory';
      const errorCode = error.response?.data?.error_code;
      
      // Special handling for Sentinel users when no agent is connected
      if (isSentinel && (errorCode === 'NO_AGENT_CONNECTED' || errorMessage.includes('No edge agent connected'))) {
        const shouldNavigate = window.confirm(
          `${errorMessage}\n\nWould you like to go to the Edge Agents page to set one up?`
        );
        if (shouldNavigate) {
          navigate('/agents');
        }
      } else {
        alert(errorMessage);
      }
    } finally {
      setPickerLoading(false);
    }
  };

  const handleBrowse = () => {
    console.log("handleBrowse triggered", { role: user.role, isSentinel, scan_location: formData.scan_location });
    setShowPicker(true);
    // Use the explicitly selected scan_location as the starting point for browsing
    const initialTarget = formData.scan_location;
    setBrowseTarget(initialTarget);
    
    // Default path for hub is /app/projects, default for agent is empty (which resolves to its root)
    const defaultPath = initialTarget === 'hub' ? '/app/projects' : '';
    console.log("Loading picker data", { path: formData.target_path || defaultPath, initialTarget });
    loadPickerData(formData.target_path || defaultPath, initialTarget);
  };

  const selectFolder = (dir) => {
    const newPath = pickerItems.current === '/' ? `/${dir}` : `${pickerItems.current}/${dir}`.replace(/\/+/g, '/');
    loadPickerData(newPath);
  };

  const goUp = () => {
    if (pickerItems.parent) {
      loadPickerData(pickerItems.parent);
    }
  };

  const confirmSelection = () => {
    setFormData({ ...formData, target_path: pickerItems.current });
    setShowPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await scansAPI.create(formData);
      setFormData({ name: '', target_path: '', scan_type: 'full', scan_location: isSentinel ? 'agent' : 'hub' });
      setShowForm(false);
      
      // Automatically navigate to the new scan's detail page
      if (response.data && response.data.id) {
        navigate(`/scans/${response.data.id}`);
      } else {
        loadScans();
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error creating scan:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error creating scan. Please check the target path exists.';
      
      if (errorMessage.includes('Sentinel users must use edge agents')) {
        if (window.confirm(`${errorMessage}\n\nWould you like to go to the Edge Agents page to set one up?`)) {
          navigate('/agents');
        }
      } else {
        alert(errorMessage);
      }
      
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (scanId) => {
    if (window.confirm('Are you sure you want to delete this scan and all its findings?')) {
      try {
        await scansAPI.delete(scanId);
        loadScans(); // Reload the list
      } catch (error) {
        console.error('Error deleting scan:', error);
        alert('Failed to delete scan.');
      }
    }
  };

  const filteredScans = scans.filter(scan => {
    if (filters.severity === 'high') return scan.high_severity > 0;
    if (filters.severity === 'medium') return scan.medium_severity > 0;
    if (filters.severity === 'low') return scan.low_severity > 0;
    return true;
  });

  if (loading) {
    return <div className="spinner" />;
  }

  return (
    <div className="scans-page">
      <div className="scans-header">
        <h1>Vulnerability Scans</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Scan'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="card-title">Create New Scan</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Scan Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Scan Execution</label>
              <select
                className="form-select"
                value={formData.scan_location}
                onChange={(e) => setFormData({ ...formData, scan_location: e.target.value })}
                disabled={isSentinel}
              >
                <option value="agent">Edge Agent (Local Scanning)</option>
                {!isSentinel && <option value="hub">Hub (Cloud Scanning)</option>}
              </select>
              <small style={{ color: 'var(--text-secondary)', marginTop: '5px', display: 'block' }}>
                {formData.scan_location === 'agent' 
                  ? "Scan will run on your local machine via the Edge Agent. Your source code stays local." 
                  : "Scan will run on the PassiveGuard server."}
                {isSentinel && " (Sentinel tier is restricted to Edge Agent scans)"}
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Target Path</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={formData.target_path}
                  onChange={(e) => setFormData({ ...formData, target_path: e.target.value })}
                  placeholder="/path/to/codebase"
                  required
                />
                <button type="button" className="btn btn-secondary" onClick={handleBrowse}>
                  Browse
                </button>
              </div>
            </div>

            {showPicker && (
              <div className="modal-overlay">
                <div className="modal-content folder-picker">
                  <button 
                    className="picker-close-btn" 
                    onClick={() => setShowPicker(false)}
                    aria-label="Close file explorer"
                  >
                    ×
                  </button>
                  <div className="picker-header">
                    <h3>Select Target Directory {pickerItems.is_agent ? '(Edge Agent)' : '(Hub)'}</h3>
                    {!isSentinel && (
                      <div className="picker-toggle">
                        <button 
                          className={`btn-toggle ${browseTarget === 'hub' ? 'active' : ''}`}
                          onClick={() => loadPickerData('/app/projects', 'hub')}
                        >
                          HUB_FS
                        </button>
                        <button 
                          className={`btn-toggle ${browseTarget === 'agent' ? 'active' : ''}`}
                          onClick={() => loadPickerData('/app/projects', 'agent')}
                        >
                          AGENT_FS
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="picker-path">
                    <strong>Current:</strong> {pickerItems.current}
                  </div>
                  <div className="picker-list">
                    {pickerItems.parent && (
                      <div className="picker-item parent" onClick={goUp}>
                        📁 .. (Parent Directory)
                      </div>
                    )}
                    {pickerLoading ? (
                      <div className="spinner-small"></div>
                    ) : (
                      <>
                        {pickerItems.directories && pickerItems.directories.length > 0 && (
                          <>
                            {pickerItems.directories.map(dir => (
                              <div key={dir} className="picker-item picker-directory" onClick={() => selectFolder(dir)}>
                                📁 {dir}
                              </div>
                            ))}
                          </>
                        )}
                        {pickerItems.files && pickerItems.files.length > 0 && (
                          <>
                            {pickerItems.files.map(file => (
                              <div key={file} className="picker-item picker-file">
                                📄 {file}
                              </div>
                            ))}
                          </>
                        )}
                        {!pickerLoading && (!pickerItems.directories || pickerItems.directories.length === 0) && (!pickerItems.files || pickerItems.files.length === 0) && (
                          <div className="picker-empty">No files or directories found</div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowPicker(false)}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={confirmSelection}>Select This Folder</button>
                  </div>
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Scan Type</label>
              <select
                className="form-select"
                value={formData.scan_type}
                onChange={(e) => setFormData({ ...formData, scan_type: e.target.value })}
              >
                <option value="full">Full Scan (Code + Config + Dependencies + Traffic)</option>
                <option value="code">Code Analysis Only</option>
                <option value="config">Configuration Analysis Only</option>
                <option value="traffic">Network Traffic Analysis Only</option>
              </select>
            </div>

            {SCAN_TYPE_INFO[formData.scan_type] && (
              <div className="scan-type-description">
                <h4>{SCAN_TYPE_INFO[formData.scan_type].title}</h4>
                <p>{SCAN_TYPE_INFO[formData.scan_type].description}</p>
                <ul>
                  {SCAN_TYPE_INFO[formData.scan_type].details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: '10px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Starting...' : 'Start Scan'}
            </button>
          </form>
        </div>
      )}

      {/* Scheduled Scans Section - Only for Overdrive/Nexus */}
      {canScheduleScans && (
        <div className="card scheduled-scans-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 className="card-title" style={{ marginBottom: '5px' }}>🔄 Scheduled Scans</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
                Recurring vulnerability scans with email alerts ({scheduledScansLimits.current_count}/{scheduledScansLimits.max_scheduled_scans} used)
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => { 
                setEditingScheduledScan(null); 
                resetScheduledForm(); 
                setShowScheduledForm(!showScheduledForm); 
              }}
              disabled={scheduledScansLimits.current_count >= scheduledScansLimits.max_scheduled_scans && !showScheduledForm}
            >
              {showScheduledForm ? 'Cancel' : '+ New Schedule'}
            </button>
          </div>

          {showScheduledForm && (
            <form onSubmit={handleScheduledSubmit} className="scheduled-scan-form" style={{ marginBottom: '20px', padding: '20px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <h3 style={{ marginTop: 0 }}>{editingScheduledScan ? 'Edit Scheduled Scan' : 'Create Scheduled Scan'}</h3>
              
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Schedule Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={scheduledFormData.name}
                    onChange={(e) => setScheduledFormData({ ...scheduledFormData, name: e.target.value })}
                    placeholder="e.g., Nightly Security Scan"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Path</label>
                  <input
                    type="text"
                    className="form-input"
                    value={scheduledFormData.target_path}
                    onChange={(e) => setScheduledFormData({ ...scheduledFormData, target_path: e.target.value })}
                    placeholder="/app/projects/your-repo"
                    required
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Scan Type</label>
                  <select
                    className="form-select"
                    value={scheduledFormData.scan_type}
                    onChange={(e) => setScheduledFormData({ ...scheduledFormData, scan_type: e.target.value })}
                  >
                    <option value="full">Full Scan</option>
                    <option value="code">Code Analysis</option>
                    <option value="config">Config Analysis</option>
                    <option value="traffic">Network Traffic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select
                    className="form-select"
                    value={scheduledFormData.frequency}
                    onChange={(e) => setScheduledFormData({ ...scheduledFormData, frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Time (UTC)</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduledFormData.time_of_day}
                    onChange={(e) => setScheduledFormData({ ...scheduledFormData, time_of_day: e.target.value })}
                    required
                  />
                </div>
              </div>

              {scheduledFormData.frequency === 'weekly' && (
                <div className="form-group">
                  <label className="form-label">Day of Week</label>
                  <select
                    className="form-select"
                    value={scheduledFormData.day_of_week}
                    onChange={(e) => setScheduledFormData({ ...scheduledFormData, day_of_week: parseInt(e.target.value) })}
                  >
                    <option value={0}>Monday</option>
                    <option value={1}>Tuesday</option>
                    <option value={2}>Wednesday</option>
                    <option value={3}>Thursday</option>
                    <option value={4}>Friday</option>
                    <option value={5}>Saturday</option>
                    <option value={6}>Sunday</option>
                  </select>
                </div>
              )}

              {scheduledFormData.frequency === 'monthly' && (
                <div className="form-group">
                  <label className="form-label">Day of Month</label>
                  <select
                    className="form-select"
                    value={scheduledFormData.day_of_month}
                    onChange={(e) => setScheduledFormData({ ...scheduledFormData, day_of_month: parseInt(e.target.value) })}
                  >
                    {[...Array(28)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={scheduledFormData.email_alerts_enabled}
                      onChange={(e) => setScheduledFormData({ ...scheduledFormData, email_alerts_enabled: e.target.checked })}
                      style={{ width: 'auto' }}
                    />
                    Email alerts enabled
                  </label>
                </div>
                {scheduledFormData.email_alerts_enabled && (
                  <div className="form-group">
                    <label className="form-label">Minimum Alert Severity</label>
                    <select
                      className="form-select"
                      value={scheduledFormData.alert_on_severity}
                      onChange={(e) => setScheduledFormData({ ...scheduledFormData, alert_on_severity: e.target.value })}
                    >
                      <option value="low">Low and above</option>
                      <option value="medium">Medium and above</option>
                      <option value="high">High only</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingScheduledScan ? 'Update Schedule' : 'Create Schedule')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowScheduledForm(false); setEditingScheduledScan(null); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {scheduledScansLoading ? (
            <div className="spinner-small"></div>
          ) : scheduledScans.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No scheduled scans yet. Create one to automate your vulnerability scanning.</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Target</th>
                    <th>Frequency</th>
                    <th>Next Run</th>
                    <th>Email Alerts</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledScans.map(scan => (
                    <tr key={scan.id}>
                      <td>{scan.name}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.target_path}</td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {scan.frequency}
                        {scan.frequency === 'weekly' && ` (${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][scan.day_of_week]})`}
                        {scan.frequency === 'monthly' && ` (Day ${scan.day_of_month})`}
                        {' @ '}{scan.time_of_day}
                      </td>
                      <td>{scan.next_run_at ? new Date(scan.next_run_at).toLocaleString() : '-'}</td>
                      <td>
                        {scan.email_alerts_enabled ? (
                          <span className="badge badge-success" style={{ background: 'var(--success)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>
                            ✓ {scan.alert_on_severity}+
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>Off</span>
                        )}
                      </td>
                      <td>
                        <span 
                          className={`status-badge ${scan.is_active ? 'status-completed' : 'status-failed'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleToggleActive(scan)}
                          title="Click to toggle"
                        >
                          {scan.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleRunNow(scan.id)} 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Run immediately"
                          >
                            ▶ Run Now
                          </button>
                          <button 
                            onClick={() => handleEditScheduledScan(scan)} 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteScheduledScan(scan.id)} 
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Upgrade prompt for Sentinel users */}
      {isSentinel && (
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--background) 100%)', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '48px' }}>🔄</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 5px 0' }}>Scheduled Scans with Email Alerts</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Upgrade to Overdrive or Nexus to set up recurring vulnerability scans with automatic email notifications when issues are found.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/pricing')}>
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>All Scans</h2>
          <div className="filters">
            <select
              className="form-select"
              style={{ width: '200px' }}
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            >
              <option value="">All Severities</option>
              <option value="high">Has High Severity</option>
              <option value="medium">Has Medium Severity</option>
              <option value="low">Has Low Severity</option>
            </select>
          </div>
        </div>
        {scans.length === 0 ? (
          <p>No scans yet. Create your first scan to get started.</p>
        ) : filteredScans.length === 0 ? (
          <p>No scans found matching your criteria.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Target</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Findings</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map(scan => (
                  <tr key={scan.id}>
                    <td>{scan.name}</td>
                    <td>{scan.target_path}</td>
                    <td>{scan.scan_type}</td>
                    <td>
                      <span className={`status-badge status-${scan.status}`}>
                        {scan.status}
                      </span>
                    </td>
                    <td>{formatDuration(scan.duration)}</td>
                    <td>
                      <span className="badge badge-high">{scan.high_severity}</span>
                      <span className="badge badge-medium">{scan.medium_severity}</span>
                      <span className="badge badge-low">{scan.low_severity}</span>
                    </td>
                    <td>{new Date(scan.created_at).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <Link to={`/scans/${scan.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          View Details
                        </Link>
                        <button 
                          onClick={() => handleDelete(scan.id)} 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scans;

