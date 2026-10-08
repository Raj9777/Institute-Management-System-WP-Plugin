import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  Receipt,
  UserCheck,
  Settings,
  Building2,
  LogOut,
  HelpCircle,
  Store,
  IndianRupee
} from 'lucide-react';

export const Sidebar = () => {
  const { currentView, setCurrentView, user, settings } = useApp();
  const caps = user?.capabilities || {};

  const handleLogout = () => {
    const logoutUrl = window.imsData?.logoutUrl || '/wp-login.php?action=logout';
    window.location.href = logoutUrl;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'enquiries', label: 'Student Enquiries', icon: HelpCircle, visible: Boolean(caps.manage_students) },
    { id: 'students', label: 'Student Admission', icon: Users, visible: Boolean(caps.manage_students) },
    { id: 'academic', label: 'Courses & Batches', icon: GraduationCap, visible: Boolean(caps.manage_academic) },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, visible: Boolean(caps.view_attendance || caps.mark_attendance) },
    { id: 'finances', label: 'Fees & Invoices', icon: Receipt, visible: Boolean(caps.manage_finances) },
    { id: 'expenses', label: 'Expense Vouchers', icon: IndianRupee, visible: Boolean(caps.manage_finances) },
    { id: 'vendors', label: 'Vendor Directory', icon: Store, visible: Boolean(caps.manage_finances) },
    { id: 'payroll', label: 'Staff & Payroll', icon: UserCheck, visible: Boolean(caps.view_payroll || caps.manage_payroll) },
    { id: 'settings', label: 'Settings', icon: Settings, visible: Boolean(caps.manage_settings) },
  ];

  return (
    <aside className="ims-sidebar">
      <div className="ims-sidebar-header">
        {settings?.logo_url ? (
          <div
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              background: 'transparent',
            }}
          >
            <img
              src={settings.logo_url}
              alt="Logo"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div className="ims-brand-icon">
            <Building2 size={24} />
          </div>
        )}
        <div>
          <div className="ims-brand-title">
            {settings?.institute_name || 'IMS Portal'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ims-text-muted)' }}>
            {settings?.tagline || 'Institute Management'}
          </div>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        <ul className="ims-nav-list">
          {navItems.filter(i => i.visible).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li
                key={item.id}
                className={`ims-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </li>
            );
          })}
          <li
            className="ims-nav-item"
            onClick={handleLogout}
            style={{ color: '#ef4444', marginTop: '1rem', borderTop: '1px dashed var(--ims-border)', paddingTop: '0.75rem' }}
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </li>
        </ul>
      </nav>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--ims-border)', fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>
        IMS Plugin v1.1.0<br />
        Currency: INR (₹)
      </div>
    </aside>
  );
};
