import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rnd } from 'react-rnd';
import { ArrowLeft, Settings, Layout, Type, Barcode, Download, Trash2, X, FileText, Database, Bold, Italic, Ruler, Move, Magnet, Upload, Save, AlertTriangle, Undo, Redo } from 'lucide-react';
import './EditorEtiquetas.css';
import fieldsData from '../data/labelFields.json';

// Constants
const DPI = 8; // 203 DPI = ~8 dots per mm

const EditorEtiquetas = ({ onBack, theme }) => {
  const [elements, setElements] = useState([]);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const saveHistoryAndSetElements = (newElements) => {
    setPast(prev => [...prev, elements]);
    setFuture([]);
    setElements(newElements);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(past.slice(0, -1));
    setFuture([elements, ...future]);
    setElements(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(future.slice(1));
    setPast([...past, elements]);
    setElements(next);
  };
  
  // Label Settings
  const [printerType, setPrinterType] = useState('Zebra'); // Zebra, PPLB, PPLA, FR3
  const [labelWidth, setLabelWidth] = useState(100); // mm
  const [labelHeight, setLabelHeight] = useState(30); // mm
  const [columns, setColumns] = useState(1); // Carreiras
  const [zoom, setZoom] = useState(1); // 1 = 100%

  const [showRulers, setShowRulers] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [enableSnapping, setEnableSnapping] = useState(false);

  const [showViewSettings, setShowViewSettings] = useState(false);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setShowViewSettings(false);
        setShowPrinterSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refs for zero-lag Smart Guides
  const guidesContainerRef = useRef(null);
  const guideTopRef = useRef(null);
  const guideBottomRef = useRef(null);
  const guideLeftRef = useRef(null);
  const guideRightRef = useRef(null);
  const badgeTopRef = useRef(null);
  const badgeBottomRef = useRef(null);
  const badgeLeftRef = useRef(null);
  const badgeRightRef = useRef(null);
  const ghostHitboxRef = useRef(null);
  const fileInputRef = useRef(null);

  const [exportCode, setExportCode] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Import states
  const [importedFileName, setImportedFileName] = useState('etiqueta_projeto');
  const [importedFileType, setImportedFileType] = useState('stor');

  const canvasRef = useRef(null);

  const pxWidth = labelWidth * DPI;
  const pxHeight = labelHeight * DPI;

  // ==========================================
  // EXPORTADORES & IMPORTADORES MAGNÉTICOS
  // ==========================================

  const saveNativeProject = () => {
    const project = {
      labelWidth, labelHeight, DPI, elements
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "etiqueta_projeto.stor");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const originalFileName = file.name;
      const nameParts = originalFileName.split('.');
      const ext = nameParts.pop().toLowerCase();
      const baseName = nameParts.join('.');

      setImportedFileName(baseName);
      setImportedFileType(ext);

      try {
        let detectedColumns = 1;
        const etiquetaMatch = content.match(/{ETIQUETA\d+}/g);
        if (etiquetaMatch) {
          detectedColumns = new Set(etiquetaMatch).size;
        }
        setColumns(detectedColumns);
        // Look for hidden STOR META data in any text file
        const metaMatch = content.match(/STOR_META_W:(\d+)_H:(\d+)/);
        if (metaMatch) {
          setLabelWidth(parseInt(metaMatch[1], 10));
          setLabelHeight(parseInt(metaMatch[2], 10));
        }

        const jsonMatch = content.match(/STOR_META_JSON:(.+)/);
        if (jsonMatch) {
          try {
            let jsonString = jsonMatch[1];
            if (jsonString.endsWith('^FS')) jsonString = jsonString.slice(0, -3);
            if (jsonString.endsWith('-->')) jsonString = jsonString.slice(0, -3).trim();
            const elementsParsed = JSON.parse(jsonString);
            if (Array.isArray(elementsParsed)) {
              if (ext === 'fr3') setPrinterType('Grafica');
              else if (content.includes('^XA')) setPrinterType('Zebra');
              else if (content.includes('N\nO\nD7')) setPrinterType('PPLB');
              saveHistoryAndSetElements(elementsParsed);
              alert('Arquivo importado com precisão 100% (Metadados restaurados)!');
              return;
            }
          } catch (e) {
            console.error('Erro ao ler META JSON:', e);
          }
        }

        // Native .stor or .json
        if (ext === 'json' || ext === 'stor' || content.trim().startsWith('{')) {
          const parsed = JSON.parse(content);
          if (parsed.elements && Array.isArray(parsed.elements)) {
            if (parsed.labelWidth) setLabelWidth(parsed.labelWidth);
            if (parsed.labelHeight) setLabelHeight(parsed.labelHeight);
            if (parsed.DPI) setPrinterType(parsed.printerType || 'Zebra'); // fallback
            saveHistoryAndSetElements(parsed.elements);
            alert('Projeto importado com sucesso!');
            return;
          }
        }

        // Helper to map fields
        const mapField = (text) => {
          let fieldId = 'ST';
          let fieldName = 'Texto Fixo';
          let tag = 'TEXTO';
          let fastReportTag = 'TEXTO';
          let isStaticMenu = true;
          let staticText = text;

          if (text.includes('CMP')) {
            const cmpMatch = text.match(/CMP\d+/);
            if (cmpMatch) {
               const foundField = fieldsData.find(f => f.tag && f.tag.includes(cmpMatch[0]));
               if (foundField) {
                  fieldId = foundField.id;
                  fieldName = foundField.nome;
                  tag = foundField.tag;
                  fastReportTag = foundField.fastReportTag;
                  isStaticMenu = false;
                  staticText = '';
               }
            }
          }
          return { fieldId, fieldName, tag, fastReportTag, isStaticMenu, staticText };
        };

        // FastReport .fr3 (XML)
        if (ext === 'fr3' || content.includes('TfrxReport')) {
          setPrinterType('Grafica');
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, "text/xml");
          const newElements = [];
          
          const processNodes = (nodes, type) => {
            Array.from(nodes).forEach(node => {
              const left = parseFloat(node.getAttribute('Left') || 0);
              const top = parseFloat(node.getAttribute('Top') || 0);
              const width = parseFloat(node.getAttribute('Width') || 100);
              const height = parseFloat(node.getAttribute('Height') || 20);
              let text = node.getAttribute('Text') || '';

              const mapped = mapField(text.replace(/\[|\]/g, ''));

              newElements.push({
                id: `el_${Date.now()}_${Math.random()}`,
                type,
                ...mapped,
                x: left * DPI, 
                y: top * DPI,
                width: Math.max(50, width * DPI),
                height: Math.max(20, height * DPI),
                fontSize: 18
              });
            });
          };

          processNodes(xmlDoc.getElementsByTagName('TfrxMemoView'), 'text');
          processNodes(xmlDoc.getElementsByTagName('TfrxBarCodeView'), 'barcode');
          saveHistoryAndSetElements(newElements);
          alert('Etiqueta FastReport (.fr3) importada!');
          return;
        }

        // ZPL (.etq)
        if (content.includes('^XA') || content.includes('^FO')) {
          setPrinterType('Zebra');
          const newElements = [];
          const fieldRegex = /\^FO(\d+),(\d+).*?\^FD(.*?)\^FS/gs;
          let match;
          while ((match = fieldRegex.exec(content)) !== null) {
            const x = parseInt(match[1], 10);
            const y = parseInt(match[2], 10);
            let text = match[3];
            let type = 'text';
            
            if (text.includes('CMP002') || text.includes('EAN') || content.substring(Math.max(0, match.index - 20), match.index).includes('^BC')) {
               type = 'barcode';
            }

            const mapped = mapField(text.replace(/<[^>]*>?/gm, ''));

            newElements.push({
              id: `el_${Date.now()}_${Math.random()}`, type, ...mapped,
              x: x, y: y, width: type === 'barcode' ? 150 : 120, height: type === 'barcode' ? 50 : 20,
              fontSize: 18
            });
          }
          if(newElements.length > 0) {
            saveHistoryAndSetElements(newElements);
            alert('Etiqueta ZPL importada!');
          }
          return;
        }

        // PPLB/EPL (.etq)
        if (content.split('\n').some(l => l.startsWith('A') && l.includes(','))) {
          setPrinterType('PPLB');
          const newElements = [];
          const lines = content.split('\n');
          lines.forEach(line => {
            line = line.trim();
            if ((line.startsWith('A') && !line.startsWith('AUTO')) || line.startsWith('B')) {
              const parts = line.split(',');
              if (parts.length >= 8) {
                const x = parseInt(parts[0].substring(1), 10);
                const y = parseInt(parts[1], 10);
                let text = (line.startsWith('A') ? parts.slice(7) : parts.slice(8)).join(',').replace(/"/g, '');
                
                const type = line.startsWith('B') ? 'barcode' : 'text';
                const mapped = mapField(text.replace(/<[^>]*>?/gm, ''));

                newElements.push({
                  id: `el_${Date.now()}_${Math.random()}`, type, ...mapped,
                  x: x, y: y, width: type === 'barcode' ? 150 : 120, height: type === 'barcode' ? 50 : 20,
                  fontSize: 18
                });
              }
            }
          });
          if(newElements.length > 0) {
            saveHistoryAndSetElements(newElements);
            alert('Etiqueta PPLB/EPL importada!');
          } else {
            alert('Não foi possível encontrar campos PPLB válidos.');
          }
          return;
        }

        alert("Formato de arquivo não reconhecido pelo Importador Mágico.");
      } catch (err) {
        console.error(err);
        alert('Erro ao importar o arquivo.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const calculateSnap = (x, y, w, h, id) => {
    let newX = x;
    let newY = y;
    let snappedX = false;
    let snappedY = false;
    
    if (enableSnapping) {
      const snapThreshold = 25;
      
      if (newX < snapThreshold) { newX = 0; snappedX = true; }
      else if (Math.abs(newX + w - pxWidth) < snapThreshold) { newX = pxWidth - w; snappedX = true; }
      else if (Math.abs(newX + w/2 - pxWidth/2) < snapThreshold) { newX = pxWidth/2 - w/2; snappedX = true; }

      if (newY < snapThreshold) { newY = 0; snappedY = true; }
      else if (Math.abs(newY + h - pxHeight) < snapThreshold) { newY = pxHeight - h; snappedY = true; }
      else if (Math.abs(newY + h/2 - pxHeight/2) < snapThreshold) { newY = pxHeight/2 - h/2; snappedY = true; }

      elements.forEach(other => {
        if (other.id === id) return;
        if (!snappedX) {
          if (Math.abs(newX - other.x) < snapThreshold) { newX = other.x; snappedX = true; }
          else if (Math.abs(newX - (other.x + other.width)) < snapThreshold) { newX = other.x + other.width; snappedX = true; }
        }
        if (!snappedY) {
          if (Math.abs(newY - other.y) < snapThreshold) { newY = other.y; snappedY = true; }
          else if (Math.abs(newY - (other.y + other.height)) < snapThreshold) { newY = other.y + other.height; snappedY = true; }
        }
      });
    }
    
    return { newX, newY, snappedX, snappedY };
  };

  const updateGuides = (x, y, w, h, id) => {
    if (!guidesContainerRef.current) return;
    
    const { newX, newY, snappedX, snappedY } = calculateSnap(x, y, w, h, id);
    
    guidesContainerRef.current.style.display = 'block';
    
    if (ghostHitboxRef.current) {
      if ((snappedX || snappedY) && enableSnapping) {
        ghostHitboxRef.current.style.display = 'block';
        ghostHitboxRef.current.style.left = `${newX}px`;
        ghostHitboxRef.current.style.top = `${newY}px`;
        ghostHitboxRef.current.style.width = `${w}px`;
        ghostHitboxRef.current.style.height = `${h}px`;
      } else {
        ghostHitboxRef.current.style.display = 'none';
      }
    }

    const toggleClass = (ref, isMagnetic) => {
      if (!ref.current) return;
      if (isMagnetic) ref.current.classList.add('magnetic');
      else ref.current.classList.remove('magnetic');
    };
    
    toggleClass(guideTopRef, snappedY);
    toggleClass(badgeTopRef, snappedY);
    toggleClass(guideBottomRef, snappedY);
    toggleClass(badgeBottomRef, snappedY);
    
    toggleClass(guideLeftRef, snappedX);
    toggleClass(badgeLeftRef, snappedX);
    toggleClass(guideRightRef, snappedX);
    toggleClass(badgeRightRef, snappedX);

    if (showGuides) {
      guideTopRef.current.style.display = 'block';
      badgeTopRef.current.style.display = 'block';
      guideTopRef.current.style.left = `${newX + w / 2}px`;
      guideTopRef.current.style.top = '0px';
      guideTopRef.current.style.height = `${newY}px`;
      badgeTopRef.current.style.left = `${newX + w / 2}px`;
      badgeTopRef.current.style.top = `${newY / 2}px`;
      badgeTopRef.current.innerText = `${Math.round(newY)}px`;

      guideBottomRef.current.style.display = 'block';
      badgeBottomRef.current.style.display = 'block';
      guideBottomRef.current.style.left = `${newX + w / 2}px`;
      guideBottomRef.current.style.top = `${newY + h}px`;
      guideBottomRef.current.style.height = `${Math.max(0, pxHeight - (newY + h))}px`;
      badgeBottomRef.current.style.left = `${newX + w / 2}px`;
      badgeBottomRef.current.style.top = `${newY + h + (pxHeight - (newY + h)) / 2}px`;
      badgeBottomRef.current.innerText = `${Math.round(pxHeight - (newY + h))}px`;

      guideLeftRef.current.style.display = 'block';
      badgeLeftRef.current.style.display = 'block';
      guideLeftRef.current.style.top = `${newY + h / 2}px`;
      guideLeftRef.current.style.left = '0px';
      guideLeftRef.current.style.width = `${newX}px`;
      badgeLeftRef.current.style.top = `${newY + h / 2}px`;
      badgeLeftRef.current.style.left = `${newX / 2}px`;
      badgeLeftRef.current.innerText = `${Math.round(newX)}px`;

      guideRightRef.current.style.display = 'block';
      badgeRightRef.current.style.display = 'block';
      guideRightRef.current.style.top = `${newY + h / 2}px`;
      guideRightRef.current.style.left = `${newX + w}px`;
      guideRightRef.current.style.width = `${Math.max(0, pxWidth - (newX + w))}px`;
      badgeRightRef.current.style.top = `${newY + h / 2}px`;
      badgeRightRef.current.style.left = `${newX + w + (pxWidth - (newX + w)) / 2}px`;
      badgeRightRef.current.innerText = `${Math.round(pxWidth - (newX + w))}px`;
    } else {
      guideTopRef.current.style.display = 'none';
      badgeTopRef.current.style.display = 'none';
      guideBottomRef.current.style.display = 'none';
      badgeBottomRef.current.style.display = 'none';
      guideLeftRef.current.style.display = 'none';
      badgeLeftRef.current.style.display = 'none';
      guideRightRef.current.style.display = 'none';
      badgeRightRef.current.style.display = 'none';
    }
  };

  const hideGuides = () => {
    if (guidesContainerRef.current) {
      guidesContainerRef.current.style.display = 'none';
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea' || e.target.tagName.toLowerCase() === 'select') {
        return;
      }
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        removeElement(selectedId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, past, future]);

  const handleAddField = (field, x = 20, y = 20) => {
    const newElement = {
      id: `el_${Date.now()}`,
      fieldId: field.id,
      fieldName: field.nome,
      tag: field.tag || '',
      fastReportTag: field.fastReportTag || '',
      type: field.type || (field.nome?.toLowerCase().includes('barra') ? 'barcode' : 'text'),
      x,
      y,
      width: field.width || (field.nome?.toLowerCase().includes('barra') ? 150 : 120),
      height: field.height || (field.nome?.toLowerCase().includes('barra') ? 40 : 20),
      thickness: field.thickness || 2,
      fontSize: 18,
      staticText: field.isStaticMenu ? 'Seu Texto' : '',
      tamanho: field.tamanho || 0,
      bold: false,
      italic: false,
      rotation: 0
    };
    saveHistoryAndSetElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const updateElement = (id, newProps) => {
    saveHistoryAndSetElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  };

  const removeElement = (id) => {
    saveHistoryAndSetElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selectedElement = useMemo(() => elements.find(el => el.id === selectedId), [elements, selectedId]);

  const generateZPL = () => {
    let zpl = `^XA^LH0,0\n^PW${pxWidth}\n^LL${pxHeight}\n\n`;
    const rotMap = { 0: 'N', 90: 'R', 180: 'I', 270: 'B' };
    elements.forEach(el => {
      const rotCode = rotMap[el.rotation || 0] || 'N';
      if (el.type === 'text') {
        zpl += `^FO${Math.round(el.x)},${Math.round(el.y)}^A0${rotCode},${el.fontSize},${el.fontSize}^FD${el.staticText || el.tag}^FS\n`;
      } else if (el.type === 'barcode') {
        zpl += `^FO${Math.round(el.x)},${Math.round(el.y)}^BE${rotCode},${Math.round(el.height)},2,2^FD${el.tag}^FS\n`;
      } else if (el.type === 'shape') {
        zpl += `^FO${Math.round(el.x)},${Math.round(el.y)}^GB${Math.round(el.width)},${Math.round(el.height)},${el.thickness || 2}^FS\n`;
      }
    });
    const elementsJson = JSON.stringify(elements);
    zpl += `\n^PQ1,1,1,Y\n^FX STOR_META_W:${labelWidth}_H:${labelHeight}^FS\n^FX STOR_META_JSON:${elementsJson}^FS\n^XZ`;
    return zpl;
  };

  const generateEPL = () => {
    let epl = `N\nO\nD7\nS2\nQ${pxHeight},24\nq${pxWidth}\n`;
    const rotEplMap = { 0: 0, 90: 1, 180: 2, 270: 3 };
    elements.forEach(el => {
      const rotEpl = rotEplMap[el.rotation || 0] || 0;
      if (el.type === 'text') {
        epl += `A${Math.round(el.x)},${Math.round(el.y)},${rotEpl},1,1,1,N,"${el.staticText || el.tag}"\n`;
      } else if (el.type === 'barcode') {
        epl += `B${Math.round(el.x)},${Math.round(el.y)},${rotEpl},E30,2,7,${Math.round(el.height)},B,"${el.tag}"\n`;
      } else if (el.type === 'shape') {
        epl += `X${Math.round(el.x)},${Math.round(el.y)},${el.thickness || 2},${Math.round(el.x + el.width)},${Math.round(el.y + el.height)}\n`;
      }
    });
    const elementsJson = JSON.stringify(elements);
    epl += `\nP00001\n; STOR_META_W:${labelWidth}_H:${labelHeight}\n; STOR_META_JSON:${elementsJson}\n`;
    return epl;
  };

  const generateFR3 = () => {
    const elementsJson = JSON.stringify(elements);
    let fr3 = `<?xml version="1.0" encoding="utf-8"?>\n<TfrxReport>\n  <!-- Layout FastReport Baseado no Editor Visual -->\n  <!-- STOR_META_W:${labelWidth}_H:${labelHeight} -->\n  <!-- STOR_META_JSON:${elementsJson} -->\n`;
    fr3 += `  <TfrxReportPage Name="Page1" PaperWidth="${labelWidth}" PaperHeight="${labelHeight}">\n`;
    elements.forEach(el => {
      if (el.type === 'shape') {
        fr3 += `    <TfrxShapeView Name="${el.id}" Left="${el.x/DPI}" Top="${el.y/DPI}" Width="${el.width/DPI}" Height="${el.height/DPI}" Shape="skRectangle" Frame.Typ="15" Frame.Width="${el.thickness || 2}" />\n`;
      } else {
        let textContent = el.staticText || el.fastReportTag;
        if (el.bold) textContent = `<b>${textContent}</b>`;
        if (el.italic) textContent = `<i>${textContent}</i>`;
        textContent = textContent.replace(/"/g, '&quot;').replace(/</g, '&#60;').replace(/>/g, '&#62;');
        fr3 += `    <TfrxMemoView Name="${el.id}" Left="${el.x/DPI}" Top="${el.y/DPI}" Width="${el.width/DPI}" Height="${el.height/DPI}" Text="${textContent}" Rotation="${el.rotation || 0}" />\n`;
      }
    });
    fr3 += `  </TfrxReportPage>\n</TfrxReport>`;
    return fr3;
  };

  const handleExport = () => {
    let code = '';
    if (printerType === 'Zebra') code = generateZPL();
    else if (printerType === 'PPLB' || printerType === 'PPLA' || printerType === 'Eltron') code = generateEPL();
    else if (printerType === 'Grafica') code = generateFR3();
    
    setExportCode(code);
    setShowExportModal(true);
  };

  const handleSave = () => {
    if (importedFileType === 'stor' || importedFileType === 'json') {
      saveNativeProject();
    } else {
      let code = '';
      if (printerType === 'Zebra') code = generateZPL();
      else if (printerType === 'PPLB' || printerType === 'PPLA' || printerType === 'Eltron') code = generateEPL();
      else if (printerType === 'Grafica') code = generateFR3();

      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${importedFileName}.${importedFileType}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDownload = () => {
    const ext = printerType === 'Grafica' ? 'fr3' : 'Etq';
    const blob = new Blob([exportCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importedFileName}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      className={`editor-container ${theme}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="editor-warning-banner">
        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
        <p style={{ margin: 0 }}>
          <strong>Aviso de Impressão:</strong> A posição na tela é um guia aproximado e pode não refletir o alinhamento exato no papel físico. Cada impressora possui configurações próprias de margem e calibração de rolo. O sistema exporta apenas as coordenadas iniciais (Eixos X e Y); portanto, caso os dados reais recebidos da STOR sejam mais longos que a visualização, o texto irá expandir e poderá empurrar ou sobrepor o layout. Testes físicos são indispensáveis para garantir a precisão do formato.
        </p>
      </div>
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button className="btn-secondary" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ArrowLeft size={18} /> Voltar
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 10px' }} />
          
          <div className="dropdown-container" style={{ position: 'relative' }}>
            <button className="btn-secondary" onClick={() => {setShowPrinterSettings(!showPrinterSettings); setShowViewSettings(false);}} title="Configurações da Impressão" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Settings size={18} /> Documento
            </button>
            <AnimatePresence>
              {showPrinterSettings && (
                <motion.div 
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <label style={{display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px'}}>
                    Tipo de Impressora:
                    <select value={printerType} onChange={e => setPrinterType(e.target.value)} style={{width: '100%', padding: '8px'}}>
                      <option value="Zebra">Zebra (ZPL)</option>
                      <option value="PPLB">Argox (PPLB)</option>
                      <option value="PPLA">Argox (PPLA)</option>
                      <option value="Eltron">Eltron (EPL)</option>
                      <option value="Grafica">Gráfica (FastReport FR3)</option>
                    </select>
                  </label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <label style={{display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', flex: 1, whiteSpace: 'nowrap'}}>
                      Largura (mm):
                      <input type="number" min="1" value={labelWidth} onChange={e => setLabelWidth(Math.max(1, Number(e.target.value)))} style={{width: '100%', padding: '8px'}} />
                    </label>
                    <label style={{display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', flex: 1, whiteSpace: 'nowrap'}}>
                      Altura (mm):
                      <input type="number" min="1" value={labelHeight} onChange={e => setLabelHeight(Math.max(1, Number(e.target.value)))} style={{width: '100%', padding: '8px'}} />
                    </label>
                    <label style={{display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', flex: 1, whiteSpace: 'nowrap'}}>
                      Carreiras:
                      <input type="number" min="1" max="10" value={columns} onChange={e => setColumns(Math.max(1, Number(e.target.value)))} style={{width: '100%', padding: '8px'}} />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 10px' }} />

          <div className="dropdown-container" style={{ position: 'relative' }}>
            <button className="btn-secondary" onClick={() => {setShowViewSettings(!showViewSettings); setShowPrinterSettings(false);}} title="Visualização e Guias" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Layout size={18} /> Visualização
            </button>
            <AnimatePresence>
              {showViewSettings && (
                <motion.div 
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="dropdown-item" onClick={() => setShowRulers(!showRulers)}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: showRulers ? '#3b82f6' : 'var(--text-primary)'}}>
                      <Ruler size={16} /> <strong>Mostrar Réguas</strong>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Exibe marcações de milímetros nas bordas da etiqueta.</span>
                  </div>
                  <div className="dropdown-item" onClick={() => setShowGuides(!showGuides)}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: showGuides ? '#3b82f6' : 'var(--text-primary)'}}>
                      <Move size={16} /> <strong>Linhas de Distância</strong>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Exibe linhas indicando a distância para as bordas do papel.</span>
                  </div>
                  <div className="dropdown-item" onClick={() => setEnableSnapping(!enableSnapping)}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: enableSnapping ? '#a855f7' : 'var(--text-primary)'}}>
                      <Magnet size={16} /> <strong>Alinhamento Magnético</strong>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Os elementos "grudam" automaticamente para um alinhamento perfeito.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 10px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button className="btn-secondary" style={{padding: '5px 8px'}} onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}>-</button>
            <span style={{ fontSize: '13px', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button className="btn-secondary" style={{padding: '5px 8px'}} onClick={() => setZoom(Math.min(3, zoom + 0.1))}>+</button>
          </div>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 10px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button className="btn-secondary" onClick={undo} disabled={past.length === 0} title="Desfazer (Ctrl+Z)" style={{ opacity: past.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Undo size={16} /></button>
            <button className="btn-secondary" onClick={redo} disabled={future.length === 0} title="Refazer (Ctrl+Y)" style={{ opacity: future.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Redo size={16} /></button>
          </div>
        </div>

        <div className="toolbar-group">
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} title="Importar Arquivo (.stor, .json, .etq, .fr3)" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Upload size={18} /> Importar
          </button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json,.etq,.fr3,.txt,.stor" onChange={handleImportFile} />
          
          <button className="btn-secondary" onClick={handleSave} title={`Salvar como .${importedFileType}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Save size={18} /> Salvar
          </button>
          <button className="btn-primary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Download size={18} /> Exportar
          </button>
        </div>
      </div>

      <div className="editor-main">
        <div className="editor-sidebar">
          <div className="sidebar-header">
            <Database size={18} /> Campos STOR
          </div>
          <div className="fields-list">
            <div 
              className="field-item" 
              draggable="true"
              style={{ border: '1px dashed #3b82f6', background: 'rgba(59, 130, 246, 0.05)' }}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ id: 'ST', nome: 'Texto Fixo', tamanho: 0, tag: 'TEXTO', fastReportTag: 'TEXTO', isStaticMenu: true }));
              }}
              onClick={() => handleAddField({ id: 'ST', nome: 'Texto Fixo', tamanho: 0, tag: 'TEXTO', fastReportTag: 'TEXTO', isStaticMenu: true })}
              title="Adicionar um texto fixo que não puxa dados do banco."
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="field-id" style={{color: '#3b82f6'}}>+ Novo</span>
                <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', color: '#3b82f6' }}>Livre</span>
              </div>
              <span className="field-name" style={{fontWeight: '500'}}>Campo de Texto Fixo</span>
            </div>

            <div 
              className="field-item" 
              draggable="true"
              style={{ border: '1px dashed #10b981', background: 'rgba(16, 185, 129, 0.05)', marginTop: '8px' }}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ id: 'SHP', nome: 'Caixa / Linha', type: 'shape', thickness: 2, width: 100, height: 100 }));
              }}
              onClick={() => handleAddField({ id: 'SHP', nome: 'Caixa / Linha', type: 'shape', thickness: 2, width: 100, height: 100 })}
              title="Adicionar uma forma geométrica geométrica (linha ou caixa)."
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="field-id" style={{color: '#10b981'}}>+ Novo</span>
                <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', color: '#10b981' }}>Forma</span>
              </div>
              <span className="field-name" style={{fontWeight: '500'}}>Caixa / Linha</span>
            </div>
            
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '15px 0' }} />

            {fieldsData.map(field => (
              <div 
                key={field.id} 
                className="field-item" 
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify(field));
                }}
                onClick={() => handleAddField(field)}
                title={`Tamanho: ${field.tamanho} (Você pode arrastar e soltar!)`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="field-id">N° {field.id}</span>
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                    Máx: {field.tamanho}
                  </span>
                </div>
                <span className="field-name">{field.nome}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="editor-canvas-outer">
          <div 
            className="editor-canvas-container" 
            onClick={(e) => {
              if (e.target.classList.contains('editor-canvas-container') || e.target.classList.contains('editor-canvas-outer') || e.target.classList.contains('canvas-zoom-wrapper')) {
                setSelectedId(null);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const data = e.dataTransfer.getData('application/json');
              if (data && canvasRef.current) {
                const field = JSON.parse(data);
                const rect = canvasRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left) / zoom;
                const y = (e.clientY - rect.top) / zoom;
                handleAddField(field, x, y);
              }
            }}
          >
            <div 
              className="canvas-zoom-wrapper"
              style={{
                width: `${pxWidth * zoom}px`,
                height: `${pxHeight * zoom}px`
              }}
            >
              <div 
                className="canvas-paper" 
                ref={canvasRef}
                style={{ 
                  width: `${pxWidth}px`, 
                  height: `${pxHeight}px`,
                  background: 'transparent',
                  boxShadow: 'none',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.2s ease',
                  marginTop: showRulers ? '20px' : '0',
                  marginLeft: showRulers ? '20px' : '0'
                }}
              >
                {/* Render the physical paper columns */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', gap: '4px', zIndex: 0 }}>
                  {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} style={{ flex: 1, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '4px' }} />
                  ))}
                </div>
            {showRulers && (
              <>
                <div className="ruler-x">
                  {Array.from({ length: labelWidth + 1 }).map((_, i) => (
                    <div key={i} className="ruler-tick-x" style={{ left: i * DPI, height: i % 10 === 0 ? '100%' : (i % 5 === 0 ? '50%' : '20%') }}>
                      {i % 10 === 0 && <span style={{position: 'absolute', left: 2, bottom: 2}}>{i}</span>}
                    </div>
                  ))}
                </div>
                <div className="ruler-y">
                  {Array.from({ length: labelHeight + 1 }).map((_, i) => (
                    <div key={i} className="ruler-tick-y" style={{ top: i * DPI, width: i % 10 === 0 ? '100%' : (i % 5 === 0 ? '50%' : '20%') }}>
                      {i % 10 === 0 && <span style={{position: 'absolute', top: 2, right: 2}}>{i}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Zero-Lag Smart Guides Container */}
            <div ref={guidesContainerRef} style={{ display: 'none' }}>
              <div ref={guideTopRef} className="smart-guide smart-guide-x" />
              <div ref={badgeTopRef} className="distance-badge" />
              <div ref={guideBottomRef} className="smart-guide smart-guide-x" />
              <div ref={badgeBottomRef} className="distance-badge" />
              <div ref={guideLeftRef} className="smart-guide smart-guide-y" />
              <div ref={badgeLeftRef} className="distance-badge" />
              <div ref={guideRightRef} className="smart-guide smart-guide-y" />
              <div ref={badgeRightRef} className="distance-badge" />
              <div ref={ghostHitboxRef} className="ghost-hitbox" style={{ display: 'none' }} />
            </div>

            {elements.map((el) => (
              <Rnd
                key={el.id}
                scale={zoom}
                size={{ width: el.width, height: el.height }}
                position={{ x: el.x, y: el.y }}
                onDrag={(e, d) => {
                  updateGuides(d.x, d.y, el.width, el.height, el.id);
                }}
                onDragStop={(e, d) => {
                  const { newX, newY } = calculateSnap(d.x, d.y, el.width, el.height, el.id);
                  updateElement(el.id, { x: newX, y: newY });
                  hideGuides();
                }}
                onResize={(e, direction, ref, delta, position) => {
                  updateGuides(position.x, position.y, parseInt(ref.style.width, 10), parseInt(ref.style.height, 10), el.id);
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateElement(el.id, {
                    width: parseInt(ref.style.width, 10),
                    height: parseInt(ref.style.height, 10),
                    ...position,
                  });
                  hideGuides();
                }}
                bounds="parent"
                className={`canvas-element ${selectedId === el.id ? 'selected' : ''} ${el.type === 'barcode' ? 'barcode-type' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                  updateGuides(el.x, el.y, el.width, el.height, el.id);
                }}
              >
                {el.type === 'text' && (
                  <div 
                    className="canvas-text" 
                    style={{ 
                      fontSize: `${el.fontSize}px`, 
                      fontFamily: 'monospace', 
                      fontWeight: el.bold ? 'bold' : 'normal',
                      fontStyle: el.italic ? 'italic' : 'normal',
                      transform: `rotate(${el.rotation || 0}deg)`,
                      transformOrigin: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    {el.staticText || `[${el.fieldName}]`}
                  </div>
                )}
                {el.type === 'barcode' && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    transform: `rotate(${el.rotation || 0}deg)`,
                    transformOrigin: 'center'
                  }}>
                    <div style={{ fontSize: '12px', background: '#fff', padding: '0 4px', alignSelf: 'flex-end', marginBottom: '-15px' }}>
                      {el.fieldName}
                    </div>
                  </div>
                )}
                {el.type === 'shape' && (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    border: `${el.thickness || 2}px solid #000`,
                    background: 'transparent'
                  }} />
                )}
              </Rnd>
            ))}
          </div>
            </div>
          </div>
        </div>

      {/* Right Sidebar - Properties */}
        <div className="editor-properties">
          <div className="properties-header">
            <Settings size={18} /> Propriedades
          </div>
          <div className="properties-body">
            {selectedElement ? (
              <>
                <div className="prop-group">
                  <label>Tipo de Elemento</label>
                  <select 
                    value={selectedElement.type} 
                    onChange={(e) => updateElement(selectedElement.id, { type: e.target.value })}
                  >
                    <option value="text">Texto Fixo / Campo STOR</option>
                    <option value="barcode">Código de Barras</option>
                    <option value="shape">Caixa / Linha</option>
                  </select>
                </div>
                
                {selectedElement.type !== 'shape' && (
                  <div className="prop-group">
                    <label>Texto Estático (Opcional)</label>
                    <input 
                      type="text" 
                      value={selectedElement.staticText} 
                      placeholder="Se vazio, usa o Campo STOR"
                      onChange={(e) => updateElement(selectedElement.id, { staticText: e.target.value })}
                    />
                    {selectedElement.staticText && (
                      <div style={{ marginTop: '4px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '11px', color: '#ef4444' }}>
                        <strong>Atenção:</strong> Este texto será impresso exatamente como digitado acima e <strong>NÃO</strong> puxará mais os dados dinâmicos da STOR (ignora a Tag original).
                      </div>
                    )}
                  </div>
                )}

                {selectedElement.type === 'shape' && (
                  <div className="prop-group">
                    <label>Espessura da Borda</label>
                    <input 
                      type="number" 
                      value={selectedElement.thickness || 2} 
                      onChange={(e) => updateElement(selectedElement.id, { thickness: Number(e.target.value) })}
                    />
                  </div>
                )}

                <div className="prop-group">
                  <label>Rotação</label>
                  <select 
                    value={selectedElement.rotation || 0} 
                    onChange={(e) => {
                      const newRot = Number(e.target.value);
                      const oldRot = selectedElement.rotation || 0;
                      const isOrthogonalChange = Math.abs(newRot - oldRot) === 90 || Math.abs(newRot - oldRot) === 270;
                      updateElement(selectedElement.id, { 
                        rotation: newRot,
                        ...(isOrthogonalChange ? { width: selectedElement.height, height: selectedElement.width } : {})
                      });
                    }}
                  >
                    <option value={0}>0° (Normal)</option>
                    <option value={90}>90° (Deitado Esq.)</option>
                    <option value={180}>180° (Invertido)</option>
                    <option value={270}>270° (Deitado Dir.)</option>
                  </select>
                </div>

                {selectedElement.type === 'text' && (
                  <>
                    <div className="prop-group">
                      <label>Tamanho da Fonte</label>
                      <input 
                        type="number" 
                        value={selectedElement.fontSize} 
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                      />
                    </div>
                    
                    <div className="prop-group">
                      <label>Estilo do Texto</label>
                      <div className="style-toggles">
                        <button 
                          className={`btn-style ${selectedElement.bold ? 'active' : ''}`}
                          onClick={() => updateElement(selectedElement.id, { bold: !selectedElement.bold })}
                          title="Negrito"
                        >
                          <Bold size={16} />
                        </button>
                        <button 
                          className={`btn-style ${selectedElement.italic ? 'active' : ''}`}
                          onClick={() => updateElement(selectedElement.id, { italic: !selectedElement.italic })}
                          title="Itálico"
                        >
                          <Italic size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="prop-row">
                  <div className="prop-group">
                    <label>X (px)</label>
                    <input type="number" value={Math.round(selectedElement.x)} onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })} />
                  </div>
                  <div className="prop-group">
                    <label>Y (px)</label>
                    <input type="number" value={Math.round(selectedElement.y)} onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="prop-row">
                  <div className="prop-group">
                    <label>Largura (px)</label>
                    <input type="number" value={Math.round(selectedElement.width)} onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })} />
                  </div>
                  <div className="prop-group">
                    <label>Altura (px)</label>
                    <input type="number" value={Math.round(selectedElement.height)} onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="prop-group" style={{ marginTop: '10px' }}>
                  <label>Tag ZPL/EPL Original</label>
                  <code style={{ fontSize: '11px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '4px' }}>
                    {selectedElement.tag}
                  </code>
                </div>

                {selectedElement.tamanho > 0 && !selectedElement.staticText && (
                  <div style={{ marginTop: '5px', padding: '10px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '6px', fontSize: '11px', color: '#eab308' }}>
                    <strong>Aviso:</strong> Se a informação do sistema vier com tamanho acima de {selectedElement.tamanho} caracteres, ela será cortada pela impressora.
                  </div>
                )}

                <button className="btn-delete" onClick={() => removeElement(selectedElement.id)}>
                  <Trash2 size={16} /> Excluir Elemento
                </button>
              </>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>
                Selecione um elemento no canvas para editar suas propriedades.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="export-modal-overlay">
            <motion.div 
              className={`export-modal ${theme}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="db-modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <h3><FileText size={20} style={{marginRight: '8px', verticalAlign: 'middle'}}/> Código Gerado ({printerType})</h3>
                <button className="close-btn" onClick={() => setShowExportModal(false)}><X size={20}/></button>
              </div>
              <textarea value={exportCode} readOnly />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => { navigator.clipboard.writeText(exportCode); alert("Copiado!") }}>Copiar</button>
                <button className="btn-primary" onClick={handleDownload}><Download size={16} style={{marginRight: '5px'}}/> Baixar Arquivo</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EditorEtiquetas;
