import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalSquare, X, CheckCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { usePreferences } from '../contexts/PreferencesContext';
import './TaskNotification.css'; // Reusing layout CSS
import './SupportNotification.css'; // Specific overrides

const SupportNotification = () => {
  const { preferences } = usePreferences();
  const [requests, setRequests] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const collRef = collection(db, 'solicitacoes');
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter only "Novas" and "Testes"
      const activeRequests = data.filter(r => r.status === 'Novas' || r.status === 'Testes');
      activeRequests.sort((a, b) => (b.data_criacao || 0) - (a.data_criacao || 0));
      
      setRequests(activeRequests);
    });

    return () => unsubscribe();
  }, []);

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (requests.length === 0 || !preferences.showNotifications) return null;

  return (
    <div className="task-notification-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="task-notification-popup"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="task-notification-header">
              <h3 style={{ color: '#a855f7' }}>
                <TerminalSquare size={18} />
                DEV: Solicitações
              </h3>
              <button className="close-notification-btn" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="task-notification-list">
              {requests.map(req => (
                <div key={req.id} className="support-notification-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="module-name">{req.modulo}</span>
                    <span className={req.status === 'Novas' ? 'status-novas' : 'status-testes'}>
                      {req.status === 'Novas' ? 'Nova' : 'Em Análise'}
                    </span>
                  </div>
                  <div>{truncateText(req.observacoes_usuario, 60)}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        className="support-notification-btn"
        onClick={() => setIsOpen(!isOpen)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
      >
        <TerminalSquare size={20} className="icon-feedback" style={{ color: '#a855f7' }} />
        <span className="feedback-text" style={{ display: 'inline-block' }}>Dev: Suporte</span>
        <div className="support-badge">
          {requests.length > 99 ? '99+' : requests.length}
        </div>
      </motion.button>
    </div>
  );
};

export default SupportNotification;
