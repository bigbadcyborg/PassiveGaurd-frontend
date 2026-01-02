import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const UrgencyBanner = () => {
  const [breachCount, setBreachCount] = useState(0);

  useEffect(() => {
    // Generate a deterministic max for the day based on date
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    // Simple pseudo-random generator using sine
    const pseudoRandom = (Math.sin(seed) + 1) / 2; 
    // Daily max between 150,000 and 300,000
    const dailyMax = Math.floor(pseudoRandom * (300000 - 150000) + 150000);

    let timeoutId;

    const updateCount = () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const msPassed = now.getTime() - startOfDay;
      const msInDay = 86400000;
      const progress = msPassed / msInDay;
      
      setBreachCount(Math.floor(progress * dailyMax));

      // Update every 5-10 seconds (randomly generated increments)
      const randomDelay = Math.floor(Math.random() * 5000) + 5000;
      timeoutId = setTimeout(updateCount, randomDelay);
    };

    updateCount();
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="urgency-banner">
      <div className="urgency-content">
        <div className="breach-counter">
          <span className="label">BREACHES TODAY:</span>
          <motion.span 
            className="count text-neon-pink"
            animate={{ opacity: [1, 0.8, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {breachCount.toLocaleString()}
          </motion.span>
        </div>
        
        <div className="ticker-wrapper">
          <div className="ticker-label">LATEST THREATS NEUTRALIZED:</div>
          <div className="ticker-track">
            <motion.div 
              className="ticker-content"
              animate={{ x: ["0%", "-100%"] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span>CVE-2024-2189 (CRITICAL) - SQL Injection in Core Lib</span>
              <span> • </span>
              <span>CVE-2024-3094 (HIGH) - Backdoor in XZ Utils</span>
              <span> • </span>
              <span>CVE-2024-1082 (MEDIUM) - XSS in Dashboard</span>
              <span> • </span>
              <span>CVE-2024-5521 (CRITICAL) - RCE in WebLogic</span>
              <span> • </span>
              <span>CVE-2024-2189 (CRITICAL) - SQL Injection in Core Lib</span>
              <span> • </span>
              <span>CVE-2024-3094 (HIGH) - Backdoor in XZ Utils</span>
            </motion.div>
          </div>
        </div>

        <div className="cost-stat">
          <span className="label">AVG BREACH COST:</span>
          <span className="value text-neon-yellow">$4.45M</span>
        </div>
      </div>
    </div>
  );
};

export default UrgencyBanner;
