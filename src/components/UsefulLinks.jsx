import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
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
  LifeBuoy
} from 'lucide-react';
import './UsefulLinks.css';

const UsefulLinks = ({ onBack, theme }) => {
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

  return (
    <motion.div 
      className="links-app-container"
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
          <h1>Links Úteis</h1>
          <p className="subtitle">Acessos Rápidos e Consultas de Suporte</p>
        </div>

        <div className="links-grid">
          {links.map((link, i) => (
            <motion.a 
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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
              <div className="link-card-arrow">
                <ExternalLink size={18} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default UsefulLinks;
