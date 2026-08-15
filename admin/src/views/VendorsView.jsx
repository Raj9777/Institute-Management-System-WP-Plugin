import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import { Plus, Store, Pencil, Eye, Calendar, IndianRupee, Trash2 } from 'lucide-react';

export const VendorsView = () => {
  const { showToast } = useApp();
  const [vendors, setVendors] = useState([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  // Detail Modal (Running Expenses History)
  const [detailVendor, setDetailVendor] = useState(null);
  const [vendorExpenses, setVendorExpenses] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    category: 'Supplies',
    status: 'active',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    setPermissionDenied(false);
    setError(null);
    try {
      const res = await api.getVendors();
      setVendors(res || []);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load vendors list.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingVendor(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      gstin: '',
      category: 'Supplies',
      status: 'active',
    });
    setShowModal(true);
  };

  const openEditModal = (v) => {
    setEditingVendor(v);
    setFormData({
      name: v.name || '',
      phone: v.phone || '',
      email: v.email || '',
      address: v.address || '',
      gstin: v.gstin || '',
      category: v.category || 'Supplies',
      status: v.status || 'active',
    });
    setShowModal(true);
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await api.updateVendor(editingVendor.id, formData);
        showToast('Vendor details updated.');
      } else {
        await api.createVendor(formData);
        showToast('New vendor created.');
      }
      setShowModal(false);
      loadVendors();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteVendor = async (v) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${v.name}"?`)) {
      return;
    }
    try {
      await api.deleteVendor(v.id);
      showToast('Vendor deleted.');
      loadVendors();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const openDetailModal = async (v) => {
    setDetailVendor(v);
    loadVendorExpenses(v.id, '', '');
  };

  const loadVendorExpenses = async (vendorId, sDate, eDate) => {
    try {
      const res = await api.getVendorExpenses(vendorId, { start_date: sDate, end_date: eDate });
      setVendorExpenses(res.expenses || []);
      setTotalPaid(res.total_paid || 0);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleFilterVendorExpenses = () => {
    if (detailVendor) {
      loadVendorExpenses(detailVendor.id, startDate, endDate);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);
  };

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={loadVendors} />;

  const categoryOptions = ['Supplies', 'Maintenance', 'Marketing', 'Rent', 'Utilities', 'Others'];

  return (
    <div>
      <div className="ims-card">
        <div className="ims-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Vendor Directory & Expense Tracking</h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--ims-text-muted)' }}>
              Manage external suppliers, service providers, and view running expense disbursement history per vendor.
            </div>
          </div>

          <button className="ims-btn ims-btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add New Vendor
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading vendor directory...</div>
        ) : (
          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Category</th>
                  <th>Contact Info</th>
                  <th>GSTIN</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No vendors registered yet.</td></tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{v.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}>{v.address || 'No address specified'}</div>
                      </td>
                      <td><span className="ims-badge ims-badge-secondary">{v.category}</span></td>
                      <td>
                        <div>{v.phone || 'N/A'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}>{v.email || 'N/A'}</div>
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.gstin || 'N/A'}</td>
                      <td>
                        <span className={`ims-badge ims-badge-${v.status === 'active' ? 'success' : 'danger'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            title="View Vendor Expense Ledger"
                            onClick={() => openDetailModal(v)}
                          >
                            <Eye size={14} /> Ledger
                          </button>
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            title="Edit Vendor"
                            onClick={() => openEditModal(v)}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            className="ims-btn ims-btn-danger ims-btn-sm"
                            title="Delete Vendor"
                            onClick={() => handleDeleteVendor(v)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Vendor Modal */}
      {showModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3>{editingVendor ? `Edit Vendor — ${editingVendor.name}` : 'Register New Vendor'}</h3>
            <form onSubmit={handleSaveVendor}>
              <div className="ims-form-group">
                <label>Vendor / Company Name *</label>
                <input
                  type="text"
                  className="ims-input"
                  required
                  placeholder="Company or Supplier Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Primary Category</label>
                  <select className="ims-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="ims-form-group">
                  <label>GSTIN (Optional)</label>
                  <input
                    type="text"
                    className="ims-input"
                    placeholder="27AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="ims-input"
                    placeholder="+91 Mobile or Landline"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="ims-input"
                    placeholder="contact@vendor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="ims-form-group">
                <label>Status</label>
                <select className="ims-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Deactivated</option>
                </select>
              </div>

              <div className="ims-form-group">
                <label>Office / Business Address</label>
                <textarea
                  className="ims-input"
                  rows="2"
                  placeholder="Street, City, State, PIN Code..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="ims-btn ims-btn-primary">{editingVendor ? 'Save Changes' : 'Create Vendor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Detail & Expense Ledger Modal */}
      {detailVendor && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content" style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--ims-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{detailVendor.name} — Expense Ledger</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--ims-text-muted)' }}>
                  Category: {detailVendor.category} | GSTIN: {detailVendor.gstin || 'N/A'}
                </div>
              </div>
              <div style={{ background: '#eff6ff', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#1d4ed8', textTransform: 'uppercase', fontWeight: 700 }}>Total Disbursements</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af' }}>{formatCurrency(totalPaid)}</div>
              </div>
            </div>

            {/* Date Range Filter */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--ims-border)', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Start Date</label>
                <input type="date" className="ims-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>End Date</label>
                <input type="date" className="ims-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={handleFilterVendorExpenses}>Filter Ledger</button>
            </div>

            {/* Expenses List */}
            <div className="ims-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table className="ims-table">
                <thead>
                  <tr>
                    <th>Voucher No</th>
                    <th>Expense Title</th>
                    <th>Date</th>
                    <th>Mode</th>
                    <th style={{ textAlign: 'right' }}>Amount Paid (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorExpenses.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem' }}>No expense payments recorded for this vendor.</td></tr>
                  ) : (
                    vendorExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{exp.voucher_no}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{exp.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}>{exp.description}</div>
                        </td>
                        <td>{exp.expense_date}</td>
                        <td style={{ textTransform: 'uppercase' }}>{exp.payment_mode}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--ims-danger)' }}>
                          {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="ims-btn ims-btn-secondary" onClick={() => setDetailVendor(null)}>Close Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
