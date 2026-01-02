import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const ThreatVisualization = () => {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [nodes, setNodes] = useState([]);

  // Initialize nodes with velocity
  useEffect(() => {
    const initialNodes = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.05, // Very slow drift
      vy: (Math.random() - 0.5) * 0.05,
      size: Math.random() * 10 + 5,
    }));
    setNodes(initialNodes);
  }, []);

  // Animation loop for drifting nodes
  useEffect(() => {
    let animationFrameId;

    const animate = () => {
      setNodes(prevNodes => prevNodes.map(node => {
        let newX = node.x + node.vx;
        let newY = node.y + node.vy;
        let newVx = node.vx;
        let newVy = node.vy;

        // Bounce off walls
        if (newX <= 0 || newX >= 100) newVx *= -1;
        if (newY <= 0 || newY >= 100) newVy *= -1;

        return {
          ...node,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy
        };
      }));
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div 
      className="threat-viz-container" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '500px' }}
    >
      {/* Background Animation Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <svg className="viz-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <defs>
            <radialGradient id="cursor-glow">
              <stop offset="0%" stopColor="rgba(0, 243, 255, 0.15)" />
              <stop offset="100%" stopColor="rgba(0, 243, 255, 0)" />
            </radialGradient>
          </defs>

          {/* Connections */}
          {nodes.map((node, i) => (
            nodes.slice(i + 1, i + 4).map((target, j) => {
              const dist = Math.sqrt(Math.pow(node.x - target.x, 2) + Math.pow(node.y - target.y, 2));
              if (dist > 30) return null; // Only connect close nodes
              
              return (
                <motion.line
                  key={`${i}-${j}`}
                  x1={node.x}
                  y1={node.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="rgba(0, 243, 255, 0.1)"
                  strokeWidth="0.1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, delay: Math.random() * 2 }}
                />
              );
            })
          ))}

          {/* Dynamic Connections to Cursor */}
          {nodes.map((node, i) => {
            const dist = Math.sqrt(Math.pow(node.x - mousePos.x, 2) + Math.pow(node.y - mousePos.y, 2));
            if (dist < 25) {
              return (
                <motion.line
                  key={`cursor-${i}`}
                  x1={mousePos.x}
                  y1={mousePos.y}
                  x2={node.x}
                  y2={node.y}
                  stroke="rgba(0, 243, 255, 0.4)"
                  strokeWidth="0.2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 - (dist / 25) }}
                />
              );
            }
            return null;
          })}
          
          {/* Nodes */}
          {nodes.map((node) => {
            const isNearMouse = Math.abs(node.x - mousePos.x) < 15 && Math.abs(node.y - mousePos.y) < 15;
            return (
              <motion.circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={node.size / 20}
                fill={isNearMouse ? "#ffffff" : "#00f3ff"}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 0.4 }}
                animate={{ 
                  scale: isNearMouse ? 1.5 : [1, 1.2, 1],
                  opacity: isNearMouse ? 0.9 : [0.3, 0.5, 0.3]
                }}
                transition={{ duration: isNearMouse ? 0.2 : 3, repeat: isNearMouse ? 0 : Infinity, delay: Math.random() * 2 }}
              />
            );
          })}

          {/* Cursor Node (The "Hunter") */}
          <motion.circle
            cx={mousePos.x}
            cy={mousePos.y}
            r="1"
            fill="#fff"
            animate={{ cx: mousePos.x, cy: mousePos.y }}
            transition={{ type: "spring", damping: 30, stiffness: 500 }}
          />
          
          {/* Cursor Ring */}
          <motion.circle
            cx={mousePos.x}
            cy={mousePos.y}
            r="6"
            fill="none"
            stroke="rgba(0, 243, 255, 0.8)"
            strokeWidth="0.3"
            strokeDasharray="2 1"
            animate={{ cx: mousePos.x, cy: mousePos.y, rotate: 360 }}
            transition={{ 
              cx: { type: "spring", damping: 30, stiffness: 500 },
              rotate: { duration: 4, repeat: Infinity, ease: "linear" }
            }}
          />
          
          {/* Cursor Glow */}
          <motion.circle
            cx={mousePos.x}
            cy={mousePos.y}
            r="20"
            fill="url(#cursor-glow)"
            animate={{ cx: mousePos.x, cy: mousePos.y }}
            transition={{ type: "spring", damping: 30, stiffness: 500 }}
          />

        </svg>
      </div>

      {/* Content Overlay */}
      <div className="threat-viz-content" style={{ position: 'relative', zIndex: 1, pointerEvents: 'none', background: 'radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)', padding: '40px' }}>
        <h2 className="section-title" style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)' }}>REAL-TIME THREAT NEUTRALIZATION</h2>
        <p className="section-subtitle" style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)' }}>Active monitoring of data flows and potential attack vectors.</p>
        
        <p className="viz-description" style={{ 
          maxWidth: '700px', 
          textAlign: 'center', 
          marginBottom: '30px', 
          color: '#e0e0e0',
          lineHeight: '1.6',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 243, 255, 0.1)',
          backdropFilter: 'blur(4px)'
        }}>
          In the modern cyber-warfare landscape, visibility is your only defense. PassiveGuard's neural-net powered engine visualizes your entire attack surface in real-time, identifying anomalous data flows and neutralizing zero-day threats before they can execute. Don't just scan code—watch it live.
        </p>

        <div className="viz-overlay" style={{ position: 'relative', bottom: 'auto', left: 'auto', marginTop: '20px', justifyContent: 'center' }}>
          <div className="stat-box">
            <span className="stat-label">THREATS BLOCKED</span>
            <span className="stat-value text-neon-pink">14,203</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">ACTIVE NODES</span>
            <span className="stat-value text-neon-cyan">842</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatVisualization;
