import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileEdit } from 'lucide-react';
import './ContentEditorModal.css';

const ContentEditorModal = ({ isOpen, onClose, onSave, type, initialData }) => {
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setIsDirty(false);
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleCloseRequest = () => {
    if (isDirty) {
      if (!window.confirm("Você tem alterações não salvas. Tem certeza que deseja fechar?")) {
        return;
      }
    }
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setIsDirty(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="content-editor-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="content-editor-modal glass-panel"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="content-editor-header">
              <h2><FileEdit size={24} color="#a855f7" /> Editar {type === 'hero' ? 'Update Notes' : 'Changelog'}</h2>
              <button className="btn-close" onClick={handleCloseRequest}><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="content-editor-body custom-scrollbar">
              {type === 'hero' && (
                <>
                  <div className="form-group">
                    <label>Versão da Build</label>
                    <input 
                      type="text" 
                      name="buildVersion" 
                      value={formData.buildVersion || ''} 
                      onChange={handleChange} 
                      placeholder="Ex: Build 23/05/2026"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Descrição Geral (Aceita tags HTML como &lt;strong&gt;)</label>
                    <textarea 
                      name="heroDesc" 
                      value={formData.heroDesc || ''} 
                      onChange={handleChange} 
                      rows={5}
                      placeholder="Resumo das melhorias principais..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Destaque (Exemplo na caixa de destaque)</label>
                    <textarea 
                      name="heroHighlight" 
                      value={formData.heroHighlight || ''} 
                      onChange={handleChange} 
                      rows={4}
                      placeholder="Texto da caixa de exemplo..."
                      required
                    />
                  </div>
                </>
              )}

              {type === 'changelog' && (
                <>
                  <div className="form-group">
                    <label>Título do Changelog</label>
                    <input 
                      type="text" 
                      name="welcomeChangelogTitle" 
                      value={formData.welcomeChangelogTitle || ''} 
                      onChange={handleChange} 
                      placeholder="Ex: Changelog (23/05 - 27/05)"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Itens do Changelog (Um por linha. Aceita tags HTML como &lt;strong&gt;)</label>
                    <textarea 
                      name="welcomeChangelogItems" 
                      value={formData.welcomeChangelogItems || ''} 
                      onChange={handleChange} 
                      rows={6}
                      placeholder="Item 1...\nItem 2...\nItem 3..."
                      required
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Título de Patches (Opcional)</label>
                    <input 
                      type="text" 
                      name="welcomePatchesTitle" 
                      value={formData.welcomePatchesTitle || ''} 
                      onChange={handleChange} 
                      placeholder="Ex: Patches e Correções Rápidas"
                    />
                  </div>
                  <div className="form-group">
                    <label>Itens de Patches (Opcional. Um por linha. Aceita HTML)</label>
                    <textarea 
                      name="welcomePatchesItems" 
                      value={formData.welcomePatchesItems || ''} 
                      onChange={handleChange} 
                      rows={4}
                      placeholder="Patch 1...\nPatch 2..."
                    />
                  </div>
                </>
              )}

              <div className="content-editor-footer">
                <button type="button" className="btn-cancel" onClick={handleCloseRequest}>Cancelar</button>
                <button type="submit" className="btn-save"><Save size={18}/> Salvar Alterações</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContentEditorModal;
