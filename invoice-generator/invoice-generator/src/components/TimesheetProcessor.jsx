import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import PayRateChangeNotification from './PayRateChangeNotification';

const TimesheetProcessor = () => {
  const [processedData, setProcessedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startInvoiceNumber, setStartInvoiceNumber] = useState('2277');
  const [excelFile, setExcelFile] = useState(null);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [showMapping, setShowMapping] = useState(false);
  const [weekEndingDate, setWeekEndingDate] = useState('');
  const [manualWeekEndingDate, setManualWeekEndingDate] = useState('');
  const [columnMapping, setColumnMapping] = useState({
    firstName: '',
    lastName: '',
    jobName: '',
    jobNumber: '',
    activityCode: '',
    activityDescription: '',
    payType: '',
    hours: '',
    burdened: '',
    total: ''
  });
  const [columnExamples, setColumnExamples] = useState({});
  const navigate = useNavigate();

  // Load saved mapping from localStorage
  useEffect(() => {
    const savedMapping = localStorage.getItem('timesheetColumnMapping');
    if (savedMapping) {
      try {
        setColumnMapping(JSON.parse(savedMapping));
      } catch (error) {
        console.error('Error loading saved column mapping:', error);
      }
    }
  }, []);

  // Clean currency strings to numeric values
  const cleanCurrency = (value) => {
    if (typeof value === 'string') {
      // Remove $ and commas, then parse as float
      const cleaned = value.replace(/[$,]/g, '').trim();
      return cleaned === '' ? 0 : parseFloat(cleaned);
    }
    return typeof value === 'number' ? value : 0;
  };

  // Extract headers from Excel file
  const extractHeaders = useCallback((file) => {
    setIsLoading(true);
    setError(null);
    setExcelFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // First, try to detect if the file has headers
        // Get the range of the sheet
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const hasHeaders = range.e.r > 0; // More than one row
        
        // Get column headers - either from the first row or generate them
        let headers = [];
        let examples = {};
        
        if (hasHeaders) {
          // Try to read with headers first
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
          
          if (jsonData.length > 0) {
            headers = Object.keys(jsonData[0]);
            
            // Extract examples from the first row for each column
            headers.forEach(header => {
              examples[header] = jsonData[0][header];
            });
          }
        }
        
        // If no headers were found or the file has only one row, generate column letters
        if (headers.length === 0) {
          // Read without headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            header: 'A' // Use A, B, C as headers
          });
          
          if (jsonData.length > 0) {
            headers = Object.keys(jsonData[0]);
            
            // Extract examples from the first row for each column
            headers.forEach(header => {
              examples[header] = jsonData[0][header];
            });
          } else {
            setError('No data found in Excel file');
            setIsLoading(false);
            return;
          }
        }
        
        setExcelHeaders(headers);
        setColumnExamples(examples);
        setShowMapping(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Error reading file:', err);
        setError(`Error reading file: ${err.message}`);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  }, []);

  // Save mapping to localStorage
  const saveMapping = () => {
    localStorage.setItem('timesheetColumnMapping', JSON.stringify(columnMapping));
  };

  // Process Excel file with mapping
  const processExcelFile = useCallback(() => {
    if (!excelFile) return;
    
    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Determine if we need to use header option based on the column mapping
        // If any of the mapped columns are letter-based (A, B, C...), we need to use header option
        const hasLetterHeaders = Object.values(columnMapping).some(value => 
          value && /^[A-Z]$/.test(value)
        );
        
        // Read the data with appropriate options
        let jsonData;
        if (hasLetterHeaders) {
          // For files without headers, use A, B, C as headers
          jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            header: 'A'
          });
        } else {
          // For files with headers, use default behavior
          jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        }

          // Process data into required format
          const processedData = [];
          
          // Create a map to store invoice numbers for each job
          const jobInvoiceMap = {};
          let currentInvoiceNumber = parseInt(startInvoiceNumber, 10);
          
          // Process each row using the column mapping
          for (const item of jsonData) {
            const firstName = item[columnMapping.firstName] || '';
            const lastName = item[columnMapping.lastName] || '';
            const employeeName = `${firstName} ${lastName}`.trim();
            const jobDesc = item[columnMapping.jobName] || '';
            const jobNumber = item[columnMapping.jobNumber] || '';
            const activityCode = item[columnMapping.activityCode] || '';
            const activityDesc = item[columnMapping.activityDescription] || '';
            const payType = item[columnMapping.payType] || '';
            const hours = parseFloat(item[columnMapping.hours] || 0);
            const burdenedRate = cleanCurrency(item[columnMapping.burdened] || 0);
            const total = cleanCurrency(item[columnMapping.total] || 0);
            
            // Use the manually entered week ending date
            const weekEnding = manualWeekEndingDate || '';
            
            // Store the week ending date for pay rate change checks
            if (weekEnding && !weekEndingDate) {
              setWeekEndingDate(weekEnding);
            }
          
          // Assign invoice number to job if not already assigned
          if (!jobInvoiceMap[jobNumber]) {
            jobInvoiceMap[jobNumber] = currentInvoiceNumber.toString();
            currentInvoiceNumber++;
          }
          
          // Create base data
          const baseData = {
            'INV #': jobInvoiceMap[jobNumber],
            'EMPLOYEE': employeeName,
            'JOB NAME': jobDesc,
            'Activity Code': activityCode,
            'Activity Description': activityDesc,
            'JOB NUMBER': jobNumber,
            'WEEK ENDING': weekEnding
          };
          
          // Create entry based on pay type
          if (payType === 'Overtime') {
            const overtimeEntry = {
              ...baseData,
              'PAY TYPE': 'Overtime',
              'HOURS': hours.toFixed(2),
              'BURDENED RATE': burdenedRate,
              'TOTAL': total || (hours * burdenedRate)
            };
            processedData.push(overtimeEntry);
          } else if (payType === 'Regular') {
            const regularEntry = {
              ...baseData,
              'PAY TYPE': 'Regular',
              'HOURS': hours.toFixed(2),
              'BURDENED RATE': burdenedRate,
              'TOTAL': total || (hours * burdenedRate)
            };
            processedData.push(regularEntry);
          }
        }
        
        // Format columns and ensure no NaN values
        processedData.forEach(row => {
          // Ensure numeric values are valid
          const total = typeof row['TOTAL'] === 'number' && !isNaN(row['TOTAL']) ? 
            row['TOTAL'] : 0;
          
          const rate = typeof row['BURDENED RATE'] === 'number' && !isNaN(row['BURDENED RATE']) ? 
            row['BURDENED RATE'] : 0;
          
          // Store numeric values without currency formatting for Excel calculations
          row['TOTAL'] = total.toFixed(2);
          row['BURDENED RATE'] = rate.toFixed(2);
          
          // Ensure hours are properly formatted
          row['HOURS'] = typeof row['HOURS'] === 'string' ? 
            row['HOURS'] : row['HOURS'].toFixed(2);
        });
        
        setProcessedData(processedData);
        setShowMapping(false);
        setIsLoading(false);
      } catch (err) {
        console.error('Error processing file:', err);
        setError(`Error processing file: ${err.message}`);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };
    
    reader.readAsArrayBuffer(excelFile);
  }, [startInvoiceNumber, columnMapping, excelFile, manualWeekEndingDate]);

  const exportToExcel = () => {
    if (!processedData) return;
    
    // Create a deep copy of the data to avoid modifying the original
    const exportData = processedData.map(row => {
      // Create a new object with the same properties but without the $ symbol
      const newRow = {};
      
      // Copy all properties except BURDENED RATE and TOTAL
      Object.keys(row).forEach(key => {
        if (key !== 'BURDENED RATE' && key !== 'TOTAL' && key !== 'HOURS') {
          newRow[key] = row[key];
        }
      });
      
      // Convert string numbers to actual numbers for Excel without $ symbol
      newRow['BURDENED RATE'] = Number(row['BURDENED RATE']);
      newRow['TOTAL'] = Number(row['TOTAL']);
      newRow['HOURS'] = Number(row['HOURS']);
      
      return newRow;
    });
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Set cell formats for numeric columns
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Get the range of the sheet
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Find the column indices for BURDENED RATE and TOTAL
    const headers = Object.keys(exportData[0]);
    const burdenedRateIndex = headers.indexOf('BURDENED RATE');
    const totalIndex = headers.indexOf('TOTAL');
    const hoursIndex = headers.indexOf('HOURS');
    
    // Set the cell format for numeric columns
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      // BURDENED RATE column
      if (burdenedRateIndex !== -1) {
        const burdenedRateCell = XLSX.utils.encode_cell({r: R, c: burdenedRateIndex});
        if (!ws[burdenedRateCell]) continue;
        ws[burdenedRateCell].t = 'n'; // Set cell type to number
        ws[burdenedRateCell].z = '0.00'; // Format as number with 2 decimal places
      }
      
      // TOTAL column
      if (totalIndex !== -1) {
        const totalCell = XLSX.utils.encode_cell({r: R, c: totalIndex});
        if (!ws[totalCell]) continue;
        ws[totalCell].t = 'n'; // Set cell type to number
        ws[totalCell].z = '0.00'; // Format as number with 2 decimal places
      }
      
      // HOURS column
      if (hoursIndex !== -1) {
        const hoursCell = XLSX.utils.encode_cell({r: R, c: hoursIndex});
        if (!ws[hoursCell]) continue;
        ws[hoursCell].t = 'n'; // Set cell type to number
        ws[hoursCell].z = '0.00'; // Format as number with 2 decimal places
      }
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet Summary');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, 'timesheet_summary.xlsx');
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      extractHeaders(acceptedFiles[0]);
    }
  }, [extractHeaders]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  // Render a select field for column mapping
  const renderSelectField = (label, field, isRequired = false) => {
    const isSelected = !!columnMapping[field];
    
    return (
      <div className={`space-y-2 bg-white rounded-lg p-4 border ${isSelected ? 'border-green-300 shadow-md' : 'border-gray-200'} transition-all duration-300`}>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
            {isSelected && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Mapped
              </span>
            )}
          </label>
          {columnExamples[columnMapping[field]] && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              Example: "{columnExamples[columnMapping[field]]}"
            </span>
          )}
        </div>
        <div className="relative">
          <select 
            value={columnMapping[field]} 
            onChange={(e) => setColumnMapping({...columnMapping, [field]: e.target.value})}
            className={`w-full border ${isSelected ? 'border-green-300 bg-green-50' : 'border-gray-300'} rounded-md shadow-sm p-2 pr-10 appearance-none focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">Select column</option>
            {excelHeaders.map(header => (
              <option key={header} value={header}>
                {header} {columnExamples[header] ? `(e.g., "${columnExamples[header]}")` : ''}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        {field === 'firstName' && !isSelected && (
          <p className="text-xs text-gray-500 mt-1">Select the column containing employee first names</p>
        )}
        {field === 'lastName' && !isSelected && (
          <p className="text-xs text-gray-500 mt-1">Select the column containing employee last names</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* File Upload Section */}
      <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold text-center mb-2">Timesheet Processor</h1>
          <p className="text-center text-blue-100">
            Upload a timesheet Excel file to process and format it for invoice generation
          </p>
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
                  <p className="text-gray-700 text-lg font-medium mb-2">Drag and drop a timesheet Excel file here</p>
                  <p className="text-gray-500">or click to select a file</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
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

      {/* Error State */}
      {error && (
        <div className="my-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-red-600 px-6 py-4">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-white">Error Processing File</h3>
            </div>
          </div>
          <div className="px-6 py-4 bg-red-50">
            <p className="text-red-800">{error}</p>
          </div>
          <div className="px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              Please check your file format and try again. Make sure it's a valid Excel file with the expected data structure.
            </p>
          </div>
        </div>
      )}

      {/* Column Mapping UI */}
      {showMapping && !isLoading && (
        <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold text-center mb-2">Map Excel Columns</h2>
            <p className="text-center text-blue-100">
              Match your Excel columns to the required fields for invoice generation
            </p>
          </div>
          
          <div className="p-8">
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    For each field below, select the corresponding column from your Excel file. 
                    Fields marked with <span className="text-red-500">*</span> are required.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Mapping Progress</span>
                <span className="text-sm font-medium text-gray-700">
                  {Object.values(columnMapping).filter(Boolean).length} of 10 fields mapped
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${(Object.values(columnMapping).filter(Boolean).length / 10) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Quick actions */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button 
                onClick={() => {
                  // Auto-map columns based on common names
                  const commonMappings = {
                    firstName: ['first name', 'firstname', 'first', 'fname'],
                    lastName: ['last name', 'lastname', 'last', 'lname'],
                    jobName: ['job name', 'jobname', 'job', 'project name', 'project'],
                    jobNumber: ['job number', 'jobnumber', 'job #', 'project number', 'project #'],
                    activityCode: ['activity code', 'activitycode', 'code'],
                    activityDescription: ['activity description', 'activitydescription', 'description', 'activity desc'],
                    payType: ['pay type', 'paytype', 'type', 'payment type'],
                    hours: ['hours', 'hour', 'hrs', 'hr'],
                    burdened: ['burdened rate', 'burdenedrate', 'burdened', 'rate'],
                    total: ['total', 'amount', 'sum']
                  };
                  
                  const newMapping = { ...columnMapping };
                  let mappedCount = 0;
                  
                  // Try to auto-map columns
                  Object.entries(commonMappings).forEach(([field, possibleNames]) => {
                    if (!newMapping[field]) { // Only map if not already mapped
                      const matchedHeader = excelHeaders.find(header => 
                        possibleNames.includes(header.toLowerCase()) ||
                        possibleNames.some(name => header.toLowerCase().includes(name))
                      );
                      
                      if (matchedHeader) {
                        newMapping[field] = matchedHeader;
                        mappedCount++;
                      }
                    }
                  });
                  
                  setColumnMapping(newMapping);
                  
                  // Show toast notification
                }} 
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Auto-Map Columns
              </Button>
              
              <Button 
                onClick={() => {
                  setColumnMapping({
                    firstName: '',
                    lastName: '',
                    jobName: '',
                    jobNumber: '',
                    activityCode: '',
                    activityDescription: '',
                    payType: '',
                    hours: '',
                    burdened: '',
                    total: '',
                    weekEnding: ''
                  });
                }} 
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Mapping
              </Button>
            </div>
            
            {/* Column preview */}
            {Object.values(columnMapping).some(Boolean) && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Column Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(columnMapping).filter(([_, value]) => value).map(([field, header]) => (
                    <div key={field} className="bg-white p-2 rounded border border-gray-200 text-xs">
                      <span className="font-medium text-gray-700">{field}:</span>
                      <span className="ml-1 text-gray-600">{header}</span>
                      {columnExamples[header] && (
                        <div className="mt-1 text-gray-500 truncate" title={columnExamples[header]}>
                          Example: {columnExamples[header]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Required fields section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Required Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {renderSelectField('First Name', 'firstName', true)}
                {renderSelectField('Last Name', 'lastName', true)}
                {renderSelectField('Job Name', 'jobName', true)}
                {renderSelectField('Job Number', 'jobNumber', true)}
                {renderSelectField('Pay Type', 'payType', true)}
                {renderSelectField('Hours', 'hours', true)}
                {renderSelectField('Burdened Rate', 'burdened', true)}
              </div>
              
              <h3 className="text-lg font-medium text-gray-800 mb-3">Optional Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {renderSelectField('Activity Code', 'activityCode')}
                {renderSelectField('Activity Description', 'activityDescription')}
                {renderSelectField('Total', 'total')}
                {renderSelectField('Week Ending', 'weekEnding')}
              </div>
            </div>
          
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => {
                  // Check if all required fields are mapped
                  const requiredFields = ['firstName', 'lastName', 'jobName', 'jobNumber', 'payType', 'hours', 'burdened'];
                  const missingFields = requiredFields.filter(field => !columnMapping[field]);
                  
                  if (missingFields.length > 0) {
                    alert(`Please map the following required fields: ${missingFields.join(', ')}`);
                    return;
                  }
                  
                  saveMapping();
                  processExcelFile();
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Process with this Mapping
              </Button>
              <Button 
                onClick={saveMapping} 
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Mapping for Future Use
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Processed Data UI */}
      {processedData && !isLoading && !showMapping && (
        <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold text-center mb-2">Processed Timesheet Data</h2>
            <p className="text-center text-blue-100 mt-1">Ready for invoice generation</p>
          </div>
          
          <div className="p-8">
          {/* Week Ending Date Input */}
          <div className="mb-6 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 w-full">
                <h3 className="text-lg font-medium text-blue-800">Week Ending Date</h3>
                <p className="text-sm text-blue-600 mb-2">
                  Enter the week ending date (Sunday) for this timesheet
                </p>
                <div className="flex items-center">
                  <input
                    type="date"
                    id="manualWeekEndingDate"
                    value={manualWeekEndingDate}
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
                        setManualWeekEndingDate(`${year}-${month}-${day}`);
                        alert(`Week ending date must be a Sunday. Adjusted to the next Sunday: ${month}/${day}/${year}`);
                      } else {
                        setManualWeekEndingDate(e.target.value);
                      }
                      setWeekEndingDate(e.target.value);
                    }}
                    className="w-full md:w-1/3 border border-gray-300 rounded-md shadow-sm p-2"
                  />
                  <div className="ml-2 text-sm text-gray-500">
                    {manualWeekEndingDate && new Date(manualWeekEndingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pay Rate Change Notification */}
          {weekEndingDate && (() => {
            // Try to parse the weekEndingDate in various formats
            let endDate;
            
            // Try to detect the date format and parse it
            const tryParseDate = (dateStr) => {
              // Check if it's already in ISO format (YYYY-MM-DD)
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return new Date(dateStr);
              }
              
              // Try MM/DD/YYYY format
              if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                const [month, day, year] = dateStr.split('/');
                return new Date(year, month - 1, day);
              }
              
              // Try MM-DD-YYYY format
              if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
                const [month, day, year] = dateStr.split('-');
                return new Date(year, month - 1, day);
              }
              
              // Try to parse with Date constructor as last resort
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                return date;
              }
              
              return null;
            };
            
            endDate = tryParseDate(weekEndingDate);
            
            // If we couldn't parse the date, don't show the notification
            if (!endDate || isNaN(endDate.getTime())) {
              console.warn(`Could not parse date: ${weekEndingDate}`);
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
                onClick={() => {
                  localStorage.setItem('processedTimesheetData', JSON.stringify(processedData));
                  navigate('/invoice-generator');
                }} 
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Invoices
              </Button>
              <Button 
                onClick={() => setShowMapping(true)} 
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Adjust Column Mapping
              </Button>
            </div>
            
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
                      <Button 
                        onClick={processExcelFile}
                        className="ml-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Update
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Each job will get a unique invoice number starting from this value
                    </p>
                  </div>
                </div>
              </div>
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
    </div>
  );
};

export default TimesheetProcessor;
