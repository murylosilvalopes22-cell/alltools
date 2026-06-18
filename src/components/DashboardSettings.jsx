import React, { useState, useRef, useEffect } from 'react';
import { Settings, Zap, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferences } from '../contexts/PreferencesContext';
import './DashboardSettings.css';

const DashboardSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { preferences, toggleAnimation, toggleUpdateLog, toggleFeedbackButton, toggleNotifications, toggleFestaJunina } = usePreferences();
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="dashboard-settings-container" ref={dropdownRef}>
      <motion.button 
        className={`dashboard-settings-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        title="Configurações da Interface"
      >
        <Settings size={22} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="settings-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <h3><Settings size={18} /> Preferências</h3>
            
            <div className="setting-item">
              <div className="setting-info">
                <span>Animações</span>
                <small>Habilita fluidez visual</small>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={preferences.animationsEnabled} 
                  onChange={toggleAnimation} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span>Log de Atualizações</span>
                <small>Mostra banner de notas de versão</small>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={preferences.showUpdateLog} 
                  onChange={toggleUpdateLog} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span>Botão de Solicitações</span>
                <small>Mostrar botão no topo (Feedback)</small>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={preferences.showFeedbackButton} 
                  onChange={toggleFeedbackButton} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span>Notificações de Tarefas</span>
                <small>Mostrar alertas no painel (Gerais)</small>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={preferences.showNotifications} 
                  onChange={toggleNotifications}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span>Tema Festa Junina</span>
                <small>Bandeirinhas e Fogueira</small>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={preferences.showFestaJunina} 
                  onChange={toggleFestaJunina} 
                />
                <span className="slider round"></span>
              </label>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardSettings;
