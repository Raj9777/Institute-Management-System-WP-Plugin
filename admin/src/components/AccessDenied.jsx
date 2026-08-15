import React from 'react';
import { useApp } from '../context/AppContext';
import { Lock, ArrowLeft } from 'lucide-react';

export const AccessDenied = ({ message }) => {
  const { setCurrentView } = useApp();

  return (
    <div className="ims-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', margin: '1rem 0' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fef2f2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}
      >
        <Lock size={32} />
      </div>
      <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--ims-text-main)' }}>
        Access Denied
      </h3>
      <p style={{ color: 'var(--ims-text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem', fontSize: '0.92rem', lineHeight: '1.5' }}>
        {message || "You don't have access to this section. Contact your Super Admin if you believe this is a mistake."}
      </p>
      <button
        className="ims-btn ims-btn-primary"
        onClick={() => setCurrentView('dashboard')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={16} /> Return to Dashboard
      </button>
    </div>
  );
};
