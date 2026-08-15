import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import { Plus, UserPlus, PhoneCall, Calendar, CheckCircle2, MessageSquare, ArrowRight, Pencil, Trash2, Search, Filter } from 'lucide-react';

export const EnquiriesView = () => {
  const { showToast, setCurrentView } = useApp();
  const [enquiries, setEnquiries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState('all'); // 'all', 'today', 'overdue'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [notesModalEnquiry, setNotesModalEnquiry] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteStatus, setNewNoteStatus] = useState('');
  const [newNoteNextDate, setNewNoteNextDate] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    course_id: '',
    source: 'Walk-in',
    status: 'New',
    next_follow_up_date: '',
    initial_note: '',
  });

  useEffect(() => {
    loadData();
    loadCourses();
  }, [statusFilter, followUpFilter]);

  const loadCourses = async () => {
    try {
      const res = await api.getCourses();
      setCourses(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setPermissionDenied(false);
    setError(null);
    try {
      const res = await api.getEnquiries({
        status: statusFilter,
        follow_up_date: followUpFilter,
        search: searchTerm,
      });
      setEnquiries(res || []);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load student enquiries.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingEnquiry(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      course_id: '',
      source: 'Walk-in',
      status: 'New',
      next_follow_up_date: new Date().toISOString().split('T')[0],
      initial_note: '',
    });
    setShowModal(true);
  };

  const openEditModal = (e) => {
    setEditingEnquiry(e);
    setFormData({
      name: e.name || '',
      phone: e.phone || '',
      email: e.email || '',
      course_id: e.course_id || '',
      source: e.source || 'Walk-in',
      status: e.status || 'New',
      next_follow_up_date: e.next_follow_up_date || '',
      initial_note: '',
    });
    setShowModal(true);
  };

  const handleSaveEnquiry = async (evt) => {
    evt.preventDefault();
    try {
      if (editingEnquiry) {
        await api.updateEnquiry(editingEnquiry.id, formData);
        showToast('Student enquiry updated.');
      } else {
        await api.createEnquiry(formData);
        showToast('New enquiry registered.');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const openNotesModal = (e) => {
    setNotesModalEnquiry(e);
    setNewNoteText('');
    setNewNoteStatus(e.status || 'Follow-up');
    setNewNoteNextDate(e.next_follow_up_date || '');
  };

  const handleAddNote = async (evt) => {
    evt.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      await api.addEnquiryNote(notesModalEnquiry.id, {
        text: newNoteText.trim(),
        status: newNoteStatus,
        next_follow_up_date: newNoteNextDate,
      });
      showToast('Follow-up note logged successfully.');
      setNewNoteText('');
      
      // Refresh modal data
      const updated = await api.getEnquiry(notesModalEnquiry.id);
      setNotesModalEnquiry(updated);
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleConvertToAdmission = (enquiry) => {
    // Store prefilled data in localStorage or state for StudentsView
    const prefillData = {
      first_name: enquiry.name.split(' ')[0] || enquiry.name,
      last_name: enquiry.name.split(' ').slice(1).join(' ') || '',
      phone: enquiry.phone || '',
      email: enquiry.email || '',
      course_id: enquiry.course_id || '',
      enquiry_id: enquiry.id,
    };
    sessionStorage.setItem('ims_prefill_admission', JSON.stringify(prefillData));
    showToast('Redirecting to Student Admission form...');
    setCurrentView('students');
  };

  const handleDeleteEnquiry = async (enquiry) => {
    if (!window.confirm(`Delete enquiry for "${enquiry.name}"?`)) return;
    try {
      await api.deleteEnquiry(enquiry.id);
      showToast('Enquiry deleted.');
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const sourcesList = ['Walk-in', 'Phone', 'Referral', 'Online', 'Other'];
  const statusList = ['New', 'Follow-up', 'Converted', 'Lost'];

  return (
    <div>
      <div className="ims-card">
        <div className="ims-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Student Enquiries (Pre-admission Leads)</h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--ims-text-muted)' }}>
              Manage prospective student inquiries, log follow-ups, and convert leads to full admission.
            </div>
          </div>

          <button className="ims-btn ims-btn-primary" onClick={openAddModal}>
            <UserPlus size={16} /> New Student Enquiry
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ims-border)' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Search Lead</label>
            <input
              type="text"
              className="ims-input"
              placeholder="Search by lead name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
            />
          </div>

          <div style={{ width: '160px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Status</label>
            <select className="ims-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {statusList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Follow-Up Schedule</label>
            <select className="ims-select" value={followUpFilter} onChange={(e) => setFollowUpFilter(e.target.value)}>
              <option value="all">All Follow-ups</option>
              <option value="today">Calls Due Today</option>
              <option value="overdue">Overdue Calls</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={loadData}>Apply Filter</button>
          </div>
        </div>

        {/* Enquiries Table */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading enquiries...</div>
        ) : (
          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Contact Info</th>
                  <th>Interested Course</th>
                  <th>Source</th>
                  <th>Next Follow-up</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No student enquiries found.</td></tr>
                ) : (
                  enquiries.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{e.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>Registered by: {e.created_by_name || 'Staff'}</div>
                      </td>
                      <td>
                        <div>{e.phone}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}>{e.email || 'N/A'}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{e.course_name || 'Unspecified'}</td>
                      <td><span className="ims-badge ims-badge-secondary">{e.source}</span></td>
                      <td>
                        {e.next_follow_up_date ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: e.next_follow_up_date <= new Date().toISOString().split('T')[0] ? '#dc2626' : 'inherit', fontWeight: e.next_follow_up_date <= new Date().toISOString().split('T')[0] ? 700 : 400 }}>
                            <Calendar size={14} /> {e.next_follow_up_date}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ims-text-muted)' }}>None</span>
                        )}
                      </td>
                      <td>
                        <span className={`ims-badge ims-badge-${e.status === 'Converted' ? 'success' : e.status === 'Lost' ? 'danger' : e.status === 'Follow-up' ? 'warning' : 'primary'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            title="Log Follow-up Notes"
                            onClick={() => openNotesModal(e)}
                          >
                            <MessageSquare size={14} /> Notes ({e.notes?.length || 0})
                          </button>
                          {e.status !== 'Converted' && (
                            <button
                              className="ims-btn ims-btn-primary ims-btn-sm"
                              title="Convert to Student Admission"
                              onClick={() => handleConvertToAdmission(e)}
                            >
                              <ArrowRight size={14} /> Convert
                            </button>
                          )}
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            title="Edit Enquiry"
                            onClick={() => openEditModal(e)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="ims-btn ims-btn-danger ims-btn-sm"
                            title="Delete Enquiry"
                            onClick={() => handleDeleteEnquiry(e)}
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

      {/* Add / Edit Enquiry Modal */}
      {showModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3>{editingEnquiry ? `Edit Enquiry — ${editingEnquiry.name}` : 'New Student Enquiry'}</h3>
            <form onSubmit={handleSaveEnquiry}>
              <div className="ims-form-group">
                <label>Lead Full Name *</label>
                <input
                  type="text"
                  className="ims-input"
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    className="ims-input"
                    required
                    placeholder="+91 Mobile Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="ims-input"
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Interested Course</label>
                  <select
                    className="ims-select"
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  >
                    <option value="">Select Course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="ims-form-group">
                  <label>Enquiry Source</label>
                  <select
                    className="ims-select"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    {sourcesList.map((src) => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Status</label>
                  <select
                    className="ims-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statusList.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="ims-form-group">
                  <label>Next Follow-up Date</label>
                  <input
                    type="date"
                    className="ims-input"
                    value={formData.next_follow_up_date}
                    onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                  />
                </div>
              </div>

              {!editingEnquiry && (
                <div className="ims-form-group">
                  <label>Initial Follow-up Note</label>
                  <textarea
                    className="ims-input"
                    rows="2"
                    placeholder="Enter initial conversation details..."
                    value={formData.initial_note}
                    onChange={(e) => setFormData({ ...formData, initial_note: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="ims-btn ims-btn-primary">{editingEnquiry ? 'Save Changes' : 'Register Enquiry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-Up Notes Timeline Modal */}
      {notesModalEnquiry && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content" style={{ maxWidth: '650px' }}>
            <h3>Follow-up History — {notesModalEnquiry.name} ({notesModalEnquiry.phone})</h3>
            <p style={{ color: 'var(--ims-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Course: <strong>{notesModalEnquiry.course_name || 'Unspecified'}</strong> | Source: <strong>{notesModalEnquiry.source}</strong>
            </p>

            {/* Existing Notes Timeline */}
            <div style={{ maxHeight: '250px', overflowY: 'auto', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ims-border)', marginBottom: '1.25rem' }}>
              {!notesModalEnquiry.notes || notesModalEnquiry.notes.length === 0 ? (
                <div style={{ color: 'var(--ims-text-muted)', fontSize: '0.88rem', textAlign: 'center' }}>No follow-up notes logged yet.</div>
              ) : (
                notesModalEnquiry.notes.map((note, idx) => (
                  <div key={idx} style={{ marginBottom: '0.85rem', paddingBottom: '0.85rem', borderBottom: idx < notesModalEnquiry.notes.length - 1 ? '1px dashed #cbd5e1' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--ims-text-muted)', marginBottom: '0.25rem' }}>
                      <strong>{note.author || 'Staff'}</strong>
                      <span>{note.date}</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#1e293b' }}>{note.text}</div>
                  </div>
                ))
              )}
            </div>

            {/* Log New Note Form */}
            <form onSubmit={handleAddNote} style={{ borderTop: '1px solid var(--ims-border)', paddingTop: '1rem' }}>
              <div className="ims-form-group">
                <label>Add New Follow-Up Note *</label>
                <textarea
                  className="ims-input"
                  rows="3"
                  required
                  placeholder="Enter details of conversation / call outcome..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Update Status</label>
                  <select className="ims-select" value={newNoteStatus} onChange={(e) => setNewNoteStatus(e.target.value)}>
                    {statusList.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="ims-form-group">
                  <label>Next Follow-up Date</label>
                  <input
                    type="date"
                    className="ims-input"
                    value={newNoteNextDate}
                    onChange={(e) => setNewNoteNextDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setNotesModalEnquiry(null)}>Close</button>
                <button type="submit" className="ims-btn ims-btn-primary">Log Note & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
