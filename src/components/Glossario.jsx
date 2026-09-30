import React, { useState } from 'react';
import { BookA, Search, ArrowLeft } from 'lucide-react';
import './Glossario.css';

const GLOSSARY_TERMS = [
  {
    term: 'Adquirente (ou Credenciadora)',
    description: 'As empresas que processam os pagamentos e liquidam o dinheiro com os bancos. Elas credenciam o lojista para aceitar cartões. Exemplos: Cielo, Rede, Stone, Getnet.',
  },
  {
    term: 'Banco Emissor',
    description: 'O banco que emitiu o cartão para o seu cliente (ex: Bradesco, Nubank). É ele quem analisa se o comprador tem limite ou saldo disponível e aprova ou recusa a transação.',
  },
  {
    term: 'Bandeira (Card Scheme)',
    description: 'A marca que estampa o cartão e regula o mercado de pagamentos, fazendo a validação de segurança e a ponte de comunicação internacional. Exemplos: Visa, Mastercard, Elo.',
  },
  {
    term: 'Maquininha NDD',
    description: 'Refere-se à solução integrada da maquininha inteligente rodando o motor fiscal. A solução conta com o Portal NDD, um painel web que serve para enviar XML, verificar os cupons fiscais emitidos e atualizar o certificado digital. A Maquininha NDD trabalha em conjunto com o Portal do PDV Mobi, que é utilizado para alterar preços, gerar relatórios e fazer as configurações tributárias dos produtos, garantindo uma gestão centralizada.',
  },
  {
    term: 'NFC (Near Field Communication)',
    description: 'Tecnologia de transmissão de dados por proximidade. É o mecanismo que viabiliza os pagamentos por aproximação usando o próprio cartão, o smartphone ou relógios inteligentes.',
  },
  {
    term: 'PDV (Ponto de Venda)',
    description: 'Termo que designa tanto o local físico do caixa quanto o sistema (software) usado para registrar os produtos e fechar as contas.',
  },
  {
    term: 'PDV Mobi',
    description: 'É o aplicativo que roda dentro da maquininha inteligente (Smart POS) atuando como o "frente de caixa" portátil. Ele é o responsável por gerenciar e registrar as vendas de duas formas: capturando pedidos e dados que vêm direto de um sistema de gestão centralizado da loja, ou operando de forma autônoma integrado ao motor fiscal da NDD Tech para emitir o cupom fiscal direto no terminal.',
    links: [
      { url: 'https://storsistemas.pdv.mobi', label: 'Acessar Portal V1' },
      { url: 'https://storsistemas.v2.pdv.mobi/POSAuth/', label: 'Acessar Portal V2' }
    ]
  },
  {
    term: 'PINPAD',
    description: 'O leitor de cartões compacto conectado por cabo ao computador do caixa em sistemas de TEF tradicionais. Ele não trabalha sozinho; apenas lê o chip, recebe a aproximação e captura a senha do cliente, repassando as informações para o computador do caixa. É importante destacar que o PINPAD necessita de uma conexão com softwares integradores, como o Elgin Tef Hub, SiTef ou PayGO.',
    images: [
      { url: './outros/PPC930.png', label: 'Gertec PPC 930' },
      { url: './outros/PPC960-imagem-destacada.png.webp', label: 'Gertec PPC 960' }
    ]
  },
  {
    term: 'POS (Point of Sale)',
    description: 'A maquininha de cartão tradicional de balcão. Opera de forma autônoma, pois possui sistema operacional próprio, modem com chip de celular ou Wi-Fi e impressora embutida.',
  },
  {
    term: 'POS Controle',
    description: 'Sistema de PDV Móvel que permite automatizar o negócio, emitir nota fiscal (NFC-e) direto da maquininha de cartão e reduzir custos operacionais. Possui portal web com gráficos e relatórios intuitivos. Compatível com diversos equipamentos como Totens de autoatendimento, Mini PDVs Elgin (M10, M10 PRO) e balanças Toledo Prix 3 Fit.',
  },
  {
    term: 'Smart POS',
    description: 'A evolução da maquininha tradicional. São terminais inteligentes baseados no sistema Android e com tela touchscreen. Por serem pequenos computadores portáteis, permitem a instalação de aplicativos de automação (como o PDV Mobi) direto no aparelho.',
    images: [
      { url: 'https://static.wixstatic.com/media/1b2aeb_bb0b4ea94f7d4be3af18300526f40bb2~mv2.png/v1/crop/x_0,y_0,w_462,h_1073/fill/w_63,h_146,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Ingenico-DX8000-Smart-TEF.png', label: 'Ingenico DX8000' }
    ]
  },
  {
    term: 'TEF (Transferência Eletrônica de Fundos)',
    description: 'O sistema de integração que interliga o software comercial do estabelecimento diretamente com as adquirentes. Ele evita erros humanos, pois o valor do sistema é enviado automaticamente para o terminal de pagamento, sem que o operador precise digitar o valor na máquina. Importante ressaltar que o uso do TEF (ou tecnologias de Pagamento Integrado) passou a ser obrigatório por lei (Decretos Estaduais da SEFAZ) em diversos estados brasileiros, como RS, MT, CE, PB e GO. Essa obrigatoriedade exige que a emissão da nota fiscal (NFC-e) e a transação do cartão ocorram no mesmo equipamento e processo, combatendo a sonegação fiscal.',
  },
  {
    term: 'Smart TEF',
    description: 'Solução de TEF via API com operação direta no Smart POS (simples, moderno e sem Pinpad). Pode operar pagamento único ou vários cards, com mobilidade total. Suporta impressão de qualquer documento no Smart POS, inclusive NFC-e, e atende à legislação estadual de Pagamento Integrado (RS, MT, CE, GO e Cuiabá/MT).'
  }
];

const Glossario = ({ onBack, theme }) => {
  const [search, setSearch] = useState('');

  const filteredTerms = GLOSSARY_TERMS.filter(item => 
    item.term.toLowerCase().includes(search.toLowerCase()) || 
    item.description.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className={`glossario-wrapper ${theme} animate-fade-in`}>
      <div className="glossario-content-area">
        <div className="glass-panel" style={{ padding: '32px', minHeight: '80vh' }}>
          <div className="glossario-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px', color: '#3b82f6', display: 'flex' }}>
                <BookA size={32} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>Glossário Técnico</h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>Dicionário de termos e equipamentos</p>
              </div>
            </div>
            <div className="glossario-search glass-panel">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar por sigla, termo ou conceito..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="glossario-list">
            {filteredTerms.length > 0 ? (
              filteredTerms.map((item, index) => (
                <div key={index} className="glossario-item">
                  <div className="glossario-item-header">
                    <div className="glossario-item-letter">
                      {item.term.charAt(0).toUpperCase()}
                    </div>
                    <h3>{item.term}</h3>
                  </div>
                  <p>{item.description}</p>
                  
                  {item.links && item.links.length > 0 && (
                    <div className="glossario-links" style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      {item.links.map((link, idx) => (
                        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1.1em' }}>🔗</span> {link.label}
                        </a>
                      ))}
                    </div>
                  )}

                  {item.images && item.images.length > 0 && (
                    <div className="glossario-images">
                      {item.images.map((img, idx) => (
                        <div key={idx} className="glossario-image-card">
                          <img src={img.url} alt={img.label} loading="lazy" />
                          <span>{img.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-results">
                Nenhum termo encontrado para "{search}".
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Glossario;
