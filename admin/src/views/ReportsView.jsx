import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  Briefcase,
  GraduationCap,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit3,
  X,
  Users,
  CreditCard,
  FileSpreadsheet,
  Home,
  UserCheck
} from 'lucide-react';

export const ReportsView = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'monthwise' | 'exports'
  const [loading, setLoading] = useState(false);

  // Monthwise Report States
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [monthwiseData, setMonthwiseData] = useState(null);

  // Student Details Report States
  const [studentsData, setStudentsData] = useState({ records: [], summary: {} });
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    position_status: 'all',
    course_id: '',
    batch_id: '',
    year: ''
  });

  // Position Edit Modal State
  const [selectedStudentForPosition, setSelectedStudentForPosition] = useState(null);
  const [positionForm, setPositionForm] = useState({
    current_position_status: 'Employed',
    current_company_or_institution: '',
    current_designation: '',
    passed_out_year: '',
    current_position: '',
    status: 'completed'
  });
  const [savingPosition, setSavingPosition] = useState(false);

  // Data Export States
  const [exportingType, setExportingType] = useState(null);

  useEffect(() => {
    loadAcademicFilters();
  }, []);

  useEffect(() => {
    if (activeTab === 'students') {
      loadStudentsReport();
    } else if (activeTab === 'monthwise') {
      loadMonthwiseReport(selectedYear);
    }
  }, [activeTab, selectedYear, filters]);

  const loadAcademicFilters = async () => {
    try {
      const [crs, bts] = await Promise.all([
        api.getCourses().catch(() => []),
        api.getBatches().catch(() => [])
      ]);
      setCourses(crs || []);
      setBatches(bts || []);
    } catch (err) {
      console.error('Error loading filters:', err);
    }
  };

  const loadStudentsReport = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentsDetailedReport(filters);
      setStudentsData(res || { records: [], summary: {} });
    } catch (err) {
      showToast(err.message || 'Failed to load students report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthwiseReport = async (year) => {
    try {
      setLoading(true);
      const res = await api.getMonthwiseReports(year);
      setMonthwiseData(res);
    } catch (err) {
      showToast(err.message || 'Failed to load monthwise financial report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPositionModal = (student) => {
    setSelectedStudentForPosition(student);
    setPositionForm({
      current_position_status: student.current_position_status || 'Employed',
      current_company_or_institution: student.current_company_or_institution || '',
      current_designation: student.current_designation || '',
      passed_out_year: student.passed_out_year || (student.status === 'completed' ? String(new Date().getFullYear()) : ''),
      current_position: student.current_position || '',
      status: student.status || 'completed'
    });
  };

  const handleSavePosition = async (e) => {
    e.preventDefault();
    if (!selectedStudentForPosition) return;
    try {
      setSavingPosition(true);
      await api.updateStudentPosition(selectedStudentForPosition.id, positionForm);
      showToast('Student career position updated successfully', 'success');
      setSelectedStudentForPosition(null);
      loadStudentsReport();
    } catch (err) {
      showToast(err.message || 'Failed to save position details', 'error');
    } finally {
      setSavingPosition(false);
    }
  };

  const handleExportCSV = async (type) => {
    try {
      setExportingType(type);
      const data = await api.getExportCSV(type);
      const blob = new Blob([data.csv_raw], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || `ims-export-${type}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(`Exported ${type} records successfully.`, 'success');
    } catch (err) {
      showToast(err.message || 'CSV Export failed.', 'error');
    } finally {
      setExportingType(null);
    }
  };

  const exportStudentsToCSV = () => {
    if (!studentsData?.records?.length) {
      showToast('No students to export', 'error');
      return;
    }
    const headers = [
      'Roll No', 'Name', 'Phone', 'Email', 'Course', 'Batch', 'Admission Date',
      'Status', 'Career Status', 'Company / Institution', 'Designation', 'Passing Year',
      'Net Fee', 'Fee Paid', 'Balance Due'
    ];
    const rows = studentsData.records.map(s => [
      `"${s.roll_no || ''}"`,
      `"${(s.first_name || '') + ' ' + (s.last_name || '')}"`,
      `"${s.phone || ''}"`,
      `"${s.email || ''}"`,
      `"${s.course_name || ''}"`,
      `"${s.batch_name || ''}"`,
      `"${s.admission_date || ''}"`,
      `"${s.status || ''}"`,
      `"${s.current_position_status || ''}"`,
      `"${s.current_company_or_institution || ''}"`,
      `"${s.current_designation || ''}"`,
      `"${s.passed_out_year || ''}"`,
      `"${s.net_fee || 0}"`,
      `"${s.total_paid || 0}"`,
      `"${s.outstanding_balance || 0}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ims-students-detailed-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Students detailed report downloaded', 'success');
  };

  const exportMonthwiseToCSV = () => {
    if (!monthwiseData?.months?.length) {
      showToast('No data to export', 'error');
      return;
    }
    const headers = [
      'Month', 'Admissions', 'Invoiced (INR)', 'Fee Collected (INR)',
      'House Rent (INR)', 'Other Expenses (INR)', 'Staff Salaries (INR)',
      'Total Expenditure (INR)', 'Pending Balance (INR)', 'Net Margin (INR)'
    ];
    const rows = monthwiseData.months.map(m => [
      `"${m.month_label}"`,
      `"${m.admissions}"`,
      `"${m.invoiced}"`,
      `"${m.fee_collected}"`,
      `"${m.house_rent}"`,
      `"${m.other_expenses}"`,
      `"${m.payroll_expenses}"`,
      `"${m.total_expenditure}"`,
      `"${m.pending_balance}"`,
      `"${m.net_margin}"`
    ]);

    const summary = monthwiseData.summary;
    rows.push([
      `"TOTAL ${selectedYear}"`,
      `"${summary.total_admissions}"`,
      `"${summary.total_invoiced}"`,
      `"${summary.total_collected}"`,
      `"${summary.total_rent}"`,
      `"${summary.total_other_expense}"`,
      `"${summary.total_payroll}"`,
      `"${summary.total_expenditure}"`,
      `"${summary.total_balance}"`,
      `"${summary.net_operating_margin}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ims-monthwise-financial-report-${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Monthwise financial report downloaded', 'success');
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* Header */}
      <div className="ims-view-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--ims-text-heading)' }}>
            Reports & Analytics
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--ims-text-muted)' }}>
            Comprehensive student details, alumni career tracking, and monthwise financial statements
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--ims-surface-hover)', padding: '0.35rem', borderRadius: '8px' }}>
          <button
            className={`ims-btn ${activeTab === 'students' ? 'ims-btn-primary' : 'ims-btn-secondary'}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('students')}
          >
            <GraduationCap size={16} />
            Student Details & Alumni
          </button>
          <button
            className={`ims-btn ${activeTab === 'monthwise' ? 'ims-btn-primary' : 'ims-btn-secondary'}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('monthwise')}
          >
            <Calendar size={16} />
            Monthwise Financials
          </button>
          <button
            className={`ims-btn ${activeTab === 'exports' ? 'ims-btn-primary' : 'ims-btn-secondary'}`}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('exports')}
          >
            <Download size={16} />
            Data Backups
          </button>
        </div>
      </div>

      {/* TAB 1: STUDENT DETAILS & ALUMNI TRACKING */}
      {activeTab === 'students' && (
        <div>
          {/* Summary KPIs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div className="ims-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--ims-text-muted)', fontWeight: 500 }}>Total Students</span>
                <Users size={20} style={{ color: '#3b82f6' }} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ims-text-heading)' }}>
                {studentsData?.summary?.total_students || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '0.25rem' }}>
                Active: {studentsData?.summary?.total_active || 0} | Passed: {studentsData?.summary?.total_passed || 0}
              </div>
            </div>

            <div className="ims-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--ims-text-muted)', fontWeight: 500 }}>Employed / In Work</span>
                <Briefcase size={20} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                {studentsData?.summary?.total_employed || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '0.25rem' }}>
                Higher Studies: {studentsData?.summary?.total_higher_studies || 0}
              </div>
            </div>

            <div className="ims-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--ims-text-muted)', fontWeight: 500 }}>Total Fee Revenue</span>
                <DollarSign size={20} style={{ color: '#6366f1' }} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ims-text-heading)' }}>
                {formatCurrency(studentsData?.summary?.total_revenue)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                Collected: {formatCurrency(studentsData?.summary?.total_collected)}
              </div>
            </div>

            <div className="ims-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--ims-text-muted)', fontWeight: 500 }}>Total Outstanding Due</span>
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>
                {formatCurrency(studentsData?.summary?.total_due)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '0.25rem' }}>
                Pending collection
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="ims-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
                {/* Search */}
                <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 200px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ims-text-muted)' }} />
                  <input
                    type="text"
                    className="ims-input"
                    style={{ paddingLeft: '32px' }}
                    placeholder="Search name, roll no, phone, employer..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>

                {/* Status Filter */}
                <select
                  className="ims-input"
                  style={{ width: 'auto' }}
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">All Student Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed / Passed Out</option>
                  <option value="dropped">Dropped / Discontinued</option>
                  <option value="inactive">Inactive</option>
                </select>

                {/* Career / Position Status Filter */}
                <select
                  className="ims-input"
                  style={{ width: 'auto' }}
                  value={filters.position_status}
                  onChange={(e) => setFilters({ ...filters, position_status: e.target.value })}
                >
                  <option value="all">All Career Positions</option>
                  <option value="Employed">Employed / Job</option>
                  <option value="Business">Business / Entrepreneur</option>
                  <option value="Higher Studies">Higher Studies</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Looking for Job">Looking for Job</option>
                </select>

                {/* Course Filter */}
                <select
                  className="ims-input"
                  style={{ width: 'auto' }}
                  value={filters.course_id}
                  onChange={(e) => setFilters({ ...filters, course_id: e.target.value })}
                >
                  <option value="">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Batch Filter */}
                <select
                  className="ims-input"
                  style={{ width: 'auto' }}
                  value={filters.batch_id}
                  onChange={(e) => setFilters({ ...filters, batch_id: e.target.value })}
                >
                  <option value="">All Batches</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="ims-btn ims-btn-secondary"
                  onClick={loadStudentsReport}
                  title="Refresh data"
                >
                  <RefreshCw size={15} className={loading ? 'ims-spin' : ''} />
                </button>
                <button
                  className="ims-btn ims-btn-primary"
                  onClick={exportStudentsToCSV}
                >
                  <Download size={15} />
                  Export to CSV
                </button>
              </div>
            </div>
          </div>

          {/* Student Detailed Table */}
          <div className="ims-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="ims-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Course & Batch</th>
                    <th>Admission Details</th>
                    <th>Current Status</th>
                    <th>Career / Current Position</th>
                    <th>Financial Balance</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--ims-text-muted)' }}>
                        <RefreshCw size={24} className="ims-spin" style={{ marginBottom: '0.5rem', display: 'inline-block' }} /><br />
                        Loading detailed student directory...
                      </td>
                    </tr>
                  ) : studentsData?.records?.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--ims-text-muted)' }}>
                        No student records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    studentsData.records.map((student) => {
                      const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
                      const isPassed = student.status === 'completed' || Boolean(student.passed_out_year);
                      const hasJob = student.current_position_status && student.current_position_status !== 'Looking for Job';

                      return (
                        <tr key={student.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--ims-text-heading)' }}>
                              {fullName || 'Unnamed Student'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                              <span>Roll: <strong>{student.roll_no}</strong></span>
                              {student.phone && <span>• {student.phone}</span>}
                            </div>
                            {student.email && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--ims-text-muted)' }}>
                                {student.email}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{student.course_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>
                              Batch: {student.batch_name}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>
                              Date: <strong>{student.admission_date || 'N/A'}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>
                              Adm Fee: {formatCurrency(student.admission_fee)}
                            </div>
                          </td>
                          <td>
                            <span className={`ims-badge ims-badge-${student.status === 'active' ? 'success' : student.status === 'completed' ? 'primary' : 'muted'}`}>
                              {student.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ maxWidth: '240px' }}>
                            {student.current_position_status || student.current_company_or_institution ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                  <span className={`ims-badge ${hasJob ? 'ims-badge-success' : 'ims-badge-warning'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                                    {student.current_position_status || 'Working'}
                                  </span>
                                  {student.passed_out_year && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--ims-text-muted)' }}>
                                      Pass: {student.passed_out_year}
                                    </span>
                                  )}
                                </div>
                                {(student.current_designation || student.current_company_or_institution) && (
                                  <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ims-text-heading)' }}>
                                    {student.current_designation ? `${student.current_designation} @ ` : ''}
                                    <span style={{ color: 'var(--ims-primary)' }}>{student.current_company_or_institution}</span>
                                  </div>
                                )}
                                {student.current_position && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--ims-text-muted)', marginTop: '0.15rem', fontStyle: 'italic' }}>
                                    "{student.current_position}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>
                                No career info added
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>
                              Net: <strong>{formatCurrency(student.net_fee)}</strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
                              Paid: {formatCurrency(student.total_paid)}
                            </div>
                            {Number(student.outstanding_balance) > 0 ? (
                              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                                Due: {formatCurrency(student.outstanding_balance)}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.72rem', color: '#10b981' }}>
                                Fully Cleared ✓
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="ims-btn ims-btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              onClick={() => handleOpenPositionModal(student)}
                              title="Update Career & Current Position"
                            >
                              <Briefcase size={13} />
                              {student.current_company_or_institution ? 'Edit Position' : 'Set Position'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHWISE FINANCIAL & OPERATIONAL SUMMARY */}
      {activeTab === 'monthwise' && (
        <div>
          {/* Year Selector & Refresh */}
          <div className="ims-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ims-text-heading)' }}>
                  Financial Year:
                </span>
                <select
                  className="ims-input"
                  style={{ width: '130px', fontWeight: 600 }}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
                <button
                  className="ims-btn ims-btn-secondary"
                  onClick={() => loadMonthwiseReport(selectedYear)}
                  title="Refresh"
                >
                  <RefreshCw size={15} className={loading ? 'ims-spin' : ''} />
                </button>
              </div>

              <button
                className="ims-btn ims-btn-primary"
                onClick={exportMonthwiseToCSV}
              >
                <Download size={15} />
                Export {selectedYear} Statement to CSV
              </button>
            </div>
          </div>

          {/* Annual Summary KPI Cards */}
          {monthwiseData?.summary && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div className="ims-card" style={{ padding: '1.25rem', borderTop: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--ims-text-muted)', fontWeight: 500 }}>Total Admissions ({selectedYear})</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--ims-text-heading)' }}>
                  {monthwiseData.summary.total_admissions} Students
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '0.2rem' }}>
                  Invoiced: {formatCurrency(monthwiseData.summary.total_invoiced)}
                </div>
              </div>

              <div className="ims-card" style={{ padding: '1.25rem', borderTop: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--ims-text-muted)', fontWeight: 500 }}>Total Fee Collections</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.35rem', color: '#10b981' }}>
                  {formatCurrency(monthwiseData.summary.total_collected)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem' }}>
                  Uncollected Balance: {formatCurrency(monthwiseData.summary.total_balance)}
                </div>
              </div>

              <div className="ims-card" style={{ padding: '1.25rem', borderTop: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--ims-text-muted)', fontWeight: 500 }}>Total Institute Expenditure</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.35rem', color: '#f59e0b' }}>
                  {formatCurrency(monthwiseData.summary.total_expenditure)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '0.2rem' }}>
                  Rent: {formatCurrency(monthwiseData.summary.total_rent)} | Other: {formatCurrency(monthwiseData.summary.total_other_expense)}
                </div>
              </div>

              <div className="ims-card" style={{ padding: '1.25rem', borderTop: `4px solid ${monthwiseData.summary.net_operating_margin >= 0 ? '#10b981' : '#ef4444'}` }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--ims-text-muted)', fontWeight: 500 }}>Net Operating Surplus / Margin</div>
                <div style={{
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  marginTop: '0.35rem',
                  color: monthwiseData.summary.net_operating_margin >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {formatCurrency(monthwiseData.summary.net_operating_margin)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '0.2rem' }}>
                  (Collections - All Expenditure)
                </div>
              </div>
            </div>
          )}

          {/* Monthwise Breakdown Table */}
          <div className="ims-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--ims-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ims-text-heading)' }}>
                Month-by-Month Financial Breakdown ({selectedYear})
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ims-text-muted)' }}>
                Includes Admissions, Invoices, Collections, Rent & Operational Costs
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="ims-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th style={{ textAlign: 'center' }}>Admissions</th>
                    <th style={{ textAlign: 'right' }}>Total Invoiced</th>
                    <th style={{ textAlign: 'right' }}>Fee Collected</th>
                    <th style={{ textAlign: 'right' }}>House / Office Rent</th>
                    <th style={{ textAlign: 'right' }}>Other Expenses</th>
                    <th style={{ textAlign: 'right' }}>Staff Salaries</th>
                    <th style={{ textAlign: 'right' }}>Total Expenditure</th>
                    <th style={{ textAlign: 'right' }}>Pending Balance</th>
                    <th style={{ textAlign: 'right' }}>Net Operating Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--ims-text-muted)' }}>
                        <RefreshCw size={24} className="ims-spin" style={{ marginBottom: '0.5rem', display: 'inline-block' }} /><br />
                        Loading monthwise financial summary...
                      </td>
                    </tr>
                  ) : !monthwiseData?.months?.length ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--ims-text-muted)' }}>
                        No records found for year {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {monthwiseData.months.map((m) => {
                        const isPositiveMargin = m.net_margin >= 0;
                        return (
                          <tr key={m.month_num}>
                            <td style={{ fontWeight: 600, color: 'var(--ims-text-heading)' }}>
                              {m.month_name}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`ims-badge ${m.admissions > 0 ? 'ims-badge-primary' : 'ims-badge-muted'}`}>
                                {m.admissions}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 500 }}>
                              {formatCurrency(m.invoiced)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                              {formatCurrency(m.fee_collected)}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--ims-text-heading)' }}>
                              {formatCurrency(m.house_rent)}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--ims-text-muted)' }}>
                              {formatCurrency(m.other_expenses)}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--ims-text-muted)' }}>
                              {formatCurrency(m.payroll_expenses)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>
                              {formatCurrency(m.total_expenditure)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 500, color: m.pending_balance > 0 ? '#ef4444' : 'var(--ims-text-muted)' }}>
                              {formatCurrency(m.pending_balance)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              <span style={{ color: isPositiveMargin ? '#10b981' : '#ef4444' }}>
                                {isPositiveMargin ? '+' : ''}{formatCurrency(m.net_margin)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Yearly Grand Total Row */}
                      {monthwiseData.summary && (
                        <tr style={{ background: 'var(--ims-surface-hover)', fontWeight: 700, borderTop: '2px solid var(--ims-border)' }}>
                          <td style={{ color: 'var(--ims-primary)', fontSize: '0.95rem' }}>
                            GRAND TOTAL ({selectedYear})
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--ims-primary)' }}>
                            {monthwiseData.summary.total_admissions}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(monthwiseData.summary.total_invoiced)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#10b981' }}>
                            {formatCurrency(monthwiseData.summary.total_collected)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(monthwiseData.summary.total_rent)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(monthwiseData.summary.total_other_expense)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {formatCurrency(monthwiseData.summary.total_payroll)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#f59e0b' }}>
                            {formatCurrency(monthwiseData.summary.total_expenditure)}
                          </td>
                          <td style={{ textAlign: 'right', color: '#ef4444' }}>
                            {formatCurrency(monthwiseData.summary.total_balance)}
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '1rem', color: monthwiseData.summary.net_operating_margin >= 0 ? '#10b981' : '#ef4444' }}>
                            {formatCurrency(monthwiseData.summary.net_operating_margin)}
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATA EXPORTS & BACKUPS */}
      {activeTab === 'exports' && (
        <div style={{ maxWidth: '900px' }}>
          <div className="ims-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'var(--ims-text-heading)' }}>
              Standard CSV Data Exports
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ims-text-muted)', margin: '0 0 1.25rem 0' }}>
              Download complete raw tabular datasets for accounting, auditing, or spreadsheet analysis.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ border: '1px solid var(--ims-border)', padding: '1.25rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <Users size={18} style={{ color: '#3b82f6' }} />
                  Students Master Export
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginBottom: '1rem' }}>
                  All registered students, admission dates, course info, fees paid and outstanding balances.
                </p>
                <button
                  className="ims-btn ims-btn-secondary"
                  style={{ width: '100%' }}
                  disabled={exportingType === 'students'}
                  onClick={() => handleExportCSV('students')}
                >
                  <Download size={14} />
                  {exportingType === 'students' ? 'Exporting...' : 'Download Students CSV'}
                </button>
              </div>

              <div style={{ border: '1px solid var(--ims-border)', padding: '1.25rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <FileText size={18} style={{ color: '#10b981' }} />
                  GST Invoices Export
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginBottom: '1rem' }}>
                  All generated tax invoices, GSTIN, CGST, SGST breakdown, and status.
                </p>
                <button
                  className="ims-btn ims-btn-secondary"
                  style={{ width: '100%' }}
                  disabled={exportingType === 'invoices'}
                  onClick={() => handleExportCSV('invoices')}
                >
                  <Download size={14} />
                  {exportingType === 'invoices' ? 'Exporting...' : 'Download Invoices CSV'}
                </button>
              </div>

              <div style={{ border: '1px solid var(--ims-border)', padding: '1.25rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <CreditCard size={18} style={{ color: '#6366f1' }} />
                  Fee Payments & Receipts
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginBottom: '1rem' }}>
                  Detailed payment transaction log, receipt numbers, payment modes, and reversals.
                </p>
                <button
                  className="ims-btn ims-btn-secondary"
                  style={{ width: '100%' }}
                  disabled={exportingType === 'payments'}
                  onClick={() => handleExportCSV('payments')}
                >
                  <Download size={14} />
                  {exportingType === 'payments' ? 'Exporting...' : 'Download Payments CSV'}
                </button>
              </div>

              <div style={{ border: '1px solid var(--ims-border)', padding: '1.25rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <IndianRupee size={18} style={{ color: '#f59e0b' }} />
                  Expenses & Vouchers
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginBottom: '1rem' }}>
                  All expense vouchers, vendor payments, rent, utility bills, and GST deductions.
                </p>
                <button
                  className="ims-btn ims-btn-secondary"
                  style={{ width: '100%' }}
                  disabled={exportingType === 'expenses'}
                  onClick={() => handleExportCSV('expenses')}
                >
                  <Download size={14} />
                  {exportingType === 'expenses' ? 'Exporting...' : 'Download Expenses CSV'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE CAREER / POSITION MODAL */}
      {selectedStudentForPosition && (
        <div className="ims-modal-backdrop">
          <div className="ims-modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                  Update Career / Current Position
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--ims-text-muted)' }}>
                  Student: <strong>{selectedStudentForPosition.first_name} {selectedStudentForPosition.last_name}</strong> ({selectedStudentForPosition.roll_no})
                </p>
              </div>
              <button
                className="ims-btn-icon"
                onClick={() => setSelectedStudentForPosition(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePosition}>
              <div style={{ display: 'grid', gap: '0.9rem' }}>
                <div>
                  <label className="ims-label">Academic Status</label>
                  <select
                    className="ims-input"
                    value={positionForm.status}
                    onChange={(e) => setPositionForm({ ...positionForm, status: e.target.value })}
                  >
                    <option value="active">Active (Enrolled)</option>
                    <option value="completed">Completed / Passed Out Alumni</option>
                    <option value="dropped">Dropped / Discontinued</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="ims-label">Career / Current Status</label>
                    <select
                      className="ims-input"
                      value={positionForm.current_position_status}
                      onChange={(e) => setPositionForm({ ...positionForm, current_position_status: e.target.value })}
                    >
                      <option value="Employed">Employed / Working</option>
                      <option value="Business">Business / Entrepreneur</option>
                      <option value="Higher Studies">Higher Studies</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="Looking for Job">Looking for Opportunities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="ims-label">Passed Out Year</label>
                    <input
                      type="text"
                      className="ims-input"
                      placeholder="e.g. 2025"
                      value={positionForm.passed_out_year}
                      onChange={(e) => setPositionForm({ ...positionForm, passed_out_year: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="ims-label">Company / Workplace / University</label>
                  <input
                    type="text"
                    className="ims-input"
                    placeholder="e.g. Infosys, TCS, Delhi University, Self-Employed"
                    value={positionForm.current_company_or_institution}
                    onChange={(e) => setPositionForm({ ...positionForm, current_company_or_institution: e.target.value })}
                  />
                </div>

                <div>
                  <label className="ims-label">Designation / Role</label>
                  <input
                    type="text"
                    className="ims-input"
                    placeholder="e.g. Software Engineer, Junior Accountant, Founder"
                    value={positionForm.current_designation}
                    onChange={(e) => setPositionForm({ ...positionForm, current_designation: e.target.value })}
                  />
                </div>

                <div>
                  <label className="ims-label">Career Details / Notes</label>
                  <textarea
                    className="ims-input"
                    rows="2"
                    placeholder="What the student is doing currently, package/role notes, achievements..."
                    value={positionForm.current_position}
                    onChange={(e) => setPositionForm({ ...positionForm, current_position: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="ims-btn ims-btn-secondary"
                  onClick={() => setSelectedStudentForPosition(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ims-btn ims-btn-primary"
                  disabled={savingPosition}
                >
                  <CheckCircle2 size={16} />
                  {savingPosition ? 'Saving...' : 'Save Career Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
