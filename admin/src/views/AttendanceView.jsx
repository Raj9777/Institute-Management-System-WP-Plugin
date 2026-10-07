import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import {
  Calendar,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Coffee,
  Users,
  UserCheck,
  CalendarCheck,
  FileSpreadsheet,
  Filter,
  Check,
  Search,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

export const AttendanceView = () => {
  const { showToast, user } = useApp();
  const caps = user?.capabilities || {};
  const canMark = Boolean(caps.mark_attendance);
  const canView = Boolean(caps.view_attendance);

  // Sub-section tab: 'take' (Take Attendance) or 'view' (View Attendance)
  const [subSection, setSubSection] = useState(canMark ? 'take' : 'view');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);

  // Take Attendance State
  const [takeType, setTakeType] = useState('student'); // 'student' or 'staff'
  const [studentDate, setStudentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState([]);
  const [studentRoster, setStudentRoster] = useState([]);
  const [studentMap, setStudentMap] = useState({});
  const [studentLoading, setStudentLoading] = useState(false);

  const [staffDate, setStaffDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffRoster, setStaffRoster] = useState([]);
  const [staffMap, setStaffMap] = useState({});
  const [staffLoading, setStaffLoading] = useState(false);

  // View Attendance State
  const [viewType, setViewType] = useState('student'); // 'student' or 'staff'
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewBatch, setViewBatch] = useState('');
  const [viewSearch, setViewSearch] = useState('');
  const [viewRecords, setViewRecords] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    loadBatches();
    loadStaffData();
  }, []);

  useEffect(() => {
    if (subSection === 'take') {
      if (takeType === 'student') {
        loadStudentData();
      } else {
        loadStaffData();
      }
    } else {
      loadViewAttendanceData();
    }
  }, [subSection, takeType, studentDate, selectedBatch, staffDate, viewType, viewMode, viewDate, viewMonth, viewYear, viewBatch]);

  const loadBatches = async () => {
    try {
      const res = await api.getBatches();
      setBatches(res || []);
      if (res && res.length > 0) {
        setSelectedBatch(res[0].id);
        setViewBatch(res[0].id);
      }
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      }
    }
  };

  const loadStudentData = async () => {
    if (!selectedBatch) return;
    setStudentLoading(true);
    try {
      const list = await api.getStudents({ batch_id: selectedBatch, status: 'active' });
      const saved = await api.getAttendance(studentDate, 'student', selectedBatch);
      const map = {};
      saved.forEach((r) => { map[r.entity_id] = r.status; });
      list.forEach((item) => {
        if (!map[item.id]) map[item.id] = 'present';
      });
      setStudentRoster(list || []);
      setStudentMap(map);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load student attendance.');
      }
    } finally {
      setStudentLoading(false);
    }
  };

  const loadStaffData = async () => {
    setStaffLoading(true);
    try {
      const list = await api.getStaff();
      const saved = await api.getAttendance(staffDate, 'staff');
      const map = {};
      saved.forEach((r) => { map[r.entity_id] = r.status; });
      list.forEach((item) => {
        if (!map[item.id]) map[item.id] = 'present';
      });
      setStaffRoster(list || []);
      setStaffMap(map);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load staff attendance.');
      }
    } finally {
      setStaffLoading(false);
    }
  };

  const loadViewAttendanceData = async () => {
    setViewLoading(true);
    try {
      let params = `entity_type=${viewType}`;
      if (viewType === 'student' && viewBatch) {
        params += `&batch_id=${viewBatch}`;
      }

      if (viewMode === 'daily') {
        params += `&date=${viewDate}`;
      } else {
        params += `&month=${viewMonth}&year=${viewYear}`;
      }

      const res = await fetch(`${window.imsData?.root || '/wp-json/'}ims/v1/attendance?${params}`, {
        headers: { 'X-WP-Nonce': window.imsData?.nonce || '' },
      }).then((r) => r.json());

      if (res && res.ok) {
        setViewRecords(res.data || []);
      } else {
        setViewRecords([]);
      }
    } catch (err) {
      console.error('Failed to load view records', err);
    } finally {
      setViewLoading(false);
    }
  };

  // Bulk actions for Take Attendance
  const markAllStudents = (status) => {
    const newMap = { ...studentMap };
    studentRoster.forEach((s) => { newMap[s.id] = status; });
    setStudentMap(newMap);
  };

  const markAllStaff = (status) => {
    const newMap = { ...staffMap };
    staffRoster.forEach((s) => { newMap[s.id] = status; });
    setStaffMap(newMap);
  };

  // Save actions
  const saveStudentAttendance = async () => {
    try {
      const records = Object.keys(studentMap).map((id) => ({
        entity_id: parseInt(id),
        status: studentMap[id],
      }));
      await api.saveAttendance({
        date: studentDate,
        entity_type: 'student',
        batch_id: selectedBatch,
        records,
      });
      showToast('Student attendance saved successfully!');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const saveStaffAttendance = async () => {
    try {
      const records = Object.keys(staffMap).map((id) => ({
        entity_id: parseInt(id),
        status: staffMap[id],
      }));
      await api.saveAttendance({
        date: staffDate,
        entity_type: 'staff',
        batch_id: null,
        records,
      });
      showToast('Staff attendance saved successfully!');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const studentStatusOptions = [
    { key: 'present', label: 'P', title: 'Present', color: '#059669', bg: '#ecfdf5' },
    { key: 'absent', label: 'A', title: 'Absent', color: '#e11d48', bg: '#fff1f2' },
    { key: 'late', label: 'L', title: 'Late', color: '#d97706', bg: '#fffbeb' },
    { key: 'leave', label: 'LV', title: 'Leave', color: '#7c3aed', bg: '#f5f3ff' },
  ];

  const staffStatusOptions = [
    { key: 'present', label: 'P', title: 'Present', color: '#059669', bg: '#ecfdf5' },
    { key: 'absent', label: 'A', title: 'Absent', color: '#e11d48', bg: '#fff1f2' },
    { key: 'half_day', label: 'HD', title: 'Half Day', color: '#2563eb', bg: '#eff6ff' },
    { key: 'leave', label: 'LV', title: 'Leave', color: '#7c3aed', bg: '#f5f3ff' },
  ];

  // Calculations for View Attendance
  const activeRoster = viewType === 'student' ? studentRoster : staffRoster;
  const filteredRoster = activeRoster.filter((item) => {
    if (!viewSearch) return true;
    const name = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
    const code = (item.roll_no || item.staff_code || '').toLowerCase();
    return name.includes(viewSearch.toLowerCase()) || code.includes(viewSearch.toLowerCase());
  });

  const daysInViewMonth = new Date(viewYear, viewMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInViewMonth }, (_, i) => i + 1);

  // Daily View Stats
  const dailyStatusMap = {};
  viewRecords.forEach((r) => {
    dailyStatusMap[r.entity_id] = r.status;
  });

  const dailyPresentCount = Object.values(dailyStatusMap).filter((s) => s === 'present').length;
  const dailyAbsentCount = Object.values(dailyStatusMap).filter((s) => s === 'absent').length;
  const dailyLateCount = Object.values(dailyStatusMap).filter((s) => s === 'late' || s === 'half_day').length;
  const dailyLeaveCount = Object.values(dailyStatusMap).filter((s) => s === 'leave').length;
  const dailyTotalMarked = Object.keys(dailyStatusMap).length;
  const dailyPct = dailyTotalMarked > 0 ? Math.round((dailyPresentCount / dailyTotalMarked) * 100) : 0;

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={() => { loadStudentData(); loadStaffData(); }} />;

  return (
    <div>
      {/* Sub-Section Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid var(--ims-border)',
          paddingBottom: '0.5rem',
        }}
      >
        {canMark && (
          <button
            type="button"
            onClick={() => setSubSection('take')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              border: 'none',
              background: subSection === 'take' ? 'var(--ims-primary)' : 'transparent',
              color: subSection === 'take' ? '#ffffff' : 'var(--ims-text-muted)',
              boxShadow: subSection === 'take' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Edit3 size={16} />
            <span>Take Attendance</span>
          </button>
        )}

        {canView && (
          <button
            type="button"
            onClick={() => setSubSection('view')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              border: 'none',
              background: subSection === 'view' ? 'var(--ims-primary)' : 'transparent',
              color: subSection === 'view' ? '#ffffff' : 'var(--ims-text-muted)',
              boxShadow: subSection === 'view' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Eye size={16} />
            <span>View Attendance</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-SECTION 1: TAKE ATTENDANCE                                            */}
      {/* ========================================================================= */}
      {subSection === 'take' && (
        <div>
          {/* Toggle Student vs Staff taking */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`ims-btn ims-btn-sm ${takeType === 'student' ? 'ims-btn-primary' : 'ims-btn-secondary'}`}
              onClick={() => setTakeType('student')}
            >
              <Users size={14} /> Student Attendance
            </button>
            <button
              type="button"
              className={`ims-btn ims-btn-sm ${takeType === 'staff' ? 'ims-btn-primary' : 'ims-btn-secondary'}`}
              onClick={() => setTakeType('staff')}
            >
              <UserCheck size={14} /> Staff Attendance
            </button>
          </div>

          {takeType === 'student' ? (
            /* Student Attendance Panel */
            <div className="ims-card">
              <div className="ims-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 className="ims-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Users size={18} /> Student Attendance Roll Call
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '2px' }}>
                    Select batch and date to record presence
                  </div>
                </div>

                <button className="ims-btn ims-btn-primary" onClick={saveStudentAttendance}>
                  <Save size={14} /> Save Student Attendance
                </button>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid var(--ims-border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="date"
                  className="ims-input"
                  style={{ width: '150px', padding: '6px 10px' }}
                  value={studentDate}
                  onChange={(e) => setStudentDate(e.target.value)}
                />
                <select
                  className="ims-select"
                  style={{ flex: 1, minWidth: '180px', padding: '6px 10px' }}
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.course_name || 'Course'})</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button type="button" className="ims-btn ims-btn-secondary ims-btn-sm" onClick={() => markAllStudents('present')}>
                    All Present
                  </button>
                  <button type="button" className="ims-btn ims-btn-secondary ims-btn-sm" onClick={() => markAllStudents('absent')}>
                    All Absent
                  </button>
                </div>
              </div>

              <div className="ims-table-wrapper" style={{ maxHeight: '480px', overflowY: 'auto' }}>
                <table className="ims-table">
                  <thead>
                    <tr>
                      <th style={{ width: '160px' }}>Roll No</th>
                      <th>Student Name</th>
                      <th style={{ width: '220px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentLoading ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Loading batch students...</td></tr>
                    ) : studentRoster.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No active students enrolled in this batch.</td></tr>
                    ) : (
                      studentRoster.map((s) => {
                        const currentStatus = studentMap[s.id] || 'present';
                        return (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{s.roll_no}</td>
                            <td style={{ fontWeight: 600 }}>
                              <div>{s.first_name} {s.last_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>{s.phone || s.guardian_name || 'Active Student'}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                {studentStatusOptions.map((opt) => {
                                  const isSel = currentStatus === opt.key;
                                  return (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      title={opt.title}
                                      onClick={() => setStudentMap({ ...studentMap, [s.id]: opt.key })}
                                      style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        border: isSel ? `2px solid ${opt.color}` : '1px solid var(--ims-border)',
                                        background: isSel ? opt.bg : '#ffffff',
                                        color: isSel ? opt.color : 'var(--ims-text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Staff Attendance Panel */
            <div className="ims-card">
              <div className="ims-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 className="ims-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <UserCheck size={18} /> Staff Daily Attendance
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '2px' }}>
                    Record faculty & administration daily logs
                  </div>
                </div>

                <button className="ims-btn ims-btn-primary" onClick={saveStaffAttendance}>
                  <Save size={14} /> Save Staff Attendance
                </button>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid var(--ims-border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="date"
                  className="ims-input"
                  style={{ width: '150px', padding: '6px 10px' }}
                  value={staffDate}
                  onChange={(e) => setStaffDate(e.target.value)}
                />
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button type="button" className="ims-btn ims-btn-secondary ims-btn-sm" onClick={() => markAllStaff('present')}>
                    All Present
                  </button>
                  <button type="button" className="ims-btn ims-btn-secondary ims-btn-sm" onClick={() => markAllStaff('absent')}>
                    All Absent
                  </button>
                </div>
              </div>

              <div className="ims-table-wrapper" style={{ maxHeight: '480px', overflowY: 'auto' }}>
                <table className="ims-table">
                  <thead>
                    <tr>
                      <th style={{ width: '140px' }}>Staff Code</th>
                      <th>Staff Name & Designation</th>
                      <th style={{ width: '240px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffLoading ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Loading staff members...</td></tr>
                    ) : staffRoster.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No staff members registered.</td></tr>
                    ) : (
                      staffRoster.map((st) => {
                        const currentStatus = staffMap[st.id] || 'present';
                        return (
                          <tr key={st.id}>
                            <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{st.staff_code}</td>
                            <td style={{ fontWeight: 600 }}>
                              <div>{st.first_name} {st.last_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>{st.designation || 'Staff Member'}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                {staffStatusOptions.map((opt) => {
                                  const isSel = currentStatus === opt.key;
                                  return (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      title={opt.title}
                                      onClick={() => setStaffMap({ ...staffMap, [st.id]: opt.key })}
                                      style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        border: isSel ? `2px solid ${opt.color}` : '1px solid var(--ims-border)',
                                        background: isSel ? opt.bg : '#ffffff',
                                        color: isSel ? opt.color : 'var(--ims-text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-SECTION 2: VIEW ATTENDANCE (Daily & Monthly Register)                  */}
      {/* ========================================================================= */}
      {subSection === 'view' && (
        <div>
          {/* Controls Bar */}
          <div
            className="ims-card"
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Type Switcher */}
              <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--ims-border)' }}>
                <button
                  type="button"
                  onClick={() => setViewType('student')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    background: viewType === 'student' ? 'var(--ims-primary)' : '#ffffff',
                    color: viewType === 'student' ? '#ffffff' : 'var(--ims-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Students
                </button>
                <button
                  type="button"
                  onClick={() => setViewType('staff')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    background: viewType === 'staff' ? 'var(--ims-primary)' : '#ffffff',
                    color: viewType === 'staff' ? '#ffffff' : 'var(--ims-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Staff
                </button>
              </div>

              {/* View Mode (Daily vs Monthly Matrix) */}
              <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--ims-border)' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('daily')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    background: viewMode === 'daily' ? '#0f172a' : '#ffffff',
                    color: viewMode === 'daily' ? '#ffffff' : 'var(--ims-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Daily Log
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('monthly')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    background: viewMode === 'monthly' ? '#0f172a' : '#ffffff',
                    color: viewMode === 'monthly' ? '#ffffff' : 'var(--ims-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Monthly Matrix
                </button>
              </div>

              {viewType === 'student' && (
                <select
                  className="ims-select"
                  style={{ width: '180px', padding: '5px 10px', fontSize: '0.85rem' }}
                  value={viewBatch}
                  onChange={(e) => setViewBatch(e.target.value)}
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {viewMode === 'daily' ? (
                <input
                  type="date"
                  className="ims-input"
                  style={{ width: '150px', padding: '5px 10px', fontSize: '0.85rem' }}
                  value={viewDate}
                  onChange={(e) => setViewDate(e.target.value)}
                />
              ) : (
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <select
                    className="ims-select"
                    style={{ width: '120px', padding: '5px 8px', fontSize: '0.85rem' }}
                    value={viewMonth}
                    onChange={(e) => setViewMonth(parseInt(e.target.value))}
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    className="ims-select"
                    style={{ width: '90px', padding: '5px 8px', fontSize: '0.85rem' }}
                    value={viewYear}
                    onChange={(e) => setViewYear(parseInt(e.target.value))}
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ims-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter name or code..."
                  className="ims-input"
                  style={{ paddingLeft: '30px', width: '180px', fontSize: '0.85rem' }}
                  value={viewSearch}
                  onChange={(e) => setViewSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Daily Mode View */}
          {viewMode === 'daily' && (
            <div>
              {/* Daily KPI Summary Bar */}
              <div className="ims-grid-4" style={{ marginBottom: '1.25rem' }}>
                <div className="ims-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', fontWeight: 600 }}>PRESENT</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{dailyPresentCount}</div>
                  </div>
                  <div style={{ padding: '6px', background: '#ecfdf5', borderRadius: '8px', color: '#059669' }}>
                    <CheckCircle2 size={20} />
                  </div>
                </div>

                <div className="ims-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', fontWeight: 600 }}>ABSENT</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e11d48' }}>{dailyAbsentCount}</div>
                  </div>
                  <div style={{ padding: '6px', background: '#fff1f2', borderRadius: '8px', color: '#e11d48' }}>
                    <XCircle size={20} />
                  </div>
                </div>

                <div className="ims-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', fontWeight: 600 }}>LEAVE / LATE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed' }}>{dailyLeaveCount + dailyLateCount}</div>
                  </div>
                  <div style={{ padding: '6px', background: '#f5f3ff', borderRadius: '8px', color: '#7c3aed' }}>
                    <Clock size={20} />
                  </div>
                </div>

                <div className="ims-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', fontWeight: 600 }}>ATTENDANCE RATE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ims-primary)' }}>{dailyPct}%</div>
                  </div>
                  <div style={{ padding: '6px', background: '#eff6ff', borderRadius: '8px', color: 'var(--ims-primary)' }}>
                    <TrendingUp size={20} />
                  </div>
                </div>
              </div>

              {/* Table of Daily Records */}
              <div className="ims-card">
                <div className="ims-table-wrapper">
                  <table className="ims-table">
                    <thead>
                      <tr>
                        <th style={{ width: '160px' }}>{viewType === 'student' ? 'Roll No' : 'Staff Code'}</th>
                        <th>Name</th>
                        <th>Status on {viewDate}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewLoading ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Loading attendance log...</td></tr>
                      ) : filteredRoster.length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No records found for the selected criteria.</td></tr>
                      ) : (
                        filteredRoster.map((item) => {
                          const status = dailyStatusMap[item.id] || 'unmarked';
                          let badgeBg = '#f1f5f9';
                          let badgeColor = '#64748b';
                          let label = 'Not Marked';

                          if (status === 'present') {
                            badgeBg = '#ecfdf5';
                            badgeColor = '#059669';
                            label = 'Present';
                          } else if (status === 'absent') {
                            badgeBg = '#fff1f2';
                            badgeColor = '#e11d48';
                            label = 'Absent';
                          } else if (status === 'late') {
                            badgeBg = '#fffbeb';
                            badgeColor = '#d97706';
                            label = 'Late';
                          } else if (status === 'half_day') {
                            badgeBg = '#eff6ff';
                            badgeColor = '#2563eb';
                            label = 'Half Day';
                          } else if (status === 'leave') {
                            badgeBg = '#f5f3ff';
                            badgeColor = '#7c3aed';
                            label = 'On Leave';
                          }

                          return (
                            <tr key={item.id}>
                              <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>
                                {item.roll_no || item.staff_code}
                              </td>
                              <td style={{ fontWeight: 600 }}>
                                {item.first_name} {item.last_name}
                              </td>
                              <td>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    background: badgeBg,
                                    color: badgeColor,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {label}
                                </span>
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

          {/* Monthly Register Matrix View */}
          {viewMode === 'monthly' && (
            <div className="ims-card">
              <div className="ims-card-header">
                <h3 className="ims-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileSpreadsheet size={18} /> Monthly Attendance Register Matrix
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ims-text-muted)' }}>
                  {new Date(viewYear, viewMonth - 1, 1).toLocaleString('default', { month: 'long' })} {viewYear}
                </div>
              </div>

              <div className="ims-table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="ims-table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '130px', position: 'sticky', left: 0, background: '#ffffff', zIndex: 2 }}>
                        {viewType === 'student' ? 'Roll / Name' : 'Code / Name'}
                      </th>
                      {daysArray.map((d) => (
                        <th key={d} style={{ width: '28px', textAlign: 'center', padding: '6px 2px' }}>
                          {d}
                        </th>
                      ))}
                      <th style={{ minWidth: '70px', textAlign: 'center' }}>Total P</th>
                      <th style={{ minWidth: '60px', textAlign: 'center' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewLoading ? (
                      <tr><td colSpan={daysInViewMonth + 3} style={{ textAlign: 'center', padding: '2rem' }}>Loading monthly attendance register...</td></tr>
                    ) : filteredRoster.length === 0 ? (
                      <tr><td colSpan={daysInViewMonth + 3} style={{ textAlign: 'center', padding: '2rem' }}>No roster records found.</td></tr>
                    ) : (
                      filteredRoster.map((item) => {
                        // Gather dates for this item
                        const itemRecords = viewRecords.filter((r) => r.entity_id === item.id);
                        const dateMap = {};
                        let pCount = 0;
                        let markedDays = 0;

                        itemRecords.forEach((r) => {
                          const dayNum = parseInt(r.attendance_date.split('-')[2], 10);
                          dateMap[dayNum] = r.status;
                          if (r.status === 'present') pCount += 1;
                          if (r.status === 'half_day') pCount += 0.5;
                          markedDays += 1;
                        });

                        const pct = markedDays > 0 ? Math.round((pCount / markedDays) * 100) : 0;

                        return (
                          <tr key={item.id}>
                            <td style={{ position: 'sticky', left: 0, background: '#ffffff', zIndex: 1, fontWeight: 600 }}>
                              <div style={{ color: 'var(--ims-primary)', fontWeight: 700 }}>{item.roll_no || item.staff_code}</div>
                              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                {item.first_name} {item.last_name}
                              </div>
                            </td>

                            {daysArray.map((d) => {
                              const st = dateMap[d];
                              let letter = '-';
                              let color = '#cbd5e1';
                              let bg = 'transparent';

                              if (st === 'present') {
                                letter = 'P';
                                color = '#059669';
                                bg = '#ecfdf5';
                              } else if (st === 'absent') {
                                letter = 'A';
                                color = '#e11d48';
                                bg = '#fff1f2';
                              } else if (st === 'late') {
                                letter = 'L';
                                color = '#d97706';
                                bg = '#fffbeb';
                              } else if (st === 'half_day') {
                                letter = 'HD';
                                color = '#2563eb';
                                bg = '#eff6ff';
                              } else if (st === 'leave') {
                                letter = 'LV';
                                color = '#7c3aed';
                                bg = '#f5f3ff';
                              }

                              return (
                                <td
                                  key={d}
                                  style={{
                                    textAlign: 'center',
                                    padding: '4px 1px',
                                    fontWeight: 700,
                                    color,
                                    background: bg,
                                    borderRight: '1px solid #f1f5f9',
                                  }}
                                >
                                  {letter}
                                </td>
                              );
                            })}

                            <td style={{ textAlign: 'center', fontWeight: 800, color: '#059669' }}>
                              {pCount}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 800, color: pct >= 75 ? '#059669' : '#e11d48' }}>
                              {pct}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
