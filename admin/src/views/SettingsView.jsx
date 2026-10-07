import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import { PhotoUpload } from '../components/PhotoUpload';
import { Building2, Users, Save, Plus, UserX, UserCheck, Shield, FileText, Download, Database, Trash2 } from 'lucide-react';

export const SettingsView = () => {
  const { showToast, settings, setSettings, user } = useApp();
  const [activeTab, setActiveTab] = useState('branding'); // 'branding', 'users', 'audit', 'backup'
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedUserForOverride, setSelectedUserForOverride] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);

  const [formSettings, setFormSettings] = useState({
    institute_name: '',
    tagline: '',
    website: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    logo_url: '',
    signature_url: '',
    invoice_prefix: 'INV',
    receipt_prefix: 'REC',
    receipt_terms: '',
    cgst_rate: 9.00,
    sgst_rate: 9.00,
  });

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    display_name: '',
    role: 'ims_admin',
  });

  const [overrideCaps, setOverrideCaps] = useState({
    ims_manage_finances: true,
    ims_manage_students: true,
    ims_mark_attendance: true,
    ims_view_payroll: false,
    ims_manage_academic: false,
  });

  useEffect(() => {
    if (settings) {
      setFormSettings({ ...settings });
    }
  }, [settings]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setPermissionDenied(false);
    setError(null);
    try {
      const res = await api.getUsers();
      setUsers(res || []);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load user settings.');
      }
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await fetch(`${window.imsData?.root || '/wp-json/'}ims/v1/audit-logs`, {
        headers: { 'X-WP-Nonce': window.imsData?.nonce || '' }
      }).then(r => r.json());
      setAuditLogs(res.data || []);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateSettings(formSettings);
      setSettings(updated);
      showToast('Institute settings saved successfully!');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleFullDataExport = async () => {
    try {
      const res = await fetch(`${window.imsData?.root || '/wp-json/'}ims/v1/reports/full-export`, {
        headers: { 'X-WP-Nonce': window.imsData?.nonce || '' }
      }).then(r => r.json());

      if (!res.ok) throw new Error(res.error?.message || 'Export failed');

      const jsonStr = JSON.stringify(res.data.data_json, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      a.click();
      URL.revokeObjectURL(url);

      showToast('Full Institute Data Export downloaded successfully!');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(userForm);
      showToast('Plugin user created!');
      setShowUserModal(false);
      loadUsers();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleToggleUserStatus = async (targetId, currentDisabled) => {
    try {
      const res = await fetch(`${window.imsData?.root || '/wp-json/'}ims/v1/users/${targetId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.imsData?.nonce || ''
        },
        body: JSON.stringify({ disabled: !currentDisabled })
      }).then(r => r.json());

      if (!res.ok) throw new Error(res.error?.message || 'Action failed');
      showToast(res.data.message);
      loadUsers();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${targetUser.display_name || targetUser.username}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteUser(targetUser.id);
      showToast(`User "${targetUser.display_name || targetUser.username}" deleted successfully!`);
      loadUsers();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleSaveOverrides = async () => {
    if (!selectedUserForOverride) return;
    try {
      const res = await fetch(`${window.imsData?.root || '/wp-json/'}ims/v1/users/${selectedUserForOverride.id}/capabilities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.imsData?.nonce || ''
        },
        body: JSON.stringify({ overrides: overrideCaps })
      }).then(r => r.json());

      if (!res.ok) throw new Error(res.error?.message || 'Save failed');
      showToast('Per-user capability overrides saved!');
      setShowOverrideModal(false);
      loadUsers();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={loadUsers} />;

  return (
    <div>
      <div className="ims-card">
        <div className="ims-card-header">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className={`ims-btn ${activeTab === 'branding' ? 'ims-btn-primary' : 'ims-btn-secondary'}`} onClick={() => setActiveTab('branding')}>
              <Building2 size={16} /> Institute Branding
            </button>
            <button className={`ims-btn ${activeTab === 'users' ? 'ims-btn-primary' : 'ims-btn-secondary'}`} onClick={() => setActiveTab('users')}>
              <Users size={16} /> User Management
            </button>
            <button className={`ims-btn ${activeTab === 'backup' ? 'ims-btn-primary' : 'ims-btn-secondary'}`} onClick={() => setActiveTab('backup')}>
              <Database size={16} /> Data Export & Backup
            </button>
            <button className={`ims-btn ${activeTab === 'audit' ? 'ims-btn-primary' : 'ims-btn-secondary'}`} onClick={() => setActiveTab('audit')}>
              <FileText size={16} /> Audit Logs
            </button>
          </div>
        </div>

        {/* Tab 1: Branding */}
        {activeTab === 'branding' && (
          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <PhotoUpload
                value={formSettings.logo_url}
                onChange={(url) => setFormSettings({ ...formSettings, logo_url: url })}
                label="Institute Logo (Header & Printed Receipts)"
              />
              <PhotoUpload
                value={formSettings.signature_url}
                onChange={(url) => setFormSettings({ ...formSettings, signature_url: url })}
                label="Authorised Signatory Image (Printed Receipts)"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="ims-form-group">
                <label>Institute Name *</label>
                <input type="text" className="ims-input" required value={formSettings.institute_name} onChange={(e) => setFormSettings({ ...formSettings, institute_name: e.target.value })} />
              </div>
              <div className="ims-form-group">
                <label>Tagline / Motto</label>
                <input type="text" className="ims-input" value={formSettings.tagline} onChange={(e) => setFormSettings({ ...formSettings, tagline: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="ims-form-group">
                <label>Official Website URL</label>
                <input type="text" className="ims-input" placeholder="www.institute.com" value={formSettings.website || ''} onChange={(e) => setFormSettings({ ...formSettings, website: e.target.value })} />
              </div>
              <div className="ims-form-group">
                <label>Contact Phone</label>
                <input type="text" className="ims-input" value={formSettings.phone} onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="ims-form-group">
                <label>Indian GSTIN Number</label>
                <input type="text" className="ims-input" value={formSettings.gstin} onChange={(e) => setFormSettings({ ...formSettings, gstin: e.target.value })} />
              </div>
              <div className="ims-form-group">
                <label>Receipt Number Prefix</label>
                <input type="text" className="ims-input" value={formSettings.receipt_prefix || 'REC'} onChange={(e) => setFormSettings({ ...formSettings, receipt_prefix: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="ims-form-group">
                <label>CGST Rate (%)</label>
                <input type="number" step="0.01" className="ims-input" value={formSettings.cgst_rate} onChange={(e) => setFormSettings({ ...formSettings, cgst_rate: e.target.value })} />
              </div>
              <div className="ims-form-group">
                <label>SGST Rate (%)</label>
                <input type="number" step="0.01" className="ims-input" value={formSettings.sgst_rate} onChange={(e) => setFormSettings({ ...formSettings, sgst_rate: e.target.value })} />
              </div>
            </div>

            <div className="ims-form-group">
              <label>Printed Receipt Terms & Conditions (Footer)</label>
              <textarea
                className="ims-textarea"
                rows="2"
                placeholder="* Cheques subject to realisation. Fee once paid are not refundable..."
                value={formSettings.receipt_terms || ''}
                onChange={(e) => setFormSettings({ ...formSettings, receipt_terms: e.target.value })}
              />
            </div>

            <div className="ims-form-group">
              <label>Printed Admission Agreement Declaration & Code of Conduct (Footer)</label>
              <textarea
                className="ims-textarea"
                rows="2"
                placeholder="I have read and understood the code of conduct, and payment term / Installment plan mentioned above..."
                value={formSettings.admission_terms || ''}
                onChange={(e) => setFormSettings({ ...formSettings, admission_terms: e.target.value })}
              />
            </div>

            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '15px', fontWeight: 600 }}>Front-End Application Shell & Route</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#0e7490' }}>
                Staff members access the plugin via this bare front-end page (no WordPress theme chrome). Non-admin staff are automatically locked out of <code>/wp-admin/</code> and redirected here.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="ims-form-group" style={{ marginBottom: 0 }}>
                  <label>App Page Slug *</label>
                  <input 
                    type="text" 
                    className="ims-input" 
                    required 
                    value={formSettings.app_slug || 'institute-app'} 
                    onChange={(e) => setFormSettings({ ...formSettings, app_slug: e.target.value })} 
                  />
                  <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '12px' }}>
                    Default: <code>institute-app</code>. Updating this will update the page URL slug.
                  </small>
                </div>
                <div className="ims-form-group" style={{ marginBottom: 0 }}>
                  <label>Direct Staff App URL</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className="ims-input" 
                      readOnly 
                      value={formSettings.app_url || (window.location.origin + '/' + (formSettings.app_slug || 'institute-app') + '/')} 
                      style={{ background: '#ffffff', color: '#334155', cursor: 'text' }}
                    />
                    <a 
                      href={formSettings.app_url || ('/' + (formSettings.app_slug || 'institute-app') + '/')} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ims-btn ims-btn-secondary" 
                      style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}
                    >
                      Open App
                    </a>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e0f2fe', fontSize: '13px', color: '#0369a1' }}>
                <strong>Button Link & Shortcode:</strong> Use shortcode <code>[ims_launch_button label="Staff Portal" style="..."]</code> or paste the plain URL above into any page builder or block editor button.
              </div>
            </div>

            <div className="ims-form-group">
              <label>Address</label>
              <textarea className="ims-textarea" rows="3" value={formSettings.address} onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })} />
            </div>

            {/* Attendance Weights & Payroll Settings Section */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px dashed var(--ims-border)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--ims-text-main)' }}>
                Attendance Payable Weights & Weekly-Off Basis
              </h3>
              <p style={{ color: 'var(--ims-text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                Configure payable attendance weights (`0.0` to `1.0`) and the weekly-off day used to calculate `working_days_basis` for staff payroll runs.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="ims-form-group">
                  <label>Weekly-Off Day *</label>
                  <select
                    className="ims-select"
                    value={formSettings.weekly_off_day || 'Sunday'}
                    onChange={(e) => setFormSettings({ ...formSettings, weekly_off_day: e.target.value })}
                  >
                    <option value="Sunday">Sunday (Standard)</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Friday">Friday</option>
                    <option value="Monday">Monday</option>
                  </select>
                  <small style={{ color: 'var(--ims-text-muted)', fontSize: '0.78rem' }}>
                    Calculates `working_days_basis = calendar_days_in_month - weekly_offs_count`
                  </small>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--ims-border)', marginBottom: '1.5rem' }}>
                <div className="ims-form-group" style={{ margin: 0 }}>
                  <label>Present Weight</label>
                  <input
                    type="number" step="0.1" min="0" max="1" className="ims-input"
                    value={formSettings.attendance_weights?.present ?? 1.0}
                    onChange={(e) => setFormSettings({
                      ...formSettings,
                      attendance_weights: { ...formSettings.attendance_weights, present: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>

                <div className="ims-form-group" style={{ margin: 0 }}>
                  <label>Half Day Weight</label>
                  <input
                    type="number" step="0.1" min="0" max="1" className="ims-input"
                    value={formSettings.attendance_weights?.half_day ?? 0.5}
                    onChange={(e) => setFormSettings({
                      ...formSettings,
                      attendance_weights: { ...formSettings.attendance_weights, half_day: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>

                <div className="ims-form-group" style={{ margin: 0 }}>
                  <label>Late Weight</label>
                  <input
                    type="number" step="0.1" min="0" max="1" className="ims-input"
                    value={formSettings.attendance_weights?.late ?? 1.0}
                    onChange={(e) => setFormSettings({
                      ...formSettings,
                      attendance_weights: { ...formSettings.attendance_weights, late: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>

                <div className="ims-form-group" style={{ margin: 0 }}>
                  <label>Leave Weight</label>
                  <input
                    type="number" step="0.1" min="0" max="1" className="ims-input"
                    value={formSettings.attendance_weights?.leave ?? 1.0}
                    onChange={(e) => setFormSettings({
                      ...formSettings,
                      attendance_weights: { ...formSettings.attendance_weights, leave: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>

                <div className="ims-form-group" style={{ margin: 0 }}>
                  <label>Absent Weight</label>
                  <input
                    type="number" step="0.1" min="0" max="1" className="ims-input"
                    value={formSettings.attendance_weights?.absent ?? 0.0}
                    onChange={(e) => setFormSettings({
                      ...formSettings,
                      attendance_weights: { ...formSettings.attendance_weights, absent: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="ims-btn ims-btn-primary">
              <Save size={16} /> Save Settings
            </button>
          </form>
        )}

        {/* Tab 2: Data Export & Backup */}
        {activeTab === 'backup' && (
          <div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.5rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={20} /> Data Portability Guarantee
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a', lineHeight: 1.5 }}>
                You can download a complete export of all institute records (Students, Invoices, Receipts, Expenses, Payroll, Attendance) at any time. This serves as your safety net if you ever migrate hosting providers or need local data archives.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <button className="ims-btn ims-btn-primary" onClick={handleFullDataExport}>
                <Download size={16} /> Export My Data (Full Backup JSON)
              </button>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '1.25rem', borderRadius: '10px', fontSize: '0.88rem', color: '#92400e' }}>
              <strong>Important Backup Recommendation:</strong><br />
              This data export provides complete IMS institute data portability. For full WordPress site coverage (themes, uploads, media, plugins), we strongly recommend using a standard WordPress backup plugin (such as UpdraftPlus or Duplicator) or your hosting provider's (e.g. Hostinger) automated whole-site backup feature.
            </div>
          </div>
        )}

        {/* Tab 4: User Management */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0 }}>Plugin Users & Roles</h4>
              </div>
              <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={() => setShowUserModal(true)}>
                <Plus size={14} /> Add Plugin User
              </button>
            </div>

            <div className="ims-table-wrapper">
              <table className="ims-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Display Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={u.is_disabled ? { opacity: 0.5, background: '#f1f5f9' } : {}}>
                      <td style={{ fontWeight: 700 }}>{u.username}</td>
                      <td>{u.display_name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="ims-badge ims-badge-primary">
                          {u.roles[0]?.replace('ims_', '').replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`ims-badge ims-badge-${u.is_disabled ? 'danger' : 'success'}`}>
                          {u.is_disabled ? 'Disabled' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            onClick={() => {
                              setSelectedUserForOverride(u);
                              setOverrideCaps(u.overrides || {});
                              setShowOverrideModal(true);
                            }}
                          >
                            <Shield size={12} /> Overrides
                          </button>
                          <button
                            className={`ims-btn ims-btn-sm ${u.is_disabled ? 'ims-btn-primary' : 'ims-btn-secondary'}`}
                            onClick={() => handleToggleUserStatus(u.id, u.is_disabled)}
                            disabled={u.id === user?.id}
                            title={u.is_disabled ? 'Enable Account' : 'Disable Account'}
                          >
                            {u.is_disabled ? <UserCheck size={12} /> : <UserX size={12} />}
                            {u.is_disabled ? 'Enable' : 'Disable'}
                          </button>
                          <button
                            className="ims-btn ims-btn-danger ims-btn-sm"
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === user?.id}
                            title="Delete User Permanently"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Audit Logs */}
        {activeTab === 'audit' && (
          <div>
            <h4 style={{ margin: '0 0 1rem 0' }}>Security & Auth Event Audit Logs</h4>
            <div className="ims-table-wrapper">
              <table className="ims-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event Type</th>
                    <th>Actor ID</th>
                    <th>Target ID</th>
                    <th>IP Address</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No audit logs recorded yet.</td></tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.created_at}</td>
                        <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{log.event_type}</td>
                        <td>User #{log.actor_id}</td>
                        <td>User #{log.target_id}</td>
                        <td>{log.ip_address}</td>
                        <td style={{ fontSize: '0.82rem' }}>{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3>Add Plugin User</h3>
            <form onSubmit={handleCreateUser}>
              <div className="ims-form-group">
                <label>Username *</label>
                <input type="text" className="ims-input" required value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
              </div>
              <div className="ims-form-group">
                <label>Display Name *</label>
                <input type="text" className="ims-input" required value={userForm.display_name} onChange={(e) => setUserForm({ ...userForm, display_name: e.target.value })} />
              </div>
              <div className="ims-form-group">
                <label>Email Address *</label>
                <input type="email" className="ims-input" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
              </div>
              <div className="ims-form-group">
                <label>Password *</label>
                <input type="password" className="ims-input" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
              </div>
              <div className="ims-form-group">
                <label>Assign Plugin Role *</label>
                <select className="ims-select" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="ims_super_admin">Institute Super Admin</option>
                  <option value="ims_admin">Admin / Manager</option>
                  <option value="ims_accountant">Accountant</option>
                  <option value="ims_front_desk">Front Desk</option>
                  <option value="ims_teacher">Teacher / Faculty</option>
                  <option value="ims_read_only">Read Only</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="ims-btn ims-btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && selectedUserForOverride && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content" style={{ maxWidth: '640px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--ims-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ims-text-main)' }}>
                  Permission Overrides: {selectedUserForOverride.display_name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ims-text-muted)', marginTop: '2px' }}>
                  Role: <strong style={{ textTransform: 'capitalize' }}>{selectedUserForOverride.roles?.[0]?.replace('ims_', '').replace('_', ' ') || 'Staff'}</strong> ({selectedUserForOverride.username})
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="ims-btn ims-btn-secondary ims-btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => {
                    const allTrue = {};
                    [
                      'ims_manage_students', 'ims_manage_academic', 'ims_view_attendance',
                      'ims_mark_attendance', 'ims_manage_finances', 'ims_view_payroll',
                      'ims_manage_payroll', 'ims_view_staff_sensitive', 'ims_view_reports',
                      'ims_manage_settings', 'ims_manage_users'
                    ].forEach(k => { allTrue[k] = true; });
                    setOverrideCaps(allTrue);
                  }}
                >
                  Grant All
                </button>
                <button
                  type="button"
                  className="ims-btn ims-btn-secondary ims-btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => {
                    const allFalse = {};
                    [
                      'ims_manage_students', 'ims_manage_academic', 'ims_view_attendance',
                      'ims_mark_attendance', 'ims_manage_finances', 'ims_view_payroll',
                      'ims_manage_payroll', 'ims_view_staff_sensitive', 'ims_view_reports',
                      'ims_manage_settings', 'ims_manage_users'
                    ].forEach(k => { allFalse[k] = false; });
                    setOverrideCaps(allFalse);
                  }}
                >
                  Revoke All
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1rem 0' }}>
              {[
                {
                  section: '🎓 Student Management & Admissions',
                  color: '#2563eb',
                  items: [
                    {
                      key: 'ims_manage_students',
                      label: 'Student Directory & Admissions',
                      subLabel: 'Admissions, enquiries, student profile editing, and ledger viewing.',
                    },
                  ],
                },
                {
                  section: '📚 Academic Management',
                  color: '#059669',
                  items: [
                    {
                      key: 'ims_manage_academic',
                      label: 'Courses & Batch Schedules',
                      subLabel: 'Create and update courses, batch timings, and faculty assignments.',
                    },
                  ],
                },
                {
                  section: '📅 Attendance Management',
                  color: '#d97706',
                  items: [
                    {
                      key: 'ims_view_attendance',
                      label: 'Sub-section: View Attendance Register',
                      subLabel: 'Inspect daily attendance logs, attendance rates, and monthly registers.',
                    },
                    {
                      key: 'ims_mark_attendance',
                      label: 'Sub-section: Take / Mark Attendance',
                      subLabel: 'Perform daily roll-calls for student batches and staff members.',
                    },
                  ],
                },
                {
                  section: '💳 Finances & Accounts',
                  color: '#7c3aed',
                  items: [
                    {
                      key: 'ims_manage_finances',
                      label: 'Fees, Invoices & Expenses',
                      subLabel: 'Collect fee receipts, generate GST invoices, and log vendor expenses.',
                    },
                  ],
                },
                {
                  section: '👥 Staff & Payroll Management',
                  color: '#0284c7',
                  items: [
                    {
                      key: 'ims_view_payroll',
                      label: 'Sub-section: View Staff & Payroll Runs',
                      subLabel: 'Access staff directory and inspect monthly automated payroll runs.',
                    },
                    {
                      key: 'ims_manage_payroll',
                      label: 'Sub-section: Manage & Finalize Payroll',
                      subLabel: 'Add salary bonuses/deductions and finalize monthly payroll disbursements.',
                    },
                    {
                      key: 'ims_view_staff_sensitive',
                      label: 'Sub-section: Sensitive Bank Details',
                      subLabel: 'Reveal masked AES-256 encrypted staff bank accounts & IFSC (audited).',
                    },
                  ],
                },
                {
                  section: '📊 Analytics & Reports',
                  color: '#ea580c',
                  items: [
                    {
                      key: 'ims_view_reports',
                      label: 'Analytics & Full Backup Export',
                      subLabel: 'Access institute financial/academic reports and download JSON database backup.',
                    },
                  ],
                },
                {
                  section: '⚙️ System Administration',
                  color: '#475569',
                  items: [
                    {
                      key: 'ims_manage_settings',
                      label: 'Institute Branding & Settings',
                      subLabel: 'Manage institute logo, GST rates, invoice sequences, and receipt terms.',
                    },
                    {
                      key: 'ims_manage_users',
                      label: 'User Management & Permissions',
                      subLabel: 'Create staff accounts, toggle login access, and set capability overrides.',
                    },
                  ],
                },
              ].map((grp) => (
                <div
                  key={grp.section}
                  style={{
                    border: '1px solid var(--ims-border)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: grp.color, marginBottom: '0.65rem' }}>
                    {grp.section}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {grp.items.map((cap) => {
                      const isChecked = Boolean(overrideCaps[cap.key]);
                      return (
                        <label
                          key={cap.key}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.65rem',
                            cursor: 'pointer',
                            background: '#ffffff',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: isChecked ? '1px solid var(--ims-primary)' : '1px solid var(--ims-border)',
                          }}
                        >
                          <input
                            type="checkbox"
                            style={{ marginTop: '3px' }}
                            checked={isChecked}
                            onChange={(e) => setOverrideCaps({ ...overrideCaps, [cap.key]: e.target.checked })}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ims-text-main)' }}>
                              {cap.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '1px' }}>
                              {cap.subLabel}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--ims-border)', paddingTop: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowOverrideModal(false)}>
                Cancel
              </button>
              <button type="button" className="ims-btn ims-btn-primary" onClick={handleSaveOverrides}>
                Save Capability Overrides
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
