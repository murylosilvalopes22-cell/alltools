import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Lightbulb, Plus, CheckCircle2, Circle, 
  Trash2, User, Clock, ChevronRight, Edit2, Save, X, Pin, Printer, Image as ImageIcon, Loader2, Download, XOctagon, Combine, CheckCheck, MessageSquareCode
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, runTransaction, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import './CaseStudies.css';

const CaseStudies = ({ onBack, theme }) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newIdeaText, setNewIdeaText] = useState('');
  const [newIdeaAuthor, setNewIdeaAuthor] = useState('');
  const [newIdeaImages, setNewIdeaImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editTopicTitle, setEditTopicTitle] = useState('');

  const [editingIdeaId, setEditingIdeaId] = useState(null);
  const [editIdeaText, setEditIdeaText] = useState('');
  const [editIdeaImages, setEditIdeaImages] = useState([]);
  const [editNewImages, setEditNewImages] = useState([]);

  const [showCompleted, setShowCompleted] = useState(true);

  // Estados para Mesclagem de Ideias
  const [isMerging, setIsMerging] = useState(false);
  const [selectedMergeIdeas, setSelectedMergeIdeas] = useState([]);

  // Estados para Observação do Desenvolvimento
  const [obsDevIdeaId, setObsDevIdeaId] = useState(null);
  const [obsDevText, setObsDevText] = useState('');

  useEffect(() => {
    const collRef = collection(db, 'estudos_caso');
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      // Sort by creation date descending
      data.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
      setTopics(data);
      
      // Update selected topic safely without triggering re-subscription
      setSelectedTopic(prev => {
        if (prev) {
          const updated = data.find(t => t.id === prev.id);
          return updated || null; // returns updated topic or null if deleted
        }
        return prev;
      });
    });

    return () => unsubscribe();
  }, []);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    try {
      const docRef = doc(collection(db, 'estudos_caso'));
      await setDoc(docRef, {
        titulo: newTopicTitle.trim(),
        criadoEm: Date.now(),
        emPauta: false,
        ideias: []
      });
      setNewTopicTitle('');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar tópico.');
    }
  };

  const handleDeleteTopic = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Tem certeza que deseja apagar este módulo e todas as suas ideias?")) {
      try {
        await deleteDoc(doc(db, 'estudos_caso', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveTopicEdit = async (e, id) => {
    e.stopPropagation();
    if (!editTopicTitle.trim()) return;
    try {
      await updateDoc(doc(db, 'estudos_caso', id), {
        titulo: editTopicTitle.trim()
      });
      setEditingTopicId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar tópico.');
    }
  };

  const handleToggleTopicPin = async (e, id, currentPauta) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'estudos_caso', id), {
        emPauta: !currentPauta
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      setNewIdeaImages(Array.from(e.target.files));
    }
  };

  const handleAddIdea = async (e) => {
    e.preventDefault();
    if (!newIdeaText.trim() || !selectedTopic) return;

    setIsUploading(true);
    try {
      const uploadedImages = [];
      for (const file of newIdeaImages) {
        const fileRef = ref(storage, `ideias_images/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        uploadedImages.push({ url, nome: file.name });
      }

      const newIdea = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        texto: newIdeaText.trim(),
        autor: newIdeaAuthor.trim(),
        imagens: uploadedImages,
        finalizado: false,
        emPauta: false,
        inviavel: false,
        viavel: false,
        obsDesenvolvimento: '',
        criadoEm: Date.now()
      };

      const topicRef = doc(db, 'estudos_caso', selectedTopic.id);
      
      await updateDoc(topicRef, {
        ideias: arrayUnion(newIdea)
      });
      
      setNewIdeaText('');
      setNewIdeaAuthor('');
      setNewIdeaImages([]);
      document.getElementById('idea-images-input').value = '';
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar ideia ou enviar imagens.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadImage = async (e, url, filename) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro na requisição da imagem');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'anexo_ideia.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download direto falhou por CORS, abrindo em nova guia', error);
      // Fallback
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = filename || 'anexo_ideia.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleIdeaStatus = async (ideaId) => {
    if (!selectedTopic) return;
    try {
      const topicRef = doc(db, 'estudos_caso', selectedTopic.id);
      await runTransaction(db, async (transaction) => {
        const topicDoc = await transaction.get(topicRef);
        if (!topicDoc.exists()) throw "Módulo não encontrado.";
        
        const currentIdeas = topicDoc.data().ideias || [];
        const updatedIdeas = currentIdeas.map(idea => {
          if (idea.id === ideaId) {
            return { ...idea, finalizado: !idea.finalizado };
          }
          return idea;
        });
        transaction.update(topicRef, { ideias: updatedIdeas });
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleIdeaPin = async (ideaId) => {
    if (!selectedTopic) return;
    try {
      const topicRef = doc(db, 'estudos_caso', selectedTopic.id);
      await runTransaction(db, async (transaction) => {
        const topicDoc = await transaction.get(topicRef);
        if (!topicDoc.exists()) throw "Módulo não encontrado.";
        
        const currentIdeas = topicDoc.data().ideias || [];
        const updatedIdeas = currentIdeas.map(idea => {
          if (idea.id === ideaId) {
            return { ...idea, emPauta: !idea.emPauta };
          }
          return idea;
        });
        transaction.update(topicRef, { ideias: updatedIdeas });
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteIdea = async (ideaId) => {
    if (!selectedTopic) return;
    if (window.confirm("Remover esta ideia?")) {
      try {
        const topicRef = doc(db, 'estudos_caso', selectedTopic.id);
        await runTransaction(db, async (transaction) => {
          const topicDoc = await transaction.get(topicRef);
          if (!topicDoc.exists()) throw "Módulo não encontrado.";
          
          const currentIdeas = topicDoc.data().ideias || [];
          const updatedIdeas = currentIdeas.filter(idea => idea.id !== ideaId);
          transaction.update(topicRef, { ideias: updatedIdeas });
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveIdeaEdit = async (ideaId) => {
    if (!selectedTopic || !editIdeaText.trim()) return;
    setIsUploading(true);
    try {
      const uploadedImages = [];
      for (const file of editNewImages) {
        const fileRef = ref(storage, `ideias_images/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        uploadedImages.push({ url, nome: file.name });
      }

      const finalImages = [...editIdeaImages, ...uploadedImages];

      const topicRef = doc(db, 'estudos_caso', selectedTopic.id);
      await runTransaction(db, async (transaction) => {
        const topicDoc = await transaction.get(topicRef);
        if (!topicDoc.exists()) throw "Módulo não encontrado.";
        
        const currentIdeas = topicDoc.data().ideias || [];
        const updatedIdeas = currentIdeas.map(idea => {
          if (idea.id === ideaId) {
            return { ...idea, texto: editIdeaText.trim(), imagens: finalImages };
          }
          return idea;
        });
        transaction.update(topicRef, { ideias: updatedIdeas });
      });
      setEditingIdeaId(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar edição da ideia.');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleIdeaInviavel = async (ideaId) => {
    if (!selectedTopic) return;
    try {
      const topicRef = doc(db, 'estudos_caso', selectedTopic.id);
      await runTransaction(db, async (transaction) => {
        const topicDoc = await transaction.get(topicRef);
        if (!topicDoc.exists()) throw "Módulo não encontrado.";
        
        const currentIdeas = topicDoc.data().ideias || [];
        const updatedIdeas = currentIdeas.map(idea => {
          if (idea.id === ideaId) {
            return { ...idea, inviavel: !idea.inviavel, viavel: false, finalizado: false }; // desmarca finalizado se for inviável
          }
          return idea;
        });
        transaction.update(topicRef, { ideias: updatedIdeas });
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleIdeaViavel = async (ideaId) => {
    if (!selectedTopic) return;
    try {
      const topicRef = doc(db, 'estudos_caso', selectedTopic.id);
      await runTransaction(db, async (transaction) => {
        const topicDoc = await transaction.get(topicRef);
        if (!topicDoc.exists()) throw "Módulo não encontrado.";
        
        const currentIdeas = topicDoc.data().ideias || [];
        const updatedIdeas = currentIdeas.map(idea => {
          if (idea.id === ideaId) {
            return { ...idea, viavel: !idea.viavel, inviavel: false };
          }
          return idea;
        });
        transaction.update(topicRef, { ideias: updatedIdeas });
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveObsDev = async (ideaId) => {
    if (!selectedTopic) return;
    try {
      const topicRef = doc(db, 'estudos_caso', selectedTopic.id);
      await runTransaction(db, async (transaction) => {
        const topicDoc = await transaction.get(topicRef);
        if (!topicDoc.exists()) throw "Módulo não encontrado.";
        
        const currentIdeas = topicDoc.data().ideias || [];
        const updatedIdeas = currentIdeas.map(idea => {
          if (idea.id === ideaId) {
            return { ...idea, obsDesenvolvimento: obsDevText };
          }
          return idea;
        });
        transaction.update(topicRef, { ideias: updatedIdeas });
      });
      setObsDevIdeaId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMergeSelection = (ideaId) => {
    setSelectedMergeIdeas(prev => 
      prev.includes(ideaId) 
        ? prev.filter(id => id !== ideaId)
        : [...prev, ideaId]
    );
  };

  const handleMergeIdeas = async () => {
    if (!selectedTopic || selectedMergeIdeas.length < 2) return;
    
    try {
      const topicRef = doc(db, 'estudos_caso', selectedTopic.id);
      await runTransaction(db, async (transaction) => {
        const topicDoc = await transaction.get(topicRef);
        if (!topicDoc.exists()) throw "Módulo não encontrado.";
        
        const currentIdeas = topicDoc.data().ideias || [];
        
        // Obter ideias para mesclar
        const ideasToMerge = currentIdeas.filter(idea => selectedMergeIdeas.includes(idea.id));
        
        // Criar texto combinado
        const combinedText = ideasToMerge.map(i => i.texto).join('\n\n---\n\n');
        
        // Combinar autores (sem duplicar)
        const allAuthors = ideasToMerge.map(i => i.autor).filter(Boolean);
        const uniqueAuthors = [...new Set(allAuthors)].join(' & ');
        
        // Combinar imagens
        let combinedImages = [];
        ideasToMerge.forEach(i => {
          if (i.imagens) {
            combinedImages = [...combinedImages, ...i.imagens];
          }
        });
        
        const newIdea = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          texto: combinedText,
          autor: uniqueAuthors || 'Autores Mesclados',
          imagens: combinedImages,
          finalizado: false,
          emPauta: false,
          inviavel: false,
          criadoEm: Date.now()
        };
        
        // Remover as ideias antigas e adicionar a nova
        const updatedIdeas = currentIdeas.filter(idea => !selectedMergeIdeas.includes(idea.id));
        updatedIdeas.push(newIdea);
        
        transaction.update(topicRef, { ideias: updatedIdeas });
      });
      
      setIsMerging(false);
      setSelectedMergeIdeas([]);
    } catch (err) {
      console.error(err);
      alert('Erro ao mesclar ideias.');
    }
  };

  const handlePrintTopic = () => {
    if (!selectedTopic) return;
    
    let iframe = document.getElementById('print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório - Módulo: ${selectedTopic.titulo}</title>
          <style>
            body { font-family: Arial, sans-serif; color: black; background: white; padding: 20px; }
            .print-header { text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
            .idea-item { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dotted #ccc; page-break-inside: avoid; }
            .idea-text { font-size: 15px; line-height: 1.5; margin-bottom: 8px; }
            .idea-meta { font-size: 12px; color: #555; }
            .status { font-weight: bold; }
            .status.finalizado { color: green; }
            .status.inviavel { color: red; text-decoration: line-through; }
            .images-container { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
            .images-container img { max-height: 200px; border: 1px solid #ddd; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>Relatório - Módulo: ${selectedTopic.titulo}</h2>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          ${selectedTopic.ideias && selectedTopic.ideias.filter(i => !i.inviavel).length > 0 ? `
            <div>
              ${selectedTopic.ideias.filter(i => !i.inviavel).map(idea => `
                <div class="idea-item">
                  <div class="idea-text status ${idea.finalizado ? 'finalizado' : ''}">
                    <strong>${idea.emPauta ? '[Em Pauta] ' : ''}</strong>
                    ${idea.viavel ? '<strong style="color: #10b981;">[VIÁVEL] </strong>' : ''}
                    ${idea.texto}
                    ${idea.finalizado ? ' (Finalizado)' : ''}
                  </div>
                  ${idea.obsDesenvolvimento ? `
                    <div style="background: #ecfdf5; padding: 6px 10px; border-left: 3px solid #10b981; margin-top: 6px; font-size: 0.88em; color: #065f46;">
                      <strong>💻 Obs. Dev:</strong> ${idea.obsDesenvolvimento}
                    </div>
                  ` : ''}
                  ${idea.imagens && idea.imagens.length > 0 ? `
                    <div class="images-container">
                      ${idea.imagens.map(img => `<img src="${img.url}" alt="${img.nome}" />`).join('')}
                    </div>
                  ` : ''}
                  <div class="idea-meta">
                    Autor: ${idea.autor || 'Desconhecido'} - Data: ${new Date(idea.criadoEm).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<p>Nenhuma ideia cadastrada neste módulo.</p>'}
        </body>
      </html>
    `;

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 500);
  };

  const renderTopicsList = () => {
    // Sort topics: pinned first, then by date
    const sortedTopics = [...topics].sort((a, b) => {
      if (a.emPauta !== b.emPauta) {
        return a.emPauta ? -1 : 1;
      }
      return (b.criadoEm || 0) - (a.criadoEm || 0);
    });

    return (
      <motion.div 
        key="topics-list"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="topics-view"
      >
      <div className="module-form-container">
        <h2>Criar Novo Módulo</h2>
        <form onSubmit={handleCreateTopic} className="module-form">
          <input 
            type="text" 
            placeholder="Ex: DFE, Devolução de Compra..." 
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">
            <Plus size={18} /> Adicionar
          </button>
        </form>
      </div>

      <div className="topics-grid">
        <AnimatePresence>
          {sortedTopics.map(topic => (
            <motion.div 
              key={topic.id}
              className={`topic-card ${topic.emPauta ? 'topic-pauta' : ''}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              onClick={() => {
                if (editingTopicId !== topic.id) setSelectedTopic(topic);
              }}
            >
              <div className={`topic-card-header ${editingTopicId === topic.id ? 'is-editing' : ''}`}>
                {editingTopicId === topic.id ? (
                  <div className="topic-edit-mode" onClick={e => e.stopPropagation()}>
                    <input 
                      type="text" 
                      value={editTopicTitle} 
                      onChange={e => setEditTopicTitle(e.target.value)}
                      autoFocus
                    />
                    <div className="topic-edit-actions">
                      <button className="btn-primary small" onClick={(e) => handleSaveTopicEdit(e, topic.id)}>
                        <Save size={14} /> Salvar
                      </button>
                      <button className="btn-icon" onClick={() => setEditingTopicId(null)}>
                        <X size={14} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {topic.emPauta && (
                        <span className="badge-pauta" style={{ alignSelf: 'flex-start', marginBottom: '4px' }}>Em Pauta</span>
                      )}
                      <h3>{topic.titulo}</h3>
                    </div>
                    <div className="topic-actions" onClick={e => e.stopPropagation()}>
                      <button 
                        className={`btn-icon ${topic.emPauta ? 'active-pin' : ''}`} 
                        onClick={(e) => handleToggleTopicPin(e, topic.id, topic.emPauta)}
                        title={topic.emPauta ? "Remover de pauta" : "Marcar módulo em pauta"}
                      >
                        <Pin size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={(e) => { e.stopPropagation(); setEditingTopicId(topic.id); setEditTopicTitle(topic.titulo); }}
                        title="Editar Módulo"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={(e) => handleDeleteTopic(e, topic.id)}
                        title="Apagar Módulo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="topic-card-stats">
                <span className="stat-badge">
                  <Lightbulb size={14} /> 
                  {(topic.ideias || []).length} Ideias
                </span>
                <span className="stat-badge success">
                  <CheckCircle2 size={14} /> 
                  {(topic.ideias || []).filter(i => i.finalizado).length} Resolvidas
                </span>
              </div>
              <div className="topic-card-arrow">
                Acessar Módulo <ChevronRight size={18} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sortedTopics.length === 0 && (
          <div className="empty-state">
            Nenhum módulo cadastrado ainda.
          </div>
        )}
      </div>
    </motion.div>
  );
  };

  const renderTopicDetails = () => {
    if (!selectedTopic) return null;

    const visibleIdeas = showCompleted 
      ? selectedTopic.ideias || []
      : (selectedTopic.ideias || []).filter(i => !i.finalizado);

    // Sort: Em Pauta first, then pending, then finished, sorting by newest within groups
    const sortedIdeas = [...visibleIdeas].sort((a, b) => {
      const aDone = a.finalizado || a.inviavel;
      const bDone = b.finalizado || b.inviavel;
      
      // Finished/Inviable always goes to bottom
      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }
      
      // If both are not finished, prioritize 'emPauta'
      if (!aDone) {
        if (a.emPauta !== b.emPauta) {
          return a.emPauta ? -1 : 1;
        }
      }

      // Then sort by date
      return b.criadoEm - a.criadoEm;
    });

    return (
      <motion.div 
        key="topic-details"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="details-view"
      >
        <div className="details-header-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="btn-back-topic" onClick={() => setSelectedTopic(null)}>
              <ArrowLeft size={18} /> Voltar para Módulos
            </button>
            <h2 style={{ margin: 0 }}>{selectedTopic.titulo}</h2>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <button 
              className="print-btn" 
              onClick={() => setIsMerging(!isMerging)} 
              title="Mesclar Ideias Similares"
              style={{ borderColor: isMerging ? 'var(--neon-cyan)' : '', color: isMerging ? 'var(--neon-cyan)' : '' }}
            >
              <Combine size={18} /> {isMerging ? 'Cancelar Mesclagem' : 'Mesclar Ideias'}
            </button>
            <button className="print-btn" onClick={handlePrintTopic} title="Imprimir Ideias deste Módulo">
              <Printer size={18} /> Imprimir Módulo
            </button>
          </div>
        </div>

        <div className="idea-form-container">
          <h3>Sugerir Melhoria</h3>
          <form onSubmit={handleAddIdea} className="idea-form">
            <textarea 
              placeholder="Descreva a melhoria ou ideia para este módulo..." 
              value={newIdeaText}
              onChange={(e) => setNewIdeaText(e.target.value)}
              required
              rows={3}
            />
            <div className="idea-form-footer">
              <div className="input-with-icon file-upload-wrapper">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageChange}
                  id="idea-images-input"
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
                <label htmlFor="idea-images-input" className="btn-icon" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={18} /> 
                  {newIdeaImages.length > 0 ? `${newIdeaImages.length} img(s)` : 'Anexar Imagens'}
                </label>
              </div>
              <div className="input-with-icon">
                <User size={16} />
                <input 
                  type="text" 
                  placeholder="Seu nome" 
                  value={newIdeaAuthor}
                  onChange={(e) => setNewIdeaAuthor(e.target.value)}
                  required
                  disabled={isUploading}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={isUploading}>
                {isUploading ? <Loader2 size={18} className="spin-icon" /> : <Lightbulb size={18} />} 
                {isUploading ? 'Enviando...' : 'Adicionar Ideia'}
              </button>
            </div>
          </form>
        </div>

        <div className="ideas-list-container">
          <div className="ideas-list-header">
            <h3>Lista de Ideias</h3>
            <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
              {isMerging && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--surface-hover)', padding: '6px 12px', borderRadius: '8px' }}>
                  <span style={{fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 'bold'}}>{selectedMergeIdeas.length} marcadas</span>
                  {selectedMergeIdeas.length >= 2 && (
                    <button className="btn-primary small" onClick={handleMergeIdeas} style={{padding: '4px 10px', fontSize: '0.8rem'}}>Mesclar</button>
                  )}
                  <button className="btn-icon small" onClick={() => { setIsMerging(false); setSelectedMergeIdeas([]); }}><X size={14}/></button>
                </div>
              )}
              <label className="toggle-completed">
                <input 
                  type="checkbox" 
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                />
                Mostrar finalizadas
              </label>
            </div>
          </div>

          <div className="ideas-list">
            <AnimatePresence>
              {sortedIdeas.map(idea => (
                <motion.div 
                  key={idea.id}
                  className={`idea-card ${idea.finalizado ? 'finalizada' : ''} ${idea.inviavel ? 'inviavel' : ''} ${idea.viavel ? 'viavel' : ''} ${isMerging && selectedMergeIdeas.includes(idea.id) ? 'selected-merge' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  onClick={() => {
                    if (isMerging) toggleMergeSelection(idea.id);
                  }}
                  style={{ cursor: isMerging ? 'pointer' : 'default' }}
                >
                  {isMerging && (
                    <div className="merge-checkbox" style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                      <input type="checkbox" checked={selectedMergeIdeas.includes(idea.id)} readOnly style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                    </div>
                  )}
                  
                  {!isMerging && (
                    <button 
                      className="status-toggle" 
                      onClick={() => toggleIdeaStatus(idea.id)}
                      title={idea.finalizado ? "Marcar como pendente" : "Marcar como finalizado"}
                    >
                      {idea.finalizado ? <CheckCircle2 size={24} className="icon-success" /> : <Circle size={24} className="icon-pending" />}
                    </button>
                  )}
                  
                  <div className="idea-content">
                    {editingIdeaId === idea.id ? (
                      <div className="idea-edit-mode">
                        <textarea 
                          value={editIdeaText} 
                          onChange={(e) => setEditIdeaText(e.target.value)}
                          rows={3}
                          autoFocus
                          disabled={isUploading}
                        />
                        
                        <div className="edit-images-section" style={{ marginTop: '10px' }}>
                          {editIdeaImages.length > 0 && (
                            <div className="idea-images-grid" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              {editIdeaImages.map((img, idx) => (
                                <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                  <img src={img.url} alt={img.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button 
                                    className="remove-image-btn"
                                    onClick={() => setEditIdeaImages(prev => prev.filter((_, i) => i !== idx))}
                                    disabled={isUploading}
                                    style={{
                                      position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,0.9)', 
                                      border: 'none', borderRadius: '50%', width: '20px', height: '20px', 
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer'
                                    }}
                                    title="Remover imagem"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {editNewImages.length > 0 && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--neon-cyan)', marginBottom: '10px' }}>
                              + {editNewImages.length} novo(s) arquivo(s) selecionado(s)
                            </div>
                          )}
                        </div>

                        <div className="idea-edit-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                          <div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple 
                              onChange={(e) => {
                                if (e.target.files) setEditNewImages(Array.from(e.target.files));
                              }}
                              id={`edit-images-input-${idea.id}`}
                              style={{ display: 'none' }}
                              disabled={isUploading}
                            />
                            <label htmlFor={`edit-images-input-${idea.id}`} className="btn-icon small" style={{ cursor: 'pointer', background: 'var(--surface-hover)', padding: '6px 12px' }}>
                              <ImageIcon size={14} style={{ marginRight: '6px' }} /> Anexar
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-primary small" onClick={() => handleSaveIdeaEdit(idea.id)} disabled={isUploading}>
                              {isUploading ? <Loader2 size={14} className="spin-icon" /> : <Save size={14} />} {isUploading ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button className="btn-icon small" onClick={() => setEditingIdeaId(null)} disabled={isUploading}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          {idea.emPauta && !idea.finalizado && (
                            <span className="badge-pauta">Em Pauta</span>
                          )}
                          {idea.viavel && (
                            <span className="badge-viavel" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              ✅ VIÁVEL — Providenciar dados para solicitação
                            </span>
                          )}
                          {idea.inviavel && (
                            <span className="badge-inviavel" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                              🚫 INVIÁVEL
                            </span>
                          )}
                        </div>
                        <p className="idea-text">{idea.texto}</p>
                        {idea.imagens && idea.imagens.length > 0 && (
                          <div className="idea-images-grid" style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {idea.imagens.map((img, idx) => (
                              <a 
                                href={img.url} 
                                onClick={(e) => handleDownloadImage(e, img.url, img.nome)}
                                key={idx} 
                                className="idea-image-link" 
                                title={`Ver/Baixar: ${img.nome}`}
                                style={{
                                  position: 'relative',
                                  width: '80px', height: '80px',
                                  borderRadius: '8px', overflow: 'hidden',
                                  border: '1px solid var(--border-light)',
                                  display: 'block'
                                }}
                              >
                                <img src={img.url} alt={img.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div className="idea-image-overlay" style={{
                                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  opacity: 0, transition: 'opacity 0.2s ease', color: 'white'
                                }}>
                                  <Download size={20} />
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="idea-meta">
                          <span className="author"><User size={12}/> {idea.autor}</span>
                          <span className="date"><Clock size={12}/> {new Date(idea.criadoEm).toLocaleDateString('pt-BR')}</span>
                        </div>

                        {obsDevIdeaId === idea.id ? (
                          <div className="obs-dev-editor" style={{ marginTop: '14px', padding: '12px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '8px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4', fontWeight: 600, fontSize: '0.82rem', marginBottom: '8px' }}>
                              <MessageSquareCode size={16} /> OBSERVAÇÃO DESENVOLVIMENTO:
                            </div>
                            <textarea 
                              value={obsDevText} 
                              onChange={(e) => setObsDevText(e.target.value)}
                              placeholder="Digite o comentário ou observação do desenvolvimento sobre esta ideia..."
                              rows={3}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                              <button className="btn-primary small" onClick={(e) => { e.stopPropagation(); handleSaveObsDev(idea.id); }}>
                                <Save size={14} /> Salvar Observação
                              </button>
                              <button className="btn-icon small" onClick={(e) => { e.stopPropagation(); setObsDevIdeaId(null); }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          idea.obsDesenvolvimento && (
                            <div className="obs-dev-box" style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(6, 182, 212, 0.08)', borderLeft: '3px solid #06b6d4', borderRadius: '6px', fontSize: '0.88rem', width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <strong style={{ color: '#06b6d4', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <MessageSquareCode size={14} /> OBSERVAÇÃO DESENVOLVIMENTO:
                                </strong>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setObsDevIdeaId(idea.id); setObsDevText(idea.obsDesenvolvimento || ''); }} 
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                                  title="Editar observação do desenvolvimento"
                                >
                                  <Edit2 size={13} />
                                </button>
                              </div>
                              <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{idea.obsDesenvolvimento}</p>
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>

                  {editingIdeaId !== idea.id && (
                    <div className="idea-actions">
                      <button 
                        className={`btn-icon ${idea.obsDesenvolvimento ? 'active-pin' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); setObsDevIdeaId(idea.id); setObsDevText(idea.obsDesenvolvimento || ''); }}
                        title="Observação Desenvolvimento"
                        style={idea.obsDesenvolvimento ? { background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.4)' } : undefined}
                      >
                        <MessageSquareCode size={16} />
                      </button>
                      <button 
                        className={`btn-icon ${idea.viavel ? 'success' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); toggleIdeaViavel(idea.id); }}
                        title={idea.viavel ? "Remover viável" : "Marcar como Viável"}
                        style={idea.viavel ? { color: '#10b981', borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.15)' } : undefined}
                      >
                        <CheckCheck size={16} />
                      </button>
                      <button 
                        className={`btn-icon ${idea.emPauta ? 'active-pin' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); toggleIdeaPin(idea.id); }}
                        title={idea.emPauta ? "Remover de pauta" : "Marcar como pauta principal"}
                      >
                        <Pin size={16} />
                      </button>
                      <button 
                        className={`btn-icon ${idea.inviavel ? 'danger' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); toggleIdeaInviavel(idea.id); }}
                        title={idea.inviavel ? "Remover inviável" : "Marcar como Inviável"}
                      >
                        <XOctagon size={16} />
                      </button>
                      <button 
                        className="btn-icon edit-idea" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setEditingIdeaId(idea.id); 
                          setEditIdeaText(idea.texto); 
                          setEditIdeaImages(idea.imagens || []);
                          setEditNewImages([]);
                        }}
                        title="Editar Ideia"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon danger delete-idea" 
                        onClick={(e) => { e.stopPropagation(); deleteIdea(idea.id); }}
                        title="Apagar Ideia"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {sortedIdeas.length === 0 && (
              <div className="empty-state">
                Nenhuma ideia para exibir.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const handlePrint = () => {
    let iframe = document.getElementById('print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório - Banco de Ideias</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: black;
              background: white;
              padding: 20px;
            }
            .print-header {
              text-align: center;
              border-bottom: 2px solid #ccc;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .print-module {
              margin-bottom: 30px;
              page-break-inside: auto;
            }
            .print-module h3 {
              background: #f0f0f0;
              padding: 10px;
              border-radius: 4px;
              font-size: 18px;
              border: 1px solid #ddd;
              margin-bottom: 10px;
              color: #000;
            }
            ul {
              list-style-type: disc;
              padding-left: 30px;
              margin: 0;
            }
            li {
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px dotted #ccc;
              page-break-inside: avoid;
            }
            .idea-text {
              font-size: 15px;
              line-height: 1.5;
              color: #000;
            }
            .idea-meta {
              font-size: 12px;
              color: #555;
              margin-top: 5px;
            }
            .no-ideas {
              color: #666;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>Relatório - Banco de Ideias</h2>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          ${topics.map(topic => `
            <div class="print-module">
              <h3>Módulo: ${topic.titulo}</h3>
              ${topic.ideias && topic.ideias.filter(i => !i.inviavel).length > 0 ? `
                <ul>
                  ${topic.ideias.filter(i => !i.inviavel).map(idea => `
                    <li>
                      <div class="idea-text">
                        <strong>${idea.emPauta ? '[Em Pauta] ' : ''}</strong>
                        ${idea.viavel ? '<strong style="color: #10b981;">[VIÁVEL] </strong>' : ''}
                        ${idea.texto}
                        ${idea.finalizado ? ' (Finalizado)' : ''}
                      </div>
                      ${idea.obsDesenvolvimento ? `
                        <div style="background: #ecfdf5; padding: 6px 10px; border-left: 3px solid #10b981; margin-top: 6px; font-size: 0.88em; color: #065f46;">
                          <strong>💻 Obs. Dev:</strong> ${idea.obsDesenvolvimento}
                        </div>
                      ` : ''}
                      <div class="idea-meta">
                        Autor: ${idea.autor || 'Desconhecido'} - Data: ${new Date(idea.criadoEm).toLocaleDateString('pt-BR')}
                      </div>
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <p class="no-ideas">Nenhuma ideia cadastrada neste módulo.</p>
              `}
            </div>
          `).join('')}
        </body>
      </html>
    `;

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  return (
    <motion.div 
      className={`case-studies-container ${theme}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="cs-header no-print">
        <h1>
          <Lightbulb className="cs-icon" size={32} />
          Banco de Ideias (Módulos)
        </h1>
        <div className="header-actions">
          {!selectedTopic && (
            <button className="print-btn" onClick={handlePrint} title="Imprimir Relatório em PDF">
              <Printer size={18} /> Imprimir Relatório
            </button>
          )}
          </div>
      </div>

      <div className="cs-content no-print">
        <AnimatePresence mode="wait">
          {!selectedTopic ? renderTopicsList() : renderTopicDetails()}
        </AnimatePresence>
      </div>

    </motion.div>
  );
};

export default CaseStudies;
