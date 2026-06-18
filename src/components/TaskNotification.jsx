import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { usePreferences } from '../contexts/PreferencesContext';
import './TaskNotification.css';

const TaskNotification = () => {
  const { preferences } = usePreferences();
  const [profile, setProfile] = useState(null);
  const [openTasks, setOpenTasks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load profile from localStorage and listen to changes
  useEffect(() => {
    const loadProfile = () => {
      const saved = localStorage.getItem('taskOrganizerProfile');
      if (saved) {
        try {
          setProfile(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing saved profile", e);
        }
      } else {
        setProfile(null);
        setOpenTasks([]);
      }
    };

    loadProfile();

    const handleProfileChange = () => {
      loadProfile();
    };

    window.addEventListener('taskProfileChanged', handleProfileChange);
    return () => {
      window.removeEventListener('taskProfileChanged', handleProfileChange);
    };
  }, []);

  // Listen to tasks for the active profile
  useEffect(() => {
    if (!profile) return;

    let unsubs = [];
    let isMounted = true;
    
    // We need to find all columns first, then listen to tasks in each
    const colsRef = collection(db, 'taskOrganizerProfiles', profile.id, 'columns');
    
    getDocs(colsRef).then(snap => {
      if (!isMounted) return;
      
      const colIds = snap.docs.map(doc => doc.id);
      
      // Listen to tasks in each column
      colIds.forEach(colId => {
        const tasksRef = collection(db, 'taskOrganizerProfiles', profile.id, 'columns', colId, 'tasks');
        const q = query(tasksRef);
        
        const unsub = onSnapshot(q, (snapshot) => {
          const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), columnId: colId }));
          
          setOpenTasks(prev => {
            // Remove old tasks from this column
            const filtered = prev.filter(t => t.columnId !== colId);
            // Add new incomplete tasks
            const incomplete = tasks.filter(t => !t.completed);
            return [...filtered, ...incomplete].sort((a, b) => {
              // Sort by creation date if possible
              if (a.createdAt && b.createdAt) {
                return b.createdAt.toMillis() - a.createdAt.toMillis();
              }
              return 0;
            });
          });
        });
        
        unsubs.push(unsub);
      });
    }).catch(err => {
      console.error("Error fetching columns for notifications:", err);
    });

    return () => {
      isMounted = false;
      unsubs.forEach(unsub => unsub());
    };
  }, [profile]);

  if (!profile || !preferences.showNotifications) return null;

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

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
              <h3>
                <Bell size={18} />
                Tarefas: {profile.name}
              </h3>
              <button className="close-notification-btn" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="task-notification-list">
              {openTasks.length > 0 ? (
                openTasks.map(task => (
                  <div key={task.id} className={`task-notification-item task-color-${task.color || 'default'}`}>
                    {truncateText(task.text, 60)}
                  </div>
                ))
              ) : (
                <div className="task-notification-empty">
                  <CheckCircle size={32} color="var(--primary-color)" />
                  <span>Nenhuma tarefa pendente!</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {openTasks.length > 0 && (
        <motion.button 
          className="task-notification-btn"
          onClick={() => setIsOpen(!isOpen)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell size={20} className="icon-feedback" style={{ color: 'var(--neon-cyan)' }} />
          <span className="feedback-text" style={{ display: 'inline-block' }}>Tarefas</span>
          <div className="task-badge">
            {openTasks.length > 99 ? '99+' : openTasks.length}
          </div>
        </motion.button>
      )}
    </div>
  );
};

export default TaskNotification;
