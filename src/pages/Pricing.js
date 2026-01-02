import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Pricing.css';

const PRICING_TIERS = [
  {
    id: 'sentinel',
    name: 'Sentinel',
    price: { monthly: 'TBD', annual: 'TBD' },
    period: '',
    description: 'Essential security for independent developers.',
    features: [
      { text: 'Unlimited Local Scans', icon: 'scan', tooltip: 'Scan your local codebase as many times as you want.' },
      { text: 'Standard Vulnerability DB', icon: 'db', tooltip: 'Access to our regularly updated standard vulnerability database.' },
      { text: 'PDF Reports', icon: 'report', tooltip: 'Generate PDF summaries of your scan findings.' },
      { text: 'Community Support', icon: 'support', tooltip: 'Get help from our community forums and documentation.' },
      { text: 'Single User Access', icon: 'user', tooltip: 'One account for a single developer.' }
    ],
    buttonText: 'Request Demo',
    highlight: false,
    color: 'cyan'
  },
  {
    id: 'overdrive',
    name: 'Overdrive',
    price: { monthly: '$332', annual: '$3,990' },
    period: 'per month',
    annualNote: '$3,990/year',
    description: 'Automation for growing projects.',
    features: [
      { text: 'Automated Recurring Scans', icon: 'auto', tooltip: 'Set up scans to run automatically on a schedule.' },
      { text: 'Scheduled Scan Intervals', icon: 'calendar', tooltip: 'Flexible scheduling for your security audits.' },
      { text: 'Priority Worker Queue', icon: 'queue', tooltip: 'Your scans get processed faster in our cloud infrastructure.' },
      { text: 'Cloud Security Posture Management', icon: 'cloud', tooltip: 'Use our high-impact features that bridge the gap between static code analysis and live cloud security.' },
      { text: 'Email Notifications', icon: 'mail', tooltip: 'Get alerted via email as soon as a scan completes.' }
    ],
    buttonText: 'Upgrade Now',
    highlight: true,
    badge: 'MOST POPULAR',
    color: 'pink'
  },
  {
    id: 'nexus',
    name: 'Nexus Team',
    price: { monthly: 'TBD', annual: 'TBD' },
    period: '',
    description: 'Advanced collaboration for security teams.',
    features: [
      { text: 'Collaborative Dashboards', icon: 'team', tooltip: 'Shared views for your entire security team.' },
      { text: 'Team Access Control (RBAC)', icon: 'lock', tooltip: 'Manage permissions and roles for team members.' },
      { text: 'Shared Finding Annotations', icon: 'chat', tooltip: 'Collaborate on findings with shared notes and comments.' },
      { text: 'Executive Summary Reports', icon: 'summary', tooltip: 'High-level reports designed for management and stakeholders.' },
      { text: 'API Access', icon: 'api', tooltip: 'Integrate PassiveGuard into your existing CI/CD pipelines.' }
    ],
    buttonText: 'Request Demo',
    highlight: false,
    color: 'purple'
  },
  {
    id: 'core',
    name: 'Core Protocol',
    price: { monthly: 'TBD', annual: 'TBD' },
    period: 'One-time',
    description: 'The ultimate protocol for total control.',
    features: [
      { text: 'Perpetual License', icon: 'key', tooltip: 'One-time payment for lifetime access to the software version.' },
      { text: 'Full Source Code Access', icon: 'code', tooltip: 'Inspect and customize the PassiveGuard source code.' },
      { text: 'Self-Hosted Infrastructure', icon: 'server', tooltip: 'Run PassiveGuard entirely on your own servers for total privacy.' },
      { text: 'Unlimited Nodes/Targets', icon: 'target', tooltip: 'No limits on the number of projects or servers you can scan.' },
      { text: 'Direct Developer Support', icon: 'dev', tooltip: 'Direct access to our core development team for support.' }
    ],
    buttonText: 'Buy App',
    highlight: false,
    badge: 'BEST VALUE',
    color: 'yellow'
  }
];

const IconMap = ({ name, color }) => {
  const icons = {
    scan: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M3 17v2a2 2 0 0 1 2 2h2" />
        <polyline points="7 12 12 12 17 12" />
      </svg>
    ),
    db: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5V19A9 3 0 0 0 21 19V5" />
        <path d="M3 12A9 3 0 0 0 21 12" />
      </svg>
    ),
    report: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    support: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    auto: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    queue: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
    cloud: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
    mail: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    team: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    chat: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    summary: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="11" y2="17" />
      </svg>
    ),
    api: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    key: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z" />
      </svg>
    ),
    code: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="12" y1="2" x2="12" y2="22" />
      </svg>
    ),
    server: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    target: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    dev: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    )
  };

  return (
    <span className={`feature-svg text-${color}`}>
      {icons[name] || icons.scan}
    </span>
  );
};

const FAQ_ITEMS = [
  {
    question: "How does the 'Perpetual License' work in Core Protocol?",
    answer: "The Core Protocol tier provides a one-time purchase for a perpetual license. You own the software version you purchased forever, with no recurring monthly fees. It includes one year of updates and direct developer support."
  },
  {
    question: "Can I upgrade or downgrade my plan at any time?",
    answer: "Yes, you can upgrade your plan at any time to unlock more features immediately. Downgrades will take effect at the end of your current billing cycle."
  },
  {
    question: "What is 'Taint Tracking' and which plans include it?",
    answer: "Taint Tracking is an advanced data flow analysis that traces untrusted input to sensitive sinks. It is available in our Overdrive and Nexus Team plans as part of the advanced security suite."
  },
  {
    question: "Do you offer custom enterprise solutions?",
    answer: "Yes, for large organizations requiring custom integrations, dedicated infrastructure, or specific compliance needs, please contact our security architecture team for a tailored quote."
  }
];

const COMPARISON_FEATURES = [
  { category: "Scanning Capabilities", features: [
    { name: "Static Analysis (SAST)", sentinel: "Basic", overdrive: "Advanced", nexus: "Premium", core: "Full Source" },
    { name: "Dependency Scanning", sentinel: "Limited", overdrive: "Full", nexus: "Full", core: "Full" },
    { name: "Taint Tracking", sentinel: "No", overdrive: "Yes", nexus: "Yes", core: "Yes" },
    { name: "Infrastructure as Code", sentinel: "No", overdrive: "Yes", nexus: "Yes", core: "Yes" }
  ]},
  { category: "Infrastructure & Deployment", features: [
    { name: "Cloud Dashboard", sentinel: "Yes", overdrive: "Yes", nexus: "Yes", core: "Self-Hosted" },
    { name: "API Access", sentinel: "No", overdrive: "No", nexus: "Yes", core: "Yes" },
    { name: "RBAC & Team Management", sentinel: "No", overdrive: "No", nexus: "Yes", core: "Yes" },
    { name: "Unlimited Scan Targets", sentinel: "No", overdrive: "No", nexus: "Yes", core: "Yes" }
  ]},
  { category: "Reporting & Support", features: [
    { name: "PDF Reports", sentinel: "Basic", overdrive: "Detailed", nexus: "Executive", core: "Custom" },
    { name: "Email Notifications", sentinel: "No", overdrive: "Yes", nexus: "Real-time", core: "Custom" },
    { name: "Support Level", sentinel: "Community", overdrive: "Priority", nexus: "Dedicated", core: "Direct Dev" }
  ]}
];

function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="pricing-page">
      <div className="scanline"></div>
      
      <div className="pricing-header">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cyber-title"
          data-text="Subscription Protocols"
        >
          Subscription Protocols
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="cyber-subtitle"
        >
          Select your clearance level to initialize advanced security modules.
        </motion.p>

        <div className="billing-toggle-container">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={billingCycle === 'annual'} 
              onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            />
            <span className="slider round"></span>
          </label>
          <span className={billingCycle === 'annual' ? 'active' : ''}>
            Annual <span className="save-badge">Save 20%</span>
          </span>
        </div>
      </div>

      <div className="pricing-grid">
        {PRICING_TIERS.map((tier, index) => (
          <motion.div 
            key={tier.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className={`pricing-card ${tier.highlight ? 'highlight' : ''} border-${tier.color}`}
          >
            {tier.badge && (
              <div className={`tier-badge badge-${tier.color}`}>
                {tier.badge}
              </div>
            )}
            
            <div className="card-header">
              <h2 className={`tier-name text-${tier.color}`}>{tier.name}</h2>
              <div className="tier-price">
                <motion.span 
                  key={billingCycle}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="price-val"
                >
                  {tier.price[billingCycle]}
                </motion.span>
                {tier.period && (
                  <span className="price-period">
                    /{tier.id === 'overdrive' && billingCycle === 'annual' ? 'per year' : tier.period}
                  </span>
                )}
              </div>
              <p className="tier-description">{tier.description}</p>
            </div>
            
            <div className="card-features">
              <ul>
                {tier.features.map((feature, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.05) }}
                    className="feature-item-with-tooltip"
                  >
                    <IconMap name={feature.icon} color={tier.color} />
                    <span className="feature-text">{feature.text}</span>
                    <div className="feature-tooltip">{feature.tooltip}</div>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="card-footer">
              <button className={`btn-cyber btn-${tier.color}`}>
                <span className="btn-glitch-content">{tier.buttonText}</span>
                <span className="btn-glitch-effect"></span>
              </button>
            </div>

            <div className="card-glow"></div>
          </motion.div>
        ))}
      </div>

      <div className="comparison-trigger">
        <button 
          className="btn-link" 
          onClick={() => setShowComparison(!showComparison)}
        >
          {showComparison ? 'CLOSE_PROTOCOL_COMPARISON' : 'INITIALIZE_DETAILED_COMPARISON'}
          <span className="arrow">{showComparison ? '▲' : '▼'}</span>
        </button>
      </div>

      {showComparison && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="comparison-section"
        >
          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>FEATURES</th>
                  <th className="text-cyan">SENTINEL</th>
                  <th className="text-pink">OVERDRIVE</th>
                  <th className="text-purple">NEXUS TEAM</th>
                  <th className="text-yellow">CORE</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((group, gIdx) => (
                  <React.Fragment key={gIdx}>
                    <tr className="category-row">
                      <td colSpan="5">{group.category}</td>
                    </tr>
                    {group.features.map((f, fIdx) => (
                      <tr key={fIdx}>
                        <td className="feature-name">{f.name}</td>
                        <td>{f.sentinel}</td>
                        <td>{f.overdrive}</td>
                        <td>{f.nexus}</td>
                        <td>{f.core}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <div className="faq-section">
        <h2 className="section-title text-cyan">FREQUENTLY_ASKED_QUESTIONS</h2>
        <div className="faq-grid">
          {FAQ_ITEMS.map((item, index) => (
            <div 
              key={index} 
              className={`faq-item ${expandedFaq === index ? 'active' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <div className="faq-question">
                <span className="faq-icon">{expandedFaq === index ? '[-]' : '[+]'}</span>
                {item.question}
              </div>
              {expandedFaq === index && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="faq-answer"
                >
                  {item.answer}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="trust-indicators">
        <div className="trust-item">
          <span className="trust-icon">🛡️</span>
          <span className="trust-text">SECURE_PAYMENT_GATEWAY</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">🔒</span>
          <span className="trust-text">END_TO_END_ENCRYPTION</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">⚡</span>
          <span className="trust-text">99.9%_UPTIME_SLA</span>
        </div>
      </div>

      <div className="pricing-footer">
        <p>All transactions are secured via encrypted blockchain protocol. Terminate anytime.</p>
      </div>
    </div>
  );
}

export default Pricing;

