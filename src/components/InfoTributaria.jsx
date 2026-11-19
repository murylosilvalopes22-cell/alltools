import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calculator, AlertTriangle, Building2, ChevronRight, FileText, Search, Copy, Check } from 'lucide-react';
import './InfoTributaria.css';

const TAX_DATA = {
  MEI: {
    description: "NO MEI ELES NÃO SÃO OBRIGADOS A EMITIR NOTAS, MAS SE FOR EMITIR VAI PRECISAR DESSAS INFORMAÇÕES.",
    nfe: "NÃO (via de regra)",
    nfce: "NÃO (via de regra)",
    pisCofins: "PIS: 0% | COFINS: 0%",
    cstLabel: "CSOSN ICMS",
    rules: [
      { cst: "102 - Tributada", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102" },
      { cst: "500 - Substituição Trib.", saidaEst: "5405", saidaNac: "6403", entEst: "1403", entNac: "2403" },
      { cst: "400 - Isento", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102" },
      { cst: "900 - Outros", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102" },
    ]
  },
  SIMPLES: {
    description: "Regime tributário simplificado e favorecido. Alíquotas variam conforme faturamento.",
    nfe: "SIM",
    nfce: "SIM",
    pisCofins: "PIS: 0% | COFINS: 0%",
    cstLabel: "CSOSN ICMS",
    rules: [
      { cst: "102 - Garantido Integral", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102", devSaidaEst: "5202", devSaidaNac: "6202", devEntEst: "1202", devEntNac: "2202" },
      { cst: "500 - Substituição Trib.", saidaEst: "5405", saidaNac: "6403", entEst: "1403", entNac: "2403", devSaidaEst: "5411", devSaidaNac: "6411", devEntEst: "1411", devEntNac: "2411" },
      { cst: "400 - Isento", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102", devSaidaEst: "5202", devSaidaNac: "6202", devEntEst: "1202", devEntNac: "2202" },
      { cst: "900 - Outros", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102", devSaidaEst: "5202", devSaidaNac: "6202", devEntEst: "1202", devEntNac: "2202" },
    ]
  },
  PRESUMIDO: {
    description: "Apuração baseada em margem de lucro pré-fixada pela legislação.",
    nfe: "SIM",
    nfce: "SIM",
    pisCofins: "PIS: 0.65% | COFINS: 3%",
    cstLabel: "CST ICMS",
    rules: [
      { cst: "00 - Garantido Integral", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102", devSaidaEst: "5202", devSaidaNac: "6202", devEntEst: "1202", devEntNac: "2202" },
      { cst: "60 - Substituição Trib.", saidaEst: "5405", saidaNac: "6403", entEst: "1403", entNac: "2403", devSaidaEst: "5411", devSaidaNac: "6411", devEntEst: "1411", devEntNac: "2411" },
      { cst: "41 - Isento", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102", devSaidaEst: "5202", devSaidaNac: "6202", devEntEst: "1202", devEntNac: "2202" },
      { cst: "90 - Outros", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102", devSaidaEst: "5202", devSaidaNac: "6202", devEntEst: "1202", devEntNac: "2202" },
    ]
  },
  REAL: {
    description: "Apuração baseada no lucro líquido real da empresa.",
    nfe: "SIM",
    nfce: "SIM",
    pisCofins: "PIS: 1.65% | COFINS: 7.6%",
    cstLabel: "CST ICMS",
    rules: [
      { cst: "00 - Garantido Integral", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102", devSaidaEst: "5202", devSaidaNac: "6202", devEntEst: "1202", devEntNac: "2202" },
      { cst: "60 - Substituição Trib.", saidaEst: "5405", saidaNac: "6403", entEst: "1403", entNac: "2403", devSaidaEst: "5411", devSaidaNac: "6411", devEntEst: "1411", devEntNac: "2411" },
      { cst: "41 - Isento", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102", devSaidaEst: "5202", devSaidaNac: "6202", devEntEst: "1202", devEntNac: "2202" },
      { cst: "90 - Outros", saidaEst: "5102", saidaNac: "6102", entEst: "1102", entNac: "2102", devSaidaEst: "5202", devSaidaNac: "6202", devEntEst: "1202", devEntNac: "2202" },
    ]
  }
};

const FREQUENT_CFOPS = [
  { cfop: '5102', titulo: 'Venda de mercadoria (Estadual)', desc: 'Venda dentro do estado de produto tributado normal / isento.' },
  { cfop: '5405', titulo: 'Venda com Substituição Tributária (Estadual)', desc: 'Saída interna de mercadoria com ICMS já retido por ST (CSOSN 500 / CST 60).' },
  { cfop: '6102', titulo: 'Venda de mercadoria (Interestadual)', desc: 'Venda para fora do estado (operação nacional).' },
  { cfop: '6403', titulo: 'Venda ST (Interestadual)', desc: 'Saída interestadual com substituição tributária.' },
  { cfop: '1102', titulo: 'Compra para comercialização (Estadual)', desc: 'Entrada de nota de fornecedor dentro do mesmo estado.' },
  { cfop: '1403', titulo: 'Compra com ST (Estadual)', desc: 'Entrada estadual de mercadoria sujeita à substituição tributária.' },
  { cfop: '5202', titulo: 'Devolução de compra (Estadual)', desc: 'Devolução para fornecedor dentro do estado (tributação normal).' },
  { cfop: '5411', titulo: 'Devolução de compra ST (Estadual)', desc: 'Devolução para fornecedor dentro do estado de mercadoria com ST.' },
  { cfop: '1202', titulo: 'Devolução de venda (Estadual)', desc: 'Entrada de mercadoria devolvida pelo cliente (tributação normal).' },
  { cfop: '1411', titulo: 'Devolução de venda ST (Estadual)', desc: 'Entrada de devolução de cliente de mercadoria com ST.' },
  { cfop: '5910', titulo: 'Bonificação / Doação / Brinde', desc: 'Remessa estadual de mercadoria em bonificação ou brinde sem cobrança.' },
  { cfop: '5949', titulo: 'Outra saída não especificada', desc: 'Remessas diversas, garantias ou operações sem CFOP próprio.' },
  { cfop: '1556', titulo: 'Compra para uso ou consumo', desc: 'Entrada estadual de material de uso interno da loja (não revenda).' },
  { cfop: '5929', titulo: 'NF-e referenciando Cupom / NFC-e', desc: 'Emissão de NF-e modelo 55 para acobertar NFC-e já emitida no PDV.' }
];

const CFOP_COLUMNS = [
  { key: 'saidaEst', category: 'SAÍDA', uf: 'Estadual' },
  { key: 'saidaNac', category: 'SAÍDA', uf: 'Nacional' },
  { key: 'entEst', category: 'ENTRADA', uf: 'Estadual' },
  { key: 'entNac', category: 'ENTRADA', uf: 'Nacional' },
  { key: 'devSaidaEst', category: 'DEV. SAÍDA', uf: 'Estadual' },
  { key: 'devSaidaNac', category: 'DEV. SAÍDA', uf: 'Nacional' },
  { key: 'devEntEst', category: 'DEV. ENTRADA', uf: 'Estadual' },
  { key: 'devEntNac', category: 'DEV. ENTRADA', uf: 'Nacional' }
];

const InfoTributaria = () => {
  const [activeRegime, setActiveRegime] = useState('MEI');
  const [hoveredInfo, setHoveredInfo] = useState(null);
  const [copiedBanner, setCopiedBanner] = useState(null);
  const [cfopSearch, setCfopSearch] = useState('');
  const [copiedGuideCfop, setCopiedGuideCfop] = useState('');
  const copyTimerRef = useRef(null);

  const data = TAX_DATA[activeRegime];

  const handleCellHover = (cst, category, uf, value) => {
    if (value) {
      setHoveredInfo(`${activeRegime} > ${cst.split(' -')[0]} > ${category} > ${uf}: ${value} (Clique para copiar)`);
    } else {
      setHoveredInfo(null);
    }
  };

  const handleCopyCfop = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopiedBanner(`✅ CFOP ${value} copiado para a área de transferência!`);
      setCopiedGuideCfop(value);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopiedBanner(null);
        setCopiedGuideCfop('');
      }, 1800);
    });
  };

  const filteredFrequentCfops = useMemo(() => {
    if (!cfopSearch.trim()) return FREQUENT_CFOPS;
    const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const q = norm(cfopSearch);
    return FREQUENT_CFOPS.filter(
      (item) => item.cfop.includes(q) || norm(item.titulo).includes(q) || norm(item.desc).includes(q)
    );
  }, [cfopSearch]);

  const bannerMessage = copiedBanner || hoveredInfo;

  return (
    <motion.div
      className="tax-info-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="tax-header">
        <div className="warning-banner">
          <AlertTriangle size={24} />
          <span>SEMPRE ORIENTAR CLIENTE A VALIDAR COM CONTABILIDADE</span>
        </div>
      </div>

      <div className="tax-content">
        <div className="tax-sidebar">
          <h2><Building2 size={24} /> Regimes</h2>
          <nav className="tax-nav">
            {Object.keys(TAX_DATA).map(key => (
              <button
                key={key}
                className={`tax-nav-btn ${activeRegime === key ? 'active' : ''}`}
                onClick={() => setActiveRegime(key)}
              >
                {key === 'MEI' ? 'MEI' : key === 'SIMPLES' ? 'Simples Nacional' : key === 'PRESUMIDO' ? 'Lucro Presumido' : 'Lucro Real'}
                <ChevronRight size={16} />
              </button>
            ))}
          </nav>
        </div>

        <div className="tax-main">
          <div className="tax-main-header">
            <h1>{activeRegime === 'MEI' ? 'Microempreendedor Individual (MEI)' : activeRegime === 'SIMPLES' ? 'Simples Nacional' : activeRegime === 'PRESUMIDO' ? 'Lucro Presumido' : 'Lucro Real'}</h1>
            {activeRegime === 'MEI' ? (
              <div className="mei-warning">{data.description}</div>
            ) : (
              <p>{data.description}</p>
            )}

            <div className="tax-badges">
              <span className="tax-badge bg-blue"><FileText size={16} /> NF-e: {data.nfe}</span>
              <span className="tax-badge bg-indigo"><FileText size={16} /> NFC-e: {data.nfce}</span>
              <span className="tax-badge bg-green"><Calculator size={16} /> {data.pisCofins}</span>
            </div>

            <div className="hover-info-container">
              <div className={`hover-info-banner ${bannerMessage ? 'visible' : ''} ${copiedBanner ? 'copied-state' : ''}`}>
                {bannerMessage || "Passe o mouse sobre um CFOP para ver detalhes ou clique para copiar."}
              </div>
            </div>
          </div>

          <div className="tax-table-wrapper">
            <table className="tax-table">
              <thead>
                <tr>
                  <th rowSpan="2">{data.cstLabel}</th>
                  <th colSpan="2">SAÍDA</th>
                  <th colSpan="2">ENTRADA</th>
                  {data.rules[0].devSaidaEst && <th colSpan="2">DEV. SAÍDA</th>}
                  {data.rules[0].devEntEst && <th colSpan="2">DEV. ENTRADA</th>}
                </tr>
                <tr className="sub-header">
                  <th>Estadual</th>
                  <th>Nacional</th>
                  <th>Estadual</th>
                  <th>Nacional</th>
                  {data.rules[0].devSaidaEst && <th>Estadual</th>}
                  {data.rules[0].devSaidaEst && <th>Nacional</th>}
                  {data.rules[0].devEntEst && <th>Estadual</th>}
                  {data.rules[0].devEntEst && <th>Nacional</th>}
                </tr>
              </thead>
              <tbody>
                {data.rules.map((rule, idx) => (
                  <tr key={idx}>
                    <td className="cst-cell">{rule.cst}</td>
                    {CFOP_COLUMNS.map((col) => {
                      const val = rule[col.key];
                      if (!val) return null;
                      return (
                        <td
                          key={col.key}
                          className="hoverable-cell"
                          onMouseEnter={() => handleCellHover(rule.cst, col.category, col.uf, val)}
                          onMouseLeave={() => setHoveredInfo(null)}
                          onClick={() => handleCopyCfop(val)}
                          title={`Clique para copiar CFOP ${val}`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Guia Rápido / Busca de CFOPs Frequentes */}
          <div className="cfop-guide-section">
            <div className="cfop-guide-header">
              <div>
                <h3>Consulta Rápida de Operações &amp; CFOPs Frequentes</h3>
                <p>Busque por código ou operação (ex: bonificação, uso e consumo, cupom referenciado) e clique para copiar.</p>
              </div>
              <div className="cfop-guide-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar CFOP ou operação..."
                  value={cfopSearch}
                  onChange={(e) => setCfopSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="cfop-guide-grid">
              {filteredFrequentCfops.map((item) => {
                const isCopied = copiedGuideCfop === item.cfop;
                return (
                  <button
                    key={item.cfop}
                    type="button"
                    className={`cfop-guide-card ${isCopied ? 'copied' : ''}`}
                    onClick={() => handleCopyCfop(item.cfop)}
                    title={`Clique para copiar o CFOP ${item.cfop}`}
                  >
                    <div className="cfop-guide-card-top">
                      <span className="cfop-code-pill">{item.cfop}</span>
                      <span className="cfop-copy-indicator">
                        {isCopied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                      </span>
                    </div>
                    <strong>{item.titulo}</strong>
                    <small>{item.desc}</small>
                  </button>
                );
              })}
              {filteredFrequentCfops.length === 0 && (
                <p className="cfop-guide-empty">Nenhum CFOP encontrado para "{cfopSearch}".</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InfoTributaria;
