import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Lock } from 'lucide-react';
import './DevAuthModal.css';

const DevAuthModal = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '2159') {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
      setPassword('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="dev-modal-overlay">
      <motion.div 
        className="dev-modal-content"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
      >
        <div className="dev-icon-wrapper">
          <Terminal size={32} />
        </div>
        <h2>Modo Desenvolvedor</h2>
        <p>Acesso restrito a funcionalidades avançadas e gestão do sistema.</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <input 
            ref={inputRef}
            type="password" 
            className={`dev-password-input ${error ? 'error' : ''}`}
            placeholder="****"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={4}
          />

          <div className="dev-modal-actions">
            <button type="button" className="dev-btn dev-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dev-btn dev-btn-submit">
              <Lock size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: '-3px' }} />
              Autenticar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DevAuthModal;
