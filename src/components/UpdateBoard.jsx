import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LayoutDashboard, Plus, Trash2, CheckCircle2, FileClock } from 'lucide-react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './UpdateBoard.css';

const STATUS_OPTIONS = [
  "Aguardando",
  "Em andamento",
  "Pendente Cliente",
  "Urgente"
];

const UpdateBoard = ({ onBack, theme }) => {
  const [activeTab, setActiveTab] = useState('ativos');
  const [form, setForm] = useState({ 
    osNumber: '', 
    company: '', 
    analyst: '',
    status: 'Aguardando'
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    const collRef = collection(db, 'updateBoard');
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by creation time string ideally, or just reverse so newest is first
      // Assuming IDs are generated roughly chronologically, or we can sort later
      setItems(data.reverse());
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    if(!form.osNumber || !form.company || !form.analyst) {
      alert("Preencha O.S, Empresa e Analista.");
      return;
    }
    
    const now = new Date();
    await addDoc(collection(db, 'updateBoard'), {
      osNumber: form.osNumber,
      company: form.company,
      analyst: form.analyst,
      status: form.status,
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      obs: '',
      done: false
    });

    setForm({ ...form, osNumber: '', company: '' }); 
    setActiveTab('ativos');
  };

  const handleDelete = async (id) => {
    if(window.confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) {
      await deleteDoc(doc(db, 'updateBoard', id));
    }
  };

  const handleMarkDone = async (id) => {
    await updateDoc(doc(db, 'updateBoard', id), { done: true });
  };

  const handleRestore = async (id) => {
    await updateDoc(doc(db, 'updateBoard', id), { done: false });
  };

  const updateObs = async (id, newObs) => {
    // Optimistic UI update manually if needed, but onSnapshot handles it. 
    // Wait, typing in textarea might be laggy if we rely purely on onSnapshot for every keystroke.
    // It's better to update local state first for smooth typing.
    setItems(prev => prev.map(item => item.id === id ? { ...item, obs: newObs } : item));
    await updateDoc(doc(db, 'updateBoard', id), { obs: newObs });
  };

  const updateStatus = async (id, newStatus) => {
    await updateDoc(doc(db, 'updateBoard', id), { status: newStatus });
  };

  const ativos = items.filter(i => !i.done);
  const finalizados = items.filter(i => i.done);

  return (
    <motion.div 
      className="update-board-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'ativos' ? 'active' : ''}`}
          onClick={() => setActiveTab('ativos')}
        >
          <FileClock size={18} /> Quadro Ativo ({ativos.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'finalizados' ? 'active' : ''}`}
          onClick={() => setActiveTab('finalizados')}
        >
          <CheckCircle2 size={18} /> Finalizadas ({finalizados.length})
        </button>
      </div>

      <div className="board-wrapper">
        <div className="board-header">
          <h1><LayoutDashboard className="icon" size={28} /> Quadro de Atualizações</h1>
          <p>Acompanhamento de Ordens de Serviço (Sincronizado na Nuvem)</p>
        </div>

        {activeTab === 'ativos' && (
          <div className="add-os-form">
            <div className="input-group" style={{ maxWidth: '90px' }}>
              <label>N° O.S</label>
              <input 
                type="number" 
                placeholder="Ex: 5698" 
                value={form.osNumber}
                onChange={e => setForm({...form, osNumber: e.target.value})}
              />
            </div>
            <div className="input-group" style={{ flex: 2 }}>
              <label>Cliente</label>
              <input 
                type="text" 
                placeholder="Nome / Empresa" 
                value={form.company}
                onChange={e => setForm({...form, company: e.target.value})}
              />
            </div>
            <div className="input-group" style={{ flex: 1.5 }}>
              <label>Analista</label>
              <input 
                type="text" 
                placeholder="Suporte Stor" 
                value={form.analyst}
                onChange={e => setForm({...form, analyst: e.target.value})}
              />
            </div>
            <div className="input-group" style={{ minWidth: '150px' }}>
              <label>Situação</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>&nbsp;</label>
              <button className="btn-primary" onClick={handleAdd} disabled={!form.osNumber || !form.company || !form.analyst} style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={18} /> Adicionar O.S
              </button>
            </div>
          </div>
        )}

        <div className="os-grid">
          <AnimatePresence>
            {(activeTab === 'ativos' ? ativos : finalizados).map(item => (
              <motion.div 
                key={item.id}
                className={`os-card ${item.done ? 'done' : ''} status-${item.status?.toLowerCase().replace(/ /g, '-')}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <div className="os-header">
                  <h3>{item.company}</h3>
                  <div className={`os-badge ${item.done ? 'done' : ''} badge-${item.status?.toLowerCase().replace(/ /g, '-')}`}>
                    {item.done ? 'Finalizado' : item.status}
                  </div>
                </div>

                <div className="os-info">
                  <div><strong>O.S:</strong> {item.osNumber}</div>
                  <div><strong>Analista:</strong> {item.analyst || 'N/I'}</div>
                  <div><strong>Abertura:</strong> {item.date} às {item.time || '00:00'}</div>
                </div>

                {!item.done && (
                  <div className="os-status-update">
                    <label>Atualizar Situação:</label>
                    <select 
                      value={item.status} 
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}

                <div className="os-obs" style={{ marginTop: item.done ? '8px' : '0' }}>
                  <textarea 
                    placeholder="Adicione observações de rotina aqui..."
                    value={item.obs}
                    onChange={(e) => updateObs(item.id, e.target.value)}
                    disabled={item.done}
                  />
                </div>

                <div className="os-actions">
                  <button className="btn-icon-text danger" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} /> Excluir
                  </button>
                  {!item.done ? (
                    <button className="btn-icon-text success" onClick={() => handleMarkDone(item.id)}>
                      <CheckCircle2 size={16} /> O.S Concluída
                    </button>
                  ) : (
                    <button className="btn-icon-text" onClick={() => handleRestore(item.id)}>
                      <FileClock size={16} /> Restaurar
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {(activeTab === 'ativos' ? ativos : finalizados).length === 0 && (
            <div className="empty-state">
              <LayoutDashboard size={48} opacity={0.5} style={{ margin: '0 auto 16px' }} />
              <p>Nenhuma ordem de serviço {activeTab === 'ativos' ? 'ativa' : 'finalizada'} na nuvem.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UpdateBoard;
