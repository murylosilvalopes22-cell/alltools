import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, CheckCircle2, XCircle, Building2, MapPin, ShieldAlert,
  Smartphone, Copy, Check, Clock, Globe2, Hash
} from 'lucide-react';
import './DossieFiscal.css';

const UFS_BRASIL = [
  'MT', 'RO', 'SP', 'PR', 'GO', 'MS', 'PA',
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF',
  'ES', 'MA', 'MG', 'PB', 'PE', 'PI', 'RJ',
  'RN', 'RS', 'RR', 'SC', 'SE', 'TO'
];

const RECENT_CNPJS_KEY = 'dossie_recent_cnpjs';

const formatCnpj = (value) => {
  return String(value || '')
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

const formatCep = (value) => {
  return String(value || '')
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
};

const isCnpjValido = (c) => {
  const b = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const s = c.replace(/[^\d]/g, '');
  if (s.length !== 14 || /^[0-9]{1}\1+$/.test(s)) return false;
  for (let i = 12, n = 0; i < 14; i++) {
    n = 0;
    for (let j = 0; j < i; j++) n += s[j] * b[b.length - i + j];
    n = 11 - (n % 11);
    n = n >= 10 ? 0 : n;
    if (String(s[i]) !== String(n)) return false;
  }
  return true;
};

const DossieFiscal = ({ theme }) => {
  const [activeTab, setActiveTab] = useState('cnpj'); // 'cnpj' | 'ibge'

  // Aba 1: Auditoria de CNPJ
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [dadosResumo, setDadosResumo] = useState(null);

  const [api1Status, setApi1Status] = useState('idle');
  const [api1Data, setApi1Data] = useState(null);

  const [api2Status, setApi2Status] = useState('idle');
  const [api2Data, setApi2Data] = useState(null);

  const [api3Status, setApi3Status] = useState('idle');
  const [api3Data, setApi3Data] = useState(null);

  const [copied, setCopied] = useState(false);
  const [recentCnpjs, setRecentCnpjs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_CNPJS_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  // Aba 2: CEP & Código IBGE (ViaCEP + API Oficial IBGE)
  const [cepInput, setCepInput] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [cepResult, setCepResult] = useState(null);

  const [selectedUf, setSelectedUf] = useState('MT');
  const [cityQuery, setCityQuery] = useState('');
  const [ibgeCache, setIbgeCache] = useState({});
  const [ibgeLoading, setIbgeLoading] = useState(false);
  const [ibgeError, setIbgeError] = useState('');
  const [copiedIbgeCode, setCopiedIbgeCode] = useState('');

  useEffect(() => {
    if (activeTab !== 'ibge') return;
    if (ibgeCache[selectedUf]) return;

    let cancelled = false;
    const fetchMunicipios = async () => {
      setIbgeLoading(true);
      setIbgeError('');
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`);
        if (!res.ok) throw new Error('Falha ao consultar API do IBGE');
        const list = await res.json();
        if (!cancelled) {
          const sorted = (Array.isArray(list) ? list : []).sort((a, b) =>
            (a.nome || '').localeCompare(b.nome || '')
          );
          setIbgeCache((prev) => ({ ...prev, [selectedUf]: sorted }));
        }
      } catch (err) {
        if (!cancelled) {
          setIbgeError('Não foi possível carregar os municípios do IBGE para esta UF.');
        }
      } finally {
        if (!cancelled) setIbgeLoading(false);
      }
    };

    fetchMunicipios();
    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedUf, ibgeCache]);

  const filteredCities = useMemo(() => {
    const list = ibgeCache[selectedUf] || [];
    if (!cityQuery.trim()) return list.slice(0, 60);
    const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const q = norm(cityQuery);
    return list.filter((m) => norm(m.nome).includes(q) || String(m.id).includes(q)).slice(0, 80);
  }, [ibgeCache, selectedUf, cityQuery]);

  const handleCnpjChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCnpj(formatCnpj(raw));

    if (dadosResumo) {
      setDadosResumo(null);
      setApi1Status('idle'); setApi2Status('idle'); setApi3Status('idle');
      setApi1Data(null); setApi2Data(null); setApi3Data(null);
      setStatusMsg('');
    }
  };

  const fetchCNPJws = async (cnpjLimpo) => {
    setApi1Status('loading');
    try {
      const res = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjLimpo}`);
      if (!res.ok) throw new Error('Erro CNPJ.ws');
      const dados = await res.json();
      setApi1Data(dados);
      setApi1Status('success');
      return { cep: dados.estabelecimento?.cep, data: dados };
    } catch {
      setApi1Status('error');
      return { cep: null, data: null };
    }
  };

  const fetchBrasilAPI = async (cnpjLimpo) => {
    setApi2Status('loading');
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!res.ok) throw new Error('Erro BrasilAPI');
      const dados = await res.json();
      setApi2Data(dados);
      setApi2Status('success');
      return { cep: dados.cep, data: dados };
    } catch {
      setApi2Status('error');
      return { cep: null, data: null };
    }
  };

  const fetchViaCEP = async (cep) => {
    setApi3Status('loading');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      if (!res.ok) throw new Error('Erro ViaCEP');
      const dados = await res.json();
      if (dados.erro) throw new Error('CEP não encontrado');
      setApi3Data(dados);
      setApi3Status('success');
    } catch {
      setApi3Status('error');
    }
  };

  const saveRecentCnpj = (formattedCnpj, nome) => {
    setRecentCnpjs((prev) => {
      const cleanNew = formattedCnpj.replace(/\D/g, '');
      const filtered = prev.filter((item) => item.cnpj.replace(/\D/g, '') !== cleanNew);
      const next = [{ cnpj: formattedCnpj, nome: nome || 'Consulta CNPJ' }, ...filtered].slice(0, 6);
      localStorage.setItem(RECENT_CNPJS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const iniciarBuscas = async (overrideCnpj = null) => {
    const targetFormatted = typeof overrideCnpj === 'string' ? formatCnpj(overrideCnpj) : cnpj;
    if (typeof overrideCnpj === 'string') {
      setCnpj(targetFormatted);
    }

    const cnpjLimpo = targetFormatted.replace(/\D/g, '');
    if (!isCnpjValido(cnpjLimpo)) {
      setStatusMsg('❌ CNPJ Inválido.');
      return;
    }

    setLoading(true);
    setStatusMsg('🚀 Consultando bases públicas...');
    setApi1Data(null); setApi2Data(null); setApi3Data(null);
    setApi1Status('idle'); setApi2Status('idle'); setApi3Status('idle');

    const [res1, res2] = await Promise.all([
      fetchCNPJws(cnpjLimpo),
      fetchBrasilAPI(cnpjLimpo)
    ]);

    const cepEncontrado = res1.cep || res2.cep;

    if (cepEncontrado) {
      await fetchViaCEP(cepEncontrado);
    } else {
      setApi3Status('error');
    }

    const razaoEncontrada =
      res2.data?.nome_fantasia ||
      res2.data?.razao_social ||
      res1.data?.estabelecimento?.nome_fantasia ||
      res1.data?.razao_social;

    if (res1.data || res2.data) {
      saveRecentCnpj(targetFormatted, razaoEncontrada);
      setStatusMsg('✅ Consultas finalizadas!');
    } else {
      setStatusMsg('⚠️ Não foi possível obter retorno das APIs para este CNPJ.');
    }

    setLoading(false);
    setDadosResumo({ cnpj: targetFormatted });
  };

  const handleSearchCep = async () => {
    const cepLimpo = cepInput.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setCepError('Informe um CEP válido com 8 dígitos.');
      setCepResult(null);
      return;
    }

    setCepLoading(true);
    setCepError('');
    setCepResult(null);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!res.ok) throw new Error('Erro ViaCEP');
      const data = await res.json();
      if (data.erro) {
        setCepError('CEP não encontrado na base do ViaCEP.');
      } else {
        setCepResult(data);
        if (data.uf && UFS_BRASIL.includes(data.uf)) {
          setSelectedUf(data.uf);
        }
      }
    } catch {
      setCepError('Falha de conexão ao consultar ViaCEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleCopyIbgeCode = (code) => {
    navigator.clipboard.writeText(String(code)).then(() => {
      setCopiedIbgeCode(String(code));
      setTimeout(() => setCopiedIbgeCode(''), 1500);
    });
  };

  const razaoSocialDisplay = api2Data?.razao_social || api1Data?.razao_social || '-';
  const nomeFantasiaDisplay = api2Data?.nome_fantasia || api1Data?.estabelecimento?.nome_fantasia || '-';
  const statusReceitaDisplay = api2Data?.descricao_situacao_cadastral || api1Data?.estabelecimento?.situacao_cadastral || 'Desconhecido';
  const motivoBaixaDisplay =
    (api2Data?.descricao_motivo_situacao_cadastral && api2Data.descricao_motivo_situacao_cadastral !== 'SEM MOTIVO'
      ? api2Data.descricao_motivo_situacao_cadastral
      : api1Data?.estabelecimento?.motivo_situacao_cadastral?.descricao) || '-';
  const cnaeDisplay = api2Data?.cnae_fiscal_descricao || api1Data?.estabelecimento?.atividade_principal?.descricao || '-';
  const telefoneDisplay =
    api2Data?.ddd_telefone_1 ||
    (api1Data?.estabelecimento?.ddd1 && api1Data?.estabelecimento?.telefone1
      ? `(${api1Data.estabelecimento.ddd1}) ${api1Data.estabelecimento.telefone1}`
      : '-');
  const emailDisplay = api1Data?.estabelecimento?.email || api2Data?.email || '-';
  const ieDisplay =
    api1Data?.estabelecimento?.inscricoes_estaduais?.length > 0
      ? api1Data.estabelecimento.inscricoes_estaduais
          .map((ie) => `${ie.inscricao_estadual}${ie.estado?.sigla ? ` (${ie.estado.sigla})` : ''}`)
          .join(', ')
      : 'Isento / Não informado';

  const copiarResumoZap = () => {
    let textoZap = `*📋 RESUMO DE CADASTRO - STOR*\n`;
    textoZap += `*CNPJ:* ${cnpj}\n`;
    textoZap += `*Razão Social:* ${razaoSocialDisplay !== '-' ? razaoSocialDisplay : 'Não encontrada'}\n`;
    if (nomeFantasiaDisplay !== '-') {
      textoZap += `*Nome Fantasia:* ${nomeFantasiaDisplay}\n`;
    }

    const iconeStatus = String(statusReceitaDisplay).toUpperCase().includes('ATIV') ? '🟢' : '🔴';
    textoZap += `*Status Receita:* ${iconeStatus} ${statusReceitaDisplay}\n`;

    if (motivoBaixaDisplay !== '-') {
      textoZap += `*Motivo (Se baixada):* ${motivoBaixaDisplay}\n`;
    }

    const simples = api1Data?.simples
      ? (api1Data.simples.optante_simples === 'S' ? 'SIM' : 'NÃO')
      : (api2Data?.opcao_pelo_simples === true ? 'SIM' : api2Data?.opcao_pelo_simples === false ? 'NÃO' : 'Desconhecido');
    textoZap += `*Simples Nacional:* ${simples}\n`;

    if (ieDisplay !== 'Isento / Não informado') {
      textoZap += `*Insc. Estadual:* ${ieDisplay}\n`;
    }

    const endereco = api3Data
      ? `${api3Data.logradouro}, ${api3Data.bairro} - ${api3Data.localidade}/${api3Data.uf} (CEP: ${api3Data.cep} | IBGE: ${api3Data.ibge})`
      : api2Data?.logradouro
        ? `${api2Data.descricao_tipo_de_logradouro || ''} ${api2Data.logradouro}, ${api2Data.numero || 'S/N'} - ${api2Data.municipio}/${api2Data.uf} (CEP: ${api2Data.cep})`.trim()
        : 'Não localizado';
    textoZap += `*Endereço:* ${endereco}\n`;

    textoZap += `\n_Por favor, verifique se os dados batem com a operação antes de emitir a nota._`;

    navigator.clipboard.writeText(textoZap).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className={`dossie-container ${theme}`}>
      <div className="dossie-header-row" />

      <div className="dossie-content">
        <div className="dossie-title-area">
          <h2>Dossiê Fiscal Inteligente</h2>
          <p>Consulta integrada em CNPJ.ws, BrasilAPI, ViaCEP e API Oficial do IBGE.</p>
        </div>

        <div className="dossie-tabs">
          <button
            type="button"
            className={`dossie-tab-btn ${activeTab === 'cnpj' ? 'active' : ''}`}
            onClick={() => setActiveTab('cnpj')}
          >
            <Building2 size={16} /> Auditoria de CNPJ
          </button>
          <button
            type="button"
            className={`dossie-tab-btn ${activeTab === 'ibge' ? 'active' : ''}`}
            onClick={() => setActiveTab('ibge')}
          >
            <Globe2 size={16} /> Consulta CEP &amp; Cód. IBGE
          </button>
        </div>

        {activeTab === 'cnpj' ? (
          <>
            <div className="dossie-search-box">
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={handleCnpjChange}
                onKeyDown={(e) => e.key === 'Enter' && iniciarBuscas()}
                maxLength={18}
              />
              <button onClick={() => iniciarBuscas()} disabled={loading} className="search-btn">
                {loading ? <div className="loader-small" /> : <><Search size={20} /> Consultar</>}
              </button>
            </div>

            {recentCnpjs.length > 0 && (
              <div className="recent-cnpj-chips">
                <span className="recent-cnpj-label"><Clock size={13} /> Recentes:</span>
                {recentCnpjs.map((item) => (
                  <button
                    key={item.cnpj}
                    type="button"
                    className="recent-cnpj-chip"
                    onClick={() => iniciarBuscas(item.cnpj)}
                    title={item.nome}
                  >
                    <strong>{item.cnpj}</strong>
                    <span>{item.nome}</span>
                  </button>
                ))}
              </div>
            )}

            {statusMsg && (
              <div className="status-message">
                {statusMsg}
              </div>
            )}

            {(api1Status !== 'idle' || api2Status !== 'idle' || api3Status !== 'idle') && (
              <motion.div
                className="api-results-grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Card 1: CNPJ.ws */}
                <div className="api-card">
                  <div className="api-card-header bg-purple">
                    <span><Building2 size={16} /> Dados Tributários (CNPJ.ws)</span>
                    {api1Status === 'loading' && <div className="loader-tiny" />}
                    {api1Status === 'success' && <CheckCircle2 size={16} />}
                    {api1Status === 'error' && <XCircle size={16} />}
                  </div>
                  <div className="api-card-body">
                    {api1Status === 'loading' && <div className="loading-text">Buscando dados...</div>}
                    {api1Status === 'error' && (
                      <div className="data-list">
                        <div className="error-text" style={{ padding: '6px 0' }}>CNPJ.ws indisponível no momento.</div>
                        {api2Status === 'success' && api2Data && (
                          <>
                            <DataRow label="Simples (Fallback)" value={api2Data.opcao_pelo_simples ? 'SIM' : 'NÃO'} badge={api2Data.opcao_pelo_simples ? 'success' : 'danger'} />
                            <DataRow label="É MEI? (Fallback)" value={api2Data.opcao_pelo_mei ? 'SIM' : 'NÃO'} badge={api2Data.opcao_pelo_mei ? 'success' : 'danger'} />
                            <DataRow label="Cód. IBGE (Fallback)" value={api2Data.codigo_municipio_ibge || '-'} />
                          </>
                        )}
                      </div>
                    )}
                    {api1Status === 'success' && api1Data && (
                      <div className="data-list">
                        <DataRow label="Simples Nacional" value={api1Data.simples?.optante_simples === 'S' ? 'SIM' : 'NÃO'} badge={api1Data.simples?.optante_simples === 'S' ? 'success' : 'danger'} />
                        <DataRow label="É MEI?" value={api1Data.simples?.optante_mei === 'S' ? 'SIM' : 'NÃO'} badge={api1Data.simples?.optante_mei === 'S' ? 'success' : 'danger'} />
                        <DataRow label="Cód. IBGE" value={api1Data.estabelecimento?.cidade?.ibge_id || '-'} />
                        <DataRow label="Insc. Estadual" value={ieDisplay} />
                        <DataRow label="Capital Social" value={parseFloat(api1Data.capital_social || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 2: BrasilAPI */}
                <div className="api-card">
                  <div className="api-card-header bg-teal">
                    <span><ShieldAlert size={16} /> Situação e QSA (BrasilAPI)</span>
                    {api2Status === 'loading' && <div className="loader-tiny" />}
                    {api2Status === 'success' && <CheckCircle2 size={16} />}
                    {api2Status === 'error' && <XCircle size={16} />}
                  </div>
                  <div className="api-card-body">
                    {api2Status === 'loading' && <div className="loading-text">Buscando dados...</div>}
                    {api2Status === 'error' && api1Status !== 'success' && <div className="error-text">Falha na consulta.</div>}
                    {((api2Status === 'success' && api2Data) || (api2Status === 'error' && api1Status === 'success' && api1Data)) && (
                      <div className="data-list">
                        <DataRow label="Razão Social" value={razaoSocialDisplay} />
                        <DataRow label="Nome Fantasia" value={nomeFantasiaDisplay} />
                        <DataRow label="Status Receita" value={statusReceitaDisplay} badge={String(statusReceitaDisplay).toUpperCase().includes('ATIV') ? 'success' : 'danger'} />
                        <DataRow label="Motivo Baixa" value={motivoBaixaDisplay} isDanger={motivoBaixaDisplay !== '-'} />
                        <DataRow label="CNAE Principal" value={cnaeDisplay} />
                        <DataRow label="Telefone" value={telefoneDisplay} />
                        <DataRow label="E-mail" value={emailDisplay} />
                        {api2Data?.qsa && (
                          <DataRow label="Sócios (QSA)" value={api2Data.qsa.length > 0 ? api2Data.qsa.map((s) => s.nome_socio).join('\n') : 'Não informado'} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: ViaCEP */}
                <div className="api-card">
                  <div className="api-card-header bg-emerald">
                    <span><MapPin size={16} /> Endereço Oficial (ViaCEP)</span>
                    {api3Status === 'loading' && <div className="loader-tiny" />}
                    {api3Status === 'success' && <CheckCircle2 size={16} />}
                    {api3Status === 'error' && <XCircle size={16} />}
                  </div>
                  <div className="api-card-body">
                    {api3Status === 'idle' && <div className="loading-text">Aguardando CEP...</div>}
                    {api3Status === 'loading' && <div className="loading-text">Buscando dados...</div>}
                    {api3Status === 'error' && (
                      <div className="data-list">
                        <div className="error-text" style={{ padding: '6px 0' }}>ViaCEP não localizado.</div>
                        {api2Data?.logradouro && (
                          <>
                            <DataRow label="CEP (Receita)" value={api2Data.cep || '-'} />
                            <DataRow label="Logradouro" value={`${api2Data.logradouro}, ${api2Data.numero || 'S/N'}`} />
                            <DataRow label="Bairro" value={api2Data.bairro || '-'} />
                            <DataRow label="Cidade/UF" value={`${api2Data.municipio} / ${api2Data.uf}`} />
                          </>
                        )}
                      </div>
                    )}
                    {api3Status === 'success' && api3Data && (
                      <div className="data-list">
                        <DataRow label="CEP Base" value={api3Data.cep} />
                        <DataRow label="Logradouro" value={api3Data.logradouro || '-'} />
                        <DataRow label="Bairro" value={api3Data.bairro || '-'} />
                        <DataRow label="Cidade/UF" value={`${api3Data.localidade} / ${api3Data.uf}`} />
                        <DataRow label="IBGE (Correios)" value={api3Data.ibge} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {(api1Status === 'success' || api2Status === 'success' || api3Status === 'success') && (
              <p className="copy-hint-caption">Dica: clique em qualquer campo acima para copiar o valor em 1 clique.</p>
            )}

            {dadosResumo && (
              <motion.button
                className="whatsapp-btn"
                onClick={copiarResumoZap}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Smartphone size={20} /> {copied ? '✅ Copiado! Cole no WhatsApp (Ctrl+V)' : '📱 Copiar Resumo para WhatsApp'}
              </motion.button>
            )}
          </>
        ) : (
          <div className="ibge-mode-grid">
            {/* Painel Esquerdo: Consulta CEP via ViaCEP */}
            <div className="api-card">
              <div className="api-card-header bg-emerald">
                <span><MapPin size={16} /> Buscar Endereço &amp; IBGE por CEP (ViaCEP)</span>
              </div>
              <div className="api-card-body">
                <div className="ibge-cep-row">
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={cepInput}
                    onChange={(e) => setCepInput(formatCep(e.target.value))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchCep()}
                    maxLength={9}
                  />
                  <button type="button" onClick={handleSearchCep} disabled={cepLoading} className="search-btn compact-search-btn">
                    {cepLoading ? <div className="loader-small" /> : <><Search size={17} /> Buscar</>}
                  </button>
                </div>

                {cepError && <div className="error-text">{cepError}</div>}

                {cepResult ? (
                  <div className="data-list" style={{ marginTop: '14px' }}>
                    <DataRow label="CEP" value={cepResult.cep} />
                    <DataRow label="Logradouro" value={cepResult.logradouro || '-'} />
                    <DataRow label="Bairro" value={cepResult.bairro || '-'} />
                    <DataRow label="Cidade / UF" value={`${cepResult.localidade} / ${cepResult.uf}`} />
                    <DataRow label="DDD" value={cepResult.ddd || '-'} />
                    <DataRow label="Código IBGE" value={cepResult.ibge || '-'} badge="success" />
                  </div>
                ) : (
                  !cepError && (
                    <div className="loading-text">Digite o CEP do cliente para obter o logradouro e o código IBGE de 7 dígitos.</div>
                  )
                )}
              </div>
            </div>

            {/* Painel Direito: Municípios Oficiais via API do IBGE */}
            <div className="api-card">
              <div className="api-card-header bg-purple">
                <span><Hash size={16} /> Municípios Oficiais por UF (API IBGE)</span>
              </div>
              <div className="api-card-body">
                <div className="ibge-search-panel">
                  <select
                    value={selectedUf}
                    onChange={(e) => setSelectedUf(e.target.value)}
                    aria-label="Selecionar Estado (UF)"
                  >
                    {UFS_BRASIL.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Filtrar município ou código IBGE..."
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                  />
                </div>

                {ibgeLoading && <div className="loading-text">Carregando municípios de {selectedUf} no IBGE...</div>}
                {ibgeError && <div className="error-text">{ibgeError}</div>}

                {!ibgeLoading && !ibgeError && (
                  <div className="ibge-results-list">
                    {filteredCities.length === 0 ? (
                      <div className="loading-text">Nenhum município encontrado para "{cityQuery}".</div>
                    ) : (
                      filteredCities.map((city) => {
                        const isCopied = copiedIbgeCode === String(city.id);
                        return (
                          <button
                            key={city.id}
                            type="button"
                            className={`ibge-city-item ${isCopied ? 'copied' : ''}`}
                            onClick={() => handleCopyIbgeCode(city.id)}
                            title={`Clique para copiar o código IBGE de ${city.nome}`}
                          >
                            <span className="ibge-city-name">{city.nome}</span>
                            <span className="ibge-city-code">
                              {city.id}
                              {isCopied ? <Check size={14} /> : <Copy size={13} />}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente auxiliar para as linhas de dados com cópia em 1 clique
const DataRow = ({ label, value, badge, isDanger }) => {
  const [rowCopied, setRowCopied] = useState(false);
  const strVal = value == null ? '' : String(value).trim();
  const isCopyable =
    strVal !== '' &&
    strVal !== '-' &&
    strVal !== 'Não informado' &&
    strVal !== 'Isento / Não informado';

  const handleCopyRow = () => {
    if (!isCopyable) return;
    navigator.clipboard.writeText(strVal).then(() => {
      setRowCopied(true);
      setTimeout(() => setRowCopied(false), 1500);
    });
  };

  return (
    <div
      className={`data-row ${isCopyable ? 'copyable' : ''}`}
      onClick={handleCopyRow}
      title={isCopyable ? 'Clique para copiar este dado' : undefined}
    >
      <span className="data-label">{label}:</span>
      <span className={`data-value whitespace-pre-line break-words ${isDanger ? 'text-danger' : ''}`}>
        {rowCopied ? (
          <span className="copied-inline-tag"><Check size={12} /> Copiado!</span>
        ) : badge ? (
          <span className={`data-badge badge-${badge}`}>{value}</span>
        ) : (
          value
        )}
      </span>
    </div>
  );
};

export default DossieFiscal;
