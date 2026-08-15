import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { PhotoUpload } from '../components/PhotoUpload';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import { StaffProfileView } from './StaffProfileView';
import { Plus, UserCheck, Award, CheckCircle, Pencil, Trash2, Printer, Lock, Calendar, FileText, IndianRupee, Eye } from 'lucide-react';

export const PayrollView = () => {
  const { showToast, settings, user } = useApp();
  const [activeTab, setActiveTab] = useState('runs'); // 'runs', 'staff'
  const [staff, setStaff] = useState([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStaffProfileId, setSelectedStaffProfileId] = useState(null);

  const canViewSensitive = user?.capabilities?.view_staff_sensitive || user?.roles?.includes('administrator');

  // Monthly Payroll Runs State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [runsData, setRunsData] = useState(null);
  const [runsLoading, setRunsLoading] = useState(false);

  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedRunForAdjustment, setSelectedRunForAdjustment] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState({ manual_adjustment: 0, adjustment_reason: '' });

  const [printPayslipDoc, setPrintPayslipDoc] = useState(null);

  // Staff Form State
  const [staffForm, setStaffForm] = useState({
    first_name: '',
    last_name: '',
    role_key: 'ims_teacher',
    phone: '',
    email: '',
    address: '',
    designation: 'Senior Faculty',
    base_salary: 35000,
    photo_url: '',
    status: 'active',
    bank_details: {
      account_holder_name: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      branch: '',
      upi_id: '',
    }
  });

  useEffect(() => {
    if (activeTab === 'staff') {
      loadStaffData();
    } else {
      loadPayrollRuns();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  const loadStaffData = async () => {
    setPermissionDenied(false);
    setError(null);
    try {
      const res = await api.getStaff();
      setStaff(res || []);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load staff directory.');
      }
    }
  };

  const loadPayrollRuns = async () => {
    setRunsLoading(true);
    setPermissionDenied(false);
    setError(null);
    try {
      const res = await api.getPayrollRuns(selectedMonth, selectedYear);
      setRunsData(res);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load monthly payroll runs.');
      }
    } finally {
      setRunsLoading(false);
    }
  };

  const openAddStaffModal = () => {
    setEditingStaff(null);
    setStaffForm({
      first_name: '', last_name: '', role_key: 'ims_teacher',
      phone: '', email: '', address: '', joining_date: '', designation: 'Senior Faculty', base_salary: 35000, photo_url: '', status: 'active',
      bank_details: {
        account_holder_name: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch: '',
        upi_id: '',
      }
    });
    setShowStaffModal(true);
  };

  const openEditStaffModal = async (s) => {
    setEditingStaff(s);
    let bankData = {
      account_holder_name: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      branch: '',
      upi_id: '',
    };
    if (canViewSensitive) {
      try {
        const bRes = await api.revealStaffBankDetails(s.id);
        if (bRes) {
          bankData = {
            account_holder_name: bRes.account_holder_name || '',
            bank_name: bRes.bank_name || '',
            account_number: bRes.account_number || '',
            ifsc_code: bRes.ifsc_code || '',
            branch: bRes.branch || '',
            upi_id: bRes.upi_id || '',
          };
        }
      } catch (e) {
        console.error(e);
      }
    }
    setStaffForm({
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      role_key: s.role_key || 'ims_teacher',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      joining_date: s.joining_date || '',
      designation: s.designation || '',
      base_salary: s.base_salary || 0,
      photo_url: s.photo_url || '',
      status: s.status || 'active',
      bank_details: bankData,
    });
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.updateStaff(editingStaff.id, staffForm);
        showToast('Staff member updated!');
      } else {
        const res = await api.createStaff(staffForm);
        showToast(`Staff member added! Code: ${res.staff_code}`);
      }
      setShowStaffModal(false);
      loadStaffData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteStaff = async (s) => {
    if (!window.confirm(`Are you sure you want to delete staff member "${s.first_name} ${s.last_name}"?`)) {
      return;
    }
    try {
      await api.deleteStaff(s.id);
      showToast('Staff record deleted.');
      loadStaffData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const openAdjustmentModal = (run) => {
    setSelectedRunForAdjustment(run);
    setAdjustmentForm({
      manual_adjustment: run.manual_adjustment || 0,
      adjustment_reason: run.adjustment_reason || '',
    });
    setShowAdjustmentModal(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (adjustmentForm.manual_adjustment != 0 && !adjustmentForm.adjustment_reason.trim()) {
      showToast('An adjustment reason is required when entering a non-zero manual adjustment.', 'danger');
      return;
    }

    try {
      await api.saveRunAdjustment({
        staff_id: selectedRunForAdjustment.staff_id,
        month: selectedMonth,
        year: selectedYear,
        manual_adjustment: parseFloat(adjustmentForm.manual_adjustment) || 0,
        adjustment_reason: adjustmentForm.adjustment_reason.trim(),
      });
      showToast('Adjustment saved successfully!');
      setShowAdjustmentModal(false);
      loadPayrollRuns();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleFinalizeMonth = async () => {
    if (!window.confirm(`Are you sure you want to finalize payroll for ${monthsList[selectedMonth - 1]} ${selectedYear}? Once finalized, values are locked.`)) {
      return;
    }

    try {
      const res = await api.finalizePayrollMonth(selectedMonth, selectedYear);
      showToast(res.message);
      loadPayrollRuns();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const openPrintPayslip = (run) => {
    setPrintPayslipDoc(run);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);
  };

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={() => activeTab === 'staff' ? loadStaffData() : loadPayrollRuns()} />;

  if (selectedStaffProfileId) {
    return <StaffProfileView staffId={selectedStaffProfileId} onBack={() => setSelectedStaffProfileId(null)} />;
  }

  const runsList = runsData?.runs || [];
  const totalContract = runsList.reduce((acc, r) => acc + (r.base_salary || 0), 0);
  const totalWeightedDays = runsList.reduce((acc, r) => acc + (r.weighted_present_days || 0), 0);
  const totalNetPayable = runsList.reduce((acc, r) => acc + (r.net_payable || 0), 0);

  return (
    <div>
      <div className="ims-card">
        <div className="ims-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className={`ims-btn ${activeTab === 'runs' ? 'ims-btn-primary' : 'ims-btn-secondary'}`} onClick={() => setActiveTab('runs')}>
              <Award size={16} /> Automated Payroll Runs
            </button>
            <button className={`ims-btn ${activeTab === 'staff' ? 'ims-btn-primary' : 'ims-btn-secondary'}`} onClick={() => setActiveTab('staff')}>
              <UserCheck size={16} /> Staff Directory
            </button>
          </div>

          <div>
            {activeTab === 'staff' ? (
              <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={openAddStaffModal}>
                <Plus size={14} /> Add Staff Member
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select className="ims-select" style={{ width: '130px' }} value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                  {monthsList.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select className="ims-select" style={{ width: '100px' }} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                {!runsData?.is_finalized && (
                  <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={handleFinalizeMonth}>
                    <Lock size={14} /> Finalize Month
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'runs' ? (
          <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ims-border)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Contract Salary</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ims-text-main)' }}>{formatCurrency(totalContract)}</div>
                <small style={{ color: 'var(--ims-text-muted)' }}>{runsList.length} Staff Members</small>
              </div>

              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.78rem', color: '#15803d', textTransform: 'uppercase', fontWeight: 600 }}>Total Weighted Present Days</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#166534' }}>{totalWeightedDays.toFixed(1)} Days</div>
                <small style={{ color: '#15803d' }}>Basis: {runsData?.working_days_basis || 26} days/month</small>
              </div>

              <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '0.78rem', color: '#1d4ed8', textTransform: 'uppercase', fontWeight: 600 }}>Total Net Payroll Expense</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e40af' }}>{formatCurrency(totalNetPayable)}</div>
                <small style={{ color: '#1d4ed8' }}>Status: {runsData?.is_finalized ? 'Finalized' : 'Draft Calculations'}</small>
              </div>
            </div>

            {runsLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Calculating monthly payroll runs...</div>
            ) : (
              <div className="ims-table-wrapper">
                <table className="ims-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Contract Salary</th>
                      <th>Basis & Rate</th>
                      <th>Attendance & Weighted Days</th>
                      <th>Calculated</th>
                      <th>Adjustment & Reason</th>
                      <th>Net Payable</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runsList.length === 0 ? (
                      <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No active staff members found.</td></tr>
                    ) : (
                      runsList.map((r) => {
                        const att = r.attendance_breakdown || {};
                        return (
                          <tr key={r.staff_id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.staff_name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}>{r.staff_code} | {r.designation}</div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(r.base_salary)}</td>
                            <td>
                              <div>{formatCurrency(r.per_day_rate)} / day</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>Basis: {r.working_days_basis} days</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#166534' }}>{r.weighted_present_days.toFixed(1)} Days</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>
                                P:{att.present || 0} | HD:{att.half_day || 0} | L:{att.leave || 0} | A:{att.absent || 0}
                              </div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(r.calculated_amount)}</td>
                            <td>
                              {r.manual_adjustment !== 0 ? (
                                <span style={{ fontWeight: 600, color: r.manual_adjustment > 0 ? '#16a34a' : '#dc2626' }}>
                                  {r.manual_adjustment > 0 ? '+' : ''}{formatCurrency(r.manual_adjustment)}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--ims-text-muted)' }}>₹0</span>
                              )}
                              {r.adjustment_reason && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', fontStyle: 'italic' }}>
                                  "{r.adjustment_reason}"
                                </div>
                              )}
                            </td>
                            <td style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ims-primary)' }}>
                              {formatCurrency(r.net_payable)}
                            </td>
                            <td>
                              <span className={`ims-badge ims-badge-${r.status === 'finalized' ? 'success' : 'secondary'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                                {r.status !== 'finalized' && (
                                  <button
                                    className="ims-btn ims-btn-secondary ims-btn-sm"
                                    title="Edit Manual Adjustment"
                                    onClick={() => openAdjustmentModal(r)}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                                <button
                                  className="ims-btn ims-btn-secondary ims-btn-sm"
                                  title="Print Payslip"
                                  onClick={() => openPrintPayslip(r)}
                                >
                                  <Printer size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Staff Member</th>
                  <th>Designation & Role</th>
                  <th>Contact</th>
                  <th>Contract Salary (₹)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No staff members added.</td></tr>
                ) : (
                  staff.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{s.staff_code}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {s.photo_url ? (
                            <img src={s.photo_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div className="ims-avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                              {s.first_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{s.designation}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', textTransform: 'capitalize' }}>{s.role_key.replace('ims_', '')}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{s.phone || 'N/A'}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatCurrency(s.base_salary)}
                      </td>
                      <td>
                        <span className={`ims-badge ims-badge-${s.status === 'active' ? 'success' : 'danger'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            title="View Full Profile"
                            onClick={() => setSelectedStaffProfileId(s.id)}
                          >
                            <Eye size={14} /> Profile
                          </button>
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            title="Edit Staff"
                            onClick={() => openEditStaffModal(s)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="ims-btn ims-btn-danger ims-btn-sm"
                            title="Delete Staff"
                            onClick={() => handleDeleteStaff(s)}
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

      {/* Manual Adjustment Modal */}
      {showAdjustmentModal && selectedRunForAdjustment && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3>Manual Adjustment — {selectedRunForAdjustment.staff_name}</h3>
            <p style={{ color: 'var(--ims-text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
              Base Calculated Amount: <strong>{formatCurrency(selectedRunForAdjustment.calculated_amount)}</strong>
            </p>
            <form onSubmit={handleSaveAdjustment}>
              <div className="ims-form-group">
                <label>Manual Adjustment Amount (₹) (+Bonus / -Deduction)</label>
                <input
                  type="number"
                  step="0.01"
                  className="ims-input"
                  value={adjustmentForm.manual_adjustment}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, manual_adjustment: e.target.value })}
                />
              </div>

              <div className="ims-form-group">
                <label>Adjustment Reason {parseFloat(adjustmentForm.manual_adjustment) !== 0 && '*'}</label>
                <textarea
                  className="ims-input"
                  rows="3"
                  placeholder="Reason for adjustment (e.g. Festival Bonus, Advance Deduction, Late penalty...)"
                  value={adjustmentForm.adjustment_reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustment_reason: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowAdjustmentModal(false)}>Cancel</button>
                <button type="submit" className="ims-btn ims-btn-primary">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {showStaffModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3>{editingStaff ? `Edit Staff Member — ${editingStaff.staff_code}` : 'Add Staff Member'}</h3>
            <form onSubmit={handleSaveStaff}>
              <PhotoUpload
                value={staffForm.photo_url}
                onChange={(url) => setStaffForm({ ...staffForm, photo_url: url })}
                label="Staff Photo"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>First Name *</label>
                  <input type="text" className="ims-input" required value={staffForm.first_name} onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })} />
                </div>
                <div className="ims-form-group">
                  <label>Last Name *</label>
                  <input type="text" className="ims-input" required value={staffForm.last_name} onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Designation</label>
                  <input type="text" className="ims-input" value={staffForm.designation} onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })} />
                </div>
                <div className="ims-form-group">
                  <label>Plugin Role</label>
                  <select className="ims-select" value={staffForm.role_key} onChange={(e) => setStaffForm({ ...staffForm, role_key: e.target.value })}>
                    <option value="ims_teacher">Teacher / Faculty</option>
                    <option value="ims_front_desk">Front Desk</option>
                    <option value="ims_accountant">Accountant</option>
                    <option value="ims_admin">Admin / Manager</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Base Contract Salary (₹)</label>
                  <input type="number" className="ims-input" value={staffForm.base_salary} onChange={(e) => setStaffForm({ ...staffForm, base_salary: e.target.value })} />
                </div>
                <div className="ims-form-group">
                  <label>Phone Number</label>
                  <input type="text" className="ims-input" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Email Address</label>
                  <input type="email" className="ims-input" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
                </div>
                <div className="ims-form-group">
                  <label>Status</label>
                  <select className="ims-select" value={staffForm.status} onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Joining Date</label>
                  {/* Excluded from back-date restriction: Staff joining date can be a past date for historical hires */}
                  <input
                    type="date"
                    className="ims-input"
                    value={staffForm.joining_date || ''}
                    onChange={(e) => setStaffForm({ ...staffForm, joining_date: e.target.value })}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Address</label>
                  <input className="ims-input" placeholder="Residential Address..." value={staffForm.address} onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })} />
                </div>
              </div>

              {/* Bank Account & Payout Details */}
              {canViewSensitive && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ims-border)', marginTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--ims-border)', paddingBottom: '0.5rem' }}>
                    <Lock size={16} style={{ color: 'var(--ims-primary)' }} />
                    <h4 style={{ margin: 0, color: 'var(--ims-primary)', fontSize: '0.95rem' }}>Bank Account & Payout Details</h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="ims-form-group">
                      <label style={{ fontSize: '0.8rem' }}>Account Holder Name</label>
                      <input
                        type="text"
                        className="ims-input"
                        placeholder="Name as per bank record"
                        value={staffForm.bank_details?.account_holder_name || ''}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          bank_details: { ...staffForm.bank_details, account_holder_name: e.target.value }
                        })}
                      />
                    </div>
                    <div className="ims-form-group">
                      <label style={{ fontSize: '0.8rem' }}>Bank Name</label>
                      <input
                        type="text"
                        className="ims-input"
                        placeholder="e.g. HDFC Bank, SBI, ICICI"
                        value={staffForm.bank_details?.bank_name || ''}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          bank_details: { ...staffForm.bank_details, bank_name: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="ims-form-group">
                      <label style={{ fontSize: '0.8rem' }}>Account Number</label>
                      <input
                        type="text"
                        className="ims-input"
                        placeholder="Bank Account Number"
                        value={staffForm.bank_details?.account_number || ''}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          bank_details: { ...staffForm.bank_details, account_number: e.target.value }
                        })}
                      />
                    </div>
                    <div className="ims-form-group">
                      <label style={{ fontSize: '0.8rem' }}>IFSC Code</label>
                      <input
                        type="text"
                        className="ims-input"
                        placeholder="e.g. HDFC0001234"
                        value={staffForm.bank_details?.ifsc_code || ''}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          bank_details: { ...staffForm.bank_details, ifsc_code: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="ims-form-group">
                      <label style={{ fontSize: '0.8rem' }}>Branch Name</label>
                      <input
                        type="text"
                        className="ims-input"
                        placeholder="Branch city / area"
                        value={staffForm.bank_details?.branch || ''}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          bank_details: { ...staffForm.bank_details, branch: e.target.value }
                        })}
                      />
                    </div>
                    <div className="ims-form-group">
                      <label style={{ fontSize: '0.8rem' }}>UPI ID (Optional)</label>
                      <input
                        type="text"
                        className="ims-input"
                        placeholder="e.g. staffname@upi"
                        value={staffForm.bank_details?.upi_id || ''}
                        onChange={(e) => setStaffForm({
                          ...staffForm,
                          bank_details: { ...staffForm.bank_details, upi_id: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowStaffModal(false)}>Cancel</button>
                <button type="submit" className="ims-btn ims-btn-primary">{editingStaff ? 'Save Changes' : 'Add Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Payslip Modal */}
      {printPayslipDoc && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content" style={{ maxWidth: '650px', background: '#ffffff', color: '#0f172a', padding: '2rem' }}>
            <div id="ims-printable-payslip">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{settings?.institute_name || 'My Institute of Technology'}</h2>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>{settings?.address || '123 Academic Row, Education Hub'}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem', color: '#1e40af', textTransform: 'uppercase' }}>
                  Staff Monthly Payslip — {monthsList[selectedMonth - 1]} {selectedYear}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <div>
                  <div><strong>Staff Name:</strong> {printPayslipDoc.staff_name}</div>
                  <div><strong>Staff Code:</strong> {printPayslipDoc.staff_code}</div>
                  <div><strong>Designation:</strong> {printPayslipDoc.designation}</div>
                </div>
                <div>
                  <div><strong>Contract Salary:</strong> {formatCurrency(printPayslipDoc.base_salary)}</div>
                  <div><strong>Working Days Basis:</strong> {printPayslipDoc.working_days_basis} Days</div>
                  <div><strong>Per Day Rate:</strong> {formatCurrency(printPayslipDoc.per_day_rate)}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Attendance & Payment Calculation</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Description</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Value / Days</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px' }}>Weighted Present Days (P, HD, L, A)</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{printPayslipDoc.weighted_present_days.toFixed(1)} Days</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(printPayslipDoc.calculated_amount)}</td>
                  </tr>
                  {printPayslipDoc.manual_adjustment !== 0 && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>
                        Adjustment ({printPayslipDoc.adjustment_reason || 'Manual'})
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: printPayslipDoc.manual_adjustment > 0 ? '#16a34a' : '#dc2626' }}>
                        {printPayslipDoc.manual_adjustment > 0 ? '+' : ''}{formatCurrency(printPayslipDoc.manual_adjustment)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid #0f172a', fontWeight: 800, fontSize: '1rem' }}>
                    <td style={{ padding: '10px 8px' }}>Net Payable Salary</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>-</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1e40af' }}>{formatCurrency(printPayslipDoc.net_payable)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1', fontSize: '0.8rem', color: '#64748b' }}>
                <div>Employee Signature</div>
                <div>Authorized Signatory</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="ims-btn ims-btn-secondary" onClick={() => setPrintPayslipDoc(null)}>Close</button>
              <button className="ims-btn ims-btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
