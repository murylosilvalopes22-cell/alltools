import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { ArrowLeft, Images, FileText, Download, UploadCloud, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import './ConversorImagens.css';

const ConversorImagens = ({ onBack }) => {
  const [images, setImages] = useState([]);
  const [margin, setMargin] = useState(10);
  const [orientation, setOrientation] = useState('auto');
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const processFiles = (files) => {
    const promises = Array.from(files).map(file => {
      if (!file.type.startsWith('image/')) return null;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ id: Math.random().toString(36).substr(2, 9), src: e.target.result, name: file.name });
        reader.readAsDataURL(file);
      });
    }).filter(Boolean);

    Promise.all(promises).then(newImages => {
      setImages(prev => [...prev, ...newImages]);
    });
  };

  const handleFileChange = (e) => processFiles(e.target.files);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files);
  };

  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
  };

  const calculateImageDimensions = async (src, pWidth, pHeight, m) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const maxW = pWidth - (m * 2);
        const maxH = pHeight - (m * 2);

        let renderW = maxW;
        let renderH = renderW / imgRatio;

        if (renderH > maxH) {
          renderH = maxH;
          renderW = renderH * imgRatio;
        }
        resolve({ width: renderW, height: renderH, ratio: imgRatio });
      };
      img.src = src;
    });
  };

  const generatePDF = async () => {
    if (images.length === 0) return;
    setLoading(true);

    try {
      const a4Width = 210, a4Height = 297;
      let pdf = null;

      for (let i = 0; i < images.length; i++) {
        const imgData = images[i];
        
        const tempImg = new Image();
        tempImg.src = imgData.src;
        await new Promise(r => tempImg.onload = r);
        const isLandscapeImg = (tempImg.naturalWidth / tempImg.naturalHeight) > 1;

        let currentOrientation = 'p';
        if (orientation === 'auto' && isLandscapeImg) currentOrientation = 'l';
        else if (orientation === 'landscape') currentOrientation = 'l';

        const pWidth = currentOrientation === 'p' ? a4Width : a4Height;
        const pHeight = currentOrientation === 'p' ? a4Height : a4Width;

        if (i === 0) {
          pdf = new jsPDF({ orientation: currentOrientation, unit: 'mm', format: 'a4' });
        } else {
          pdf.addPage('a4', currentOrientation);
        }

        const dims = await calculateImageDimensions(imgData.src, pWidth, pHeight, margin);
        const xOffset = margin + (pWidth - (margin * 2) - dims.width) / 2;
        const yOffset = margin + (pHeight - (margin * 2) - dims.height) / 2;

        let format = 'JPEG';
        if (imgData.src.includes('image/png')) format = 'PNG';
        if (imgData.src.includes('image/webp')) format = 'WEBP';

        pdf.addImage(imgData.src, format, xOffset, yOffset, dims.width, dims.height);
      }

      pdf.save('imagens_convertidas.pdf');
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF');
    }
    setLoading(false);
  };

  const generateWord = async () => {
    if (images.length === 0) return;
    setLoading(true);

    try {
      let docxContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
          <meta charset="utf-8">
          <title>Imagens Compiladas</title>
          <!--[if gte mso 9]>
          <xml><o:DocumentProperties><o:Author>Stor Sistemas</o:Author></o:DocumentProperties></xml>
          <![endif]-->
          <style>
              @page { size: 210mm 297mm; margin: ${margin}mm; }
              @page SectionLandscape { size: 297mm 210mm; margin: ${margin}mm; }
              body { font-family: 'Segoe UI', Arial, sans-serif; }
              .page-break { page-break-before: always; mso-break-type: section-break; }
              .container-img { text-align: center; margin: 0 auto; width: 100%; }
              .img-fit { max-width: 100%; max-height: 100%; object-fit: contain; }
          </style>
      </head>
      <body>
      `;

      for (let i = 0; i < images.length; i++) {
        const imgData = images[i];
        
        const tempImg = new Image();
        tempImg.src = imgData.src;
        await new Promise(r => tempImg.onload = r);
        const isLandscapeImg = (tempImg.naturalWidth / tempImg.naturalHeight) > 1;

        let useLandscape = false;
        if (orientation === 'auto' && isLandscapeImg) useLandscape = true;
        else if (orientation === 'landscape') useLandscape = true;

        const baseWidthMm = useLandscape ? 297 : 210;
        const baseHeightMm = useLandscape ? 210 : 297;
        const availableWidthMm = baseWidthMm - (margin * 2);
        const availableHeightMm = baseHeightMm - (margin * 2);

        let sectionStyle = useLandscape ? "mso-page-orientation:landscape; size:297mm 210mm;" : "mso-page-orientation:portrait; size:210mm 297mm;";
        
        if (i > 0) docxContent += `<div class="page-break" style="${sectionStyle}"></div>`;
        else docxContent += `<div style="${sectionStyle}">`;

        docxContent += `
            <div class="container-img" style="width:${availableWidthMm}mm; height:${availableHeightMm}mm; display:table-cell; vertical-align:middle; text-align:center;">
                <img class="img-fit" src="${imgData.src}" style="max-width:${availableWidthMm}mm; max-height:${availableHeightMm}mm; width:auto; height:auto; display:inline-block;" />
            </div>
        </div>`;
      }

      docxContent += `</body></html>`;

      const blob = new Blob([docxContent], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'imagens_convertidas.docx';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch(err) {
      console.error(err);
      alert('Erro ao gerar DOCX');
    }
    
    setLoading(false);
  };

  return (
    <motion.div 
      className="conversor-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <button className="back-btn" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={18} /> Voltar ao Dashboard
      </button>

      <div className="conversor-header">
        <div>
          <h1><Images className="icon" size={32} color="#a855f7" /> Conversor de Imagens (A4)</h1>
          <p>Exporte imagens ajustadas para PDF ou Word. Arraste para reordenar.</p>
        </div>
      </div>

      <div className="conversor-controls">
        <div className="input-group">
          <label>Margem da Folha:</label>
          <select value={margin} onChange={e => setMargin(Number(e.target.value))}>
            <option value={0}>Sem Margem</option>
            <option value={10}>Margem Fina (10mm)</option>
            <option value={20}>Margem Larga (20mm)</option>
          </select>
        </div>
        <div className="input-group">
          <label>Orientação Automática:</label>
          <select value={orientation} onChange={e => setOrientation(e.target.value)}>
            <option value="auto">Automática (Adapta por imagem)</option>
            <option value="portrait">Sempre Retrato</option>
            <option value="landscape">Sempre Paisagem</option>
          </select>
        </div>
      </div>

      <label 
        className={`upload-card ${isDragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{ padding: '20px', minHeight: '150px' }}
      >
        <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        <UploadCloud size={40} color={isDragActive ? "#38bdf8" : "var(--text-secondary)"} />
        <p>Importar Imagens</p>
        <span>Arraste ou clique para selecionar</span>
      </label>

      {images.length > 0 && (
        <div style={{ position: 'relative' }}>
          {loading && <div className="loading-overlay">Processando Arquivos...</div>}
          
          <Reorder.Group axis="x" values={images} onReorder={setImages} className="preview-grid" style={{ listStyle: 'none', padding: 0 }}>
            {images.map((img, index) => (
              <Reorder.Item key={img.id} value={img} className="preview-item">
                <img src={img.src} alt={img.name} draggable={false} />
                <button className="remove-btn" onClick={() => removeImage(img.id)}><X size={14} /></button>
                <div className="page-badge">Pág. {index + 1}</div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <div className="conversor-actions">
            <button className="btn-danger" onClick={generatePDF} disabled={loading || images.length === 0}>
              <FileText size={18} /> Exportar PDF
            </button>
            <button className="btn-primary" onClick={generateWord} disabled={loading || images.length === 0}>
              <Download size={18} /> Exportar Word
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ConversorImagens;
