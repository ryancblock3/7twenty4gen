import React, { useState, useEffect } from 'react';
import { checkPayRateChanges } from '../api';

const PayRateChangeNotification = ({ startDate, endDate }) => {
  const [payRateChanges, setPayRateChanges] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchPayRateChanges = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await checkPayRateChanges(startDate, endDate);
        setPayRateChanges(data || []);
      } catch (err) {
        console.error('Error checking pay rate changes:', err);
        // Don't show error to user, just log it and continue
        // This prevents disrupting the main workflow if this feature fails
        setPayRateChanges([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayRateChanges();
  }, [startDate, endDate]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 text-blue-600">
        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Checking for pay rate changes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
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
    );
  }

  if (payRateChanges.length === 0) {
    return null; // Don't show anything if no changes
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Pay Rate Changes Detected
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              {payRateChanges.length} employee{payRateChanges.length > 1 ? 's have' : ' has'} pay rate changes during this period.
              <button 
                onClick={() => setShowDetails(!showDetails)} 
                className="ml-2 text-yellow-800 underline hover:text-yellow-900"
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            </p>
            
            {showDetails && (
              <div className="mt-3 space-y-4">
                {payRateChanges.map(employee => (
                  <div key={employee.employee_id} className="bg-white p-3 rounded-md shadow-sm">
                    <h4 className="font-medium text-gray-800">
                      {employee.first_name} {employee.last_name} ({employee.ee_code})
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Current rates: {formatCurrency(employee.current_regular_rate)} regular / {formatCurrency(employee.current_overtime_rate)} overtime
                    </p>
                    <div className="mt-2">
                      <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Change History:</h5>
                      <ul className="mt-1 space-y-1">
                        {employee.rate_changes.map((change, index) => (
                          <li key={index} className="text-sm">
                            <span className="text-gray-600">{formatDate(change.effective_date)}:</span> {formatCurrency(change.regular_rate)} regular / {formatCurrency(change.overtime_rate)} overtime
                            {change.notes && <span className="block text-xs text-gray-500 mt-1">Note: {change.notes}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayRateChangeNotification;
