import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import { Calendar, Save, CheckCircle2, XCircle, Clock, Coffee, ShieldAlert, Award, Users, UserCheck } from 'lucide-react';

export const AttendanceView = () => {
  const { showToast } = useApp();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);

  // Student Attendance Widget State
  const [studentDate, setStudentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState([]);
  const [studentRoster, setStudentRoster] = useState([]);
  const [studentMap, setStudentMap] = useState({});
  const [studentLoading, setStudentLoading] = useState(false);

  // Staff Attendance Widget State
  const [staffDate, setStaffDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffRoster, setStaffRoster] = useState([]);
  const [staffMap, setStaffMap] = useState({});
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    loadBatches();
    loadStaffData();
  }, []);

  useEffect(() => {
    loadStudentData();
  }, [studentDate, selectedBatch]);

  useEffect(() => {
    loadStaffData();
  }, [staffDate]);

  const loadBatches = async () => {
    try {
      const res = await api.getBatches();
      setBatches(res || []);
      if (res && res.length > 0) {
        setSelectedBatch(res[0].id);
      }
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      }
    }
  };

  const loadStudentData = async () => {
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

  // Bulk actions
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

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={() => { loadStudentData(); loadStaffData(); }} />;

  return (
    <div>
      {/* Side-by-Side on Desktop, Stacked on Mobile */}
      <div className="ims-grid-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
        
        {/* Panel 1: Student Attendance Panel */}
        <div className="ims-card">
          <div className="ims-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="ims-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Users size={18} /> Student Attendance Panel
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '2px' }}>
                Manage daily batch roll calls
              </div>
            </div>

            <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={saveStudentAttendance}>
              <Save size={14} /> Save Students
            </button>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid var(--ims-border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="date"
              className="ims-input"
              style={{ width: '140px', padding: '4px 8px' }}
              value={studentDate}
              onChange={(e) => setStudentDate(e.target.value)}
            />
            <select
              className="ims-select"
              style={{ flex: 1, minWidth: '150px', padding: '4px 8px' }}
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button type="button" className="ims-btn ims-btn-secondary ims-btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => markAllStudents('present')}>
                All Present
              </button>
              <button type="button" className="ims-btn ims-btn-secondary ims-btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => markAllStudents('absent')}>
                All Absent
              </button>
            </div>
          </div>

          <div className="ims-table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentRoster.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No active students in selected batch.</td></tr>
                ) : (
                  studentRoster.map((s) => {
                    const currentStatus = studentMap[s.id] || 'present';
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{s.roll_no}</td>
                        <td style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {studentStatusOptions.map((opt) => {
                              const isSel = currentStatus === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  title={opt.title}
                                  onClick={() => setStudentMap({ ...studentMap, [s.id]: opt.key })}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    border: isSel ? `2px solid ${opt.color}` : '1px solid var(--ims-border)',
                                    background: isSel ? opt.bg : '#ffffff',
                                    color: isSel ? opt.color : 'var(--ims-text-muted)',
                                    cursor: 'pointer',
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

        {/* Panel 2: Staff Attendance Panel */}
        <div className="ims-card">
          <div className="ims-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 className="ims-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <UserCheck size={18} /> Staff Attendance Panel
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)', marginTop: '2px' }}>
                Track faculty & staff daily presence
              </div>
            </div>

            <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={saveStaffAttendance}>
              <Save size={14} /> Save Staff
            </button>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid var(--ims-border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="date"
              className="ims-input"
              style={{ width: '140px', padding: '4px 8px' }}
              value={staffDate}
              onChange={(e) => setStaffDate(e.target.value)}
            />
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button type="button" className="ims-btn ims-btn-secondary ims-btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => markAllStaff('present')}>
                All Present
              </button>
              <button type="button" className="ims-btn ims-btn-secondary ims-btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => markAllStaff('absent')}>
                All Absent
              </button>
            </div>
          </div>

          <div className="ims-table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Staff Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffRoster.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No staff members registered.</td></tr>
                ) : (
                  staffRoster.map((st) => {
                    const currentStatus = staffMap[st.id] || 'present';
                    return (
                      <tr key={st.id}>
                        <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{st.staff_code}</td>
                        <td style={{ fontWeight: 600 }}>
                          <div>{st.first_name} {st.last_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>{st.designation}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {staffStatusOptions.map((opt) => {
                              const isSel = currentStatus === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  title={opt.title}
                                  onClick={() => setStaffMap({ ...staffMap, [st.id]: opt.key })}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    border: isSel ? `2px solid ${opt.color}` : '1px solid var(--ims-border)',
                                    background: isSel ? opt.bg : '#ffffff',
                                    color: isSel ? opt.color : 'var(--ims-text-muted)',
                                    cursor: 'pointer',
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

      </div>
    </div>
  );
};
