import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { User, Phone, Mail, MapPin, GraduationCap, Calendar, Receipt, FileText, Printer, ArrowLeft } from 'lucide-react';

export const StudentProfileView = ({ studentId, onBack }) => {
  const { showToast } = useApp();
  const [student, setStudent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printDoc, setPrintDoc] = useState(null);

  useEffect(() => {
    if (studentId) {
      loadProfileData();
    }
  }, [studentId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const sData = await api.getStudent(studentId);
      setStudent(sData);

      const docs = await api.getDocuments({ student_id: studentId });
      setDocuments(docs || []);
    } catch (err) {
      showToast(err.message || 'Failed to load student profile.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);
  };

  if (loading) {
    return <div className="ims-card" style={{ padding: '3rem', textAlign: 'center' }}>Loading full student profile...</div>;
  }

  if (!student) {
    return <div className="ims-card" style={{ padding: '3rem', textAlign: 'center' }}>Student profile not found.</div>;
  }

  return (
    <div>
      {/* Top Bar */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="ims-btn ims-btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Directory
        </button>

        <button className="ims-btn ims-btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Print Full Profile
        </button>
      </div>

      {/* Main Single Scrollable Profile View */}
      <div className="ims-card" style={{ padding: '2rem' }}>
        {/* Header Profile Info */}
        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid var(--ims-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            {student.photo_url ? (
              <img src={student.photo_url} alt="" style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--ims-primary)' }} />
            ) : (
              <div className="ims-avatar" style={{ width: '100px', height: '100px', fontSize: '2.5rem', borderRadius: '12px' }}>
                {student.first_name?.charAt(0)}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
                  {student.first_name} {student.last_name}
                </h1>
                <div style={{ fontSize: '0.95rem', color: 'var(--ims-primary)', fontWeight: 700, marginTop: '0.2rem' }}>
                  Roll Number: {student.roll_no}
                </div>
              </div>

              <span className={`ims-badge ims-badge-${student.status === 'active' ? 'success' : 'danger'}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                Status: {student.status?.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem', fontSize: '0.88rem' }}>
              <div><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} /> Phone: {student.phone || 'N/A'}</div>
              <div><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} /> Email: {student.email || 'N/A'}</div>
              <div><User size={14} style={{ display: 'inline', marginRight: '4px' }} /> Guardian: {student.guardian_name || 'N/A'} ({student.guardian_phone || 'N/A'})</div>
              <div><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> Address: {student.address || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Academic & Financial Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--ims-border)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Enrolled Course</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.25rem' }}>{student.course_name || 'Unassigned'}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--ims-text-muted)', marginTop: '0.2rem' }}>Batch: {student.batch_name || 'Unassigned'}</div>
          </div>

          <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '0.78rem', color: '#1d4ed8', textTransform: 'uppercase', fontWeight: 700 }}>Total Net Fee</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e40af', marginTop: '0.25rem' }}>{formatCurrency(student.net_fee)}</div>
            <div style={{ fontSize: '0.82rem', color: '#1d4ed8', marginTop: '0.2rem' }}>Base: {formatCurrency(student.course_fee)} | Disc: {formatCurrency(student.discount_value)}</div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '1.25rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.78rem', color: '#15803d', textTransform: 'uppercase', fontWeight: 700 }}>Total Paid to Date</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#166534', marginTop: '0.25rem' }}>{formatCurrency(student.total_paid)}</div>
            <div style={{ fontSize: '0.82rem', color: '#15803d', marginTop: '0.2rem' }}>Receipts Issued: {documents.filter(d => d.doc_type === 'receipt').length}</div>
          </div>

          <div style={{ background: '#fef2f2', padding: '1.25rem', borderRadius: '10px', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '0.78rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 700 }}>Outstanding Balance</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>{formatCurrency(student.outstanding_balance)}</div>
            <div style={{ fontSize: '0.82rem', color: '#991b1b', marginTop: '0.2rem' }}>Status: {student.outstanding_balance <= 0 ? 'FULLY PAID' : 'PENDING'}</div>
          </div>
        </div>

        {/* Section 1: Complete Financial Ledger */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ borderBottom: '2px solid var(--ims-primary)', paddingBottom: '0.5rem', display: 'inline-block', marginBottom: '1rem' }}>
            <Receipt size={18} style={{ display: 'inline', marginRight: '6px' }} /> Financial Ledger & Payment History
          </h3>

          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Debit (₹)</th>
                  <th>Credit (₹)</th>
                  <th>Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {!student.ledger || student.ledger.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>No financial transactions logged yet.</td></tr>
                ) : (
                  student.ledger.map((entry, idx) => (
                    <tr key={idx}>
                      <td>{entry.date}</td>
                      <td style={{ fontWeight: 600 }}>{entry.reference}</td>
                      <td>{entry.description}</td>
                      <td style={{ color: entry.debit > 0 ? 'var(--ims-danger)' : 'inherit', fontWeight: entry.debit > 0 ? 600 : 400 }}>
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td style={{ color: entry.credit > 0 ? 'var(--ims-success)' : 'inherit', fontWeight: entry.credit > 0 ? 600 : 400 }}>
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(entry.running_balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Issued Documents & Reprint Actions */}
        <div>
          <h3 style={{ borderBottom: '2px solid var(--ims-primary)', paddingBottom: '0.5rem', display: 'inline-block', marginBottom: '1rem' }}>
            <FileText size={18} style={{ display: 'inline', marginRight: '6px' }} /> Issued Receipts & GST Tax Invoices
          </h3>

          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Doc Type</th>
                  <th>Doc Number</th>
                  <th>Date</th>
                  <th>Amount (₹)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Reprint Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>No receipts or invoices issued to this student yet.</td></tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={`${doc.doc_type}-${doc.id}`}>
                      <td>
                        <span className={`ims-badge ims-badge-${doc.doc_type === 'receipt' ? 'success' : 'primary'}`} style={{ textTransform: 'uppercase' }}>
                          {doc.doc_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{doc.doc_no}</td>
                      <td>{doc.doc_date}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(doc.amount)}</td>
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
                          <Printer size={14} /> Reprint Document
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

      {/* Printable Duplicate Document Modal */}
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
                <h2 style={{ margin: 0, textTransform: 'uppercase', color: 'var(--ims-primary)' }}>REPRINT DOCUMENT</h2>
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
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{printDoc.doc_type === 'receipt' ? 'Fee Payment Money Receipt' : 'Tuition Fee Tax Invoice'}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printDoc.amount)}</td>
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
    </div>
  );
};
