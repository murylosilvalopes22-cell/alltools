import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MonitorPlay, CloudDownload, ShieldCheck, HeartHandshake } from 'lucide-react';
import './DownloadAnydesk.css';

const DownloadAnydesk = ({ onBack, theme }) => {
  const downloadLink = "https://drive.usercontent.google.com/download?id=1OipLQC9OIRpAEotQakxRm0fUcUVlv9bx&export=download&confirm=t&uuid=b75235da-da52-4d52-be84-ad1da5c185dc&at=APcXIO23_Bc9KyWI4tqO7OgXMH16%3A1770040196362";

  return (
    <motion.div 
      className="anydesk-app-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="anydesk-wrapper">
        <div className="anydesk-header">
          <div className="anydesk-icon-wrapper">
            <MonitorPlay size={32} />
          </div>
          <h1>AnyDesk Remoto</h1>
          <p className="subtitle">Cliente Oficial StorSistemas</p>
        </div>

        <div className="anydesk-card-layout">
          <div className="anydesk-branding">
            <div className="brand-glow" />
            <motion.div 
              className="circle-decoration"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
              <svg viewBox="0 0 100 100" className="animated-ring">
                <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 8" />
              </svg>
            </motion.div>
            <MonitorPlay size={80} className="main-device-icon" strokeWidth={1} />
          </div>

          <div className="anydesk-content">
            <h2 className="title-desc">Inicie seu Suporte Remoto</h2>
            
            <div className="features-list">
              <div className="feature-item">
                <ShieldCheck size={18} />
                <span>Conexão Segura (RSA 2048)</span>
              </div>
              <div className="feature-item">
                <HeartHandshake size={18} />
                <span>Pronto para Suporte Stor</span>
              </div>
              <div className="feature-item">
                <CloudDownload size={18} />
                <span>Hospedado no Google Drive</span>
              </div>
            </div>

            <motion.a 
              href={downloadLink}
              className="btn-huge-download"
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <CloudDownload size={24} />
              <div className="btn-text-content">
                <strong>Baixar AnyDesk Agora</strong>
                <span>Transferência Direta (~3.8 MB)</span>
              </div>
            </motion.a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DownloadAnydesk;
