import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileCode2, Download, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import './LeitorXML.css';

const LeitorXML = ({ onBack }) => {
  const [totais, setTotais] = useState({ vNF: 0, vBC: 0, vICMS: 0, count: 0 });
  const [resumo, setResumo] = useState([]);
  const [notas, setNotas] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const format = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const processFiles = async (files) => {
    if (files.length === 0) return;

    let t = { vNF: 0, vBC: 0, vICMS: 0, count: 0 };
    let consolidado = {};
    let listaNotas = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.xml')) continue;
      
      try {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        const nNF = xmlDoc.getElementsByTagName("nNF")[0]?.textContent || "N/A";
        let chNFe = xmlDoc.getElementsByTagName("chNFe")[0]?.textContent;
        if (!chNFe) {
          chNFe = xmlDoc.getElementsByTagName("infNFe")[0]?.getAttribute("Id")?.replace("NFe", "") || "N/A";
        }
        
        const vNF = parseFloat(xmlDoc.getElementsByTagName("vNF")[0]?.textContent || 0);
        
        let notaBase = 0;
        let notaIcms = 0;

        const itens = xmlDoc.getElementsByTagName("det");
        for (let item of itens) {
          const cfop = item.getElementsByTagName("CFOP")[0]?.textContent;
          const pICMS = item.getElementsByTagName("pICMS")[0]?.textContent;
          const vBCItem = parseFloat(item.getElementsByTagName("vBC")[0]?.textContent || 0);
          const vICMSItem = parseFloat(item.getElementsByTagName("vICMS")[0]?.textContent || 0);

          if (cfop) {
            const aliq = pICMS ? parseFloat(pICMS).toFixed(2) : "0.00";
            const chave = `${cfop}_${aliq}`;

            if (!consolidado[chave]) {
              consolidado[chave] = { cfop: cfop, aliq: aliq, bc: 0, icms: 0 };
            }
            consolidado[chave].bc += vBCItem;
            consolidado[chave].icms += vICMSItem;
            
            notaBase += vBCItem;
            notaIcms += vICMSItem;
          }
        }

        t.vNF += vNF;
        t.vBC += notaBase;
        t.vICMS += notaIcms;
        t.count += 1;

        listaNotas.push({ 
          chave: chNFe, 
          numero: nNF, 
          total: vNF, 
          base: notaBase, 
          icms: notaIcms 
        });

      } catch (err) {
        console.error("Erro ao ler arquivo:", file.name, err);
      }
    }

    setTotais(t);
    setResumo(Object.values(consolidado).sort((a, b) => a.cfop.localeCompare(b.cfop) || b.aliq - a.aliq));
    setNotas(listaNotas);
  };

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const exportExcel = () => {
    if (notas.length === 0) return;
    const wb = XLSX.utils.book_new();
    
    const wsNotasData = notas.map(n => ({
      "Chave de Acesso": n.chave,
      "Nº Nota": n.numero,
      "Valor Total (vNF)": n.total,
      "Base ICMS Itens": n.base,
      "Valor ICMS Itens": n.icms
    }));
    const wsNotas = XLSX.utils.json_to_sheet(wsNotasData);

    const wsResumoData = resumo.map(r => ({
      "CFOP": r.cfop,
      "Alíquota %": parseFloat(r.aliq),
      "Soma Base de Cálculo": r.bc,
      "Soma Valor ICMS": r.icms
    }));
    const wsResumo = XLSX.utils.json_to_sheet(wsResumoData);

    XLSX.utils.book_append_sheet(wb, wsNotas, "Relação de Notas");
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Impostos");

    XLSX.writeFile(wb, "Relatorio_Fiscal_Stor.xlsx");
  };

  return (
    <motion.div 
      className="leitor-xml-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="leitor-header">
        <div>
          <h1><FileCode2 className="icon" size={32} color="#38bdf8" /> Leitor XML Fiscal</h1>
          <p>Consolidação por CFOP e Alíquota com exportação XLSX</p>
        </div>
        {notas.length > 0 && (
          <button className="btn-primary" onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Exportar Excel
          </button>
        )}
      </div>

      <label 
        className={`upload-card ${isDragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input type="file" multiple accept=".xml" onChange={handleFileChange} style={{ display: 'none' }} />
        <UploadCloud size={48} color={isDragActive ? "#38bdf8" : "var(--text-secondary)"} />
        <p>Importar Arquivos XML</p>
        <span>Arraste ou clique para selecionar</span>
      </label>

      {notas.length > 0 && (
        <div className="leitor-dashboard">
          <div className="leitor-metrics">
            <div className="metric-card blue">
              <h3>Total Notas ({totais.count})</h3>
              <p className="value">{format(totais.vNF)}</p>
            </div>
            <div className="metric-card teal">
              <h3>Total Base ICMS</h3>
              <p className="value">{format(totais.vBC)}</p>
            </div>
            <div className="metric-card orange">
              <h3>Total Valor ICMS</h3>
              <p className="value">{format(totais.vICMS)}</p>
            </div>
          </div>

          <div className="leitor-table-container">
            <div className="leitor-table-header">
              <h2>Resumo por CFOP e Alíquota</h2>
            </div>
            <div className="leitor-table-wrapper">
              <table className="leitor-table">
                <thead>
                  <tr>
                    <th>CFOP</th>
                    <th className="center">Alíquota (%)</th>
                    <th className="numeric">Base de Cálculo</th>
                    <th className="numeric">Valor ICMS</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#38bdf8' }}>{item.cfop}</td>
                      <td className="center">{parseFloat(item.aliq).toFixed(2)}%</td>
                      <td className="numeric">{format(item.bc)}</td>
                      <td className="numeric" style={{ color: '#f97316' }}>{format(item.icms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="leitor-table-container">
            <div className="leitor-table-header">
              <h2>Relação Detalhada das Notas</h2>
            </div>
            <div className="leitor-table-wrapper">
              <table className="leitor-table">
                <thead>
                  <tr>
                    <th>Chave de Acesso</th>
                    <th className="center">Nº Nota</th>
                    <th className="numeric">Valor Total</th>
                    <th className="numeric">Base ICMS</th>
                    <th className="numeric">Vlr. ICMS</th>
                  </tr>
                </thead>
                <tbody>
                  {notas.map((n, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{n.chave}</td>
                      <td className="center" style={{ fontWeight: 'bold' }}>{n.numero}</td>
                      <td className="numeric">{format(n.total)}</td>
                      <td className="numeric" style={{ color: '#14b8a6' }}>{format(n.base)}</td>
                      <td className="numeric" style={{ color: '#f97316' }}>{format(n.icms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LeitorXML;
