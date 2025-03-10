import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import html2pdf from 'html2pdf.js';
import CombinedInvoice from './CombinedInvoice';
import JobInvoice from './JobInvoice';
import { Button } from './ui/button';

const ExcelInvoiceGenerator = () => {
  const [invoices, setInvoices] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState('upload'); // 'upload' or 'processed'
  const invoiceRefs = useRef({});
  const [savedInvoices, setSavedInvoices] = useState({});
  const [notification, setNotification] = useState(null);
  
  // Check for processed timesheet data in localStorage on component mount
  useEffect(() => {
    const processedData = localStorage.getItem('processedTimesheetData');
    if (processedData) {
      try {
        const parsedData = JSON.parse(processedData);
        if (parsedData && parsedData.length > 0) {
          setDataSource('processed');
          processTimesheetData(parsedData);
        }
      } catch (error) {
        console.error('Error parsing processed timesheet data:', error);
      }
    }
  }, []);

  const businessInfo = {
    name: "Twenty4 Services LLC",
    address: "200 Greenlea St",
    city: "Pulaski",
    state: "VA",
    zip: "24301",
    phone: "(972) 333-0913",
    email: "kim@twenty4services.com",
    paymentTerms: "Net 30",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
  };

  // Process data from the TimesheetProcessor component
  const processTimesheetData = (data) => {
    setIsLoading(true);
    try {
      const processedInvoices = processData(data);
      setInvoices(processedInvoices);
      // Clear the localStorage data to prevent reprocessing on refresh
      localStorage.removeItem('processedTimesheetData');
    } catch (error) {
      console.error('Error processing timesheet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processExcelFile = useCallback((file) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'mm/dd/yyyy' });

      const processedInvoices = processData(jsonData);
      setInvoices(processedInvoices);
      setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const processData = (data) => {
    // Check if data is already in JSON format (from TimesheetProcessor)
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
      return processJsonData(data);
    } else {
      // Process Excel data (from file upload)
      return processExcelData(data);
    }
  };

  // Process data from TimesheetProcessor (JSON format)
  const processJsonData = (data) => {
    const invoices = {};

    for (const row of data) {
      const invoiceNumber = row['INV #'];
      const employee = row['EMPLOYEE'];
      const payType = row['PAY TYPE'];
      const activityCode = row['Activity Code'] || '';
      const activityDescription = row['Activity Description'] || '';
      
      if (!invoices[invoiceNumber]) {
        invoices[invoiceNumber] = {
          jobName: row['JOB NAME'],
          jobNumber: row['JOB NUMBER'],
          weekEnding: row['WEEK ENDING'],
          employees: {},
          clientName: "CEC Facilities Group",
          clientAddress: "1275 Valley View Lane",
          clientCity: "Irving",
          clientState: "TX",
          clientZip: "75061"
        };
      }

      if (!invoices[invoiceNumber].employees[employee]) {
        invoices[invoiceNumber].employees[employee] = {
          activities: {}
        };
      }

      // Clean and parse numeric values
      const hours = typeof row['HOURS'] === 'string' ? 
        parseFloat(row['HOURS'].replace(/[^\d.-]/g, '')) : 
        (typeof row['HOURS'] === 'number' ? row['HOURS'] : 0);
      
      const burdenedRate = typeof row['BURDENED RATE'] === 'string' ? 
        parseFloat(row['BURDENED RATE'].replace(/[^\d.-]/g, '')) : 
        (typeof row['BURDENED RATE'] === 'number' ? row['BURDENED RATE'] : 0);

      const activityKey = `${activityCode} - ${activityDescription}`;

      if (!invoices[invoiceNumber].employees[employee].activities[activityKey]) {
        invoices[invoiceNumber].employees[employee].activities[activityKey] = {
          activityCode,
          activityDescription,
          regularHours: 0,
          overtimeHours: 0,
          regularRate: 0,
          overtimeRate: 0,
          regularTotal: 0,
          overtimeTotal: 0
        };
      }

      const activity = invoices[invoiceNumber].employees[employee].activities[activityKey];

      if (payType.toLowerCase() === 'regular') {
        activity.regularHours += hours;
        activity.regularRate = burdenedRate;
        // Round to 2 decimal places to match Excel precision
        activity.regularTotal = parseFloat((activity.regularHours * activity.regularRate).toFixed(2));
        if (activity.overtimeRate === 0) {
          activity.overtimeRate = burdenedRate * 1.5;
        }
      } else if (payType.toLowerCase() === 'overtime') {
        activity.overtimeHours += hours;
        activity.overtimeRate = burdenedRate;
        // Round to 2 decimal places to match Excel precision
        activity.overtimeTotal = parseFloat((activity.overtimeHours * activity.overtimeRate).toFixed(2));
        if (activity.regularRate === 0) {
          activity.regularRate = burdenedRate / 1.5;
        }
      }
    }

    return invoices;
  };

  // Process data from Excel file
  const processExcelData = (data) => {
    const headers = data[0];
    const invoices = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const invoiceNumber = row[headers.indexOf('INV #')];
      const employee = row[headers.indexOf('EMPLOYEE')];
      const payType = row[headers.indexOf('PAY TYPE')];
      const activityCode = row[headers.indexOf('Activity Code')] || '';
      const activityDescription = row[headers.indexOf('Activity Description')] || '';
      
      if (!invoices[invoiceNumber]) {
        invoices[invoiceNumber] = {
          jobName: row[headers.indexOf('JOB NAME')],
          jobNumber: row[headers.indexOf('JOB NUMBER')],
          weekEnding: row[headers.indexOf('WEEK ENDING')],
          employees: {},
          clientName: "CEC Facilities Group",
          clientAddress: "1275 Valley View Lane",
          clientCity: "Irving",
          clientState: "TX",
          clientZip: "75061"
        };
      }

      if (!invoices[invoiceNumber].employees[employee]) {
        invoices[invoiceNumber].employees[employee] = {
          activities: {}
        };
      }

      const hours = parseFloat(row[headers.indexOf('HOURS')]) || 0;
      const burdenedRate = parseFloat(row[headers.indexOf('BURDENED RATE')]) || 0;

      const activityKey = `${activityCode} - ${activityDescription}`;

      if (!invoices[invoiceNumber].employees[employee].activities[activityKey]) {
        invoices[invoiceNumber].employees[employee].activities[activityKey] = {
          activityCode,
          activityDescription,
          regularHours: 0,
          overtimeHours: 0,
          regularRate: 0,
          overtimeRate: 0,
          regularTotal: 0,
          overtimeTotal: 0
        };
      }

      const activity = invoices[invoiceNumber].employees[employee].activities[activityKey];

      if (payType.toLowerCase() === 'regular') {
        activity.regularHours += hours;
        activity.regularRate = burdenedRate;
        // Round to 2 decimal places to match Excel precision
        activity.regularTotal = parseFloat((activity.regularHours * activity.regularRate).toFixed(2));
        if (activity.overtimeRate === 0) {
          activity.overtimeRate = burdenedRate * 1.5;
        }
      } else if (payType.toLowerCase() === 'overtime') {
        activity.overtimeHours += hours;
        activity.overtimeRate = burdenedRate;
        // Round to 2 decimal places to match Excel precision
        activity.overtimeTotal = parseFloat((activity.overtimeHours * activity.overtimeRate).toFixed(2));
        if (activity.regularRate === 0) {
          activity.regularRate = burdenedRate / 1.5;
        }
      }
    }

    return invoices;
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      processExcelFile(acceptedFiles[0]);
    }
  }, [processExcelFile]);

  const handlePrintAll = async () => {
    if (!invoices) return;

    for (const [invNumber, jobData] of Object.entries(invoices)) {
      const element = invoiceRefs.current[invNumber];
      if (element) {
        const fileName = `INV#${invNumber} ${jobData.jobNumber} ${jobData.jobName}.pdf`;
        const opt = {
          margin: 10,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().from(element).set(opt).save();
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold text-center mb-2">Excel Invoice Generator</h1>
          <p className="text-center text-blue-100">Upload your timesheet Excel file to generate professional invoices</p>
        </div>
        
        <div className="p-8">
          <div 
            {...getRootProps()} 
            className="border-2 border-dashed border-blue-300 rounded-xl p-10 text-center cursor-pointer transition-all duration-300 hover:border-blue-500 hover:bg-blue-50"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-16 w-16 mb-4 ${isDragActive ? 'text-blue-600' : 'text-blue-400'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              {isDragActive ? (
                <p className="text-blue-600 text-lg font-medium">Drop the Excel file here...</p>
              ) : (
                <>
                  <p className="text-gray-700 text-lg font-medium mb-2">Drag and drop an Excel file here</p>
                  <p className="text-gray-500">or click to select a file</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center my-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-600 text-lg font-medium">Processing file...</span>
            <p className="text-gray-500 mt-2 text-center max-w-md">
              This may take a moment depending on the size of your Excel file.
            </p>
          </div>
        </div>
      )}

      {dataSource === 'processed' && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-6 shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">Using Processed Data</h3>
              <p className="mt-1 text-green-700">
                Using processed timesheet data from Timesheet Processor.
              </p>
              <div className="mt-3">
                <button 
                  onClick={() => {
                    setDataSource('upload');
                    setInvoices(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Clear and Upload New File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`mb-6 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' : 'bg-red-100 border-l-4 border-red-500 text-red-700'}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setNotification(null)}
                  className={`inline-flex rounded-md p-1.5 ${notification.type === 'success' ? 'text-green-500 hover:bg-green-200' : 'text-red-500 hover:bg-red-200'} focus:outline-none`}
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {invoices && !isLoading && (
        <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold text-center">Generated Invoices</h2>
            <p className="text-center text-blue-100 mt-1">Ready to download or print</p>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={handlePrintAll} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All Invoices as PDFs
              </Button>
            </div>
          </div>
        </div>
      )}

      {invoices && !isLoading && (
        <div className="space-y-8">
          <div className="bg-white shadow-lg rounded-lg p-6 print:shadow-none">
            <CombinedInvoice 
              invoices={Object.entries(invoices).map(([invNumber, data]) => {
                let regularHours = 0;
                let overtimeHours = 0;
                let total = 0;

                Object.values(data.employees).forEach(employee => {
                  Object.values(employee.activities).forEach(activity => {
                    // Round hours to 2 decimal places for consistency
                    regularHours = parseFloat((regularHours + (activity.regularHours || 0)).toFixed(2));
                    overtimeHours = parseFloat((overtimeHours + (activity.overtimeHours || 0)).toFixed(2));
                    // Round the sum to 2 decimal places to match Excel precision
                    total = parseFloat((total + (activity.regularTotal + activity.overtimeTotal)).toFixed(2));
                  });
                });

                return {
                  invNumber,
                  jobName: data.jobName,
                  jobNumber: data.jobNumber,
                  regularHours,
                  overtimeHours,
                  total,
                  weekEnding: data.weekEnding
                };
              })} 
            />
          </div>

          {Object.entries(invoices).map(([invNumber, jobData], index) => (
            <div key={invNumber} className={`bg-white shadow-lg rounded-lg p-6 print:shadow-none ${index > 0 ? 'mt-8 print:mt-0 page-break' : 'mt-8'}`}>
              <div ref={el => invoiceRefs.current[invNumber] = el}>
                <JobInvoice 
                  jobData={jobData} 
                  invoiceNumber={invNumber} 
                  businessInfo={businessInfo}
                  onSaveSuccess={(invoiceNumber) => {
                    setSavedInvoices(prev => ({
                      ...prev,
                      [invoiceNumber]: true
                    }));
                    setNotification({
                      type: 'success',
                      message: `Invoice #${invoiceNumber} saved successfully!`
                    });
                    // Auto-dismiss notification after 5 seconds
                    setTimeout(() => {
                      setNotification(null);
                    }, 5000);
                  }}
                />
              </div>
              {savedInvoices[invNumber] && (
                <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">This invoice has been saved to the database</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExcelInvoiceGenerator;
