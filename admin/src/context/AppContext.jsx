import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(window.imsData?.currentUser || null);
  const [settings, setSettings] = useState(window.imsData?.settings || null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshAppData = async () => {
    setLoading(true);
    try {
      const settingsRes = await api.getSettings().catch(() => ({}));
      setSettings(settingsRes);
    } catch (err) {
      console.error('Failed to load initial app data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAppData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        user,
        settings,
        setSettings,
        toast,
        showToast,
        loading,
        refreshAppData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
