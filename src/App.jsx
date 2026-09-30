import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import BackdropGlow from './components/BackdropGlow';
import BentoGrid from './components/BentoGrid';
import ThemeToggle from './components/ThemeToggle';
import FeedbackButton from './components/FeedbackButton';

// Lazy Loaded Modules
const QRGenerator = lazy(() => import('./components/QRGenerator'));
const ImageConverter = lazy(() => import('./components/ImageConverter'));
const DownloadAnydesk = lazy(() => import('./components/DownloadAnydesk'));
const StationConfig = lazy(() => import('./components/StationConfig'));
const ServerSwap = lazy(() => import('./components/ServerSwap'));
const DutySchedule = lazy(() => import('./components/DutySchedule'));
const UpdateBoard = lazy(() => import('./components/UpdateBoard'));
const UsefulLinks = lazy(() => import('./components/UsefulLinks'));
const NcmConsult = lazy(() => import('./components/NcmConsult'));
const TaskOrganizer = lazy(() => import('./components/TaskOrganizer'));
const FeedbackBoard = lazy(() => import('./components/FeedbackBoard'));
const TaskNotification = lazy(() => import('./components/TaskNotification'));
const SupportNotification = lazy(() => import('./components/SupportNotification'));
const DevAuthModal = lazy(() => import('./components/DevAuthModal'));
const XmlToDanfe = lazy(() => import('./components/XmlToDanfe'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const DossieFiscal = lazy(() => import('./components/DossieFiscal'));
const RejeicoesNfe = lazy(() => import('./components/RejeicoesNfe'));
const CaseStudies = lazy(() => import('./components/CaseStudies'));
const InfoTributaria = lazy(() => import('./components/InfoTributaria'));
const PlanilhaTributacao = lazy(() => import('./components/PlanilhaTributacao'));
const VersoesSistemas = lazy(() => import('./components/VersoesSistemas'));
const CalculadoraIbsCbs = lazy(() => import('./components/CalculadoraIbsCbs'));
const CalculadoraSped = lazy(() => import('./components/CalculadoraSped'));
const EditorEtiquetas = lazy(() => import('./components/EditorEtiquetas'));
const LeitorXML = lazy(() => import('./components/LeitorXML'));
const ConversorImagens = lazy(() => import('./components/ConversorImagens'));
const GestorSysPDV = lazy(() => import('./components/GestorSysPDV'));
const WelcomeModal = lazy(() => import('./components/WelcomeModal'));
const Glossario = lazy(() => import('./components/Glossario'));
const ControleVersoesClientes = lazy(() => import('./components/ControleVersoesClientes'));
import DevMetricsOverlay from './components/DevMetricsOverlay';
import GlobalSearch from './components/GlobalSearch';
import DashboardSettings from './components/DashboardSettings';
import ThanosEasterEgg from './components/ThanosEasterEgg';
// import Bandeirinhas from './components/Bandeirinhas';
// import Fogueira from './components/Fogueira';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { LayoutDashboard, Save, RotateCcw, BarChart3, MessageSquarePlus, LogOut, Search } from 'lucide-react';
import { usePreferences } from './contexts/PreferencesContext';
import { useAuth } from './contexts/AuthContext';
import AuthScreen from './components/AuthScreen';
import { db } from './firebase';
import { doc, deleteDoc, collection, addDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import './App.css';
import './components/TaskNotification.css';

const AdvancedSuspenseFallback = () => {
  const msRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    const startTime = Date.now();
    let p = 0;
    let rAF;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (msRef.current) msRef.current.innerText = `${elapsed}ms`;
      
      p = p + (99 - p) * 0.01; // slower ease
      if (barRef.current) barRef.current.style.width = `${p}%`;
      
      rAF = requestAnimationFrame(animate);
    };

    rAF = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rAF);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999, backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
      <div style={{ position: 'relative', width: '250px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
        <div ref={barRef} style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '0%', background: '#fbbf24', boxShadow: '0 0 10px #fbbf24' }}></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: '"JetBrains Mono", "Courier New", monospace', fontSize: '13px', color: '#94a3b8' }}>
        <div className="loading-spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #fbbf24', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <span>COMPILANDO E RENDERIZANDO... <span ref={msRef} style={{color: '#fbbf24', fontWeight: 'bold'}}>0ms</span></span>
      </div>
    </div>
  );
};

function App() {
  const { preferences } = usePreferences();
  const { currentUser, userData, logout } = useAuth();
  const [theme, setTheme] = useState('dark');
  const [activeView, setActiveView] = useState(() => localStorage.getItem('lastActiveView') || 'dashboard');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isDevMode, setIsDevMode] = useState(() => localStorage.getItem('isDevMode') === 'true');
  const [showDevModal, setShowDevModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Escuta app_content no Firebase
    const contentRef = doc(db, 'config', 'app_content');
    const unsubscribe = onSnapshot(contentRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const readVersion = localStorage.getItem('readChangelogVersion');
        if (data.changelogVersion && readVersion !== data.changelogVersion) {
          setShowWelcomeModal(true);
        }
      } else {
        // Se nao existir versao, abre se nunca tiver fechado antes (legado)
        const hidden = localStorage.getItem('hideWelcomeModal');
        if (!hidden) setShowWelcomeModal(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-dev-mode', isDevMode);
  }, [theme, isDevMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Usando Ctrl + Alt + D pois navegadores bloqueiam Ctrl + Shift + D
      if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (isDevMode) {
          setIsDevMode(false);
          setIsEditing(false);
          localStorage.removeItem('isDevMode');
        } else {
          setShowDevModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDevMode]);

  const handleDevSuccess = () => {
    setIsDevMode(true);
    localStorage.setItem('isDevMode', 'true');
    setShowDevModal(false);
  };

  const currentViewRef = useRef(null);

  // Active users presence tracking
  useEffect(() => {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const userRef = doc(db, 'active_users', sessionId);

    const pingPresence = async () => {
      try {
        await setDoc(userRef, { lastPing: new Date().getTime() }, { merge: true });
      } catch (e) {
        console.error("Erro ping presence", e);
      }
    };

    pingPresence();
    const interval = setInterval(pingPresence, 60000); // 1 minuto

    const handleUnload = () => {
      deleteDoc(userRef);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      deleteDoc(userRef);
    };
  }, []);

  // Reset scroll position and track view duration
  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('lastActiveView', activeView);
    
    const trackView = async () => {
      // Se tivermos uma view aberta anterior, vamos atualizar a duration dela
      if (currentViewRef.current) {
        const { id, startTime } = currentViewRef.current;
        const duration = Math.round((new Date().getTime() - startTime) / 1000); // em segundos
        try {
          await updateDoc(doc(db, 'analytics_views', id), { duration });
        } catch(e) {}
        currentViewRef.current = null;
      }

      // Rastreamento da nova view
      if (activeView !== 'dashboard' && activeView !== 'analytics') {
        try {
          const docRef = await addDoc(collection(db, 'analytics_views'), {
            view: activeView,
            timestamp: new Date().getTime(),
            duration: 0
          });
          currentViewRef.current = { id: docRef.id, startTime: new Date().getTime() };
        } catch (err) {
          console.error("Erro ao registrar analytics:", err);
        }
      }
    };
    
    trackView();
  }, [activeView]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleToolAction = (actionKey) => {
    const actionMap = {
      'onOpenQR': () => setActiveView('qr'),
      'onOpenImgConv': () => setActiveView('imgConv'),
      'onOpenAnydesk': () => setActiveView('anydesk'),
      'onOpenLinks': () => setActiveView('links'),
      'onOpenStationConfig': () => setActiveView('stationConfig'),
      'onOpenServerSwap': () => setActiveView('serverSwap'),
      'onOpenDutySchedule': () => setActiveView('dutySchedule'),
      'onOpenUpdateBoard': () => setActiveView('updateBoard'),
      'onOpenNcmConsult': () => setActiveView('ncmConsult'),
      'onOpenTaskOrganizer': () => setActiveView('taskOrganizer'),
      'onOpenFeedbackBoard': () => setActiveView('feedbackBoard'),
      'onOpenNfe': () => setActiveView('danfe'),
      'onOpenDossie': () => setActiveView('dossie'),
      'onOpenRejeicoes': () => setActiveView('rejeicoes'),
      'onOpenCaseStudies': () => setActiveView('caseStudies'),
      'onOpenInfoTributaria': () => setActiveView('infoTributaria'),
      'onOpenPlanilhaTributacao': () => setActiveView('planilhaTributacao'),
      'onOpenVersoesSistemas': () => setActiveView('versoesSistemas'),
      'onOpenCalculadoraIbsCbs': () => setActiveView('calculadoraIbsCbs'),
      'onOpenCalculadoraSped': () => setActiveView('calculadoraSped'),
      'onOpenEditorEtiquetas': () => setActiveView('editorEtiquetas'),
      'onOpenLeitorXmlFiscal': () => setActiveView('leitorXmlFiscal'),
      'onOpenConversorImgDoc': () => setActiveView('conversorImgDoc'),
      'onOpenGestorSysPdv': () => setActiveView('gestorSysPdv'),
      'onOpenGlossario': () => setActiveView('glossario'),
      'onOpenControleVersoesClientes': () => setActiveView('controleVersoesClientes')
    };

    if (actionMap[actionKey]) {
      actionMap[actionKey]();
    }
  };

  const toggleEditMode = () => setIsEditing(!isEditing);

  const resetLayout = async () => {
    if(window.confirm('Tem certeza que deseja voltar ao layout original para TODOS os usuários?')) {
      localStorage.removeItem('suporte_dashboard_layout');
      try {
        await deleteDoc(doc(db, 'config', 'dashboard_layout'));
      } catch (err) {
        console.error("Erro ao resetar layout no Firebase", err);
      }
      setResetTrigger(prev => prev + 1);
    }
  };

  if (!currentUser || userData?.status !== 'aprovado') {
    return (
      <MotionConfig reducedMotion={preferences.animationsEnabled ? "never" : "always"}>
        <div className={`spatial-wrapper ${theme} ${!preferences.animationsEnabled ? 'no-animations' : ''}`} data-theme={theme} data-dev-mode={isDevMode}>
          <div className="top-actions no-print">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
          <AuthScreen />
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion={preferences.animationsEnabled ? "never" : "always"}>
      <div className={`spatial-wrapper ${theme} ${!preferences.animationsEnabled ? 'no-animations' : ''}`} data-theme={theme} data-dev-mode={isDevMode}>
        {/* {preferences.showFestaJunina && activeView === 'dashboard' && (
          <>
            <Bandeirinhas />
            <Fogueira />
          </>
        )} */}
        {activeView === 'dashboard' && <DashboardSettings />}
        <div className="top-actions no-print">
          <AnimatePresence>
          {isDevMode && isEditing && (
            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="edit-layout-btn glass-panel" 
              onClick={resetLayout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', color: '#ef4444' }}
            >
              <RotateCcw size={20} className="icon-feedback" style={{ color: '#ef4444' }}/> <span className="feedback-text">Restaurar</span>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDevMode && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="edit-layout-btn glass-panel" 
              style={{ '--hover-color': 'rgba(59, 130, 246, 0.4)', '--hover-shadow': 'rgba(59, 130, 246, 0.2)' }}
              onClick={() => setShowWelcomeModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageSquarePlus size={20} className="icon-feedback" style={{ color: '#3b82f6' }}/> <span className="feedback-text">Boas Vindas</span>
            </motion.button>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isDevMode && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="edit-layout-btn glass-panel" 
              style={{ '--hover-color': 'rgba(245, 158, 11, 0.4)', '--hover-shadow': 'rgba(245, 158, 11, 0.2)' }}
              onClick={() => setActiveView('analytics')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BarChart3 size={20} className="icon-feedback" style={{ color: '#f59e0b' }}/> <span className="feedback-text">Analytics</span>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDevMode && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`edit-layout-btn glass-panel ${isEditing ? 'active' : ''}`} 
              style={{ '--hover-color': isEditing ? 'rgba(16, 185, 129, 0.4)' : 'rgba(168, 85, 247, 0.4)', '--hover-shadow': isEditing ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)' }}
              onClick={toggleEditMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isEditing ? (
                <><Save size={20} className="icon-feedback" style={{ color: '#10b981' }}/> <span className="feedback-text">Salvar</span></>
              ) : (
                <><LayoutDashboard size={20} className="icon-feedback" style={{ color: '#a855f7' }}/> <span className="feedback-text">Editar Layout</span></>
              )}
            </motion.button>
          )}
        </AnimatePresence>


          {preferences.showFeedbackButton && <FeedbackButton theme={theme} />}
          <button className="edit-layout-btn glass-panel" onClick={logout} style={{ marginLeft: '10px', '--hover-color': 'rgba(239, 68, 68, 0.4)', '--hover-shadow': 'rgba(239, 68, 68, 0.2)' }} title="Sair da Conta">
            <LogOut size={20} className="icon-feedback" style={{ color: '#ef4444' }}/>
          </button>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      <div className="no-print">
        <BackdropGlow />
        
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {!isDevMode && preferences.showNotifications && <TaskNotification />}
          
          <AnimatePresence>
            {isDevMode && preferences.showNotifications && <SupportNotification />}
          </AnimatePresence>

          <motion.button 
            className="task-notification-btn"
            onClick={() => setShowWelcomeModal(true)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            style={{ width: 'fit-content', '--hover-color': 'rgba(59, 130, 246, 0.4)' }}
          >
            <MessageSquarePlus size={20} className="icon-feedback" style={{ color: '#3b82f6' }} />
            <span className="feedback-text" style={{ display: 'inline-block' }}>Novidades</span>
          </motion.button>

          <AnimatePresence>
            {activeView !== 'dashboard' && (
              <motion.button 
                key="global-back-btn"
                className="task-notification-btn"
                onClick={() => setActiveView('dashboard')}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: 'fit-content', '--hover-color': 'rgba(239, 68, 68, 0.4)' }}
                title="Voltar ao Dashboard principal"
              >
                <LayoutDashboard size={20} style={{ color: '#ef4444' }} />
                <span className="feedback-text" style={{ display: 'inline-block' }}>Dashboard</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isDevMode && activeView !== 'dashboard' && <DevMetricsOverlay />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showDevModal && (
          <Suspense fallback={null}>
            <DevAuthModal 
              onClose={() => setShowDevModal(false)}
              onSuccess={handleDevSuccess}
            />
          </Suspense>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showWelcomeModal && (
          <Suspense fallback={null}>
            <WelcomeModal 
              isOpen={showWelcomeModal} 
              onClose={() => setShowWelcomeModal(false)}
              isDevMode={isDevMode}
            />
          </Suspense>
        )}
      </AnimatePresence>
      
      <Suspense fallback={<AdvancedSuspenseFallback />}>
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                {/* Advanced Filter Bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Todas', 'Fiscal', 'Infra', 'Gestão', 'Utilitários'].map(cat => (
                      <button 
                        key={cat}
                        className={`task-notification-btn ${activeCategory === cat ? 'active' : ''}`}
                        style={{ 
                          width: 'fit-content', 
                          border: activeCategory === cat ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                          background: activeCategory === cat ? 'rgba(168, 85, 247, 0.1)' : 'rgba(0,0,0,0.3)',
                          color: activeCategory === cat ? '#fff' : '#aaa'
                        }}
                        onClick={() => setActiveCategory(cat)}
                      >
                        <span className="feedback-text" style={{ display: 'inline-block', margin: 0 }}>{cat}</span>
                      </button>
                    ))}
                  </div>

                  <div className="task-notification-btn" style={{ flex: '1', minWidth: '250px', maxWidth: '400px', cursor: 'text', background: 'rgba(0,0,0,0.3)' }}>
                    <Search size={18} style={{ color: '#a855f7' }} />
                    <input 
                      type="text"
                      placeholder="Buscar ferramentas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#fff', 
                        width: '100%', 
                        outline: 'none', 
                        fontSize: '1rem',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>

                <BentoGrid 
                  isEditing={isEditing}
                  isDevMode={isDevMode}
                  activeCategory={activeCategory}
                  searchQuery={searchQuery}
                resetTrigger={resetTrigger}
                onOpenQR={() => setActiveView('qr')} 
                onOpenImgConv={() => setActiveView('imgConv')}
                onOpenAnydesk={() => setActiveView('anydesk')}
                onOpenLinks={() => setActiveView('links')}
                onOpenStationConfig={() => setActiveView('stationConfig')}
                onOpenServerSwap={() => setActiveView('serverSwap')}
                onOpenDutySchedule={() => setActiveView('dutySchedule')}
                onOpenUpdateBoard={() => setActiveView('updateBoard')}
                onOpenNcmConsult={() => setActiveView('ncmConsult')}
                onOpenTaskOrganizer={() => setActiveView('taskOrganizer')}
                onOpenFeedbackBoard={() => setActiveView('feedbackBoard')}
                onOpenNfe={() => setActiveView('danfe')}
                onOpenDossie={() => setActiveView('dossie')}
                onOpenRejeicoes={() => setActiveView('rejeicoes')}
                onOpenCaseStudies={() => setActiveView('caseStudies')}
                onOpenInfoTributaria={() => setActiveView('infoTributaria')}
                onOpenPlanilhaTributacao={() => setActiveView('planilhaTributacao')}
                onOpenVersoesSistemas={() => setActiveView('versoesSistemas')}
                onOpenCalculadoraIbsCbs={() => setActiveView('calculadoraIbsCbs')}
                onOpenCalculadoraSped={() => setActiveView('calculadoraSped')}
                onOpenEditorEtiquetas={() => setActiveView('editorEtiquetas')}
                onOpenLeitorXmlFiscal={() => setActiveView('leitorXmlFiscal')}
                onOpenConversorImgDoc={() => setActiveView('conversorImgDoc')}
                onOpenGestorSysPdv={() => setActiveView('gestorSysPdv')}
                onOpenGlossario={() => setActiveView('glossario')}
                onOpenControleVersoesClientes={() => setActiveView('controleVersoesClientes')}
              />
              </div>
            </motion.div>
          ) : activeView === 'qr' ? (
            <QRGenerator key="qr" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'imgConv' ? (
            <ImageConverter key="imgConv" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'anydesk' ? (
            <DownloadAnydesk key="anydesk" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'links' ? (
            <UsefulLinks key="links" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'stationConfig' ? (
            <StationConfig key="stationConfig" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'serverSwap' ? (
            <ServerSwap key="serverSwap" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'dutySchedule' ? (
            <DutySchedule key="dutySchedule" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'updateBoard' ? (
            <UpdateBoard key="updateBoard" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'ncmConsult' ? (
            <NcmConsult key="ncmConsult" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'taskOrganizer' ? (
            <TaskOrganizer key="taskOrganizer" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'feedbackBoard' ? (
            <FeedbackBoard key="feedbackBoard" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'danfe' ? (
            <XmlToDanfe key="danfe" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'analytics' ? (
            <AnalyticsDashboard key="analytics" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'dossie' ? (
            <DossieFiscal key="dossie" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'rejeicoes' ? (
            <RejeicoesNfe key="rejeicoes" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'caseStudies' ? (
            <CaseStudies key="caseStudies" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'infoTributaria' ? (
            <InfoTributaria key="infoTributaria" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'planilhaTributacao' ? (
            <PlanilhaTributacao key="planilhaTributacao" onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'versoesSistemas' ? (
            <VersoesSistemas key="versoesSistemas" onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'calculadoraIbsCbs' ? (
            <CalculadoraIbsCbs key="calculadoraIbsCbs" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'calculadoraSped' ? (
            <CalculadoraSped key="calculadoraSped" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'editorEtiquetas' ? (
            <EditorEtiquetas key="editorEtiquetas" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'leitorXmlFiscal' ? (
            <LeitorXML key="leitorXmlFiscal" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'conversorImgDoc' ? (
            <ConversorImagens key="conversorImgDoc" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'gestorSysPdv' ? (
            <GestorSysPDV key="gestorSysPdv" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'glossario' ? (
            <Glossario key="glossario" theme={theme} onBack={() => setActiveView('dashboard')} />
          ) : activeView === 'controleVersoesClientes' ? (
            <ControleVersoesClientes key="controleVersoesClientes" onBack={() => setActiveView('dashboard')} />
          ) : null}
        </AnimatePresence>
      </Suspense>
      
      <ThanosEasterEgg />
    </div>
    </MotionConfig>
  );
}

export default App;
