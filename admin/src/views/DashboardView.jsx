import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import {
  Users,
  GraduationCap,
  IndianRupee,
  Calendar,
  ArrowUpRight,
  Plus,
  AlertTriangle,
  Wallet,
  Building2,
  Globe,
  Phone,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export const DashboardView = () => {
  const { setCurrentView, user, settings } = useApp();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);
  const [activeOverdueTab, setActiveOverdueTab] = useState('critical'); // 'critical' | 'due'

  const caps = user?.capabilities || {};

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    setLoading(true);
    setPermissionDenied(false);
    setError(null);
    try {
      const res = await api.getDashboardKPIs();
      setKpis(res);
      // Default to critical if has critical students, otherwise due
      if (res?.critical_students?.length > 0) {
        setActiveOverdueTab('critical');
      } else if (res?.due_students?.length > 0) {
        setActiveOverdueTab('due');
      }
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load Dashboard KPIs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={loadKPIs} />;

  if (loading) {
    return <div className="ims-card">Loading Dashboard Overview & Analytics...</div>;
  }

  const criticalList = kpis?.critical_students || [];
  const dueList = kpis?.due_students || [];

  return (
    <div>
      {/* Institute Branding Banner */}
      <div
        className="ims-card"
        style={{
          marginBottom: '1.5rem',
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid var(--ims-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              background: '#eff6ff',
              border: '1px solid var(--ims-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings?.institute_name || 'Logo'}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Building2 size={32} style={{ color: 'var(--ims-primary)' }} />
            )}
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--ims-text-main)' }}>
              {settings?.institute_name || 'Institute Management System'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--ims-text-muted)', fontWeight: 500 }}>
              {settings?.tagline || 'Excellence in Education'}
            </div>
            {settings?.gstin && (
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '3px' }}>
                GSTIN: {settings.gstin}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--ims-text-muted)' }}>
          {settings?.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Phone size={14} style={{ color: 'var(--ims-primary)' }} />
              <span>{settings.phone}</span>
            </div>
          )}
          {settings?.website && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe size={14} style={{ color: 'var(--ims-primary)' }} />
              <a href={settings.website.startsWith('http') ? settings.website : `https://${settings.website}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                {settings.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {settings?.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} style={{ color: 'var(--ims-primary)' }} />
              <span>{settings.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="ims-grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="ims-kpi-card" style={{ cursor: caps.manage_students ? 'pointer' : 'default' }} onClick={() => caps.manage_students && setCurrentView('students')}>
          <div className="ims-kpi-info">
            <h4>Active Students</h4>
            <div className="ims-kpi-value">{kpis?.active_students || 0}</div>
            <small style={{ color: 'var(--ims-text-muted)', fontSize: '0.75rem' }}>Currently enrolled</small>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Users size={26} />
          </div>
        </div>

        <div className="ims-kpi-card" style={{ cursor: caps.manage_academic ? 'pointer' : 'default' }} onClick={() => caps.manage_academic && setCurrentView('academic')}>
          <div className="ims-kpi-info">
            <h4>Courses & Batches</h4>
            <div className="ims-kpi-value">{kpis?.active_courses || 0} / {kpis?.active_batches || 0}</div>
            <small style={{ color: 'var(--ims-text-muted)', fontSize: '0.75rem' }}>Active catalog</small>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <GraduationCap size={26} />
          </div>
        </div>

        <div className="ims-kpi-card" style={{ cursor: caps.view_attendance ? 'pointer' : 'default' }} onClick={() => caps.view_attendance && setCurrentView('attendance')}>
          <div className="ims-kpi-info">
            <h4>Today's Attendance</h4>
            <div className="ims-kpi-value">{(kpis?.today_attendance_pct !== undefined) ? `${kpis.today_attendance_pct}%` : '0%'}</div>
            <small style={{ color: 'var(--ims-text-muted)', fontSize: '0.75rem' }}>Student presence rate</small>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Calendar size={26} />
          </div>
        </div>

        <div className="ims-kpi-card" style={{ cursor: caps.manage_finances ? 'pointer' : 'default' }} onClick={() => caps.manage_finances && setCurrentView('expenses')}>
          <div className="ims-kpi-info">
            <h4>Monthly Expenses</h4>
            <div className="ims-kpi-value" style={{ color: '#dc2626' }}>{formatCurrency(kpis?.monthly_expenses)}</div>
            <small style={{ color: 'var(--ims-text-muted)', fontSize: '0.75rem' }}>Vouchers & Payroll</small>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <IndianRupee size={26} />
          </div>
        </div>
      </div>

      {/* Detailed Monthly Fee Collection & Recovery Widget */}
      {(caps.manage_finances || caps.view_reports || caps.manage_students) && (
        <div className="ims-card" style={{ marginBottom: '1.5rem', background: '#ffffff', border: '1px solid var(--ims-border)' }}>
          <div className="ims-card-header" style={{ borderBottom: '1px solid var(--ims-border)', paddingBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} style={{ color: '#059669' }} />
              <div>
                <h3 className="ims-card-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                  Monthly Fee Collection Breakdown & Recovery Target
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ims-text-muted)' }}>
                  Comprehensive overview of fee revenue collected in the current month across new and existing students.
                </div>
              </div>
            </div>
            <span className="ims-badge ims-badge-success" style={{ fontSize: '0.85rem', padding: '5px 12px' }}>
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {/* 1. Total Collected for Month */}
            <div style={{ background: '#f0fdf4', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Fee Collected
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
                {formatCurrency(kpis?.monthly_revenue)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.2rem' }}>
                Received this calendar month
              </div>
            </div>

            {/* 2. New Student Fee */}
            <div style={{ background: '#eff6ff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                New Student Fee
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.25rem' }}>
                {formatCurrency(kpis?.new_student_fee)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: '0.2rem' }}>
                From admissions this month
              </div>
            </div>

            {/* 3. Old Student Fee */}
            <div style={{ background: '#fdf4ff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #f5d0fe' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#86198f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Old Student Fee
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a21caf', marginTop: '0.25rem' }}>
                {formatCurrency(kpis?.old_student_fee)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#86198f', marginTop: '0.2rem' }}>
                From past student installments
              </div>
            </div>

            {/* 4. Remaining Uncollected Balance */}
            <div style={{ background: '#fffbeb', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Remaining Outstanding
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '0.25rem' }}>
                {formatCurrency(kpis?.student_balance)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.2rem' }}>
                Total active pending fees
              </div>
            </div>

            {/* 5. Total Expected Revenue */}
            <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Expected Revenue
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                {formatCurrency(kpis?.total_should_collect)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.2rem' }}>
                Target = Collected + Remaining
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Overdue & Installment Collection Tracking Workspace */}
      {(caps.manage_finances || caps.manage_students) && (
        <div className="ims-card" style={{ marginBottom: '1.5rem' }}>
          <div className="ims-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 className="ims-card-title" style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} style={{ color: 'var(--ims-primary)' }} /> Installment Collection & Overdue Management
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--ims-text-muted)', marginTop: '2px' }}>
                Students with unpaid installments due for the current month, and critical accounts overdue past 15 days.
              </div>
            </div>

            {/* Tabs for Critical vs Due */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`ims-btn ${activeOverdueTab === 'critical' ? 'ims-btn-danger' : 'ims-btn-secondary'} ims-btn-sm`}
                onClick={() => setActiveOverdueTab('critical')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ShieldAlert size={14} />
                Critical Overdue (&gt;15 Days) ({criticalList.length})
              </button>
              <button
                className={`ims-btn ${activeOverdueTab === 'due' ? 'ims-btn-primary' : 'ims-btn-secondary'} ims-btn-sm`}
                onClick={() => setActiveOverdueTab('due')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <AlertTriangle size={14} />
                Pending Installments (Due before 5th) ({dueList.length})
              </button>
            </div>
          </div>

          {/* Critical List View */}
          {activeOverdueTab === 'critical' && (
            <div>
              <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', borderLeft: '4px solid #dc2626', borderRadius: '4px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 600 }}>
                  <strong>Critical Overdue Notice:</strong> These students have unpaid installments that have passed the 15-day grace period. Immediate follow-up required.
                </div>
                <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.9rem' }}>
                  Total Critical Overdue: {formatCurrency(kpis?.critical_amount)}
                </div>
              </div>

              <div className="ims-table-wrapper">
                <table className="ims-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Phone</th>
                      <th>Course & Batch</th>
                      <th>Admission Date</th>
                      <th>Installment Due</th>
                      <th>Days Overdue</th>
                      <th style={{ textAlign: 'right' }}>Outstanding (₹)</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalList.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#059669', fontWeight: 600 }}>
                          <CheckCircle2 size={24} style={{ display: 'block', margin: '0 auto 0.5rem', color: '#10b981' }} />
                          Excellent! No student accounts are currently in the critical overdue list (&gt;15 days).
                        </td>
                      </tr>
                    ) : (
                      criticalList.map((s) => (
                        <tr key={s.id} style={{ background: '#fff5f5' }}>
                          <td style={{ fontWeight: 800, color: '#dc2626' }}>{s.roll_no}</td>
                          <td style={{ fontWeight: 700 }}>{s.name}</td>
                          <td>
                            {s.phone !== 'N/A' ? (
                              <a href={`tel:${s.phone}`} style={{ color: 'var(--ims-primary)', fontWeight: 600, textDecoration: 'none' }}>
                                {s.phone}
                              </a>
                            ) : 'N/A'}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{s.course_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>{s.batch_name}</div>
                          </td>
                          <td>{s.admission_date}</td>
                          <td style={{ fontWeight: 600, color: '#dc2626' }}>{s.due_date}</td>
                          <td>
                            <span className="ims-badge ims-badge-danger" style={{ fontWeight: 700 }}>
                              {s.days_overdue} Days Late
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '0.95rem' }}>
                            ₹{s.due_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="ims-btn ims-btn-primary ims-btn-sm"
                              onClick={() => setCurrentView('finances')}
                              title="Collect Fee Receipt"
                            >
                              Collect Fee
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Due List View */}
          {activeOverdueTab === 'due' && (
            <div>
              <div style={{ padding: '0.75rem 1rem', background: '#fffbeb', borderLeft: '4px solid #d97706', borderRadius: '4px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                  <strong>Pending Installments (Due on/before 5th of Month):</strong> Installment schedule active for the current month.
                </div>
                <div style={{ fontWeight: 800, color: '#d97706', fontSize: '0.9rem' }}>
                  Total Pending: {formatCurrency(kpis?.due_amount)}
                </div>
              </div>

              <div className="ims-table-wrapper">
                <table className="ims-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Phone</th>
                      <th>Course & Batch</th>
                      <th>Admission Date</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: 'right' }}>Net Fee (₹)</th>
                      <th style={{ textAlign: 'right' }}>Paid (₹)</th>
                      <th style={{ textAlign: 'right' }}>Due Amount (₹)</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dueList.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--ims-text-muted)' }}>
                          No pending installments due for this month.
                        </td>
                      </tr>
                    ) : (
                      dueList.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{s.roll_no}</td>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td>
                            {s.phone !== 'N/A' ? (
                              <a href={`tel:${s.phone}`} style={{ color: 'var(--ims-primary)', textDecoration: 'none' }}>
                                {s.phone}
                              </a>
                            ) : 'N/A'}
                          </td>
                          <td>
                            <div>{s.course_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>{s.batch_name}</div>
                          </td>
                          <td>{s.admission_date}</td>
                          <td style={{ fontWeight: 600, color: '#d97706' }}>{s.due_date}</td>
                          <td style={{ textAlign: 'right' }}>₹{s.net_fee.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>₹{s.total_paid.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#d97706' }}>
                            ₹{s.due_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="ims-btn ims-btn-primary ims-btn-sm"
                              onClick={() => setCurrentView('finances')}
                              title="Collect Fee"
                            >
                              Collect Fee
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="ims-card">
        <div className="ims-card-header">
          <h3 className="ims-card-title">Quick Administration Actions</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {caps.manage_students && (
            <button className="ims-btn ims-btn-primary" onClick={() => setCurrentView('students')}>
              <Plus size={16} /> New Student Admission
            </button>
          )}
          {caps.manage_finances && (
            <button className="ims-btn ims-btn-secondary" onClick={() => setCurrentView('finances')}>
              <IndianRupee size={16} /> Collect Fee Receipt
            </button>
          )}
          {caps.manage_finances && (
            <button className="ims-btn ims-btn-secondary" onClick={() => setCurrentView('expenses')}>
              <IndianRupee size={16} /> Record Expense Voucher
            </button>
          )}
          {(caps.view_attendance || caps.mark_attendance) && (
            <button className="ims-btn ims-btn-secondary" onClick={() => setCurrentView('attendance')}>
              <Calendar size={16} /> Mark Attendance
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
