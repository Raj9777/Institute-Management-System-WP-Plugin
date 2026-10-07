import React from 'react';
import { useApp } from '../context/AppContext';
import { LogOut } from 'lucide-react';

export const Header = () => {
  const { currentView, user, settings } = useApp();

  const handleLogout = () => {
    const logoutUrl = window.imsData?.logoutUrl || '/wp-login.php?action=logout';
    window.location.href = logoutUrl;
  };

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard Overview';
      case 'enquiries': return 'Student Enquiries (Leads)';
      case 'students': return 'Student Admission & Directory';
      case 'academic': return 'Courses & Batches';
      case 'attendance': return 'Dual-Mode Attendance';
      case 'finances': return 'GST Invoices & Fee Receipts';
      case 'expenses': return 'Expense Vouchers & Ledger';
      case 'vendors': return 'Vendor & Supplier Directory';
      case 'payroll': return 'Staff Directory & Payroll';
      case 'settings': return 'Institute Branding & Settings';
      default: return 'IMS Portal';
    }
  };

  return (
    <header className="ims-top-header">
      <div className="ims-header-title">
        <h2>{getTitle()}</h2>
      </div>

      <div className="ims-header-actions">

        <div className="ims-user-pill">
          <div className="ims-avatar">
            {typeof user?.display_name === 'string' && user.display_name.length > 0 ? user.display_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ fontSize: '0.88rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--ims-text-main)' }}>
              {user?.display_name || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', textTransform: 'capitalize' }}>
              {typeof user?.roles?.[0] === 'string' ? user.roles[0].replace('ims_', '').replace('_', ' ') : 'Staff'}
            </div>
          </div>
        </div>

        <button
          className="ims-btn ims-btn-secondary ims-btn-sm"
          onClick={handleLogout}
          title="Log Out of IMS"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', borderColor: '#fca5a5' }}
        >
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
};
