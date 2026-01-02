import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Home.css';

const IconSearch = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
    <circle cx="27" cy="27" r="16" fill="none" stroke="currentColor" strokeWidth="4" />
    <line x1="39" y1="39" x2="54" y2="54" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const IconTaint = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
    <path d="M10 44c8-6 14-6 22 0s14 6 22 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M10 20c8 6 14 6 22 0s14-6 22 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <circle cx="32" cy="32" r="6" fill="currentColor" />
  </svg>
);

const IconIac = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
    <path d="M16 16 32 8l16 8v16l-16 8-16-8Z" fill="none" stroke="currentColor" strokeWidth="4" />
    <path d="M16 32v16l16 8 16-8V32" fill="none" stroke="currentColor" strokeWidth="4" />
  </svg>
);

const IconSupply = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
    <rect x="12" y="18" width="40" height="28" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="4" />
    <path d="M12 28h40M24 46V28" fill="none" stroke="currentColor" strokeWidth="4" />
  </svg>
);

const IconNetwork = () => (
  <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
    <path d="M16 15c8-8 24-8 32 0M22 21c5-5 15-5 20 0M28 27c2-2 6-2 8 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <line x1="32" y1="27" x2="32" y2="43" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <circle cx="32" cy="47" r="2.5" fill="currentColor" />
  </svg>
);

// ... (Icon components remain the same)

const iconMap = {
  search: <IconSearch />,
  taint: <IconTaint />,
  iac: <IconIac />,
  supply: <IconSupply />,
  network: <IconNetwork />
};

const features = [
  {
    title: "STATIC ANALYSIS",
    subtitle: "SAST / SEMGREP / BANDIT",
    description: "Deep inspection of source code for hardcoded secrets, SQL injection, XSS, and insecure function calls using industry-leading engines.",
    color: "#00f3ff",
    icon: "search",
    video: "/videos/static-analysis.mp4"
  },
  {
    title: "TAINT TRACKING",
    subtitle: "DATA FLOW ANALYSIS",
    description: "Automatically trace untrusted input from request parameters to security-critical sinks like database queries and shell commands.",
    color: "#ff0055",
    icon: "taint",
    video: "/videos/taint-tracking.mp4"
  },
  {
    title: "INFRASTRUCTURE AS CODE",
    subtitle: "DOCKER / K8S / TERRAFORM",
    description: "Scan your cloud infrastructure configurations for misconfigurations, privileged containers, and exposed secrets before they deploy.",
    color: "#bc13fe",
    icon: "iac",
    video: "/videos/security-shield.mp4"
  },
  {
    title: "SUPPLY CHAIN SECURITY",
    subtitle: "SCA / OSV / SBOM",
    description: "Track vulnerabilities in your open-source dependencies and generate comprehensive Software Bill of Materials (SBOM) in CycloneDX format.",
    color: "#39ff14",
    icon: "supply",
    video: "/videos/dependency-network.mp4"
  },
  {
    title: "NETWORK ANALYSIS",
    subtitle: "PCAP / PROTOCOL INSPECTION",
    description: "Passive analysis of packet captures to detect insecure protocols like HTTP, FTP, and Telnet, and identify plaintext credentials.",
    color: "#ff9e00",
    icon: "network",
    video: "/videos/network-analysis.mp4"
  }
];

const FeatureSlide = ({ feature }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 0.5; // Play at half speed to last 10s
      video.play().catch(() => {});
    }
  }, [feature.video]); // Re-run when video source changes

  return (
    <div className="slide-content">
      {feature.video && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="slide-bg-video"
        >
          <source src={process.env.PUBLIC_URL + feature.video + "?v=2"} type="video/mp4" />
        </video>
      )}
      <div className="slide-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <motion.div 
          className="feature-icon"
          style={{ 
            color: feature.color,
            width: 'clamp(80px, 18vh, 120px)',
            height: 'clamp(80px, 18vh, 120px)',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
            margin: '0 auto',
            transform: 'translateY(-60px)',
            zIndex: 5,
            position: 'relative'
          }}
          animate={{ 
            boxShadow: [
              `0 0 20px ${feature.color}`, 
              `0 0 40px ${feature.color}`, 
              `0 0 20px ${feature.color}`
            ] 
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {iconMap[feature.icon]}
        </motion.div>
        <h3 className="slide-subtitle" style={{ color: feature.color }}>
          {feature.subtitle}
        </h3>
        <h2 className="slide-title" data-text={feature.title}>
          {feature.title}
        </h2>
        <p className="slide-description">
          {feature.description}
        </p>
        <Link to="/register" className="cta-btn" style={{ borderColor: feature.color, color: feature.color }}>
          SECURE YOUR PROJECT
        </Link>
      </div>
    </div>
  );
};

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const isAuthenticated = !!localStorage.getItem('access_token');

  // Sync slide transition with 10s video cycle
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 10000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const handleNext = () => {
    setIsGlitching(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
      setTimeout(() => setIsGlitching(false), 100);
    }, 100);
  };

  const handlePrev = () => {
    setIsGlitching(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
      setTimeout(() => setIsGlitching(false), 100);
    }, 100);
  };

  return (
    <div className={`home-container ${isGlitching ? 'glitch-active' : ''}`}>
      <div className="scanline"></div>
      
      {!isAuthenticated && (
        <header className="home-header">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="logo-glitch"
            data-text="PASSIVEGUARD"
          >
            PASSIVEGUARD
          </motion.div>
          <div className="header-actions">
            <Link to="/login" className="cyber-btn login-btn">ACCESS SYSTEM</Link>
            <Link to="/register" className="cyber-btn register-btn">INITIALIZE USER</Link>
          </div>
        </header>
      )}

      <main className="glitch-slider">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -100, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ width: '100%', height: '100%' }}
          >
            <FeatureSlide feature={features[currentSlide]} />
          </motion.div>
        </AnimatePresence>

        <div className="slider-nav">
          <button onClick={handlePrev} className="nav-btn">{"<"}</button>
          <div className="nav-dots">
            {features.map((_, index) => (
              <div 
                key={index} 
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                style={{ backgroundColor: index === currentSlide ? features[index].color : 'transparent' }}
              ></div>
            ))}
          </div>
          <button onClick={handleNext} className="nav-btn">{">"}</button>
        </div>
      </main>

      <footer className="home-footer">
        <div className="footer-status">
          <span className="status-indicator"></span>
          SYSTEM STATUS: SECURE
        </div>
        <div className="footer-version">v1.0.5 STABLE</div>
      </footer>
    </div>
  );
};

export default Home;

