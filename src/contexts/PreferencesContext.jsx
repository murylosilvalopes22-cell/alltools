import React, { createContext, useContext, useState, useEffect } from 'react';

const PreferencesContext = createContext();

export const usePreferences = () => useContext(PreferencesContext);

export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('appPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure new properties exist even if loading old state
        return {
          animationsEnabled: parsed.animationsEnabled ?? true,
          showUpdateLog: parsed.showUpdateLog ?? true,
          showFeedbackButton: parsed.showFeedbackButton ?? true,
          showNotifications: parsed.showNotifications ?? true,
          showFestaJunina: parsed.showFestaJunina ?? true
        };
      } catch (e) {
        console.error("Error parsing preferences", e);
      }
    }
    return {
      animationsEnabled: true,
      showUpdateLog: true,
      showFeedbackButton: true,
      showNotifications: true,
      showFestaJunina: true
    };
  });

  useEffect(() => {
    localStorage.setItem('appPreferences', JSON.stringify(preferences));
  }, [preferences]);

  const toggleAnimation = () => setPreferences(prev => ({ ...prev, animationsEnabled: !prev.animationsEnabled }));
  const toggleUpdateLog = () => setPreferences(prev => ({ ...prev, showUpdateLog: !prev.showUpdateLog }));
  const toggleFeedbackButton = () => setPreferences(prev => ({ ...prev, showFeedbackButton: !prev.showFeedbackButton }));
  const toggleNotifications = () => setPreferences(prev => ({ ...prev, showNotifications: !prev.showNotifications }));
  const toggleFestaJunina = () => setPreferences(prev => ({ ...prev, showFestaJunina: !prev.showFestaJunina }));

  return (
    <PreferencesContext.Provider value={{ 
      preferences, 
      toggleAnimation, 
      toggleUpdateLog,
      toggleFeedbackButton,
      toggleNotifications,
      toggleFestaJunina
    }}>
      {children}
    </PreferencesContext.Provider>
  );
};
