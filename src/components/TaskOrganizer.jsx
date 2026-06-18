import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  getDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  ArrowLeft, 
  Settings, 
  Plus, 
  Trash2,
  Edit2,
  Check,
  MoreVertical,
  ArrowRight,
  User,
  LogOut,
  X,
  Flame
} from 'lucide-react';
import './TaskOrganizer.css';

const DEFAULT_COLUMNS = [
  { id: 'col1', name: 'A Fazer' },
  { id: 'col2', name: 'Fazendo' },
  { id: 'col3', name: 'Feito' }
];

const COLORS = [
  { id: 'default', code: 'transparent' },
  { id: 'red', code: '#ef4444' },
  { id: 'blue', code: '#3b82f6' },
  { id: 'green', code: '#22c55e' },
  { id: 'yellow', code: '#eab308' },
  { id: 'purple', code: '#a855f7' },
  { id: 'solid-red', code: '#ff0000' },
  { id: 'solid-blue', code: '#0000ff' },
  { id: 'solid-green', code: '#00ff00' },
  { id: 'solid-dark', code: '#000000' }
];

// Helper to generate a consistent color based on string
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
};

const TaskOrganizer = ({ theme, onBack }) => {
  const [viewMode, setViewMode] = useState('profiles'); // 'profiles' or 'board'
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasksByColumn, setTasksByColumn] = useState({});
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isManagingProfiles, setIsManagingProfiles] = useState(false);
  
  // Drag and Drop global state
  const [draggingTask, setDraggingTask] = useState(null);

  // Fetch profiles on mount
  useEffect(() => {
    const q = query(collection(db, 'taskOrganizerProfiles'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProfiles(profs);
      
      setActiveProfile(current => {
        if (current) {
          const updated = profs.find(p => p.id === current.id);
          if (!updated) {
            setViewMode('profiles');
            return null;
          }
          if (updated.name !== current.name) {
            return updated;
          }
        }
        return current;
      });
    });
    return () => unsubscribe();
  }, []);

  // Load columns when a profile is selected
  useEffect(() => {
    if (viewMode !== 'board' || !activeProfile) return;

    setColumns([]);
    setTasksByColumn({});

    const colsRef = collection(db, 'taskOrganizerProfiles', activeProfile.id, 'columns');
    let isMounted = true;
    let unsubCols = null;
    
    getDocs(colsRef).then(async (snap) => {
      if (!isMounted) return;
      if (snap.empty) {
        const batch = writeBatch(db);
        for (const col of DEFAULT_COLUMNS) {
          const docRef = doc(colsRef, col.id);
          batch.set(docRef, {
            name: col.name,
            autoUncheckType: 'off',
            lastUnchecked: new Date()
          });
        }
        await batch.commit();
      }
      if (!isMounted) return;
      
      unsubCols = onSnapshot(query(colsRef), (snapshot) => {
        const cols = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        cols.sort((a, b) => a.id.localeCompare(b.id));
        setColumns(cols);
        cols.forEach(col => runAutoUncheck(col));
      });
    });

    return () => {
      isMounted = false;
      if (unsubCols) unsubCols();
    };
  }, [viewMode, activeProfile]);

  // Listen to tasks for each column
  useEffect(() => {
    if (viewMode !== 'board' || !activeProfile || columns.length === 0) return;
    
    const unsubs = [];
    columns.forEach(col => {
      const tasksRef = collection(db, 'taskOrganizerProfiles', activeProfile.id, 'columns', col.id, 'tasks');
      const q = query(tasksRef, orderBy('createdAt', 'asc'));
      
      const unsub = onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasksByColumn(prev => ({ ...prev, [col.id]: tasks }));
      });
      unsubs.push(unsub);
    });
    
    return () => unsubs.forEach(unsub => unsub());
  }, [viewMode, activeProfile, columns]);

  const runAutoUncheck = async (col) => {
    if (col.autoUncheckType === 'off' || !col.lastUnchecked) return;
    const lastUncheckedDate = col.lastUnchecked.toDate ? col.lastUnchecked.toDate() : new Date(col.lastUnchecked);
    const now = new Date();
    let shouldUncheck = false;
    const lastDate = new Date(lastUncheckedDate);
    lastDate.setHours(0,0,0,0);
    const currentDate = new Date(now);
    currentDate.setHours(0,0,0,0);
    
    if (col.autoUncheckType === 'daily') {
      if (currentDate > lastDate) shouldUncheck = true;
    } else if (col.autoUncheckType === 'weekly') {
      const diffTime = Math.abs(currentDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 7 || (currentDate > lastDate && currentDate.getDay() < lastDate.getDay())) {
         shouldUncheck = true;
      }
    } else if (col.autoUncheckType === 'biweekly') {
      const diffTime = Math.abs(currentDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 14) {
         shouldUncheck = true;
      }
    } else if (col.autoUncheckType === 'monthly') {
      if (currentDate.getMonth() !== lastDate.getMonth() || currentDate.getFullYear() !== lastDate.getFullYear()) {
        shouldUncheck = true;
      }
    }
    
    if (shouldUncheck) {
      const tasksRef = collection(db, 'taskOrganizerProfiles', activeProfile.id, 'columns', col.id, 'tasks');
      const snap = await getDocs(tasksRef);
      const batch = writeBatch(db);
      snap.docs.forEach(docSnap => {
        if (docSnap.data().completed) batch.update(docSnap.ref, { completed: false });
      });
      const colRef = doc(db, 'taskOrganizerProfiles', activeProfile.id, 'columns', col.id);
      batch.update(colRef, { lastUnchecked: new Date() });
      await batch.commit();
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    try {
      await addDoc(collection(db, 'taskOrganizerProfiles'), {
        name: newProfileName.trim(),
        createdAt: serverTimestamp()
      });
      setNewProfileName('');
      setIsCreatingProfile(false);
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  };

  const deleteProfile = async (profileId) => {
    if (window.confirm("Tem certeza que deseja excluir este Workspace? Todas as tarefas serão perdidas!")) {
      try {
        const profileRef = doc(db, 'taskOrganizerProfiles', profileId);
        await deleteDoc(profileRef);
        
        // If the deleted profile was the active one, clear from localStorage
        const saved = localStorage.getItem('taskOrganizerProfile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.id === profileId) {
            localStorage.removeItem('taskOrganizerProfile');
            window.dispatchEvent(new Event('taskProfileChanged'));
          }
        }
      } catch (error) {
        console.error("Error deleting profile:", error);
      }
    }
  };

  const updateColumnConfig = async (colId, key, value) => {
    const colRef = doc(db, 'taskOrganizerProfiles', activeProfile.id, 'columns', colId);
    await updateDoc(colRef, { [key]: value });
  };

  const renameColumn = async (colId, newName) => {
    const colRef = doc(db, 'taskOrganizerProfiles', activeProfile.id, 'columns', colId);
    await updateDoc(colRef, { name: newName });
  };

  const moveTask = async (taskId, currentColId, targetColId) => {
    if (currentColId === targetColId) return;
    try {
      const currentTaskRef = doc(db, 'taskOrganizerProfiles', activeProfile.id, 'columns', currentColId, 'tasks', taskId);
      const targetTasksRef = collection(db, 'taskOrganizerProfiles', activeProfile.id, 'columns', targetColId, 'tasks');
      
      const taskSnap = await getDoc(currentTaskRef);
      if (taskSnap.exists()) {
        const taskData = taskSnap.data();
        
        const targetColumn = columns.find(c => c.id === targetColId);
        if (targetColumn && targetColumn.autoCompleteOnDrop) {
          taskData.completed = true;
        }

        const batch = writeBatch(db);
        
        const newTaskRef = doc(targetTasksRef);
        batch.set(newTaskRef, taskData);
        batch.delete(currentTaskRef);
        
        await batch.commit();
      }
    } catch (error) {
      console.error("Error moving task:", error);
    }
  };

  // Drag Handlers
  const onDragStart = (e, task, sourceColId) => {
    setDraggingTask({ task, sourceColId });
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.classList.add('is-dragging');
    }, 0);
  };
  const onDragEnd = (e) => {
    e.target.classList.remove('is-dragging');
    setDraggingTask(null);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e, targetColId) => {
    e.preventDefault();
    if (draggingTask && draggingTask.sourceColId !== targetColId) {
      moveTask(draggingTask.task.id, draggingTask.sourceColId, targetColId);
    }
  };

  // -------------------------------------------------------------
  // RENDER: PROFILE SELECTION (NETFLIX STYLE)
  // -------------------------------------------------------------
  if (viewMode === 'profiles') {
    return (
      <motion.div 
        className="profile-selection-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="profile-header-actions">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={18} /> Dashboard
          </button>
        </div>

        <div className="profile-selection-content">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Quem está acessando?
          </motion.h1>

          <div className="profiles-grid">
            <AnimatePresence>
              {profiles.map((profile, i) => (
                <motion.div 
                  key={profile.id}
                  className={`profile-card ${isManagingProfiles ? 'wobble' : ''}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    if (!isManagingProfiles) {
                      setActiveProfile(profile);
                      localStorage.setItem('taskOrganizerProfile', JSON.stringify({id: profile.id, name: profile.name}));
                      window.dispatchEvent(new Event('taskProfileChanged'));
                      setViewMode('board');
                    }
                  }}
                >
                  <div className="avatar-wrapper">
                    <div 
                      className="profile-avatar" 
                      style={{ backgroundColor: stringToColor(profile.name) }}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    {isManagingProfiles && (
                      <button 
                        className="delete-profile-badge" 
                        onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <span className="profile-name">{profile.name}</span>
                </motion.div>
              ))}

              {!isManagingProfiles && (
                <motion.div 
                  className="profile-card add-profile-card"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: profiles.length * 0.05 }}
                  onClick={() => setIsCreatingProfile(true)}
                >
                  <div className="avatar-wrapper">
                    <div className="profile-avatar add-avatar">
                      <Plus size={40} />
                    </div>
                  </div>
                  <span className="profile-name">Novo Workspace</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            className="manage-profiles-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setIsManagingProfiles(!isManagingProfiles)}
          >
            {isManagingProfiles ? "Concluído" : "Gerenciar Perfis"}
          </motion.button>
        </div>

        {/* Modal/Overlay for New Profile */}
        <AnimatePresence>
          {isCreatingProfile && (
            <div className="modal-overlay">
              <motion.div 
                className="modal-content"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
              >
                <button className="modal-close" onClick={() => setIsCreatingProfile(false)}>
                  <X size={24} />
                </button>
                <h2>Criar Novo Workspace</h2>
                <form onSubmit={handleCreateProfile}>
                  <input 
                    type="text" 
                    className="add-task-input" 
                    placeholder="Nome do Workspace..."
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    autoFocus
                    style={{ minHeight: 'auto', padding: '16px', fontSize: '1.2rem', marginBottom: '20px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-small btn-cancel" onClick={() => setIsCreatingProfile(false)}>Cancelar</button>
                    <button type="submit" className="btn-small btn-primary">Salvar</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: TASK BOARD
  // -------------------------------------------------------------
  return (
    <motion.div 
      className="task-organizer-container"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="task-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            className="mini-avatar" 
            style={{ backgroundColor: stringToColor(activeProfile.name) }}
            title={`Logado como: ${activeProfile.name}`}
          >
            {activeProfile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Workspace</h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{activeProfile.name}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="back-btn" onClick={() => setViewMode('profiles')}>
            <ArrowLeft size={18} /> Trocar Perfil
          </button>
          <button className="back-btn" onClick={onBack} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <LogOut size={18} /> Dashboard
          </button>
        </div>
      </div>

      {columns.length > 0 && (
        <div className="board-columns">
          {columns.map(col => (
            <Column 
              key={col.id} 
              profileId={activeProfile.id}
              column={col} 
              tasks={tasksByColumn[col.id] || []}
              allColumns={columns}
              onUpdateConfig={updateColumnConfig}
              onRename={renameColumn}
              onMoveTask={moveTask}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isDraggingAny={!!draggingTask}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Extracted Column component
const Column = ({ 
  profileId, 
  column, 
  tasks, 
  allColumns, 
  onUpdateConfig, 
  onRename, 
  onMoveTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDraggingAny
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskColor, setNewTaskColor] = useState('default');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameText, setEditNameText] = useState(column.name);
  const [taskMoveMenuOpen, setTaskMoveMenuOpen] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const [newTaskDeleteOnCheck, setNewTaskDeleteOnCheck] = useState(false);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    try {
      await addDoc(collection(db, 'taskOrganizerProfiles', profileId, 'columns', column.id, 'tasks'), {
        text: newTaskText.trim(),
        completed: false,
        color: newTaskColor,
        deleteOnCheck: newTaskDeleteOnCheck,
        createdAt: serverTimestamp()
      });
      setNewTaskText('');
      setNewTaskColor('default');
      setNewTaskDeleteOnCheck(false);
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const toggleTask = async (task) => {
    try {
      if (!task.completed && task.deleteOnCheck) {
        await deleteTask(task.id);
        return;
      }
      
      const taskRef = doc(db, 'taskOrganizerProfiles', profileId, 'columns', column.id, 'tasks', task.id);
      await updateDoc(taskRef, { completed: !task.completed });

      if (!task.completed && column.moveOnCheck && column.moveOnCheck !== 'off') {
        onMoveTask(task.id, column.id, column.moveOnCheck);
      }
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const taskRef = doc(db, 'taskOrganizerProfiles', profileId, 'columns', column.id, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const editTaskText = async (taskId, newText) => {
    try {
      const taskRef = doc(db, 'taskOrganizerProfiles', profileId, 'columns', column.id, 'tasks', taskId);
      await updateDoc(taskRef, { text: newText.trim() });
    } catch (error) {
      console.error("Error updating task text:", error);
    }
  };

  const updateTaskData = async (taskId, updates) => {
    try {
      const taskRef = doc(db, 'taskOrganizerProfiles', profileId, 'columns', column.id, 'tasks', taskId);
      await updateDoc(taskRef, updates);
    } catch (error) {
      console.error("Error updating task data:", error);
    }
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (editNameText.trim() && editNameText !== column.name) {
      onRename(column.id, editNameText.trim());
    } else {
      setEditNameText(column.name);
    }
    setIsEditingName(false);
  };

  const handleDragOver = (e) => {
    onDragOver(e);
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    setIsDragOver(false);
    onDrop(e, column.id);
  };

  return (
    <div 
      className={`board-column ${isDragOver && isDraggingAny ? 'drag-over' : ''}`}
      style={{ overflow: showSettings ? 'visible' : 'hidden', minHeight: showSettings ? '400px' : 'auto' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <div className="column-title-row">
          {isEditingName ? (
            <form onSubmit={handleRenameSubmit} style={{ flex: 1, marginRight: '8px' }}>
              <input 
                type="text" 
                className="edit-title-input" 
                value={editNameText}
                onChange={e => setEditNameText(e.target.value)}
                autoFocus
                onBlur={handleRenameSubmit}
              />
            </form>
          ) : (
            <div className="column-title" onClick={() => setIsEditingName(true)} title="Clique para renomear">
              <h3>{column.name}</h3>
              <Edit2 size={16} className="edit-icon" />
            </div>
          )}
          
          <div className="column-settings">
            <button className="settings-btn" onClick={() => setShowSettings(!showSettings)} title="Automação da Coluna">
              <Settings size={20} />
            </button>
            
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  className="settings-dropdown"
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                >
                  <label>Auto-concluir ao soltar aqui:</label>
                  <select 
                    value={column.autoCompleteOnDrop ? 'on' : 'off'} 
                    onChange={(e) => {
                      onUpdateConfig(column.id, 'autoCompleteOnDrop', e.target.value === 'on');
                    }}
                    style={{ marginBottom: '12px' }}
                  >
                    <option value="off">Não</option>
                    <option value="on">Sim, marcar como Feito</option>
                  </select>

                  <label>Desmarcar tarefas prontas:</label>
                  <select 
                    value={column.autoUncheckType || 'off'} 
                    onChange={(e) => {
                      onUpdateConfig(column.id, 'autoUncheckType', e.target.value);
                    }}
                    style={{ marginBottom: '12px' }}
                  >
                    <option value="off">Manual (Desligado)</option>
                    <option value="daily">Limpeza Diária</option>
                    <option value="weekly">Limpeza Semanal</option>
                    <option value="biweekly">Limpeza Quinzenal</option>
                    <option value="monthly">Limpeza Mensal</option>
                  </select>

                  <label>Ao concluir mover para:</label>
                  <select 
                    value={column.moveOnCheck || 'off'} 
                    onChange={(e) => {
                      onUpdateConfig(column.id, 'moveOnCheck', e.target.value);
                    }}
                  >
                    <option value="off">Não mover</option>
                    {allColumns.filter(c => c.id !== column.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="column-progress-container">
          <div className="progress-text">
            <span>Progresso</span>
            <span>{completedTasks} / {totalTasks}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <div className="task-list">
        <AnimatePresence mode='popLayout'>
          {tasks.map((task) => (
            <TaskItem 
              key={task.id}
              task={task}
              columnId={column.id}
              allColumns={allColumns}
              onToggle={() => toggleTask(task)}
              onDelete={() => deleteTask(task.id)}
              onEdit={(newText) => editTaskText(task.id, newText)}
              onUpdate={(updates) => updateTaskData(task.id, updates)}
              onDragStart={(e) => onDragStart(e, task, column.id)}
              onDragEnd={onDragEnd}
              taskMoveMenuOpen={taskMoveMenuOpen}
              setTaskMoveMenuOpen={setTaskMoveMenuOpen}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="add-task-container">
        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.form 
              key="adding-form"
              onSubmit={handleAddTask} 
              className="add-task-input-group"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <textarea 
                className="add-task-input" 
                placeholder="Qual é a próxima tarefa?"
                value={newTaskText}
                onChange={(e) => {
                  setNewTaskText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                autoFocus
              />
              
              <div className="add-task-footer">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div className="color-picker" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {COLORS.map(c => (
                      <div
                        key={c.id}
                        className={`color-swatch ${newTaskColor === c.id ? 'selected' : ''}`}
                        title={c.id}
                        onClick={() => setNewTaskColor(c.id)}
                        style={{ 
                          backgroundColor: c.code, 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: newTaskColor === c.id ? '2px solid white' : '1px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        {newTaskColor === c.id && c.id !== 'default' && <Check size={14} color="#fff" style={{zIndex: 2}} />}
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button"
                    className={`delete-on-check-btn ${newTaskDeleteOnCheck ? 'active' : ''}`}
                    onClick={() => setNewTaskDeleteOnCheck(!newTaskDeleteOnCheck)}
                    title="Auto-Deletar ao Concluir"
                  >
                    <Flame size={16} />
                  </button>
                </div>
                
                <div className="add-task-actions">
                  <button type="button" className="btn-small btn-cancel" onClick={() => setIsAdding(false)}>Cancelar</button>
                  <button type="submit" className="btn-small btn-primary">Salvar</button>
                </div>
              </div>
            </motion.form>
          ) : (
            <motion.button 
              key="add-btn"
              className="add-task-btn" 
              onClick={() => setIsAdding(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Plus size={20} /> Adicionar uma tarefa
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TaskItem = ({ 
  task, 
  columnId, 
  allColumns, 
  onToggle, 
  onDelete, 
  onEdit,
  onUpdate,
  onMoveTask,
  onDragStart,
  onDragEnd,
  taskMoveMenuOpen,
  setTaskMoveMenuOpen
}) => {
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editText, setEditText] = useState(task.text);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editText.trim() && editText !== task.text) {
      onEdit(editText.trim());
    } else {
      setEditText(task.text);
    }
    setIsEditingTask(false);
  };

  return (
    <motion.div 
      layout
      className={`task-item task-color-${task.color || 'default'}`}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, filter: 'blur(10px)', x: -20 }}
      transition={{ duration: 0.3 }}
      draggable="true"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      <div style={{ display: 'flex', width: '100%', gap: '14px', alignItems: 'flex-start' }}>
        <div className="task-checkbox-wrapper">
          <input 
            type="checkbox" 
            className="task-checkbox" 
            checked={task.completed}
            onChange={onToggle}
          />
          <Check size={14} className="check-icon" strokeWidth={3} />
        </div>

        <div className="task-content">
          {isEditingTask ? (
            <form onSubmit={handleEditSubmit}>
              <textarea 
                className="task-text-edit" 
                value={editText}
                onChange={(e) => {
                  setEditText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onBlur={handleEditSubmit}
                autoFocus
                rows={2}
              />
            </form>
          ) : (
            <span 
              className={`task-text ${task.completed ? 'completed' : ''}`}
              onDoubleClick={() => setIsEditingTask(true)}
              title="Dê um duplo clique para editar"
            >
              {task.text}
            </span>
          )}
        </div>
        
        <div className="task-actions-menu">
          <button 
            className="icon-btn action-btn move-btn" 
            onClick={() => setTaskMoveMenuOpen(taskMoveMenuOpen === task.id ? null : task.id)}
            title="Opções"
          >
            <MoreVertical size={16} />
          </button>
          <button className="icon-btn action-btn delete-btn" onClick={onDelete} title="Remover tarefa">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {taskMoveMenuOpen === task.id && (
          <motion.div 
            className="move-dropdown-inline"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ width: '100%', overflow: 'hidden' }}
          >
            <div className="move-dropdown-inner" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="color-picker" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {COLORS.map(c => (
                    <div
                      key={c.id}
                      className={`color-swatch ${task.color === c.id ? 'selected' : ''}`}
                      title={c.id}
                      onClick={() => onUpdate({ color: c.id })}
                      style={{ 
                        backgroundColor: c.code,
                        width: '20px', 
                        height: '20px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: task.color === c.id ? '2px solid white' : '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      {task.color === c.id && c.id !== 'default' && <Check size={12} color="#fff" style={{zIndex: 2}} />}
                    </div>
                  ))}
                </div>

                <button 
                  type="button"
                  className={`delete-on-check-btn ${task.deleteOnCheck ? 'active' : ''}`}
                  onClick={() => onUpdate({ deleteOnCheck: !task.deleteOnCheck })}
                  title="Auto-Deletar ao Concluir"
                  style={{ padding: '6px 10px', marginLeft: '12px' }}
                >
                  <Flame size={14} />
                </button>
              </div>

              <div style={{borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0'}}></div>
              <button 
                className="move-dropdown-item"
                onClick={() => {
                  setIsEditingTask(true);
                  setTaskMoveMenuOpen(null);
                }}
                style={{ padding: '4px 8px' }}
              >
                <Edit2 size={14} /> Editar Texto
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TaskOrganizer;
