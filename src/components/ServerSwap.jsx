import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ServerCog, Save, Printer, History, CheckSquare, CloudBackup, FileClock, Eye, Trash2, Edit2, UploadCloud, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import TriStateCheckbox from './TriStateCheckbox';
import './ServerSwap.css';

const PROCEDURES = [
  "Verificar quais aplicações estão sendo executadas no servidor antigo e garantir que elas funcionem no novo (ex: TDA, ILC, MAF etc).",
  "Renomear a pasta Stor no servidor antigo para stor_troca_srv_XXXXXXXX, onde X é a data atual.",
  "Renomear o banco de dados no servidor antigo para Stor_troca_srv_XXXXXXXX.fdb, onde X é a data atual.",
  "No servidor antigo, deixar IP configurado como DHCP.",
  "No servidor novo, definir o IP que estava no servidor antigo.",
  "Criar usuário 'stor' no Windows.",
  "Executar os arquivos .bat do firewall.",
  "Compartilhar a pasta Stor (caso tenha estações).",
  "Configurar Opções de Energia (Nunca desligar/suspender).",
  "Abrir o sistema em alguma estação para verificar a conexão com o servidor.",
  "Configurar o Caixa nos parâmetros da estação, caso o servidor também seja utilizado como caixa.",
  "Registrar DLLs necessárias.",
  "Configurar impressora e documentos.",
  "Criar atalhos (Stor.exe / StorPDV.exe) na Desktop.",
  "Configurar Logo do cliente no login/PDV.",
  "Migrar XMLs (Compactar pasta DFe se necessário e apagar pasta LOTES para melhor desempenho).",
  "Instalar ArtBackup (Backup Stor).",
  "Perguntar ao cliente se o servidor antigo será usado como estação; se sim, configurá-lo (NÃO ESQUECER de remover o BD).",
  "Instalar AnyDesk e criar atalho.",
  "Instalar RustDESK com o StorFRM.exe.",
  "Configurar StorTMR para iniciar aplicações (WSP, FIP, etc).",
  "Desativar IPv6.",
  "Solicitar ao cliente que realize testes de vendas, emissão fiscal e demais procedimentos para garantir."
];

const ServerSwap = ({ onBack, theme }) => {
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist', 'abertos', 'history'
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
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editDetailsForm, setEditDetailsForm] = useState({ licenca: '', empresa: '' });
  
  const printAreaRef = useRef(null);

  useEffect(() => {
    const collRef = collection(db, 'serverSwap');
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
  const finalizadosList = records.filter(r => r.status !== 'aberto'); // Include old records without status

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckCycle = (index, text) => {
    const currentRaw = checkedItems[index];
    const currentState = typeof currentRaw === 'boolean' ? (currentRaw ? 1 : 0) : (currentRaw || 0);
    let nextState = (currentState + 1) % 3;

    if (text === "Configurar Logo do cliente no login/PDV.") {
      if (!logoUrl && nextState === 1) {
        // Se tentar ir para 'Certo' (1) sem imagem, pula direto para 'N/A' (2)
        nextState = 2;
      }
    }

    setCheckedItems(prev => ({
      ...prev,
      [index]: nextState
    }));
  };

  const handleDelete = async (id) => {
    if(window.confirm('Tem certeza que deseja excluir este checklist em aberto?')) {
      await deleteDoc(doc(db, 'serverSwap', id));
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
    setLogoUrl('');
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
      PROCEDURES.forEach((text, idx) => {
        const itemObj = record.items.find(i => i.texto === text);
        if (itemObj) {
          if (typeof itemObj.checked === 'boolean') {
            newChecked[idx] = itemObj.checked ? 1 : 0;
          } else {
            newChecked[idx] = itemObj.checked || 0;
          }
        }
      });
    }
    setCheckedItems(newChecked);
    setLogoUrl(record.logoUrl || '');
    setActiveTab('checklist');
    
    if (record.status === 'aberto') {
      await deleteDoc(doc(db, 'serverSwap', record.id));
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

    const items = PROCEDURES.map((text, index) => {
      let stateVal = checkedItems[index];
      if (typeof stateVal === 'boolean') stateVal = stateVal ? 1 : 0;
      
      return {
        texto: text,
        checked: stateVal || 0
      };
    });

    const recordData = {
      data: formData.date,
      licenca: formData.license || "",
      empresa: formData.company || "SERVIDOR NÃO NOMEADO",
      versao: formData.version || "N/A",
      suporte: formData.support || "Técnico Stor",
      observacoes: formData.observacoes || "",
      items: items,
      logoUrl: logoUrl,
      status: statusType, // 'aberto' or 'finalizado'
      updatedAt: Date.now()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'serverSwap', editingId), recordData);
        alert(`Checklist atualizado com status: ${statusType === 'aberto' ? 'Em Aberto' : 'Finalizado'}`);
      } else {
        recordData.createdAt = Date.now();
        await addDoc(collection(db, 'serverSwap'), recordData);
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
      await updateDoc(doc(db, 'serverSwap', selectedDetails.id), {
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

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height *= MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width *= MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], `compressed_${file.name.replace(/\.[^/.]+$/, "")}.jpg`, { type: 'image/jpeg' }));
            } else {
              resolve(file); // fallback se falhar
            }
          }, 'image/jpeg', 0.6); // Compressão de 60%
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const processLogoFile = async (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert("Apenas arquivos de imagem são permitidos.");
      return;
    }

    let fileToUpload = file;

    if (fileToUpload.size > 100 * 1024) {
      const wantsCompression = window.confirm(`A imagem original tem ${(file.size / 1024).toFixed(1)}KB (o limite é 100KB).\n\nDeseja que o sistema faça uma compressão rápida automática?`);
      if (!wantsCompression) return;
      
      setIsUploadingLogo(true); // Mostra "Enviando..." já durante a compressão
      fileToUpload = await compressImage(file);
      
      if (fileToUpload.size > 100 * 1024) {
        setIsUploadingLogo(false);
        alert("Não foi possível comprimir diretamente pelo site para menos de 100KB. Recomendo tirar outra print somente da logo adicionada ou comprimir você mesmo indo na ferramenta do suporte onde tem o conversor de imagens!");
        return;
      }
    } else {
      setIsUploadingLogo(true);
    }

    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../firebase');
      
      const uniqueName = `logo_${Date.now()}_${fileToUpload.name}`;
      const storageRef = ref(storage, `server_swap_logos/${uniqueName}`);
      
      await uploadBytes(storageRef, fileToUpload);
      const downloadUrl = await getDownloadURL(storageRef);
      
      setLogoUrl(downloadUrl);
      
      // Auto-check the item as Certo (1)
      const logoIndex = PROCEDURES.indexOf("Configurar Logo do cliente no login/PDV.");
      if (logoIndex !== -1) {
        setCheckedItems(prev => ({ ...prev, [logoIndex]: 1 }));
      }
    } catch (err) {
      console.error("Erro upload logo:", err);
      alert("Erro ao salvar a imagem no Firebase.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handlePasteLogo = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        processLogoFile(file);
        break;
      }
    }
  };

  const handleRemoveLogo = async (index) => {
    if (logoUrl) {
      try {
        const { ref, deleteObject } = await import('firebase/storage');
        const { storage } = await import('../firebase');
        const oldRef = ref(storage, logoUrl);
        await deleteObject(oldRef);
      } catch (err) {
        console.error("Erro ao apagar logo antiga do Storage:", err);
      }
    }
    setLogoUrl('');
    setCheckedItems(prev => ({ ...prev, [index]: 0 }));
  };

  return (
    <motion.div 
      className="server-swap-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={18} /> Voltar ao Dashboard
      </button>

      <div className="print-area" ref={printAreaRef} style={{ display: 'none' }}></div>

      <div className="tabs-nav no-print">
        <button 
          className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          <CheckSquare size={18} /> Troca / Checklist
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
                <h1><ServerCog className="icon" size={28} /> {editingId ? 'Editando Checklist' : 'Novo Checklist – Troca de Servidor'}</h1>
                <p>Procedimentos de Segurança e Migração Stor Sistemas</p>
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
                  <label>Técnico</label>
                  <input type="text" name="support" placeholder="Seu nome" value={formData.support} onChange={handleInputChange} />
                </div>
              </div>

              <div className="checklist-content">
                <div className="checklist-section">
                  <h2>Ações Obrigatórias</h2>
                  <div className="checklist-items">
                    {PROCEDURES.map((text, index) => {
                      const isLogoItem = text === "Configurar Logo do cliente no login/PDV.";
                      const currentRaw = checkedItems[index];
                      const currentState = typeof currentRaw === 'boolean' ? (currentRaw ? 1 : 0) : (currentRaw || 0);

                      return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                          <TriStateCheckbox 
                            state={currentState}
                            onChange={() => handleCheckCycle(index, text)}
                            label={text}
                          />
                          
                          {isLogoItem && currentState !== 2 && (
                            <div className="logo-upload-container">
                              {isUploadingLogo ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', padding: '16px', justifyContent: 'center' }}>
                                  <Loader2 size={20} className="spinner" /> Enviando...
                                </div>
                              ) : logoUrl ? (
                                <div className="logo-preview-wrapper">
                                  <img src={logoUrl} alt="Logo Cliente" />
                                  <button className="btn-remove-logo" onClick={() => handleRemoveLogo(index)}>
                                    <Trash2 size={14} /> Trocar Imagem
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  className="logo-dropzone" 
                                  tabIndex="0"
                                  onPaste={handlePasteLogo}
                                >
                                  <ImageIcon size={24} color="#94a3b8" />
                                  <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Clique para escolher ou <strong>Ctrl + V</strong> para colar (Máx 100KB)</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    style={{ display: 'none' }}
                                    id="logo-upload"
                                    onChange={(e) => processLogoFile(e.target.files[0])}
                                  />
                                  <label htmlFor="logo-upload" className="btn-primary" style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.85rem' }}>Procurar Imagem</label>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="checklist-section">
                  <h2>Observações Adicionais</h2>
                  <textarea 
                    name="observacoes"
                    className="observacoes-input"
                    placeholder="Anote aqui particularidades do cliente, problemas encontrados, pendências, senhas relevantes..."
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
                          <CheckSquare size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
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
                <p>Histórico de Trocas de Servidor Concluídas</p>
              </div>

              <div className="history-container">
                {finalizadosList.length === 0 ? (
                  <div className="empty-state">
                    <History size={48} opacity={0.5} style={{ margin: '0 auto 16px' }} />
                    <p>Nenhum registro de troca finalizada.</p>
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
                {selectedDetails.logoUrl && (
                  <div className="details-observacoes" style={{ marginTop: '16px' }}>
                    <strong>Logo do Cliente:</strong>
                    <div style={{ marginTop: '8px' }}>
                      <img src={selectedDetails.logoUrl} alt="Logo" style={{ maxHeight: '100px', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ServerSwap;
