import React, { useState, useEffect } from 'react';
import { fetchInvoices, fetchInvoiceDetails } from '../api';
import { Button } from './ui/button';

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0], // Default to last 90 days
    endDate: new Date().toISOString().split('T')[0] // Today
  });

  // Fetch invoices when component mounts or date range changes
  useEffect(() => {
    const fetchInvoiceHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchInvoices(dateRange.startDate, dateRange.endDate);
        setInvoices(data);
      } catch (err) {
        console.error('Error fetching invoice history:', err);
        setError('Failed to load invoice history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoiceHistory();
  }, [dateRange.startDate, dateRange.endDate]);

  // Fetch invoice details when an invoice is selected
  useEffect(() => {
    if (!selectedInvoice) {
      setInvoiceDetails(null);
      return;
    }
    
    const getInvoiceDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const data = await fetchInvoiceDetails(selectedInvoice);
        setInvoiceDetails(data);
      } catch (err) {
        console.error('Error fetching invoice details:', err);
        setError('Failed to load invoice details. Please try again later.');
      } finally {
        setIsLoadingDetails(false);
      }
    };
    
    getInvoiceDetails();
  }, [selectedInvoice]);

  // Handle date range input changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
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

  // Calculate total hours and amount for timesheet entries
  const calculateTotals = (entries) => {
    if (!entries || entries.length === 0) return { hours: 0, regularHours: 0, overtimeHours: 0 };
    
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
          <h1 className="text-3xl font-bold text-center mb-2">Invoice History</h1>
          <p className="text-center text-blue-100">
            View and manage historical invoices
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
          
          {/* Invoice List */}
          {!isLoading && invoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No invoice records found for the selected date range.
            </div>
          )}
          
          {!isLoading && invoices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Invoice List Panel */}
              <div className="md:col-span-1 bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">Invoices</h3>
                </div>
                <div className="overflow-y-auto max-h-[600px]">
                  <ul className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <li 
                        key={invoice.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedInvoice === invoice.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedInvoice(invoice.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">Invoice #{invoice.invoice_number}</div>
                            <div className="text-sm text-gray-500">{invoice.job_name}</div>
                            <div className="text-xs text-gray-500">{invoice.job_number}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.total_amount)}</div>
                            <div className="text-xs text-gray-500">{formatDate(invoice.invoice_date)}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Invoice Details Panel */}
              <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
                {!selectedInvoice ? (
                  <div className="flex items-center justify-center h-full p-8 text-gray-500">
                    Select an invoice to view details
                  </div>
                ) : isLoadingDetails ? (
                  <div className="flex justify-center items-center p-8">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2 text-blue-600">Loading invoice details...</span>
                  </div>
                ) : invoiceDetails ? (
                  <div>
                    {/* Invoice Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-medium text-gray-800">
                            Invoice #{invoiceDetails.invoice.invoice_number}
                          </h3>
                          <div className="mt-1 text-sm text-gray-600">
                            <div>Job: {invoiceDetails.invoice.job_name} ({invoiceDetails.invoice.job_number})</div>
                            <div>Client: {invoiceDetails.invoice.client_name || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium text-gray-900">
                            {formatCurrency(invoiceDetails.invoice.total_amount)}
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>Invoice Date: {formatDate(invoiceDetails.invoice.invoice_date)}</div>
                            <div>Due Date: {formatDate(invoiceDetails.invoice.due_date)}</div>
                            <div>Week Ending: {formatDate(invoiceDetails.invoice.week_ending)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Timesheet Entries */}
                    <div className="p-6">
                      <h4 className="text-lg font-medium text-gray-800 mb-4">Timesheet Entries</h4>
                      
                      {invoiceDetails.timesheetEntries.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No timesheet entries found for this invoice.
                        </div>
                      ) : (
                        <>
                          {/* Summary */}
                          <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-700">
                              {(() => {
                                const totals = calculateTotals(invoiceDetails.timesheetEntries);
                                return (
                                  <div className="flex flex-wrap gap-4">
                                    <div>
                                      <span className="font-medium">Total Hours:</span> {totals.hours.toFixed(2)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Regular Hours:</span> {totals.regularHours.toFixed(2)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Overtime Hours:</span> {totals.overtimeHours.toFixed(2)}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          
                          {/* Entries Table */}
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Type</th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {invoiceDetails.timesheetEntries.map((entry) => (
                                  <tr key={entry.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(entry.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {entry.employee_first_name} {entry.employee_last_name}
                                      <div className="text-xs text-gray-500">{entry.employee_code}</div>
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
                        </>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex justify-end space-x-3">
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200"
                          onClick={() => {
                            // Print functionality could be implemented here
                            window.print();
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print Invoice
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200"
                          onClick={() => {
                            // Export functionality could be implemented here
                            // For now, just show an alert
                            alert('Export functionality would be implemented here');
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full p-8 text-gray-500">
                    Failed to load invoice details
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceHistory;
