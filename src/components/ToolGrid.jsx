import React from 'react';
import { motion } from 'framer-motion';
import ToolCard from './ToolCard';
import './ToolGrid.css';

const toolsData = [
  { id: 1, title: 'Dossiê Fiscal', status: 'Ativo', link: 'https://olyrum.github.io/alltools/app1.html' },
  { id: 3, title: 'Consulta NCM / API Gemini', status: 'WIP', link: 'https://olyrum.github.io/alltools/app3.html' },
  { id: 4, title: 'Gerador QR Code', status: 'Ativo', link: 'https://olyrum.github.io/alltools/app4.html' },
  { id: 5, title: 'Conversor de Imagens', status: 'Ativo', link: 'https://olyrum.github.io/alltools/app5.html' },
  { id: 6, title: 'Download AnyDesk Cliente', status: 'Ativo', link: 'https://olyrum.github.io/alltools/app6.html' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const ToolGrid = () => {
  return (
    <motion.div 
      className="tool-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {toolsData.map(tool => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </motion.div>
  );
};

export default ToolGrid;
