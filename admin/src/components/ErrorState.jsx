import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="ims-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', margin: '1rem 0' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fffbeb',
          color: '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}
      >
        <AlertTriangle size={32} />
      </div>
      <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--ims-text-main)' }}>
        Something Went Wrong
      </h3>
      <p style={{ color: 'var(--ims-text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem', fontSize: '0.92rem', lineHeight: '1.5' }}>
        {message || 'Something went wrong while loading this section. Please try again.'}
      </p>
      {onRetry && (
        <button
          className="ims-btn ims-btn-secondary"
          onClick={onRetry}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} /> Try Again
        </button>
      )}
    </div>
  );
};
