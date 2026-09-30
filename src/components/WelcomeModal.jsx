import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Rocket, Info, Wrench, ShieldCheck, Activity, CheckCircle2, AlertTriangle, FileEdit } from 'lucide-react';
import { AVAILABLE_TOOLS } from '../data/toolsList';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import ContentEditorModal from './ContentEditorModal';
import './WelcomeModal.css';

const WelcomeModal = ({ isOpen, onClose, isDevMode }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [appContent, setAppContent] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const contentRef = doc(db, 'config', 'app_content');
    const unsubscribe = onSnapshot(contentRef, (docSnap) => {
      if (docSnap.exists()) {
        setAppContent(docSnap.data());
      } else {
        // Fallback default
        setAppContent({
          buildVersion: 'Build 23/05/2026',
          heroDesc: 'Melhorias Gerais: Melhorado o layout do <strong>Dossiê Fiscal</strong> e adicionado a pesquisa de <strong>Rejeições NF-e</strong> com artigos da TecnoSpeed. O Leitor agora também suporta <strong>NFC-e (Modelo 65)</strong>. Lançado o <strong>Banco de Ideias</strong> para sugerir melhorias de módulos!',
          heroHighlight: 'O sistema agora salva automaticamente qual ferramenta você estava usando (Persistência de Abas). Se você fechar a página ou atualizar, ele voltará exatamente de onde parou!',
          welcomeChangelogTitle: 'Changelog (23/05 - 27/05)',
          welcomeChangelogItems: '<li><strong>Novo Botão de Pesquisa:</strong> Encontre as ferramentas rapidamente através da nova lupa de pesquisa no topo.</li>\n<li><strong>Configurações Globais:</strong> Novo botão de engrenagem no topo do site, onde dá para remover animações, ocultar o Update Notes (Hero Banner) e desativar notificações.</li>\n<li><strong>Gestor E SysPDV (NOVA):</strong> Ferramenta para gerenciar a instalação e configuração de PDVs em ambiente pós-formatação.</li>\n<li><strong>Leitor XML (NOVA):</strong> Lê e consolida automaticamente XMLs de notas fiscais, separando por CFOP e Alíquotas para fácil auditoria.</li>\n<li><strong>Conversor Imagens (NOVA):</strong> Transforme fotos de comprovantes em PDF ou documentos do Word rapidamente.</li>\n<li><strong>Editor de Etiquetas (NOVA):</strong> Crie etiquetas com visual estilo FastReport, facilitando a formatação e impressão para balanças e produtos.</li>',
          welcomePatchesTitle: '',
          welcomePatchesItems: ''
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveChangelog = async (formData) => {
    try {
      const contentRef = doc(db, 'config', 'app_content');
      await setDoc(contentRef, formData, { merge: true });
      setShowEditor(false);
    } catch (err) {
      console.error("Erro ao salvar changelog:", err);
    }
  };

  const handleClose = () => {
    if (appContent?.changelogVersion) {
      localStorage.setItem('readChangelogVersion', appContent.changelogVersion);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div 
            className="welcome-modal glass-panel"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '600px' }}
          >
            <div className="welcome-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', margin: 0 }}>
                <Rocket className="icon-sparkles" size={28} style={{ color: '#a855f7' }} /> 
                {appContent?.welcomeChangelogTitle || 'Novidades da Plataforma'}
              </h1>
              {isDevMode && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowEditor(true); }}
                  style={{ background: 'transparent', border: 'none', color: '#a855f7', cursor: 'pointer', marginLeft: 'auto', marginRight: '16px' }}
                  title="Editar Changelog"
                >
                  <FileEdit size={20} />
                </button>
              )}
              <button className="welcome-close" onClick={handleClose}>
                <X size={24} />
              </button>
            </div>

            <div className="welcome-body custom-scrollbar" style={{ padding: '0 20px', maxHeight: '60vh' }}>
              <div className="welcome-section" style={{ border: 'none', padding: 0, background: 'transparent' }}>
                <div className="welcome-changelog">
                  <p style={{ color: '#a855f7' }}><strong>O que há de novo:</strong></p>
                  <ul dangerouslySetInnerHTML={{ __html: appContent?.welcomeChangelogItems || '' }}>
                  </ul>
                </div>
              </div>

              {appContent?.welcomePatchesTitle && appContent?.welcomePatchesItems && (
                <div className="welcome-section" style={{ border: 'none', padding: 0, background: 'transparent', marginTop: '16px' }}>
                  <h2 style={{ fontSize: '1.2rem', margin: '0 0 12px 0' }}><Wrench size={20} /> {appContent.welcomePatchesTitle}</h2>
                  <div className="welcome-changelog" style={{ borderLeftColor: '#8b5cf6', background: 'rgba(139, 92, 246, 0.05)' }}>
                    <ul dangerouslySetInnerHTML={{ __html: appContent.welcomePatchesItems }}>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="welcome-footer" style={{ justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '16px' }}>
              <button className="btn-primary" onClick={handleClose} style={{ width: '100%', maxWidth: '300px', display: 'flex', justifyContent: 'center' }}>
                <CheckCircle2 size={20} /> LIDO
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showEditor && (
        <ContentEditorModal
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          onSave={handleSaveChangelog}
          type="changelog"
          initialData={appContent}
        />
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
