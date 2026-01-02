import React from 'react';
import { motion } from 'framer-motion';

const ValueProposition = () => {
  const benefits = [
    {
      title: "FULL CONTEXT AWARENESS",
      desc: "Traditional scanners look at files in isolation. PassiveGuard builds a complete dependency graph of your application, understanding how data flows between components to find complex vulnerabilities.",
      icon: "🧠"
    },
    {
      title: "ZERO-LATENCY INTEGRATION",
      desc: "Don't wait for CI/CD pipelines to fail. Our passive scanning technology runs in the background as you code, providing instant feedback without slowing down your development workflow.",
      icon: "⚡"
    },
    {
      title: "PROACTIVE DEFENSE",
      desc: "Stop reacting to breaches. By identifying infrastructure misconfigurations and supply chain risks before deployment, you eliminate attack vectors before they can be exploited.",
      icon: "🛡️"
    }
  ];

  return (
    <div className="value-prop-container">
      <div className="value-prop-header">
        <h2 className="section-title center">WHY PASSIVEGUARD?</h2>
        <p className="section-subtitle">The bridge between static analysis and real-world security.</p>
      </div>

      <div className="benefits-grid">
        {benefits.map((benefit, index) => (
          <motion.div 
            className="benefit-card"
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            viewport={{ once: true }}
          >
            <div className="benefit-icon">{benefit.icon}</div>
            <h3 className="benefit-title">{benefit.title}</h3>
            <p className="benefit-desc">{benefit.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ValueProposition;
