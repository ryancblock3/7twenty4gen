import React, { useState, useEffect } from 'react';
import { fetchTimesheetHistory } from '../api';
import { Button } from './ui/button';

const TimesheetHistory = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Default to last 30 days
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [groupedTimesheets, setGroupedTimesheets] = useState({});
  const [groupBy, setGroupBy] = useState('week'); // 'week', 'employee', 'job'

  // Fetch timesheet history when component mounts or date range changes
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchTimesheetHistory(dateRange.startDate, dateRange.endDate);
        setTimesheets(data);
        groupTimesheets(data, groupBy);
      } catch (err) {
        console.error('Error fetching timesheet history:', err);
        setError('Failed to load timesheet history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, [dateRange.startDate, dateRange.endDate]);

  // Re-group timesheets when groupBy changes
  useEffect(() => {
    groupTimesheets(timesheets, groupBy);
  }, [groupBy, timesheets]);

  // Handle date range input changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Group timesheets based on selected grouping
  const groupTimesheets = (timesheets, groupingType) => {
    if (!timesheets || timesheets.length === 0) {
      setGroupedTimesheets({});
      return;
    }

    const grouped = {};

    if (groupingType === 'week') {
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
    } else if (groupingType === 'employee') {
      // Group by employee
      timesheets.forEach(entry => {
        const employeeKey = `${entry.employee_first_name} ${entry.employee_last_name}`;
        if (!grouped[employeeKey]) {
          grouped[employeeKey] = [];
        }
        grouped[employeeKey].push(entry);
      });
    } else if (groupingType === 'job') {
      // Group by job
      timesheets.forEach(entry => {
        const jobKey = `${entry.job_name} (${entry.job_number})`;
        if (!grouped[jobKey]) {
          grouped[jobKey] = [];
        }
        grouped[jobKey].push(entry);
      });
    }

    setGroupedTimesheets(grouped);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold text-center mb-2">Timesheet History</h1>
          <p className="text-center text-blue-100">
            View and analyze historical timesheet data
          </p>
        </div>
        
        <div className="p-8">
          {/* Date Range Selector */}
          <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Select Date Range</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>
          </div>
          
          {/* Grouping Options */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setGroupBy('week')}
                className={`px-4 py-2 rounded-lg ${groupBy === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Group by Week
              </Button>
              <Button
                onClick={() => setGroupBy('employee')}
                className={`px-4 py-2 rounded-lg ${groupBy === 'employee' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Group by Employee
              </Button>
              <Button
                onClick={() => setGroupBy('job')}
                className={`px-4 py-2 rounded-lg ${groupBy === 'job' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Group by Job
              </Button>
            </div>
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
          
          {/* Timesheet Data */}
          {!isLoading && Object.keys(groupedTimesheets).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No timesheet records found for the selected date range.
            </div>
          )}
          
          {!isLoading && Object.keys(groupedTimesheets).length > 0 && (
            <div className="space-y-8">
              {Object.entries(groupedTimesheets).map(([groupKey, entries]) => {
                const totals = calculateTotals(entries);
                
                return (
                  <div key={groupKey} className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-800">
                          {groupBy === 'week' ? `Week Ending: ${formatDate(groupKey)}` : groupKey}
                        </h3>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Total Hours:</span> {totals.hours.toFixed(2)} 
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Regular: {totals.regularHours.toFixed(2)}
                          </span>
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Overtime: {totals.overtimeHours.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Type</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {entries.map((entry) => (
                            <tr key={entry.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(entry.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.employee_first_name} {entry.employee_last_name}
                                <div className="text-xs text-gray-500">{entry.employee_code}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>{entry.job_name}</div>
                                <div className="text-xs">{entry.job_number}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {entry.activity_description ? (
                                  <>
                                    <div>{entry.activity_description}</div>
                                    <div className="text-xs">{entry.activity_code}</div>
                                  </>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  entry.pay_type === 'Overtime' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {entry.pay_type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                {parseFloat(entry.hours).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimesheetHistory;
