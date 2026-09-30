import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Calendar, Users, Clock } from 'lucide-react';
import './AnalyticsDashboard.css';

const TOOL_NAMES = {
  'qr': 'Gerador QR',
  'imgConv': 'Img Converter',
  'anydesk': 'Download AnyDesk',
  'links': 'Links Úteis',
  'stationConfig': 'Config. Estação',
  'serverSwap': 'Troca de Servidor',
  'dutySchedule': 'Escala Plantão',
  'updateBoard': 'Updates e Notas',
  'ncmConsult': 'Consulta NCM',
  'taskOrganizer': 'Organizador Tarefas',
  'feedbackBoard': 'Painel de Solicitações',
  'danfe': 'XML Para PDF',
  'dossie': 'Dossiê Fiscal',
  'rejeicoes': 'Rejeições NF-e',
  'caseStudies': 'Banco de Ideias',
  'infoTributaria': 'Info Tributária',
  'planilhaTributacao': 'Visualizar Planilha',
  'versoesSistemas': 'Versões STOR'
};

const AnalyticsDashboard = ({ onBack, theme }) => {
  const [period, setPeriod] = useState('7d'); // '7d', '30d', 'all'
  const [data, setData] = useState([]);
  const [daysData, setDaysData] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  
  // Rastreamento de Usuários Ativos (Online Agora)
  useEffect(() => {
    const activeRef = collection(db, 'active_users');
    const unsubscribe = onSnapshot(activeRef, (snapshot) => {
      let count = 0;
      const now = new Date().getTime();
      snapshot.forEach(doc => {
        const lastPing = doc.data().lastPing;
        // Considera online se o ping foi há menos de 3 minutos
        if (now - lastPing < 3 * 60 * 1000) {
          count++;
        }
      });
      setActiveUsers(count);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let q;
    const viewsRef = collection(db, 'analytics_views');
    
    if (period === 'all') {
      q = query(viewsRef);
    } else {
      const days = period === '7d' ? 7 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      q = query(viewsRef, where('timestamp', '>=', cutoff.getTime()));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = {};
      const durations = {};
      const daysCount = { 'Dom': 0, 'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0, 'Sáb': 0 };
      const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      snapshot.forEach(doc => {
        const view = doc.data().view;
        const ts = doc.data().timestamp;
        const dur = doc.data().duration || 0;
        
        if (view && TOOL_NAMES[view]) {
          counts[view] = (counts[view] || 0) + 1;
          durations[view] = (durations[view] || 0) + dur;
        }

        if (ts) {
          const dayName = daysMap[new Date(ts).getDay()];
          daysCount[dayName]++;
        }
      });
      
      // Converte para array
      const chartData = Object.keys(TOOL_NAMES).map(key => {
        const avgDuration = counts[key] > 0 ? Math.round(durations[key] / counts[key]) : 0;
        return {
          id: key,
          name: TOOL_NAMES[key],
          acessos: counts[key] || 0,
          avgDuration // em segundos
        };
      }).sort((a, b) => b.acessos - a.acessos);

      const daysArray = Object.keys(daysCount).map(k => ({
        name: k,
        acessos: daysCount[k]
      }));

      setData(chartData);
      setDaysData(daysArray);
    });

    return () => unsubscribe();
  }, [period]);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="tooltip-custom">
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0, color: '#a855f7' }}>Acessos: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const topUsed = data.slice(0, 3).filter(d => d.acessos > 0);
  const leastUsed = [...data].reverse().slice(0, 3); // last 3

  return (
    <motion.div 
      className="analytics-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <div className="analytics-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem' }}>
            <BarChart3 size={28} color="#a855f7" /> Estatísticas de Uso
          </h1>
        </div>
        
        <div className="analytics-overview">
          <div className="overview-card">
            <div className="overview-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Users size={24} />
            </div>
            <div className="overview-info">
              <h4>Usuários Online</h4>
              <span className="overview-value ping-value">{activeUsers} <span className="ping-dot"></span></span>
            </div>
          </div>
        </div>

        <div className="filters-group">
          <button className={`filter-btn ${period === '7d' ? 'active' : ''}`} onClick={() => setPeriod('7d')}>
            <Calendar size={16} /> 7 Dias
          </button>
          <button className={`filter-btn ${period === '30d' ? 'active' : ''}`} onClick={() => setPeriod('30d')}>
            <Calendar size={16} /> 30 Dias
          </button>
          <button className={`filter-btn ${period === 'all' ? 'active' : ''}`} onClick={() => setPeriod('all')}>
            <Calendar size={16} /> Tudo
          </button>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><BarChart3 size={20} style={{ color: '#a855f7' }}/> Acessos por Ferramenta</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  tick={{ fill: 'var(--text-muted)' }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={80}
                />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="acessos" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#a855f7' : '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3><TrendingUp size={20} style={{ color: '#10b981' }}/> Mais Acessadas</h3>
            <div className="insight-list">
              {topUsed.length > 0 ? topUsed.map((item, i) => (
                <div key={item.id} className="insight-item top">
                  <div className="insight-info">
                    <span style={{opacity: 0.5}}>{i + 1}º</span> {item.name}
                  </div>
                  <div className="insight-value">{item.acessos}</div>
                </div>
              )) : <div className="insight-item"><span className="insight-info">Sem dados</span></div>}
            </div>
          </div>

          <div>
            <h3><TrendingDown size={20} style={{ color: '#ef4444' }}/> Menos Acessadas</h3>
            <div className="insight-list">
              {leastUsed.length > 0 ? leastUsed.map((item, i) => (
                <div key={item.id} className="insight-item bottom">
                  <div className="insight-info">
                    {item.name}
                  </div>
                  <div className="insight-value">{item.acessos}</div>
                </div>
              )) : <div className="insight-item"><span className="insight-info">Sem dados</span></div>}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3><Clock size={20} style={{ color: '#f59e0b' }}/> Tempo Médio de Uso</h3>
          <div className="insight-list" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
            {data.filter(d => d.acessos > 0).map((item, i) => (
              <div key={item.id} className="insight-item">
                <div className="insight-info">
                  {item.name}
                </div>
                <div className="insight-value" style={{ color: '#f59e0b' }}>
                  {formatDuration(item.avgDuration)}
                </div>
              </div>
            ))}
            {data.filter(d => d.acessos > 0).length === 0 && <div className="insight-item"><span className="insight-info">Sem dados de tempo</span></div>}
          </div>
        </div>

        <div className="chart-card full-width">
          <h3><Calendar size={20} style={{ color: '#3b82f6' }}/> Acessos por Dia da Semana</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daysData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} />
                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="acessos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;
