import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, UploadCloud, ChevronLeft, ChevronRight, Server, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import './VersoesSistemas.css';

const ITEMS_PER_PAGE = 50;

const VersoesSistemas = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [globalData, setGlobalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  const [cidades, setCidades] = useState([]);
  const [sistemas, setSistemas] = useState([]);
  const [versoes, setVersoes] = useState([]);

  const [page, setPage] = useState(0);
  const [filterCidade, setFilterCidade] = useState('');
  const [filterSistema, setFilterSistema] = useState('');
  const [filterVersao, setFilterVersao] = useState('');

  const fileInputRef = useRef(null);

  // Filtra os dados com base nos dropdowns
  useEffect(() => {
    if (globalData.length === 0) return;

    const result = globalData.filter(item => {
      return (
        (!filterCidade || item.cidade === filterCidade) &&
        (!filterSistema || item.sistema === filterSistema) &&
        (!filterVersao || item.versao === filterVersao)
      );
    });

    setFilteredData(result);
    setPage(0); // Volta para primeira página ao filtrar
  }, [filterCidade, filterSistema, filterVersao, globalData]);

  const processarDados = (rows) => {
    const dados = [];
    let cidadeAtual = '';

    rows.forEach(row => {
      const linhaTexto = row.map(c => String(c).trim());

      // Detecta cidade
      const indiceCidade = linhaTexto.findIndex(c => c.toUpperCase().includes('CIDADE:'));

      if (indiceCidade !== -1) {
        const celula = linhaTexto[indiceCidade].trim();
        
        let novaCidade = '';
        if (celula.toUpperCase() === 'CIDADE:') {
          novaCidade = linhaTexto.slice(indiceCidade + 1).find(c => c.trim() !== '');
        } else {
          // Caso a cidade esteja na mesma célula: "CIDADE: SÃO PAULO"
          const idx = celula.toUpperCase().indexOf('CIDADE:');
          novaCidade = celula.substring(idx + 7).trim();
          if (!novaCidade) {
            novaCidade = linhaTexto.slice(indiceCidade + 1).find(c => c.trim() !== '');
          }
        }
        
        if (novaCidade) {
          cidadeAtual = novaCidade.trim();
        }
        return;
      }

      const numero = linhaTexto[1] || '';
      const sistema = linhaTexto[3] || '';
      const nome = linhaTexto[6] || '';
      const endereco = linhaTexto[9] || '';
      const servidor = linhaTexto[12] || '';
      const versao = linhaTexto[15] || '';
      const status = linhaTexto[16] || '';

      if (
        numero &&
        sistema &&
        nome &&
        versao &&
        numero !== 'Num.'
      ) {
        dados.push({
          numero,
          cidade: cidadeAtual,
          sistema,
          nome,
          endereco,
          servidor,
          versao,
          status
        });
      }
    });

    // Povoar os filtros com valores únicos e ordenados
    setCidades([...new Set(dados.map(d => d.cidade).filter(Boolean))].sort());
    setSistemas([...new Set(dados.map(d => d.sistema).filter(Boolean))].sort());
    setVersoes([...new Set(dados.map(d => d.versao).filter(Boolean))].sort());

    setGlobalData(dados);
    setFilteredData(dados);
    setFilterCidade('');
    setFilterSistema('');
    setFilterVersao('');
    setPage(0);
    setLoading(false);
  };

  const carregarArquivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: ''
        });

        setTimeout(() => processarDados(rows), 100);
      } catch (error) {
        alert("Erro ao ler o arquivo Excel: " + error.message);
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <motion.div 
      className="versoes-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="versoes-header">
        <h2><Server size={24} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }}/> Consulta de Sistemas</h2>
      </div>

      {globalData.length === 0 ? (
        <div className="versoes-upload-card">
          <label className="upload-label" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud size={64} color="#10b981" />
            <span>Selecione a planilha de sistemas do DESK (.xls ou .xlsx)</span>
            <div className="upload-btn">Escolher Arquivo</div>
          </label>
          <input 
            type="file" 
            ref={fileInputRef}
            className="file-input-hidden" 
            accept=".xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={carregarArquivo}
          />
        </div>
      ) : (
        <>
          <div className="versoes-filters">
            <select 
              className="filter-select"
              value={filterCidade}
              onChange={(e) => setFilterCidade(e.target.value)}
            >
              <option value="">Todas as cidades</option>
              {cidades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              className="filter-select"
              value={filterSistema}
              onChange={(e) => setFilterSistema(e.target.value)}
            >
              <option value="">Todos os sistemas</option>
              {sistemas.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select 
              className="filter-select"
              value={filterVersao}
              onChange={(e) => setFilterVersao(e.target.value)}
            >
              <option value="">Todas as versões</option>
              {versoes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="pagination-container">
            <span>
              Mostrando <b>{currentData.length > 0 ? filteredData.length : 0}</b> clientes encontrados (Total arquivo: {globalData.length})
            </span>
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || totalPages === 0}
              >
                <ChevronLeft size={18} /> Anterior
              </button>
              <span>Página {totalPages === 0 ? 0 : page + 1} de {totalPages}</span>
              <button 
                className="page-btn" 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || totalPages === 0}
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
            <table className="versoes-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cidade</th>
                  <th>Sistema</th>
                  <th>Nome</th>
                  <th>Endereço</th>
                  <th>Servidor</th>
                  <th>Versão</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.numero}</td>
                      <td>{item.cidade}</td>
                      <td>{item.sistema}</td>
                      <td>{item.nome}</td>
                      <td>{item.endereco}</td>
                      <td>{item.servidor}</td>
                      <td>{item.versao}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                      Nenhum registro encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default VersoesSistemas;
