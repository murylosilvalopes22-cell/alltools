import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Loader2, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import './AuthScreen.css';

// Componente do Olho Animado que segue o mouse
const AnimatedEyeIcon = ({ isVisible, mouseX, mouseY }) => {
  const eyeRef = useRef(null);
  const [eyeCenter, setEyeCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateCenter = () => {
      if (eyeRef.current) {
        const rect = eyeRef.current.getBoundingClientRect();
        setEyeCenter({ 
          x: rect.left + rect.width / 2, 
          y: rect.top + rect.height / 2 
        });
      }
    };
    
    // Atualiza o centro logo no inicio e também em resize/scroll
    updateCenter();
    window.addEventListener('resize', updateCenter);
    // Delay pequeno para caso a tela tenha animado e o elemento tenha mudado de lugar
    const timeout = setTimeout(updateCenter, 500);
    return () => {
      window.removeEventListener('resize', updateCenter);
      clearTimeout(timeout);
    };
  }, [isVisible]);

  // Calcula a distância do mouse para o centro do olho e limita o movimento a 3 pixels (tamanho da iris)
  const deltaX = useTransform(mouseX, val => {
    if (!isVisible || eyeCenter.x === 0) return 0;
    const diff = val - eyeCenter.x;
    return Math.max(-3, Math.min(3, diff / 40));
  });
  
  const deltaY = useTransform(mouseY, val => {
    if (!isVisible || eyeCenter.y === 0) return 0;
    const diff = val - eyeCenter.y;
    return Math.max(-3, Math.min(3, diff / 40));
  });

  return (
    <div ref={eyeRef} className="eye-icon-container">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {isVisible ? (
          <>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <motion.circle cx="12" cy="12" r="3" style={{ x: deltaX, y: deltaY }} fill="currentColor" />
          </>
        ) : (
          <>
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </>
        )}
      </svg>
    </div>
  );
};

const AuthScreen = () => {
  const { login, register, logout, currentUser, userData } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Hooking up global mouse position for the eyes
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (!formData.name.trim()) throw new Error("O nome é obrigatório para cadastro.");
        await register(formData.email, formData.password, formData.name);
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setError(err.message || 'Falha na autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    if (userData?.status === 'pendente') {
      return (
        <div className="auth-wrapper">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card pending-card"
          >
            <div className="pending-icon-wrapper">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="pending-spinner-ring"
              />
              <ShieldCheck size={32} className="text-emerald" />
            </div>
            
            <h2 className="premium-title">Acesso em Análise</h2>
            <p className="premium-subtitle">Sua conta foi criada, mas a nossa arquitetura de segurança exige aprovação manual do administrador.</p>
            
            <div className="user-status-box">
              <div className="user-info-row">
                <span className="label">Usuário</span>
                <span className="value">{userData.nome || currentUser.email}</span>
              </div>
              <div className="user-info-row">
                <span className="label">Status de Acesso</span>
                <span className="badge-pending">Aguardando Liberação</span>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              className="premium-btn outline-btn" 
              onClick={logout}
            >
              <LogOut size={16} />
              Encerrar Sessão Segura
            </motion.button>
          </motion.div>
        </div>
      );
    }
    
    if (userData?.status !== 'aprovado') {
        return (
            <div className="auth-wrapper centered-loader">
              <Loader2 size={32} className="spin text-blue" />
            </div>
        );
    }
  }

  return (
    <div className="auth-wrapper">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="form-container"
      >
        <div className="form-header">
          <div className="brand-icon-center">
            <Lock size={28} className="text-blue" />
          </div>
          <h2>{isLogin ? 'Bem-vindo' : 'Criar Conta'}</h2>
          <p>{isLogin ? 'Faça login no painel de suporte.' : 'Solicite suas credenciais de acesso.'}</p>
        </div>

        <div className="error-slot">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="inline-error"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.form layout onSubmit={handleSubmit} className="premium-form">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div 
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0 }}
                className="input-group"
              >
                <label>Identificação</label>
                <div className="input-wrapper">
                  <User size={18} className="icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-group">
            <label>Credencial de Acesso</label>
            <div className="input-wrapper">
              <Mail size={18} className="icon" />
              <input
                type="email"
                name="email"
                placeholder="seu.email@empresa.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Chave de Segurança</label>
            <div className="input-wrapper">
              <Lock size={18} className="icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button 
                type="button" 
                className="eye-btn" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                <AnimatedEyeIcon isVisible={showPassword} mouseX={mouseX} mouseY={mouseY} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div 
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0 }}
                className="input-group"
              >
                <label>Confirmação da Chave</label>
                <div className="input-wrapper">
                  <Lock size={18} className="icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Repita a senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isLogin}
                    minLength={6}
                  />
                  <button 
                    type="button" 
                    className="eye-btn" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    <AnimatedEyeIcon isVisible={showConfirmPassword} mouseX={mouseX} mouseY={mouseY} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            layout
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.96 }}
            type="submit" 
            className="premium-btn submit-btn" 
            disabled={loading}
          >
            {loading ? <Loader2 size={20} className="spin" /> : (
              <>
                {isLogin ? 'Autenticar' : 'Cadastrar Credencial'}
                {!loading && <ArrowRight size={18} />}
              </>
            )}
          </motion.button>
        </motion.form>

        <motion.div layout className="form-footer">
          <span className="text-muted">{isLogin ? "Primeiro acesso?" : "Já possui credencial?"}</span>
          <button 
            type="button" 
            className="text-link" 
            onClick={() => { 
              setIsLogin(!isLogin); 
              setError(''); 
              setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              setShowPassword(false);
              setShowConfirmPassword(false);
            }}
          >
            {isLogin ? 'Criar uma conta' : 'Fazer login'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
