import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import PayRateChangeNotification from './PayRateChangeNotification';
import * as XLSX from 'xlsx';
import {
  fetchEmployees,
  fetchJobs,
  fetchActivities,
  createTimesheetEntry,
  createActivity,
  checkPayRateChanges
} from "../api";

const AddActivityModal = ({ isOpen, onClose, onAdd }) => {
  const [activityCode, setActivityCode] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(activityCode, activityDescription);
    setActivityCode("");
    setActivityDescription("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Add New Activity</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="activityCode" className="block mb-2 text-sm font-medium text-gray-700">
              Activity Code:
            </label>
            <input
              type="text"
              id="activityCode"
              value={activityCode}
              onChange={(e) => setActivityCode(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="activityDescription" className="block mb-2 text-sm font-medium text-gray-700">
              Activity Description:
            </label>
            <input
              type="text"
              id="activityDescription"
              value={activityDescription}
              onChange={(e) => setActivityDescription(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManualTimesheetEntry = () => {
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [processedData, setProcessedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weekEndingDate, setWeekEndingDate] = useState('');
  const [startInvoiceNumber, setStartInvoiceNumber] = useState('2277');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(null);
  const navigate = useNavigate();

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [employeesData, jobsData, activitiesData] = await Promise.all([
          fetchEmployees(),
          fetchJobs(),
          fetchActivities(),
        ]);
        setEmployees(employeesData);
        setJobs(jobsData);
        setActivities(activitiesData);
        setError(null);
      } catch (error) {
        setError("Failed to fetch data. Please try again later.");
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set default week ending date to the next Sunday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    setWeekEndingDate(nextSunday.toISOString().split('T')[0]);
  }, []);

  // Add a new empty row to the timesheet entries
  const addEmptyRow = () => {
    setTimesheetEntries([
      ...timesheetEntries,
      {
        employee_id: '',
        employee_name: '',
        searchTerm: '',
        matchingEmployees: [],
        job_id: '',
        job_name: '',
        activity_id: '',
        activity_code: '',
        activity_description: '',
        pay_type: 'Regular',
        hours: '',
        burdened_rate: '',
        total: ''
      }
    ]);
  };

  // Initialize with one empty row
  useEffect(() => {
    if (timesheetEntries.length === 0) {
      addEmptyRow();
    }
  }, [timesheetEntries]);

  // Handle employee search
  const handleEmployeeSearch = (searchTerm, rowIndex) => {
    const matchingEmployees = employees.filter((emp) =>
      `${emp.first_name} ${emp.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    const newEntries = [...timesheetEntries];
    newEntries[rowIndex] = {
      ...newEntries[rowIndex],
      searchTerm,
      matchingEmployees,
      employee_id: '',
      employee_name: '',
    };
    setTimesheetEntries(newEntries);
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee, rowIndex) => {
    const newEntries = [...timesheetEntries];
    newEntries[rowIndex] = {
      ...newEntries[rowIndex],
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      searchTerm: '',
      matchingEmployees: [],
    };
    setTimesheetEntries(newEntries);
  };

  // Handle job selection
  const handleJobChange = (rowIndex, jobId) => {
    const selectedJob = jobs.find(job => job.id === parseInt(jobId));
    const jobName = selectedJob ? `${selectedJob.job_name} - ${selectedJob.job_number}` : '';
    
    const newEntries = [...timesheetEntries];
    newEntries[rowIndex] = {
      ...newEntries[rowIndex],
      job_id: jobId,
      job_name: jobName,
    };
    setTimesheetEntries(newEntries);
  };

  // Handle activity selection
  const handleActivityChange = (rowIndex, activityId) => {
    if (activityId === "new") {
      setCurrentRowIndex(rowIndex);
      setIsModalOpen(true);
    } else {
      const selectedActivity = activities.find(activity => activity.id === parseInt(activityId));
      const activityCode = selectedActivity ? selectedActivity.activity_code : '';
      const activityDescription = selectedActivity ? selectedActivity.activity_description : '';
      
      const newEntries = [...timesheetEntries];
      newEntries[rowIndex] = {
        ...newEntries[rowIndex],
        activity_id: activityId,
        activity_code: activityCode,
        activity_description: activityDescription,
      };
      setTimesheetEntries(newEntries);
    }
  };

  // Handle adding a new activity
  const handleAddActivity = async (code, description) => {
    try {
      const newActivity = await createActivity({
        activity_code: code,
        activity_description: description,
      });
      setActivities([...activities, newActivity]);
      
      const newEntries = [...timesheetEntries];
      newEntries[currentRowIndex] = {
        ...newEntries[currentRowIndex],
        activity_id: newActivity.id,
        activity_code: newActivity.activity_code,
        activity_description: newActivity.activity_description,
      };
      setTimesheetEntries(newEntries);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating new activity:", error);
      setError("Failed to create new activity. Please try again.");
    }
  };

  // Handle pay type change
  const handlePayTypeChange = (rowIndex, payType) => {
    const newEntries = [...timesheetEntries];
    newEntries[rowIndex] = {
      ...newEntries[rowIndex],
      pay_type: payType,
    };
    setTimesheetEntries(newEntries);
  };

  // Handle hours change
  const handleHoursChange = (rowIndex, hours) => {
    const newEntries = [...timesheetEntries];
    const entry = newEntries[rowIndex];
    const burdenedRate = parseFloat(entry.burdened_rate) || 0;
    
    newEntries[rowIndex] = {
      ...entry,
      hours: hours,
      total: hours && burdenedRate ? (parseFloat(hours) * burdenedRate).toFixed(2) : '',
    };
    setTimesheetEntries(newEntries);
  };

  // Handle burdened rate change
  const handleBurdenedRateChange = (rowIndex, rate) => {
    const newEntries = [...timesheetEntries];
    const entry = newEntries[rowIndex];
    const hours = parseFloat(entry.hours) || 0;
    
    newEntries[rowIndex] = {
      ...entry,
      burdened_rate: rate,
      total: rate && hours ? (parseFloat(rate) * hours).toFixed(2) : '',
    };
    setTimesheetEntries(newEntries);
  };

  // Handle total change
  const handleTotalChange = (rowIndex, total) => {
    const newEntries = [...timesheetEntries];
    newEntries[rowIndex] = {
      ...newEntries[rowIndex],
      total: total,
    };
    setTimesheetEntries(newEntries);
  };

  // Handle row deletion
  const handleDeleteRow = (rowIndex) => {
    const newEntries = [...timesheetEntries];
    newEntries.splice(rowIndex, 1);
    
    // Ensure there's always at least one row
    if (newEntries.length === 0) {
      newEntries.push({
        employee_id: '',
        employee_name: '',
        searchTerm: '',
        matchingEmployees: [],
        job_id: '',
        job_name: '',
        activity_id: '',
        activity_code: '',
        activity_description: '',
        pay_type: 'Regular',
        hours: '',
        burdened_rate: '',
        total: ''
      });
    }
    
    setTimesheetEntries(newEntries);
  };

  // Process timesheet data for invoice generation
  const processTimesheetData = () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      const invalidEntries = timesheetEntries.filter(entry => 
        !entry.employee_id || !entry.job_id || !entry.hours || !entry.burdened_rate
      );
      
      if (invalidEntries.length > 0) {
        setError("Please fill in all required fields (Employee, Job, Hours, Burdened Rate) for all entries.");
        setIsLoading(false);
        return;
      }
      
      // Create a map to store invoice numbers for each job
      const jobInvoiceMap = {};
      let currentInvoiceNumber = parseInt(startInvoiceNumber, 10);
      
      // Process data into required format for invoice generation
      const processed = timesheetEntries.map(entry => {
        // Assign invoice number to job if not already assigned
        if (!jobInvoiceMap[entry.job_id]) {
          jobInvoiceMap[entry.job_id] = currentInvoiceNumber.toString();
          currentInvoiceNumber++;
        }
        
        // Get job details
        const job = jobs.find(j => j.id === parseInt(entry.job_id));
        const jobName = job ? job.job_name : entry.job_name;
        const jobNumber = job ? job.job_number : '';
        
        // Format values
        const hours = parseFloat(entry.hours) || 0;
        const burdenedRate = parseFloat(entry.burdened_rate) || 0;
        const total = parseFloat(entry.total) || (hours * burdenedRate);
        
        return {
          'INV #': jobInvoiceMap[entry.job_id],
          'EMPLOYEE': entry.employee_name,
          'JOB NAME': jobName,
          'Activity Code': entry.activity_code || '',
          'Activity Description': entry.activity_description || '',
          'JOB NUMBER': jobNumber,
          'WEEK ENDING': weekEndingDate,
          'PAY TYPE': entry.pay_type,
          'HOURS': hours.toFixed(2),
          'BURDENED RATE': `$${burdenedRate.toFixed(2)}`,
          'TOTAL': `$${total.toFixed(2)}`
        };
      });
      
      setProcessedData(processed);
      setIsLoading(false);
    } catch (err) {
      console.error('Error processing timesheet data:', err);
      setError(`Error processing timesheet data: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Export processed data to Excel
  const exportToExcel = () => {
    if (!processedData) return;
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert JSON to worksheet
    const ws = XLSX.utils.json_to_sheet(processedData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet Summary');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, 'timesheet_summary.xlsx');
  };

  // Save timesheet entries to database
  const saveTimesheetEntries = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      const invalidEntries = timesheetEntries.filter(entry => 
        !entry.employee_id || !entry.job_id || !entry.hours || !entry.burdened_rate
      );
      
      if (invalidEntries.length > 0) {
        setError("Please fill in all required fields (Employee, Job, Hours, Burdened Rate) for all entries.");
        setIsLoading(false);
        return;
      }
      
      // Create timesheet entries in the database
      for (const entry of timesheetEntries) {
        await createTimesheetEntry({
          employee_id: entry.employee_id,
          job_id: entry.job_id,
          activity_id: entry.activity_id || null,
          date: weekEndingDate, // Using week ending date as the date
          hours: parseFloat(entry.hours),
          pay_type: entry.pay_type,
          burdened_rate: parseFloat(entry.burdened_rate)
        });
      }
      
      alert("Timesheet entries saved successfully!");
      
      // Reset form after successful save
      setTimesheetEntries([{
        employee_id: '',
        employee_name: '',
        searchTerm: '',
        matchingEmployees: [],
        job_id: '',
        job_name: '',
        activity_id: '',
        activity_code: '',
        activity_description: '',
        pay_type: 'Regular',
        hours: '',
        burdened_rate: '',
        total: ''
      }]);
      
      setProcessedData(null);
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving timesheet entries:", error);
      setError("Failed to save timesheet entries. Please try again.");
      setIsLoading(false);
    }
  };

  // Navigate to invoice generator with processed data
  const generateInvoices = () => {
    if (!processedData) return;
    
    localStorage.setItem('processedTimesheetData', JSON.stringify(processedData));
    navigate('/invoice-generator');
  };

  // Check for pay rate changes
  useEffect(() => {
    if (weekEndingDate) {
      // Calculate start date as 7 days before week ending date
      const endDate = new Date(weekEndingDate);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
      
      // Format dates as YYYY-MM-DD for API
      const formatDateForApi = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // We'll use the PayRateChangeNotification component which will make the API call
    }
  }, [weekEndingDate]);

  if (isLoading && !processedData) {
    return (
      <div className="flex justify-center items-center my-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-blue-600 text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header Section */}
      <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold text-center mb-2">Manual Timesheet Entry</h1>
          <p className="text-center text-blue-100">
            Enter timesheet data manually for invoice generation
          </p>
        </div>
        
        <div className="p-8">
          {/* Week Ending Date */}
          <div className="mb-6">
            <label htmlFor="weekEndingDate" className="block text-sm font-medium text-gray-700 mb-1">
              Week Ending Date (Sunday):
            </label>
            <input
              type="date"
              id="weekEndingDate"
              value={weekEndingDate}
              onChange={(e) => setWeekEndingDate(e.target.value)}
              className="w-full md:w-1/3 border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          
          {/* Pay Rate Change Notification */}
          {weekEndingDate && (() => {
            // Try to parse the weekEndingDate
            const endDate = new Date(weekEndingDate);
            
            // If we couldn't parse the date, don't show the notification
            if (isNaN(endDate.getTime())) {
              return null;
            }
            
            // Calculate start date as 7 days before week ending date
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 7);
            
            // Format dates as YYYY-MM-DD for API
            const formatDateForApi = (date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            };
            
            return (
              <PayRateChangeNotification 
                startDate={formatDateForApi(startDate)}
                endDate={formatDateForApi(endDate)}
              />
            );
          })()}
          
          {/* Invoice Numbering */}
          <div className="mb-6 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-800">Invoice Numbering</h3>
                <div className="mt-2">
                  <label htmlFor="startInvoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Invoice Number:
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      id="startInvoiceNumber"
                      value={startInvoiceNumber}
                      onChange={(e) => setStartInvoiceNumber(e.target.value)}
                      className="w-full md:w-1/4 border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Each job will get a unique invoice number starting from this value
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="my-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-red-600 px-6 py-4">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-white">Error</h3>
            </div>
          </div>
          <div className="px-6 py-4 bg-red-50">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Timesheet Entry Form */}
      {!processedData && (
        <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-teal-700 px-8 py-4 text-white">
            <h2 className="text-xl font-bold">Timesheet Entries</h2>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee*</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job*</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Type</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours*</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Burdened Rate*</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timesheetEntries.map((entry, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {/* Employee */}
                      <td className="px-4 py-2">
                        {entry.employee_name ? (
                          <div className="text-sm text-gray-900">{entry.employee_name}</div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              value={entry.searchTerm || ''}
                              onChange={(e) => handleEmployeeSearch(e.target.value, index)}
                              placeholder="Search employee"
                              className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                            />
                            {entry.matchingEmployees && entry.matchingEmployees.length > 0 && (
                              <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-md shadow-md max-h-60 overflow-y-auto">
                                {entry.matchingEmployees.map((emp) => (
                                  <li
                                    key={emp.id}
                                    onClick={() => handleEmployeeSelect(emp, index)}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  >
                                    {emp.first_name} {emp.last_name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </td>
                      
                      {/* Job */}
                      <td className="px-4 py-2">
                        <select
                          value={entry.job_id || ''}
                          onChange={(e) => handleJobChange(index, e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                          required
                        >
                          <option value="">Select Job</option>
                          {jobs.map((job) => (
                            <option key={job.id} value={job.id}>
                              {job.job_name} - {job.job_number}
                            </option>
                          ))}
                        </select>
                      </td>
                      
                      {/* Activity */}
                      <td className="px-4 py-2">
                        <select
                          value={entry.activity_id || ''}
                          onChange={(e) => handleActivityChange(index, e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                        >
                          <option value="">Select Activity (Optional)</option>
                          {activities.map((activity) => (
                            <option key={activity.id} value={activity.id}>
                              {activity.activity_code} - {activity.activity_description}
                            </option>
                          ))}
                          <option value="new">+ Add New Activity</option>
                        </select>
                      </td>
                      
                      {/* Pay Type */}
                      <td className="px-4 py-2">
                        <select
                          value={entry.pay_type || 'Regular'}
                          onChange={(e) => handlePayTypeChange(index, e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                          required
                        >
                          <option value="Regular">Regular</option>
                          <option value="Overtime">Overtime</option>
                        </select>
                      </td>
                      
                      {/* Hours */}
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={entry.hours || ''}
                          onChange={(e) => handleHoursChange(index, e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                          step="0.25"
                          min="0"
                          max="24"
                          required
                        />
                      </td>
                      
                      {/* Burdened Rate */}
                      <td className="px-4 py-2">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={entry.burdened_rate || ''}
                            onChange={(e) => handleBurdenedRateChange(index, e.target.value)}
                            className="w-full border border-gray-300 rounded-md shadow-sm pl-7 p-2 text-sm"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                      </td>
                      
                      {/* Total */}
                      <td className="px-4 py-2">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={entry.total || ''}
                            onChange={(e) => handleTotalChange(index, e.target.value)}
                            className="w-full border border-gray-300 rounded-md shadow-sm pl-7 p-2 text-sm"
                            step="0.01"
                            min="0"
                            readOnly={entry.hours && entry.burdened_rate}
                          />
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-2">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(index)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete row"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-between">
              <Button
                onClick={addEmptyRow}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Row
              </Button>
              
              <Button
                onClick={processTimesheetData}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Process Data for Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Processed Data UI */}
      {processedData && (
        <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold text-center mb-2">Processed Timesheet Data</h2>
            <p className="text-center text-blue-100 mt-1">Ready for invoice generation</p>
          </div>
          
          <div className="p-8">
            <div className="mb-6 flex flex-wrap gap-4">
              <Button 
                onClick={exportToExcel} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export to Excel
              </Button>
              <Button 
                onClick={generateInvoices} 
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Invoices
              </Button>
              <Button 
                onClick={saveTimesheetEntries} 
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save to Database
              </Button>
              <Button 
                onClick={() => setProcessedData(null)} 
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
                Back to Entry Form
              </Button>
            </div>
            
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">INV #</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMPLOYEE</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">JOB NAME</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">JOB NUMBER</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Code</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAY TYPE</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">HOURS</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">BURDENED RATE</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WEEK ENDING</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row['INV #']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row['EMPLOYEE']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row['JOB NAME']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row['JOB NUMBER']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row['Activity Code']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row['Activity Description']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          row['PAY TYPE'] === 'Overtime' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {row['PAY TYPE']}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{row['HOURS']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{row['BURDENED RATE']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{row['TOTAL']}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row['WEEK ENDING']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AddActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddActivity}
      />
    </div>
  );
};

export default ManualTimesheetEntry;
