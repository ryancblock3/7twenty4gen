import React, { useState, useEffect } from 'react';
import { fetchEmployees, fetchEmployeePayHistory, addEmployeePayHistory } from '../api';
import { Button } from './ui/button';

const EmployeePayHistory = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [payHistory, setPayHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayRate, setNewPayRate] = useState({
    regular_rate: '',
    overtime_rate: '',
    effective_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Fetch employees on component mount
  useEffect(() => {
    const getEmployees = async () => {
      try {
        const data = await fetchEmployees();
        setEmployees(data || []);
        
        if (!data || data.length === 0) {
          setError('No employees found. Please add employees to the system first.');
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to load employees. Please ensure the database is properly set up and try again.');
      }
    };
    
    getEmployees();
  }, []);

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

  // Handle employee selection change
  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };

  // Handle input changes for new pay rate form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPayRate(prev => ({
      ...prev,
      [name]: value
    }));
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

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold text-center mb-2">Employee Pay History</h1>
          <p className="text-center text-blue-100">
            Track and manage employee pay rate changes over time
          </p>
        </div>
        
        <div className="p-8">
          {/* Employee Selection */}
          <div className="mb-6">
            <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-2">
              Select Employee
            </label>
            <select
              id="employee"
              value={selectedEmployee}
              onChange={handleEmployeeChange}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              disabled={employees.length === 0}
            >
              <option value="">-- Select an employee --</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} ({employee.ee_code})
                </option>
              ))}
            </select>
            {employees.length === 0 && !error && (
              <p className="mt-2 text-sm text-yellow-600">
                No employees found. Please add employees to the system first.
              </p>
            )}
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
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
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center my-8">
              <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-blue-600">Loading...</span>
            </div>
          )}
          
          {/* Pay History Table */}
          {selectedEmployee && !isLoading && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Pay Rate History</h2>
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
              
              {/* Add Pay Rate Form */}
              {showAddForm && (
                <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Pay Rate</h3>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="regular_rate" className="block text-sm font-medium text-gray-700 mb-1">
                          Regular Rate ($)
                        </label>
                        <input
                          type="number"
                          id="regular_rate"
                          name="regular_rate"
                          step="0.01"
                          min="0"
                          required
                          value={newPayRate.regular_rate}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="overtime_rate" className="block text-sm font-medium text-gray-700 mb-1">
                          Overtime Rate ($)
                        </label>
                        <input
                          type="number"
                          id="overtime_rate"
                          name="overtime_rate"
                          step="0.01"
                          min="0"
                          required
                          value={newPayRate.overtime_rate}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="effective_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Effective Date
                      </label>
                      <input
                        type="date"
                        id="effective_date"
                        name="effective_date"
                        required
                        value={newPayRate.effective_date}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows="3"
                        value={newPayRate.notes}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="Reason for pay rate change"
                      ></textarea>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-all duration-200"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Pay Rate'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              
              {payHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pay history records found for this employee.
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Regular Rate</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime Rate</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payHistory.map((record, index) => (
                        <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(record.effective_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {formatCurrency(record.regular_rate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {formatCurrency(record.overtime_rate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {record.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeePayHistory;
