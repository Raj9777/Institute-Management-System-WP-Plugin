import React from 'react';
import { Printer } from 'lucide-react';

export const AdmissionAgreementPrintModal = ({ agreementData, onClose }) => {
  if (!agreementData) return null;

  const a = agreementData.agreement || {};
  const s = agreementData.student || {};
  const inst = agreementData.settings || {};
  const instalments = a.instalments || [];

  const handleTriggerPrint = () => {
    window.print();
  };

  // Ensure at least 6 rows are displayed to match the paper receipt form proportions
  const displayRows = [...instalments];
  while (displayRows.length < 6) {
    displayRows.push({ name: '', due_date: '', amount_date: '' });
  }

  return (
    <div className="ims-modal-overlay ims-agreement-modal-overlay">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .ims-agreement-printable-area, .ims-agreement-printable-area * {
            visibility: visible !important;
          }
          .ims-agreement-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .ims-agreement-modal-overlay {
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
        
        <div className="ims-agreement-printable-area" style={{ border: '2px solid #1e293b', padding: '1.5rem', borderRadius: '4px', background: '#fff', fontFamily: 'Arial, sans-serif' }}>
          
          {/* Header Block */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem', position: 'relative' }}>
            {/* Top Right Serial No */}
            <div style={{ position: 'absolute', top: 0, right: 0, fontWeight: 900, fontSize: '1.2rem', color: '#dc2626' }}>
              {a.agreement_no || '401'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              {inst.logo_url && (
                <img src={inst.logo_url} alt="Logo" style={{ maxHeight: '60px', maxWidth: '160px', objectFit: 'contain' }} />
              )}
              <div>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {inst.institute_name || 'Apinet COMPUTER EDUCATION'}
                </h1>
                {inst.website && <div style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}>{inst.website}</div>}
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginTop: '0.25rem' }}>
              {inst.address}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
              Mob.: {inst.phone}
            </div>
          </div>

          {/* Student & Document Info Header (Dotted Line Format) */}
          <div style={{ fontSize: '0.9rem', lineHeight: '2.2rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, minWidth: '110px' }}>Student Name</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #0f172a', fontWeight: 800, paddingLeft: '0.5rem', color: '#1e40af' }}>
                {s.full_name || '...........................................................................................................'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, minWidth: '110px' }}>Address</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #0f172a', fontWeight: 700, paddingLeft: '0.5rem' }}>
                {s.address || '...........................................................................................................'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, marginRight: '4px' }}>Invoice No.</span>
                <span style={{ flex: 1, borderBottom: '1px dotted #0f172a', fontWeight: 800, paddingLeft: '0.25rem' }}>
                  {a.agreement_no}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, marginRight: '4px' }}>Course</span>
                <span style={{ flex: 1, borderBottom: '1px dotted #0f172a', fontWeight: 700, paddingLeft: '0.25rem' }}>
                  {s.course_name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, marginRight: '4px' }}>Date</span>
                <span style={{ flex: 1, borderBottom: '1px dotted #0f172a', fontWeight: 700, paddingLeft: '0.25rem' }}>
                  {a.agreement_date}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, marginRight: '4px' }}>If Upgrade Prev. Inv. No.</span>
                <span style={{ flex: 1, borderBottom: '1px dotted #0f172a', fontWeight: 700, paddingLeft: '0.25rem' }}>
                  {a.prev_invoice_no || '..................................................'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, marginRight: '4px' }}>Roll No.</span>
                <span style={{ flex: 1, borderBottom: '1px dotted #0f172a', fontWeight: 800, paddingLeft: '0.25rem', color: '#1e40af' }}>
                  {s.roll_no}
                </span>
              </div>
            </div>
          </div>

          {/* Main 3-Column Instalment Table Grid */}
          <div style={{ marginBottom: '1.25rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #1e293b', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #1e293b' }}>
                  <th style={{ border: '1.5px solid #1e293b', padding: '8px', textAlign: 'center', width: '35%', fontWeight: 800 }}>
                    INSTALMENT
                  </th>
                  <th style={{ border: '1.5px solid #1e293b', padding: '8px', textAlign: 'center', width: '35%', fontWeight: 800 }}>
                    INSTALMENT DATE
                  </th>
                  <th style={{ border: '1.5px solid #1e293b', padding: '8px', textAlign: 'center', width: '30%', fontWeight: 800 }}>
                    AMOUNT DATE
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, idx) => (
                  <tr key={idx} style={{ height: '38px' }}>
                    <td style={{ border: '1.5px solid #1e293b', padding: '6px 10px', fontWeight: 700 }}>
                      {row.name ? (row.name.toLowerCase().startsWith('instalment') ? row.name : `INSTALMENT : ${row.name}`) : ''}
                    </td>
                    <td style={{ border: '1.5px solid #1e293b', padding: '6px 10px', textAlign: 'center' }}>
                      {row.due_date || ''}
                    </td>
                    <td style={{ border: '1.5px solid #1e293b', padding: '6px 10px', textAlign: 'center', fontWeight: row.amount ? 700 : 400 }}>
                      {row.amount ? `₹${parseFloat(row.amount).toLocaleString('en-IN')} ${row.paid_date ? `(${row.paid_date})` : ''}` : row.amount_date || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Fee/Receipt Summary Boxes Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            
            {/* Row 1: Exam Fee | Inv. Val */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800 }}>Exam Fee</span>
                <div style={{ border: '1.5px solid #1e293b', minWidth: '110px', padding: '4px 8px', minHeight: '26px', fontWeight: 700, textAlign: 'center' }}>
                  {a.exam_fee ? `₹${parseFloat(a.exam_fee).toLocaleString('en-IN')}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800 }}>Inv. Val</span>
                <div style={{ border: '1.5px solid #1e293b', minWidth: '110px', padding: '4px 8px', minHeight: '26px', fontWeight: 800, textAlign: 'center', color: '#1e40af' }}>
                  {a.inv_val ? `₹${parseFloat(a.inv_val).toLocaleString('en-IN')}` : ''}
                </div>
              </div>
            </div>

            {/* Row 2: First Receipt No. | Value | Date */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>First Receipt No.:</span>
                <div style={{ border: '1.5px solid #1e293b', minWidth: '120px', padding: '4px 8px', minHeight: '26px', fontWeight: 700 }}>
                  {a.first_receipt_no || ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>Value :</span>
                <div style={{ border: '1.5px solid #1e293b', minWidth: '90px', padding: '4px 8px', minHeight: '26px', fontWeight: 700, textAlign: 'center' }}>
                  {a.first_receipt_val ? `₹${parseFloat(a.first_receipt_val).toLocaleString('en-IN')}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>Date :</span>
                <div style={{ border: '1.5px solid #1e293b', minWidth: '100px', padding: '4px 8px', minHeight: '26px', textAlign: 'center' }}>
                  {a.first_receipt_date || ''}
                </div>
              </div>
            </div>

            {/* Row 3: Caution Deposit | Receipt No. | Date */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>Caution Deposit Rs</span>
                <div style={{ border: '1.5px solid #1e293b', minWidth: '100px', padding: '4px 8px', minHeight: '26px', fontWeight: 700, textAlign: 'center' }}>
                  {a.caution_deposit ? `₹${parseFloat(a.caution_deposit).toLocaleString('en-IN')}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>Receipt No.:</span>
                <div style={{ border: '1.5px solid #1e293b', minWidth: '100px', padding: '4px 8px', minHeight: '26px', fontWeight: 700 }}>
                  {a.second_receipt_no || ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>Date :</span>
                <div style={{ border: '1.5px solid #1e293b', minWidth: '100px', padding: '4px 8px', minHeight: '26px', textAlign: 'center' }}>
                  {a.second_receipt_date || ''}
                </div>
              </div>
            </div>

          </div>

          {/* Footer Block */}
          <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '0.85rem', fontSize: '0.8rem' }}>
            <div style={{ color: '#334155', fontSize: '0.78rem', fontStyle: 'italic', marginBottom: '1.5rem', lineHeight: '1.4rem' }}>
              {inst.admission_terms}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '2rem' }}>E. & O. E.</div>
                <div style={{ borderTop: '1px solid #0f172a', width: '200px', paddingTop: '4px', fontWeight: 700 }}>
                  Signature of Student
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '2.5rem' }}>
                  For {inst.institute_name}
                </div>
                <div style={{ borderTop: '1px solid #0f172a', width: '200px', paddingTop: '4px', fontWeight: 800 }}>
                  COUNSELLOR
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Action Buttons (Hidden when printing) */}
        <div className="ims-no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="ims-btn ims-btn-secondary" onClick={onClose}>Close</button>
          <button className="ims-btn ims-btn-primary" onClick={handleTriggerPrint}>
            <Printer size={16} /> Print Admission Agreement (A4)
          </button>
        </div>
      </div>
    </div>
  );
};
