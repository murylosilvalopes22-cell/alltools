import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MonitorPlay, Save, CheckCircle2, History, CloudBackup, FileClock, Eye, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './GestorSysPDV.css';

const SECTIONS = [
  {
    id: 'base',
    title: '🔧 Instalação Base',
    items: [
      { id: 'b1', text: 'Instalar modo administrador Firebird-2.5.9.27139_0_x64' },
      { id: 'b2', text: 'Verificar versão do Syspdv' },
      { id: 'b3', text: 'Instalar como administrador Syspdv' },
      { id: 'b4', text: 'Executar "AtualizaSysPDV_PDV" como administrador em C:\\Syspdv' },
      { id: 'b5', text: 'Executar a versão mais recente do Dependências como Administrador em C:\\Syspdv\\Nfe' },
      { id: 'b6', text: 'Executar "SysPDVTools.exe"' },
      { id: 'b7', text: 'Escolher opção 2 - CRIAR USUÁRIOS e pressionar ENTER' }
    ]
  },
  {
    id: 'db',
    title: '🧾 Banco de Dados',
    items: [
      { id: 'd1', text: 'Abrir IBExpert', critical: true },
      { id: 'd2', text: 'Conectar ao banco syspdv_mov.fdb em C:\\Syspdv', critical: true },
      { id: 'd3', text: 'Acessar tabela CAIXA → DATA', critical: true },
      { id: 'd4', text: 'Localizar coluna CXASERNUM, deletar valor do campo', critical: true },
      { id: 'd5', text: 'Commitar e desconectar', critical: true }
    ]
  },
  {
    id: 'perifericos',
    title: '🖥️ Periféricos',
    items: [
      { id: 'p1', text: 'Instalar driver da impressora (driver correto do modelo)' },
      { id: 'p2', text: 'Instalar driver do pinpad (driver correto do modelo)' }
    ]
  },
  {
    id: 'tef',
    title: '💳 TEF',
    items: [
      { id: 't1', text: 'Executar wnbtlscl_novo.exe (C:\\Solutil)' },
      { id: 't2', text: 'Informar código do TEF do caixa e Registrar (código não liberado)' },
      { id: 't3', text: 'Solicitar liberação com Worksoft (código TEF Caixa X / CNPJ Y)' },
      { id: 't4', text: 'Executar novamente wnbtlscl_novo.exe e registrar o código TEF' },
      { id: 't5', text: 'Executar o arquivo "wnbsobre" em C:\\Program Files (x86)\\Comnect\\WNBTLSCLI\\ (deve aparecer tudo OK)' },
      { id: 't6', text: 'Renomear pasta CliSiTef no C:' }
    ]
  },
  {
    id: 'testes',
    title: '🧪 Testes',
    items: [
      { id: 'te1', text: 'Abrir Syspdv PDV na área de trabalho' },
      { id: 'te2', text: 'Abrir caixa (Função 105/ Operador 1)' },
      { id: 'te3', text: 'Testar Pinpad (622/)' },
      { id: 'te4', text: 'Testar TEF (620/)' },
      { id: 'te5', text: 'Carga de tabelas (600/)' },
      { id: 'te6', text: 'Testar impressora (500/) escolhe a opção 2' },
      { id: 'te7', text: 'Testar gaveta (520/)' },
      { id: 'te8', text: 'Diagnóstico geral (365/)' }
    ]
  },
  {
    id: 'finalizacao',
    title: '🔄 Finalização',
    items: [
      { id: 'f1', text: 'Desabilitar Firewall' },
      { id: 'f2', text: 'Enviar carga pelo servidor para o caixa' },
      { id: 'f3', text: 'Fechar caixa (Função 197/)' },
      { id: 'f4', text: 'Configurar abertura automática do Syspdv.exe no StorTMR' }
    ]
  },
  {
    id: 'validacao',
    title: '✅ Validação com Cliente',
    items: [
      { id: 'v1', text: 'Caixa abre e fecha' },
      { id: 'v2', text: 'Venda teste realizada' },
      { id: 'v3', text: 'Emissão NFCe/NFe' },
      { id: 'v4', text: 'TEF funcionando' },
      { id: 'v5', text: 'Impressão OK e Gaveta OK' }
    ]
  }
];

const GestorSysPDV = ({ onBack, theme }) => {
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

  useEffect(() => {
    const collRef = collection(db, 'gestorSysPdv');
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

  const handleCheckToggle = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleDelete = async (id) => {
    if(window.confirm('Tem certeza que deseja excluir este checklist em aberto?')) {
      await deleteDoc(doc(db, 'gestorSysPdv', id));
    }
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
          if (itemObj && itemObj.checked) {
            newChecked[item.id] = true;
          }
        });
      });
    }
    setCheckedItems(newChecked);
    setActiveTab('checklist');
    
    if (record.status === 'aberto') {
      await deleteDoc(doc(db, 'gestorSysPdv', record.id));
      setEditingId(null);
    } else {
      setEditingId(record.id);
    }
  };

  const handleSave = async (statusType) => {
    if (statusType === 'finalizado') {
      const confirmed = window.confirm('Verifique se está tudo correto. Não será possível editar os itens depois, apenas o cabeçalho. Deseja finalizar?');
      if (!confirmed) return;
    }

    if (!formData.company) {
      alert("Por favor, preencha o Nome da Empresa.");
      return;
    }

    const flatItems = SECTIONS.flatMap(sec => sec.items.map(item => ({
      texto: item.text,
      checked: !!checkedItems[item.id]
    })));

    const recordData = {
      data: formData.date,
      licenca: formData.license || "",
      empresa: formData.company || "PDV NÃO NOMEADO",
      versao: formData.version || "N/A",
      suporte: formData.support || "Técnico Stor",
      observacoes: formData.observacoes || "",
      items: flatItems,
      status: statusType,
      updatedAt: Date.now()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'gestorSysPdv', editingId), recordData);
        alert(`Checklist atualizado com status: ${statusType === 'aberto' ? 'Em Aberto' : 'Finalizado'}`);
      } else {
        recordData.createdAt = Date.now();
        await addDoc(collection(db, 'gestorSysPdv'), recordData);
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
      await updateDoc(doc(db, 'gestorSysPdv', selectedDetails.id), {
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
      className="gestor-syspdv-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} /> Voltar ao Dashboard
        </button>
        
        <a href="https://versoes.syspdv.com.br/" target="_blank" rel="noopener noreferrer" className="btn-info no-print">
          <ExternalLink size={16} /> Consultar Versões SysPDV
        </a>
      </div>

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
                <h1><MonitorPlay className="icon" size={28} /> {editingId ? 'Editando Checklist' : 'Gestor E SysPDV'}</h1>
                <p>Procedimento: Instalação PDV – Ambiente Pós-Formatação</p>
              </div>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="input-group">
                  <label>Data</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                </div>
                <div className="input-group">
                  <label>Licença</label>
                  <input type="text" name="license" placeholder="Ex: 2190" value={formData.license} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Nome da Empresa</label>
                  <input type="text" name="company" placeholder="Ex: SUPERMERCADO STOR" value={formData.company} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                </div>
                <div className="input-group">
                  <label>Versão SysPDV</label>
                  <input type="text" name="version" placeholder="Ex: 23.01" value={formData.version} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                </div>
                <div className="input-group">
                  <label>Técnico</label>
                  <input type="text" name="support" placeholder="Seu nome" value={formData.support} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div className="checklist-content">
                {SECTIONS.map(section => (
                  <div key={section.id} className="checklist-section">
                    <h2>{section.title}</h2>
                    <div className="checklist-items">
                      {section.items.map(item => (
                        <label key={item.id} className={`check-label ${item.critical ? 'critical' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={!!checkedItems[item.id]} 
                            onChange={() => handleCheckToggle(item.id)}
                          />
                          <span className="check-text">{item.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="checklist-section">
                  <h2>📝 Observações Adicionais</h2>
                  <textarea 
                    name="observacoes"
                    className="observacoes-input"
                    placeholder="Ex: Problemas encontrados, particularidades do cliente..."
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>
              </div>

              <div className="action-footer" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button className="btn-secondary" onClick={clearForm}>
                  Limpar / Cancelar
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
                    <div key={record.id} className="history-card" style={{ borderLeft: '4px solid var(--neon-cyan)', background: 'var(--surface-main)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div className="history-info">
                        <h3 style={{ margin: '0 0 4px 0' }}>{record.licenca ? `${record.licenca} - ` : ''}{record.empresa}</h3>
                        <div className="history-meta" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {record.data.split('-').reverse().join('/')} • Versão: {record.versao} • Téc: {record.suporte}
                        </div>
                      </div>
                      <div className="history-actions" style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon-text danger" onClick={() => handleDelete(record.id)} style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer' }}>
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
                <p>Histórico de Configurações de PDV Concluídas</p>
              </div>

              <div className="history-container">
                {finalizadosList.length === 0 ? (
                  <div className="empty-state">
                    <History size={48} opacity={0.5} style={{ margin: '0 auto 16px' }} />
                    <p>Nenhum registro de configuração encontrado.</p>
                  </div>
                ) : (
                  finalizadosList.map(record => (
                    <div key={record.id} className="history-card" style={{ background: 'var(--surface-main)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', border: '1px solid var(--border-light)' }}>
                      <div className="history-info">
                        <h3 style={{ margin: '0 0 4px 0' }}>{record.licenca ? `${record.licenca} - ` : ''}{record.empresa}</h3>
                        <div className="history-meta" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
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
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div 
              className="details-modal glass-panel"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'var(--surface-main)', borderRadius: '16px', border: '1px solid var(--border-light)', maxWidth: '600px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)' }}>
                {isEditingDetails ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, marginRight: '16px' }}>
                    <input 
                      type="text" value={editDetailsForm.licenca} onChange={e => setEditDetailsForm({...editDetailsForm, licenca: e.target.value})} 
                      placeholder="Licença" style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} 
                    />
                    <input 
                      type="text" value={editDetailsForm.empresa} onChange={e => setEditDetailsForm({...editDetailsForm, empresa: e.target.value})} 
                      placeholder="Nome da Empresa" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-dark)', color: 'var(--text-primary)' }} 
                    />
                    <button onClick={handleSaveDetailsEdit} className="btn-primary" style={{ padding: '6px 12px' }}>Salvar</button>
                    <button onClick={() => setIsEditingDetails(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancelar</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ margin: 0 }}>{selectedDetails.licenca ? `${selectedDetails.licenca} - ` : ''}{selectedDetails.empresa}</h2>
                    <button onClick={() => setIsEditingDetails(true)} className="btn-icon-text" style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      <Edit2 size={14} style={{ display: 'inline' }} />
                    </button>
                  </div>
                )}
                <button className="close-btn" onClick={() => setSelectedDetails(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✖</button>
              </div>
              
              <div className="details-content" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px' }}>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Data:</strong> {selectedDetails.data.split('-').reverse().join('/')}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Versão:</strong> {selectedDetails.versao}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Técnico:</strong> {selectedDetails.suporte}</div>
                </div>
                
                {selectedDetails.observacoes && (
                  <div style={{ marginBottom: '20px', background: 'rgba(56, 189, 248, 0.05)', borderLeft: '4px solid #38bdf8', padding: '12px', borderRadius: '0 8px 8px 0' }}>
                    <strong style={{ color: '#38bdf8' }}>Observações:</strong>
                    <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{selectedDetails.observacoes}</p>
                  </div>
                )}
                
                <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '16px' }}>Itens do Checklist</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedDetails.items && selectedDetails.items.map((i, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px', background: i.checked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', border: `1px solid ${i.checked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                      <span style={{ color: i.checked ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{i.checked ? '✓' : '✗'}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{i.texto}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GestorSysPDV;
