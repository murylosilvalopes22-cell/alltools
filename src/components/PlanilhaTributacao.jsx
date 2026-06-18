import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UploadCloud, ChevronLeft, ChevronRight, FileSpreadsheet, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import './PlanilhaTributacao.css';

const COLUMNS_TO_REMOVE = [
  "Stat. Ncm",
  "Stat. Cest",
  "Status CFOP NFC-e",
  "Status Nat. Rec."
];

const ITEMS_PER_PAGE = 50;

const PlanilhaTributacao = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState([]);
  const [globalData, setGlobalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({});
  const [debouncedFilters, setDebouncedFilters] = useState({});

  const fileInputRef = useRef(null);

  // Implementa debounce na pesquisa
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);
    return () => clearTimeout(handler);
  }, [filters]);

  // Aplica os filtros
  useEffect(() => {
    if (globalData.length === 0) return;

    let result = globalData;
    const filterKeys = Object.keys(debouncedFilters);
    
    if (filterKeys.length > 0) {
      result = globalData.filter(row => {
        for (let i = 0; i < filterKeys.length; i++) {
          const colIndex = filterKeys[i];
          // Remove pontos da pesquisa e da célula para comparar CFOPs, NCMs, etc ignorando formatação
          const filterVal = debouncedFilters[colIndex].toLowerCase().trim().replace(/\./g, '');
          if (filterVal) {
            const cellVal = (row[colIndex] || "").toLowerCase().replace(/\./g, '');
            if (!cellVal.includes(filterVal)) {
              return false;
            }
          }
        }
        return true;
      });
    }

    setFilteredData(result);
    setPage(0); // Volta para primeira página ao filtrar
  }, [debouncedFilters, globalData]);

  const processData = (data) => {
    let headerIndex = -1;
    for (let i = 0; i < data.length; i++) {
      const rowStr = data[i].join(" ");
      if (rowStr.includes("Identificação") && rowStr.includes("Produto")) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      alert("Não foi possível encontrar a linha de cabeçalho padrão ('Identificação', 'Produto') na planilha. Verifique o formato.");
      setLoading(false);
      return;
    }

    const rawHeader = data[headerIndex];
    const allowedColumnsIndices = [];
    const newHeaders = [];

    for (let i = 0; i < rawHeader.length; i++) {
      const colName = rawHeader[i] ? String(rawHeader[i]).trim() : "";
      if (colName !== "" && !COLUMNS_TO_REMOVE.includes(colName)) {
        allowedColumnsIndices.push(i);
        newHeaders.push(colName);
      }
    }

    const newData = [];
    for (let i = headerIndex + 1; i < data.length; i++) {
      const row = data[i];
      const filledCells = row.filter(cell => cell !== undefined && cell !== "").length;
      if (filledCells < 3) continue;

      let filteredRow = [];
      for (let j = 0; j < allowedColumnsIndices.length; j++) {
        filteredRow.push(row[allowedColumnsIndices[j]] !== undefined ? String(row[allowedColumnsIndices[j]]) : "");
      }
      newData.push(filteredRow);
    }

    setHeaders(newHeaders);
    setGlobalData(newData);
    setFilteredData(newData);
    setFilters({});
    setDebouncedFilters({});
    setPage(0);
    setLoading(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xls') || fileName.endsWith('.xlsx');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          
          setTimeout(() => processData(jsonData), 100);
        } catch (error) {
          alert("Erro ao ler o arquivo Excel: " + error.message);
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        complete: (results) => {
          setTimeout(() => processData(results.data), 100);
        },
        error: (err) => {
          alert("Erro ao ler o arquivo CSV: " + err.message);
          setLoading(false);
        },
        encoding: "ISO-8859-1",
        skipEmptyLines: true
      });
    }
  };

  const handleFilterChange = (colIndex, value) => {
    setFilters(prev => ({ ...prev, [colIndex]: value }));
  };

  // Paginação
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <motion.div 
      className="tributacao-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="tributacao-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} /> Voltar ao Dashboard
        </button>
        <h2><FileSpreadsheet size={24} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }}/> Visualizador de Tributação</h2>
      </div>

      {globalData.length === 0 ? (
        <div className="tributacao-upload-card">
          <label className="upload-label" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud size={64} color="#a855f7" />
            <span>Selecione a planilha do Stor (.xls, .xlsx ou .csv)</span>
            <div className="upload-btn">Escolher Arquivo</div>
          </label>
          <input 
            type="file" 
            ref={fileInputRef}
            className="file-input-hidden" 
            accept=".csv, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileUpload}
          />
        </div>
      ) : (
        <>
          <div className="pagination-container">
            <span>
              Mostrando <b>{currentData.length}</b> de <b>{filteredData.length}</b> registros (Total arquivo: {globalData.length})
            </span>
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft size={18} /> Anterior
              </button>
              <span>Página {page + 1} de {Math.max(1, totalPages)}</span>
              <button 
                className="page-btn" 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Próxima <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            {loading && (
              <div className="loading-overlay">
                <Loader2 size={48} className="spin" />
                Processando arquivo...
              </div>
            )}
            <table className="tributacao-table">
              <thead>
                <tr>
                  {headers.map((headerText, index) => (
                    <th key={index}>
                      <div className="th-content">
                        <span className="th-title" title={headerText}>{headerText}</span>
                        <input 
                          type="text" 
                          className="filter-input" 
                          placeholder="Filtrar..."
                          value={filters[index] || ''}
                          onChange={(e) => handleFilterChange(index, e.target.value)}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default PlanilhaTributacao;
