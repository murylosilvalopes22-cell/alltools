import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MonitorCog, Save, Printer, Trash2, CheckCircle2, History, CloudBackup, FileClock, Eye, Edit2 } from 'lucide-react';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import TriStateCheckbox from './TriStateCheckbox';
import './StationConfig.css';

const SECTIONS = [
  {
    id: 'gerais',
    title: 'Procedimentos Gerais',
    items: [
      { id: 'g1', text: 'Salvar credenciais de acesso ao servidor na estação.' },
      { id: 'g2', text: 'Garantir que o caminho ou compartilhamento funcione para emissão de NFe/NFCe.' },
      { id: 'g3', text: 'Registrar DLLs e Configurar Caixa.' },
      { id: 'g4', text: 'Configurar o Caixa nos parâmetros da estação.' },
      { id: 'g5', text: 'Verificar se o cliente é mercado, açougue ou restaurante.' },
      { id: 'g6', text: 'Perguntar se utiliza balança integrada ao caixa e, se sim, realizar a configuração.' },
    ]
  },
  {
    id: 'vendas',
    title: 'Configurações de Venda / PDV / Retaguarda',
    items: [
      { id: 'v1', text: 'Configurar impressora e documentos de impressão (NFCe, pedidos, etc.).' },
      { id: 'v2', text: 'Configurar abertura de gaveta, se necessário.' },
      { id: 'v3', text: 'Configurar corte parcial na impressora, se aplicável.' },
      { id: 'v4', text: 'Solicitar que o cliente realize uma venda de teste para validar: leitor, impressora, gaveta e emissão NFCe.', critical: true },
    ]
  },
  {
    id: 'stor',
    title: 'Ajustes na Pasta Stor',
    items: [
      { id: 's1', text: 'Excluir executáveis e arquivos .exe e .ini desnecessários (DFe, WSP, FIP, etc.).' },
      { id: 's2', text: 'Manter somente Stor.exe, StorPDV e StorATE.' },
      { id: 's3', text: 'Criar atalhos na área de trabalho: Stor.exe e StorPDV.exe (se necessário).' },
    ]
  },
  {
    id: 'finais',
    title: 'Personalização e Detalhes Finais',
    items: [
      { id: 'f1', text: 'Verificar se a logo do cliente aparece na tela de login ou no PDV; se não, solicitar e configurar.' },
      { id: 'f2', text: 'Ajustar opções de energia do Windows para evitar desligamento automático.' },
      { id: 'f3', text: 'Se necessário, instalar o certificado digital no Windows para entrada de notas fiscais.' },
    ]
  }
];

const StationConfig = ({ onBack, theme }) => {
  const [activeTab, setActiveTab] = useState('checklist');
  const [records, setRecords] = useState([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    license: '',
    company: '',
    version: '',
    support: '',
    observacoes: ''
  });

  const [checkedItems, setCheckedItems] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editDetailsForm, setEditDetailsForm] = useState({ licenca: '', empresa: '' });
  
  const printAreaRef = useRef(null);

  useEffect(() => {
    const collRef = collection(db, 'stationConfig');
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setRecords(data);
    });

    return () => unsubscribe();
  }, []);

  const abertosList = records.filter(r => r.status === 'aberto');
  const finalizadosList = records.filter(r => r.status !== 'aberto');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckCycle = (itemId) => {
    const currentRaw = checkedItems[itemId];
    const currentState = typeof currentRaw === 'boolean' ? (currentRaw ? 1 : 0) : (currentRaw || 0);
    const nextState = (currentState + 1) % 3;

    setCheckedItems(prev => ({
      ...prev,
      [itemId]: nextState
    }));
  };

  const clearForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      license: '',
      company: '',
      version: '',
      support: '',
      observacoes: ''
    });
    setCheckedItems({});
    setEditingId(null);
  };

  const loadRecordToForm = async (record) => {
    setFormData({
      date: record.data || new Date().toISOString().split('T')[0],
      license: record.licenca || '',
      company: record.empresa || '',
      version: record.versao || '',
      support: record.suporte || '',
      observacoes: record.observacoes || ''
    });
    
    const newChecked = {};
    if (record.items) {
      SECTIONS.forEach(sec => {
        sec.items.forEach(item => {
          const itemObj = record.items.find(i => i.texto === item.text);
          if (itemObj) {
            if (typeof itemObj.checked === 'boolean') {
              newChecked[item.id] = itemObj.checked ? 1 : 0;
            } else {
              newChecked[item.id] = itemObj.checked || 0;
            }
          }
        });
      });
    }
    setCheckedItems(newChecked);
    setActiveTab('checklist');
    
    if (record.status === 'aberto') {
      await deleteDoc(doc(db, 'stationConfig', record.id));
      setEditingId(null);
    } else {
      setEditingId(record.id);
    }
  };

  const handleSave = async (statusType) => {
    if (statusType === 'finalizado') {
      const confirmed = window.confirm('Verifique se está tudo correto. Não será possível editar ou excluir um checklist finalizado. Deseja realmente finalizar?');
      if (!confirmed) return;
    }

    if (!formData.company) {
      alert("Por favor, preencha o Nome da Empresa.");
      return;
    }

    const flatItems = SECTIONS.flatMap(sec => sec.items.map(item => {
      let stateVal = checkedItems[item.id];
      if (typeof stateVal === 'boolean') stateVal = stateVal ? 1 : 0;
      return {
        texto: item.text,
        checked: stateVal || 0
      };
    }));

    const recordData = {
      data: formData.date,
      licenca: formData.license || "",
      empresa: formData.company || "ESTAÇÃO NÃO NOMEADA",
      versao: formData.version || "N/A",
      suporte: formData.support || "Técnico Stor",
      observacoes: formData.observacoes || "",
      items: flatItems,
      status: statusType,
      updatedAt: Date.now()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'stationConfig', editingId), recordData);
        alert(`Checklist atualizado com status: ${statusType === 'aberto' ? 'Em Aberto' : 'Finalizado'}`);
      } else {
        recordData.createdAt = Date.now();
        await addDoc(collection(db, 'stationConfig'), recordData);
        alert(`Checklist salvo com status: ${statusType === 'aberto' ? 'Em Aberto' : 'Finalizado'}`);
      }
      
      clearForm();
      setActiveTab(statusType === 'aberto' ? 'abertos' : 'history');
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar os dados.");
    }
  };

  const handleSaveDetailsEdit = async () => {
    if (!selectedDetails) return;
    try {
      await updateDoc(doc(db, 'stationConfig', selectedDetails.id), {
        licenca: editDetailsForm.licenca,
        empresa: editDetailsForm.empresa
      });
      setSelectedDetails(prev => ({ ...prev, licenca: editDetailsForm.licenca, empresa: editDetailsForm.empresa }));
      setIsEditingDetails(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar dados.");
    }
  };

  return (
    <motion.div 
      className="station-config-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="print-area" ref={printAreaRef} style={{ display: 'none' }}></div>

      <div className="tabs-nav no-print">
        <button 
          className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          <CheckCircle2 size={18} /> Novo Checklist
        </button>
        <button 
          className={`tab-btn ${activeTab === 'abertos' ? 'active' : ''}`}
          onClick={() => setActiveTab('abertos')}
        >
          <FileClock size={18} /> Em Aberto
          {abertosList.length > 0 && <span className="tab-badge">{abertosList.length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} /> Finalizados
        </button>
      </div>

      <div className="board-wrapper no-print">
        <AnimatePresence mode="wait">
          {activeTab === 'checklist' ? (
            <motion.div 
              key="checklist"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="board-header">
                <h1><MonitorCog className="icon" size={28} /> {editingId ? 'Editando Checklist' : 'Configuração de Estação'}</h1>
                <p>Padronização e checklist de instalação V5</p>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Data</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
                </div>
                <div className="input-group">
                  <label>Licença</label>
                  <input type="text" name="license" placeholder="Ex: 2190" value={formData.license} onChange={handleInputChange} style={{ width: '120px' }} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Nome da Empresa</label>
                  <input type="text" name="company" placeholder="Ex: SUPERMERCADO STOR" value={formData.company} onChange={handleInputChange} />
                </div>
                <div className="input-group">
                  <label>Versão</label>
                  <input type="text" name="version" placeholder="04.09.00.00" value={formData.version} onChange={handleInputChange} />
                </div>
                <div className="input-group">
                  <label>Técnico Setup</label>
                  <input type="text" name="support" placeholder="Seu nome" value={formData.support} onChange={handleInputChange} />
                </div>
              </div>

              <div className="checklist-content">
                {SECTIONS.map(section => (
                  <div key={section.id} className="checklist-section">
                    <h2>{section.title}</h2>
                    <div className="checklist-items">
                      {section.items.map(item => {
                        const currentRaw = checkedItems[item.id];
                        const currentState = typeof currentRaw === 'boolean' ? (currentRaw ? 1 : 0) : (currentRaw || 0);
                        return (
                          <TriStateCheckbox 
                            key={item.id}
                            state={currentState}
                            onChange={() => handleCheckCycle(item.id)}
                            label={item.text}
                            className={item.critical ? 'critical' : ''}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="checklist-section">
                  <h2>Observações Adicionais</h2>
                  <textarea 
                    name="observacoes"
                    className="observacoes-input"
                    placeholder="Ex: Impressora Daruma precisou de dll antiga, gaveta não conectada, etc..."
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>
              </div>

              <div className="action-footer" style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" onClick={clearForm}>
                  Limpar / Cancelar Edição
                </button>
                <button className="btn-secondary" onClick={() => handleSave('aberto')} style={{ borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}>
                  <CloudBackup size={18} /> Salvar em Aberto
                </button>
                <button className="btn-primary" onClick={() => handleSave('finalizado')}>
                  <Save size={18} /> Salvar e Finalizar
                </button>
              </div>
            </motion.div>
          ) : activeTab === 'abertos' ? (
            <motion.div 
              key="abertos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="board-header">
                <h1><FileClock className="icon" size={28} /> Em Aberto</h1>
                <p>Checklists iniciados que ainda não foram finalizados</p>
              </div>

              <div className="history-container">
                {abertosList.length === 0 ? (
                  <div className="empty-state">
                    <FileClock size={48} opacity={0.5} style={{ margin: '0 auto 16px' }} />
                    <p>Nenhum checklist em aberto.</p>
                  </div>
                ) : (
                  abertosList.map(record => (
                    <div key={record.id} className="history-card" style={{ borderLeft: '4px solid var(--neon-cyan)' }}>
                      <div className="history-info">
                        <h3>{record.licenca ? `${record.licenca} - ` : ''}{record.empresa}</h3>
                        <div className="history-meta">
                          {record.data.split('-').reverse().join('/')} • Versão: {record.versao} • Téc: {record.suporte}
                        </div>
                      </div>
                      <div className="history-actions">
                        <button className="btn-icon-text danger" onClick={() => handleDelete(record.id)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                          <Trash2 size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                          Excluir
                        </button>
                        <button className="btn-primary" onClick={() => loadRecordToForm(record)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                          <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                          Continuar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="board-header">
                <h1><History className="icon" size={28} /> Finalizados</h1>
                <p>Histórico de Configurações Concluídas</p>
              </div>

              <div className="history-container">
                {finalizadosList.length === 0 ? (
                  <div className="empty-state">
                    <History size={48} opacity={0.5} style={{ margin: '0 auto 16px' }} />
                    <p>Nenhum registro de configuração encontrado.</p>
                  </div>
                ) : (
                  finalizadosList.map(record => (
                    <div key={record.id} className="history-card">
                      <div className="history-info">
                        <h3>{record.licenca ? `${record.licenca} - ` : ''}{record.empresa}</h3>
                        <div className="history-meta">
                          {record.data.split('-').reverse().join('/')} • Versão: {record.versao} • Téc: {record.suporte}
                        </div>
                      </div>
                      <div className="history-actions">
                        <button 
                          className="btn-secondary" 
                          onClick={() => {
                            setSelectedDetails(record);
                            setEditDetailsForm({ licenca: record.licenca || '', empresa: record.empresa || '' });
                            setIsEditingDetails(false);
                          }} 
                          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                        >
                          <Eye size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL DE DETALHES */}
      <AnimatePresence>
        {selectedDetails && (
          <motion.div 
            className="details-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDetails(null)}
          >
            <motion.div 
              className="details-modal glass-panel"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditingDetails ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, marginRight: '16px' }}>
                    <input 
                      type="text" 
                      value={editDetailsForm.licenca} 
                      onChange={e => setEditDetailsForm({...editDetailsForm, licenca: e.target.value})} 
                      placeholder="Licença" 
                      style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} 
                    />
                    <input 
                      type="text" 
                      value={editDetailsForm.empresa} 
                      onChange={e => setEditDetailsForm({...editDetailsForm, empresa: e.target.value})} 
                      placeholder="Nome da Empresa" 
                      style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} 
                    />
                    <button onClick={handleSaveDetailsEdit} className="btn-primary" style={{ padding: '6px 12px' }}>Salvar</button>
                    <button onClick={() => setIsEditingDetails(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancelar</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2>{selectedDetails.licenca ? `${selectedDetails.licenca} - ` : ''}{selectedDetails.empresa}</h2>
                    <button onClick={() => setIsEditingDetails(true)} className="btn-icon-text" style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                      <Edit2 size={14} /> Editar
                    </button>
                  </div>
                )}
                <button className="close-btn" onClick={() => setSelectedDetails(null)}>✖</button>
              </div>
              <div className="details-content">
                <div className="details-meta-grid">
                  <div><strong>Data:</strong> {selectedDetails.data.split('-').reverse().join('/')}</div>
                  <div><strong>Versão:</strong> {selectedDetails.versao}</div>
                  <div><strong>Técnico:</strong> {selectedDetails.suporte}</div>
                </div>
                
                {selectedDetails.observacoes && (
                  <div className="details-observacoes">
                    <strong>Observações:</strong>
                    <p>{selectedDetails.observacoes}</p>
                  </div>
                )}
                
                <h3>Itens do Checklist</h3>
                <div className="details-items-list">
                  {selectedDetails.items && selectedDetails.items.map((i, idx) => {
                    const stateVal = typeof i.checked === 'boolean' ? (i.checked ? 1 : 0) : (i.checked || 0);
                    return (
                      <div key={idx} className={`details-item state-${stateVal}`}>
                        <span className="details-check-icon">
                          {stateVal === 1 ? '✓' : stateVal === 2 ? '−' : '✗'}
                        </span>
                        <span className="details-item-text">{i.texto}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StationConfig;
