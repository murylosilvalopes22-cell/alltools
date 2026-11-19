import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Filter, AlertTriangle, CheckCircle2, 
  Rocket, Plus, Trash2, Edit3, ShieldAlert, ListFilter, 
  Upload, Download, Layers, X, Save, RefreshCw,
  MessageSquare, Tag, Palette, Check
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import initialClientesData from '../data/initialClientesVersoes.json';
import * as XLSX from 'xlsx';
import './ControleVersoesClientes.css';

export const isVersionBelowTarget = (versao, target = "04.12.00.00") => {
  if (!versao || typeof versao !== 'string') return true;
  const cleanVer = versao.trim();
  if (cleanVer.toLowerCase().includes('inviável') || cleanVer.toLowerCase().includes('inviavel')) return false;
  
  const parseParts = (v) => v.split('.').map(num => parseInt(num, 10) || 0);
  const vParts = parseParts(cleanVer);
  const tParts = parseParts(target);

  for (let i = 0; i < Math.max(vParts.length, tParts.length); i++) {
    const vNum = vParts[i] || 0;
    const tNum = tParts[i] || 0;
    if (vNum < tNum) return true;
    if (vNum > tNum) return false;
  }
  return false;
};

const ControleVersoesClientes = ({ onBack }) => {
  const [clientes, setClientes] = useState(initialClientesData || []);
  const [versoesCadastradas, setVersoesCadastradas] = useState(() => {
    const defaultVersoes = Array.from(new Set((initialClientesData || []).map(c => c.versao))).filter(Boolean);
    return defaultVersoes.sort();
  });

  const [versaoAlvo, setVersaoAlvo] = useState("04.12.00.00");
  const versaoAlvoCurta = useMemo(() => versaoAlvo.split('.').slice(0, 2).join('.'), [versaoAlvo]);

  // Filtros da tabela
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVersao, setFilterVersao] = useState('');
  const [filterSituacao, setFilterSituacao] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterOnlyDesatualizados, setFilterOnlyDesatualizados] = useState(false);

  // Ordenação ao clicar no cabeçalho da tabela (Licença / Nome)
  const [sortField, setSortField] = useState('num');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Modais
  const [modalUpdateClient, setModalUpdateClient] = useState(null);
  const [selectedNewVersion, setSelectedNewVersion] = useState('');
  const [customVersionInput, setCustomVersionInput] = useState('');

  // Modal Observação / Etiquetas / Cor
  const [modalObsClient, setModalObsClient] = useState(null);
  const [obsInput, setObsInput] = useState('');
  const [corRowInput, setCorRowInput] = useState('');
  const [etiquetaInput, setEtiquetaInput] = useState('');

  const handleOpenObsModal = (cliente) => {
    setModalObsClient(cliente);
    setObsInput(cliente.obs || '');
    setCorRowInput(cliente.corRow || '');
    setEtiquetaInput(cliente.etiqueta || '');
  };

  const handleSaveObs = async () => {
    if (!modalObsClient) return;
    const updatedClientes = clientes.map(c => {
      if (c.id === modalObsClient.id) {
        return {
          ...c,
          obs: obsInput.trim(),
          corRow: corRowInput,
          etiqueta: etiquetaInput
        };
      }
      return c;
    });
    setClientes(updatedClientes);
    await saveToFirebase(updatedClientes, versoesCadastradas);
    setModalObsClient(null);
  };

  const [modalAddClient, setModalAddClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    num: '',
    nome: '',
    endereco: '',
    servidor: 'IMPLANTACAO',
    versao: '04.12.00.00',
    situacao: 'Ativa'
  });

  const [modalManageVersions, setModalManageVersions] = useState(false);
  const [newVersionToAdd, setNewVersionToAdd] = useState('');

  // Importação de Excel
  const fileInputRef = useRef(null);
  const [modalImportPreview, setModalImportPreview] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        processExcelData(jsonRows);
      } catch (err) {
        console.error("Erro ao ler excel:", err);
        alert("Ocorreu um erro ao tentar ler o arquivo Excel. Erro interno: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null;
  };

  const processExcelData = (rows) => {
    if (!rows || rows.length === 0) return;
    let headerRowIdx = -1;
    for(let i=0; i<Math.min(20, rows.length); i++) {
        const row = rows[i] || [];
        const txt = row.join(' ').toLowerCase();
        if ((txt.includes('num') || txt.includes('licen') || txt.includes('código')) && txt.includes('nome')) {
            headerRowIdx = i;
            break;
        }
    }
    
    if (headerRowIdx === -1) {
        alert("Não foi possível encontrar o cabeçalho da planilha. Verifique se contém as colunas Num. e Nome.");
        return;
    }

    const headers = Array.from(rows[headerRowIdx]).map(h => (h || '').toString().trim().toLowerCase());
    const colNum = headers.findIndex(h => h && (h.includes('num') || h.includes('licen') || h.includes('código') || h === 'id'));
    const colNome = headers.findIndex(h => h && (h === 'nome' || h.includes('cliente') || h.includes('razão social') || h.includes('razao social')));
    const colSistema = headers.findIndex(h => h === 'sistema');
    const colEndereco = headers.findIndex(h => h && (h.includes('endereço') || h.includes('endereco') || h.includes('cidade')));
    const colVersao = headers.findIndex(h => h && (h === 'versão' || h === 'versao'));
    const colSit = headers.findIndex(h => h && (h.includes('sit.') || h.includes('situacao') || h.includes('situação')));
    
    const newClientsData = [];
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const numRaw = colNum !== -1 ? row[colNum] : '';
        const nomeRaw = colNome !== -1 ? row[colNome] : '';
        if (!numRaw || !nomeRaw) continue;
        
        const num = String(numRaw).trim();
        const nome = String(nomeRaw).trim();
        
        // Pula linhas de separação que por acaso tenham algo escrito nas colunas principais
        const isSeparator = num.toLowerCase().includes('rota') || num.toLowerCase().includes('cidade') || nome.toLowerCase().includes('cidade');
        if (isSeparator) continue;

        // Evita duplicatas do mesmo cliente na planilha (ex: múltiplos terminais, mantém o primeiro que costuma ser o principal)
        if (newClientsData.some(c => c.num === num)) continue;

        const sistema = colSistema !== -1 && row[colSistema] ? String(row[colSistema]).trim() : '';
        const endereco = colEndereco !== -1 && row[colEndereco] ? String(row[colEndereco]).trim() : '';
        const versao = colVersao !== -1 && row[colVersao] ? String(row[colVersao]).trim() : '';
        const situacao = colSit !== -1 && row[colSit] ? String(row[colSit]).trim() : 'Ativa';
        
        newClientsData.push({ id: num, num, nome, sistema, endereco, versao, situacao });
    }
    
    const added = [];
    const updated = [];
    
    newClientsData.forEach(nc => {
        // clientes state may not be fully synced in this callback without taking it from current state,
        // but we are using it inside the component. We use the 'clientes' array.
        const existing = clientes.find(c => c.id === nc.id || c.num === nc.num);
        if (!existing) {
            added.push(nc);
        } else {
            // Preservar a formatação original (caixa alta/baixa) se a palavra for a mesma
            if (nc.nome && existing.nome && nc.nome.toLowerCase() === existing.nome.toLowerCase()) nc.nome = existing.nome;
            if (nc.situacao && existing.situacao && nc.situacao.toLowerCase() === existing.situacao.toLowerCase()) nc.situacao = existing.situacao;
            if (nc.versao && existing.versao && nc.versao.toLowerCase() === existing.versao.toLowerCase()) nc.versao = existing.versao;
            if (nc.endereco && existing.endereco && nc.endereco.toLowerCase() === existing.endereco.toLowerCase()) nc.endereco = existing.endereco;

            let changes = [];
            if (nc.nome && nc.nome !== existing.nome) changes.push(`Nome: ${existing.nome} -> ${nc.nome}`);
            if (nc.situacao && nc.situacao !== existing.situacao) changes.push(`Situação: ${existing.situacao} -> ${nc.situacao}`);
            if (nc.versao && nc.versao !== existing.versao) changes.push(`Versão: ${existing.versao} -> ${nc.versao}`);
            if (nc.endereco && nc.endereco !== existing.endereco) changes.push(`Endereço: ${existing.endereco} -> ${nc.endereco}`);
            
            if (changes.length > 0) {
                updated.push({ original: existing, novo: nc, changes });
            }
        }
    });
    
    setModalImportPreview({ added, updated, allParsed: newClientsData });
  };
  
  const handleConfirmImport = async () => {
    if (!modalImportPreview) return;
    let updatedClientes = [...clientes];
    let newVersions = [...versoesCadastradas];
    
    modalImportPreview.updated.forEach(item => {
        const idx = updatedClientes.findIndex(c => c.id === item.original.id);
        if (idx !== -1) {
            updatedClientes[idx] = { 
                ...updatedClientes[idx], 
                nome: item.novo.nome || updatedClientes[idx].nome,
                situacao: item.novo.situacao || updatedClientes[idx].situacao,
                versao: item.novo.versao || updatedClientes[idx].versao,
                sistema: item.novo.sistema || updatedClientes[idx].sistema,
                endereco: item.novo.endereco || updatedClientes[idx].endereco,
                atualizadoEm: Date.now()
            };
            if (item.novo.versao && !newVersions.includes(item.novo.versao)) newVersions.push(item.novo.versao);
        }
    });
    
    modalImportPreview.added.forEach(item => {
        updatedClientes.unshift({
            ...item,
            servidor: 'IMPORTADO',
            atualizadoEm: Date.now()
        });
        if (item.versao && !newVersions.includes(item.versao)) newVersions.push(item.versao);
    });
    
    newVersions.sort();
    setClientes(updatedClientes);
    setVersoesCadastradas(newVersions);
    await saveToFirebase(updatedClientes, newVersions);
    setModalImportPreview(null);
  };


  useEffect(() => {
    const docRef = doc(db, 'gestao_sistemas', 'controle_versoes_clientes');
    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.clientes && Array.isArray(data.clientes)) {
          setClientes(data.clientes);
        }
        if (data && data.versoesCadastradas && Array.isArray(data.versoesCadastradas)) {
          setVersoesCadastradas(data.versoesCadastradas);
        }
        if (data && data.versaoAlvo) {
          setVersaoAlvo(data.versaoAlvo);
        }
      } else {
        const defaultVersoes = Array.from(new Set((initialClientesData || []).map(c => c.versao))).filter(Boolean).sort();
        try {
          await setDoc(docRef, {
            clientes: initialClientesData || [],
            versoesCadastradas: defaultVersoes,
            versaoAlvo: "04.12.00.00",
            atualizadoEm: Date.now()
          });
        } catch (err) {
          console.error("Erro ao inicializar Firebase:", err);
        }
      }
    }, (error) => {
      console.warn("Aviso: executando em modo local offline ou erro no Firebase", error);
    });

    return () => unsubscribe();
  }, []);

  const saveToFirebase = async (newClientes, newVersoes, newAlvo = versaoAlvo) => {
    try {
      const docRef = doc(db, 'gestao_sistemas', 'controle_versoes_clientes');
      await setDoc(docRef, {
        clientes: newClientes,
        versoesCadastradas: newVersoes || versoesCadastradas,
        versaoAlvo: newAlvo,
        atualizadoEm: Date.now()
      }, { merge: true });
    } catch (err) {
      console.error("Erro ao salvar no Firebase:", err);
    }
  };

  const handleChangeVersaoAlvo = async (novaAlvo) => {
    if (!novaAlvo) return;
    setVersaoAlvo(novaAlvo);
    await saveToFirebase(clientes, versoesCadastradas, novaAlvo);
  };

  const situacoesUnicas = useMemo(() => {
    const setSit = new Set(clientes.map(c => c.situacao || 'Ativa'));
    return Array.from(setSit).sort();
  }, [clientes]);

  const tagsUnicas = useMemo(() => {
    const setTags = new Set();
    clientes.forEach(c => {
      if (c.etiqueta && c.etiqueta.trim()) setTags.add(c.etiqueta.trim());
    });
    return Array.from(setTags).sort();
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    const filtrados = clientes.filter(cliente => {
      const nomeMatch = !searchTerm || (
        (cliente.nome && cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cliente.num && String(cliente.num).toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cliente.obs && cliente.obs.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cliente.etiqueta && cliente.etiqueta.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      const isBelow = isVersionBelowTarget(cliente.versao, versaoAlvo);

      let versaoMatch = true;
      if (filterVersao === '') {
        versaoMatch = isBelow;
      } else if (filterVersao === 'ALL') {
        versaoMatch = true;
      } else if (filterVersao === 'ONLY_OK') {
        versaoMatch = !isBelow;
      } else {
        versaoMatch = cliente.versao === filterVersao;
      }

      const situacaoMatch = !filterSituacao || cliente.situacao === filterSituacao;

      let tagMatch = true;
      if (filterTag === 'ONLY_WITH_OBS') {
        tagMatch = Boolean(cliente.obs || cliente.etiqueta);
      } else if (filterTag === 'ONLY_WITHOUT_OBS') {
        tagMatch = !cliente.obs && !cliente.etiqueta;
      } else if (filterTag && filterTag !== '') {
        tagMatch = (cliente.etiqueta && cliente.etiqueta.trim() === filterTag);
      }

      return nomeMatch && versaoMatch && situacaoMatch && tagMatch;
    });

    return filtrados.sort((a, b) => {
      if (sortField === 'num') {
        const numA = parseInt(String(a.num || a.id || '0').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.num || b.id || '0').replace(/\D/g, ''), 10) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      } else if (sortField === 'nome') {
        const strA = (a.nome || '').toLowerCase();
        const strB = (b.nome || '').toLowerCase();
        return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      } else if (sortField === 'ver') {
        const parseVer = (v) => (String(v || '0.0.0.0')).split('.').map(n => parseInt(n.replace(/\D/g, ''), 10) || 0);
        const partsA = parseVer(a.versao);
        const partsB = parseVer(b.versao);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const numA = partsA[i] || 0;
          const numB = partsB[i] || 0;
          if (numA !== numB) {
            return sortOrder === 'asc' ? numA - numB : numB - numA;
          }
        }
        return 0;
      }
      return 0;
    });
  }, [clientes, searchTerm, filterVersao, filterSituacao, filterTag, sortField, sortOrder, versaoAlvo]);

  const totalClientes = clientes.length;
  const desatualizadosCount = useMemo(() => {
    return clientes.filter(c => isVersionBelowTarget(c.versao, versaoAlvo)).length;
  }, [clientes, versaoAlvo]);
  const atualizadosCount = totalClientes - desatualizadosCount;
  const atualizadosPercent = totalClientes > 0 ? Math.round((atualizadosCount / totalClientes) * 100) : 0;

  const handleUpdateClientVersion = async () => {
    if (!modalUpdateClient) return;

    let targetVersion = selectedNewVersion;
    let updatedVersionsList = [...versoesCadastradas];

    if (targetVersion === 'CUSTOM' || !targetVersion) {
      if (!customVersionInput.trim()) {
        alert('Por favor, informe a nova versão!');
        return;
      }
      targetVersion = customVersionInput.trim();
      if (!updatedVersionsList.includes(targetVersion)) {
        updatedVersionsList.push(targetVersion);
        updatedVersionsList.sort();
        setVersoesCadastradas(updatedVersionsList);
      }
    }

    const updatedClientes = clientes.map(c => {
      if (c.id === modalUpdateClient.id) {
        return { ...c, versao: targetVersion, atualizadoEm: Date.now() };
      }
      return c;
    });

    setClientes(updatedClientes);
    await saveToFirebase(updatedClientes, updatedVersionsList);
    setModalUpdateClient(null);
    setSelectedNewVersion('');
    setCustomVersionInput('');
  };

  const handleAddVersionGeneral = async () => {
    if (!newVersionToAdd.trim()) return;
    const cleanVer = newVersionToAdd.trim();
    if (versoesCadastradas.includes(cleanVer)) {
      alert('Essa versão já existe na lista!');
      return;
    }
    const updated = [...versoesCadastradas, cleanVer].sort();
    setVersoesCadastradas(updated);
    setNewVersionToAdd('');
    await saveToFirebase(clientes, updated);
  };

  const handleRemoveVersionGeneral = async (verToRemove) => {
    if (window.confirm(`Deseja remover a versão "${verToRemove}" da lista rápida? (Isso não altera os clientes que já usam essa versão)`)) {
      const updated = versoesCadastradas.filter(v => v !== verToRemove);
      setVersoesCadastradas(updated);
      await saveToFirebase(clientes, updated);
    }
  };

  const handleSaveNewClient = async (e) => {
    e.preventDefault();
    if (!newClientForm.nome.trim()) return;

    const newId = newClientForm.num || String(Date.now());
    const newClient = {
      ...newClientForm,
      id: newId,
      atualizadoEm: Date.now()
    };

    let updatedVersionsList = [...versoesCadastradas];
    if (newClient.versao && !updatedVersionsList.includes(newClient.versao)) {
      updatedVersionsList.push(newClient.versao);
      updatedVersionsList.sort();
      setVersoesCadastradas(updatedVersionsList);
    }

    const updatedClientes = [newClient, ...clientes];
    setClientes(updatedClientes);
    await saveToFirebase(updatedClientes, updatedVersionsList);
    setModalAddClient(false);
    setNewClientForm({
      num: '',
      nome: '',
      endereco: '',
      servidor: 'IMPLANTACAO',
      versao: '04.12.00.00',
      situacao: 'Ativa'
    });
  };

  const handleDeleteClient = async (id, nome) => {
    if (window.confirm(`Deseja excluir o cliente "${nome}" da tabela de controle?`)) {
      const updated = clientes.filter(c => c.id !== id);
      setClientes(updated);
      await saveToFirebase(updated, versoesCadastradas);
    }
  };

  const handleResetToSheet = async () => {
    if (window.confirm('Atenção: Deseja restaurar a tabela original com os 355 clientes da planilha?')) {
      const defaultVersoes = Array.from(new Set((initialClientesData || []).map(c => c.versao))).filter(Boolean).sort();
      setClientes(initialClientesData || []);
      setVersoesCadastradas(defaultVersoes);
      await saveToFirebase(initialClientesData || [], defaultVersoes);
    }
  };

  const handleExportExcel = () => {
    if (clientesFiltrados.length === 0) {
      alert('Não há clientes visíveis no filtro atual para exportar.');
      return;
    }

    const exportRows = clientesFiltrados.map(c => ({
      'Licença': c.num || c.id || '',
      'Nome do Cliente': c.nome || '',
      'Sistema': c.sistema || '',
      'Versão': c.versao || '',
      'Situação': c.situacao || '',
      'Tag / Etiqueta': c.etiqueta || '',
      'Observação': c.obs || '',
      'Endereço': c.endereco || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `clientes_versoes_${dateStr}.xlsx`);
  };

  return (
    <motion.div 
      className="controle-versoes-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Topo Compacto */}
      <div className="controle-top-section">
        <div className="controle-header-left">
          <div className="controle-title-box">
            <ShieldAlert size={22} style={{ color: '#eab308' }} />
            <h1>Controle de Versões</h1>
          </div>
        </div>

        {/* Ribbons Compactos de KPIs (Filtros Rápidos) */}
        <div className="controle-kpi-ribbon">
          <button
            type="button"
            className={`kpi-pill total ${filterVersao === 'ALL' ? 'active-kpi' : ''}`}
            onClick={() => setFilterVersao('ALL')}
            title="Clique para mostrar todos os clientes"
          >
            <span>Total:</span>
            <strong>{totalClientes}</strong>
          </button>
          <button
            type="button"
            className={`kpi-pill warning ${filterVersao === '' ? 'active-kpi' : ''}`}
            onClick={() => setFilterVersao('')}
            title={`Clique para filtrar apenas versões abaixo da ${versaoAlvo}`}
          >
            <span>&lt; {versaoAlvoCurta}:</span>
            <strong>{desatualizadosCount}</strong>
          </button>
          <button
            type="button"
            className={`kpi-pill success ${filterVersao === 'ONLY_OK' ? 'active-kpi' : ''}`}
            onClick={() => setFilterVersao('ONLY_OK')}
            title={`Clique para filtrar apenas clientes atualizados (≥ ${versaoAlvoCurta})`}
          >
            <span>Atualizados:</span>
            <strong>{atualizadosCount}</strong>
            <small>({atualizadosPercent}%)</small>
          </button>
        </div>

        {/* Botões do Topo */}
        <div className="controle-header-actions">
          <button className="btn-compact-action btn-new-client" onClick={() => setModalAddClient(true)}>
            <Plus size={16} /> Novo Cliente
          </button>
          <button className="btn-compact-action btn-manage-ver" onClick={() => setModalManageVersions(true)}>
            <Layers size={16} /> Versões ({versoesCadastradas.length})
          </button>
          <input 
            type="file" 
            accept=".xls,.xlsx" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button className="btn-compact-action btn-manage-ver" onClick={() => fileInputRef.current.click()} title="Importar/Sincronizar Excel de Clientes">
            <Upload size={16} /> Importar Excel
          </button>
          <button className="btn-compact-action btn-manage-ver" onClick={handleExportExcel} title="Exportar lista atual para Excel">
            <Download size={16} /> Exportar Excel
          </button>
          <button 
            className="btn-compact-action btn-manage-ver" 
            onClick={handleResetToSheet} 
            title="Restaurar da Planilha Excel original"
            style={{ padding: '7px 10px' }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros Compacta */}
      <div className="controle-toolbar-compact">
        <div className="search-box-clientes">
          <Search size={16} className="search-icon-clientes" />
          <input 
            type="text" 
            placeholder="Pesquisar por Nome, Num. ou Endereço..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select 
            className="filter-select"
            value={filterVersao}
            onChange={(e) => setFilterVersao(e.target.value)}
          >
            <option value="">Padrão: Apenas Desatualizados (&lt; {versaoAlvoCurta})</option>
            <option value="ALL">Mostrar Todas as Versões ({totalClientes})</option>
            <option value="ONLY_OK">Apenas Atualizados (≥ {versaoAlvoCurta})</option>
            {versoesCadastradas.map((ver, idx) => (
              <option key={idx} value={ver}>{ver} {isVersionBelowTarget(ver, versaoAlvo) ? `(< ${versaoAlvoCurta})` : ''}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={filterSituacao}
            onChange={(e) => setFilterSituacao(e.target.value)}
          >
            <option value="">Todas as Situações</option>
            {situacoesUnicas.map((sit, idx) => {
              const isEp = (sit || '').toLowerCase().includes('implanta') || (sit || '').toUpperCase() === 'EP';
              return (
                <option key={idx} value={sit}>{isEp ? 'EP (Em implantação)' : sit}</option>
              );
            })}
          </select>

          <select 
            className="filter-select"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="">Todas as Obs. / Tags</option>
            <option value="ONLY_WITH_OBS">Com alguma Obs. ou Tag</option>
            <option value="ONLY_WITHOUT_OBS">Sem Obs. ou Tag</option>
            {tagsUnicas.map((tag, idx) => (
              <option key={idx} value={tag}>Tag: {tag}</option>
            ))}
          </select>

          <button 
            className={`btn-filter-warning ${filterVersao === '' ? 'active' : ''}`}
            onClick={() => setFilterVersao(filterVersao === '' ? 'ALL' : '')}
            title={filterVersao === '' ? 'Clique para mostrar todos os clientes (incluindo atualizados)' : 'Clique para filtrar apenas os desatualizados'}
          >
            <AlertTriangle size={15} /> {filterVersao === '' ? `Exibindo: < ${versaoAlvoCurta} (Clique p/ Todos)` : `Filtrar Apenas < ${versaoAlvoCurta}`}
          </button>
        </div>
      </div>

      {/* Tabela de Clientes com Coluna de Ações Sempre Visível (Sticky Right) */}
      <div className="tabela-container-scroll">
        <div className="tabela-wrapper">
          <table className="clientes-tabela">
            <thead>
              <tr>
                <th 
                  className="col-num sortable-th" 
                  onClick={() => handleSort('num')} 
                  title="Clique para ordenar pela numeração da Licença (menor p/ maior ou maior p/ menor)"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', justifyContent: 'center' }}>
                    Licença
                    {sortField === 'num' ? (
                      <span style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    ) : (
                      <span style={{ opacity: 0.3, fontSize: '0.85rem' }}>↕</span>
                    )}
                  </div>
                </th>
                <th 
                  className="col-nome sortable-th" 
                  onClick={() => handleSort('nome')} 
                  title="Clique para ordenar pelo Nome do Cliente (A-Z ou Z-A)"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Nome do Cliente
                    {sortField === 'nome' ? (
                      <span style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    ) : (
                      <span style={{ opacity: 0.3, fontSize: '0.85rem' }}>↕</span>
                    )}
                  </div>
                </th>
                <th className="col-obs">Obs. / Tag</th>
                <th className="col-sit">Situação</th>
                <th 
                  className="col-ver sortable-th" 
                  onClick={() => handleSort('ver')} 
                  title="Clique para ordenar pela Versão do Cliente (menor p/ maior ou maior p/ menor)"
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                    Versão
                    {sortField === 'ver' ? (
                      <span style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    ) : (
                      <span style={{ opacity: 0.3, fontSize: '0.85rem' }}>↕</span>
                    )}
                  </div>
                </th>
                <th className="col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <ListFilter size={36} style={{ opacity: 0.3 }} />
                      <span>Nenhum cliente encontrado com os filtros atuais.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => {
                  const isBelow = isVersionBelowTarget(cliente.versao, versaoAlvo);
                  const isTef = cliente.etiqueta === 'Stor Smart TEF';
                  const isUrgent = isBelow && isTef;
                  
                  return (
                    <tr key={cliente.id} className={`${isUrgent ? 'row-urgent-update' : (isBelow ? 'row-warning-update' : '')} ${cliente.corRow ? `row-color-${cliente.corRow}` : ''}`.trim()}>
                      <td className="col-num" title={`Licença Nº ${cliente.num || cliente.id}`}>
                        <strong style={{ fontSize: '0.94rem', color: 'var(--neon-cyan)', fontWeight: 800 }}>{cliente.num || cliente.id}</strong>
                      </td>
                      <td className="col-nome" title={cliente.nome}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cliente.nome}</div>
                        {cliente.sistema && <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{cliente.sistema}</span>}
                      </td>
                      <td className="col-obs" onClick={() => handleOpenObsModal(cliente)} title="Clique para editar Observações, Etiquetas e Cor do Cliente">
                        <div className="obs-cell-wrapper">
                          {!cliente.obs && !cliente.etiqueta ? (
                            <button type="button" className="btn-add-obs-cell" onClick={(e) => { e.stopPropagation(); handleOpenObsModal(cliente); }}>
                              <Plus size={13} /> + Obs / Tag
                            </button>
                          ) : (
                            <>
                              {cliente.etiqueta && (
                                <span className={`obs-badge-pill ${cliente.corRow || 'purple'}`}>
                                  {cliente.etiqueta === 'Agendado' && '📅 '}
                                  {cliente.etiqueta.includes('NDD') && '⚡ '}
                                  {cliente.etiqueta === 'Urgente' && '🚨 '}
                                  {cliente.etiqueta === 'Em Contato' && '💡 '}
                                  {cliente.etiqueta === 'Concluído' && '✅ '}
                                  {cliente.etiqueta}
                                </span>
                              )}
                              {cliente.obs && (
                                <div className="obs-text-snippet" title={cliente.obs}>
                                  "{cliente.obs}"
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="col-sit">
                        {(() => {
                          const sit = (cliente.situacao || 'Ativa').trim();
                          const isEp = sit.toLowerCase().includes('implanta') || sit.toUpperCase() === 'EP';
                          return (
                            <span className={`situacao-pill ${isEp ? 'ep' : sit.toLowerCase()}`} title={sit}>
                              {isEp ? 'EP' : sit}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="col-ver">
                        {isBelow ? (
                          <span className={`badge-versao ${isUrgent ? 'urgent' : 'warning'}`} title={`Abaixo da ${versaoAlvo} — Precisa Atualizar!`}>
                            {cliente.versao}
                          </span>
                        ) : (
                          <span className="badge-versao ok" title="Versão Atualizada">
                            {cliente.versao}
                          </span>
                        )}
                      </td>
                      <td className="col-acoes-td">
                        <div className="td-acoes">
                          <button 
                            className={`btn-update-action ${isBelow ? 'warning-btn' : ''}`}
                            onClick={() => {
                              setModalUpdateClient(cliente);
                              setSelectedNewVersion(versoesCadastradas[versoesCadastradas.length - 1] || versaoAlvo);
                              setCustomVersionInput('');
                            }}
                            title="Alterar Versão do Cliente"
                          >
                            Atualizar
                          </button>
                          <button 
                            className="btn-trash-action" 
                            onClick={() => handleDeleteClient(cliente.id, cliente.nome)}
                            title="Excluir cliente"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Atualização de Versão */}
      <AnimatePresence>
        {modalUpdateClient && (
          <div className="modal-overlay-clientes" onClick={() => setModalUpdateClient(null)}>
            <motion.div 
              className="modal-content-clientes"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="modal-header-clientes">
                <h3><Rocket size={20} style={{ color: 'var(--neon-cyan)' }} /> Atualizar Versão do Cliente</h3>
                <button className="btn-icon" onClick={() => setModalUpdateClient(null)}><X size={18} /></button>
              </div>

              <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-light)' }}>
                <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '2px' }}>{modalUpdateClient.nome}</strong>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Versão Atual no terminal: </span>
                <strong style={{ color: isVersionBelowTarget(modalUpdateClient.versao, versaoAlvo) ? '#eab308' : '#10b981', fontSize: '0.94rem' }}>
                  {modalUpdateClient.versao}
                </strong>
              </div>

              <div className="form-group-clientes">
                <label>Selecione a Nova Versão ou Digite uma Customizada:</label>
                <select 
                  value={selectedNewVersion}
                  onChange={(e) => setSelectedNewVersion(e.target.value)}
                >
                  {versoesCadastradas.map((ver, idx) => (
                    <option key={idx} value={ver}>
                      {ver} {ver === modalUpdateClient.versao ? '(Atual)' : ''}
                    </option>
                  ))}
                  <option value="CUSTOM">➕ Digitar uma Nova Versão manual...</option>
                </select>
              </div>

              {selectedNewVersion === 'CUSTOM' && (
                <div className="form-group-clientes" style={{ marginTop: '12px' }}>
                  <label>Digite o Número da Nova Versão (Ex: 04.12.00.01):</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 04.12.00.01" 
                    value={customVersionInput}
                    onChange={(e) => setCustomVersionInput(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div className="modal-actions-clientes">
                <button className="btn-compact-action btn-manage-ver" onClick={() => setModalUpdateClient(null)}>Cancelar</button>
                <button className="btn-compact-action btn-new-client" onClick={handleUpdateClientVersion}>
                  <Save size={15} /> Confirmar Atualização
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Adicionar Cliente */}
      <AnimatePresence>
        {modalAddClient && (
          <div className="modal-overlay-clientes" onClick={() => setModalAddClient(false)}>
            <motion.div 
              className="modal-content-clientes"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="modal-header-clientes">
                <h3><Plus size={20} style={{ color: 'var(--neon-cyan)' }} /> Adicionar Novo Cliente</h3>
                <button className="btn-icon" onClick={() => setModalAddClient(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleSaveNewClient}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '12px' }}>
                  <div className="form-group-clientes">
                    <label>Num. / ID:</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 2500" 
                      value={newClientForm.num}
                      onChange={(e) => setNewClientForm({...newClientForm, num: e.target.value})}
                    />
                  </div>
                  <div className="form-group-clientes">
                    <label>Nome do Cliente:*</label>
                    <input 
                      type="text" 
                      placeholder="Ex: MERCADO EXEMPLO" 
                      required
                      value={newClientForm.nome}
                      onChange={(e) => setNewClientForm({...newClientForm, nome: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group-clientes">
                  <label>Endereço:</label>
                  <input 
                    type="text" 
                    placeholder="Ex: RUA BRASIL, 1000, CENTRO" 
                    value={newClientForm.endereco}
                    onChange={(e) => setNewClientForm({...newClientForm, endereco: e.target.value})}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group-clientes">
                    <label>Versão Inicial:</label>
                    <input 
                      type="text" 
                      placeholder="04.12.00.00" 
                      value={newClientForm.versao}
                      onChange={(e) => setNewClientForm({...newClientForm, versao: e.target.value})}
                    />
                  </div>
                  <div className="form-group-clientes">
                    <label>Servidor:</label>
                    <input 
                      type="text" 
                      placeholder="IMPLANTACAO" 
                      value={newClientForm.servidor}
                      onChange={(e) => setNewClientForm({...newClientForm, servidor: e.target.value})}
                    />
                  </div>
                  <div className="form-group-clientes">
                    <label>Situação:</label>
                    <select 
                      value={newClientForm.situacao}
                      onChange={(e) => setNewClientForm({...newClientForm, situacao: e.target.value})}
                    >
                      <option value="Ativa">Ativa</option>
                      <option value="Em implantação">EP (Em implantação)</option>
                      <option value="Bloqueada">Bloqueada</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions-clientes">
                  <button type="button" className="btn-compact-action btn-manage-ver" onClick={() => setModalAddClient(false)}>Cancelar</button>
                  <button type="submit" className="btn-compact-action btn-new-client">
                    <Plus size={15} /> Cadastrar Cliente
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Gerenciamento de Versões */}
      <AnimatePresence>
        {modalManageVersions && (
          <div className="modal-overlay-clientes" onClick={() => setModalManageVersions(false)}>
            <motion.div 
              className="modal-content-clientes"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="modal-header-clientes">
                <h3><Layers size={20} style={{ color: 'var(--neon-cyan)' }} /> Gerenciar Lista de Versões</h3>
                <button className="btn-icon" onClick={() => setModalManageVersions(false)}><X size={18} /></button>
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                Adicione ou remova as versões que ficam disponíveis no dropdown de atualização de clientes, e defina a versão-alvo mínima de alerta.
              </p>

              <div className="target-version-box">
                <div className="target-version-header">
                  <label htmlFor="select-versao-alvo">Versão-Alvo Mínima (Referência de Alerta):</label>
                  <span className="target-active-badge">Alvo Atual: {versaoAlvo}</span>
                </div>
                <select
                  id="select-versao-alvo"
                  className="filter-select target-ver-select"
                  value={versaoAlvo}
                  onChange={(e) => handleChangeVersaoAlvo(e.target.value)}
                >
                  {!versoesCadastradas.includes(versaoAlvo) && (
                    <option value={versaoAlvo}>{versaoAlvo} (Alvo Atual)</option>
                  )}
                  {versoesCadastradas.map((ver, idx) => (
                    <option key={idx} value={ver}>
                      {ver} {ver === versaoAlvo ? '(Alvo Atual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="input-new-version"
                  placeholder="Ex: 04.12.01.00" 
                  value={newVersionToAdd}
                  onChange={(e) => setNewVersionToAdd(e.target.value)}
                />
                <button type="button" className="btn-compact-action btn-new-client" onClick={handleAddVersionGeneral}>
                  Adicionar
                </button>
              </div>

              <h4 style={{ marginTop: '18px', marginBottom: '8px', fontSize: '0.88rem' }}>Versões Cadastradas no Sistema ({versoesCadastradas.length}):</h4>
              <div className="versions-list-grid">
                {versoesCadastradas.map((ver, idx) => {
                  const isBelow = isVersionBelowTarget(ver, versaoAlvo);
                  const isTarget = ver === versaoAlvo;
                  return (
                    <div key={idx} className={`version-chip ${isBelow ? 'below-0407' : 'ok-0407'} ${isTarget ? 'is-target-chip' : ''}`}>
                      <span>{ver}</span>
                      <button
                        type="button"
                        className={`btn-set-target-ver ${isTarget ? 'active' : ''}`}
                        onClick={() => handleChangeVersaoAlvo(ver)}
                        title={isTarget ? 'Esta já é a versão-alvo mínima' : `Definir ${ver} como versão-alvo mínima`}
                      >
                        {isTarget ? 'Alvo ✓' : 'Alvo'}
                      </button>
                      <button className="btn-remove-ver" onClick={() => handleRemoveVersionGeneral(ver)} title="Remover versão da lista">
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions-clientes">
                <button className="btn-compact-action btn-new-client" onClick={() => setModalManageVersions(false)}>Concluído</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de Observação e Etiquetas */}
        {modalObsClient && (
          <div className="modal-overlay-clientes" onClick={() => setModalObsClient(null)}>
            <motion.div 
              className="modal-content-clientes" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ maxWidth: '520px' }}
            >
              <div className="modal-header-clientes">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    Observações e Status
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--neon-cyan)', fontWeight: 700 }}>
                    {modalObsClient.nome} (Licença: {modalObsClient.num || modalObsClient.id})
                  </p>
                </div>
                <button className="btn-icon" onClick={() => setModalObsClient(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body-clientes" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Ações e Status Rápidos (1 clique):
                  </label>
                  <div className="preset-tags-grid">
                    {[
                      { label: '📅 Agendado', tag: 'Agendado', color: 'purple' },
                      { label: '⚡ Utiliza NDD', tag: 'Utiliza NDD', color: 'teal' },
                      { label: '🚨 Urgente / Cobrar', tag: 'Urgente', color: 'red' },
                      { label: '💡 Em Contato', tag: 'Em Contato', color: 'blue' },
                      { label: '✅ Concluído', tag: 'Concluído', color: 'green' },
                      { label: '🔸 Pendente', tag: 'Pendente', color: 'orange' }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`btn-preset-tag ${item.color} ${etiquetaInput === item.tag && corRowInput === item.color ? 'active' : ''}`}
                        onClick={() => {
                          setEtiquetaInput(item.tag);
                          setCorRowInput(item.color);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn-preset-tag"
                      style={{ color: '#94a3b8' }}
                      onClick={() => {
                        setEtiquetaInput('');
                        setCorRowInput('');
                      }}
                      title="Limpar etiqueta e cor da linha"
                    >
                      🧹 Limpar
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Cor da Linha na Tabela:
                  </label>
                  <div className="swatches-color-row">
                    {[
                      { color: '', title: 'Sem cor (Padrão)' },
                      { color: 'purple', title: 'Roxo (Agendado)' },
                      { color: 'teal', title: 'Ciano (NDD)' },
                      { color: 'red', title: 'Vermelho (Urgente)' },
                      { color: 'blue', title: 'Azul (Em Contato)' },
                      { color: 'green', title: 'Verde (Concluído)' },
                      { color: 'orange', title: 'Laranja (Pendente)' }
                    ].map((swtch, idx) => (
                      <div
                        key={idx}
                        className={`swatch-item ${swtch.color || 'none'} ${corRowInput === swtch.color ? 'active' : ''}`}
                        title={swtch.title}
                        onClick={() => setCorRowInput(swtch.color)}
                      >
                        {corRowInput === swtch.color && <Check size={14} color="#fff" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Observações Livres (Anotações do Suporte/Dev):
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Escreva detalhes técnicos, agendamentos com horário, notas sobre o cliente..."
                    value={obsInput}
                    onChange={(e) => setObsInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: 'rgba(0,0,0,0.35)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      fontSize: '0.88rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions-clientes" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-compact-action btn-manage-ver" onClick={() => setModalObsClient(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn-compact-action btn-new-client" onClick={handleSaveObs}>
                  <Save size={16} /> Salvar Observação
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Modal de Preview de Importação */}
        {modalImportPreview && (
          <div className="modal-overlay-clientes" onClick={() => setModalImportPreview(null)}>
            <motion.div 
              className="modal-content-clientes" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            >
              <div className="modal-header-clientes" style={{ flexShrink: 0 }}>
                <h3><Upload size={20} style={{ color: 'var(--neon-cyan)' }} /> Changelog de Importação</h3>
                <button className="btn-icon" onClick={() => setModalImportPreview(null)}><X size={18} /></button>
              </div>

              <div className="modal-body-clientes" style={{ overflowY: 'auto', flex: 1, padding: '10px 0', fontSize: '0.88rem' }}>
                <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
                  A planilha foi processada. Abaixo está o resumo das alterações que serão feitas no banco de dados.
                  Clientes já existentes com dados idênticos foram ignorados.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: '#10b981', marginBottom: '8px' }}>
                    Novos Clientes a serem Adicionados ({modalImportPreview.added.length})
                  </h4>
                  {modalImportPreview.added.length === 0 ? (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhum novo cliente encontrado.</span>
                  ) : (
                    <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-primary)' }}>
                      {modalImportPreview.added.map((item, idx) => (
                        <li key={idx}><strong>{item.num}</strong> - {item.nome} {item.versao ? `(Versão: ${item.versao})` : ''}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 style={{ color: '#eab308', marginBottom: '8px' }}>
                    Clientes Existentes com Alterações ({modalImportPreview.updated.length})
                  </h4>
                  {modalImportPreview.updated.length === 0 ? (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhuma alteração nos clientes existentes.</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {modalImportPreview.updated.map((item, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px' }}>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>{item.original.num} - {item.original.nome}</strong>
                          <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)' }}>
                            {item.changes.map((change, cIdx) => (
                              <li key={cIdx}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions-clientes" style={{ marginTop: '16px', flexShrink: 0 }}>
                <button type="button" className="btn-compact-action btn-manage-ver" onClick={() => setModalImportPreview(null)}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn-compact-action btn-new-client" 
                  onClick={handleConfirmImport}
                  disabled={modalImportPreview.added.length === 0 && modalImportPreview.updated.length === 0}
                  style={{ opacity: (modalImportPreview.added.length === 0 && modalImportPreview.updated.length === 0) ? 0.5 : 1 }}
                >
                  <Save size={16} /> Confirmar Importação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ControleVersoesClientes;
