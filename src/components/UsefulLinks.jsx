import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Link as LinkIcon,
  FileX,
  FileSearch,
  Landmark,
  MonitorCheck,
  BookOpen,
  Activity,
  Home,
  FileCheck,
  ExternalLink,
  HelpCircle,
  LifeBuoy,
  Copy,
  Check,
  KeyRound,
  Search,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import './UsefulLinks.css';

const UF_BY_CODE = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL',
  '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
};

const MODELO_LABEL = {
  '55': '55 - NF-e',
  '65': '65 - NFC-e',
  '57': '57 - CT-e',
  '58': '58 - MDF-e',
  '67': '67 - CT-e OS'
};

const TP_EMIS_LABEL = {
  '1': '1 - Normal',
  '2': '2 - Contingência FS-IA',
  '3': '3 - Contingência SCAN',
  '4': '4 - Contingência EPEC',
  '5': '5 - Contingência FS-DA',
  '6': '6 - SVC-AN',
  '7': '7 - SVC-RS',
  '9': '9 - Contingência Offline NFC-e'
};

const calcDvMod11 = (digits43) => {
  let soma = 0;
  let peso = 2;
  for (let i = 42; i >= 0; i--) {
    soma += parseInt(digits43[i], 10) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return resto === 0 || resto === 1 ? 0 : 11 - resto;
};

const formatCnpjStr = (raw14) =>
  raw14.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

const UsefulLinks = ({ theme }) => {
  const [chaveInput, setChaveInput] = useState('');
  const [linkSearch, setLinkSearch] = useState('');
  const [copiedUrl, setCopiedUrl] = useState('');
  const [copiedDecoderField, setCopiedDecoderField] = useState('');

  const links = [
    {
      title: "Inutilização NF-e",
      desc: "SEFAZ Nacional",
      url: "https://www.nfe.fazenda.gov.br/portal/consulta.aspx?tipoConsulta=inutilizacao&tipoConteudo=nDmpH/MjKrg=",
      icon: <FileX size={24} />
    },
    {
      title: "Inutilização NFC-e",
      desc: "SEFAZ Mato Grosso",
      url: "https://www.sefaz.mt.gov.br/nfce/consultainutilizacaonfce",
      icon: <FileX size={24} />
    },
    {
      title: "Consulta NFC-e MT",
      desc: "SEFAZ Mato Grosso",
      url: "https://www.sefaz.mt.gov.br/nfce/consultanfce",
      icon: <FileSearch size={24} />
    },
    {
      title: "Consulta NF-e",
      desc: "SEFAZ Nacional",
      url: "https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&tipoConteudo=7PhJ+gAVw2g=&AspxAutoDetectCookieSupport=1",
      icon: <FileSearch size={24} />
    },
    {
      title: "Optantes Simples",
      desc: "Receita Federal",
      url: "https://consopt.www8.receita.fazenda.gov.br/consultaoptantes",
      icon: <Landmark size={24} />
    },
    {
      title: "Equip. Homologados",
      desc: "POS Controle",
      url: "https://www.poscontrole.com.br/equipamentos-homologados",
      icon: <MonitorCheck size={24} />
    },
    {
      title: "Wiki Elgin TEF",
      desc: "GitHub Elgin",
      url: "https://github.com/ElginDeveloperCommunity/ElginTEFHUB/wiki/%5BElgin-TEF-Hub%5D-Fun%C3%A7%C3%A3o-Manuten%C3%A7%C3%A3o-via-Opera%C3%A7%C3%A3o-Administrativa",
      icon: <BookOpen size={24} />
    },
    {
      title: "Monitor TecnoSpeed",
      desc: "Status dos Serviços",
      url: "https://monitor.tecnospeed.com.br/",
      icon: <Activity size={24} />
    },
    {
      title: "Validação NF-e RS",
      desc: "SEFAZ RS",
      url: "https://www.sefaz.rs.gov.br/nfe/nfe-val.aspx",
      icon: <FileCheck size={24} />
    },
    {
      title: "Sistema Interno",
      desc: "Portão Stor",
      url: "http://192.168.15.245/",
      icon: <Home size={24} />
    },
    {
      title: "StorGo Doc",
      desc: "Suporte e Ajuda",
      url: "https://ola.meajuda.cc/",
      icon: <HelpCircle size={24} />
    },
    {
      title: "Ajuda Stor Sistemas",
      desc: "Portal de Ajuda Stor",
      url: "https://ajuda.storsistemas.com.br:88",
      icon: <LifeBuoy size={24} />
    }
  ];

  const cleanChave = chaveInput.replace(/\D/g, '');

  const decodedChave = useMemo(() => {
    if (cleanChave.length !== 44) return null;

    const cUF = cleanChave.slice(0, 2);
    const ufSigla = UF_BY_CODE[cUF] || `Cód. ${cUF}`;
    const ano = cleanChave.slice(2, 4);
    const mes = cleanChave.slice(4, 6);
    const cnpjRaw = cleanChave.slice(6, 20);
    const cnpjFormatted = formatCnpjStr(cnpjRaw);
    const modelo = cleanChave.slice(20, 22);
    const serie = String(parseInt(cleanChave.slice(22, 25), 10));
    const numero = String(parseInt(cleanChave.slice(25, 34), 10));
    const tpEmis = cleanChave.slice(34, 35);
    const dvInformado = parseInt(cleanChave.slice(43, 44), 10);
    const dvCalculado = calcDvMod11(cleanChave.slice(0, 43));

    return {
      chaveLimpa: cleanChave,
      uf: `${ufSigla} (${cUF})`,
      emissao: `${mes}/20${ano}`,
      cnpjRaw,
      cnpjFormatted,
      modelo: MODELO_LABEL[modelo] || `Modelo ${modelo}`,
      serie,
      numero,
      tpEmis: TP_EMIS_LABEL[tpEmis] || `Tipo ${tpEmis}`,
      dvValido: dvInformado === dvCalculado,
      dvInformado,
      dvCalculado
    };
  }, [cleanChave]);

  const filteredLinks = useMemo(() => {
    if (!linkSearch.trim()) return links;
    const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const q = norm(linkSearch);
    return links.filter(
      (l) => norm(l.title).includes(q) || norm(l.desc).includes(q) || norm(l.url).includes(q)
    );
  }, [linkSearch]);

  const handleCopyUrl = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(''), 1800);
    });
  };

  const handleCopyDecoder = (key, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDecoderField(key);
      setTimeout(() => setCopiedDecoderField(''), 1800);
    });
  };

  return (
    <motion.div
      className={`links-app-container ${theme || ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="links-wrapper">
        <div className="links-header">
          <div className="links-icon-wrapper">
            <LinkIcon size={32} />
          </div>
          <h1>Links Úteis &amp; Validador de Chave</h1>
          <p className="subtitle">Acessos Rápidos, Cópia de URLs e Decodificador NF-e / NFC-e</p>
        </div>

        {/* Decodificador de Chave de Acesso (44 dígitos) */}
        <div className="key-decoder-panel">
          <div className="key-decoder-top">
            <div className="key-decoder-title">
              <KeyRound size={18} />
              <span>Decodificador de Chave NF-e / NFC-e (44 dígitos)</span>
            </div>
            {cleanChave.length > 0 && (
              <span className={`key-len-badge ${cleanChave.length === 44 ? 'complete' : ''}`}>
                {cleanChave.length}/44 dígitos
              </span>
            )}
          </div>

          <div className="key-decoder-input-row">
            <input
              type="text"
              placeholder="Cole a chave de acesso aqui (com ou sem espaços/pontos)..."
              value={chaveInput}
              onChange={(e) => setChaveInput(e.target.value)}
            />
            {chaveInput && (
              <button
                type="button"
                className="key-clear-btn"
                onClick={() => setChaveInput('')}
                title="Limpar chave"
                aria-label="Limpar chave"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {cleanChave.length > 0 && cleanChave.length !== 44 && (
            <p className="key-hint-error">
              A chave precisa ter exatamente 44 dígitos numéricos (faltam {Math.abs(44 - cleanChave.length)} dígitos).
            </p>
          )}

          {decodedChave && (
            <div className="key-decoded-result">
              <div className="key-decoded-grid">
                <div className="decoded-item">
                  <small>UF Emitente</small>
                  <strong>{decodedChave.uf}</strong>
                </div>
                <div className="decoded-item">
                  <small>Emissão (MM/AAAA)</small>
                  <strong>{decodedChave.emissao}</strong>
                </div>
                <div className="decoded-item">
                  <small>CNPJ Emitente</small>
                  <strong>{decodedChave.cnpjFormatted}</strong>
                </div>
                <div className="decoded-item">
                  <small>Modelo</small>
                  <strong>{decodedChave.modelo}</strong>
                </div>
                <div className="decoded-item">
                  <small>Série / Número</small>
                  <strong>Série {decodedChave.serie} • Nº {decodedChave.numero}</strong>
                </div>
                <div className="decoded-item">
                  <small>Tipo de Emissão</small>
                  <strong>{decodedChave.tpEmis}</strong>
                </div>
                <div className="decoded-item">
                  <small>Dígito Verificador (Mód. 11)</small>
                  <strong className={decodedChave.dvValido ? 'dv-ok' : 'dv-err'}>
                    {decodedChave.dvValido ? (
                      <><CheckCircle2 size={14} /> Chave Válida (DV {decodedChave.dvInformado})</>
                    ) : (
                      <><AlertTriangle size={14} /> DV Inválido (Informado {decodedChave.dvInformado}, esperado {decodedChave.dvCalculado})</>
                    )}
                  </strong>
                </div>
              </div>

              <div className="key-decoded-actions">
                <button
                  type="button"
                  className="key-copy-action-btn"
                  onClick={() => handleCopyDecoder('chave', decodedChave.chaveLimpa)}
                >
                  {copiedDecoderField === 'chave' ? <><Check size={14} /> Chave Copiada!</> : <><Copy size={14} /> Copiar Chave Limpa (44 dígitos)</>}
                </button>
                <button
                  type="button"
                  className="key-copy-action-btn"
                  onClick={() => handleCopyDecoder('cnpj', decodedChave.cnpjFormatted)}
                >
                  {copiedDecoderField === 'cnpj' ? <><Check size={14} /> CNPJ Copiado!</> : <><Copy size={14} /> Copiar CNPJ Emitente</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filtro Rápido de Links */}
        <div className="links-filter-bar">
          <Search size={16} className="links-filter-icon" />
          <input
            type="text"
            placeholder="Filtrar links úteis (ex: SEFAZ, TEF, Elgin, Stor)..."
            value={linkSearch}
            onChange={(e) => setLinkSearch(e.target.value)}
          />
          {linkSearch && (
            <button type="button" className="key-clear-btn" onClick={() => setLinkSearch('')} title="Limpar filtro">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="links-grid">
          {filteredLinks.map((link, i) => {
            const isUrlCopied = copiedUrl === link.url;
            return (
              <motion.a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="link-card-icon">
                  {link.icon}
                </div>
                <div className="link-card-content">
                  <h3>{link.title}</h3>
                  <p>{link.desc}</p>
                </div>
                <div className="link-card-actions">
                  <button
                    type="button"
                    className={`copy-link-btn ${isUrlCopied ? 'copied' : ''}`}
                    onClick={(e) => handleCopyUrl(e, link.url)}
                    title="Copiar endereço do link para enviar ao cliente"
                    aria-label={`Copiar URL de ${link.title}`}
                  >
                    {isUrlCopied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                  <div className="link-card-arrow">
                    <ExternalLink size={18} />
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default UsefulLinks;
