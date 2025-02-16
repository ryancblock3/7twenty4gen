const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if your backend is on a different port

export const fetchEmployees = async () => {
  const response = await fetch(`${API_BASE_URL}/employees`);
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
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