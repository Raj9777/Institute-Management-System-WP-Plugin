import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import { IndianRupee, Plus, Download, Printer, Pencil, Trash2, Search, Calendar, FileText, Building2, Store } from 'lucide-react';

const ExpenseVoucherPrintModal = ({ voucher, settings, onClose }) => {
  if (!voucher) return null;
  const inst = settings || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ims-modal-overlay ims-voucher-modal-overlay">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .ims-voucher-printable-area, .ims-voucher-printable-area * {
            visibility: visible !important;
          }
          .ims-voucher-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .ims-voucher-modal-overlay {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
          }
          .ims-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="ims-modal-content" style={{ maxWidth: '750px', background: '#fff', padding: '1.5rem', color: '#0f172a', position: 'relative' }}>
        <div className="ims-voucher-printable-area" style={{ border: '2px solid #1e293b', padding: '1.5rem', borderRadius: '4px', background: '#fff', fontFamily: 'Arial, sans-serif' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ border: '2px solid #1e293b', padding: '0.35rem 1rem', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'inline-block' }}>
                PAYMENT VOUCHER
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
                VOUCHER NO: {voucher.voucher_no}
              </div>
            </div>

            <div style={{ textAlign: 'right', flex: 1, paddingLeft: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                {inst.logo_url && (
                  <img src={inst.logo_url} alt="Logo" style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain' }} />
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                    {inst.institute_name || 'Institute Management'}
                  </h2>
                  {inst.tagline && <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{inst.tagline}</div>}
                  {inst.phone && <div style={{ fontSize: '0.78rem', color: '#334155' }}>Phone: {inst.phone}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Date & Mode info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            <div><strong>Date:</strong> {voucher.expense_date}</div>
            <div style={{ textAlign: 'right' }}><strong>Payment Mode:</strong> <span style={{ textTransform: 'uppercase' }}>{voucher.payment_mode}</span></div>
          </div>

          {/* Voucher Details Grid */}
          <div style={{ border: '1.5px solid #1e293b', borderRadius: '4px', padding: '1rem', marginBottom: '1.5rem', background: '#f8fafc', fontSize: '0.9rem', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700 }}>Paid To (Vendor / Payee):</span>
              <span style={{ fontWeight: 700, color: '#1e3a8a' }}>{voucher.vendor_name || 'N/A'}</span>
            </div>
            {voucher.gstin && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700 }}>Vendor GSTIN:</span>
                <span>{voucher.gstin}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700 }}>Expense Category / Account Head:</span>
              <span style={{ fontWeight: 600 }}>{voucher.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700 }}>Description / Purpose:</span>
              <span>{voucher.title} {voucher.description ? `— ${voucher.description}` : ''}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
              <span>Total Amount Paid:</span>
              <span>₹{parseFloat(voucher.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '3rem', paddingTop: '1rem', fontSize: '0.85rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #0f172a', width: '160px', paddingTop: '4px', fontWeight: 700 }}>Prepared By</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #0f172a', width: '160px', paddingTop: '4px', fontWeight: 700 }}>Authorized Signatory</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #0f172a', width: '160px', paddingTop: '4px', fontWeight: 700 }}>Receiver's Signature</div>
            </div>
          </div>

        </div>

        <div className="ims-no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="ims-btn ims-btn-secondary" onClick={onClose}>Close</button>
          <button className="ims-btn ims-btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print Voucher
          </button>
        </div>
      </div>
    </div>
  );
};

export const ExpensesView = () => {
  const { showToast, user, settings } = useApp();
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [printVoucher, setPrintVoucher] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const canBackdate = user?.is_super_admin || user?.capabilities?.manage_settings;

  const [expenseForm, setExpenseForm] = useState({
    category: 'Maintenance',
    title: '',
    description: '',
    amount: '',
    gstin: '',
    vendor_name: '',
    expense_date: todayStr,
    payment_mode: 'cash',
    receipt_url: '',
  });

  const categories = [
    'Rent',
    'Electricity',
    'Internet & Telecom',
    'Marketing & Ads',
    'Teacher Honorarium',
    'Maintenance',
    'Office Supplies',
    'Books & Printing',
    'Refreshments & Events',
    'Others'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setPermissionDenied(false);
    setError(null);
    try {
      const [expRes, venRes] = await Promise.all([
        api.getExpenses(),
        api.getVendors().catch(() => [])
      ]);
      setExpenses(expRes || []);
      setVendors(venRes || []);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load expenses.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: 'Maintenance',
      title: '',
      description: '',
      amount: '',
      gstin: '',
      vendor_name: '',
      expense_date: todayStr,
      payment_mode: 'cash',
      receipt_url: '',
    });
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({
      category: exp.category || 'Maintenance',
      title: exp.title || '',
      description: exp.description || '',
      amount: exp.amount || '',
      gstin: exp.gstin || '',
      vendor_name: exp.vendor_name || '',
      expense_date: exp.expense_date || todayStr,
      payment_mode: exp.payment_mode || 'cash',
      receipt_url: exp.receipt_url || '',
    });
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, expenseForm);
        showToast('Expense voucher updated successfully!');
      } else {
        const res = await api.createExpense(expenseForm);
        showToast(`Expense voucher ${res.voucher_no || ''} recorded successfully!`);
      }
      setShowExpenseModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteExpense = async (exp) => {
    if (!window.confirm(`Are you sure you want to delete expense voucher "${exp.voucher_no}" (${exp.title})?`)) {
      return;
    }
    try {
      await api.deleteExpense(exp.id);
      showToast('Expense voucher deleted.');
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.getExportCSV('expenses');
      if (res?.csv_raw) {
        const blob = new Blob([res.csv_raw], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.filename || 'ims-export-expenses.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        showToast('No expense records found to export.', 'warning');
      }
    } catch (err) {
      showToast(err.message || 'Failed to export CSV', 'danger');
    }
  };

  // Filtered records
  const filteredExpenses = expenses.filter((exp) => {
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
    if (dateFrom && exp.expense_date < dateFrom) return false;
    if (dateTo && exp.expense_date > dateTo) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchVoucher = (exp.voucher_no || '').toLowerCase().includes(q);
      const matchTitle = (exp.title || '').toLowerCase().includes(q);
      const matchVendor = (exp.vendor_name || '').toLowerCase().includes(q);
      if (!matchVoucher && !matchTitle && !matchVendor) return false;
    }
    return true;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div>
      {/* Top Banner & KPI Row */}
      <div className="ims-grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="ims-kpi-card">
          <div className="ims-kpi-info">
            <h4>Total Recorded Expenses</h4>
            <div className="ims-kpi-value" style={{ color: '#dc2626' }}>
              ₹{totalExpenseAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <small style={{ color: 'var(--ims-text-muted)' }}>{filteredExpenses.length} vouchers matching filters</small>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <IndianRupee size={24} />
          </div>
        </div>

        <div className="ims-kpi-card">
          <div className="ims-kpi-info">
            <h4>Expense Categories</h4>
            <div className="ims-kpi-value">{categories.length} Heads</div>
            <small style={{ color: 'var(--ims-text-muted)' }}>Petty Cash & Overhead Heads</small>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <FileText size={24} />
          </div>
        </div>

        <div className="ims-kpi-card">
          <div className="ims-kpi-info">
            <h4>Registered Vendors</h4>
            <div className="ims-kpi-value">{vendors.length} Vendors</div>
            <small style={{ color: 'var(--ims-text-muted)' }}>Associated Suppliers & Contractors</small>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Store size={24} />
          </div>
        </div>
      </div>

      <div className="ims-card">
        {/* Card Header */}
        <div className="ims-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IndianRupee size={20} style={{ color: 'var(--ims-primary)' }} /> Expense Vouchers & Petty Cash Ledger
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--ims-text-muted)', marginTop: '2px' }}>
              Record outgoing overheads, maintenance, utility bills, and generate numbered payment vouchers.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="ims-btn ims-btn-secondary ims-btn-sm" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </button>
            <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={openAddExpenseModal}>
              <Plus size={14} /> Record Expense Voucher
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ims-border)' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Search Vouchers</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--ims-text-muted)' }} />
              <input
                type="text"
                className="ims-input"
                style={{ paddingLeft: '30px' }}
                placeholder="Voucher No, Title, Vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ width: '180px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Category</label>
            <select className="ims-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>From Date</label>
            <input type="date" className="ims-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div style={{ width: '150px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>To Date</label>
            <input type="date" className="ims-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          {(categoryFilter !== 'all' || searchQuery || dateFrom || dateTo) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="ims-btn ims-btn-secondary ims-btn-sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchQuery('');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading expense vouchers...</div>
        ) : (
          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Voucher No</th>
                  <th>Date</th>
                  <th>Title / Purpose</th>
                  <th>Vendor / Payee</th>
                  <th>Category</th>
                  <th>Payment Mode</th>
                  <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem' }}>
                      No expense vouchers found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: 800, color: 'var(--ims-primary)' }}>{exp.voucher_no}</td>
                      <td>{exp.expense_date}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{exp.title}</div>
                        {exp.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>{exp.description}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{exp.vendor_name || 'N/A'}</div>
                        {exp.gstin && (
                          <div style={{ fontSize: '0.72rem', color: '#059669' }}>GSTIN: {exp.gstin}</div>
                        )}
                      </td>
                      <td>
                        <span className="ims-badge ims-badge-secondary">{exp.category}</span>
                      </td>
                      <td>
                        <span style={{ textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ims-text-muted)' }}>
                          {exp.payment_mode}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                        ₹{parseFloat(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            className="ims-btn ims-btn-primary ims-btn-sm"
                            title="Print Expense Voucher"
                            onClick={() => setPrintVoucher(exp)}
                          >
                            <Printer size={14} />
                          </button>
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            title="Edit Voucher"
                            onClick={() => openEditExpenseModal(exp)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="ims-btn ims-btn-danger ims-btn-sm"
                            title="Delete Voucher"
                            onClick={() => handleDeleteExpense(exp)}
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

      {/* Add / Edit Expense Voucher Modal */}
      {showExpenseModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3>{editingExpense ? `Edit Voucher — ${editingExpense.voucher_no}` : 'Record Expense Voucher'}</h3>
            <form onSubmit={handleSaveExpense}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Expense Date *</label>
                  <input
                    type="date"
                    className="ims-input"
                    required
                    min={canBackdate ? undefined : todayStr}
                    max={todayStr}
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Expense Category *</label>
                  <select
                    className="ims-select"
                    required
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ims-form-group">
                <label>Voucher Title / Purpose *</label>
                <input
                  type="text"
                  className="ims-input"
                  required
                  placeholder="e.g. Office Stationery & Whiteboard Markers"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                />
              </div>

              <div className="ims-form-group">
                <label>Description (Optional)</label>
                <textarea
                  className="ims-input"
                  rows="2"
                  placeholder="Additional expense remarks or bill breakdown..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="ims-input"
                    required
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Payment Method *</label>
                  <select
                    className="ims-select"
                    required
                    value={expenseForm.payment_mode}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_mode: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                    <option value="card">Card</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Vendor / Supplier Name</label>
                  <input
                    type="text"
                    className="ims-input"
                    list="ims-vendor-list"
                    placeholder="e.g. Reliable Book Depot"
                    value={expenseForm.vendor_name}
                    onChange={(e) => {
                      const selName = e.target.value;
                      const matched = vendors.find(v => v.name.toLowerCase() === selName.toLowerCase());
                      setExpenseForm({
                        ...expenseForm,
                        vendor_name: selName,
                        gstin: matched?.gstin || expenseForm.gstin,
                      });
                    }}
                  />
                  <datalist id="ims-vendor-list">
                    {vendors.map((v) => (
                      <option key={v.id} value={v.name} />
                    ))}
                  </datalist>
                </div>
                <div className="ims-form-group">
                  <label>Vendor GSTIN (Optional)</label>
                  <input
                    type="text"
                    className="ims-input"
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    value={expenseForm.gstin}
                    onChange={(e) => setExpenseForm({ ...expenseForm, gstin: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ims-btn ims-btn-primary">
                  {editingExpense ? 'Update Voucher' : 'Save Expense Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Voucher Modal */}
      {printVoucher && (
        <ExpenseVoucherPrintModal
          voucher={printVoucher}
          settings={settings}
          onClose={() => setPrintVoucher(null)}
        />
      )}
    </div>
  );
};
