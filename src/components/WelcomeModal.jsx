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
    if (dontShowAgain) {
      localStorage.setItem('hideWelcomeModal', 'true');
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
          >
            <div className="welcome-header">
              <h1><Sparkles className="icon-sparkles" size={32} /> Bem-vindo à Central Stor!</h1>
              <p>Sua nova plataforma inteligente de ferramentas de suporte e implantação.</p>
              <button className="welcome-close" onClick={handleClose}>
                <X size={24} />
              </button>
            </div>

            <div className="welcome-body custom-scrollbar">
              
              <div className="welcome-section">
                <h2><Info size={24} /> O que é o site?</h2>
                <p>O <strong>Aplicações Suporte Stor</strong> é uma central web unificada desenvolvida para simplificar a sua rotina técnica. Em vez de depender de vários programas espalhados, scripts manuais ou planilhas desatualizadas, você tem tudo em um único painel moderno, rápido e acessível de qualquer lugar. Cuidamos do trabalho chato para você focar no que importa!</p>
              </div>

              <div className="welcome-section">
                <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Rocket size={24} /> {appContent?.welcomeChangelogTitle || 'Changelog'}
                  </span>
                  {isDevMode && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowEditor(true); }}
                      style={{ background: 'transparent', border: 'none', color: '#a855f7', cursor: 'pointer' }}
                      title="Editar Changelog"
                    >
                      <FileEdit size={20} />
                    </button>
                  )}
                </h2>
                <div className="welcome-changelog">
                  <p><strong>Novas funcionalidades e ferramentas adicionadas:</strong></p>
                  <ul dangerouslySetInnerHTML={{ __html: appContent?.welcomeChangelogItems || '' }}>
                  </ul>
                </div>
              </div>

              {appContent?.welcomePatchesTitle && appContent?.welcomePatchesItems && (
                <div className="welcome-section">
                  <h2><Wrench size={24} /> {appContent.welcomePatchesTitle}</h2>
                  <div className="welcome-changelog" style={{ borderLeftColor: '#8b5cf6', background: 'rgba(139, 92, 246, 0.05)' }}>
                    <ul dangerouslySetInnerHTML={{ __html: appContent.welcomePatchesItems }}>
                    </ul>
                  </div>
                </div>
              )}

              <div className="welcome-section">
                <h2><Activity size={24} /> Como funcionam os Status?</h2>
                <div className="welcome-status-list">
                  <div className="welcome-status-item" style={{ borderLeft: '4px solid #10b981' }}>
                    <ShieldCheck size={24} color="#10b981" />
                    <div>
                      <strong style={{ color: '#10b981', display: 'block', fontSize: '1.1rem' }}>Ativo</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Validada, estável e testada para o dia a dia.</span>
                    </div>
                  </div>
                  <div className="welcome-status-item" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <Wrench size={24} color="#f59e0b" />
                    <div>
                      <strong style={{ color: '#f59e0b', display: 'block', fontSize: '1.1rem' }}>Em Testes</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Beta experimental. Sujeita a instabilidades.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="welcome-section">
                <h2><AlertTriangle size={24} color="#f59e0b" /> Testes e Solicitações</h2>
                <div className="welcome-changelog" style={{ borderLeftColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
                  <p style={{ margin: 0, paddingBottom: '8px' }}>Nem todas as ferramentas foram testadas ao limite. É de <strong>suma importância</strong> testá-las e validá-las no seu dia a dia.</p>
                  <p style={{ margin: 0 }}>Caso encontre algum erro, bug, ou tenha uma nova ideia brilhante de ferramenta ou melhoria, utilize o <strong>Botão de Solicitações</strong> encontrado no canto superior direito do site para abrir um chamado. Ele sempre estará ativo de qualquer ferramenta (a não ser que você o oculte nas configurações do site). É assim que vamos melhorar a nossa Central cada vez mais!</p>
                </div>
              </div>

              <div className="welcome-section">
                <h2><Wrench size={24} /> Todas as Ferramentas</h2>
                <div className="welcome-tools-grid">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <div className="welcome-tool-card" key={tool.id}>
                      <h3>{tool.title}</h3>
                      <p>{tool.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="credits-footer" style={{ padding: '20px 0 0', marginTop: '20px' }}>
                <div className="credit-item">
                  Desenvolvido por <span className="highlight-olyrum">Olyrum (Murylo)</span>
                </div>
                <div className="credit-separator">•</div>
                <div className="credit-item">
                  Powered by <span className="highlight-gemini">Gemini</span> 
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C12 0 14.5 9.5 24 12C24 12 14.5 14.5 12 24C12 24 9.5 14.5 0 12C0 12 9.5 9.5 12 0Z" fill="url(#gemini-gradient)"/>
                    <defs>
                      <linearGradient id="gemini-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4F8BFF" />
                        <stop offset="0.5" stopColor="#A75FFF" />
                        <stop offset="1" stopColor="#FF6B6B" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

            </div>

            <div className="welcome-footer">
              <motion.div 
                className={`custom-green-checkbox ${dontShowAgain ? 'checked' : ''}`}
                onClick={() => setDontShowAgain(!dontShowAgain)}
                whileTap={{ scale: 0.92 }}
              >
                <div className="checkbox-box">
                  <AnimatePresence>
                    {dontShowAgain && (
                      <motion.svg
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
                <span>Não exibir este aviso novamente</span>
              </motion.div>
              <button className="btn-primary" onClick={handleClose}>
                <CheckCircle2 size={20} /> Entendido, vamos lá!
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
