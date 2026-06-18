import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileCode2, UploadCloud, Download, Trash2, AlertCircle, FileText } from 'lucide-react';
import { DANFe, DANFCe } from 'node-sped-pdf';
import './XmlToDanfe.css';

const XmlToDanfe = ({ onBack, theme }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const processXML = async (xmlString, name) => {
    setIsLoading(true);
    setError('');
    
    try {
      // O node-sped-pdf espera um objeto com a string do XML.
      // Adicionando um timeout de 8 segundos para evitar travamento infinito
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 8000)
      );

      // Detectar o modelo (55 ou 65)
      const modMatch = xmlString.match(/<mod>(\d{2})<\/mod>/);
      const isNFCe = modMatch && modMatch[1] === '65';

      const pdfBuffer = await Promise.race([
        isNFCe ? DANFCe({ xml: xmlString }) : DANFe({ xml: xmlString }),
        timeoutPromise
      ]);
      
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
      setFileName(name.replace('.xml', ''));
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      if (err.message === 'TIMEOUT') {
        setError('O processamento demorou muito e foi cancelado. O XML pode estar corrompido ou ser muito grande.');
      } else {
        setError('Falha ao processar o arquivo XML. Certifique-se de que é um XML de NF-e (55) ou NFC-e (65) válido e aprovado pela SEFAZ.');
      }
      setPdfUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
      setError('Por favor, selecione um arquivo XML válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlString = event.target.result;
      processXML(xmlString, file.name);
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
    
    // reset input value so the same file can be selected again if cleared
    e.target.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
        setError('Apenas arquivos XML são suportados.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const xmlString = event.target.result;
        processXML(xmlString, file.name);
      };
      reader.onerror = () => {
        setError('Erro ao ler o arquivo arrastado.');
      };
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setFileName('');
    setError('');
  };

  return (
    <motion.div 
      className="danfe-generator-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="danfe-header">
        <h1>
          <FileCode2 className="danfe-header-icon" size={32} />
          XML Para PDF
        </h1>
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} /> Voltar ao Dashboard
        </button>
      </div>

      <div className="danfe-content">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error"
              className="error-message"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!pdfUrl ? (
          <div 
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".xml,text/xml" 
              className="hidden-file-input" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <UploadCloud size={64} className="upload-icon" />
            <div className="upload-text">
              <h3>{isLoading ? 'Gerando PDF...' : 'Anexar arquivo XML (NF-e ou NFC-e)'}</h3>
              {!isLoading && <p>Clique ou arraste o arquivo para esta área</p>}
            </div>
            
            {isLoading && (
              <div className="progress-bar-container">
                <div className="progress-bar-fill"></div>
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            className="pdf-preview-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="pdf-preview-header">
              <h3>
                <FileText size={20} color="var(--primary-color)" />
                {fileName}.pdf
              </h3>
              <div className="pdf-actions">
                <button className="btn-clear" onClick={handleClear} title="Limpar e Enviar Outro">
                  <Trash2 size={18} />
                </button>
                <a 
                  href={pdfUrl} 
                  download={`${fileName}_DANFE_NFCe.pdf`} 
                  className="btn-download"
                >
                  <Download size={18} />
                  Baixar PDF
                </a>
              </div>
            </div>
            
            <iframe 
              src={pdfUrl} 
              className="pdf-frame" 
              title="Visualização da DANFE"
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default XmlToDanfe;
