import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchInvoiceDetails, createInvoice } from '../api';
import { Button } from './ui/button';

const InvoiceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState(null);

  // Fetch invoice details
  useEffect(() => {
    const fetchInvoice = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchInvoiceDetails(id);
        setInvoice(data);
        setEditedInvoice({
          ...data.invoice,
          // Add any additional fields needed for editing
        });
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedInvoice(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle number input changes
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setEditedInvoice(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Handle date input changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setEditedInvoice(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create a new revision with the edited data
      const baseInvoiceNumber = editedInvoice.invoice_number.split('-')[0];
      
      // Check if this is already a revision
      const isRevision = editedInvoice.invoice_number.includes('-Rev');
      let revisionNumber = 1;
      
      if (isRevision) {
        // Extract the current revision number and increment it
        const match = editedInvoice.invoice_number.match(/-Rev(\d+)$/);
        if (match) {
          revisionNumber = parseInt(match[1], 10) + 1;
        }
      }
      
      // Create a new invoice number with the next revision
      const newInvoiceNumber = `${baseInvoiceNumber}-Rev${revisionNumber}`;
      
      // Prepare the invoice data
      const invoiceData = {
        job_id: editedInvoice.job_id,
        invoice_number: newInvoiceNumber,
        week_ending: editedInvoice.week_ending,
        total_amount: editedInvoice.total_amount,
        invoice_date: new Date().toISOString().split('T')[0], // Today
        due_date: editedInvoice.due_date
      };
      
      // Save to database
      await createInvoice(invoiceData);
      
      alert(`Changes saved as new revision: ${newInvoiceNumber}`);
      navigate('/invoice-history');
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError(`Failed to save changes: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0]; // YYYY-MM-DD format for input fields
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-blue-600 text-lg font-medium">Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-4">
                <Button
                  onClick={() => navigate('/invoice-history')}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200"
                >
                  Back to Invoice History
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!editedInvoice) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-8 text-gray-500">
          Invoice not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold text-center mb-2">Edit Invoice</h1>
          <p className="text-center text-blue-100">
            Make changes to invoice #{editedInvoice.invoice_number}
          </p>
        </div>
        
        <div className="p-8">
          <div className="mb-6 bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Note:</span> Changes will be saved as a new revision of this invoice.
                  The original invoice will remain unchanged.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Details */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">Invoice Details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    id="invoice_number"
                    name="invoice_number"
                    value={editedInvoice.invoice_number}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A new revision number will be assigned automatically
                  </p>
                </div>
                
                <div>
                  <label htmlFor="job_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Name
                  </label>
                  <input
                    type="text"
                    id="job_name"
                    name="job_name"
                    value={editedInvoice.job_name || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="job_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Number
                  </label>
                  <input
                    type="text"
                    id="job_number"
                    name="job_number"
                    value={editedInvoice.job_number || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    id="total_amount"
                    name="total_amount"
                    value={editedInvoice.total_amount || 0}
                    onChange={handleNumberChange}
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
            </div>
            
            {/* Dates */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">Dates</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="invoice_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    id="invoice_date"
                    name="invoice_date"
                    value={formatDate(editedInvoice.invoice_date)}
                    onChange={handleDateChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formatDate(editedInvoice.due_date)}
                    onChange={handleDateChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="week_ending" className="block text-sm font-medium text-gray-700 mb-1">
                    Week Ending Date (Sunday)
                  </label>
                  <input
                    type="date"
                    id="week_ending"
                    name="week_ending"
                    value={formatDate(editedInvoice.week_ending)}
                    onChange={(e) => {
                      // Ensure the selected date is a Sunday
                      const selectedDate = new Date(e.target.value);
                      if (selectedDate.getDay() !== 0) { // 0 is Sunday
                        // Find the next Sunday
                        const daysUntilSunday = 7 - selectedDate.getDay();
                        selectedDate.setDate(selectedDate.getDate() + daysUntilSunday);
                        // Format back to YYYY-MM-DD
                        const year = selectedDate.getFullYear();
                        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const day = String(selectedDate.getDate()).padStart(2, '0');
                        const formattedDate = `${year}-${month}-${day}`;
                        
                        handleDateChange({
                          target: {
                            name: 'week_ending',
                            value: formattedDate
                          }
                        });
                        
                        alert(`Week ending date must be a Sunday. Adjusted to the next Sunday: ${month}/${day}/${year}`);
                      } else {
                        handleDateChange(e);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Week ending date must be a Sunday
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              onClick={() => navigate('/invoice-history')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200"
            >
              {isSaving ? 'Saving...' : 'Save as New Revision'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;
