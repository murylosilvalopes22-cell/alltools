import React from 'react';
import { Info } from 'lucide-react';
import { motion } from 'framer-motion';
import './HeroAlert.css';

const HeroAlert = () => {
  return (
    <motion.div 
      className="hero-alert glass-panel"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="alert-icon-wrapper">
        <Info size={24} className="alert-icon" />
      </div>
      <div className="alert-content">
        <h3>Notas da Atualização (09/04/2026)</h3>
        <p>
          Algumas ferramentas estão marcadas como <strong className="wip-text">WIP (Work in Progress)</strong> pois ainda contêm erros ou funcionalidades parciais.
        </p>
        <div className="alert-example">
          <span className="badge-example">Exemplo</span>
          <span>No "Consulta NCM", no momento, apenas está disponível a pesquisa de NCM por nomes de produtos e verificação pela API Brasil.</span>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroAlert;
