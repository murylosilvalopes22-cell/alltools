import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, RefreshCw, ArrowLeft, QrCode } from 'lucide-react';
import './QRGenerator.css';

const VERSIONS = ['4.12.0.0', '4.11.0.0', '4.10.0.0', '4.9.0.0', '4.8.0.0', '4.7.0.0', '4.5.0.0', '4.3.0.2', '4.3.0.1'];

const QRGenerator = ({ onBack, theme }) => {
  const [content, setContent] = useState('https://storsistemas.com.br/aplicativos/storpedidos/StorGarcom(4.12.0.0)-release.apk');
  const [isGenerated, setIsGenerated] = useState(true);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (content.trim()) {
      setIsGenerated(true);
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = 'qrcode-storsistemas.png';
      a.href = url;
      a.click();
    }
  };

  const handleCopy = async () => {
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy image', err);
        }
      });
    }
  };

  return (
    <motion.div 
      className="qr-app-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="qr-wrapper">
        <div className="qr-header">
          <div className="qr-icon-wrapper">
            <QrCode size={28} />
          </div>
          <h1>Gerador QR</h1>
          <p className="subtitle">StorSistemas Premium Tool</p>
        </div>

        <div className="qr-layout">
          {/* Input Area */}
          <div className="qr-input-section">
            <form onSubmit={handleGenerate}>
              <div className="version-selector">
                <label>Selecionar versão (StorGarcom):</label>
                <div className="version-pills">
                  {VERSIONS.map(v => (
                    <button 
                      type="button" 
                      key={v} 
                      className={`pill ${content.includes(`(${v})`) ? 'active' : ''}`}
                      onClick={() => {
                        setContent(`https://storsistemas.com.br/aplicativos/storpedidos/StorGarcom(${v})-release.apk`);
                        setIsGenerated(true);
                        setCopied(false);
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="qr-content">Conteúdo do QR Code</label>
                <textarea 
                  id="qr-content"
                  placeholder="https://exemplo.com ou texto simples..."
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (isGenerated) setIsGenerated(false);
                  }}
                  rows={4}
                />
              </div>
              
              <motion.button 
                type="submit"
                className="btn-primary"
                style={{ width: '100%', background: 'var(--primary)', borderColor: 'var(--primary)' }}
                disabled={!content.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Gerar <RefreshCw size={16} />
              </motion.button>
            </form>
          </div>

          {/* Result Area */}
          <div className="qr-result-section">
            <AnimatePresence mode="wait">
              {isGenerated ? (
                <motion.div 
                  key="generated"
                  className="qr-display-card success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                >
                  <div className="canvas-wrapper" ref={qrRef}>
                    <QRCodeCanvas 
                      value={content} 
                      size={180}
                      level={"H"}
                      includeMargin={true}
                      fgColor={"#000000"}
                      bgColor={"#ffffff"}
                    />
                  </div>
                  
                  <div className="status-message">
                    <span className="dot-success"></span> Novo QR Code gerado!
                  </div>

                  <div className="action-buttons">
                    <motion.button 
                      className="btn-action" 
                      onClick={handleDownload}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download size={16} /> Baixar PNG
                    </motion.button>
                    <motion.button 
                      className={`btn-action outline ${copied ? 'copied' : ''}`} 
                      onClick={handleCopy}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Copy size={16} /> {copied ? 'Copiado!' : 'Copiar Imagem'}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  className="qr-display-card empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="placeholder-icon">
                    <QrCode size={48} opacity={0.3} />
                  </div>
                  <p>Insira um conteúdo para visualizar o código.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QRGenerator;
