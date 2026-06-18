import React from 'react';
import { motion } from 'framer-motion';
import './BackdropGlow.css';

const BackdropGlow = () => {
  return (
    <div className="glow-container">
      <div className="glow-orb top-left" />
      <div className="glow-orb bottom-right" />
    </div>
  );
};
export default BackdropGlow;
