import React from 'react';
import { Printer, X } from 'lucide-react';

function numberToWordsINR(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : ' ');
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundred = Math.floor(rem / 100);
  rem = rem % 100;

  if (crore > 0) words += inWords(crore) + 'Crore ';
  if (lakh > 0) words += inWords(lakh) + 'Lakh ';
  if (thousand > 0) words += inWords(thousand) + 'Thousand ';
  if (hundred > 0) words += inWords(hundred) + 'Hundred ';
  if (rem > 0) {
    if (words !== '') words += 'and ';
    words += inWords(rem);
  }

  return (words.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

export const InvoicePrintModal = ({ invoiceData, settings, onClose }) => {
  if (!invoiceData) return null;

  const inv = invoiceData;
  const inst = settings || {};
  const isDuplicate = Boolean(inv.isDuplicate);

  const handleTriggerPrint = () => {
    window.print();
  };

  const taxableAmount = parseFloat(inv.taxable_amount || 0);
  const cgstRate = parseFloat(inv.cgst_rate || inst.cgst_rate || 9);
  const sgstRate = parseFloat(inv.sgst_rate || inst.sgst_rate || 9);
  const cgstAmount = parseFloat(inv.cgst_amount || ((taxableAmount * cgstRate) / 100));
  const sgstAmount = parseFloat(inv.sgst_amount || ((taxableAmount * sgstRate) / 100));
  const totalAmount = parseFloat(inv.total_amount || (taxableAmount + cgstAmount + sgstAmount));
  const amountInWords = numberToWordsINR(totalAmount);

  return (
    <div className="ims-modal-overlay ims-invoice-modal-overlay">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .ims-invoice-printable-area, .ims-invoice-printable-area * {
            visibility: visible !important;
          }
          .ims-invoice-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 1.5rem !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-sizing: border-box !important;
          }
          .ims-invoice-modal-overlay {
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

        <div className="ims-invoice-printable-area" style={{ border: '2px solid #1e293b', padding: '1.5rem', borderRadius: '4px', background: '#fff', fontFamily: 'Arial, sans-serif' }}>
          
          {/* Top Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ border: '3px double #1e293b', padding: '0.4rem 1.2rem', fontWeight: 900, fontSize: '1.35rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                TAX INVOICE
              </div>
              {isDuplicate && (
                <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem', marginTop: '4px' }}>*** DUPLICATE / REPRINT ***</div>
              )}
            </div>

            <div style={{ textAlign: 'right', flex: 1, paddingLeft: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                {inst.logo_url && (
                  <img src={inst.logo_url} alt="Logo" style={{ maxHeight: '55px', maxWidth: '150px', objectFit: 'contain' }} />
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                    {inst.institute_name || 'Apinet Computer Education'}
                  </h2>
                  {inst.tagline && <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>{inst.tagline}</div>}
                  {inst.website && <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>{inst.website}</div>}
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem', lineHeight: '1.3' }}>
                {inst.address && <div>{inst.address}</div>}
                {inst.phone && <div>Tel: {inst.phone} {inst.email ? `| Email: ${inst.email}` : ''}</div>}
                <div><strong>GSTIN:</strong> {inst.gstin || inv.gstin || '27AAAAA0000A1Z5'}</div>
              </div>
            </div>
          </div>

          {/* Invoice Meta and Customer Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid #cbd5e1', padding: '0.85rem 1rem', borderRadius: '4px', marginBottom: '1.25rem', background: '#f8fafc', fontSize: '0.86rem' }}>
            <div>
              <div style={{ marginBottom: '0.35rem' }}><strong>Invoice No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{inv.invoice_no || inv.doc_no || 'N/A'}</span></div>
              <div style={{ marginBottom: '0.35rem' }}><strong>Invoice Date:</strong> {inv.invoice_date || inv.doc_date || new Date().toISOString().split('T')[0]}</div>
              <div><strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 700, color: inv.status === 'paid' ? '#059669' : '#d97706' }}>{inv.status || 'Active'}</span></div>
            </div>
            <div>
              <div style={{ marginBottom: '0.35rem' }}><strong>Billed To (Student):</strong> {inv.student_name || 'N/A'}</div>
              <div style={{ marginBottom: '0.35rem' }}><strong>Roll No:</strong> {inv.roll_no || 'N/A'}</div>
              {inv.course_name && <div><strong>Course:</strong> {inv.course_name}</div>}
            </div>
          </div>

          {/* Itemized GST Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1e293b', marginBottom: '1.25rem', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #1e293b' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'center', width: '50px' }}>#</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'left' }}>Description of Services</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'center', width: '90px' }}>SAC Code</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'right', width: '110px' }}>Taxable Val (₹)</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'right', width: '85px' }}>CGST ({cgstRate}%)</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'right', width: '85px' }}>SGST ({sgstRate}%)</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'right', width: '110px' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>1</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>
                  <strong>Course Tuition & Training Fee</strong>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Educational & vocational coaching services</div>
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>999293</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>₹{taxableAmount.toFixed(2)}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>₹{cgstAmount.toFixed(2)}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>₹{sgstAmount.toFixed(2)}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right', fontWeight: 700 }}>₹{totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid #1e293b' }}>
                <td colSpan={3} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>Total:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>₹{taxableAmount.toFixed(2)}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>₹{cgstAmount.toFixed(2)}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right' }}>₹{sgstAmount.toFixed(2)}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'right', color: '#1e293b', fontSize: '0.95rem' }}>₹{totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in Words */}
          <div style={{ border: '1px dashed #94a3b8', padding: '0.65rem 1rem', borderRadius: '4px', marginBottom: '1.25rem', background: '#f8fafc', fontSize: '0.84rem' }}>
            <strong>Amount in Words:</strong> <span style={{ textTransform: 'capitalize', fontStyle: 'italic' }}>{amountInWords}</span>
          </div>

          {/* Terms and Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569' }}>
            <div>
              <strong>Terms & Conditions:</strong>
              <div style={{ whiteSpace: 'pre-line', marginTop: '0.3rem', lineHeight: '1.4' }}>
                {inst.receipt_terms || "* Fees once paid are non-refundable and non-transferable under any circumstances.\n* This is a computer generated tax invoice."}
              </div>
            </div>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
              {inst.signature_url ? (
                <img src={inst.signature_url} alt="Signature" style={{ maxHeight: '45px', marginBottom: '0.3rem' }} />
              ) : (
                <div style={{ height: '40px' }} />
              )}
              <div style={{ borderTop: '1px solid #0f172a', width: '80%', paddingTop: '0.3rem', fontWeight: 700, color: '#0f172a' }}>
                Authorized Signatory
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>For {inst.institute_name || 'Institute Management'}</div>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="ims-no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="ims-btn ims-btn-secondary" onClick={onClose}>
            <X size={16} /> Close
          </button>
          <button className="ims-btn ims-btn-primary" onClick={handleTriggerPrint}>
            <Printer size={16} /> Print / Save as PDF (A4)
          </button>
        </div>
      </div>
    </div>
  );
};
