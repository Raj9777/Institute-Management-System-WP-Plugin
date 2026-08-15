import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { AccessDenied } from '../components/AccessDenied';
import { ErrorState } from '../components/ErrorState';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { IndianRupee, Plus, Receipt, FileText, RotateCcw, Download, Printer, Pencil, Trash2, Search, CheckCircle, X, Calendar } from 'lucide-react';

const ReceiptPrintModal = ({ receiptData, onClose }) => {
  if (!receiptData) return null;

  const r = receiptData.receipt || {};
  const s = receiptData.student || {};
  const inst = receiptData.settings || {};
  const fb = r.fee_breakdown || {};
  const isDuplicate = receiptData.isDuplicate;

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="ims-modal-overlay ims-receipt-modal-overlay">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .ims-receipt-printable-area, .ims-receipt-printable-area * {
            visibility: visible !important;
          }
          .ims-receipt-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .ims-receipt-modal-overlay {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
          }
          .ims-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="ims-modal-content" style={{ maxWidth: '850px', background: '#fff', padding: '1.5rem', color: '#0f172a', position: 'relative' }}>
        {isDuplicate && (
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
            transform: 'rotate(5deg)',
            zIndex: 10
          }}>
            DUPLICATE COPY
          </div>
        )}

        <div className="ims-receipt-printable-area" style={{ border: '2px solid #1e293b', padding: '1.25rem', borderRadius: '4px', background: '#fff', fontFamily: 'Arial, sans-serif' }}>
          
          {/* Top Header Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e293b', paddingBottom: '1rem', marginBottom: '1rem' }}>
            {/* Left: Boxed Receipt Title */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ border: '3px double #1e293b', padding: '0.4rem 1.2rem', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                RECEIPT
              </div>
              {isDuplicate && (
                <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem', marginTop: '4px' }}>*** DUPLICATE COPY ***</div>
              )}
            </div>

            {/* Middle/Right: White-Labeled Institute Branding */}
            <div style={{ textAlign: 'right', flex: 1, paddingLeft: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                {inst.logo_url && (
                  <img src={inst.logo_url} alt="Logo" style={{ maxHeight: '55px', maxWidth: '150px', objectFit: 'contain' }} />
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                    {inst.institute_name || 'Institute Name'}
                  </h2>
                  {inst.tagline && <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>{inst.tagline}</div>}
                  {inst.website && <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>{inst.website}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid (Top-Right info table format matching paper receipt) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <table style={{ borderCollapse: 'collapse', border: '1px solid #1e293b', fontSize: '0.85rem', width: '280px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #1e293b', padding: '4px 8px', fontWeight: 700, background: '#f8fafc', width: '100px' }}>Receipt No.</td>
                  <td style={{ border: '1px solid #1e293b', padding: '4px 8px', fontWeight: 800, color: '#1e40af' }}>{r.receipt_no}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #1e293b', padding: '4px 8px', fontWeight: 700, background: '#f8fafc' }}>Date:</td>
                  <td style={{ border: '1px solid #1e293b', padding: '4px 8px', fontWeight: 700 }}>{r.payment_date}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #1e293b', padding: '4px 8px', fontWeight: 700, background: '#f8fafc' }}>INV. No.</td>
                  <td style={{ border: '1px solid #1e293b', padding: '4px 8px' }}>{r.invoice_no || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #1e293b', padding: '4px 8px', fontWeight: 700, background: '#f8fafc' }}>Roll No.</td>
                  <td style={{ border: '1px solid #1e293b', padding: '4px 8px', fontWeight: 700 }}>{s.roll_no || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sentence Line Block (Exact wording from paper receipt) */}
          <div style={{ fontSize: '0.92rem', lineHeight: '2rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700 }}>Received a sum of Rupees</span>
              <span style={{ flex: 1, borderBottom: '1px solid #0f172a', fontWeight: 800, padding: '0 0.5rem', color: '#1e40af' }}>
                {r.amount_in_words || 'Zero Rupees Only'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700 }}>from Mr/Mrs/Ms.</span>
              <span style={{ flex: 1, borderBottom: '1px solid #0f172a', fontWeight: 800, padding: '0 0.5rem' }}>
                {s.full_name || s.guardian_name}
              </span>
              <span style={{ fontWeight: 700 }}>towards</span>
              <span style={{ width: '220px', borderBottom: '1px solid #0f172a', fontWeight: 800, padding: '0 0.5rem' }}>
                {r.towards || s.course_name || 'Course Fee'}
              </span>
            </div>
          </div>

          {/* Side-by-Side Tables: Left = Fee Breakdown, Right = Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            
            {/* Left Column: Fee Breakdown Table */}
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #1e293b', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #1e293b' }}>
                    <th style={{ border: '1px solid #1e293b', padding: '6px 8px', textAlign: 'left' }}>Fee Item Category</th>
                    <th style={{ border: '1px solid #1e293b', padding: '6px 8px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px' }}>Course Fee</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', textAlign: 'right', fontWeight: fb.course_fee ? 700 : 400 }}>
                      {fb.course_fee ? `₹${parseFloat(fb.course_fee).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px' }}>Exam. Fee</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', textAlign: 'right', fontWeight: fb.exam_fee ? 700 : 400 }}>
                      {fb.exam_fee ? `₹${parseFloat(fb.exam_fee).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px' }}>Late Fee</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', textAlign: 'right', fontWeight: fb.late_fee ? 700 : 400 }}>
                      {fb.late_fee ? `₹${parseFloat(fb.late_fee).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px' }}>Prospectus</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', textAlign: 'right', fontWeight: fb.prospectus ? 700 : 400 }}>
                      {fb.prospectus ? `₹${parseFloat(fb.prospectus).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px' }}>Caution Deposit</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', textAlign: 'right', fontWeight: fb.caution_deposit ? 700 : 400 }}>
                      {fb.caution_deposit ? `₹${parseFloat(fb.caution_deposit).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px' }}>Others</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', textAlign: 'right', fontWeight: fb.others ? 700 : 400 }}>
                      {fb.others ? `₹${parseFloat(fb.others).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td style={{ border: '1.5px solid #1e293b', padding: '6px 8px' }}>Total</td>
                    <td style={{ border: '1.5px solid #1e293b', padding: '6px 8px', textAlign: 'right', color: '#1e40af', fontSize: '0.95rem' }}>
                      ₹{parseFloat(fb.total || r.amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column: Payment Method Table */}
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #1e293b', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #1e293b' }}>
                    <th style={{ border: '1px solid #1e293b', padding: '6px 8px', textAlign: 'left' }}>Payment Method Detail</th>
                    <th style={{ border: '1px solid #1e293b', padding: '6px 8px', textAlign: 'left' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', fontWeight: 600 }}>By Cash/Cheque No.</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px' }}>
                      {r.payment_mode === 'cheque' ? (r.reference_no || 'Cheque') : r.payment_mode === 'cash' ? 'Cash Payment' : `${(r.payment_mode || 'ONLINE').toUpperCase()} (${r.reference_no || 'Online'})`}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', fontWeight: 600 }}>Dated</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px' }}>
                      {r.cheque_date || r.payment_date}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', fontWeight: 600 }}>Drawn on</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px' }}>
                      {r.drawn_on || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', fontWeight: 600 }}>Cheque Amount</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', fontWeight: r.payment_mode === 'cheque' ? 700 : 400 }}>
                      {r.payment_mode === 'cheque' ? `₹${parseFloat(r.amount || 0).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', fontWeight: 600 }}>Cash Amount</td>
                    <td style={{ border: '1px solid #1e293b', padding: '5px 8px', fontWeight: r.payment_mode === 'cash' ? 700 : 400 }}>
                      {r.payment_mode === 'cash' ? `₹${parseFloat(r.amount || 0).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Footer Block */}
          <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '0.85rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
              {/* Left: Terms & Student Signature */}
              <div>
                <div style={{ color: '#475569', fontSize: '0.78rem', fontStyle: 'italic', whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
                  {inst.receipt_terms}
                </div>
                <div style={{ marginTop: '2rem', borderTop: '1px solid #0f172a', width: '180px', paddingTop: '4px', fontWeight: 700 }}>
                  Signature of Student
                </div>
              </div>

              {/* Right: Authorised Signatory */}
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  For {inst.institute_name}
                </div>
                {inst.signature_url ? (
                  <img src={inst.signature_url} alt="Signature" style={{ maxHeight: '45px', marginBottom: '4px' }} />
                ) : (
                  <div style={{ height: '45px' }}></div>
                )}
                <div style={{ borderTop: '1px solid #0f172a', width: '200px', paddingTop: '4px', fontWeight: 800 }}>
                  Authorised Signatory
                </div>
              </div>
            </div>

            {/* Bottom Address Banner */}
            <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', border: '1px solid #cbd5e1' }}>
              ADD. : {inst.address} | MOB- {inst.phone} {inst.gstin ? `| GSTIN: ${inst.gstin}` : ''}
            </div>
          </div>

        </div>

        {/* Modal Action Buttons (Hidden when printing) */}
        <div className="ims-no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="ims-btn ims-btn-secondary" onClick={onClose}>Close</button>
          <button className="ims-btn ims-btn-primary" onClick={handleTriggerPrint}>
            <Printer size={16} /> Print Receipt (A4 / A5)
          </button>
        </div>
      </div>
    </div>
  );
};

export const FinancesView = () => {
  const { showToast, settings, user } = useApp();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices', 'payments', 'expenses', 'documents'
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);

  // Document History State
  const [documents, setDocuments] = useState([]);
  const [docFilterType, setDocFilterType] = useState('all');
  const [docStartDate, setDocStartDate] = useState('');
  const [docEndDate, setDocEndDate] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  // Modals & Document Printing
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCollectFeeModal, setShowCollectFeeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(null);
  const [printInvoiceDoc, setPrintInvoiceDoc] = useState(null);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr();

  // Forms
  const [invoiceForm, setInvoiceForm] = useState({ student_id: '', taxable_amount: 10000, invoice_date: todayStr });
  const [reversalForm, setReversalForm] = useState({ original_payment_id: '', reversal_reason: '' });

  // Collect Fee Workflow State
  const [feeDate, setFeeDate] = useState(todayStr);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchedStudents, setSearchedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('upi');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showItemizedBreakdown, setShowItemizedBreakdown] = useState(false);
  const [feeBreakdown, setFeeBreakdown] = useState({
    course_fee: '',
    exam_fee: '',
    late_fee: '',
    prospectus: '',
    caution_deposit: '',
    others: '',
    towards: 'Course Fee',
    drawn_on: '',
    cheque_date: '',
  });

  // Expense Workflow State
  const [vendors, setVendors] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Rent', // Default category
    category_note: '',
    amount: 1500,
    vendor_id: '',
    vendor_name: '',
    payment_mode: 'cash',
    expense_date: todayStr
  });

  const canBackdate = Boolean(user?.is_super_admin || user?.capabilities?.manage_options || user?.roles?.includes('administrator') || user?.roles?.includes('ims_super_admin'));
  const canManageFinances = user?.capabilities?.manage_finances || user?.roles?.includes('administrator');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'documents') {
      loadDocuments();
    }
  }, [docFilterType, docStartDate, docEndDate]);

  const loadData = async () => {
    setPermissionDenied(false);
    setError(null);
    try {
      if (activeTab === 'invoices') {
        const [inv, studRes] = await Promise.all([
          api.getInvoices(),
          api.getStudents({ status: 'active' }),
        ]);
        setInvoices(inv || []);
        setStudents(studRes || []);
      } else if (activeTab === 'payments') {
        const [pay, studRes] = await Promise.all([
          api.getPayments(),
          api.getStudents({ status: 'active' }),
        ]);
        setPayments(pay || []);
        setStudents(studRes || []);
      } else if (activeTab === 'expenses') {
        const exp = await api.getExpenses();
        setExpenses(exp || []);
        const vRes = await api.getVendors();
        setVendors(vRes || []);
      } else if (activeTab === 'documents') {
        loadDocuments();
      }
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        setError(err.message || 'Failed to load financials.');
      }
    }
  };

  const openInvoiceModal = async () => {
    setInvoiceForm({ student_id: '', taxable_amount: 10000, invoice_date: new Date().toISOString().split('T')[0] });
    if (students.length === 0) {
      try {
        setLoadingStudents(true);
        const sRes = await api.getStudents({ status: 'active' });
        setStudents(sRes || []);
      } catch (err) {
        console.error('Failed to load active students:', err);
      } finally {
        setLoadingStudents(false);
      }
    }
    setShowInvoiceModal(true);
  };

  const loadDocuments = async () => {
    setDocLoading(true);
    try {
      const docs = await api.getDocuments({
        type: docFilterType,
        start_date: docStartDate,
        end_date: docEndDate,
        search: docSearch
      });
      setDocuments(docs || []);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED' || err.status === 403) {
        setPermissionDenied(true);
      } else {
        showToast(err.message, 'danger');
      }
    } finally {
      setDocLoading(false);
    }
  };

  // Student Search Handler for Collect Fee
  const handleStudentSearchChange = async (query) => {
    setStudentSearch(query);
    if (!query.trim()) {
      setSearchedStudents([]);
      return;
    }
    try {
      const res = await api.getStudents({ search: query, status: 'active' });
      setSearchedStudents(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectStudentForFee = async (student) => {
    try {
      const fullStud = await api.getStudent(student.id);
      setSelectedStudent(fullStud);
      setCollectAmount(fullStud.outstanding_balance || '');
      setSearchedStudents([]);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const openCollectFeeModal = async () => {
    setFeeDate(getTodayStr());
    setStudentSearch('');
    setSearchedStudents([]);
    setSelectedStudent(null);
    setCollectAmount('');
    setPaymentMode('upi');
    setReferenceNo('');
    setPaymentNote('');
    setShowItemizedBreakdown(false);
    setFeeBreakdown({
      course_fee: '',
      exam_fee: '',
      late_fee: '',
      prospectus: '',
      caution_deposit: '',
      others: '',
      towards: 'Course Fee',
      drawn_on: '',
      cheque_date: '',
    });
    if (students.length === 0) {
      try {
        setLoadingStudents(true);
        const sRes = await api.getStudents({ status: 'active' });
        setStudents(sRes || []);
      } catch (err) {
        console.error('Failed to load active students:', err);
      } finally {
        setLoadingStudents(false);
      }
    }
    setShowCollectFeeModal(true);
  };

  const handleOpenPrintReceipt = async (paymentId, isDuplicate = false) => {
    try {
      const data = await api.getPaymentReceipt(paymentId);
      if (data) {
        data.isDuplicate = isDuplicate;
      }
      setPrintReceipt(data);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleCollectFeeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      showToast('Please search and select a student first.', 'danger');
      return;
    }

    const totalBreakdown = (
      parseFloat(feeBreakdown.course_fee || 0) +
      parseFloat(feeBreakdown.exam_fee || 0) +
      parseFloat(feeBreakdown.late_fee || 0) +
      parseFloat(feeBreakdown.prospectus || 0) +
      parseFloat(feeBreakdown.caution_deposit || 0) +
      parseFloat(feeBreakdown.others || 0)
    );

    const finalAmount = parseFloat(collectAmount) || totalBreakdown || 0;

    if (finalAmount <= 0) {
      showToast('Please enter a valid payment amount.', 'danger');
      return;
    }

    try {
      const payData = {
        student_id: selectedStudent.id,
        amount: finalAmount,
        payment_mode: paymentMode,
        reference_no: referenceNo,
        payment_date: feeDate,
        fee_breakdown: {
          course_fee: parseFloat(feeBreakdown.course_fee || (collectAmount ? collectAmount : finalAmount)),
          exam_fee: parseFloat(feeBreakdown.exam_fee || 0),
          late_fee: parseFloat(feeBreakdown.late_fee || 0),
          prospectus: parseFloat(feeBreakdown.prospectus || 0),
          caution_deposit: parseFloat(feeBreakdown.caution_deposit || 0),
          others: parseFloat(feeBreakdown.others || 0),
          towards: feeBreakdown.towards || selectedStudent.course_name || 'Course Fee',
          drawn_on: feeBreakdown.drawn_on || '',
          cheque_date: feeBreakdown.cheque_date || '',
        }
      };

      const res = await api.createPayment(payData);
      showToast(`Fee Receipt ${res?.receipt_no || ''} issued successfully!`);
      setShowCollectFeeModal(false);

      if (res?.id) {
        try {
          const receiptFull = await api.getPaymentReceipt(res.id);
          setPrintReceipt(receiptFull);
        } catch (printErr) {
          console.error('Receipt print modal preview load error:', printErr);
        }
      }

      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to issue receipt.', 'danger');
    }
  };

  const handleDeletePayment = async (pay) => {
    if (!window.confirm(`Are you sure you want to delete payment receipt "${pay.receipt_no}"?`)) {
      return;
    }
    try {
      await api.deletePayment(pay.id);
      showToast('Payment record deleted.');
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleRecordReversal = async (e) => {
    e.preventDefault();
    try {
      await api.recordReversal(reversalForm);
      showToast('Payment reversal audit record logged.');
      setShowReversalModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  // Expenses handlers
  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseForm({
      title: '',
      category: 'Rent',
      category_note: '',
      amount: 1500,
      vendor_name: '',
      payment_mode: 'cash',
      expense_date: new Date().toISOString().split('T')[0]
    });
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({
      title: exp.title || '',
      category: exp.category || 'Rent',
      category_note: exp.category_note || '',
      amount: exp.amount || 0,
      vendor_name: exp.vendor_name || '',
      payment_mode: exp.payment_mode || 'cash',
      expense_date: exp.expense_date || new Date().toISOString().split('T')[0],
    });
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, expenseForm);
        showToast('Expense voucher updated.');
      } else {
        const res = await api.createExpense(expenseForm);
        showToast(`Expense voucher ${res.voucher_no} logged.`);
      }
      setShowExpenseModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteExpense = async (exp) => {
    if (!window.confirm(`Are you sure you want to delete expense voucher "${exp.voucher_no}" (${exp.title})?`)) {
      return;
    }
    try {
      await api.deleteExpense(exp.id);
      showToast('Expense voucher deleted.');
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createInvoice(invoiceForm);
      showToast(`GST Invoice ${res.invoice_no} created!`);
      setShowInvoiceModal(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleDeleteInvoice = async (inv) => {
    if (!window.confirm(`Are you sure you want to cancel and delete invoice "${inv.invoice_no}"?`)) {
      return;
    }
    try {
      await api.deleteInvoice(inv.id);
      showToast('Invoice deleted.');
      loadData();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleExportCSV = async (type) => {
    try {
      const res = await api.getExportCSV(type);
      const jsonStr = JSON.stringify(res.records, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const expenseCategoryOptions = [
    'Rent',
    'Salaries',
    'Utilities',
    'Marketing',
    'Maintenance',
    'Office Supplies',
    'Others'
  ];

  if (permissionDenied) return <AccessDenied />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div>
      <div className="ims-card">
        <div className="ims-card-header">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className={`ims-btn ${activeTab === 'invoices' ? 'ims-btn-primary' : 'ims-btn-secondary'}`} onClick={() => setActiveTab('invoices')}>
              <FileText size={16} /> GST Tax Invoices
            </button>
            <button className={`ims-btn ${activeTab === 'payments' ? 'ims-btn-primary' : 'ims-btn-secondary'}`} onClick={() => setActiveTab('payments')}>
              <Receipt size={16} /> Fee Receipts & Ledger
            </button>
            <button className={`ims-btn ${activeTab === 'expenses' ? 'ims-btn-primary' : 'ims-btn-secondary'}`} onClick={() => setActiveTab('expenses')}>
              <IndianRupee size={16} /> Expense Vouchers
            </button>
            <button className={`ims-btn ${activeTab === 'documents' ? 'ims-btn-primary' : 'ims-btn-secondary'}`} onClick={() => setActiveTab('documents')}>
              <Printer size={16} /> Document History
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="ims-btn ims-btn-secondary ims-btn-sm" onClick={() => handleExportCSV(activeTab)}>
              <Download size={14} /> Export CSV
            </button>
            {activeTab === 'invoices' && (
              <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={openInvoiceModal}>
                <Plus size={14} /> Create GST Invoice
              </button>
            )}
            {activeTab === 'payments' && (
              <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={openCollectFeeModal}>
                <Plus size={14} /> Collect Fee / Issue Receipt
              </button>
            )}
            {activeTab === 'expenses' && (
              <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={openAddExpenseModal}>
                <Plus size={14} /> Record Expense Voucher
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Invoices */}
        {activeTab === 'invoices' && (
          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Student</th>
                  <th>Taxable (₹)</th>
                  <th>CGST (9%)</th>
                  <th>SGST (9%)</th>
                  <th>Total Amount (₹)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No GST Invoices issued.</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{inv.invoice_no}</td>
                      <td>{inv.student_name} ({inv.roll_no})</td>
                      <td>₹{parseFloat(inv.taxable_amount).toLocaleString('en-IN')}</td>
                      <td>₹{parseFloat(inv.cgst_amount).toLocaleString('en-IN')}</td>
                      <td>₹{parseFloat(inv.sgst_amount).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700 }}>₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`ims-badge ims-badge-${inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'danger'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button className="ims-btn ims-btn-secondary ims-btn-sm" onClick={() => setPrintInvoiceDoc(inv)} title="Print PDF">
                            <Printer size={14} /> Print PDF
                          </button>
                          <button className="ims-btn ims-btn-danger ims-btn-sm" onClick={() => handleDeleteInvoice(inv)} title="Delete Invoice">
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

        {/* Tab 2: Fee Receipts & Ledger */}
        {activeTab === 'payments' && (
          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Student</th>
                  <th>Amount (₹)</th>
                  <th>Mode</th>
                  <th>Ref No</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No fee payment receipts found.</td></tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} style={p.is_reversal ? { background: '#fff1f2' } : {}}>
                      <td style={{ fontWeight: 700, color: 'var(--ims-primary)' }}>{p.receipt_no}</td>
                      <td>{p.student_name}</td>
                      <td style={{ fontWeight: 700, color: p.is_reversal ? 'var(--ims-danger)' : 'var(--ims-success)' }}>
                        {p.is_reversal ? '-' : '+'}₹{Math.abs(parseFloat(p.amount)).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textTransform: 'uppercase' }}>{p.payment_mode}</td>
                      <td>{p.reference_no || 'N/A'}</td>
                      <td>{p.payment_date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            title="Print Money Receipt"
                            onClick={() => handleOpenPrintReceipt(p.id)}
                          >
                            <Printer size={14} /> Print
                          </button>
                          {p.is_reversal ? (
                            <span className="ims-badge ims-badge-danger">Reversal</span>
                          ) : (
                            <button
                              className="ims-btn ims-btn-secondary ims-btn-sm"
                              style={{ color: 'var(--ims-danger)' }}
                              title="Reverse Payment"
                              onClick={() => {
                                setReversalForm({ original_payment_id: p.id, reversal_reason: '' });
                                setShowReversalModal(true);
                              }}
                            >
                              <RotateCcw size={12} />
                            </button>
                          )}
                          <button className="ims-btn ims-btn-danger ims-btn-sm" title="Delete Payment Record" onClick={() => handleDeletePayment(p)}>
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

        {/* Tab 3: Expenses */}
        {activeTab === 'expenses' && (
          <div className="ims-table-wrapper">
            <table className="ims-table">
              <thead>
                <tr>
                  <th>Voucher No</th>
                  <th>Title & Category</th>
                  <th>Vendor</th>
                  <th>Amount (₹)</th>
                  <th>Mode</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No expense vouchers logged.</td></tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: 700 }}>{exp.voucher_no}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{exp.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}>
                          {exp.category} {exp.category_note ? `(${exp.category_note})` : ''}
                        </div>
                      </td>
                      <td>{exp.vendor_name || 'N/A'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--ims-danger)' }}>₹{parseFloat(exp.amount).toLocaleString('en-IN')}</td>
                      <td style={{ textTransform: 'uppercase' }}>{exp.payment_mode}</td>
                      <td>{exp.expense_date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            className="ims-btn ims-btn-secondary ims-btn-sm"
                            title="Edit Expense"
                            onClick={() => openEditExpenseModal(exp)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="ims-btn ims-btn-danger ims-btn-sm"
                            title="Delete Expense"
                            onClick={() => handleDeleteExpense(exp)}
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

        {/* Tab 4: Document History */}
        {activeTab === 'documents' && (
          <div>
            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ims-border)' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Search Document</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="ims-input"
                    placeholder="Search by student name, roll no, doc no..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadDocuments()}
                  />
                </div>
              </div>

              <div style={{ width: '160px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Document Type</label>
                <select className="ims-select" value={docFilterType} onChange={(e) => setDocFilterType(e.target.value)}>
                  <option value="all">All Documents</option>
                  <option value="receipt">Receipts Only</option>
                  {canManageFinances && <option value="invoice">Invoices Only</option>}
                </select>
              </div>

              <div style={{ width: '150px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Start Date</label>
                <input type="date" className="ims-input" value={docStartDate} onChange={(e) => setDocStartDate(e.target.value)} />
              </div>

              <div style={{ width: '150px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>End Date</label>
                <input type="date" className="ims-input" value={docEndDate} onChange={(e) => setDocEndDate(e.target.value)} />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="ims-btn ims-btn-primary ims-btn-sm" onClick={loadDocuments}>Filter</button>
              </div>
            </div>

            {docLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading document history...</div>
            ) : (
              <div className="ims-table-wrapper">
                <table className="ims-table">
                  <thead>
                    <tr>
                      <th>Doc Type</th>
                      <th>Doc No</th>
                      <th>Date</th>
                      <th>Student Details</th>
                      <th>Course & Batch</th>
                      <th>Amount (₹)</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.length === 0 ? (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No documents found matching filters.</td></tr>
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
                          <td>
                            <div style={{ fontWeight: 600 }}>{doc.student_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}>{doc.roll_no}</div>
                          </td>
                          <td>
                            <div>{doc.course_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ims-text-muted)' }}>{doc.batch_name}</div>
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{parseFloat(doc.amount).toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`ims-badge ims-badge-${doc.status === 'paid' ? 'success' : 'warning'}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="ims-btn ims-btn-secondary ims-btn-sm"
                              onClick={() => {
                                if (doc.doc_type === 'receipt') {
                                  handleOpenPrintReceipt(doc.id, true);
                                } else {
                                  setPrintInvoiceDoc({ ...doc, invoice_no: doc.doc_no, invoice_date: doc.doc_date, isDuplicate: true });
                                }
                              }}
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
            )}
          </div>
        )}
      </div>

      {/* Collect Fee Sequence Modal */}
      {showCollectFeeModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content" style={{ maxWidth: '600px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Collect Student Fee</h3>
            <form onSubmit={handleCollectFeeSubmit}>
              {/* Step 1: Date */}
              <div className="ims-form-group">
                <label>Collection Date *</label>
                <input
                  type="date"
                  className="ims-input"
                  required
                  min={canBackdate ? undefined : todayStr}
                  max={todayStr}
                  value={feeDate}
                  onChange={(e) => setFeeDate(e.target.value)}
                />
                {!canBackdate && <small style={{ color: 'var(--ims-text-muted)', display: 'block', marginTop: '0.25rem' }}>Only today's date is allowed (back-dating restricted to Super Admin).</small>}
              </div>

              {/* Step 2: Student Selection (Dropdown or Live Search) */}
              <div className="ims-form-group">
                <label>Select Student *</label>
                <select
                  className="ims-select"
                  value={selectedStudent ? selectedStudent.id : ''}
                  onChange={(e) => {
                    const stId = e.target.value;
                    const stObj = students.find(s => s.id == stId);
                    if (stObj) {
                      handleSelectStudentForFee(stObj);
                    } else {
                      setSelectedStudent(null);
                      setCollectAmount('');
                    }
                  }}
                >
                  <option value="">Choose Student from List...</option>
                  {loadingStudents ? (
                    <option value="" disabled>Loading active students...</option>
                  ) : students && students.length > 0 ? (
                    students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.roll_no}) — Outstanding: ₹{s.outstanding_balance || 0}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No active students registered</option>
                  )}
                </select>
              </div>

              <div className="ims-form-group" style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--ims-text-muted)' }}>Or Search Student (Roll No or Name)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="ims-input"
                    placeholder="Type roll number or student name..."
                    value={studentSearch}
                    onChange={(e) => handleStudentSearchChange(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ims-text-muted)' }} />
                </div>

                {searchedStudents.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#ffffff', border: '1px solid var(--ims-border)', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                    {searchedStudents.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => handleSelectStudentForFee(st)}
                        style={{ padding: '0.65rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div style={{ fontWeight: 600 }}>{st.first_name} {st.last_name} ({st.roll_no})</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ims-text-muted)' }}>
                          Course: {st.course_name || 'N/A'} | Outstanding: ₹{st.outstanding_balance}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Selected Student Details Verification Card */}
              {selectedStudent ? (
                <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#065f46' }}>
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </div>
                    <span className="ims-badge ims-badge-success">{selectedStudent.roll_no}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#047857', marginTop: '0.35rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div><strong>Course:</strong> {selectedStudent.course_name || 'N/A'}</div>
                    <div><strong>Batch:</strong> {selectedStudent.batch_name || 'N/A'}</div>
                    <div><strong>Total Net Fee:</strong> ₹{parseFloat(selectedStudent.net_fee || 0).toLocaleString('en-IN')}</div>
                    <div><strong>Already Paid:</strong> ₹{parseFloat(selectedStudent.total_paid || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ borderTop: '1px solid #a7f3d0', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#065f46' }}>Current Outstanding Balance:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b91c1c' }}>₹{parseFloat(selectedStudent.outstanding_balance || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--ims-border)', color: 'var(--ims-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Please search and click a student from the dropdown to verify their details.
                </div>
              )}

              {/* Step 4: Payment Entry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Amount to Collect (₹) *</label>
                  <input
                    type="number"
                    className="ims-input"
                    required
                    placeholder="Enter payment amount"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Payment Method *</label>
                  <select className="ims-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="cash">Cash</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="ims-form-group">
                <label>Transaction / Reference No</label>
                <input
                  type="text"
                  className="ims-input"
                  placeholder="e.g. UTR / Cheque / Txn ID"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </div>

              {/* Optional Itemized Fee Breakdown Collapsible */}
              <div style={{ marginTop: '1rem', border: '1px solid var(--ims-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setShowItemizedBreakdown(!showItemizedBreakdown)}
                  style={{ width: '100%', padding: '0.65rem 1rem', background: '#f8fafc', border: 'none', textAlign: 'left', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>Itemized Fee Breakdown (Optional - Paper Receipt Categories)</span>
                  <span>{showItemizedBreakdown ? '▲ Hide' : '▼ Expand'}</span>
                </button>

                {showItemizedBreakdown && (
                  <div style={{ padding: '1rem', background: '#ffffff' }}>
                    <div className="ims-form-group">
                      <label style={{ fontSize: '0.8rem' }}>Fee Purpose / Towards</label>
                      <input
                        type="text"
                        className="ims-input"
                        placeholder="e.g. Course Fee, Admission & Exam Fee"
                        value={feeBreakdown.towards}
                        onChange={(e) => setFeeBreakdown({ ...feeBreakdown, towards: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="ims-form-group">
                        <label style={{ fontSize: '0.8rem' }}>Course Fee (₹)</label>
                        <input
                          type="number"
                          className="ims-input"
                          placeholder={collectAmount || '0'}
                          value={feeBreakdown.course_fee}
                          onChange={(e) => setFeeBreakdown({ ...feeBreakdown, course_fee: e.target.value })}
                        />
                      </div>
                      <div className="ims-form-group">
                        <label style={{ fontSize: '0.8rem' }}>Exam Fee (₹)</label>
                        <input
                          type="number"
                          className="ims-input"
                          placeholder="0"
                          value={feeBreakdown.exam_fee}
                          onChange={(e) => setFeeBreakdown({ ...feeBreakdown, exam_fee: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="ims-form-group">
                        <label style={{ fontSize: '0.8rem' }}>Late Fee (₹)</label>
                        <input
                          type="number"
                          className="ims-input"
                          placeholder="0"
                          value={feeBreakdown.late_fee}
                          onChange={(e) => setFeeBreakdown({ ...feeBreakdown, late_fee: e.target.value })}
                        />
                      </div>
                      <div className="ims-form-group">
                        <label style={{ fontSize: '0.8rem' }}>Prospectus (₹)</label>
                        <input
                          type="number"
                          className="ims-input"
                          placeholder="0"
                          value={feeBreakdown.prospectus}
                          onChange={(e) => setFeeBreakdown({ ...feeBreakdown, prospectus: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="ims-form-group">
                        <label style={{ fontSize: '0.8rem' }}>Caution Deposit (₹)</label>
                        <input
                          type="number"
                          className="ims-input"
                          placeholder="0"
                          value={feeBreakdown.caution_deposit}
                          onChange={(e) => setFeeBreakdown({ ...feeBreakdown, caution_deposit: e.target.value })}
                        />
                      </div>
                      <div className="ims-form-group">
                        <label style={{ fontSize: '0.8rem' }}>Others (₹)</label>
                        <input
                          type="number"
                          className="ims-input"
                          placeholder="0"
                          value={feeBreakdown.others}
                          onChange={(e) => setFeeBreakdown({ ...feeBreakdown, others: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cheque Specific Inputs */}
              {paymentMode === 'cheque' && (
                <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#fffbeb', padding: '0.75rem', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                  <div className="ims-form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Drawn On (Bank Name)</label>
                    <input
                      type="text"
                      className="ims-input"
                      placeholder="e.g. HDFC Bank, SBI"
                      value={feeBreakdown.drawn_on}
                      onChange={(e) => setFeeBreakdown({ ...feeBreakdown, drawn_on: e.target.value })}
                    />
                  </div>
                  <div className="ims-form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem' }}>Cheque Date</label>
                    <input
                      type="date"
                      className="ims-input"
                      value={feeBreakdown.cheque_date}
                      onChange={(e) => setFeeBreakdown({ ...feeBreakdown, cheque_date: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowCollectFeeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ims-btn ims-btn-primary" disabled={!selectedStudent}>
                  Confirm & Issue Money Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 5: Paper Receipt Book Print Rendering */}
      {printReceipt && (
        <ReceiptPrintModal
          receiptData={printReceipt}
          onClose={() => setPrintReceipt(null)}
        />
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3>{editingExpense ? `Edit Expense — ${editingExpense.voucher_no}` : 'Record Expense Voucher'}</h3>
            <form onSubmit={handleSaveExpense}>
              <div className="ims-form-group">
                <label>Expense Date *</label>
                <input
                  type="date"
                  className="ims-input"
                  required
                  min={canBackdate ? undefined : todayStr}
                  max={todayStr}
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                />
                {!canBackdate && <small style={{ color: 'var(--ims-text-muted)', display: 'block', marginTop: '0.25rem' }}>Only today's date is allowed (back-dating restricted to Super Admin).</small>}
              </div>

              <div className="ims-form-group">
                <label>Expense Category *</label>
                <select
                  className="ims-select"
                  required
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  {expenseCategoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {expenseForm.category === 'Others' && (
                <div className="ims-form-group">
                  <label>Specify Category Note *</label>
                  <input
                    type="text"
                    className="ims-input"
                    required
                    placeholder="Enter custom category description..."
                    value={expenseForm.category_note}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category_note: e.target.value })}
                  />
                </div>
              )}

              <div className="ims-form-group">
                <label>Expense Title / Description *</label>
                <input
                  type="text"
                  className="ims-input"
                  required
                  placeholder="e.g. Office Monthly Rent / Electricity Bill"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Amount (₹) *</label>
                  <input
                    type="number"
                    className="ims-input"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
                <div className="ims-form-group">
                  <label>Payment Mode</label>
                  <select
                    className="ims-select"
                    value={expenseForm.payment_mode}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_mode: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="ims-form-group">
                <label>Select Registered Vendor (Optional)</label>
                <select
                  className="ims-select"
                  value={expenseForm.vendor_id || ''}
                  onChange={(e) => {
                    const vId = e.target.value;
                    const vObj = vendors.find(v => v.id == vId);
                    setExpenseForm({
                      ...expenseForm,
                      vendor_id: vId,
                      vendor_name: vObj ? vObj.name : expenseForm.vendor_name,
                      gstin: vObj && vObj.gstin ? vObj.gstin : expenseForm.gstin,
                      category: vObj && vObj.category ? vObj.category : expenseForm.category
                    });
                  }}
                >
                  <option value="">No registered vendor (Petty Cash / Direct Payee)</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                  ))}
                </select>
              </div>

              <div className="ims-form-group">
                <label>Vendor / Recipient Name</label>
                <input
                  type="text"
                  className="ims-input"
                  placeholder="e.g. Property Owner / Stationer"
                  value={expenseForm.vendor_name}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" className="ims-btn ims-btn-primary">{editingExpense ? 'Save Changes' : 'Save Expense Voucher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3>Generate Indian GST Tax Invoice</h3>
            <form onSubmit={handleCreateInvoice}>
              <div className="ims-form-group">
                <label>Select Student *</label>
                <select className="ims-select" required value={invoiceForm.student_id} onChange={(e) => setInvoiceForm({ ...invoiceForm, student_id: e.target.value })}>
                  <option value="">Choose Student...</option>
                  {loadingStudents ? (
                    <option value="" disabled>Loading active students...</option>
                  ) : students && students.length > 0 ? (
                    students.map((s) => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.roll_no})</option>
                    ))
                  ) : (
                    <option value="" disabled>No active students found</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="ims-form-group">
                  <label>Taxable Amount (₹) *</label>
                  <input type="number" className="ims-input" required value={invoiceForm.taxable_amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, taxable_amount: e.target.value })} />
                </div>
                <div className="ims-form-group">
                  <label>Invoice Date</label>
                  <input
                    type="date"
                    className="ims-input"
                    min={canBackdate ? undefined : todayStr}
                    max={todayStr}
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                  />
                  {!canBackdate && <small style={{ color: 'var(--ims-text-muted)', display: 'block', marginTop: '0.25rem' }}>Only today's date is allowed (back-dating restricted to Super Admin).</small>}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                <button type="submit" className="ims-btn ims-btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reversal Modal */}
      {showReversalModal && (
        <div className="ims-modal-overlay">
          <div className="ims-modal-content">
            <h3 style={{ color: 'var(--ims-danger)' }}>Record Payment Reversal</h3>
            <form onSubmit={handleRecordReversal}>
              <div className="ims-form-group">
                <label>Reason for Reversal *</label>
                <input type="text" className="ims-input" required placeholder="e.g. Bank chargeback / Bounced cheque" value={reversalForm.reversal_reason} onChange={(e) => setReversalForm({ ...reversalForm, reversal_reason: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="ims-btn ims-btn-secondary" onClick={() => setShowReversalModal(false)}>Cancel</button>
                <button type="submit" className="ims-btn ims-btn-danger">Confirm Reversal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable GST Invoice Modal */}
      {printInvoiceDoc && (
        <InvoicePrintModal
          invoiceData={printInvoiceDoc}
          settings={settings}
          onClose={() => setPrintInvoiceDoc(null)}
        />
      )}
    </div>
  );
};
