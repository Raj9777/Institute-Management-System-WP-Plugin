import React, { useState } from 'react';
import { api } from '../services/api';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export const PhotoUpload = ({ value, onChange, label = 'Profile Photo' }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const res = await api.uploadFile(file);
      if (res?.url) {
        onChange(res.url);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setError('');
  };

  return (
    <div className="ims-form-group">
      <label>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
        {value ? (
          <div style={{ position: 'relative', width: '64px', height: '64px' }}>
            <img
              src={value}
              alt="Uploaded Preview"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--ims-primary)',
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              title="Remove photo"
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              border: '2px dashed #cbd5e1',
            }}
          >
            {uploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label
              className="ims-btn ims-btn-secondary ims-btn-sm"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}
            >
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Choose Image'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div style={{ marginTop: '0.35rem' }}>
            <input
              type="url"
              className="ims-input"
              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              placeholder="Or paste image URL directly..."
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      </div>
      {error && <small style={{ color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>{error}</small>}
    </div>
  );
};
