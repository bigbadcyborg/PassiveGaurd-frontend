import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { debugAPI, utilsAPI } from '../services/api';
import './Agents.css';

function Agents() {
  const [agentKey, setAgentKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');
  const [osPlatform, setOsPlatform] = useState('windows'); // 'windows' or 'linux'
  const [agentStatus, setAgentStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [warningClosed, setWarningClosed] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState('');
  const [showDirectoryPicker, setShowDirectoryPicker] = useState(false);
  const [pickerItems, setPickerItems] = useState({ current: '/app/projects', parent: null, directories: [], files: [], is_agent: false });
  const [pickerLoading, setPickerLoading] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSentinel = user.role === 'sentinel';

  useEffect(() => {
    fetchAgentKey();
    fetchAgentStatus();
    
    // Poll for agent status every 3 seconds
    const interval = setInterval(fetchAgentStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAgentKey = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post('/api/auth/agent-key', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgentKey(response.data.agent_key);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching agent key:', error);
      setLoading(false);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const response = await debugAPI.getAgents();
      setAgentStatus(response.data);
      setStatusLoading(false);
    } catch (error) {
      console.error('Error fetching agent status:', error);
      setStatusLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const loadPickerData = async (path) => {
    setPickerLoading(true);
    try {
      // Use allowHubBrowse=true to bypass Sentinel restriction for directory selection
      const response = await utilsAPI.ls(path, false, true); // Browse Hub filesystem
      setPickerItems(response.data);
    } catch (error) {
      console.error('Error loading directory:', error);
      alert('Could not read directory: ' + (error.response?.data?.error || error.message));
    } finally {
      setPickerLoading(false);
    }
  };

  const handleBrowseDirectory = () => {
    setShowDirectoryPicker(true);
    loadPickerData('/app/projects');
  };

  const selectDirectory = (dir) => {
    const newPath = pickerItems.current === '/' ? `/${dir}` : `${pickerItems.current}/${dir}`.replace(/\/+/g, '/');
    loadPickerData(newPath);
  };

  const goUpDirectory = () => {
    if (pickerItems.parent) {
      loadPickerData(pickerItems.parent);
    }
  };

  const confirmDirectorySelection = () => {
    // Convert Hub path to appropriate format for Docker mount
    const hubPath = pickerItems.current;
    // For Windows, convert /app/projects/... to Windows path format
    // For Linux/WSL, use as-is or convert to relative path
    if (osPlatform === 'windows') {
      // If it's under /app/projects, extract the relative part
      if (hubPath.startsWith('/app/projects/')) {
        const relativePath = hubPath.replace('/app/projects/', '');
        setSelectedDirectory(relativePath);
      } else {
        setSelectedDirectory(hubPath);
      }
    } else {
      // For Linux/WSL, use the path as-is or make it relative
      if (hubPath.startsWith('/app/projects/')) {
        const relativePath = hubPath.replace('/app/projects/', '');
        setSelectedDirectory(relativePath);
      } else {
        setSelectedDirectory(hubPath);
      }
    }
    setShowDirectoryPicker(false);
  };

  const hubUrl = window.location.origin.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');
  
  // Convert Windows path to WSL format if needed
  const convertToWslPath = (path) => {
    if (!path) return '';
    // If it's already a WSL path, return as-is
    if (path.startsWith('/mnt/')) return path;
    // Convert Windows path to WSL format: C:\Users\... -> /mnt/c/Users/...
    if (path.match(/^[A-Z]:\\/i)) {
      const drive = path[0].toLowerCase();
      const rest = path.substring(3).replace(/\\/g, '/');
      return `/mnt/${drive}${rest}`;
    }
    // If it's a relative path or already Unix-style, return as-is
    return path;
  };

  // Generate Docker command with selected directory
  const getDockerCommand = () => {
    const pathToUse = selectedDirectory || 'path/to/your/code';
    let volumePath;
    
    if (osPlatform === 'windows') {
      // For Windows, use $(pwd) for relative paths or convert absolute paths to WSL format
      if (pathToUse.match(/^[A-Z]:\\/i)) {
        // Absolute Windows path - convert to WSL format
        const wslPath = convertToWslPath(pathToUse);
        volumePath = `"${wslPath}:/app/projects"`;
      } else {
        // Relative path - use $(pwd) prefix
        volumePath = `"$(pwd)/${pathToUse}:/app/projects"`;
      }
      return `docker run -d -v ${volumePath} -e HUB_URL="${hubUrl}" -e AGENT_KEY="${agentKey || 'YOUR_AGENT_KEY'}" --name pg-edge-agent passiveguard-agent`;
    } else {
      // For Linux/WSL, use path as-is or with $(pwd) for relative paths
      if (pathToUse.startsWith('/')) {
        volumePath = `"${pathToUse}:/app/projects"`;
      } else {
        volumePath = `"$(pwd)/${pathToUse}:/app/projects"`;
      }
      return `docker run -d --add-host=host.docker.internal:host-gateway -v ${volumePath} -e HUB_URL="${hubUrl}" -e AGENT_KEY="${agentKey || 'YOUR_AGENT_KEY'}" --name pg-edge-agent passiveguard-agent`;
    }
  };

  const dockerCommand = getDockerCommand();

  // Generate Docker build command
  const getDockerBuildCommand = () => {
    return 'docker build --target agent -t passiveguard-agent .';
  };

  const dockerBuildCommand = getDockerBuildCommand();

  // Check if current user has a connected agent
  const hasConnectedAgent = agentStatus?.connected_agents?.some(
    agent => agent.agent_key === agentStatus?.current_user?.agent_key
  ) || false;

  if (loading) {
    return <div className="loading">INITIALIZING_AGENT_PROTOCOL...</div>;
  }

  return (
    <div className="agents-page">
      <div className="agents-header">
        <h1>Edge Agents</h1>
        <div className="header-line"></div>
      </div>

      <div className="agents-content">
        {isSentinel && !warningClosed && (
          <div className="tier-notice">
            <button 
              className="notice-close-btn" 
              onClick={() => setWarningClosed(true)}
              aria-label="Close warning"
            >
              ×
            </button>
            <span className="notice-icon">⚠️</span>
            <div className="notice-text">
              <h3>Sentinel Tier: Edge Agent Required</h3>
              <p>As a Sentinel user, all scans must be performed via an Edge Agent on your local machine. Hub-based remote scanning is available for Overdrive and Nexus tiers.</p>
              <button 
                className="upgrade-btn"
                onClick={() => navigate('/pricing')}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        <section className="agent-status-live-section">
          <div className="status-header">
            <h2>Agent Connection Status</h2>
            <span className="status-indicator">
              {statusLoading ? '⏳' : agentStatus?.connected_agents?.length > 0 ? '🟢' : '🔴'}
            </span>
          </div>
          
          {statusLoading ? (
            <div className="status-loading">Loading agent status...</div>
          ) : (
            <div className="agent-status-card">
              <div className="status-summary">
                <div className="summary-item">
                  <span className="summary-label">Your Agent Key:</span>
                  <code className="summary-value">{agentStatus?.current_user?.agent_key || 'N/A'}</code>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Connected Agents:</span>
                  <span className={`summary-value ${agentStatus?.connected_agents?.length > 0 ? 'connected' : 'disconnected'}`}>
                    {agentStatus?.connected_agents?.length || 0}
                  </span>
                </div>
              </div>

              {agentStatus?.connected_agents?.length > 0 ? (
                <div className="connected-agents-list">
                  <h3>Active Connections</h3>
                  {agentStatus.connected_agents.map((agent, idx) => {
                    const isMyAgent = agent.agent_key === agentStatus.current_user?.agent_key;
                    const lastSeen = agent.last_seen ? new Date(agent.last_seen).toLocaleString() : 'Unknown';
                    return (
                      <div key={idx} className={`agent-connection-item ${isMyAgent ? 'my-agent' : ''}`}>
                        <div className="connection-header">
                          <span className="connection-status">🟢 CONNECTED</span>
                          {isMyAgent && <span className="my-agent-badge">YOUR AGENT</span>}
                        </div>
                        <div className="connection-details">
                          <div className="detail-row">
                            <span className="detail-label">Agent Key:</span>
                            <code className="detail-value">{agent.agent_key}</code>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Socket ID:</span>
                            <code className="detail-value">{agent.sid}</code>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Last Seen:</span>
                            <span className="detail-value">{lastSeen}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-agents-message">
                  <span className="no-agents-icon">⚠️</span>
                  <p>No agents currently connected.</p>
                  <p className="no-agents-hint">Start your edge agent using the Docker command below to establish a connection.</p>
                </div>
              )}

              {hasConnectedAgent && (
                <div className="remove-agent-section">
                  <h3>Remove Agent</h3>
                  <p className="card-description" style={{ marginTop: '10px', marginBottom: '15px' }}>
                    To disconnect and remove your agent container, run the following command in your terminal:
                  </p>
                  <div className="command-display">
                    <pre className="docker-command">docker rm -f pg-edge-agent</pre>
                    <button onClick={() => copyToClipboard('docker rm -f pg-edge-agent')} className="copy-btn">
                      COPY_COMMAND
                    </button>
                  </div>
                  <p className="card-note" style={{ marginTop: '10px' }}>
                    💡 Note: If you get an error that the container name is already in use when trying to set up a new agent, remove the existing container first using the command above, then run your new agent setup command.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {!hasConnectedAgent && (
          <section className="agent-setup-section">
            <h2>Deploy Local Scanner</h2>
            <p className="section-description">
              {isSentinel 
                ? "Sentinel users are required to run the Edge Agent locally to perform scans. This ensures your source code never leaves your environment."
                : "To move the heavy scanning workload to your local environment and keep your source code private, run the PassiveGuard Edge Agent as a Docker container."}
            </p>

          {/* Step 01: Install Docker */}
          <div className="setup-card">
            <div className="card-header">
              <span className="step-number">01</span>
              <h3>Install Docker</h3>
              <div className="platform-toggle">
                <button 
                  className={osPlatform === 'windows' ? 'active' : ''} 
                  onClick={() => setOsPlatform('windows')}
                >
                  WINDOWS
                </button>
                <button 
                  className={osPlatform === 'linux' ? 'active' : ''} 
                  onClick={() => setOsPlatform('linux')}
                >
                  LINUX / WSL
                </button>
              </div>
            </div>
            <div className="installation-instructions">
              {osPlatform === 'windows' ? (
                <div>
                  <p className="card-description">
                    Docker Desktop for Windows provides an easy-to-use GUI for managing containers.
                  </p>
                  <ol className="instruction-list">
                    <li>Download Docker Desktop from <a href="https://www.docker.com/products/docker-desktop" target="_blank" rel="noopener noreferrer" className="instruction-link">docker.com/products/docker-desktop</a></li>
                    <li>Run the installer and follow the setup wizard</li>
                    <li>Restart your computer if prompted</li>
                    <li>Launch Docker Desktop and wait for it to start (Docker icon in system tray)</li>
                    <li>Verify installation: Open PowerShell or WSL and run <code className="inline-code">docker --version</code></li>
                  </ol>
                  <p className="card-note">
                    💡 Note: If you're using WSL, Docker Desktop will automatically integrate with your WSL distribution.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="card-description">
                    Install Docker Engine on your Linux system or WSL distribution.
                  </p>
                  <div className="instruction-block">
                    <p className="instruction-subtitle"><strong>Ubuntu/Debian:</strong></p>
                    <div className="command-display">
                      <pre className="docker-command">{`# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \\
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \\
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to the docker group (optional, to run docker without sudo)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect`}</pre>
                    </div>
                  </div>
                  <div className="instruction-block">
                    <p className="instruction-subtitle"><strong>Other distributions:</strong></p>
                    <p className="card-description">
                      Visit <a href="https://docs.docker.com/engine/install/" target="_blank" rel="noopener noreferrer" className="instruction-link">docs.docker.com/engine/install</a> for installation instructions for your specific Linux distribution.
                    </p>
                  </div>
                  <p className="card-note">
                    💡 Note: After installation, verify with <code className="inline-code">docker --version</code>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Step 02: Build Agent Image */}
          <div className="setup-card">
            <div className="card-header">
              <span className="step-number">02</span>
              <h3>Build Agent Image</h3>
            </div>
            <p className="card-description">
              Before running the agent, you need to build the Docker image. Navigate to the PassiveGuard project root directory (where the Dockerfile is located) and run the build command below.
            </p>
            <div className="command-display">
              <pre className="docker-command">{dockerBuildCommand}</pre>
              <button onClick={() => copyToClipboard(dockerBuildCommand)} className="copy-btn">
                COPY_COMMAND
              </button>
            </div>
            <p className="card-note">
              💡 This builds the IP-protected Edge Agent image. The build process may take a few minutes on first run.
            </p>
          </div>

          {/* Step 03: Run Agent via Docker */}
          <div className="setup-card">
            <div className="card-header">
              <span className="step-number">03</span>
              <h3>Run Agent via Docker</h3>
              <div className="platform-toggle">
                <button 
                  className={osPlatform === 'windows' ? 'active' : ''} 
                  onClick={() => setOsPlatform('windows')}
                >
                  WINDOWS
                </button>
                <button 
                  className={osPlatform === 'linux' ? 'active' : ''} 
                  onClick={() => setOsPlatform('linux')}
                >
                  LINUX / WSL
                </button>
              </div>
            </div>
            <p className="card-note" style={{marginTop: 0, marginBottom: '15px'}}>
              ⚠️ Make sure you've completed Steps 01 and 02 before proceeding.
            </p>
            <div className="directory-selector">
              <label className="directory-label">
                <span>📁 Directory Path</span>
                <span className="label-hint">
                  {osPlatform === 'windows' 
                    ? 'Enter Windows path (e.g., C:\\Users\\... or relative path) or browse Hub filesystem' 
                    : 'Enter absolute path (e.g., /home/user/...) or relative path, or browse Hub filesystem'}
                </span>
              </label>
              <div className="directory-input-group">
                <input
                  type="text"
                  className="directory-input"
                  value={selectedDirectory}
                  onChange={(e) => setSelectedDirectory(e.target.value)}
                  placeholder={osPlatform === 'windows' ? 'C:\\Users\\... or path\\to\\your\\code' : '/home/user/... or path/to/your/code'}
                />
                <button 
                  className="directory-browse-btn"
                  onClick={handleBrowseDirectory}
                  title="Browse Hub filesystem"
                >
                  📁 Browse
                </button>
                {selectedDirectory && (
                  <button 
                    className="directory-clear-btn"
                    onClick={() => setSelectedDirectory('')}
                    title="Clear directory"
                  >
                    ✕
                  </button>
                )}
              </div>
              {selectedDirectory && (
                <div className="path-preview">
                  <span className="preview-label">Mounted as:</span>
                  <code className="preview-path">
                    {osPlatform === 'windows' 
                      ? convertToWslPath(selectedDirectory) || selectedDirectory
                      : selectedDirectory.startsWith('/') ? selectedDirectory : `$(pwd)/${selectedDirectory}`
                    }
                  </code>
                </div>
              )}
            </div>
            {!selectedDirectory && (
              <p className="card-description">
                Select a directory path above to generate your Docker command.
              </p>
            )}
            {selectedDirectory && (
              <>
                <p className="card-description">
                  The Docker command below is ready to use with your selected directory.
                </p>
                <div className="command-display">
                  <pre className="docker-command">{dockerCommand}</pre>
                  <button onClick={() => copyToClipboard(dockerCommand)} className="copy-btn">
                    COPY_COMMAND
                  </button>
                </div>
              </>
            )}
          </div>
          </section>
        )}

        {hasConnectedAgent && (
          <section className="agent-connected-section">
            <div className="connected-message">
              <span className="connected-icon">✅</span>
              <div className="connected-text">
                <h2>Agent Connected</h2>
                <p>Your edge agent is running and connected to the Hub. You can now perform scans using your local agent.</p>
              </div>
            </div>
          </section>
        )}

        <section className="agent-status-section">
          <h2>Agent Architecture</h2>
          <div className="architecture-diagram">
            <div className="diag-box local">
              <span className="box-title">LOCAL ENVIRONMENT</span>
              <div className="box-content">
                <div className="diag-item">Your Source Code</div>
                <div className="diag-arrow">⬇ (Mounted)</div>
                <div className="diag-item highlight">Edge Agent (Docker)</div>
              </div>
            </div>
            <div className="diag-connection">
              <div className="connection-line"></div>
              <span className="connection-label">Encrypted Results (JSON)</span>
              <div className="connection-line"></div>
            </div>
            <div className="diag-box cloud">
              <span className="box-title">PASSIVEGUARD HUB</span>
              <div className="box-content">
                <div className="diag-item">Findings DB</div>
                <div className="diag-item">Dashboard UI</div>
              </div>
            </div>
          </div>
        </section>

        <section className="agent-info-section">
          <div className="section-header-centered">
            <h2>How Edge Agents Work</h2>
            <button 
              className="tell-me-more-btn"
              onClick={() => setShowMoreInfo(!showMoreInfo)}
            >
              {showMoreInfo ? 'Show Less' : 'Tell Me More'}
            </button>
          </div>

          {showMoreInfo && (
            <div className="more-info-expanded">
              <div className="info-content">
                <div className="info-section">
                  <h4>🔒 Privacy & Security</h4>
                  <p>
                    Edge Agents run entirely on your local machine. Your source code never leaves your environment. 
                    The agent performs all scanning locally and only sends encrypted scan results (findings) to the PassiveGuard Hub.
                  </p>
                </div>
                
                <div className="info-section">
                  <h4>🐳 Docker Container</h4>
                  <p>
                    The Edge Agent runs as a Docker container, isolated from your system. You mount your code directory 
                    into the container using the <code>-v</code> flag. The agent scans files within this mounted directory 
                    and reports findings back to the Hub.
                  </p>
                </div>
                
                <div className="info-section">
                  <h4>🔑 Agent Key</h4>
                  <p>
                    Each user has a unique agent key that identifies their agent to the Hub. This key is used for 
                    authentication and ensures only your agent can send results to your account. Keep this key secret.
                  </p>
                </div>
                
                <div className="info-section">
                  <h4>📡 Connection</h4>
                  <p>
                    The agent connects to the Hub via Socket.IO for real-time communication. It registers using your 
                    agent key and maintains a persistent connection. You can see the connection status at the top of this page.
                  </p>
                </div>
                
                <div className="info-section">
                  <h4>🚀 Workflow</h4>
                  <ol>
                    <li>Copy your unique agent key</li>
                    <li>Select the directory you want to scan</li>
                    <li>Run the generated Docker command</li>
                    <li>The agent connects to the Hub automatically</li>
                    <li>Create scans from the Scans page - they'll run on your local agent</li>
                    <li>View results in the dashboard</li>
                  </ol>
                </div>
                
                <div className="info-section">
                  <h4>💡 Benefits</h4>
                  <ul>
                    <li><strong>Privacy:</strong> Your code never leaves your machine</li>
                    <li><strong>Performance:</strong> Scanning happens locally, faster than remote scanning</li>
                    <li><strong>Control:</strong> You control what gets scanned and when</li>
                    <li><strong>Offline Capable:</strong> Agent can work with limited connectivity</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Directory Picker Modal */}
      {showDirectoryPicker && (
        <div className="modal-overlay">
          <div className="modal-content folder-picker">
            <button 
              className="picker-close-btn" 
              onClick={() => setShowDirectoryPicker(false)}
              aria-label="Close file explorer"
            >
              ×
            </button>
            <div className="picker-header">
              <h3>Select Directory to Mount</h3>
            </div>
            <div className="picker-path">
              <strong>Current:</strong> {pickerItems.current}
            </div>
            <div className="picker-list">
              {pickerItems.parent && (
                <div className="picker-item parent" onClick={goUpDirectory}>
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
                        <div key={dir} className="picker-item picker-directory" onClick={() => selectDirectory(dir)}>
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
              <button type="button" className="btn btn-secondary" onClick={() => setShowDirectoryPicker(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={confirmDirectorySelection}>Select This Directory</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agents;


