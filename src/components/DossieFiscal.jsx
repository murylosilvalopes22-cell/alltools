import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, CheckCircle2, XCircle, AlertTriangle, Building2, MapPin, ShieldAlert, Smartphone } from 'lucide-react';
import './DossieFiscal.css'; // We'll create this or use inline classes

const DossieFiscal = ({ onBack, theme }) => {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [dadosResumo, setDadosResumo] = useState(null);
  
  const [api1Status, setApi1Status] = useState('idle'); // idle, loading, success, error
  const [api1Data, setApi1Data] = useState(null);
  
  const [api2Status, setApi2Status] = useState('idle');
  const [api2Data, setApi2Data] = useState(null);
  
  const [api3Status, setApi3Status] = useState('idle');
  const [api3Data, setApi3Data] = useState(null);
  
  const [copied, setCopied] = useState(false);

  const formatCnpj = (value) => {
    return value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18);
  };

  const handleCnpjChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCnpj(formatCnpj(raw));
    
    // Reset states if typing
    if (dadosResumo) {
      setDadosResumo(null);
      setApi1Status('idle'); setApi2Status('idle'); setApi3Status('idle');
      setApi1Data(null); setApi2Data(null); setApi3Data(null);
      setStatusMsg('');
    }
  };

  const isCnpjValido = (c) => {
    const b = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const s = c.replace(/[^\d]/g, "");
    if(s.length !== 14 || /^[0-9]{1}\1+$/.test(s)) return false;
    for (let i = 12, n = 0; i < 14; i++) {
        n = 0;
        for (let j = 0; j < i; j++) n += s[j] * b[b.length - i + j];
        n = 11 - n % 11;
        n = n >= 10 ? 0 : n;
        if (s[i] != n) return false;
    }
    return true;
  };

  const fetchCNPJws = async (cnpjLimpo) => {
    setApi1Status('loading');
    try {
      const res = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjLimpo}`);
      if (!res.ok) throw new Error("Erro CNPJ.ws");
      const dados = await res.json();
      setApi1Data(dados);
      setApi1Status('success');
      return dados.estabelecimento?.cep;
    } catch (err) {
      setApi1Status('error');
      return null;
    }
  };

  const fetchBrasilAPI = async (cnpjLimpo) => {
    setApi2Status('loading');
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!res.ok) throw new Error("Erro BrasilAPI");
      const dados = await res.json();
      setApi2Data(dados);
      setApi2Status('success');
      return dados.cep;
    } catch (err) {
      setApi2Status('error');
      return null;
    }
  };

  const fetchViaCEP = async (cep) => {
    setApi3Status('loading');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      if (!res.ok) throw new Error("Erro ViaCEP");
      const dados = await res.json();
      if (dados.erro) throw new Error("CEP não encontrado");
      setApi3Data(dados);
      setApi3Status('success');
    } catch (err) {
      setApi3Status('error');
    }
  };

  const iniciarBuscas = async () => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (!isCnpjValido(cnpjLimpo)) {
      setStatusMsg('❌ CNPJ Inválido.');
      return;
    }

    setLoading(true);
    setStatusMsg('🚀 Consultando bases...');
    setApi1Data(null); setApi2Data(null); setApi3Data(null);
    setApi1Status('idle'); setApi2Status('idle'); setApi3Status('idle');

    let cepEncontrado = null;

    const [cep1, cep2] = await Promise.all([
      fetchCNPJws(cnpjLimpo),
      fetchBrasilAPI(cnpjLimpo)
    ]);

    cepEncontrado = cep1 || cep2;

    if (cepEncontrado) {
      await fetchViaCEP(cepEncontrado);
    } else {
      setApi3Status('error');
    }

    setStatusMsg('✅ Consultas finalizadas!');
    setLoading(false);
    
    // Preparar resumo
    setDadosResumo({ cnpj });
  };

  const copiarResumoZap = () => {
    let textoZap = `*📋 RESUMO DE CADASTRO - STOR*\n`;
    textoZap += `*CNPJ:* ${cnpj}\n`;
    
    const razao = api2Data?.razao_social || 'Não encontrada';
    textoZap += `*Razão Social:* ${razao}\n`;
    
    const status = api2Data?.descricao_situacao_cadastral || 'Desconhecido';
    const iconeStatus = status === 'ATIVA' ? '🟢' : '🔴';
    textoZap += `*Status Receita:* ${iconeStatus} ${status}\n`;
    
    const motivo = api2Data?.descricao_motivo_situacao_cadastral;
    if (motivo && motivo !== 'SEM MOTIVO') {
        textoZap += `*Motivo (Se baixada):* ${motivo}\n`;
    }

    const simples = api1Data?.simples ? (api1Data.simples.optante_simples === 'S' ? 'SIM' : 'NÃO') : 'Desconhecido';
    textoZap += `*Simples Nacional:* ${simples}\n`;
    
    const endereco = api3Data ? `${api3Data.logradouro}, ${api3Data.bairro} - ${api3Data.localidade}/${api3Data.uf} (CEP: ${api3Data.cep})` : 'Não localizado';
    textoZap += `*Endereço:* ${endereco}\n`;
    
    textoZap += `\n_Por favor, verifique se os dados batem com a operação antes de emitir a nota._`;

    navigator.clipboard.writeText(textoZap).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className={`dossie-container ${theme}`}>
      <div className="dossie-header-row">
        </div>

      <div className="dossie-content">
        <div className="dossie-title-area">
          <h2>Dossiê Fiscal Inteligente</h2>
          <p>Consulta integrada em CNPJ.ws, BrasilAPI e ViaCEP.</p>
        </div>

        <div className="dossie-search-box">
          <input 
            type="text" 
            placeholder="00.000.000/0000-00" 
            value={cnpj}
            onChange={handleCnpjChange}
            onKeyPress={(e) => e.key === 'Enter' && iniciarBuscas()}
            maxLength={18}
          />
          <button onClick={iniciarBuscas} disabled={loading} className="search-btn">
            {loading ? <div className="loader-small"></div> : <><Search size={20}/> Consultar</>}
          </button>
        </div>

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
                <span><Building2 size={16}/> Dados Tributários (CNPJ.ws)</span>
                {api1Status === 'loading' && <div className="loader-tiny"></div>}
                {api1Status === 'success' && <CheckCircle2 size={16}/>}
                {api1Status === 'error' && <XCircle size={16}/>}
              </div>
              <div className="api-card-body">
                {api1Status === 'loading' && <div className="loading-text">Buscando dados...</div>}
                {api1Status === 'error' && <div className="error-text">Falha na consulta.</div>}
                {api1Status === 'success' && api1Data && (
                  <div className="data-list">
                    <DataRow label="Simples Nacional" value={api1Data.simples?.optante_simples === 'S' ? 'SIM' : 'NÃO'} badge={api1Data.simples?.optante_simples === 'S' ? 'success' : 'danger'} />
                    <DataRow label="É MEI?" value={api1Data.simples?.optante_mei === 'S' ? 'SIM' : 'NÃO'} badge={api1Data.simples?.optante_mei === 'S' ? 'success' : 'danger'} />
                    <DataRow label="Cód. IBGE" value={api1Data.estabelecimento?.cidade?.ibge_id || '-'} />
                    <DataRow label="Insc. Estadual" value={api1Data.estabelecimento?.inscricoes_estaduais?.length > 0 ? api1Data.estabelecimento.inscricoes_estaduais[0].inscricao_estadual : 'Isento'} />
                    <DataRow label="Capital Social" value={parseFloat(api1Data.capital_social || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} />
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: BrasilAPI */}
            <div className="api-card">
              <div className="api-card-header bg-teal">
                <span><ShieldAlert size={16}/> Situação e QSA (BrasilAPI)</span>
                {api2Status === 'loading' && <div className="loader-tiny"></div>}
                {api2Status === 'success' && <CheckCircle2 size={16}/>}
                {api2Status === 'error' && <XCircle size={16}/>}
              </div>
              <div className="api-card-body">
                {api2Status === 'loading' && <div className="loading-text">Buscando dados...</div>}
                {api2Status === 'error' && <div className="error-text">Falha na consulta.</div>}
                {api2Status === 'success' && api2Data && (
                  <div className="data-list">
                    <DataRow label="Razão Social" value={api2Data.razao_social} />
                    <DataRow label="Status Receita" value={api2Data.descricao_situacao_cadastral} badge={api2Data.descricao_situacao_cadastral === 'ATIVA' ? 'success' : 'danger'} />
                    <DataRow label="Motivo Baixa" value={api2Data.descricao_motivo_situacao_cadastral !== 'SEM MOTIVO' ? api2Data.descricao_motivo_situacao_cadastral : '-'} isDanger={api2Data.descricao_motivo_situacao_cadastral !== 'SEM MOTIVO'} />
                    <DataRow label="Sócios (QSA)" value={api2Data.qsa?.length > 0 ? api2Data.qsa.map(s => s.nome_socio).join('\n') : 'Não informado'} />
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: ViaCEP */}
            <div className="api-card">
              <div className="api-card-header bg-emerald">
                <span><MapPin size={16}/> Endereço Oficial (ViaCEP)</span>
                {api3Status === 'loading' && <div className="loader-tiny"></div>}
                {api3Status === 'success' && <CheckCircle2 size={16}/>}
                {api3Status === 'error' && <XCircle size={16}/>}
              </div>
              <div className="api-card-body">
                {api3Status === 'idle' && <div className="loading-text">Aguardando CEP...</div>}
                {api3Status === 'loading' && <div className="loading-text">Buscando dados...</div>}
                {api3Status === 'error' && <div className="error-text">Endereço não localizado.</div>}
                {api3Status === 'success' && api3Data && (
                  <div className="data-list">
                    <DataRow label="CEP Base" value={api3Data.cep} />
                    <DataRow label="Logradouro" value={api3Data.logradouro} />
                    <DataRow label="Bairro" value={api3Data.bairro} />
                    <DataRow label="Cidade/UF" value={`${api3Data.localidade} / ${api3Data.uf}`} />
                    <DataRow label="IBGE (Correios)" value={api3Data.ibge} />
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {dadosResumo && (
          <motion.button 
            className="whatsapp-btn"
            onClick={copiarResumoZap}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Smartphone size={20}/> {copied ? '✅ Copiado! Cole no WhatsApp (Ctrl+V)' : '📱 Copiar Resumo para WhatsApp'}
          </motion.button>
        )}
      </div>
    </div>
  );
};

// Componente auxiliar para as linhas de dados
const DataRow = ({ label, value, badge, isDanger }) => {
  return (
    <div className="data-row">
      <span className="data-label">{label}:</span>
      <span className={`data-value whitespace-pre-line break-words ${isDanger ? 'text-danger' : ''}`}>
        {badge ? (
          <span className={`data-badge badge-${badge}`}>{value}</span>
        ) : (
          value
        )}
      </span>
    </div>
  );
};

export default DossieFiscal;
