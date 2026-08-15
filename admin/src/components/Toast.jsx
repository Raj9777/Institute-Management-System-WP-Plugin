import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const Toast = () => {
  const { toast } = useApp();
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: isSuccess ? 'var(--ims-success)' : 'var(--ims-danger)',
        color: '#ffffff',
        padding: '0.85rem 1.4rem',
        borderRadius: '10px',
        boxShadow: 'var(--ims-shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        fontWeight: 600,
        fontSize: '0.9rem',
        zIndex: 999999,
        animation: 'imsSlideUp 0.3s ease-out',
      }}
    >
      {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span>{toast.message}</span>
    </div>
  );
};
