const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

export const fetchEmployees = async () => {
  const response = await fetch(`${API_BASE_URL}/employees`);
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }
  return response.json();
};

export const createEmployee = async (employeeData) => {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employeeData),
  });
  if (!response.ok) {
    throw new Error('Failed to create employee');
  }
  return response.json();
};

export const updateEmployee = async (employeeId, employeeData) => {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employeeData),
  });
  if (!response.ok) {
    throw new Error('Failed to update employee');
  }
  return response.json();
};

export const deleteEmployee = async (employeeId) => {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete employee');
  }
  return true;
};

export const fetchEmployeePayHistory = async (employeeId) => {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/pay-history`);
  if (!response.ok) {
    throw new Error('Failed to fetch employee pay history');
  }
  return response.json();
};

export const addEmployeePayHistory = async (employeeId, payHistoryData) => {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/pay-history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payHistoryData),
  });
  if (!response.ok) {
    throw new Error('Failed to add employee pay history');
  }
  return response.json();
};

export const checkPayRateChanges = async (startDate, endDate) => {
  const response = await fetch(`${API_BASE_URL}/pay-rate-changes?start_date=${startDate}&end_date=${endDate}`);
  if (!response.ok) {
    throw new Error('Failed to check pay rate changes');
  }
  return response.json();
};

export const fetchJobs = async () => {
  const response = await fetch(`${API_BASE_URL}/jobs`);
  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }
  return response.json();
};

export const fetchActivities = async () => {
  const response = await fetch(`${API_BASE_URL}/activities`);
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  return response.json();
};

export const fetchTimesheets = async (jobId, weekStartDate) => {
  const response = await fetch(`${API_BASE_URL}/timesheets?job_id=${jobId}&week_start=${weekStartDate}`);
  if (!response.ok) {
    throw new Error('Failed to fetch timesheets');
  }
  return response.json();
};

export const fetchTimesheetHistory = async (startDate, endDate) => {
  const response = await fetch(`${API_BASE_URL}/timesheets?start_date=${startDate}&end_date=${endDate}`);
  if (!response.ok) {
    throw new Error('Failed to fetch timesheet history');
  }
  return response.json();
};

export const createTimesheetEntry = async (entry) => {
  const response = await fetch(`${API_BASE_URL}/timesheets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entry),
  });
  if (!response.ok) {
    throw new Error('Failed to create timesheet entry');
  }
  return response.json();
};

export const createActivity = async (activityData) => {
    const response = await fetch(`${API_BASE_URL}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData),
    });
    if (!response.ok) {
      throw new Error('Failed to create activity');
    }
    return response.json();
  };

  export const fetchAllTimesheets = async (weekStartDate) => {
  const endDate = new Date(weekStartDate);
  endDate.setDate(endDate.getDate() + 6);
  const formattedEndDate = endDate.toISOString().split('T')[0];

  const response = await fetch(`${API_BASE_URL}/timesheets?start_date=${weekStartDate}&end_date=${formattedEndDate}`);
  if (!response.ok) {
    throw new Error('Failed to fetch timesheets');
  }
  return response.json();
};

export const fetchInvoices = async (startDate, endDate) => {
  let url = `${API_BASE_URL}/invoices`;
  if (startDate && endDate) {
    url += `?start_date=${startDate}&end_date=${endDate}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch invoices');
  }
  return response.json();
};

export const fetchInvoiceDetails = async (invoiceId) => {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/details`);
  if (!response.ok) {
    throw new Error('Failed to fetch invoice details');
  }
  return response.json();
};

export const createInvoice = async (invoiceData) => {
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invoiceData),
  });
  if (!response.ok) {
    throw new Error('Failed to create invoice');
  }
  return response.json();
};

export const addInvoiceDetails = async (invoiceId, invoiceDetails) => {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invoice_details: invoiceDetails }),
  });
  if (!response.ok) {
    throw new Error('Failed to add invoice details');
  }
  return response.json();
};

export const createJob = async (jobData) => {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobData),
  });
  if (!response.ok) {
    throw new Error('Failed to create job');
  }
  return response.json();
};

export const deleteInvoice = async (invoiceId) => {
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete invoice');
  }
  return true;
};
