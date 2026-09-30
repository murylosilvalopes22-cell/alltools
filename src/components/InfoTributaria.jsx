import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calculator, AlertTriangle, Building2, ChevronRight, FileText } from 'lucide-react';
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

const InfoTributaria = ({ onBack }) => {
  const [activeRegime, setActiveRegime] = useState('MEI');
  const [hoveredInfo, setHoveredInfo] = useState(null);

  const data = TAX_DATA[activeRegime];

  const handleCellHover = (cst, category, uf, value) => {
    if (value) {
      setHoveredInfo(`${activeRegime} > ${cst.split(' -')[0]} > ${category} > ${uf}: ${value}`);
    } else {
      setHoveredInfo(null);
    }
  };

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
              <span className="tax-badge bg-blue"><FileText size={16}/> NF-e: {data.nfe}</span>
              <span className="tax-badge bg-indigo"><FileText size={16}/> NFC-e: {data.nfce}</span>
              <span className="tax-badge bg-green"><Calculator size={16}/> {data.pisCofins}</span>
            </div>
            
            <div className="hover-info-container">
              <div className={`hover-info-banner ${hoveredInfo ? 'visible' : ''}`}>
                {hoveredInfo || "Passe o mouse sobre um CFOP para ver detalhes."}
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
                    <td className="hoverable-cell" onMouseEnter={() => handleCellHover(rule.cst, 'SAÍDA', 'Estadual', rule.saidaEst)} onMouseLeave={() => setHoveredInfo(null)}>{rule.saidaEst}</td>
                    <td className="hoverable-cell" onMouseEnter={() => handleCellHover(rule.cst, 'SAÍDA', 'Nacional', rule.saidaNac)} onMouseLeave={() => setHoveredInfo(null)}>{rule.saidaNac}</td>
                    <td className="hoverable-cell" onMouseEnter={() => handleCellHover(rule.cst, 'ENTRADA', 'Estadual', rule.entEst)} onMouseLeave={() => setHoveredInfo(null)}>{rule.entEst}</td>
                    <td className="hoverable-cell" onMouseEnter={() => handleCellHover(rule.cst, 'ENTRADA', 'Nacional', rule.entNac)} onMouseLeave={() => setHoveredInfo(null)}>{rule.entNac}</td>
                    {rule.devSaidaEst && <td className="hoverable-cell" onMouseEnter={() => handleCellHover(rule.cst, 'DEV. SAÍDA', 'Estadual', rule.devSaidaEst)} onMouseLeave={() => setHoveredInfo(null)}>{rule.devSaidaEst}</td>}
                    {rule.devSaidaEst && <td className="hoverable-cell" onMouseEnter={() => handleCellHover(rule.cst, 'DEV. SAÍDA', 'Nacional', rule.devSaidaNac)} onMouseLeave={() => setHoveredInfo(null)}>{rule.devSaidaNac}</td>}
                    {rule.devEntEst && <td className="hoverable-cell" onMouseEnter={() => handleCellHover(rule.cst, 'DEV. ENTRADA', 'Estadual', rule.devEntEst)} onMouseLeave={() => setHoveredInfo(null)}>{rule.devEntEst}</td>}
                    {rule.devEntEst && <td className="hoverable-cell" onMouseEnter={() => handleCellHover(rule.cst, 'DEV. ENTRADA', 'Nacional', rule.devEntNac)} onMouseLeave={() => setHoveredInfo(null)}>{rule.devEntNac}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InfoTributaria;
