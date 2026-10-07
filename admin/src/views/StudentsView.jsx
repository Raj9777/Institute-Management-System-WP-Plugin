import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { PhotoUpload } from '../components/PhotoUpload';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import { AdmissionAgreementPrintModal } from '../components/AdmissionAgreementPrintModal';
import { StudentProfileView } from './StudentProfileView';
import { Plus, Search, Download, Phone, Mail, Pencil, Trash2, Receipt, AlertCircle, FileText, Eye, X, Calendar, Printer } from 'lucide-react';

export const StudentsView = () => {
  const { showToast } = useApp();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState(null);
  const [prefillEnquiryId, setPrefillEnquiryId] = useState(null);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [ledgerStudent, setLedgerStudent] = useState(null);
  const [ledgerTab, setLedgerTab] = useState('ledger'); // 'ledger' | 'documents'
  const [studentDocs, setStudentDocs] = useState([]);
  const [printDoc, setPrintDoc] = useState(null);

  // Admission Agreement State
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementStudent, setAgreementStudent] = useState(null);
  const [printAgreementData, setPrintAgreementData] = useState(null);
  const [agreementForm, setAgreementForm] = useState({
    agreement_date: new Date().toISOString().split('T')[0],
    prev_invoice_no: '',
    inv_val: 0,
    exam_fee: 0,
    caution_deposit: 0,
    first_receipt_no: '',
    first_receipt_val: 0,
    first_receipt_date: '',
    second_receipt_no: '',
    second_receipt_date: '',
    instalments: [
      { name: '1st Instalment', due_date: '', amount: 0, paid_date: '' },
      { name: '2nd Instalment', due_date: '', amount: 0, paid_date: '' },
      { name: '3rd Instalment', due_date: '', amount: 0, paid_date: '' },
    ]
  });

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    dob: '',
    phone: '',
    email: '',
    address: '',
    guardian_name: '',
    guardian_phone: '',
    course_id: '',
    batch_id: '',
    course_fee: 0,
    discount_type: 'percentage', // 'percentage' | 'amount'
    discount_value: 0,
    photo_url: '',
    status: 'active',
  });

  useEffect(() => {
    loadData();

    // Check for enquiry conversion prefill
    const prefillStr = sessionStorage.getItem('ims_prefill_admission');
    if (prefillStr) {
      try {
        const pf = JSON.parse(prefillStr);
        setFormData((prev) => ({
          ...prev,
          first_name: pf.first_name || '',
          last_name: pf.last_name || '',
          phone: pf.phone || '',
          email: pf.email || '',
          course_id: pf.course_id || '',
        }));
        setPrefillEnquiryId(pf.enquiry_id);
        setShowModal(true);
        sessionStorage.removeItem('ims_prefill_admission');
        showToast('Form pre-filled from enquiry details. Complete admission to convert lead.');
      } catch (e) {
        console.error(e);
      }
    }
  }, [selectedBatch]);

  const loadData = async (overrideSearch) => {
    const searchVal = overrideSearch !== undefined ? overrideSearch : search;
    setLoading(true);
    setPermissionDenied(false);
    setError(null);
    try {
      const [studRes, courseRes, batchRes] = await Promise.all([
        api.getStudents({ search: searchVal, batch_id: selectedBatch }),
        api.getCourses(),
        api.getBatches(),
      ]);
      setStudents(studRes || []);
      setCourses(courseRes || []);
      setBatches(batchRes || []);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load student data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (val === '') {
      loadData('');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      first_name: '', last_name: '', gender: 'male', dob: '',
      phone: '', email: '', address: '', guardian_name: '', guardian_phone: '',
      course_id: '', batch_id: '', course_fee: 0, discount_type: 'percentage', discount_value: 0,
      photo_url: '', status: 'active'
    });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      gender: student.gender || 'male',
      dob: student.dob || '',
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      guardian_name: student.guardian_name || '',
      guardian_phone: student.guardian_phone || '',
      course_id: student.course_id || '',
      batch_id: student.batch_id || '',
      course_fee: student.course_fee || 0,
      discount_type: student.discount_type || 'percentage',
      discount_value: student.discount_value || 0,
      photo_url: student.photo_url || '',
      status: student.status || 'active',
    });
    setShowModal(true);
  };

  const openLedgerModal = async (studentId) => {
    try {
      const fullStud = await api.getStudent(studentId);
      setLedgerStudent(fullStud);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleCourseChange = (courseId) => {
    const selectedCourse = courses.find((c) => c.id == courseId);
    setFormData((prev) => ({
      ...prev,
      course_id: courseId,
      batch_id: '', // reset batch when course changes
      course_fee: selectedCourse ? parseFloat(selectedCourse.fee_amount) : 0,
    }));
  };

  // Calculated Net Fee (read-only)
  const calculateNetFee = () => {
    const fee = parseFloat(formData.course_fee) || 0;
    const disc = parseFloat(formData.discount_value) || 0;
    let net = fee;
    if (formData.discount_type === 'percentage') {
      net = fee - (fee * (disc / 100));
    } else {
      net = fee - disc;
    }
    return Math.max(0, Math.round(net * 100) / 100);
  };

  const isDiscountOverFee = () => {
    const fee = parseFloat(formData.course_fee) || 0;
    const disc = parseFloat(formData.discount_value) || 0;
    if (formData.discount_type === 'percentage') {
      return disc > 100;
    }
    return disc > fee;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, formData);
        showToast('Student profile updated successfully!');
      } else {
        const res = await api.createStudent(formData);
        showToast(`Student Admitted! Roll No: ${res.roll_no} | Net Fee: ₹${res.net_fee}`);
        if (prefillEnquiryId) {
          try {
            await api.updateEnquiry(prefillEnquiryId, {
              status: 'Converted',
              converted_student_id: res.id,
            });
            showToast('Student Enquiry status updated to Converted!');
          } catch (eErr) {
            console.error(eErr);
          }
          setPrefillEnquiryId(null);
        }
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Are you sure you want to delete student "${student.first_name} ${student.last_name}" (${student.roll_no})?`)) {
      return;
    }
    try {
      await api.deleteStudent(student.id);
      showToast('Student record deleted.');
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const openAgreementModal = (student) => {
    setAgreementStudent(student);
    setAgreementForm({
      agreement_date: new Date().toISOString().split('T')[0],
      prev_invoice_no: '',
      inv_val: parseFloat(student.net_fee || 0),
      exam_fee: 0,
      caution_deposit: 0,
      first_receipt_no: '',
      first_receipt_val: 0,
      first_receipt_date: '',
      second_receipt_no: '',
      second_receipt_date: '',
      instalments: [
        { name: '1st Instalment', due_date: '', amount: parseFloat(student.net_fee || 0), paid_date: '' },
        { name: '2nd Instalment', due_date: '', amount: 0, paid_date: '' },
        { name: '3rd Instalment', due_date: '', amount: 0, paid_date: '' },
      ]
    });
    setShowAgreementModal(true);
  };

  const handleAddInstalment = () => {
    const nextIdx = agreementForm.instalments.length + 1;
    const sfx = nextIdx === 1 ? 'st' : nextIdx === 2 ? 'nd' : nextIdx === 3 ? 'rd' : 'th';
    setAgreementForm({
      ...agreementForm,
      instalments: [
        ...agreementForm.instalments,
        { name: `${nextIdx}${sfx} Instalment`, due_date: '', amount: 0, paid_date: '' }
      ]
    });
  };

  const handleRemoveInstalment = (idx) => {
    const updated = agreementForm.instalments.filter((_, i) => i !== idx);
    setAgreementForm({ ...agreementForm, instalments: updated });
  };

  const handleInstalmentChange = (idx, field, val) => {
    const updated = [...agreementForm.instalments];
    updated[idx] = { ...updated[idx], [field]: val };
    setAgreementForm({ ...agreementForm, instalments: updated });
  };

  const handleSaveAgreement = async (e) => {
    e.preventDefault();
    if (!agreementStudent) return;
    try {
      const res = await api.createAgreement({
        student_id: agreementStudent.id,
        ...agreementForm
      });
      showToast(res.message || 'Admission Agreement created successfully!');
      setShowAgreementModal(false);
      handleOpenPrintAgreement(res.id);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleOpenPrintAgreement = async (agreementId) => {
    try {
      const data = await api.getAgreementPrint(agreementId);
      setPrintAgreementData(data);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const openStudentLedger = async (student) => {
    setLedgerStudent(student);
    setLedgerTab('ledger');
    try {
      const [fullProfile, docs] = await Promise.all([
        api.getStudent(student.id).catch(() => null),
        api.getDocuments({ student_id: student.id }).catch(() => [])
      ]);
      if (fullProfile) {
        setLedgerStudent(fullProfile);
      }
      setStudentDocs(docs || []);
    } catch (err) {
      console.error('Failed to load student ledger:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.getExportCSV('students');
      const csvContent = "data:text/csv;charset=utf-8," +
        ["Roll No,First Name,Last Name,Gender,Phone,Email,Status,Net Fee,Outstanding"]
          .concat(res.records.map(r => `${r.roll_no},${r.first_name},${r.last_name},${r.gender},${r.phone},${r.email},${r.status},${r.net_fee},${r.outstanding_balance}`))
          .join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", res.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Filter batches by selected course
  const selectedCourseObj = courses.find((c) => c.id == formData.course_id);
  const availableBatches = batches.filter((b) => !formData.course_id || b.course_id == formData.course_id);

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  if (selectedStudentProfileId) {
    return <StudentProfileView studentId={selectedStudentProfileId} onBack={() => setSelectedStudentProfileId(null)} />;
  }

  return (
    <div>
      <div className="ims-card">
        <div className="ims-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="ims-input"
                placeholder="Search by name, roll no, phone, email, course..."
                value={search}
                onChange={handleSearchChange}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ims-text-muted)' }} />
            </div>
            <select
              className="ims-select"
              style={{ width: '200px' }}
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button type="submit" className="ims-btn ims-btn-secondary">Search</button>
          </form>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="ims-btn ims-btn-secondary" onClick={handleExportCSV}>
              <Download size={16} /> Export CSV
            </button>
            <button className="ims-btn ims-btn-primary" onClick={openAddModal}>
              <Plus size={16} /> Student Admission
            </button>
          </div>
        </div>

        <div className="ims-table-wrapper">
          <table className="ims-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Course & Batch</th>
                <th>Contact</th>
                <th>Net Fee (₹)</th>
                <th>Outstanding (₹)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--ims-text-muted)' }}>
                    No student records found.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <button
                        className="ims-btn ims-btn-secondary ims-btn-sm"
                        style={{ fontWeight: 700, color: 'var(--ims-primary)', border: 'none', background: 'none', padding: 0 }}
                        title="View Student Ledger"
                        onClick={() => openLedgerModal(s.id)}
                      >
                        {s.roll_no}
                      </button>
                    </td>
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
                          <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)', textTransform: 'capitalize' }}>{s.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.course_name || 'N/A'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}>{s.batch_name || 'Unassigned'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}><Phone size={12} /> {s.phone || 'N/A'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}><Mail size={12} /> {s.email || 'N/A'}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(s.net_fee || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: parseFloat(s.outstanding_balance || 0) > 0 ? 'var(--ims-danger)' : 'var(--ims-success)' }}>
                      ₹{parseFloat(s.outstanding_balance || 0).toLocaleString('en-IN')}
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
                          onClick={() => setSelectedStudentProfileId(s.id)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="ims-btn ims-btn-secondary ims-btn-sm"
                          title="Student Ledger"
                          onClick={() => openStudentLedger(s)}
                        >
                          <Receipt size={14} />
                        </button>
                        <button
                          className="ims-btn ims-btn-secondary ims-btn-sm"
                          title="Admission Agreement / Fee Plan"
                          onClick={() => openAgreementModal(s)}
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          className="ims-btn ims-btn-secondary ims-btn-sm"
                          title="Edit Student"
                          onClick={() => openEditModal(s)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="ims-btn ims-btn-danger ims-btn-sm"
                          title="Delete Student"
                          onClick={() => handleDeleteStudent(s)}
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

      {/* Student Admission / Edit Modal */}
      {showModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content" style={{ maxWidth: '650px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.25rem' }}>
              {editingStudent ? `Edit Student — ${editingStudent.roll_no}` : 'Student Admission Form'}
            </h3>
            <form onSubmit={handleSubmit}>
              {/* Course & Batch Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Course *</label>
                  <select
                    className="ims-select"
                    required
                    value={formData.course_id}
                    onChange={(e) => handleCourseChange(e.target.value)}
                  >
                    <option value="">Select Course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                  {selectedCourseObj && (
                    <small style={{ color: 'var(--ims-primary)', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
                      Duration: {selectedCourseObj.duration_months} Months
                    </small>
                  )}
                </div>

                <div className="ims-form-group">
                  <label>Batch *</label>
                  <select
                    className="ims-select"
                    required
                    disabled={!formData.course_id}
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                  >
                    <option value="">{formData.course_id ? 'Select Batch...' : 'Choose Course First'}</option>
                    {availableBatches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.timing || 'Standard'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financials: Course Fee, Discount & Net Fee */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ims-border)', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div className="ims-form-group">
                    <label style={{ fontSize: '0.82rem' }}>Base Course Fee (₹) *</label>
                    <input
                      type="number"
                      className="ims-input"
                      required
                      value={formData.course_fee}
                      onChange={(e) => setFormData({ ...formData, course_fee: e.target.value })}
                    />
                  </div>

                  <div className="ims-form-group">
                    <label style={{ fontSize: '0.82rem' }}>Discount Type & Value</label>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <select
                        className="ims-select"
                        style={{ width: '70px', padding: '4px' }}
                        value={formData.discount_type}
                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                      >
                        <option value="percentage">%</option>
                        <option value="amount">₹</option>
                      </select>
                      <input
                        type="number"
                        className="ims-input"
                        style={{ flex: 1 }}
                        placeholder="0"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="ims-form-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ims-primary)' }}>Agreed Net Fee (₹)</label>
                    <input
                      type="number"
                      className="ims-input"
                      readOnly
                      style={{ background: '#e2e8f0', fontWeight: 700, color: 'var(--ims-primary)' }}
                      value={calculateNetFee()}
                    />
                  </div>
                </div>

                {isDiscountOverFee() && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    <AlertCircle size={14} /> Discount exceeds course fee! Net Fee clamped to ₹0.
                  </div>
                )}
              </div>

              {/* Student Personal Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    className="ims-input"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    className="ims-input"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Gender</label>
                  <select
                    className="ims-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="ims-form-group">
                  <label>Date of Birth</label>
                  {/* Excluded from back-date restriction: Date of Birth is inherently a past date */}
                  <input
                    type="date"
                    className="ims-input"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="ims-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="ims-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Guardian Name</label>
                  <input
                    type="text"
                    className="ims-input"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Guardian Phone</label>
                  <input
                    type="text"
                    className="ims-input"
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  />
                </div>
              </div>

              <PhotoUpload
                value={formData.photo_url}
                onChange={(url) => setFormData({ ...formData, photo_url: url })}
                label="Student Photo"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ims-btn ims-btn-primary">
                  {editingStudent ? 'Save Profile Changes' : 'Confirm Student Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Ledger & Documents Modal */}
      {ledgerStudent && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--ims-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Student Financial Record & Documents</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--ims-text-muted)' }}>
                  {ledgerStudent.first_name} {ledgerStudent.last_name} ({ledgerStudent.roll_no}) — Course: {ledgerStudent.course_name || 'N/A'}
                </div>
              </div>
              <div style={{ background: '#fef2f2', padding: '8px 16px', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 700 }}>Outstanding Balance</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>₹{parseFloat(ledgerStudent.outstanding_balance || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                className={`ims-btn ims-btn-sm ${ledgerTab === 'ledger' ? 'ims-btn-primary' : 'ims-btn-secondary'}`}
                onClick={() => setLedgerTab('ledger')}
              >
                Financial Ledger
              </button>
              <button
                className={`ims-btn ims-btn-sm ${ledgerTab === 'documents' ? 'ims-btn-primary' : 'ims-btn-secondary'}`}
                onClick={() => setLedgerTab('documents')}
              >
                Issued Documents ({studentDocs.length})
              </button>
            </div>

            {ledgerTab === 'ledger' ? (
              <div className="ims-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="ims-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Description</th>
                      <th>Debit (₹)</th>
                      <th>Credit (₹)</th>
                      <th>Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!ledgerStudent.ledger || ledgerStudent.ledger.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>No financial transactions logged yet.</td></tr>
                    ) : (
                      ledgerStudent.ledger.map((entry, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: '0.82rem' }}>{entry.date}</td>
                          <td style={{ fontWeight: 600 }}>{entry.reference}</td>
                          <td>{entry.description}</td>
                          <td style={{ color: entry.debit > 0 ? 'var(--ims-danger)' : 'inherit', fontWeight: entry.debit > 0 ? 600 : 400 }}>
                            {entry.debit > 0 ? `₹${parseFloat(entry.debit).toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td style={{ color: entry.credit > 0 ? 'var(--ims-success)' : 'inherit', fontWeight: entry.credit > 0 ? 600 : 400 }}>
                            {entry.credit > 0 ? `₹${parseFloat(entry.credit).toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{parseFloat(entry.running_balance).toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ims-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="ims-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Doc Number</th>
                      <th>Date</th>
                      <th>Amount (₹)</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentDocs.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>No documents issued to this student yet.</td></tr>
                    ) : (
                      studentDocs.map((doc) => (
                        <tr key={`${doc.doc_type}-${doc.id}`}>
                          <td>
                            <span className={`ims-badge ims-badge-${doc.doc_type === 'receipt' ? 'success' : 'primary'}`} style={{ textTransform: 'uppercase' }}>
                              {doc.doc_type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{doc.doc_no}</td>
                          <td>{doc.doc_date}</td>
                          <td style={{ fontWeight: 700 }}>₹{parseFloat(doc.amount).toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`ims-badge ims-badge-${doc.status === 'paid' ? 'success' : 'warning'}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="ims-btn ims-btn-secondary ims-btn-sm"
                              onClick={() => setPrintDoc({ ...doc, isDuplicate: true })}
                            >
                              <Receipt size={14} /> Reprint
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="ims-btn ims-btn-secondary" onClick={() => setLedgerStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Modal inside StudentsView */}
      {printDoc && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content" style={{ maxWidth: '650px', background: '#fff', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '25px',
              border: '2px solid #dc2626',
              color: '#dc2626',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '1px',
              transform: 'rotate(5deg)'
            }}>
              DUPLICATE COPY
            </div>

            <div className="ims-printable-area" style={{ border: '2px solid #000', padding: '1.75rem', fontFamily: 'sans-serif' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, textTransform: 'uppercase', color: 'var(--ims-primary)' }}>DOCUMENT REPRINT</h2>
                <div style={{ fontSize: '0.85rem' }}>{printDoc.doc_type?.toUpperCase()} — {printDoc.doc_no}</div>
                <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', marginTop: '4px' }}>*** DUPLICATE COPY ***</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
                <div>
                  <strong>Document No:</strong> {printDoc.doc_no}<br />
                  <strong>Date:</strong> {printDoc.doc_date}<br />
                  <strong>Status:</strong> {printDoc.status?.toUpperCase()}
                </div>
                <div>
                  <strong>Student Name:</strong> {printDoc.student_name}<br />
                  <strong>Roll Number:</strong> {printDoc.roll_no}<br />
                  <strong>Course:</strong> {printDoc.course_name}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Description</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{printDoc.doc_type === 'receipt' ? 'Fee Payment Receipt' : 'Tuition Fee Tax Invoice'}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(printDoc.amount).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px dashed #000', paddingTop: '0.5rem' }}>
                <div><strong>Original Issue Date:</strong> {printDoc.doc_date}</div>
                <div><strong>Authorized Signature:</strong> _______________</div>
              </div>
            </div>

            <div className="ims-no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="ims-btn ims-btn-secondary" onClick={() => setPrintDoc(null)}>Close</button>
              <button className="ims-btn ims-btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Duplicate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admission Agreement Modal */}
      {showAgreementModal && agreementStudent && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content" style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>
                Issue Admission Agreement — {agreementStudent.first_name} {agreementStudent.last_name} ({agreementStudent.roll_no})
              </h3>
              <button className="ims-btn ims-btn-secondary ims-btn-sm" onClick={() => setShowAgreementModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAgreement}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="ims-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Agreement Date *</label>
                  <input
                    type="date"
                    className="ims-input"
                    required
                    value={agreementForm.agreement_date}
                    onChange={(e) => setAgreementForm({ ...agreementForm, agreement_date: e.target.value })}
                  />
                </div>
                <div className="ims-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>If Upgrade Prev. Inv. No.</label>
                  <input
                    type="text"
                    className="ims-input"
                    placeholder="e.g. ADM-00005 / N/A"
                    value={agreementForm.prev_invoice_no}
                    onChange={(e) => setAgreementForm({ ...agreementForm, prev_invoice_no: e.target.value })}
                  />
                </div>
                <div className="ims-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Total Invoice Value (₹) *</label>
                  <input
                    type="number"
                    className="ims-input"
                    required
                    value={agreementForm.inv_val}
                    onChange={(e) => setAgreementForm({ ...agreementForm, inv_val: e.target.value })}
                  />
                </div>
              </div>

              {/* Instalments Table Section */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a' }}>Fee Instalment Schedule</h4>
                  <button type="button" className="ims-btn ims-btn-secondary ims-btn-sm" onClick={handleAddInstalment}>
                    <Plus size={14} /> Add Instalment Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {agreementForm.instalments.map((inst, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="ims-input"
                        placeholder="Instalment Name"
                        value={inst.name}
                        onChange={(e) => handleInstalmentChange(idx, 'name', e.target.value)}
                      />
                      <input
                        type="date"
                        className="ims-input"
                        value={inst.due_date}
                        onChange={(e) => handleInstalmentChange(idx, 'due_date', e.target.value)}
                      />
                      <input
                        type="number"
                        className="ims-input"
                        placeholder="Amount (₹)"
                        value={inst.amount}
                        onChange={(e) => handleInstalmentChange(idx, 'amount', e.target.value)}
                      />
                      <input
                        type="text"
                        className="ims-input"
                        placeholder="Paid Date/Status"
                        value={inst.paid_date}
                        onChange={(e) => handleInstalmentChange(idx, 'paid_date', e.target.value)}
                      />
                      {agreementForm.instalments.length > 1 && (
                        <button type="button" className="ims-btn ims-btn-danger ims-btn-sm" onClick={() => handleRemoveInstalment(idx)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Summary Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="ims-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Exam Fee (₹)</label>
                  <input
                    type="number"
                    className="ims-input"
                    placeholder="0"
                    value={agreementForm.exam_fee}
                    onChange={(e) => setAgreementForm({ ...agreementForm, exam_fee: e.target.value })}
                  />
                </div>
                <div className="ims-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Caution Deposit (₹)</label>
                  <input
                    type="number"
                    className="ims-input"
                    placeholder="0"
                    value={agreementForm.caution_deposit}
                    onChange={(e) => setAgreementForm({ ...agreementForm, caution_deposit: e.target.value })}
                  />
                </div>
              </div>

              {/* Linked Receipts Section */}
              <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '6px', border: '1px solid #fef3c7', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#b45309', marginBottom: '0.5rem' }}>
                  Linked Receipt References (Optional)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="ims-input"
                    placeholder="First Receipt No."
                    value={agreementForm.first_receipt_no}
                    onChange={(e) => setAgreementForm({ ...agreementForm, first_receipt_no: e.target.value })}
                  />
                  <input
                    type="number"
                    className="ims-input"
                    placeholder="Value (₹)"
                    value={agreementForm.first_receipt_val}
                    onChange={(e) => setAgreementForm({ ...agreementForm, first_receipt_val: e.target.value })}
                  />
                  <input
                    type="date"
                    className="ims-input"
                    value={agreementForm.first_receipt_date}
                    onChange={(e) => setAgreementForm({ ...agreementForm, first_receipt_date: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="ims-input"
                    placeholder="Second Receipt No."
                    value={agreementForm.second_receipt_no}
                    onChange={(e) => setAgreementForm({ ...agreementForm, second_receipt_no: e.target.value })}
                  />
                  <input
                    type="date"
                    className="ims-input"
                    value={agreementForm.second_receipt_date}
                    onChange={(e) => setAgreementForm({ ...agreementForm, second_receipt_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowAgreementModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ims-btn ims-btn-primary">
                  Save & Print Admission Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Admission Agreement Modal */}
      {printAgreementData && (
        <AdmissionAgreementPrintModal
          agreementData={printAgreementData}
          onClose={() => setPrintAgreementData(null)}
        />
      )}
    </div>
  );
};
