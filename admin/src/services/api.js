const getApiConfig = () => {
  const root = window.imsData?.root || '/wp-json/';
  const nonce = window.imsData?.nonce || '';
  return { root, nonce };
};

const buildQuery = (params = {}) => {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      cleanParams[key] = params[key];
    }
  });
  const query = new URLSearchParams(cleanParams).toString();
  return query ? '?' + query : '';
};

export const apiFetch = async (endpoint, options = {}) => {
  const { root, nonce } = getApiConfig();
  const url = `${root}ims/v1${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-WP-Nonce': nonce,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok || (json && json.ok === false)) {
    const errorMsg = json?.error?.message || json?.message || 'An error occurred';
    const err = new Error(errorMsg);
    err.code = json?.error?.code || (response.status === 403 ? 'PERMISSION_DENIED' : 'api_error');
    err.status = response.status;
    throw err;
  }

  return json.data;
};

export const api = {
  // Auth
  getMe: () => apiFetch('/auth/me'),
  getUsers: () => apiFetch('/users'),
  createUser: (data) => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getSettings: () => apiFetch('/settings'),
  updateSettings: (data) => apiFetch('/settings', { method: 'POST', body: JSON.stringify(data) }),

  // File / Image Upload
  uploadFile: async (file) => {
    const { root, nonce } = getApiConfig();
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${root}ims/v1/upload`, {
      method: 'POST',
      headers: { 'X-WP-Nonce': nonce },
      body: formData,
    });
    const json = await response.json();
    if (!response.ok || (json && json.ok === false)) {
      throw new Error(json?.error?.message || json?.message || 'Upload failed');
    }
    return json.data;
  },

  // Academic
  getCourses: () => apiFetch('/courses'),
  createCourse: (data) => apiFetch('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => apiFetch(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id) => apiFetch(`/courses/${id}`, { method: 'DELETE' }),

  getBatches: () => apiFetch('/batches'),
  createBatch: (data) => apiFetch('/batches', { method: 'POST', body: JSON.stringify(data) }),
  updateBatch: (id, data) => apiFetch(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBatch: (id) => apiFetch(`/batches/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (params = {}) => apiFetch(`/students${buildQuery(params)}`),
  getStudent: (id) => apiFetch(`/students/${id}`),
  createStudent: (data) => apiFetch('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => apiFetch(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => apiFetch(`/students/${id}`, { method: 'DELETE' }),

  // Staff
  getStaff: () => apiFetch('/staff'),
  getStaffMember: (id) => apiFetch(`/staff/${id}`),
  getStaffFullProfile: (id) => apiFetch(`/staff/${id}/full-profile`),
  revealStaffBankDetails: (id) => apiFetch(`/staff/${id}/reveal-bank-details`, { method: 'POST' }),
  createStaff: (data) => apiFetch('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id, data) => apiFetch(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStaff: (id) => apiFetch(`/staff/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (date, entityType, batchId = '') => apiFetch(`/attendance${buildQuery({ date, entity_type: entityType, batch_id: batchId })}`),
  saveAttendance: (data) => apiFetch('/attendance', { method: 'POST', body: JSON.stringify(data) }),

  // Finances
  getInvoices: () => apiFetch('/invoices'),
  createInvoice: (data) => apiFetch('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  deleteInvoice: (id) => apiFetch(`/invoices/${id}`, { method: 'DELETE' }),

  getPayments: () => apiFetch('/payments'),
  createPayment: (data) => apiFetch('/payments', { method: 'POST', body: JSON.stringify(data) }),
  getPaymentReceipt: (id) => apiFetch(`/payments/${id}/receipt`),
  deletePayment: (id) => apiFetch(`/payments/${id}`, { method: 'DELETE' }),
  recordReversal: (data) => apiFetch('/payments/reversal', { method: 'POST', body: JSON.stringify(data) }),

  // Admission Agreements
  getAgreements: (params = {}) => apiFetch(`/admission-agreements${buildQuery(params)}`),
  createAgreement: (data) => apiFetch('/admission-agreements', { method: 'POST', body: JSON.stringify(data) }),
  getAgreementPrint: (id) => apiFetch(`/admission-agreements/${id}/print`),
  deleteAgreement: (id) => apiFetch(`/admission-agreements/${id}`, { method: 'DELETE' }),

  getExpenses: () => apiFetch('/expenses'),
  createExpense: (data) => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => apiFetch(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => apiFetch(`/expenses/${id}`, { method: 'DELETE' }),

  // Enquiries
  getEnquiries: (params = {}) => apiFetch(`/enquiries${buildQuery(params)}`),
  getEnquiry: (id) => apiFetch(`/enquiries/${id}`),
  createEnquiry: (data) => apiFetch('/enquiries', { method: 'POST', body: JSON.stringify(data) }),
  updateEnquiry: (id, data) => apiFetch(`/enquiries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addEnquiryNote: (id, data) => apiFetch(`/enquiries/${id}/notes`, { method: 'POST', body: JSON.stringify(data) }),
  deleteEnquiry: (id) => apiFetch(`/enquiries/${id}`, { method: 'DELETE' }),

  // Vendors
  getVendors: () => apiFetch('/vendors'),
  createVendor: (data) => apiFetch('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  updateVendor: (id, data) => apiFetch(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVendor: (id) => apiFetch(`/vendors/${id}`, { method: 'DELETE' }),
  getVendorExpenses: (id, params = {}) => apiFetch(`/vendors/${id}/expenses${buildQuery(params)}`),

  getDocuments: (params = {}) => apiFetch(`/documents${buildQuery(params)}`),

  // Payroll
  getPayroll: (params = {}) => apiFetch(`/payroll${buildQuery(params)}`),
  getPayrollRuns: (month, year) => apiFetch(`/payroll/runs?month=${month}&year=${year}`),
  saveRunAdjustment: (data) => apiFetch('/payroll/runs/adjustment', { method: 'POST', body: JSON.stringify(data) }),
  finalizePayrollMonth: (month, year) => apiFetch('/payroll/runs/finalize', { method: 'POST', body: JSON.stringify({ month, year }) }),
  createPayroll: (data) => apiFetch('/payroll', { method: 'POST', body: JSON.stringify(data) }),
  updatePayroll: (id, data) => apiFetch(`/payroll/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePayroll: (id) => apiFetch(`/payroll/${id}`, { method: 'DELETE' }),

  // Dashboard & Reports
  getDashboardKPIs: () => apiFetch('/dashboard/kpis'),
  getExportCSV: (type) => apiFetch(`/reports/export?type=${type}`),
};
