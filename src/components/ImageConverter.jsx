import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Images, UploadCloud, Download, Image as ImageIcon, Settings } from 'lucide-react';
import './ImageConverter.css';

const FORMATS = ['PNG', 'JPEG', 'WEBP', 'BMP', 'CUR'];

const ImageConverter = ({ onBack, theme }) => {
  const [targetFormat, setTargetFormat] = useState('WEBP');
  const [quality, setQuality] = useState(90);
  const [isDragging, setIsDragging] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  const formatMimeType = (fmt) => {
    switch (fmt) {
      case 'JPG':
      case 'JPEG': return 'image/jpeg';
      case 'BMP': return 'image/bmp';
      case 'WEBP': return 'image/webp';
      case 'CUR': return 'image/png'; // We generate PNG first to wrap it in a CUR header
      case 'PNG': 
      default: return 'image/png';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (files) => {
    Array.from(files).forEach((file) => {
      const isCurOrIco = file.name.toLowerCase().endsWith('.cur') || file.name.toLowerCase().endsWith('.ico');
      if (!file.type.startsWith('image/') && !isCurOrIco) return;
      
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // CUR sizes ideally should be 32x32, 64x64, 128x128. But we'll just allow original or max 256.
        if (targetFormat === 'CUR') {
           if (width > 256 || height > 256) {
              const ratio = Math.min(256 / width, 256 / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
           }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (targetFormat === 'JPEG' || targetFormat === 'BMP') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const mimeType = formatMimeType(targetFormat);
        const qual = quality / 100;
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.error("Canvas toBlob failed");
            return;
          }

          let finalBlob = blob;
          if (targetFormat === 'CUR') {
             const pngArrayBuffer = await blob.arrayBuffer();
             const pngData = new Uint8Array(pngArrayBuffer);
             
             const header = new Uint8Array(22);
             const dv = new DataView(header.buffer);
             
             dv.setUint16(0, 0, true); // Reserved
             dv.setUint16(2, 2, true); // Type: 2 for CUR
             dv.setUint16(4, 1, true); // Image count: 1
             
             dv.setUint8(6, width >= 256 ? 0 : width);
             dv.setUint8(7, height >= 256 ? 0 : height);
             dv.setUint8(8, 0); // Color count
             dv.setUint8(9, 0); // Reserved
             
             // Hotspot at center for now
             dv.setUint16(10, Math.floor(width / 2), true); // X Hotspot
             dv.setUint16(12, Math.floor(height / 2), true); // Y Hotspot
             
             dv.setUint32(14, pngData.length, true); // Size
             dv.setUint32(18, 22, true); // Offset
             
             finalBlob = new Blob([header, pngData], { type: 'image/x-icon' });
          }

          const newImg = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name.replace(/\.[^/.]+$/, "") + `.${targetFormat.toLowerCase()}`,
            originalSize: file.size,
            newSize: finalBlob.size,
            originalType: file.type,
            format: targetFormat,
            url: URL.createObjectURL(finalBlob),
            previewUrl: objectUrl
          };
          
          setImages((prev) => [...prev, newImg]);
        }, mimeType, qual);
      };
      
      img.onerror = () => {
         console.error("Failed to load image", file.name);
         // Fallback if browser can't decode CUR directly in an Image tag.
         // Most modern browsers CAN decode CUR/ICO if provided via ObjectURL.
      };
      
      img.src = objectUrl;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div 
      className="img-app-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="img-wrapper">
        <div className="img-header">
          <div className="img-icon-wrapper">
            <Images size={28} />
          </div>
          <h1>Conversor de Imagens</h1>
          <p className="subtitle">Universal Image Optimizer</p>
        </div>

        <div className="img-layout">
          {/* Settings Area */}
          <div className="img-settings-section">
            <div className="settings-card">
              <h3><Settings size={18} /> Configurações de Saída</h3>
              
              <div className="setting-group">
                <label>Formato de Destino</label>
                <div className="format-pills">
                  {FORMATS.map(fmt => (
                    <button 
                      type="button" 
                      key={fmt} 
                      className={`format-pill ${targetFormat === fmt ? 'active' : ''}`}
                      onClick={() => setTargetFormat(fmt)}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <div className="quality-header">
                  <label>Qualidade de Compressão</label>
                  <span className="quality-val">{quality}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={quality} 
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="quality-slider"
                  disabled={targetFormat === 'PNG' || targetFormat === 'BMP'} // PNG and BMP are lossless
                />
                {(targetFormat === 'PNG' || targetFormat === 'BMP') && (
                  <p className="hint-text">Qualidade não aplicável para formatos sem perda.</p>
                )}
              </div>
            </div>
            
            {/* Upload Zone */}
            <div 
              className={`drop-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                multiple 
                accept="image/*,.cur,.ico" 
                ref={fileInputRef} 
                onChange={handleFileInput} 
                className="hidden-input" 
              />
              <div className="drop-content">
                <div className="drop-icon">
                  <UploadCloud size={48} />
                </div>
                <h4>Arraste imagens para cá</h4>
                <p>ou clique para selecionar arquivos</p>
                <span>Suporta JPG, PNG, WEBP, BMP, CUR, etc</span>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="img-result-section">
            <AnimatePresence mode="popLayout">
              {images.length > 0 ? (
                <div className="results-list">
                  {images.map((img) => {
                    const ratio = img.newSize / img.originalSize;
                    const savings = 100 - (ratio * 100);
                    const isSmaller = img.newSize < img.originalSize;
                    
                    return (
                      <motion.div 
                        key={img.id}
                        className="result-card"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <div className="result-preview" style={{ backgroundImage: `url(${img.previewUrl})` }} />
                        <div className="result-info">
                          <h4 title={img.name}>{img.name}</h4>
                          <span className="format-badge">{img.format}</span>
                          <div className="size-comparison">
                            <span className="orig">{formatBytes(img.originalSize)}</span>
                            <span className="arrow">→</span>
                            <span className={`new ${isSmaller ? 'good' : 'bad'}`}>
                              {formatBytes(img.newSize)}
                            </span>
                          </div>
                          {isSmaller && <span className="savings">-{savings.toFixed(1)}%</span>}
                        </div>
                        <a 
                          href={img.url} 
                          download={img.name} 
                          className="btn-download-icon"
                          title="Baixar Imagem"
                        >
                          <Download size={20} />
                        </a>
                      </motion.div>
                    );
                  })}
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button className="btn-clear-list" onClick={() => setImages([])}>
                      Limpar Lista
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <ImageIcon size={56} />
                  </div>
                  <h3>Nenhuma imagem na fila</h3>
                  <p>As imagens convertidas aparecerão aqui prontas para baixar.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageConverter;
