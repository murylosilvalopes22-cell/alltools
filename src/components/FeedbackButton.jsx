import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, Loader2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './FeedbackButton.css';

const MODULES = [
  "Dashboard (Geral)",
  "Consulta NCM",
  "Gerador QR",
  "Conversor Imagem",
  "Download AnyDesk",
  "Links Úteis",
  "Configuração de Estação",
  "Troca de Servidor",
  "Escala de Plantão",
  "Organizador Tarefas",
  "Quadro de Atualizações",
  "Outro"
];

const FeedbackButton = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    modulo: 'Dashboard (Geral)',
    outroModulo: '',
    tipo: 'Sugestão de Melhoria',
    observacoes: '',
    solicitante: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.solicitante.trim()) {
      alert("Por favor, preencha o seu nome (solicitante).");
      return;
    }
    if (!formData.observacoes.trim()) {
      alert("Por favor, preencha o campo de observações.");
      return;
    }

    setIsSubmitting(true);

    const recordData = {
      solicitante: formData.solicitante,
      modulo: formData.modulo === 'Outro' ? formData.outroModulo : formData.modulo,
      tipo: formData.tipo,
      observacoes_usuario: formData.observacoes,
      status: 'Novas',
      observacoes_admin: '',
      data_criacao: Date.now(),
      data_conclusao: null
    };

    try {
      await addDoc(collection(db, 'solicitacoes'), recordData);
      // "no-cors" doesn't return readable response so we assume success if no error is thrown
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setFormData({
          modulo: 'Dashboard (Geral)',
          outroModulo: '',
          tipo: 'Sugestão de Melhoria',
          observacoes: '',
          solicitante: ''
        });
      }, 2000);
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.button 
        className="feedback-btn-orb glass-panel"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Abrir Solicitação/Melhoria"
      >
        <MessageSquarePlus size={20} className="icon-feedback" />
        <span className="feedback-text">Solicitações</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="feedback-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setIsOpen(false)}
          >
            <motion.div 
              className="feedback-modal glass-panel"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="feedback-modal-header">
                <h2>Abrir Solicitação</h2>
                <button className="close-btn" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                  <X size={24} />
                </button>
              </div>

              {isSuccess ? (
                <div className="feedback-success">
                  <div className="success-icon-wrapper">
                    <Send size={48} className="success-icon" />
                  </div>
                  <h3>Solicitação Enviada!</h3>
                  <p>Obrigado por ajudar a melhorar nossas ferramentas.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="feedback-form">
                  <div className="form-row">
                    <div className="input-group">
                      <label>Seu Nome</label>
                      <input 
                        type="text" 
                        name="solicitante" 
                        value={formData.solicitante} 
                        onChange={handleChange} 
                        placeholder="Ex: João Silva"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Tipo de Solicitação</label>
                      <select name="tipo" value={formData.tipo} onChange={handleChange} disabled={isSubmitting}>
                        <option value="Sugestão de Melhoria">Sugestão de Melhoria</option>
                        <option value="Nova Funcionalidade">Nova Funcionalidade</option>
                        <option value="Bug / Erro">Bug / Erro</option>
                        <option value="Dúvida / Outro">Dúvida / Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label>Módulo</label>
                      <select name="modulo" value={formData.modulo} onChange={handleChange} disabled={isSubmitting}>
                        {MODULES.map(mod => (
                          <option key={mod} value={mod}>{mod}</option>
                        ))}
                      </select>
                    </div>

                    {formData.modulo === 'Outro' && (
                      <div className="input-group">
                        <label>Qual Módulo?</label>
                        <input 
                          type="text" 
                          name="outroModulo" 
                          value={formData.outroModulo} 
                          onChange={handleChange} 
                          placeholder="Digite o nome..."
                          disabled={isSubmitting}
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Observações</label>
                    <textarea 
                      name="observacoes" 
                      value={formData.observacoes} 
                      onChange={handleChange} 
                      placeholder="Descreva sua solicitação com detalhes..."
                      rows="4"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <button type="submit" className="feedback-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 size={18} className="spin-icon" /> Enviando...</>
                    ) : (
                      <><Send size={18} /> Enviar Solicitação</>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackButton;
