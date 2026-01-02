import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scansAPI, findingsAPI } from '../services/api';
import socketService from '../services/socket';
import { formatDuration } from '../utils/format';
import './ScanDetail.css';

function ScanDetail() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    type: '',
  });

  // Live Progress State
  const [progress, setProgress] = useState(null);
  const [liveDuration, setLiveDuration] = useState(0);

  useEffect(() => {
    loadScanData();
  }, [scanId, filters]);

  // Live Timer for Running Scans
  useEffect(() => {
    let timer;
    if (scan?.status === 'running' || scan?.status === 'pending') {
      const startTime = new Date(scan.created_at).getTime();
      timer = setInterval(() => {
        const now = new Date().getTime();
        setLiveDuration(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else if (scan?.duration) {
      setLiveDuration(scan.duration);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [scan?.status, scan?.created_at, scan?.duration]);

  // WebSocket for real-time updates
  useEffect(() => {
    socketService.connect();
    socketService.joinScan(scanId);

    socketService.on('scan_progress', (data) => {
      if (data.scan_id === parseInt(scanId)) {
        setProgress({
          state: 'PROGRESS',
          current: data.current,
          total: data.total,
          status: data.status
        });
        setScan(prevScan => ({ ... prevScan, status: 'running' }));
      }
    });

    socketService.on('scan_completed', (data) => {
      if (data. scan_id === parseInt(scanId)) {
        setProgress({ state: 'SUCCESS', status: 'Scan completed successfully' });
        setScan(prevScan => ({ ...prevScan, status: 'completed', duration: data.duration }));
        loadScanData();
      }
    });

    socketService.on('scan_failed', (data) => {
      if (data.scan_id === parseInt(scanId)) {
        setProgress({ state: 'FAILURE', status: 'Scan failed', error: data.error });
        setScan(prevScan => ({ ...prevScan, status: 'failed' }));
      }
    });

    return () => {
      socketService.off('scan_progress');
      socketService.off('scan_completed');
      socketService.off('scan_failed');
    };
  }, [scanId]);

  const loadScanData = async () => {
    try {
      const [scanResponse, findingsResponse] = await Promise.all([
        scansAPI.get(scanId),
        scansAPI.getFindings(scanId, filters),
      ]);
      setScan(scanResponse.data.scan);
      setFindings(findingsResponse.data);
    } catch (error) {
      console.error('Error loading scan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (findingId, newStatus) => {
    try {
      await findingsAPI.updateStatus(findingId, newStatus);
      loadScanData();
    } catch (error) {
      console.error('Error updating finding status:', error);
    }
  };

  const linkify = (text) => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
    const parts = text.split(urlRegex);
    
    return parts. map((part, i) => {
      if (part && part.match(/^https?:\/\//)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="linkified"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this scan and all its findings?')) {
      try {
        await scansAPI. delete(scanId);
        navigate('/scans');
      } catch (error) {
        console.error('Error deleting scan:', error);
        alert('Failed to delete scan.');
      }
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const response = await scansAPI.exportScan(scanId, 'pdf');
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document. createElement('a');
      link.href = url;
      link. setAttribute('download', `PassiveGuard_Scan_${scanId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to generate PDF report.');
    } finally {
      setExporting(false);
    }
  };

  // ========== NEW:  Network Finding Parser ==========
  const parseNetworkFinding = (finding) => {
    // Check if this is a network-related finding
    const networkTypes = [
      'dns_exfiltration', 'dns_tunneling', 'nxdomain_burst',
      'port_scan', 'brute_force_attempt', 'c2_beaconing',
      'flow_anomaly', 'insecure_protocol', 'plaintext_credential'
    ];

    if (! networkTypes.includes(finding.vulnerability_type)) {
      return null; // Not a network finding
    }

    // Try to parse data_flow_trace as JSON for structured network data
    let networkData = null;
    try {
      if (finding.data_flow_trace) {
        networkData = JSON.parse(finding.data_flow_trace);
      }
    } catch (e) {
      // If not JSON, it's just text - that's fine
    }

    return {
      isNetwork: true,
      type: finding.vulnerability_type,
      data: networkData,
      rawTrace: finding.data_flow_trace
    };
  };

  // ========== NEW: Network Finding Renderer ==========
  const renderNetworkFinding = (finding, networkInfo) => {
    const { type, data } = networkInfo;

    switch (type) {
      case 'dns_exfiltration': 
      case 'dns_tunneling': 
        return (
          <div className="network-finding-details dns-finding">
            <h4>🚨 DNS Security Alert</h4>
            <div className="network-detail-grid">
              {data?. domain && (
                <div className="network-detail-item">
                  <span className="network-label">Suspicious Domain:</span>
                  <code className="network-value">{data.domain}</code>
                </div>
              )}
              {data?.query_count && (
                <div className="network-detail-item">
                  <span className="network-label">Query Count:</span>
                  <span className="network-value badge badge-high">{data.query_count}</span>
                </div>
              )}
              {data?.entropy && (
                <div className="network-detail-item">
                  <span className="network-label">Entropy Score:</span>
                  <span className="network-value">{data.entropy. toFixed(2)}</span>
                </div>
              )}
              {data?.pattern && (
                <div className="network-detail-item">
                  <span className="network-label">Detected Pattern:</span>
                  <code className="network-value">{data.pattern}</code>
                </div>
              )}
            </div>
          </div>
        );

      case 'port_scan':
        return (
          <div className="network-finding-details port-scan-finding">
            <h4>🔍 Port Scan Detection</h4>
            <div className="network-detail-grid">
              {data?.source_ip && (
                <div className="network-detail-item">
                  <span className="network-label">Source IP:</span>
                  <code className="network-value">{data.source_ip}</code>
                </div>
              )}
              {data?.target_ports && (
                <div className="network-detail-item">
                  <span className="network-label">Targeted Ports:</span>
                  <code className="network-value">{Array.isArray(data.target_ports) ? data.target_ports.join(', ') : data.target_ports}</code>
                </div>
              )}
              {data?.scan_type && (
                <div className="network-detail-item">
                  <span className="network-label">Scan Type:</span>
                  <span className="badge badge-medium">{data.scan_type}</span>
                </div>
              )}
              {data?.duration && (
                <div className="network-detail-item">
                  <span className="network-label">Duration:</span>
                  <span className="network-value">{data.duration}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'c2_beaconing':
        return (
          <div className="network-finding-details c2-finding">
            <h4>⚠️ Command & Control Activity</h4>
            <div className="network-detail-grid">
              {data?.destination && (
                <div className="network-detail-item">
                  <span className="network-label">C2 Server:</span>
                  <code className="network-value">{data.destination}</code>
                </div>
              )}
              {data?.beacon_interval && (
                <div className="network-detail-item">
                  <span className="network-label">Beacon Interval:</span>
                  <span className="network-value">{data.beacon_interval}</span>
                </div>
              )}
              {data?.regularity_score && (
                <div className="network-detail-item">
                  <span className="network-label">Regularity Score:</span>
                  <span className="network-value badge badge-high">{data.regularity_score.toFixed(2)}</span>
                </div>
              )}
              {data?.packet_count && (
                <div className="network-detail-item">
                  <span className="network-label">Packet Count:</span>
                  <span className="network-value">{data.packet_count}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'insecure_protocol':
        return (
          <div className="network-finding-details protocol-finding">
            <h4>🔓 Insecure Protocol Detected</h4>
            <div className="network-detail-grid">
              {data?.protocol && (
                <div className="network-detail-item">
                  <span className="network-label">Protocol:</span>
                  <span className="badge badge-medium">{data.protocol}</span>
                </div>
              )}
              {data?. version && (
                <div className="network-detail-item">
                  <span className="network-label">Version:</span>
                  <code className="network-value">{data.version}</code>
                </div>
              )}
              {data?.port && (
                <div className="network-detail-item">
                  <span className="network-label">Port:</span>
                  <span className="network-value">{data.port}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'plaintext_credential':
        return (
          <div className="network-finding-details credential-finding">
            <h4>🔑 Plaintext Credential Exposure</h4>
            <div className="network-detail-grid">
              {data?.protocol && (
                <div className="network-detail-item">
                  <span className="network-label">Protocol:</span>
                  <span className="badge badge-high">{data.protocol}</span>
                </div>
              )}
              {data?.credential_type && (
                <div className="network-detail-item">
                  <span className="network-label">Credential Type:</span>
                  <span className="network-value">{data.credential_type}</span>
                </div>
              )}
              {data?.packet_number && (
                <div className="network-detail-item">
                  <span className="network-label">Packet #:</span>
                  <span className="network-value">{data.packet_number}</span>
                </div>
              )}
            </div>
            <div className="security-notice">
              <strong>⚠️ Security Notice:</strong> Credentials were transmitted in cleartext and are visible to network attackers.
            </div>
          </div>
        );

      case 'brute_force_attempt':
        return (
          <div className="network-finding-details brute-force-finding">
            <h4>🔨 Brute Force Attack Detected</h4>
            <div className="network-detail-grid">
              {data?.source_ip && (
                <div className="network-detail-item">
                  <span className="network-label">Attacker IP:</span>
                  <code className="network-value">{data.source_ip}</code>
                </div>
              )}
              {data?.attempt_count && (
                <div className="network-detail-item">
                  <span className="network-label">Attempts:</span>
                  <span className="network-value badge badge-high">{data.attempt_count}</span>
                </div>
              )}
              {data?.target_service && (
                <div className="network-detail-item">
                  <span className="network-label">Target Service:</span>
                  <span className="badge badge-medium">{data.target_service}</span>
                </div>
              )}
              {data?.timeframe && (
                <div className="network-detail-item">
                  <span className="network-label">Timeframe:</span>
                  <span className="network-value">{data.timeframe}</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        // Generic network finding display
        return (
          <div className="network-finding-details generic-network">
            <h4>🌐 Network Anomaly Detected</h4>
            {data && (
              <div className="network-detail-grid">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="network-detail-item">
                    <span className="network-label">{key. replace(/_/g, ' ').toUpperCase()}:</span>
                    <span className="network-value">{JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return <div className="spinner" />;
  }

  if (! scan) {
    return <div>Scan not found</div>;
  }

  return (
    <div className="scan-detail">
      <div className="scan-header">
        <div>
          <h1>{scan.name}</h1>
          <div className="scan-meta">
            <span className={`status-badge status-${scan.status}`}>{scan.status}</span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleExportPDF} 
            className="btn btn-primary" 
            style={{ marginRight: '10px' }}
            disabled={exporting || scan.status === 'running' || scan.status === 'pending'}
          >
            {exporting ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            Delete Scan
          </button>
        </div>
      </div>

      {(scan.status === 'pending' || scan.status === 'running') && (
        <div className="card progress-card">
          <h3 className="card-title">Live Scan Progress</h3>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${((progress?. current || 0) / (progress?.total || 6)) * 100}%` }}
            ></div>
          </div>
          <p className="progress-status">
            <span className="spinner-small"></span> {progress?.status || 'Initializing System... '}
          </p>
        </div>
      )}

      <div className="scan-info-grid">
        <div className="card">
          <h3 className="card-title">Scan Information</h3>
          <p><strong>Target:</strong> {scan.target_path}</p>
          <p><strong>Type:</strong> {scan.scan_type}</p>
          <p><strong>Duration:</strong> {formatDuration(scan.status === 'running' || scan.status === 'pending' ? liveDuration : scan.duration)}</p>
          <p><strong>Created:</strong> {new Date(scan.created_at).toLocaleString()}</p>
          {scan.completed_at && (
            <p><strong>Completed:</strong> {new Date(scan.completed_at).toLocaleString()}</p>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Summary</h3>
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="summary-label">Total Findings</span>
              <span className="summary-value">{scan.total_findings}</span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">High</span>
              <span className="summary-value badge badge-high">{scan.high_severity}</span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">Medium</span>
              <span className="summary-value badge badge-medium">{scan. medium_severity}</span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">Low</span>
              <span className="summary-value badge badge-low">{scan.low_severity}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Findings</h2>
        
        <div className="filters">
          <select
            className="form-select"
            style={{ width: '200px', marginRight: '10px' }}
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          >
            <option value="">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="form-select"
            style={{ width: '200px', marginRight: '10px' }}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="false_positive">False Positive</option>
            <option value="accepted_risk">Accepted Risk</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>

        {findings.length === 0 ? (
          <p>No findings found. </p>
        ) : (
          <div className="findings-list">
            {findings.map(finding => {
              const networkInfo = parseNetworkFinding(finding);
              
              return (
                <div key={finding. id} className={`finding-card ${networkInfo ?  'network-finding-card' : ''}`}>
                  <div className="finding-header">
                    <div>
                      <h3>{finding.title}</h3>
                      <div className="finding-meta">
                        <span className={`badge badge-${finding.severity}`}>{finding.severity}</span>
                        {finding.owasp_category && (
                          <span className="badge badge-info">OWASP:  {finding.owasp_category}</span>
                        )}
                        {/* ========== NEW: Enhanced Compliance Badges ========== */}
                        {finding.nist_mapping && (
                          <span className="badge badge-compliance badge-nist">NIST: {finding.nist_mapping}</span>
                        )}
                        {finding.soc2_mapping && (
                          <span className="badge badge-compliance badge-soc2">SOC2: {finding.soc2_mapping}</span>
                        )}
                        {finding.hipaa_mapping && (
                          <span className="badge badge-compliance badge-hipaa">HIPAA: {finding.hipaa_mapping}</span>
                        )}
                        {finding.vulnerability_type && (
                          <span className="badge badge-info">{finding.vulnerability_type}</span>
                        )}
                      </div>
                    </div>
                    <select
                      className="form-select"
                      style={{ width: '180px' }}
                      value={finding.status}
                      onChange={(e) => handleStatusChange(finding. id, e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="false_positive">False Positive</option>
                      <option value="accepted_risk">Accepted Risk</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>
                  
                  {/* ========== NEW: Network Finding Special Rendering ========== */}
                  {networkInfo && renderNetworkFinding(finding, networkInfo)}
                  
                  <div className="finding-body">
                    <p><strong>Description:</strong> {linkify(finding.description)}</p>
                    
                    {finding.file_path && (
                      <p><strong>Location:</strong> {finding.file_path}
                        {finding.line_number && `:${finding.line_number}`}
                      </p>
                    )}
                    
                    {finding.code_snippet && (
                      <div className="code-snippet">
                        <pre>{finding.code_snippet}</pre>
                      </div>
                    )}
                    
                    {/* Only show raw data_flow_trace if NOT a network finding */}
                    {finding.data_flow_trace && ! networkInfo && (
                      <div className="data-flow-trace">
                        <strong>Data Flow: </strong>
                        <pre>{finding.data_flow_trace}</pre>
                      </div>
                    )}
                    
                    <div className="recommendation">
                      <strong>Recommendation:</strong>
                      <p>{linkify(finding.recommendation)}</p>
                    </div>

                    {finding.remediation_snippet && (
                      <div className="remediation-snippet">
                        <strong>Remediation Example:</strong>
                        <pre className="code-snippet">{finding.remediation_snippet}</pre>
                      </div>
                    )}
                    
                    {finding.cve_id && (
                      <p><strong>CVE: </strong> {finding.cve_id}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScanDetail;