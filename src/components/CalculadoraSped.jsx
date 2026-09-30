import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCheck2, ArrowLeft, RotateCcw, Copy, Check, DollarSign, Lightbulb } from 'lucide-react';
import './CalculadoraSped.css';

const CalculadoraSped = ({ onBack, theme }) => {
  const [valEsp, setValEsp] = useState('');
  const [recBru, setRecBru] = useState('');
  const [natMai, setNatMai] = useState('');
  
  const [copiedEsp, setCopiedEsp] = useState(false);
  const [copiedNat, setCopiedNat] = useState(false);

  // Conversão segura para número
  const vEsp = parseFloat(valEsp) || 0;
  const rBru = parseFloat(recBru) || 0;
  const nMai = parseFloat(natMai) || 0;

  // Cálculos
  const diferenca = vEsp - rBru;
  const novoValEsp = vEsp;
  const novoNat = nMai + diferenca;

  // Formatação em moeda brasileira
  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Formatação pura (apenas números e vírgula, ex: 1250,50) para cópia e colagem no SPED
  const formatarPuro = (valor) => {
    return valor.toFixed(2).replace('.', ',');
  };

  const handleCopy = (valorPuro, setCopiedState) => {
    navigator.clipboard.writeText(valorPuro).then(() => {
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 1500);
    });
  };

  const handleClear = () => {
    setValEsp('');
    setRecBru('');
    setNatMai('');
  };

  // Classe de cor para diferença
  let difClass = 'neu';
  if (diferenca > 0) difClass = 'pos';
  else if (diferenca < 0) difClass = 'neg';

  return (
    <motion.div 
      className={`sped-container ${theme}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="sped-header">
        <h2>
          <FileCheck2 size={28} /> Ajuste SPED PIS/COFINS
        </h2>
        <span className="sped-badge">Módulo 2</span>
      </div>

      <div className="sped-grid">
        {/* Painel da Esquerda: Inputs */}
        <div className="sped-panel">
          <div className="sped-panel-title">
            <span>📥 Parâmetros de Entrada</span>
          </div>

          <div className="sped-input-group">
            <label htmlFor="val-esp">Valor Esperado</label>
            <div className="sped-input-wrapper">
              <DollarSign size={18} className="sped-input-icon" />
              <input 
                id="val-esp"
                type="number" 
                step="0.01" 
                placeholder="0,00" 
                value={valEsp} 
                onChange={(e) => setValEsp(e.target.value)} 
                className="sped-input"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="sped-input-group">
            <label htmlFor="rec-bru">Receita Bruta</label>
            <div className="sped-input-wrapper">
              <DollarSign size={18} className="sped-input-icon" />
              <input 
                id="rec-bru"
                type="number" 
                step="0.01" 
                placeholder="0,00" 
                value={recBru} 
                onChange={(e) => setRecBru(e.target.value)} 
                className="sped-input"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="sped-input-group">
            <label htmlFor="nat-mai">Natureza de Receita (MAIOR)</label>
            <div className="sped-input-wrapper">
              <DollarSign size={18} className="sped-input-icon" />
              <input 
                id="nat-mai"
                type="number" 
                step="0.01" 
                placeholder="0,00" 
                value={natMai} 
                onChange={(e) => setNatMai(e.target.value)} 
                className="sped-input"
                autoComplete="off"
              />
            </div>
          </div>

          <button onClick={handleClear} className="sped-btn-clear">
            <RotateCcw size={16} /> Zerar Campos
          </button>
        </div>

        {/* Painel da Direita: Resultados */}
        <div className="sped-panel">
          <div className="sped-panel-title">
            <span>📊 Análise e Resultados</span>
          </div>

          <div className="sped-dif-box">
            <span className="sped-dif-label">Diferença Encontrada</span>
            <span className={`sped-dif-value ${difClass}`}>
              {formatarMoeda(diferenca)}
            </span>
          </div>

          <div className="sped-tip-box">
            <Lightbulb size={20} className="sped-tip-icon" />
            <div>
              <strong>DICA THOMAS:</strong> Ao clicar em copiar, o valor vai apenas com números e vírgula (ex: <em>{formatarPuro(novoValEsp || 1250.50)}</em>), pronto para ser colado diretamente nos campos do SPED!
            </div>
          </div>

          <div className="sped-results-grid">
            <div className="sped-result-card">
              <span className="sped-result-label">Novo Valor Esperado</span>
              <span className="sped-result-value">{formatarMoeda(novoValEsp)}</span>
              <button 
                onClick={() => handleCopy(formatarPuro(novoValEsp), setCopiedEsp)} 
                className={`sped-btn-copy ${copiedEsp ? 'copied' : ''}`}
              >
                {copiedEsp ? <Check size={14} /> : <Copy size={14} />}
                {copiedEsp ? 'Copiado!' : 'Copiar Valor'}
              </button>
            </div>

            <div className="sped-result-card">
              <span className="sped-result-label">Novo Natureza de Receita</span>
              <span className="sped-result-value">{formatarMoeda(novoNat)}</span>
              <button 
                onClick={() => handleCopy(formatarPuro(novoNat), setCopiedNat)} 
                className={`sped-btn-copy ${copiedNat ? 'copied' : ''}`}
              >
                {copiedNat ? <Check size={14} /> : <Copy size={14} />}
                {copiedNat ? 'Copiado!' : 'Copiar Valor'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CalculadoraSped;
