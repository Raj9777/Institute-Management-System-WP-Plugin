import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { User, Phone, Mail, MapPin, Building2, Calendar, Award, Lock, Printer, ArrowLeft, CheckCircle } from 'lucide-react';

export const StaffProfileView = ({ staffId, onBack }) => {
  const { showToast, user } = useApp();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printPayslipDoc, setPrintPayslipDoc] = useState(null);

  const canViewSensitive = user?.capabilities?.view_staff_sensitive || user?.roles?.includes('administrator');

  useEffect(() => {
    if (staffId) {
      loadProfileData();
    }
  }, [staffId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const res = await api.getStaffFullProfile(staffId);
      setProfile(res);
    } catch (err) {
      showToast(err.message || 'Failed to load staff profile.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);
  };

  const [revealedBankDetails, setRevealedBankDetails] = useState(null);
  const [revealing, setRevealing] = useState(false);

  const handleRevealBankDetails = async () => {
    setRevealing(true);
    try {
      const res = await api.revealStaffBankDetails(staffId);
      setRevealedBankDetails(res);
      showToast('Unmasked bank details revealed. Action logged in Audit Trail.');
    } catch (err) {
      showToast(err.message || 'Failed to reveal bank details.', 'danger');
    } finally {
      setRevealing(false);
    }
  };

  if (loading) {
    return <div className="ims-card" style={{ padding: '3rem', textAlign: 'center' }}>Loading full staff profile...</div>;
  }

  if (!profile || !profile.staff) {
    return <div className="ims-card" style={{ padding: '3rem', textAlign: 'center' }}>Staff profile not found.</div>;
  }

  const staff = profile.staff;
  const bank = revealedBankDetails || staff.bank_details;
  const attendance = profile.attendance || [];
  const payrollRuns = profile.payroll_runs || [];

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div>
      {/* Top Bar */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="ims-btn ims-btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Staff Directory
        </button>

        <button className="ims-btn ims-btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Print Profile Record
        </button>
      </div>

      {/* Main Scrollable Staff Profile View */}
      <div className="ims-card" style={{ padding: '2rem' }}>
        {/* Header Profile Info */}
        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid var(--ims-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            {staff.photo_url ? (
              <img src={staff.photo_url} alt="" style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--ims-primary)' }} />
            ) : (
              <div className="ims-avatar" style={{ width: '100px', height: '100px', fontSize: '2.5rem', borderRadius: '12px' }}>
                {staff.first_name?.charAt(0)}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
                  {staff.first_name} {staff.last_name}
                </h1>
                <div style={{ fontSize: '0.95rem', color: 'var(--ims-primary)', fontWeight: 700, marginTop: '0.2rem' }}>
                  Staff Code: {staff.staff_code} | Designation: {staff.designation}
                </div>
              </div>

              <span className={`ims-badge ims-badge-${staff.status === 'active' ? 'success' : 'danger'}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                Status: {staff.status?.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem', fontSize: '0.88rem' }}>
              <div><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} /> Phone: {staff.phone || 'N/A'}</div>
              <div><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} /> Email: {staff.email || 'N/A'}</div>
              <div><User size={14} style={{ display: 'inline', marginRight: '4px' }} /> Role: {staff.role_key?.replace('ims_', '')}</div>
              <div><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> Address: {staff.address || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Sensitive Staff Bank Details (Hard-Gated by Capability) */}
        {canViewSensitive ? (
          <div style={{ marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} style={{ color: '#1e40af' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e40af' }}>Bank & Sensitive Financial Details</h3>
              </div>

              {bank && bank.is_masked && (
                <button
                  className="ims-btn ims-btn-secondary ims-btn-sm"
                  style={{ color: '#1e40af', borderColor: '#bfdbfe' }}
                  onClick={handleRevealBankDetails}
                  disabled={revealing}
                >
                  {revealing ? 'Revealing...' : 'Reveal Full Account Details (Audited)'}
                </button>
              )}
            </div>

            {!bank || (!bank.account_number && !bank.bank_name) ? (
              <div style={{ color: 'var(--ims-text-muted)', fontSize: '0.88rem' }}>No bank account details registered for this staff member.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Account Holder</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{bank.account_holder_name || `${staff.first_name} ${staff.last_name}`}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bank Name & Branch</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{bank.bank_name || 'N/A'} {bank.branch ? `(${bank.branch})` : ''}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Account Number {bank.is_masked ? '(Masked)' : '(Unmasked)'}</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem', fontFamily: 'monospace', fontSize: '1.05rem', color: bank.is_masked ? '#64748b' : '#166534' }}>
                    {bank.account_number || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>IFSC Code / UPI ID</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem', fontFamily: 'monospace' }}>
                    {bank.ifsc_code || 'N/A'} | UPI: {bank.upi_id || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Section 2: Attendance Roster History */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ borderBottom: '2px solid var(--ims-primary)', paddingBottom: '0.5rem', display: 'inline-block', marginBottom: '1rem' }}>
            <Calendar size={18} style={{ display: 'inline', marginRight: '6px' }} /> Attendance History (Recent Activity)
          </h3>

          <div className="ims-table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan="2" style={{ textAlign: 'center', padding: '1.5rem' }}>No attendance records logged.</td></tr>
                ) : (
                  attendance.map((att, idx) => (
                    <tr key={idx}>
                      <td>{att.date}</td>
                      <td>
                        <span className={`ims-badge ims-badge-${att.status === 'present' ? 'success' : att.status === 'absent' ? 'danger' : 'warning'}`}>
                          {att.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Payroll Runs & Payslip History */}
        <div>
          <h3 style={{ borderBottom: '2px solid var(--ims-primary)', paddingBottom: '0.5rem', display: 'inline-block', marginBottom: '1rem' }}>
            <Award size={18} style={{ display: 'inline', marginRight: '6px' }} /> Payroll Runs & Payslip History
          </h3>

          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Month & Year</th>
                  <th>Working Days Basis</th>
                  <th>Per Day Rate (₹)</th>
                  <th>Weighted Days</th>
                  <th>Calculated Amount</th>
                  <th>Net Payable (₹)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payrollRuns.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '1.5rem' }}>No monthly payroll runs generated yet.</td></tr>
                ) : (
                  payrollRuns.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>{monthsList[r.month - 1]} {r.year}</td>
                      <td>{r.working_days_basis} Days</td>
                      <td>{formatCurrency(r.per_day_rate)}</td>
                      <td style={{ fontWeight: 700, color: '#166534' }}>{r.weighted_present_days.toFixed(1)} Days</td>
                      <td>{formatCurrency(r.calculated_amount)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--ims-primary)', fontSize: '1.05rem' }}>{formatCurrency(r.net_payable)}</td>
                      <td>
                        <span className={`ims-badge ims-badge-${r.status === 'finalized' ? 'success' : 'secondary'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="ims-btn ims-btn-secondary ims-btn-sm"
                          onClick={() => setPrintPayslipDoc(r)}
                        >
                          <Printer size={14} /> Print Payslip
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Payslip Modal */}
      {printPayslipDoc && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content" style={{ maxWidth: '650px', background: '#ffffff', color: '#0f172a', padding: '2rem' }}>
            <div id="ims-printable-payslip">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Staff Monthly Payslip</h2>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem', color: '#1e40af', textTransform: 'uppercase' }}>
                  {monthsList[printPayslipDoc.month - 1]} {printPayslipDoc.year}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <div>
                  <div><strong>Staff Name:</strong> {staff.first_name} {staff.last_name}</div>
                  <div><strong>Staff Code:</strong> {staff.staff_code}</div>
                  <div><strong>Designation:</strong> {staff.designation}</div>
                </div>
                <div>
                  <div><strong>Contract Salary:</strong> {formatCurrency(staff.base_salary)}</div>
                  <div><strong>Working Days Basis:</strong> {printPayslipDoc.working_days_basis} Days</div>
                  <div><strong>Per Day Rate:</strong> {formatCurrency(printPayslipDoc.per_day_rate)}</div>
                </div>
              </div>

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
                    <td style={{ padding: '8px' }}>Weighted Present Days</td>
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
