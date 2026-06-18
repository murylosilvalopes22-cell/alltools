import React, { useState, useEffect, useRef } from 'react';
import './DevMetricsOverlay.css';

const MAX_HISTORY = 30;

const DevMetricsOverlay = () => {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(0);
  const [fpsHistory, setFpsHistory] = useState(Array(MAX_HISTORY).fill(60));
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const requestRef = useRef(null);

  useEffect(() => {
    const updateMetrics = (time) => {
      frameCountRef.current++;
      const elapsed = time - lastTimeRef.current;
      
      // Atualiza FPS a cada 500ms
      if (elapsed >= 500) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        setFpsHistory(prev => [...prev.slice(1), currentFps]);
        
        frameCountRef.current = 0;
        lastTimeRef.current = time;

        // Atualiza Memória se suportado (Chrome/Edge)
        if (performance.memory) {
          const mbUsed = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
          setMemory(mbUsed);
        }
      }
      
      requestRef.current = requestAnimationFrame(updateMetrics);
    };

    requestRef.current = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const getFpsColor = (val) => {
    if (val >= 50) return 'good';
    if (val >= 30) return 'warn';
    return 'bad';
  };

  return (
    <div className="dev-metrics-overlay">
      <div className="metrics-header">
        <span>DEV PERFORMANCE</span>
        <div className="pulse"></div>
      </div>
      
      <div className="metric-row">
        <span className="metric-label">FPS TICK</span>
        <span className={`metric-value ${getFpsColor(fps)}`}>{fps}</span>
      </div>
      
      <div className="mini-graph">
        {fpsHistory.map((val, i) => {
          const height = Math.max(10, Math.min(100, (val / 60) * 100));
          return (
            <div 
              key={i} 
              className="graph-bar" 
              style={{ height: `${height}%`, backgroundColor: getFpsColor(val) === 'good' ? '#10b981' : getFpsColor(val) === 'warn' ? '#f59e0b' : '#ef4444' }} 
            />
          );
        })}
      </div>

      <div className="metric-row" style={{ marginTop: '5px' }}>
        <span className="metric-label">MEM (RAM)</span>
        <span className="metric-value">{memory > 0 ? `${memory} MB` : 'N/A'}</span>
      </div>
    </div>
  );
};

export default DevMetricsOverlay;
