import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

const ThemeToggle = ({ theme, toggleTheme }) => {
  return (
    <motion.button 
      className="theme-toggle-orb glass-panel"
      style={{ '--hover-color': theme === 'dark' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(56, 189, 248, 0.4)', '--hover-shadow': theme === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(56, 189, 248, 0.2)' }}
      onClick={toggleTheme}
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.9 }}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={20} className="icon-sun" /> : <Moon size={20} className="icon-moon" />}
    </motion.button>
  );
};

export default ThemeToggle;
