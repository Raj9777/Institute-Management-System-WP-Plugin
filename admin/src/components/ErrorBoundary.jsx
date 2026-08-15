import React from 'react';
import { AlertCircle, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Uncaught React UI error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ims-card" style={{ textAlign: 'center', padding: '3rem 2rem', margin: '1.5rem 0' }}>
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
            <AlertCircle size={32} />
          </div>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--ims-text-main)' }}>
            This section couldn't be loaded
          </h3>
          <p style={{ color: 'var(--ims-text-muted)', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.92rem', lineHeight: '1.5' }}>
            An unexpected error occurred while rendering this module. You can navigate back to the dashboard or try refreshing the page.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              className="ims-btn ims-btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
                if (this.props.onNavigateDashboard) {
                  this.props.onNavigateDashboard();
                } else {
                  window.location.reload();
                }
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <LayoutDashboard size={16} /> Return to Dashboard
            </button>
            <button
              className="ims-btn ims-btn-secondary"
              onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {this.state.showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {this.state.showDetails ? 'Hide Error Details' : 'Show Error Details'}
            </button>
          </div>

          {this.state.showDetails && (
            <div style={{ marginTop: '1.5rem', textAlign: 'left', background: '#1e293b', color: '#f8fafc', padding: '1rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'monospace', overflowX: 'auto', maxWidth: '800px', margin: '1.5rem auto 0' }}>
              <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '0.5rem' }}>
                {this.state.error ? this.state.error.toString() : 'Unknown Error'}
              </div>
              {this.state.errorInfo && (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, color: '#cbd5e1' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

