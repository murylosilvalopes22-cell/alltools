import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageSquarePlus, Trash2, ArrowRight, ArrowLeft as ArrowLeftIcon, CheckCircle2, Check, Clock } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './FeedbackBoard.css';

const FeedbackBoard = ({ onBack, theme }) => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [adminObs, setAdminObs] = useState({});

  useEffect(() => {
    const collRef = collection(db, 'solicitacoes');
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by creation date descending
      data.sort((a, b) => (b.data_criacao || 0) - (a.data_criacao || 0));
      setSolicitacoes(data);
    });

    return () => unsubscribe();
  }, []);

  const moveStatus = async (id, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'Finalizadas') {
        updates.data_conclusao = Date.now();
        updates.observacoes_admin = adminObs[id] || '';
      } else {
        updates.data_conclusao = null;
      }
      await updateDoc(doc(db, 'solicitacoes', id), updates);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta solicitação permanentemente?")) {
      await deleteDoc(doc(db, 'solicitacoes', id));
    }
  };

  const handleObsChange = (id, value) => {
    setAdminObs(prev => ({ ...prev, [id]: value }));
  };

  const renderCard = (sol, currentStatus) => {
    const isFinalizando = currentStatus === 'Testes'; // About to move to Finalizadas
    
    return (
      <motion.div 
        key={sol.id}
        className="solicitacao-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        layout
      >
        <div className="sol-header">
          <div className="sol-modulo">
            {sol.modulo}
            {sol.solicitante && <span style={{ fontSize: '0.85em', opacity: 0.8, marginLeft: '6px' }}>({sol.solicitante})</span>}
          </div>
          <div className={`sol-tipo ${sol.tipo?.toLowerCase().includes('bug') ? 'bug' : sol.tipo?.toLowerCase().includes('sugest') ? 'sugestao' : 'duvida'}`}>
            {sol.tipo}
          </div>
        </div>

        <div className="sol-body">
          {sol.observacoes_usuario}
        </div>

        {currentStatus === 'Finalizadas' && sol.observacoes_admin && (
          <div className="sol-admin-obs">
            <strong>Resposta do Admin:</strong><br/>
            {sol.observacoes_admin}
          </div>
        )}

        {isFinalizando && (
          <div className="sol-admin-obs">
            <strong>Adicionar Resolução (Opcional):</strong>
            <textarea 
              placeholder="O que foi feito?..."
              value={adminObs[sol.id] || ''}
              onChange={(e) => handleObsChange(sol.id, e.target.value)}
            />
          </div>
        )}

        <div className="sol-footer">
          <div className="sol-date">
            <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
            {new Date(sol.data_criacao).toLocaleDateString('pt-BR')} 
            {sol.data_conclusao && ` • Concluído em ${new Date(sol.data_conclusao).toLocaleDateString('pt-BR')}`}
          </div>
          <div className="sol-actions">
            <button className="danger" onClick={() => handleDelete(sol.id)} title="Excluir">
              <Trash2 size={16} />
            </button>

            {currentStatus === 'Finalizadas' && (
              <button onClick={() => moveStatus(sol.id, 'Testes')} title="Voltar para Testes">
                <ArrowLeftIcon size={16} />
              </button>
            )}

            {currentStatus === 'Testes' && (
              <>
                <button onClick={() => moveStatus(sol.id, 'Novas')} title="Voltar para Novas">
                  <ArrowLeftIcon size={16} />
                </button>
                <button className="success" onClick={() => moveStatus(sol.id, 'Finalizadas')} title="Finalizar Solicitação">
                  <Check size={16} />
                </button>
              </>
            )}

            {currentStatus === 'Novas' && (
              <button onClick={() => moveStatus(sol.id, 'Testes')} title="Mover para Testes">
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const novas = solicitacoes.filter(s => s.status === 'Novas');
  const testes = solicitacoes.filter(s => s.status === 'Testes');
  const finalizadas = solicitacoes.filter(s => s.status === 'Finalizadas');

  return (
    <motion.div 
      className="feedback-board-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="board-header" style={{ padding: 0, background: 'none', border: 'none', marginBottom: '12px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem' }}>
          <MessageSquarePlus className="icon" size={28} color="var(--primary)" /> 
          Painel de Solicitações
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gerencie feedbacks, bugs e sugestões da equipe.</p>
      </div>

      <div className="kanban-grid">
        {/* Coluna Novas */}
        <div className="kanban-column">
          <div className="kanban-col-header novas">
            Novas <span className="kanban-badge">{novas.length}</span>
          </div>
          <div className="kanban-items">
            <AnimatePresence>
              {novas.map(sol => renderCard(sol, 'Novas'))}
            </AnimatePresence>
          </div>
        </div>

        {/* Coluna Testes */}
        <div className="kanban-column">
          <div className="kanban-col-header testes">
            Em Teste / Análise <span className="kanban-badge">{testes.length}</span>
          </div>
          <div className="kanban-items">
            <AnimatePresence>
              {testes.map(sol => renderCard(sol, 'Testes'))}
            </AnimatePresence>
          </div>
        </div>

        {/* Coluna Finalizadas */}
        <div className="kanban-column">
          <div className="kanban-col-header finalizadas">
            Finalizadas <span className="kanban-badge">{finalizadas.length}</span>
          </div>
          <div className="kanban-items">
            <AnimatePresence>
              {finalizadas.map(sol => renderCard(sol, 'Finalizadas'))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FeedbackBoard;
