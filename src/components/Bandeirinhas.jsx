import React, { useMemo } from 'react';
import './Bandeirinhas.css';

const Bandeirinhas = () => {
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#facc15', '#f97316', '#ec4899', '#a855f7'];
  
  // Configuração de multiplos varais com caimentos e inclinações moderadas
  const ropes = [
    // Varal 1: O clássico lá em cima no teto
    { id: 1, p0y: -10, p1y: 120, p2y: 10, numFlags: 25 },
    // Varal 2: Inclinação bem visível mas não exagerada (cai 250px)
    { id: 2, p0y: 400, p1y: 750, p2y: 650, numFlags: 24 },
    // Varal 3: Bem no limite inferior da tela (sobe 200px)
    { id: 3, p0y: 1150, p1y: 1200, p2y: 950, numFlags: 22 }
  ];

  return (
    <div className="bandeirinhas-wrapper no-print">
      <svg className="corda-svg" viewBox="0 0 100 1200" preserveAspectRatio="none">
        {ropes.map(rope => (
          <path 
            key={`path-${rope.id}`}
            d={`M 0,${rope.p0y} Q 50,${rope.p1y} 100,${rope.p2y}`} 
            fill="none" 
            className="corda-path" 
            strokeWidth="2" 
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      
      <div className="flags-container">
        {ropes.map(rope => {
          return Array.from({ length: rope.numFlags }).map((_, i) => {
            const t = i / (rope.numFlags - 1);
            // Equação completa da Curva de Bezier Quadrática
            const yOffset = Math.pow(1 - t, 2) * rope.p0y + 2 * (1 - t) * t * rope.p1y + Math.pow(t, 2) * rope.p2y; 
            const leftPos = t * 100;
            
            // Delay determinístico para não piscar no re-render
            const delay = ((rope.id * 17 + i * 23) % 30) / 10;

            return (
              <div 
                key={`flag-${rope.id}-${i}`} 
                className={`flag ${(i + rope.id) % 2 === 0 ? 'tipo-1' : 'tipo-2'}`}
                style={{ 
                  position: 'absolute',
                  left: `${leftPos}%`,
                  top: `${yOffset}px`,
                  backgroundColor: colors[(i + rope.id) % colors.length],
                  animationDelay: `-${delay}s`,
                  zIndex: rope.id // Varal 2 fica por cima do varal 1
                }}
              ></div>
            );
          });
        })}
      </div>
    </div>
  );
};

export default Bandeirinhas;
