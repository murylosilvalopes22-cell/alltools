import React from 'react';
import { ChevronRight, Zap, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';
import './ToolCard.css';

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const ToolCard = ({ tool }) => {
  const isWip = tool.status === 'WIP';
  
  return (
    <motion.a 
      href={tool.link} 
      className={`tool-card glass-panel ${isWip ? 'is-wip' : ''}`}
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="card-header">
        <div className={`status-indicator ${isWip ? 'wip' : 'ativo'}`}>
          <span className="dot"></span>
          {tool.status}
        </div>
        <div className="icon-wrap">
          {isWip ? <Wrench size={18} className="wip-icon" /> : <Zap size={18} className="ativo-icon" />}
        </div>
      </div>
      
      <div className="card-body">
        <h3 className="tool-title">{tool.title}</h3>
      </div>
      
      <div className="card-footer">
        <span>Acessar ferramenta</span>
        <ChevronRight size={16} />
      </div>
    </motion.a>
  );
};

export default ToolCard;
