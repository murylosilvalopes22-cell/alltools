import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AVAILABLE_TOOLS } from '../data/toolsList';
import * as Icons from 'lucide-react';
import './GlobalSearch.css';

const GlobalSearch = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const fuzzyMatch = (str, q) => {
    let i = 0, j = 0;
    while (i < str.length && j < q.length) {
      if (str[i] === q[j]) j++;
      i++;
    }
    return j === q.length;
  };

  const normalizedQuery = normalize(query);
  const filteredTools = AVAILABLE_TOOLS.filter(tool => {
    const title = normalize(tool.title);
    const desc = normalize(tool.desc);
    return title.includes(normalizedQuery) || desc.includes(normalizedQuery) || fuzzyMatch(title, normalizedQuery);
  });

  const handleSelect = (tool) => {
    if (onAction) {
      onAction(tool.actionKey);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="global-search-container" ref={containerRef}>
      <motion.button 
        className="search-btn-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Search size={20} className="icon-feedback" style={{ color: '#38bdf8' }} />
        <span className="feedback-text">Pesquisar</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="search-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="search-header">
              <Search size={18} className="search-icon-input" />
              <input 
                ref={inputRef}
                type="text" 
                placeholder="Buscar ferramenta..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button className="clear-btn" onClick={() => setQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="search-results">
              {filteredTools.length > 0 ? (
                filteredTools.map(tool => {
                  const IconComp = Icons[tool.icon] || Icons.FileText;
                  return (
                    <div 
                      key={tool.id} 
                      className="search-result-item"
                      onClick={() => handleSelect(tool)}
                    >
                      <div className="result-icon" style={{ background: tool.iconBg || 'rgba(255,255,255,0.05)', color: tool.iconColor || '#e2e8f0' }}>
                        <IconComp size={18} />
                      </div>
                      <div className="result-text">
                        <h4>{tool.title}</h4>
                        <p>{tool.desc}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-results">
                  Nenhuma ferramenta encontrada.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;
