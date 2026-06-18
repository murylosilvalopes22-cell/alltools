import React, { useState, useRef, useEffect } from 'react';
import './Fogueira.css';

const Fogueira = () => {
  const [mouseState, setMouseState] = useState('normal'); // 'normal', 'on-fire', 'smoke'
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const hoverTimerRef = useRef(null);
  const burnTimerRef = useRef(null);
  const smokeTimerRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0, time: 0 });
  const currentHoverPos = useRef({ x: 0, y: 0 });

  const clearAllTimers = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (burnTimerRef.current) clearTimeout(burnTimerRef.current);
    if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);
  };

  const extinguish = () => {
    setMouseState('smoke');
    clearAllTimers();
    // Volta ao normal depois de 2 segundos de fumaça
    smokeTimerRef.current = setTimeout(() => {
      setMouseState('normal');
    }, 2000);
  };

  const handleBonfireEnter = (e) => {
    if (mouseState !== 'normal') return;
    currentHoverPos.current = { x: e.clientX, y: e.clientY };
    
    // Inicia timer pra pegar fogo
    hoverTimerRef.current = setTimeout(() => {
      setMouseState('on-fire');
      setMousePos({ x: currentHoverPos.current.x, y: currentHoverPos.current.y });
      lastMousePos.current = { x: currentHoverPos.current.x, y: currentHoverPos.current.y, time: Date.now() };
      
      // Mouse apaga sozinho depois de 5s pegando fogo
      burnTimerRef.current = setTimeout(() => {
        extinguish();
      }, 5000);
    }, 1500); // 1.5 segundo com o mouse parado no fogo
  };

  const handleBonfireHoverMove = (e) => {
    currentHoverPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleBonfireLeave = () => {
    if (mouseState === 'normal') {
      clearAllTimers(); // Cancela se o cara tirar o mouse cedo demais
    }
  };

  useEffect(() => {
    if (mouseState === 'normal') return;

    const handleGlobalMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      if (mouseState === 'on-fire') {
        const now = Date.now();
        const dt = now - lastMousePos.current.time;
        
        if (dt > 30) {
          const dx = e.clientX - lastMousePos.current.x;
          const dy = e.clientY - lastMousePos.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const speed = distance / dt; // pixels por milissegundo
          
          // Se balançar rápido (mais de 4px/ms), apaga
          if (speed > 4) { 
            extinguish();
          }

          lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
        }
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [mouseState]);

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  return (
    <>
      <div 
        className="fogueira-container no-print"
        onMouseEnter={handleBonfireEnter}
        onMouseLeave={handleBonfireLeave}
        onMouseMove={handleBonfireHoverMove}
        title="Esquente o mouse aqui!"
      >
        <div className="bonfire-highres-fire"></div>
        
        <div className="wood-container">
          <div className="wood wood-left"></div>
          <div className="wood wood-right"></div>
          <div className="wood wood-center"></div>
        </div>
        
        <div className="sparks">
          <div className="spark spark-1"></div>
          <div className="spark spark-2"></div>
          <div className="spark spark-3"></div>
        </div>
      </div>

      {mouseState === 'on-fire' && (
        <div 
          className="mouse-on-fire"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="pixel-fire"></div>
        </div>
      )}

      {mouseState === 'smoke' && (
        <div 
          className="mouse-smoke"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="pixel-smoke smoke-p1"></div>
          <div className="pixel-smoke smoke-p2"></div>
        </div>
      )}
    </>
  );
};

export default Fogueira;
