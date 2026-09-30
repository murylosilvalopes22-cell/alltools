import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BrainCircuit, CloudDownload, Settings, Search, Hash, Box, ExternalLink, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Copy, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import './NcmConsult.css';

const NcmConsult = ({ onBack, theme }) => {
  // Config States
  const [showConfig, setShowConfig] = useState(true);
  const [urls, setUrls] = useState({
    vigente: '',
    historica: '',
    futura: ''
  });
  const [tokens, setTokens] = useState({
    gemini: ''
  });

  // Data States
  const [csvData, setCsvData] = useState({ vigente: [], historica: [], futura: [] });
  const [basesCarregadas, setBasesCarregadas] = useState(0);
  const [isLoadingBases, setIsLoadingBases] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState({ vigente: '', historica: '', futura: '' });

  // Search States
  const [activeTab, setActiveTab] = useState('ncm'); // 'ncm', 'produto' or 'lote'
  const [searchVal, setSearchVal] = useState('');
  const [batchVal, setBatchVal] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Results States
  const [resultsNcm, setResultsNcm] = useState(null); // format: { ncm, matches, substitutos, brasilRes }
  const [resultsProd, setResultsProd] = useState(null);
  const [resultsBatch, setResultsBatch] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [geminiContext, setGeminiContext] = useState(null);

  // Load from LocalStorage
  useEffect(() => {
    const savedVigente = localStorage.getItem('ncm_url-vigente');
    const savedHistorica = localStorage.getItem('ncm_url-historica');
    const savedFutura = localStorage.getItem('ncm_url-futura');
    const savedGemini = localStorage.getItem('ncm_gemini-token');

    setUrls({
      vigente: savedVigente || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vStrqWGyGz_2eHWs3vtV01_LNX6gFxG6Ist7Kw1HkgigLD-37XlfJ6qgpfR04v6ow/pub?gid=841706911&single=true&output=csv',
      historica: savedHistorica || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vShpzC7-J6ZMPxNPp5lD1FifMIhC_Wb4SUGYVdr8QZnExEVfj1gSXh3cjmj5W680Q/pub?gid=2044435286&single=true&output=csv',
      futura: savedFutura || ''
    });
    setTokens({
      gemini: savedGemini || ''
    });
  }, []);

  // Save to LocalStorage
  const saveToLocal = (newUrls, newTokens) => {
    if (newUrls.vigente) localStorage.setItem('ncm_url-vigente', newUrls.vigente);
    if (newUrls.historica) localStorage.setItem('ncm_url-historica', newUrls.historica);
    if (newUrls.futura) localStorage.setItem('ncm_url-futura', newUrls.futura);
    if (newTokens.gemini) localStorage.setItem('ncm_gemini-token', newTokens.gemini);
  };

  const copiarNcm = (ncm) => {
    navigator.clipboard.writeText(ncm);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const limparNCM = (ncmRaw) => ncmRaw.replace(/\D/g, '');
  const formatarNCM = (ncm) => {
    if (!ncm) return 'N/A';
    if (ncm.length !== 8) return ncm;
    return `${ncm.slice(0, 4)}.${ncm.slice(4, 6)}.${ncm.slice(6, 8)}`;
  };

  const handleCarregarBases = async () => {
    saveToLocal(urls, tokens);
    setIsLoadingBases(true);
    let loadedCount = 0;
    const newCsvData = { vigente: [], historica: [], futura: [] };
    const newStatuses = { vigente: 'Baixando...', historica: 'Baixando...', futura: 'Baixando...' };
    setLoadingStatuses(newStatuses);

    for (const type of ['vigente', 'historica', 'futura']) {
      const url = urls[type];
      if (!url) {
        newStatuses[type] = 'Nenhum link fornecido.';
        setLoadingStatuses({ ...newStatuses });
        continue;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Falha ao acessar o link");
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            let dadosLimpos = results.data.filter(row => {
              const chaveCodigo = Object.keys(row).find(k => k.toLowerCase().includes('código') || k.toLowerCase().includes('codigo'));
              if (!chaveCodigo) return false;
              const val = row[chaveCodigo];
              return val && val.trim() !== '' && !val.includes('Atualizações') && !val.includes('Código') && /^\d/.test(val.trim());
            });

            newCsvData[type] = dadosLimpos.map(row => {
              const kCod = Object.keys(row).find(k => k.toLowerCase().includes('código') || k.toLowerCase().includes('codigo'));
              const kDesc = Object.keys(row).find(k => k.toLowerCase().includes('concatenada') || k.toLowerCase().includes('descrição'));
              const kIni = Object.keys(row).find(k => k.toLowerCase().includes('início'));
              const kFim = Object.keys(row).find(k => k.toLowerCase().includes('fim'));
              const kAto = Object.keys(row).find(k => k.toLowerCase().includes('ato legal início'));
              const kNum = Object.keys(row).find(k => k.toLowerCase().includes('número'));
              const kAno = Object.keys(row).find(k => k.toLowerCase().includes('ano'));
              
              return {
                'Código': row[kCod],
                'Descrição': row[kDesc],
                'Data Início': kIni ? row[kIni] : '',
                'Data Fim': kFim ? row[kFim] : '',
                'Ato Legal Início': kAto ? row[kAto] : '',
                'Número': kNum ? row[kNum] : '',
                'Ano': kAno ? row[kAno] : ''
              };
            });

            newStatuses[type] = `${newCsvData[type].length} itens baixados.`;
            setLoadingStatuses({ ...newStatuses });
            loadedCount++;
          },
          error: (err) => {
            newStatuses[type] = `Erro ao parsear CSV: ${err.message}`;
            setLoadingStatuses({ ...newStatuses });
          }
        });
      } catch (error) {
        newStatuses[type] = `Erro de conexão ou CORS.`;
        setLoadingStatuses({ ...newStatuses });
        console.error(error);
      }
    }

    setCsvData(newCsvData);
    setBasesCarregadas(loadedCount);
    setIsLoadingBases(false);
    if (loadedCount > 0) {
      setShowConfig(false);
    }
  };

  const fetchBrasilApi = async (ncm) => {
    try {
      const res = await fetch(`https://brasilapi.com.br/api/ncm/v1/${ncm}`);
      if (!res.ok) {
        if (res.status === 404) return { error: "Não encontrado na Brasil API." };
        throw new Error();
      }
      return await res.json();
    } catch (err) {
      return { error: "Falha na Brasil API" };
    }
  };


  const classificarComGemini = async (descricao, apiKey, localOptions = [], rejectedNcms = []) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    let promptContext = '';
    if (localOptions.length > 0) {
      promptContext = `\nAqui estão alguns NCMs da nossa base local que batem com a pesquisa do usuário:\n${localOptions.slice(0, 10).map(o => `- ${o['Código']} : ${o['Descrição']} (${o.base === 'vigente' ? 'VIGENTE' : 'OBSOLETO/NÃO USE'})`).join('\n')}\nConsidere fortemente as opções VIGENTES se elas forem corretas para o produto. NÃO sugira NCMs com status OBSOLETO.`;
    }
    
    let rejectContext = '';
    if (rejectedNcms.length > 0) {
      rejectContext = `\nATENÇÃO: Você sugeriu anteriormente os NCMs abaixo, mas eles são INVÁLIDOS pelas seguintes razões:\n${rejectedNcms.map(r => `- ${r.ncm}: ${r.reason}`).join('\n')}\nNão sugira eles novamente. Procure um substituto válido e que de fato exista na tabela oficial atual.`;
    }

    const prompt = `Você é um especialista em classificação fiscal aduaneira brasileira (Nomenclatura Comum do Mercosul - NCM).
O usuário vai te dar a descrição de um produto comercial.
Sua tarefa é encontrar o NCM mais adequado de 8 dígitos para este produto, que esteja VIGENTE E ATUALIZADO.${promptContext}${rejectContext}
Regras da resposta: Responda apenas com um JSON válido (sem markdown). Formato: {"ncm": "8 digitos", "descricao_oficial": "Desc da Receita", "justificativa": "Sua lógica"}
Produto a classificar: "${descricao}"`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } })
      });
      if (!response.ok) {
        if (response.status === 400) throw new Error("Chave do Gemini inválida.");
        throw new Error(`Erro API Gemini: ${response.status}`);
      }
      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) { return { error: error.message }; }
  };

  const handleSearchNcm = async (ncmOverride = null, preserveGemini = false) => {
    setErrorMsg('');
    if (!preserveGemini) setGeminiContext(null);
    const ncmLimpo = limparNCM(typeof ncmOverride === 'string' ? ncmOverride : searchVal);
    if (ncmLimpo.length < 4) {
      setErrorMsg("Digite pelo menos 4 dígitos para pesquisar.");
      return;
    }

    setIsSearching(true);
    setResultsNcm(null);
    setResultsProd(null);
    saveToLocal(urls, tokens);

    try {
      const matches = {
        vigente: csvData.vigente.find(r => limparNCM(r['Código']) === ncmLimpo),
        historica: csvData.historica.find(r => limparNCM(r['Código']) === ncmLimpo),
        futura: csvData.futura.find(r => limparNCM(r['Código']) === ncmLimpo)
      };

      let substitutos = [];
      if (!matches.vigente && (matches.historica || ncmLimpo.length === 8)) {
        const raiz = ncmLimpo.substring(0, 6);
        substitutos = csvData.vigente.filter(r => {
          const cod = limparNCM(r['Código']);
          return cod.length === 8 && cod.startsWith(raiz) && cod !== ncmLimpo;
        }).slice(0, 10);

        if (substitutos.length === 0 && ncmLimpo.length > 4) {
          const rc = ncmLimpo.substring(0, 4);
          substitutos = csvData.vigente.filter(r => {
            const cod = limparNCM(r['Código']);
            return cod.length === 8 && cod.startsWith(rc) && cod !== ncmLimpo;
          }).slice(0, 5);
        }
      }

      let brasilApiResult = (ncmLimpo.length === 8) ? await fetchBrasilApi(ncmLimpo) : { error: "Requer 8 dígitos." };
      
      setResultsNcm({ ncm: ncmLimpo, matches, substitutos, brasilRes: brasilApiResult });
    } catch (err) {
      setErrorMsg("Erro inesperado ao consultar as bases.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchProd = async () => {
    setErrorMsg('');
    if (searchVal.length < 3) {
      setErrorMsg("Digite pelo menos 3 caracteres.");
      return;
    }
    
    setIsSearching(true);
    setResultsNcm(null);
    setResultsProd(null);
    setResultsBatch(null);
    setGeminiContext(null);
    saveToLocal(urls, tokens);
    
    let prodRes = { gemini: null, brasil: null, local: [] };

    try {
      // 1. Local Search (Fuzzy/Text Match)
      const searchTerms = searchVal.toLowerCase().split(' ').filter(t => t.trim() !== '');
      const localMatches = [];
      
      const checkMatch = (row) => {
        const desc = (row['Descrição'] || '').toLowerCase();
        return searchTerms.every(term => desc.includes(term));
      };

      if (csvData.vigente) {
        csvData.vigente.forEach(r => { if(checkMatch(r)) localMatches.push({...r, base: 'vigente'}) });
      }
      if (csvData.historica) {
        csvData.historica.forEach(r => { if(checkMatch(r)) localMatches.push({...r, base: 'historica'}) });
      }
      
      prodRes.local = localMatches.slice(0, 15);

      // 2. Gemini with Local Context and Retry Loop
      if (tokens.gemini) {
        let attempts = 0;
        const MAX_ATTEMPTS = 3;
        let gRes = null;
        let rejectedNcms = [];
        
        while (attempts < MAX_ATTEMPTS) {
          gRes = await classificarComGemini(searchVal, tokens.gemini, prodRes.local, rejectedNcms);
          attempts++;
          
          if (gRes.error || !gRes.ncm) break;
          
          const ncmGemini = limparNCM(gRes.ncm);
          const matchVig = csvData.vigente.find(r => limparNCM(r['Código']) === ncmGemini);
          const matchHist = csvData.historica.find(r => limparNCM(r['Código']) === ncmGemini);
          
          let isInvalid = false;
          let invalidReason = '';

          if (matchHist && !matchVig) {
            isInvalid = true;
            invalidReason = "OBSOLETO (Consta apenas no histórico local)";
          }
          
          let bRes = null;
          if (!isInvalid && ncmGemini.length === 8) {
             try {
               bRes = await fetchBrasilApi(ncmGemini);
               if (!bRes.error && bRes.data_fim && new Date(bRes.data_fim) < new Date()) {
                 isInvalid = true;
                 invalidReason = "VENCIDO (Data de fim expirada na Brasil API)";
               }
             } catch(e) {}
          }

          if (!isInvalid && !matchVig && (!bRes || bRes.error)) {
             isInvalid = true;
             invalidReason = "INEXISTENTE (Não foi encontrado nem na tabela Vigente local nem na Brasil API)";
          }

          if (!isInvalid) {
            if (!matchVig && bRes && !bRes.error) {
              gRes.warning = "⚠️ Encontrado na Brasil API, mas ausente na tabela oficial vigente. Verifique com cuidado, a API pode estar desatualizada.";
            }
            break; // Found valid, exit loop
          }
          
          rejectedNcms.push({ ncm: ncmGemini, reason: invalidReason });
        }
        
        if (gRes && !gRes.error && rejectedNcms.length > 0) {
           gRes.justificativa = `(Nota: O sistema bloqueou automaticamente NCMs inválidos anteriores. Sugestão corrigida) ` + gRes.justificativa;
        }
        
        prodRes.gemini = gRes;
      } else {
        prodRes.gemini = { error: "Token Gemini ausente." };
      }

      try {
        const resBrasil = await fetch(`https://brasilapi.com.br/api/ncm/v1?search=${encodeURIComponent(searchVal)}`);
        if (resBrasil.ok) {
          prodRes.brasil = await resBrasil.json();
        }
      } catch (e) {
        prodRes.brasil = { error: "Erro Brasil API" };
      }

      setResultsProd(prodRes);
    } catch (err) {
      setErrorMsg("Erro inesperado ao pesquisar.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchLote = async () => {
    setErrorMsg('');
    if (!batchVal.trim()) {
      setErrorMsg("Cole pelo menos um NCM.");
      return;
    }

    setIsSearching(true);
    setResultsNcm(null);
    setResultsProd(null);
    setResultsBatch(null);
    
    const ncmArray = batchVal.split(/[\n,;\t]+/)
      .map(s => limparNCM(s))
      .filter(s => s.length >= 4);

    if (ncmArray.length === 0) {
      setErrorMsg("Nenhum NCM válido encontrado.");
      setIsSearching(false);
      return;
    }

    const limit = ncmArray.slice(0, 100);
    const results = [];

    for (const ncmRaw of limit) {
      let isCsvVigente = false;
      let descCsv = '';
      
      const matchVig = csvData.vigente.find(r => limparNCM(r['Código']) === ncmRaw);
      const matchHist = csvData.historica.find(r => limparNCM(r['Código']) === ncmRaw);
      
      if (matchVig) {
        isCsvVigente = true;
        descCsv = matchVig['Descrição'];
      } else if (matchHist) {
        descCsv = matchHist['Descrição'] + ' (Histórico)';
      }

      let resBrasil = { error: true };
      let isApiVigente = false;
      
      if (ncmRaw.length === 8) {
         try {
           const bRes = await fetchBrasilApi(ncmRaw);
           if (!bRes.error) {
             resBrasil = bRes;
             isApiVigente = (!bRes.data_fim || new Date(bRes.data_fim) > new Date());
           }
         } catch(e) {}
      }

      let finalStatus = 'INATIVO';
      let statusColor = 'red';
      let badgeClass = 'red';
      if (isCsvVigente && isApiVigente) {
        finalStatus = 'VIGENTE';
        statusColor = 'green';
        badgeClass = 'green';
      } else if (isApiVigente && !isCsvVigente) {
        finalStatus = 'DESATUALIZADO';
        statusColor = 'amber';
        badgeClass = 'amber';
      } else if (isCsvVigente && !isApiVigente) {
        finalStatus = 'ERRO API/SEFAZ';
        statusColor = 'red';
        badgeClass = 'red';
      } else if (resBrasil.error && !isCsvVigente) {
        finalStatus = 'NÃO ENCONTRADO';
        statusColor = 'gray';
        badgeClass = 'gray';
      }

      results.push({
        ncm: ncmRaw,
        desc: descCsv || resBrasil.descricao || 'N/A',
        status: finalStatus,
        color: statusColor,
        badgeClass: badgeClass
      });
    }

    setResultsBatch(results);
    setIsSearching(false);
  };

  const handleSearch = () => {
    if (activeTab === 'ncm') handleSearchNcm(null, false);
    else if (activeTab === 'produto') handleSearchProd();
    else handleSearchLote();
  };

  const setNcmFromList = (ncm) => {
    setSearchVal(ncm);
    setActiveTab('ncm');
    handleSearchNcm(ncm, false);
  };

  const renderBadgeLocal = (matches) => {
    if (matches.vigente) return <span className="badge green">Ativo (Vigente)</span>;
    if (matches.futura) return <span className="badge purple">Vigência Futura</span>;
    if (matches.historica) return <span className="badge amber">Inativo / Obsoleto</span>;
    return <span className="badge gray">Não Encontrado</span>;
  };

  return (
    <motion.div 
      className="ncm-app-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="ncm-wrapper">
        <div className="ncm-header">
          <div className="ncm-icon-wrapper">
            <BrainCircuit size={28} />
          </div>
          <h1>Consulta NCM + Nuvem</h1>
          <p className="subtitle">Bases do Governo, Substituição Tributária e IA Gemini</p>
        </div>

        {/* Configuration Section */}
        <div className="ncm-settings-section">
          <div className="ncm-settings-header" onClick={() => setShowConfig(!showConfig)}>
            <h3><Settings size={18} /> Bancos de Dados & APIs</h3>
            {showConfig ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          <AnimatePresence>
            {showConfig && (
              <motion.div 
                className="ncm-settings-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="setting-group">
                    <label>Link: Tabela Vigente (CSV)</label>
                    <input 
                      type="text" 
                      className="ncm-input" 
                      value={urls.vigente} 
                      onChange={e => setUrls({...urls, vigente: e.target.value})} 
                      placeholder="https://docs.google.com/...pub?output=csv"
                    />
                    <small style={{ color: 'var(--text-muted)' }}>{loadingStatuses.vigente}</small>
                  </div>
                  <div className="setting-group">
                    <label>Link: Tabela Histórica (CSV)</label>
                    <input 
                      type="text" 
                      className="ncm-input" 
                      value={urls.historica} 
                      onChange={e => setUrls({...urls, historica: e.target.value})} 
                      placeholder="https://docs.google.com/...pub?output=csv"
                    />
                    <small style={{ color: 'var(--text-muted)' }}>{loadingStatuses.historica}</small>
                  </div>
                  <div className="setting-group" style={{ gridColumn: '1 / -1' }}>
                    <label>API Key Gemini (IA)</label>
                    <input 
                      type="password" 
                      className="ncm-input" 
                      value={tokens.gemini} 
                      onChange={e => setTokens({...tokens, gemini: e.target.value})} 
                    />
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-load" onClick={handleCarregarBases} disabled={isLoadingBases}>
                    {isLoadingBases ? <RefreshCw className="animate-spin" size={18} /> : <CloudDownload size={18} />}
                    {isLoadingBases ? 'Carregando...' : 'Carregar Bases'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Section */}
        <div className="ncm-search-section">
          {basesCarregadas === 0 && (
            <div className="block-search-overlay">
              <AlertTriangle />
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Busca Bloqueada</h3>
              <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>Carregue pelo menos uma base na etapa acima.</p>
            </div>
          )}

          <div className="ncm-tabs">
            <button className={`ncm-tab ${activeTab === 'ncm' ? 'active' : ''}`} onClick={() => setActiveTab('ncm')}>
              <Hash size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
              Por Código NCM
            </button>
            <button className={`ncm-tab ${activeTab === 'produto' ? 'active' : ''}`} onClick={() => setActiveTab('produto')}>
              <Box size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
              Por Nome (IA e Oficial)
            </button>
            <button className={`ncm-tab ${activeTab === 'lote' ? 'active' : ''}`} onClick={() => setActiveTab('lote')}>
              <RefreshCw size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
              Em Lote
            </button>
          </div>

          {activeTab !== 'lote' ? (
            <div className="search-row">
              <input 
                type="text" 
                className="ncm-input"
                placeholder={activeTab === 'ncm' ? "Digite o NCM (apenas números)" : "Digite o NOME do produto..."}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button id="btn-do-search" className="btn-search" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                Consultar
              </button>
            </div>
          ) : (
            <div className="batch-search-row">
              <textarea 
                className="ncm-textarea"
                placeholder="Cole múltiplos NCMs aqui (separados por vírgula ou linha)..."
                value={batchVal}
                onChange={(e) => setBatchVal(e.target.value)}
              />
              <button id="btn-do-search-batch" className="btn-search" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                Consultar Lote
              </button>
            </div>
          )}
          
          {errorMsg && (
            <div style={{ marginTop: '16px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Results Area */}
        {isSearching && (
          <div className="loader-container">
            <div className="spinner"></div>
            <span>{activeTab === 'produto' && !geminiContext ? "Rodando IA Gemini..." : "Analisando bases..."}</span>
          </div>
        )}

        {/* NCM RESULTS */}
        {resultsNcm && !isSearching && (
          <div className="results-grid">
            
            {/* Gemini Context Override if Present */}
            {geminiContext && (
              <div className="result-card" style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(236, 72, 153, 0.05))', borderColor: 'rgba(79, 70, 229, 0.2)', marginBottom: '8px' }}>
                <div className="result-card-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(79, 70, 229, 0.1)' }}>
                  <span style={{ color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px' }}><BrainCircuit size={16}/> Classificação Automática Gemini</span>
                </div>
                <div className="result-card-body">
                  <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{geminiContext.descricao_oficial}</p>
                  <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{geminiContext.justificativa}"</p>
                </div>
              </div>
            )}

            {/* Hero NCM */}
            <div className="result-hero">
              <div className="hero-ncm-info">
                <span className="hero-label">NCM Consultado</span>
                <h2 className="hero-ncm-number">{formatarNCM(resultsNcm.ncm)}</h2>
              </div>
              <button 
                className="btn-copy-hero" 
                onClick={() => copiarNcm(resultsNcm.ncm)}
                style={{ background: copied ? '#10b981' : 'var(--primary-ncm)' }}
              >
                {copied ? (
                  <><CheckCircle size={20} /> Copiado!</>
                ) : (
                  <><Copy size={20} /> Copiar</>
                )}
              </button>
            </div>

            {/* Status Receita */}
            <div className="result-card">
              <div className="result-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>Status nas Tabelas Receita (CSVs)</span>
                  {renderBadgeLocal(resultsNcm.matches)}
                </div>
              </div>
              <div className="result-card-body">
                {['vigente', 'futura', 'historica'].map(t => {
                  const m = resultsNcm.matches[t];
                  if (!m) return null;
                  return (
                    <div key={t} className="local-item">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t.toUpperCase()}
                        {t === 'vigente' && <CheckCircle size={14} color="#10b981" />}
                      </h4>
                      <p>{m['Descrição']}</p>
                      <small><b>Validade:</b> {m['Data Início'] || 'N/A'} até {m['Data Fim'] || 'N/A'}</small>
                    </div>
                  );
                })}
                {!resultsNcm.matches.vigente && !resultsNcm.matches.futura && !resultsNcm.matches.historica && (
                  <p>Não encontrado nos CSVs locais.</p>
                )}
              </div>
            </div>

            {/* Substitutes */}
            {resultsNcm.substitutos.length > 0 && (
              <div className="result-card" style={{ gridColumn: '1 / -1' }}>
                <div className="result-card-header" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <span style={{ color: '#f59e0b' }}>Possíveis NCMs Substitutos (Mesma Raiz)</span>
                </div>
                <div className="result-card-body" style={{ padding: 0 }}>
                  <table className="substitutos-table">
                    <thead>
                      <tr>
                        <th style={{ color: 'var(--text-secondary)' }}>NCM</th>
                        <th style={{ color: 'var(--text-secondary)' }}>Descrição</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultsNcm.substitutos.map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{formatarNCM(limparNCM(s['Código']))}</td>
                          <td>{s['Descrição']}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-load" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setNcmFromList(limparNCM(s['Código']))}>Analisar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Brasil API */}
            <div className="result-card brasil-api-card" style={{ gridColumn: '1 / -1' }}>
              <div className="result-card-header" style={{ background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                  <CheckCircle size={20} /> Validação API BRASIL
                </span>
              </div>
              <div className="result-card-body">
                {resultsNcm.brasilRes?.error ? (
                  <p style={{ color: '#f59e0b' }}>{resultsNcm.brasilRes.error}</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <small style={{ color: 'var(--text-muted)' }}>Descrição Oficial</small>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{resultsNcm.brasilRes?.descricao}</p>
                    </div>
                    <div>
                      <small style={{ color: 'var(--text-muted)' }}>Status de Vigência</small>
                      <div style={{ marginTop: '8px' }}>
                        {(() => {
                          const isApiVigente = (!resultsNcm.brasilRes?.data_fim || new Date(resultsNcm.brasilRes.data_fim) > new Date());
                          const isCsvVigente = !!resultsNcm.matches.vigente;
                          
                          if (isApiVigente && !isCsvVigente) {
                            return <span className="badge amber" style={{ fontSize: '1rem', padding: '6px 12px' }}>Consulta Não atualizada (Fora da Tabela)</span>;
                          }
                          if (isApiVigente) {
                            return <span className="badge green" style={{ fontSize: '1rem', padding: '6px 12px' }}>Ativo (VIGENTE) na SEFAZ</span>;
                          }
                          return <span className="badge red" style={{ fontSize: '1rem', padding: '6px 12px' }}>Inativo (Expirado)</span>;
                        })()}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Período oficial: {resultsNcm.brasilRes?.data_inicio} até {resultsNcm.brasilRes?.data_fim || 'Atual'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* PROD RESULTS */}
        {resultsProd && !isSearching && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            

            {/* Gemini Result */}
            {resultsProd.gemini && (
              <div className="result-card" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(236, 72, 153, 0.05))', borderColor: 'rgba(79, 70, 229, 0.2)' }}>
                <div className="result-card-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(79, 70, 229, 0.1)' }}>
                  <span style={{ color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px' }}><BrainCircuit size={16}/> Sugestão Gemini</span>
                </div>
                <div className="result-card-body">
                  {resultsProd.gemini.error ? (
                    <p style={{ color: '#ef4444' }}>{resultsProd.gemini.error}</p>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 12px', fontSize: '2rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{formatarNCM(resultsProd.gemini.ncm)}</h3>
                        <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{resultsProd.gemini.descricao_oficial}</p>
                        <p style={{ margin: '0 0 8px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{resultsProd.gemini.justificativa}"</p>
                        {resultsProd.gemini.warning && (
                          <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderLeft: '4px solid #f59e0b', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                            {resultsProd.gemini.warning}
                          </div>
                        )}
                      </div>
                      <button className="btn-load" style={{ background: '#ec4899', flexShrink: 0 }} onClick={() => setNcmFromList(resultsProd.gemini.ncm)}>Validar NCM</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Local CSV Result */}
            {resultsProd.local && resultsProd.local.length > 0 && (
              <div className="result-card">
                <div className="result-card-header" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ color: '#10b981' }}>Resultados Locais (CSVs carregados)</span>
                </div>
                <div className="result-card-body" style={{ padding: 0 }}>
                  <table className="substitutos-table">
                    <tbody>
                      {resultsProd.local.map((n, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{formatarNCM(limparNCM(n['Código']))}</td>
                          <td>
                            {n['Descrição']}
                            {n.base === 'historica' && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#f59e0b' }}>(Histórico)</span>}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-load" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setNcmFromList(limparNCM(n['Código']))}>Analisar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Brasil API Result */}
            {resultsProd.brasil && resultsProd.brasil.length > 0 && (
              <div className="result-card">
                <div className="result-card-header" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <span style={{ color: '#3b82f6' }}>Base Oficial TIPI (Busca Textual Brasil API)</span>
                </div>
                <div className="result-card-body" style={{ padding: 0 }}>
                  <table className="substitutos-table">
                    <tbody>
                      {resultsProd.brasil.slice(0, 5).map((n, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{formatarNCM(n.codigo)}</td>
                          <td>{n.descricao}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-load" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setNcmFromList(n.codigo)}>Analisar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* BATCH RESULTS */}
        {resultsBatch && !isSearching && (
          <div className="result-card">
            <div className="result-card-header" style={{ background: 'transparent', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Resultados do Lote ({resultsBatch.length} processados)</span>
            </div>
            <div className="result-card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="batch-table">
                <thead>
                  <tr>
                    <th>NCM</th>
                    <th>Status</th>
                    <th>Descrição Encontrada</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resultsBatch.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatarNCM(item.ncm)}</td>
                      <td><span className={`badge ${item.badgeClass}`} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>{item.status}</span></td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-load" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setNcmFromList(item.ncm)}>Detalhar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default NcmConsult;
