import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Database, Search, ArrowLeft, Plus, Trash2, Save, X, Percent, DollarSign, BookOpen } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import './CalculadoraIbsCbs.css';
import sefazData from '../data/cclastrib_data.json';
import cstData from '../data/cst_data.json';

const CalculadoraIbsCbs = ({ onBack, theme }) => {
  const [cstSelecionado, setCstSelecionado] = useState('');
  const [baseCalculo, setBaseCalculo] = useState('');
  const [cclastribBusca, setCclastribBusca] = useState('');
  
  const [dbAliquotas, setDbAliquotas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDbModal, setShowDbModal] = useState(false);

  // Modal Form State
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCstDb, setNewCstDb] = useState('');
  const [newCbs, setNewCbs] = useState('');
  const [newIbs, setNewIbs] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Busca dados do Firebase
  useEffect(() => {
    fetchAliquotas();
  }, []);

  const fetchAliquotas = async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, 'cclastrib_aliquotas'));
      const aliquotasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDbAliquotas(aliquotasData);
    } catch (error) {
      console.error("Erro ao buscar alíquotas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAliquota = async (e) => {
    e.preventDefault();
    if (!newCode || !newDesc || !newCbs || !newIbs) return;
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'cclastrib_aliquotas'), {
        codigo: newCode,
        descricao: newDesc,
        cst: newCstDb,
        cbs: parseFloat(newCbs),
        ibs: parseFloat(newIbs),
        criadoEm: new Date().toISOString()
      });
      
      setNewCode('');
      setNewDesc('');
      setNewCstDb('');
      setNewCbs('');
      setNewIbs('');
      await fetchAliquotas();
    } catch (error) {
      console.error("Erro ao adicionar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAliquota = async (id) => {
    if (window.confirm("Deseja realmente remover esta alíquota?")) {
      try {
        await deleteDoc(doc(db, 'cclastrib_aliquotas', id));
        setDbAliquotas(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  const handleSyncSefaz = async () => {
    if (!window.confirm("Isso importará as 142 alíquotas da SEFAZ para o Firebase. Deseja continuar?")) return;
    
    setIsSaving(true);
    try {
      // Create a batch
      const batch = writeBatch(db);
      const aliquotasRef = collection(db, 'cclastrib_aliquotas');
      
      // Add each item from JSON to the batch
      sefazData.forEach(item => {
        const existingItem = dbAliquotas.find(dbItem => dbItem.codigo === item.codigo);
        if (!existingItem) {
          const newDocRef = doc(aliquotasRef);
          batch.set(newDocRef, {
            codigo: item.codigo,
            descricao: item.descricao,
            cst: item.cst || '',
            cbs: item.cbs,
            ibs: item.ibs,
            criadoEm: new Date().toISOString()
          });
        } else {
          // Update existing to ensure cst is present
          const existingDocRef = doc(db, 'cclastrib_aliquotas', existingItem.id);
          batch.set(existingDocRef, { cst: item.cst || '' }, { merge: true });
        }
      });
      
      await batch.commit();
      alert("Sincronização concluída com sucesso!");
      await fetchAliquotas();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      alert("Ocorreu um erro ao sincronizar. Verifique o console.");
    } finally {
      setIsSaving(false);
    }
  };

  // Logica da Calculadora
  const filteredAliquotas = useMemo(() => {
    if (!cstSelecionado) return dbAliquotas;
    return dbAliquotas.filter(item => item.cst === cstSelecionado);
  }, [dbAliquotas, cstSelecionado]);

  const matchAliquota = useMemo(() => {
    if (!cclastribBusca || cclastribBusca.length < 3) return null;
    return filteredAliquotas.find(item => item.codigo === cclastribBusca) || null;
  }, [cclastribBusca, filteredAliquotas]);

  const aliquotaCbs = matchAliquota ? matchAliquota.cbs : 0;
  const aliquotaIbs = matchAliquota ? matchAliquota.ibs : 0;
  
  const baseNum = parseFloat(baseCalculo.replace(',', '.')) || 0;
  const valorCbs = (baseNum * aliquotaCbs) / 100;
  const valorIbs = (baseNum * aliquotaIbs) / 100;
  const valorTotalTributos = valorCbs + valorIbs;
  const valorFinal = baseNum + valorTotalTributos;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <motion.div 
      className={`calc-container ${theme}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="calc-header">
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Voltar ao Dashboard
        </button>
        <h2><Calculator size={28} /> Calculadora CBS/IBS</h2>
        <button className="btn-primary" onClick={() => setShowDbModal(true)}>
          <Database size={18} /> Tabela cClassTrib
        </button>
      </div>

      <div className="calc-content">
        {/* Painel de Inputs */}
        <div className="calc-panel glass-panel">
          
          <div className="input-group" style={{ marginBottom: '10px' }}>
            <label>Situação Tributária (CST)</label>
            <select 
              value={cstSelecionado}
              onChange={(e) => setCstSelecionado(e.target.value)}
              style={{
                width: '100%',
                minHeight: '48px',
                padding: '10px 15px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ color: 'black' }}>Selecione o CST...</option>
              {cstData.map(cst => (
                <option key={cst.codigo} value={cst.codigo} style={{ color: 'black' }}>
                  {cst.codigo} - {cst.descricao}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Código cClassTrib</label>
            <div className="input-with-icon">
              <Search size={18} className="input-icon" />
              <input 
                type="text" 
                placeholder="Ex: 001001" 
                value={cclastribBusca}
                onChange={(e) => setCclastribBusca(e.target.value)}
                maxLength={6}
                list="cclastrib-options"
              />
              <datalist id="cclastrib-options">
                {filteredAliquotas.map(item => (
                  <option key={item.codigo} value={item.codigo}>
                    {item.codigo} - {item.descricao}
                  </option>
                ))}
              </datalist>
            </div>
            {matchAliquota ? (
              <span style={{color: '#10b981', fontSize: '13px'}}>✓ {matchAliquota.descricao}</span>
            ) : cclastribBusca.length > 0 ? (
              <span style={{color: '#ef4444', fontSize: '13px'}}>cClassTrib não encontrado na base.</span>
            ) : null}
          </div>

          <div className="input-group">
            <label>Base de Cálculo (R$)</label>
            <div className="input-with-icon">
              <DollarSign size={18} className="input-icon" />
              <input 
                type="number" 
                placeholder="Ex: 1000.00" 
                value={baseCalculo}
                onChange={(e) => setBaseCalculo(e.target.value)}
              />
            </div>
          </div>

          <div className="aliquotas-row">
            <div className="input-group">
              <label>Alíquota CBS (%)</label>
              <div className="input-with-icon">
                <Percent size={18} className="input-icon" />
                <input 
                  type="number" 
                  value={aliquotaCbs} 
                  disabled 
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Alíquota IBS (%)</label>
              <div className="input-with-icon">
                <Percent size={18} className="input-icon" />
                <input 
                  type="number" 
                  value={aliquotaIbs} 
                  disabled 
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Resultados */}
        <div className="resultado-panel glass-panel">
          <h3>Resumo da Operação</h3>
          
          <div className="resultado-item">
            <div className="resultado-label">
              <BookOpen size={18} /> Base de Cálculo
            </div>
            <div className="resultado-valor">{formatCurrency(baseNum)}</div>
          </div>

          <div className="resultado-item">
            <div className="resultado-label">
              <Calculator size={18} /> Valor CBS ({aliquotaCbs}%)
            </div>
            <div className="resultado-valor">{formatCurrency(valorCbs)}</div>
          </div>

          <div className="resultado-item">
            <div className="resultado-label">
              <Calculator size={18} /> Valor IBS ({aliquotaIbs}%)
            </div>
            <div className="resultado-valor">{formatCurrency(valorIbs)}</div>
          </div>

          <div className="resultado-item total">
            <div className="resultado-label">
              Total (Base + Tributos)
            </div>
            <div className="resultado-valor">{formatCurrency(valorFinal)}</div>
          </div>
        </div>
      </div>

      {/* Modal Tabela do Firebase */}
      <AnimatePresence>
        {showDbModal && (
          <div className="db-modal-overlay">
            <motion.div 
              className={`db-modal glass-panel ${theme}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="db-modal-header">
                <h3><Database size={20} /> Base de Alíquotas cClassTrib</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={handleSyncSefaz}
                    disabled={isSaving}
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    title="Importa dados da planilha excel da SEFAZ"
                  >
                    Sincronizar SEFAZ
                  </button>
                  <button className="close-btn" onClick={() => setShowDbModal(false)}>
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form className="db-form" onSubmit={handleAddAliquota}>
                <div className="input-group">
                  <label>Código (6 dígitos)</label>
                  <input required maxLength={6} type="text" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="001001" className="input-with-icon input" style={{padding: '10px'}}/>
                </div>
                <div className="input-group">
                  <label>Descrição</label>
                  <input required type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ex: Regime Geral" className="input-with-icon input" style={{padding: '10px'}}/>
                </div>
                <div className="input-group">
                  <label>Vínculo CST</label>
                  <input type="text" maxLength={3} value={newCstDb} onChange={e => setNewCstDb(e.target.value)} placeholder="Ex: 000" className="input-with-icon input" style={{padding: '10px'}}/>
                </div>
                <div className="input-group">
                  <label>Alíquota CBS (%)</label>
                  <input required type="number" step="0.01" value={newCbs} onChange={e => setNewCbs(e.target.value)} placeholder="0.9" className="input-with-icon input" style={{padding: '10px'}}/>
                </div>
                <div className="input-group">
                  <label>Alíquota IBS (%)</label>
                  <input required type="number" step="0.01" value={newIbs} onChange={e => setNewIbs(e.target.value)} placeholder="0.1" className="input-with-icon input" style={{padding: '10px'}}/>
                </div>
                <div className="db-form-actions">
                  <button type="submit" className="btn-primary" disabled={isSaving}>
                    <Plus size={18} /> {isSaving ? 'Salvando...' : 'Adicionar cClassTrib'}
                  </button>
                </div>
              </form>

              <div className="cclastrib-list">
                {isLoading ? <p>Carregando base de dados...</p> : dbAliquotas.length === 0 ? <p>Nenhuma alíquota cadastrada. Adicione a primeira acima!</p> : null}
                {dbAliquotas.map(item => (
                  <div key={item.id} className="cclastrib-item">
                    <div className="cclastrib-info">
                      <span className="cclastrib-code">{item.codigo}</span>
                      <span className="cclastrib-desc">{item.descricao}</span>
                    </div>
                    <div className="cclastrib-rates">
                      <span className="rate-badge">CBS: {item.cbs}%</span>
                      <span className="rate-badge">IBS: {item.ibs}%</span>
                    </div>
                    <div className="cclastrib-actions">
                      <button onClick={() => handleDeleteAliquota(item.id)} title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CalculadoraIbsCbs;
