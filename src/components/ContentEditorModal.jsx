import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileEdit, Rocket } from 'lucide-react';
import './ContentEditorModal.css';

const ContentEditorModal = ({ isOpen, onClose, onSave, initialData }) => {
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

  const insertFormatting = (fieldName, startTag, endTag) => {
    const textarea = document.getElementsByName(fieldName)[0];
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = formData[fieldName] || '';
    
    const newVal = currentVal.substring(0, start) + startTag + currentVal.substring(start, end) + endTag + currentVal.substring(end);
    
    setFormData(prev => ({ ...prev, [fieldName]: newVal }));
    setIsDirty(true);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + startTag.length, end + startTag.length);
    }, 10);
  };

  const handleCloseRequest = () => {
    if (isDirty) {
      if (!window.confirm("Você tem alterações não salvas. Tem certeza que deseja fechar?")) {
        return;
      }
    }
    onClose();
  };

  const handleSubmit = (e, sendToScreen = false) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (sendToScreen) {
      finalData.changelogVersion = Date.now().toString();
    }
    onSave(finalData);
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
              <h2><FileEdit size={24} color="#a855f7" /> Editar Changelog</h2>
              <button className="btn-close" onClick={handleCloseRequest}><X size={20}/></button>
            </div>

            <form className="content-editor-body custom-scrollbar">
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
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Itens do Changelog
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => insertFormatting('welcomeChangelogItems', '<strong>', '</strong>')} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer' }}><strong>B</strong></button>
                        <button type="button" onClick={() => insertFormatting('welcomeChangelogItems', '<em>', '</em>')} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer' }}><em>I</em></button>
                        <button type="button" onClick={() => insertFormatting('welcomeChangelogItems', '<li>', '</li>\n')} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer' }}>• Lista</button>
                      </div>
                    </label>
                    <textarea 
                      name="welcomeChangelogItems" 
                      value={formData.welcomeChangelogItems || ''} 
                      onChange={handleChange} 
                      rows={6}
                      placeholder="<li>Item 1...</li>\n<li>Item 2...</li>"
                      required
                      style={{ marginTop: '8px' }}
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
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Itens de Patches (Opcional)
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => insertFormatting('welcomePatchesItems', '<strong>', '</strong>')} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer' }}><strong>B</strong></button>
                        <button type="button" onClick={() => insertFormatting('welcomePatchesItems', '<li>', '</li>\n')} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer' }}>• Lista</button>
                      </div>
                    </label>
                    <textarea 
                      name="welcomePatchesItems" 
                      value={formData.welcomePatchesItems || ''} 
                      onChange={handleChange} 
                      rows={4}
                      placeholder="<li>Patch 1...</li>"
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                </>

              <div className="content-editor-footer" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn-cancel" onClick={handleCloseRequest}>Cancelar</button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-save" style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc', border: '1px solid rgba(255,255,255,0.2)' }} onClick={(e) => handleSubmit(e, false)}>
                    <Save size={18}/> Salvar Silencioso
                  </button>
                  <button type="button" className="btn-save" onClick={(e) => handleSubmit(e, true)}>
                    <Rocket size={18}/> Enviar p/ Tela
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContentEditorModal;
