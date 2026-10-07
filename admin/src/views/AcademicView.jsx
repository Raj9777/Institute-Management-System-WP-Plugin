import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import { Plus, BookOpen, Layers, Pencil, Trash2, Clock } from 'lucide-react';

export const AcademicView = () => {
  const { showToast } = useApp();
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);

  // Course Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({ code: '', name: '', description: '', fee_amount: 5000, duration_months: 6, status: 'active' });

  // Batch Modals & Timing State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    course_id: '',
    name: '',
    capacity: 30,
    teacher_id: '',
    start_time: '09:00',
    end_time: '10:30',
    status: 'active'
  });

  // Time conversion helpers
  const timeToMinutes = (time24Str) => {
    if (!time24Str) return 0;
    const parts = time24Str.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
  };

  const formatTime24to12 = (time24Str) => {
    if (!time24Str) return '';
    const [hStr, mStr] = time24Str.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const formattedH = h < 10 ? `0${h}` : `${h}`;
    return `${formattedH}:${m} ${ampm}`;
  };

  const parseTimingString = (timingStr) => {
    if (!timingStr) return { start_time: '09:00', end_time: '10:30' };
    
    // Check if format is "09:00 AM - 10:30 AM" or "09:00 - 10:30"
    const parts = timingStr.split('-').map(s => s.trim());
    if (parts.length === 2) {
      const convert12to24 = (str) => {
        const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!match) return null;
        let h = parseInt(match[1], 10);
        const m = match[2];
        const period = match[3] ? match[3].toUpperCase() : null;
        if (period === 'PM' && h < 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return `${h < 10 ? '0' + h : h}:${m}`;
      };

      const st = convert12to24(parts[0]);
      const et = convert12to24(parts[1]);
      if (st && et) {
        return { start_time: st, end_time: et };
      }
    }
    return { start_time: '09:00', end_time: '10:30' };
  };

  useEffect(() => {
    loadAcademicData();
  }, []);

  const loadAcademicData = async () => {
    setPermissionDenied(false);
    setError(null);
    try {
      const [cRes, bRes, sRes] = await Promise.all([
        api.getCourses(),
        api.getBatches(),
        api.getStaff(),
      ]);
      setCourses(cRes || []);
      setBatches(bRes || []);
      setStaff(sRes || []);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load academic catalog.');
      }
    }
  };

  // Course handlers
  const openAddCourseModal = () => {
    setEditingCourse(null);
    setCourseForm({ code: '', name: '', description: '', fee_amount: 5000, duration_months: 6, status: 'active' });
    setShowCourseModal(true);
  };

  const openEditCourseModal = (c) => {
    setEditingCourse(c);
    setCourseForm({
      code: c.code || '',
      name: c.name || '',
      description: c.description || '',
      fee_amount: c.fee_amount || 0,
      duration_months: c.duration_months || 1,
      status: c.status || 'active',
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, courseForm);
        showToast('Course updated successfully!');
      } else {
        await api.createCourse(courseForm);
        showToast('Course created successfully!');
      }
      setShowCourseModal(false);
      loadAcademicData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteCourse = async (c) => {
    if (!window.confirm(`Are you sure you want to delete course "${c.name}" (${c.code})?`)) {
      return;
    }
    try {
      await api.deleteCourse(c.id);
      showToast('Course deleted.');
      loadAcademicData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Batch handlers
  const openAddBatchModal = () => {
    setEditingBatch(null);
    setBatchForm({
      course_id: '',
      name: '',
      capacity: 30,
      teacher_id: '',
      start_time: '09:00',
      end_time: '10:30',
      status: 'active'
    });
    setShowBatchModal(true);
  };

  const openEditBatchModal = (b) => {
    setEditingBatch(b);
    const parsed = parseTimingString(b.timing);
    setBatchForm({
      course_id: b.course_id || '',
      name: b.name || '',
      capacity: b.capacity || 30,
      teacher_id: b.teacher_id || '',
      start_time: parsed.start_time,
      end_time: parsed.end_time,
      status: b.status || 'active',
    });
    setShowBatchModal(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();

    const startMins = timeToMinutes(batchForm.start_time);
    const endMins = timeToMinutes(batchForm.end_time);

    if (endMins <= startMins) {
      showToast('Batch end time must be after start time.', 'danger');
      return;
    }

    const formattedTiming = `${formatTime24to12(batchForm.start_time)} - ${formatTime24to12(batchForm.end_time)}`;

    // Check teacher schedule overlap warning
    if (batchForm.teacher_id) {
      const conflictingBatch = batches.find((b) => {
        if (b.teacher_id != batchForm.teacher_id) return false;
        if (editingBatch && b.id == editingBatch.id) return false;
        
        const bTimes = parseTimingString(b.timing);
        const bStart = timeToMinutes(bTimes.start_time);
        const bEnd = timeToMinutes(bTimes.end_time);

        // Check if ranges overlap: max(start1, start2) < min(end1, end2)
        return Math.max(startMins, bStart) < Math.min(endMins, bEnd);
      });

      if (conflictingBatch) {
        showToast(
          `Warning: Faculty member is already assigned to batch "${conflictingBatch.name}" (${conflictingBatch.timing}) during this time!`,
          'warning'
        );
      }
    }

    const payload = {
      course_id: batchForm.course_id,
      name: batchForm.name,
      capacity: batchForm.capacity,
      teacher_id: batchForm.teacher_id,
      timing: formattedTiming,
      status: batchForm.status,
    };

    try {
      if (editingBatch) {
        await api.updateBatch(editingBatch.id, payload);
        showToast('Batch updated successfully!');
      } else {
        await api.createBatch(payload);
        showToast('Batch created successfully!');
      }
      setShowBatchModal(false);
      loadAcademicData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteBatch = async (b) => {
    if (!window.confirm(`Are you sure you want to delete batch "${b.name}"?`)) {
      return;
    }
    try {
      await api.deleteBatch(b.id);
      showToast('Batch deleted.');
      loadAcademicData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={loadAcademicData} />;

  return (
    <div>
      <div className="ims-grid-2">
        {/* Courses Section */}
        <div className="ims-card">
          <div className="ims-card-header">
            <h3 className="ims-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} /> Course Catalog
            </h3>
            <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={openAddCourseModal}>
              <Plus size={14} /> Add Course
            </button>
          </div>

          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Fee (₹)</th>
                  <th>Duration</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>No courses added.</td></tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.code}</td>
                      <td>{c.name}</td>
                      <td style={{ fontWeight: 600, color: 'var(--ims-success)' }}>₹{parseFloat(c.fee_amount).toLocaleString('en-IN')}</td>
                      <td>{c.duration_months} Months</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            title="Edit Course"
                            onClick={() => openEditCourseModal(c)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="ims-btn ims-btn-danger ims-btn-sm"
                            title="Delete Course"
                            onClick={() => handleDeleteCourse(c)}
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
        </div>

        {/* Batches Section */}
        <div className="ims-card">
          <div className="ims-card-header">
            <h3 className="ims-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} /> Active Batches & Capacity Bars
            </h3>
            <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={openAddBatchModal}>
              <Plus size={14} /> Add Batch
            </button>
          </div>

          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Batch Name</th>
                  <th>Course</th>
                  <th>Teacher & Slot</th>
                  <th>Enrolled / Capacity</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>No batches created.</td></tr>
                ) : (
                  batches.map((b) => {
                    const enrolled = parseInt(b.enrolled_count || 0);
                    const cap = parseInt(b.capacity || 30);
                    const pct = Math.min(100, Math.round((enrolled / cap) * 100));
                    const barColor = pct >= 90 ? 'var(--ims-danger)' : pct >= 60 ? 'var(--ims-warning)' : 'var(--ims-primary)';

                    return (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{b.name}</div>
                          {b.timing && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                              <Clock size={12} /> {b.timing}
                            </div>
                          )}
                        </td>
                        <td>{b.course_name || 'General / All'}</td>
                        <td>{b.teacher_name || 'Unassigned'}</td>
                        <td style={{ width: '160px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                            <span>{enrolled} / {cap}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="ims-capacity-bar-container">
                            <div className="ims-capacity-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            <button
                              className="ims-btn ims-btn-secondary ims-btn-sm"
                              title="Edit Batch"
                              onClick={() => openEditBatchModal(b)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="ims-btn ims-btn-danger ims-btn-sm"
                              title="Delete Batch"
                              onClick={() => handleDeleteBatch(b)}
                            >
                              <Trash2 size={14} />
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
        </div>
      </div>

      {/* Add / Edit Course Modal */}
      {showCourseModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3>{editingCourse ? `Edit Course — ${editingCourse.code}` : 'Add New Course'}</h3>
            <form onSubmit={handleSaveCourse}>
              <div className="ims-form-group">
                <label>Course Code *</label>
                <input type="text" className="ims-input" required placeholder="e.g. CS-101" value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} readOnly={!!editingCourse} />
              </div>
              <div className="ims-form-group">
                <label>Course Name *</label>
                <input type="text" className="ims-input" required placeholder="e.g. Web Development Bootcamp" value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Fee Amount (INR) *</label>
                  <input type="number" className="ims-input" required value={courseForm.fee_amount} onChange={(e) => setCourseForm({ ...courseForm, fee_amount: e.target.value })} />
                </div>
                <div className="ims-form-group">
                  <label>Duration (Months)</label>
                  <input type="number" className="ims-input" value={courseForm.duration_months} onChange={(e) => setCourseForm({ ...courseForm, duration_months: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowCourseModal(false)}>Cancel</button>
                <button type="submit" className="ims-btn ims-btn-primary">{editingCourse ? 'Save Changes' : 'Create Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Batch Modal */}
      {showBatchModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3>{editingBatch ? `Edit Batch — ${editingBatch.name}` : 'Add New Batch'}</h3>
            <form onSubmit={handleSaveBatch}>
              <div className="ims-form-group">
                <label>Batch Name *</label>
                <input type="text" className="ims-input" required placeholder="e.g. Morning Batch A" value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} />
              </div>

              {/* Time Slot Picker (Start Time & End Time) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Slot Start Time *</label>
                  <input
                    type="time"
                    className="ims-input"
                    required
                    value={batchForm.start_time}
                    onChange={(e) => setBatchForm({ ...batchForm, start_time: e.target.value })}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Slot End Time *</label>
                  <input
                    type="time"
                    className="ims-input"
                    required
                    value={batchForm.end_time}
                    onChange={(e) => setBatchForm({ ...batchForm, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Student Capacity</label>
                  <input type="number" className="ims-input" value={batchForm.capacity} onChange={(e) => setBatchForm({ ...batchForm, capacity: e.target.value })} />
                </div>
                <div className="ims-form-group">
                  <label>Assigned Teacher</label>
                  <select className="ims-select" value={batchForm.teacher_id} onChange={(e) => setBatchForm({ ...batchForm, teacher_id: e.target.value })}>
                    <option value="">Select Faculty...</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowBatchModal(false)}>Cancel</button>
                <button type="submit" className="ims-btn ims-btn-primary">{editingBatch ? 'Save Changes' : 'Create Batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

