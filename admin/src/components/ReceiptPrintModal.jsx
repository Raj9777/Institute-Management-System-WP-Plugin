import React from 'react';
import { Printer } from 'lucide-react';

export const ReceiptPrintModal = ({ receiptData, onClose }) => {
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

          {/* Footer Terms & Authorization Signature */}
          <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '0.85rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
              {/* Left: Terms & Student Signature */}
              <div>
                <div style={{ color: '#475569', fontSize: '0.78rem', fontStyle: 'italic', whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
                  {inst.receipt_terms || "* Cheques subject to realisation.\nThe receipt must be produced when demanded. Fee once paid are not refundable."}
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
            <Printer size={16} /> Print Official Receipt (A4)
          </button>
        </div>
      </div>
    </div>
  );
};
