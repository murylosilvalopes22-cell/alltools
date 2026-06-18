import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CalendarClock, Printer, CloudBackup, ArrowDownUp, X, Users, Flame, CalendarOff, Ban, ChevronDown, ChevronUp, Plus, Check, Wand2, Undo2, AlertTriangle } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './DutySchedule.css';

const MONTHS = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const DAYS_OF_WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

const ensureArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') return [val];
  if (typeof val === 'string' && val.trim() === '') return [''];
  return [''];
};

const DutySchedule = ({ onBack, theme }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [scheduleData, setScheduleData] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [expandedMember, setExpandedMember] = useState(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [scheduleBackup, setScheduleBackup] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const blurTimeoutRef = useRef(null);

  const handleFocus = (id) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setActiveDropdown(id);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  const defaultTeam = [
    { name: 'Marcus', vacation: false, noWeekdays: false, unavailable: false },
    { name: 'Murylo', vacation: false, noWeekdays: false, unavailable: false },
    { name: 'Matheus', vacation: false, noWeekdays: false, unavailable: false },
    { name: 'Mylla', vacation: false, noWeekdays: false, unavailable: false },
    { name: 'Eduardo', vacation: false, noWeekdays: false, unavailable: false }
  ];

  useEffect(() => {
    const date = new Date();
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);

    const docRef = doc(db, 'dutySchedules', 'teamConfig');
    const unsubscribeTeam = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().members) {
        setTeamMembers(docSnap.data().members);
      } else {
        setTeamMembers(defaultTeam);
        setDoc(doc(db, 'dutySchedules', 'teamConfig'), { members: defaultTeam });
      }
    });

    return () => unsubscribeTeam();
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;

    const docRef = doc(db, 'dutySchedules', selectedMonth);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setScheduleData(docSnap.data().days || {});
      } else {
        setScheduleData({});
      }
    });

    return () => unsubscribe();
  }, [selectedMonth]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const toggleMemberStatus = async (idx, field) => {
    const newTeam = [...teamMembers];
    newTeam[idx][field] = !newTeam[idx][field];
    
    if ((field === 'vacation' || field === 'unavailable') && newTeam[idx][field] === true) {
      if (expandedMember === newTeam[idx].name) {
        setExpandedMember(null);
      }
    }

    try {
      await setDoc(doc(db, 'dutySchedules', 'teamConfig'), { members: newTeam }, { merge: true });
    } catch (err) {
      console.error("Error updating team", err);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      setIsAddingMember(false);
      return;
    }
    const newTeam = [...teamMembers, { name: newMemberName.trim(), vacation: false, noWeekdays: false, unavailable: false }];
    try {
      await setDoc(doc(db, 'dutySchedules', 'teamConfig'), { members: newTeam }, { merge: true });
      setNewMemberName('');
      setIsAddingMember(false);
    } catch (err) {
      console.error("Error adding member", err);
    }
  };

  const syncToFirebase = async (day, newArray) => {
    if(!selectedMonth) return;
    try {
      await setDoc(doc(db, 'dutySchedules', selectedMonth), {
        monthRaw: selectedMonth,
        days: {
          [day]: newArray
        },
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err) {
      console.error("Error syncing to Firebase", err);
    }
  };

  const syncBulkToFirebase = async (newDaysObj) => {
    if(!selectedMonth) return;
    try {
      await setDoc(doc(db, 'dutySchedules', selectedMonth), {
        monthRaw: selectedMonth,
        days: newDaysObj,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err) {
      console.error("Error syncing bulk to Firebase", err);
    }
  };

  const handleUndo = async () => {
    if (!scheduleBackup) return;
    setScheduleData(scheduleBackup);
    await syncBulkToFirebase(scheduleBackup);
    setScheduleBackup(null);
  };

  const checkAndOpenGenerateModal = () => {
    const hasData = Object.values(scheduleData).some(arr => arr && arr.some(v => v.trim() !== ''));
    if (hasData) {
      setShowGenerateModal(true);
    } else {
      handleAutoGenerate('fill');
    }
  };

  const handleAutoGenerate = async (mode) => {
    setShowGenerateModal(false);
    setScheduleBackup({ ...scheduleData });
    
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    let newSchedule = mode === 'overwrite' ? {} : { ...scheduleData };
    
    const activeMembers = teamMembers.filter(m => !m.vacation && !m.unavailable);
    if (activeMembers.length === 0) {
      alert("Nenhum membro disponível na equipe.");
      return;
    }

    const shiftCounts = {};
    activeMembers.forEach(m => shiftCounts[m.name] = 0);
    
    if (mode === 'fill') {
      Object.values(newSchedule).forEach(arr => {
        if (arr) {
          arr.forEach(name => {
            if (shiftCounts[name] !== undefined) shiftCounts[name]++;
          });
        }
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      if (mode === 'fill' && newSchedule[d] && newSchedule[d].some(v => v.trim() !== '')) {
        continue;
      }
      
      const dateObj = new Date(currentYear, currentMonth - 1, d);
      const dayOfWeek = dateObj.getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      
      const availableToday = activeMembers.filter(m => !(m.noWeekdays && isWeekday));
      
      if (availableToday.length > 0) {
        availableToday.sort((a, b) => shiftCounts[a.name] - shiftCounts[b.name]);
        const chosen = availableToday[0].name;
        newSchedule[d] = [chosen];
        shiftCounts[chosen]++;
      }
    }
    
    setScheduleData(newSchedule);
    await syncBulkToFirebase(newSchedule);
  };

  const toggleDayForMember = (day, memberName) => {
    const currentArray = ensureArray(scheduleData[day]);
    let newArray = [...currentArray];
    
    if (newArray.includes(memberName)) {
      // Remove member
      newArray = newArray.filter(name => name !== memberName);
      if (newArray.length === 0) newArray = [''];
    } else {
      // Find empty slot to insert, or append
      const emptyIndex = newArray.findIndex(name => name.trim() === '');
      if (emptyIndex !== -1) {
        newArray[emptyIndex] = memberName;
      } else {
        newArray.push(memberName);
      }
    }
    
    setScheduleData(prev => ({ ...prev, [day]: newArray }));
    syncToFirebase(day, newArray);
  };

  const handleSlotChange = (day, index, value) => {
    const currentArray = ensureArray(scheduleData[day]);
    const newArray = [...currentArray];
    newArray[index] = value;
    setScheduleData(prev => ({ ...prev, [day]: newArray }));
    syncToFirebase(day, newArray);
  };

  const handleAddSwap = (day) => {
    const currentArray = ensureArray(scheduleData[day]);
    if (currentArray.length === 0 || currentArray[currentArray.length - 1].trim() === '') return;
    const newArray = [...currentArray, ''];
    setScheduleData(prev => ({ ...prev, [day]: newArray }));
    syncToFirebase(day, newArray);
  };

  const handleUndoSwap = (day) => {
    const currentArray = ensureArray(scheduleData[day]);
    if (currentArray.length <= 1) return;
    const newArray = currentArray.slice(0, currentArray.length - 1);
    setScheduleData(prev => ({ ...prev, [day]: newArray }));
    syncToFirebase(day, newArray);
  };

  const generateGrid = (month, year) => {
    if(!month || !year) return [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

    let rows = [];
    let currentRow = [];
    
    for(let i = 0; i < firstDayOfWeek; i++) {
      currentRow.push(null);
    }

    for(let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      currentRow.push({ day: d, dayOfWeek: dateObj.getDay() });
      if(currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }

    if(currentRow.length > 0) {
      while(currentRow.length < 7) {
        currentRow.push(null);
      }
      rows.push(currentRow);
    }

    return rows;
  };

  const printRecord = () => {
    if (!selectedMonth) return;
    
    const [year, month] = selectedMonth.split('-');
    const label = `${MONTHS[parseInt(month) - 1]} ${year}`;
    const rows = generateGrid(month, year);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const printDocument = iframe.contentWindow.document;
    
    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Escala de Plantão - ${label}</title>
          <style>
            @media print {
              @page { size: A4 landscape; margin: 10mm; }
              body { font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; color-adjust: exact; padding: 0; margin: 0; background: white !important; color: black !important; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; text-align: center; padding: 8px; }
              th { background: #2f2f2f !important; color: white !important; font-size: 14px; }
              td { font-size: 13px; color: black !important; }
              .header-banner { border: 1px solid #000; display: flex; justify-content: space-between; align-items: center; background: #111 !important; color: #fff !important; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; }
              .header-banner div { color: #fff !important; font-weight: bold; }
              td .cell-day { text-align: left; font-size: 12px; font-weight: bold; color: #555 !important; }
              td .cell-name { margin-top: 8px; font-size: 14px; font-weight: bold; color: #000 !important; }
            }
            /* Basic styling for when it renders before printing */
            body { font-family: Arial, sans-serif; background: white; color: black; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; text-align: center; padding: 8px; }
            th { background: #2f2f2f; color: white; }
            .header-banner { display: flex; justify-content: space-between; align-items: center; background: #111; color: #fff; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; }
            .header-banner div { color: #fff; font-weight: bold; }
            td .cell-day { text-align: left; font-size: 12px; font-weight: bold; color: #555; }
            td .cell-name { margin-top: 8px; font-size: 14px; font-weight: bold; color: #000; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div>STOR SISTEMAS</div>
            <div style="font-size: 18px;">ESCALA DE PLANTÕES</div>
            <div style="font-size: 16px;">${label}</div>
          </div>
          <table>
            <tr>
              <th></th>
              ${DAYS_OF_WEEK.map(d => `<th>${d}</th>`).join('')}
            </tr>
    `;

    rows.forEach(row => {
      html += `<tr><td style="background: #e0e0e0 !important; font-weight: bold; color: #000 !important; width: 80px;">PLANTÃO</td>`;
      row.forEach(cell => {
        if(!cell) {
          html += `<td></td>`;
        } else {
          const arr = ensureArray(scheduleData[cell.day]);
          const currentPerson = arr[arr.length - 1] || '';
          html += `
            <td style="vertical-align: top; height: 80px;">
              <div class="cell-day">${cell.day}</div>
              <div class="cell-name">${currentPerson}</div>
            </td>
          `;
        }
      });
      html += `</tr>`;
    });

    html += `
          </table>
        </body>
      </html>
    `;
    
    printDocument.open();
    printDocument.write(html);
    printDocument.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 250);
  };

  const currentYear = selectedMonth ? selectedMonth.split('-')[0] : '';
  const currentMonth = selectedMonth ? selectedMonth.split('-')[1] : '';
  const gridRows = selectedMonth ? generateGrid(currentMonth, currentYear) : [];

  const today = new Date();
  const isThisMonth = currentYear === today.getFullYear().toString() && currentMonth === (today.getMonth() + 1).toString().padStart(2, '0');
  const todayDate = today.getDate();

  return (
    <motion.div 
      className="duty-schedule-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={18} /> Voltar ao Dashboard
      </button>

      <div className="duty-layout">
        {/* PAINEL LATERAL (EQUIPE) */}
          <div className="duty-sidebar no-print">
            <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} className="icon" />
                <h2>Equipe</h2>
              </div>
              <button 
                className="action-btn" 
                onClick={() => setIsAddingMember(!isAddingMember)}
                title="Adicionar novo membro"
              >
                {isAddingMember ? <X size={16} /> : <Plus size={16} />}
              </button>
            </div>
            
            <AnimatePresence>
              {isAddingMember && (
                <motion.div 
                  className="add-member-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <input 
                    type="text" 
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Nome do integrante"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                  />
                  <button onClick={handleAddMember} className="btn-confirm-add">
                    <Check size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="team-list">
              {teamMembers.map((member, idx) => (
                <div key={member.name} className="team-member-wrapper">
                  <div className="team-member">
                    <span className={`member-name ${member.vacation || member.unavailable ? 'strikethrough' : ''}`}>
                      {member.name}
                    </span>
                    <div className="member-actions">
                      <button 
                        className={`action-btn ${member.vacation ? 'active-fire' : ''}`}
                        onClick={() => toggleMemberStatus(idx, 'vacation')}
                        title="Férias"
                      >
                        <Flame size={14} />
                      </button>
                      <button 
                        className={`action-btn ${member.noWeekdays ? 'active-weekend' : ''}`}
                        onClick={() => toggleMemberStatus(idx, 'noWeekdays')}
                        title="Apenas Finais de Semana"
                      >
                        <CalendarOff size={14} />
                      </button>
                      <button 
                        className={`action-btn ${member.unavailable ? 'active-ban' : ''}`}
                        onClick={() => toggleMemberStatus(idx, 'unavailable')}
                        title="Indisponível Temporariamente"
                      >
                        <Ban size={14} />
                      </button>
                      
                      {!member.vacation && !member.unavailable && selectedMonth && (
                        <button 
                          className={`action-btn ${expandedMember === member.name ? 'active-expand' : ''}`}
                          onClick={() => setExpandedMember(expandedMember === member.name ? null : member.name)}
                          title="Atribuir dias rapidamente"
                        >
                          {expandedMember === member.name ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedMember === member.name && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mini-calendar-container"
                      >
                        <div className="mini-calendar-grid">
                          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(dayName => (
                            <div key={dayName} className="mini-day-header">{dayName}</div>
                          ))}
                          
                          {Array.from({ length: new Date(currentYear, currentMonth - 1, 1).getDay() }).map((_, i) => (
                            <div key={`empty-${i}`} className="mini-day-empty"></div>
                          ))}

                          {Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }, (_, i) => {
                            const d = i + 1;
                            const dateObj = new Date(currentYear, currentMonth - 1, d);
                            const dayOfWeek = dateObj.getDay();
                            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
                            const isDisabled = (member.noWeekdays && isWeekday) || member.vacation || member.unavailable;
                            
                            const currentArray = ensureArray(scheduleData[d]);
                            const isAssigned = currentArray.includes(member.name);
                            
                            return (
                              <button 
                                key={d} 
                                className={`mini-day-btn ${isDisabled ? 'disabled' : ''} ${isAssigned ? 'assigned' : ''}`}
                                onClick={() => !isDisabled && toggleDayForMember(d, member.name)}
                                disabled={isDisabled}
                                title={isDisabled ? "Bloqueado para dias de semana" : `Dia ${d}`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="sidebar-footer">
              <button className="btn-generate" onClick={checkAndOpenGenerateModal}>
                <Wand2 size={16} /> Gerar Escala Automática
              </button>
              {scheduleBackup && (
                <button className="btn-undo" onClick={handleUndo}>
                  <Undo2 size={16} /> Desfazer Geração
                </button>
              )}
            </div>
          </div>

        {/* ÁREA PRINCIPAL DA TABELA */}
        <div className="duty-main">
          <div className="board-wrapper no-print">
            <div className="board-header">
              <div>
                <h1><CalendarClock className="icon" size={28} /> Escala de Plantão</h1>
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CloudBackup size={14} color="#10b981" /> Sincronizada em tempo real na Nuvem
                </p>
              </div>
              <div className="month-selector">
                <label style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>MÊS:</label>
                <input type="month" value={selectedMonth} onChange={handleMonthChange} />
              </div>
            </div>

            <div className="schedule-content">
              {selectedMonth ? (
            <table className="schedule-table">
              <thead>
                <tr>
                  <th></th>
                  {DAYS_OF_WEEK.map(d => <th key={d}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row, i) => (
                  <tr key={i}>
                    <td className="tipo">Plantão</td>
                    {row.map((cell, idx) => {
                      if (!cell) return <td key={idx} className="empty-cell"></td>;
                      
                      const arr = ensureArray(scheduleData[cell.day]);
                      const showUndo = arr.length > 1;
                      const isToday = isThisMonth && cell.day === todayDate;

                      return (
                        <td key={idx} className={isToday ? "today-cell" : ""} data-label={DAYS_OF_WEEK[idx]}>
                          <div className="day-cell-wrapper">
                            <span className="day-number">{cell.day}</span>
                            <div className="day-slots">
                              {arr.map((slotValue, slotIdx, innerArr) => {
                                const isHistorical = slotIdx < innerArr.length - 1;
                                const isSwapped = innerArr.length > 1 && !isHistorical;
                                return (
                                  <div key={slotIdx} className={`slot-item ${isHistorical ? 'historical-slot' : ''} ${isSwapped ? 'swapped-slot' : ''}`}>
                                    <input 
                                      type="text"
                                      className="day-input" 
                                      value={slotValue}
                                      onChange={(e) => handleSlotChange(cell.day, slotIdx, e.target.value)}
                                      onFocus={() => handleFocus(`${cell.day}-${slotIdx}`)}
                                      onBlur={handleBlur}
                                      placeholder="Nome..."
                                      disabled={isHistorical}
                                      autoComplete="off"
                                    />
                                    {activeDropdown === `${cell.day}-${slotIdx}` && !isHistorical && (
                                      <div className={`custom-dropdown no-print ${i >= gridRows.length - 2 ? 'dropdown-up' : ''}`}>
                                        {teamMembers.filter(m => {
                                          if (m.vacation || m.unavailable) return false;
                                          const isWeekday = cell.dayOfWeek >= 1 && cell.dayOfWeek <= 5;
                                          if (isWeekday && m.noWeekdays) return false;
                                          return true;
                                        }).length === 0 ? (
                                          <div className="dropdown-item" style={{ color: 'var(--text-muted)', cursor: 'default' }}>Nenhum disponível</div>
                                        ) : (
                                          teamMembers.filter(m => {
                                            if (m.vacation || m.unavailable) return false;
                                            const isWeekday = cell.dayOfWeek >= 1 && cell.dayOfWeek <= 5;
                                            if (isWeekday && m.noWeekdays) return false;
                                            return true;
                                          }).map(m => (
                                            <div 
                                              key={m.name} 
                                              className="dropdown-item"
                                              onClick={() => {
                                                handleSlotChange(cell.day, slotIdx, m.name);
                                                setActiveDropdown(null);
                                              }}
                                            >
                                              {m.name} {m.noWeekdays ? '📅' : ''}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            <div className="swap-actions">
                              <button className="btn-add-swap" onClick={() => handleAddSwap(cell.day)} title="Registrar Troca de Plantão">
                                <ArrowDownUp size={12} /> Trocar 
                              </button>
                              {showUndo && (
                                <button className="btn-undo-swap" onClick={() => handleUndoSwap(cell.day)} title="Desfazer Troca">
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>Selecione um mês para carregar a escala.</p>
            </div>
          )}
        </div>

        <div className="action-footer">
          <button 
            className="btn-primary" 
            onClick={printRecord}
            disabled={!selectedMonth}
          >
            <Printer size={18} /> Imprimir Esta Escala
          </button>
        </div>
        </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showGenerateModal && (
          <motion.div 
            className="generate-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="generate-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className="generate-modal-icon">
                <AlertTriangle size={32} />
              </div>
              <h3>Atenção: Escala com Dados</h3>
              <p>Já existem nomes preenchidos neste mês. Como deseja proceder com a geração automática?</p>
              
              <div className="generate-modal-actions">
                <button className="btn-modal-fill" onClick={() => handleAutoGenerate('fill')}>
                  Preencher Apenas Vazios
                </button>
                <button className="btn-modal-overwrite" onClick={() => handleAutoGenerate('overwrite')}>
                  Sobrescrever Tudo
                </button>
                <button className="btn-modal-cancel" onClick={() => setShowGenerateModal(false)}>
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DutySchedule;
