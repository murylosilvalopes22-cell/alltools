import React, { useState, useEffect, useRef } from 'react';
import './ThanosEasterEgg.css';

import snapBlackGif from '../assets/snap-black.gif';

const ThanosEasterEgg = () => {
  const [isZoomedOut, setIsZoomedOut] = useState(false);
  const [gifSrc, setGifSrc] = useState(snapBlackGif);
  const [isSnapping, setIsSnapping] = useState(false);
  const [showGif, setShowGif] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // 25% zoom trigger (very large innerWidth or low devicePixelRatio)
      if (window.innerWidth >= 3800 || window.devicePixelRatio <= 0.35) {
        setIsZoomedOut(true);
      } else {
        setIsZoomedOut(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSnap = () => {
    if (isSnapping) return;
    setIsSnapping(true);
    setShowGif(true);
    
    // Restart the GIF to sync the snap animation
    setGifSrc(snapBlackGif + '?t=' + Date.now());
    
    // Para a manopla de rodar depois que o snap terminar (3s)
    setTimeout(() => {
      setShowGif(false);
    }, 3000);

    // Wait for the snap moment (e.g. 1.5s into the GIF)
    setTimeout(() => {
      // Find all bento items, cards, and modules
      const elements = Array.from(document.querySelectorAll('.bento-card, .glass-panel, .module-card, .tool-card, .qr-card, .cs-content, .info-section, .duty-schedule-container'));
      
      if (elements.length > 0) {
        // Shuffle and select exactly half
        const shuffled = elements.sort(() => 0.5 - Math.random());
        const half = shuffled.slice(0, Math.ceil(elements.length / 2));
        
        half.forEach(item => item.classList.add('snapped'));

        // Restore after 10 seconds
        setTimeout(() => {
          half.forEach(item => item.classList.remove('snapped'));
          setIsSnapping(false);
        }, 10000);
      } else {
        setIsSnapping(false);
      }
    }, 1500);
  };

  if (!isZoomedOut) return null;

  return (
    <div className="thanos-wrapper">
      <button 
        className="thanos-trigger-btn" 
        onClick={handleSnap}
        disabled={isSnapping}
        title="I am inevitable."
      ></button>

      <div className={`thanos-container ${showGif ? 'visible' : ''}`}>
        <img 
          src={gifSrc} 
          alt="Thanos Snap"
          className="thanos-video" 
        />
      </div>
    </div>
  );
};

export default ThanosEasterEgg;
