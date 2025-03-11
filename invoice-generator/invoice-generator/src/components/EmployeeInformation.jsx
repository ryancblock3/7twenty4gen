import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchEmployees, 
  fetchEmployeePayHistory, 
  addEmployeePayHistory, 
  fetchTimesheetHistory,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from '../api';
import { Button } from './ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';

const EmployeeInformation = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [payHistory, setPayHistory] = useState([]);
  const [timesheetHistory, setTimesheetHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayRate, setNewPayRate] = useState({
    regular_rate: '',
    overtime_rate: '',
    effective_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0], // Default to last 90 days
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [activeTab, setActiveTab] = useState('payHistory'); // 'payHistory', 'hoursWorked', 'manageEmployees'
  const [isCalculatingOT, setIsCalculatingOT] = useState(true); // Toggle for auto-calculating OT rate
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeFormMode, setEmployeeFormMode] = useState('add'); // 'add', 'edit'
  const [employeeFormData, setEmployeeFormData] = useState({
    ee_code: '',
    first_name: '',
    last_name: '',
    regular_rate: '',
    overtime_rate: ''
  });
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const successMessageTimeoutRef = useRef(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [dateRangePreset, setDateRangePreset] = useState('custom');

  // Fetch employees on component mount and when employees are added/updated/deleted
  useEffect(() => {
    const getEmployees = async () => {
      try {
        setIsLoading(true);
        const data = await fetchEmployees();
        setEmployees(data || []);
        
        if (!data || data.length === 0) {
          setError('No employees found. Please add employees to the system first.');
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to load employees. Please ensure the database is properly set up and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    getEmployees();
  }, []);
  
  // Clear success message after timeout
  useEffect(() => {
    if (successMessage) {
      if (successMessageTimeoutRef.current) {
        clearTimeout(successMessageTimeoutRef.current);
      }
      
      successMessageTimeoutRef.current = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
    
    return () => {
      if (successMessageTimeoutRef.current) {
        clearTimeout(successMessageTimeoutRef.current);
      }
    };
  }, [successMessage]);

  // Fetch pay history when an employee is selected
  useEffect(() => {
    if (!selectedEmployee) return;
    
    const getPayHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchEmployeePayHistory(selectedEmployee);
        setPayHistory(data);
      } catch (err) {
        console.error('Error fetching pay history:', err);
        setError('Failed to load pay history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    getPayHistory();
  }, [selectedEmployee]);

  // Fetch timesheet history when an employee is selected and date range changes
  useEffect(() => {
    if (!selectedEmployee) return;
    
    const getTimesheetHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all timesheets for the date range
        const data = await fetchTimesheetHistory(dateRange.startDate, dateRange.endDate);
        
        // Filter timesheets for the selected employee
        const selectedEmployeeData = data.filter(entry => entry.employee_id === parseInt(selectedEmployee));
        
        // Group by week
        const groupedByWeek = groupTimesheetsByWeek(selectedEmployeeData);
        
        setTimesheetHistory(groupedByWeek);
      } catch (err) {
        console.error('Error fetching timesheet history:', err);
        setError('Failed to load timesheet history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    getTimesheetHistory();
  }, [selectedEmployee, dateRange.startDate, dateRange.endDate]);

  // Group timesheets by week
  const groupTimesheetsByWeek = (timesheets) => {
    if (!timesheets || timesheets.length === 0) {
      return [];
    }

    const grouped = {};

    // Group by week ending (assuming date is in ISO format YYYY-MM-DD)
    timesheets.forEach(entry => {
      const entryDate = new Date(entry.date);
      // Find the next Saturday (week ending)
      const dayOfWeek = entryDate.getDay(); // 0 = Sunday, 6 = Saturday
      const daysUntilSaturday = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
      const weekEndingDate = new Date(entryDate);
      weekEndingDate.setDate(entryDate.getDate() + daysUntilSaturday);
      
      const weekEnding = weekEndingDate.toISOString().split('T')[0];
      
      if (!grouped[weekEnding]) {
        grouped[weekEnding] = [];
      }
      grouped[weekEnding].push(entry);
    });

    // Convert to array and sort by week ending date (most recent first)
    return Object.entries(grouped)
      .map(([weekEnding, entries]) => ({
        weekEnding,
        entries,
        totals: calculateTotals(entries)
      }))
      .sort((a, b) => new Date(b.weekEnding) - new Date(a.weekEnding));
  };

  // Calculate total hours and amount for a group of timesheet entries
  const calculateTotals = (entries) => {
    return entries.reduce((totals, entry) => {
      const hours = parseFloat(entry.hours) || 0;
      return {
        hours: totals.hours + hours,
        regularHours: entry.pay_type === 'Regular' ? totals.regularHours + hours : totals.regularHours,
        overtimeHours: entry.pay_type === 'Overtime' ? totals.overtimeHours + hours : totals.overtimeHours
      };
    }, { hours: 0, regularHours: 0, overtimeHours: 0 });
  };

  // Handle employee selection change
  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };
  
  // Handle employee form input changes
  const handleEmployeeFormChange = (e) => {
    const { name, value } = e.target;
    setEmployeeFormData(prev => ({
      ...prev,
      [name]: name.includes('rate') ? parseFloat(value) || '' : value
    }));
  };
  
  // Calculate overtime rate automatically
  const calculateOvertimeRate = (regularRate) => {
    if (!regularRate) return '';
    return (parseFloat(regularRate) * 1.5).toFixed(2);
  };
  
  // Handle regular rate change to auto-calculate overtime rate
  const handleRegularRateChange = (e) => {
    const regularRate = e.target.value;
    setEmployeeFormData(prev => ({
      ...prev,
      regular_rate: regularRate,
      overtime_rate: isCalculatingOT ? calculateOvertimeRate(regularRate) : prev.overtime_rate
    }));
  };
  
  // Toggle auto-calculation of overtime rate
  const toggleOTCalculation = () => {
    setIsCalculatingOT(!isCalculatingOT);
    if (isCalculatingOT && employeeFormData.regular_rate) {
      // If turning on auto-calculation, update the OT rate
      setEmployeeFormData(prev => ({
        ...prev,
        overtime_rate: calculateOvertimeRate(prev.regular_rate)
      }));
    }
  };
  
  // Open employee form in add mode
  const handleAddEmployee = () => {
    setEmployeeFormData({
      ee_code: '',
      first_name: '',
      last_name: '',
      regular_rate: '',
      overtime_rate: ''
    });
    setEmployeeFormMode('add');
    setShowEmployeeForm(true);
  };
  
  // Open employee form in edit mode
  const handleEditEmployee = (employee) => {
    setEmployeeFormData({
      ee_code: employee.ee_code,
      first_name: employee.first_name,
      last_name: employee.last_name,
      regular_rate: employee.regular_rate,
      overtime_rate: employee.overtime_rate
    });
    setSelectedEmployee(employee.id.toString());
    setEmployeeFormMode('edit');
    setShowEmployeeForm(true);
    setActiveTab('manageEmployees');
  };
  
  // Open delete confirmation
  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };
  
  // Submit employee form (add or edit)
  const handleEmployeeFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (employeeFormMode === 'add') {
        // Create new employee
        await createEmployee(employeeFormData);
        setSuccessMessage('Employee added successfully!');
      } else {
        // Update existing employee
        await updateEmployee(selectedEmployee, employeeFormData);
        setSuccessMessage('Employee updated successfully!');
      }
      
      // Refresh employee list
      const updatedEmployees = await fetchEmployees();
      setEmployees(updatedEmployees);
      
      // Reset form
      setShowEmployeeForm(false);
      setEmployeeFormData({
        ee_code: '',
        first_name: '',
        last_name: '',
        regular_rate: '',
        overtime_rate: ''
      });
    } catch (err) {
      console.error('Error saving employee:', err);
      setError(`Failed to ${employeeFormMode === 'add' ? 'add' : 'update'} employee. ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete employee
  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteEmployee(employeeToDelete.id);
      
      // Refresh employee list
      const updatedEmployees = await fetchEmployees();
      setEmployees(updatedEmployees);
      
      // Reset selected employee if it was deleted
      if (selectedEmployee === employeeToDelete.id.toString()) {
        setSelectedEmployee('');
      }
      
      setSuccessMessage('Employee deleted successfully!');
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError(`Failed to delete employee. ${err.message}`);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    }
  };

  // Handle date range input changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setDateRangePreset('custom');
  };

  // Handle date range preset selection
  const handleDateRangePreset = (preset) => {
    const today = new Date();
    let startDate;
    
    switch(preset) {
      case 'last30':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'last60':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 60);
        break;
      case 'last90':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
    setDateRangePreset(preset);
  };

  // Handle input changes for new pay rate form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'regular_rate' && isCalculatingOT) {
      // Auto-calculate overtime rate when regular rate changes
      setNewPayRate(prev => ({
        ...prev,
        regular_rate: value,
        overtime_rate: calculateOvertimeRate(value)
      }));
    } else {
      setNewPayRate(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle form submission for new pay rate
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert string rates to numbers
      const payRateData = {
        ...newPayRate,
        regular_rate: parseFloat(newPayRate.regular_rate),
        overtime_rate: parseFloat(newPayRate.overtime_rate)
      };
      
      await addEmployeePayHistory(selectedEmployee, payRateData);
      
      // Refresh pay history
      const updatedHistory = await fetchEmployeePayHistory(selectedEmployee);
      setPayHistory(updatedHistory);
      
      // Reset form
      setNewPayRate({
        regular_rate: '',
        overtime_rate: '',
        effective_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding pay history:', err);
      setError('Failed to add pay rate history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get current employee information
  const getCurrentEmployee = () => {
    if (!selectedEmployee || employees.length === 0) return null;
    return employees.find(emp => emp.id === parseInt(selectedEmployee));
  };

  // Get current pay rate (most recent)
  const getCurrentPayRate = () => {
    if (!payHistory || payHistory.length === 0) return null;
    
    // Sort by effective date (most recent first)
    const sortedHistory = [...payHistory].sort((a, b) => 
      new Date(b.effective_date) - new Date(a.effective_date)
    );
    
    return sortedHistory[0];
  };

  // Handle sorting for tables
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => {
    if (!employeeSearch) return true;
    
    const searchLower = employeeSearch.toLowerCase();
    return (
      employee.first_name.toLowerCase().includes(searchLower) ||
      employee.last_name.toLowerCase().includes(searchLower) ||
      employee.ee_code.toLowerCase().includes(searchLower)
    );
  });

  // Sort employees based on sort config
  const sortedEmployees = React.useMemo(() => {
    let sortableEmployees = [...filteredEmployees];
    if (sortConfig.key) {
      sortableEmployees.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableEmployees;
  }, [filteredEmployees, sortConfig]);

  // Print current view
  const handlePrint = () => {
    window.print();
  };

  const currentEmployee = getCurrentEmployee();
  const currentPayRate = getCurrentPayRate();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">Employee Information</h1>
          <p className="text-center text-blue-100">
            View and manage employee details, pay rates, and work history
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('payHistory')}
              className={`px-4 py-3 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                activeTab === 'payHistory' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Pay History
              </span>
            </button>
            <button
              onClick={() => setActiveTab('hoursWorked')}
              className={`px-4 py-3 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                activeTab === 'hoursWorked' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Hours Worked
              </span>
            </button>
            <button
              onClick={() => setActiveTab('manageEmployees')}
              className={`px-4 py-3 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                activeTab === 'manageEmployees' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Manage Employees
              </span>
            </button>
          </div>
        </div>
        
        <div className="p-4 md:p-8">
          {/* Employee Selection */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex-grow">
                <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee
                </label>
                <div className="relative">
                  <select
                    id="employee"
                    value={selectedEmployee}
                    onChange={handleEmployeeChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-3 pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    disabled={employees.length === 0 || isLoading}
                  >
                    <option value="">-- Select an employee --</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name} ({employee.ee_code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                {employees.length === 0 && !error && (
                  <p className="text-sm text-yellow-600 mt-2">
                    No employees found. Please add employees to the system.
                  </p>
                )}
              </div>
              
              <Button
                onClick={() => {
                  handleAddEmployee();
                  setActiveTab('manageEmployees');
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Employee
              </Button>
            </div>
            
            {/* Current Employee Summary Card - only show when employee is selected */}
            {selectedEmployee && currentEmployee && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {currentEmployee.first_name} {currentEmployee.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">Employee Code: {currentEmployee.ee_code}</p>
                  </div>
                  {currentPayRate && (
                    <div className="mt-2 md:mt-0 md:text-right">
                      <p className="text-sm text-gray-600">Current Pay Rate:</p>
                      <p className="text-base font-medium text-gray-900">
                        {formatCurrency(currentPayRate.regular_rate)} / hr (Regular)
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(currentPayRate.overtime_rate)} / hr (Overtime)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}
          
          {/* Pay History Tab */}
          {selectedEmployee && !isLoading && activeTab === 'payHistory' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Pay Rate History</h2>
                <div className="flex space-x-2">
                  <Button
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 flex items-center mr-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                    </svg>
                    Print
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {showAddForm ? 'Cancel' : 'Add Pay Rate Change'}
                  </Button>
                </div>
              </div>
              
              {/* This is a placeholder to fix the JSX structure */}
            </>
          )}
          
          {/* Hours Worked Tab */}
          {selectedEmployee && !isLoading && activeTab === 'hoursWorked' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Hours Worked History</h2>
              </div>
            </>
          )}
          
          {/* Manage Employees Tab */}
          {activeTab === 'manageEmployees' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Manage Employees</h2>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeInformation;
