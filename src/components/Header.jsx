import React from 'react';
import { Moon, Sun, Layers } from 'lucide-react';
import './Header.css';

const Header = ({ theme, toggleTheme }) => {
  return (
    <header className="header glass-panel">
      <div className="page-container header-inner">
        <div className="brand">
          <Layers className="brand-icon" size={24} />
          <h1 className="brand-title">Aplicações Suporte</h1>
        </div>
        
        <button 
          onClick={toggleTheme} 
          className="theme-toggle"
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
