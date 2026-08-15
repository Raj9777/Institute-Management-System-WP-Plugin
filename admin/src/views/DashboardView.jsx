import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import { Users, GraduationCap, IndianRupee, Calendar, ArrowUpRight, Plus, AlertTriangle, Wallet } from 'lucide-react';

export const DashboardView = () => {
  const { setCurrentView, showToast, user } = useApp();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);

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
    return <div className="ims-card">Loading Dashboard Overview...</div>;
  }

  return (
    <div>
      {/* KPI Cards */}
      <div className="ims-grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="ims-kpi-card">
          <div className="ims-kpi-info">
            <h4>Active Students</h4>
            <div className="ims-kpi-value">{kpis?.active_students || 0}</div>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Users size={26} />
          </div>
        </div>

        <div className="ims-kpi-card">
          <div className="ims-kpi-info">
            <h4>Courses & Batches</h4>
            <div className="ims-kpi-value">{kpis?.active_courses || 0} / {kpis?.active_batches || 0}</div>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <GraduationCap size={26} />
          </div>
        </div>

        <div className="ims-kpi-card">
          <div className="ims-kpi-info">
            <h4>Monthly Revenue</h4>
            <div className="ims-kpi-value">{formatCurrency(kpis?.monthly_revenue)}</div>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
            <IndianRupee size={26} />
          </div>
        </div>

        <div className="ims-kpi-card">
          <div className="ims-kpi-info">
            <h4>Today's Attendance</h4>
            <div className="ims-kpi-value">{kpis?.today_attendance_pct || 0}%</div>
          </div>
          <div className="ims-kpi-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Calendar size={26} />
          </div>
        </div>
      </div>

      {/* Financial Health & Overdue Widgets */}
      <div className="ims-grid-2" style={{ marginBottom: '1.5rem' }}>
        {caps.manage_students && (
          <div className="ims-kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('students')}>
            <div className="ims-kpi-info">
              <h4 style={{ color: 'var(--ims-primary)' }}>Student Outstanding Balance</h4>
              <div className="ims-kpi-value" style={{ color: 'var(--ims-primary)' }}>
                {formatCurrency(kpis?.student_balance)}
              </div>
              <small style={{ color: 'var(--ims-text-muted)', fontSize: '0.78rem' }}>
                Sum of Net Fees minus payments across all active students
              </small>
            </div>
            <div className="ims-kpi-icon-wrapper" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <Wallet size={26} />
            </div>
          </div>
        )}

        {caps.manage_finances && (
          <div className="ims-kpi-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('finances')}>
            <div className="ims-kpi-info">
              <h4 style={{ color: '#dc2626' }}>Overdue Fees (&gt;15 Days)</h4>
              <div className="ims-kpi-value" style={{ color: '#dc2626' }}>
                {formatCurrency(kpis?.overdue_amount)}
              </div>
              <small style={{ color: '#991b1b', fontSize: '0.78rem' }}>
                {kpis?.overdue_count || 0} active students past 15-day grace period
              </small>
            </div>
            <div className="ims-kpi-icon-wrapper" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <AlertTriangle size={26} />
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions & Recent Summary */}
      <div className="ims-grid-2">
        <div className="ims-card">
          <div className="ims-card-header">
            <h3 className="ims-card-title">Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {caps.manage_students && (
              <button className="ims-btn ims-btn-primary" onClick={() => setCurrentView('students')}>
                <Plus size={16} /> Student Admission
              </button>
            )}
            {caps.manage_finances && (
              <button className="ims-btn ims-btn-secondary" onClick={() => setCurrentView('finances')}>
                <IndianRupee size={16} /> Collect Fee Receipt
              </button>
            )}
            {(caps.view_attendance || caps.mark_attendance) && (
              <button className="ims-btn ims-btn-secondary" onClick={() => setCurrentView('attendance')}>
                <Calendar size={16} /> Mark Attendance
              </button>
            )}
          </div>
        </div>

        {caps.manage_finances && (
          <div className="ims-card">
            <div className="ims-card-header">
              <h3 className="ims-card-title">Monthly Expenditure</h3>
              <span className="ims-badge ims-badge-danger">{formatCurrency(kpis?.monthly_expenses)}</span>
            </div>
            <p style={{ color: 'var(--ims-text-muted)', fontSize: '0.9rem' }}>
              Recorded expense vouchers and payroll disbursements for the current month.
            </p>
            <button className="ims-btn ims-btn-secondary ims-btn-sm" onClick={() => setCurrentView('finances')}>
              View Expenses Ledger <ArrowUpRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
