import React, { useState } from 'react';
import { motion } from 'framer-motion';

const BeforeAfterComparison = () => {
  const [activeTab, setActiveTab] = useState('after');

  const vulnerableCode = `
// VULNERABLE CODE
app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  // SQL Injection Vulnerability
  const query = "SELECT * FROM users WHERE user = '" + user + "'";
  db.execute(query);
});
  `.trim();

  const secureCode = `
// SECURE CODE (PassiveGuard Protected)
app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  // Parameterized Query
  const query = "SELECT * FROM users WHERE user = ?";
  db.execute(query, [user]);
});
  `.trim();

  return (
    <div className="comparison-container">
      <h2 className="section-title">ELIMINATE VULNERABILITIES</h2>
      <p className="section-subtitle">See the difference PassiveGuard makes in your codebase.</p>

      <div className="code-comparison-wrapper">
        <div className="comparison-tabs">
          <button 
            className={`comp-tab ${activeTab === 'before' ? 'active-danger' : ''}`}
            onClick={() => setActiveTab('before')}
          >
            BEFORE (VULNERABLE)
          </button>
          <button 
            className={`comp-tab ${activeTab === 'after' ? 'active-success' : ''}`}
            onClick={() => setActiveTab('after')}
          >
            AFTER (SECURE)
          </button>
        </div>

        <motion.div 
          className={`code-window ${activeTab === 'before' ? 'border-danger' : 'border-success'}`}
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <pre>
            <code>
              {activeTab === 'before' ? vulnerableCode : secureCode}
            </code>
          </pre>
          {activeTab === 'before' && (
            <div className="threat-indicator">
              ⚠️ CRITICAL: SQL Injection Detected
            </div>
          )}
          {activeTab === 'after' && (
            <div className="security-indicator">
              ✅ SECURE: Input Sanitized
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BeforeAfterComparison;
