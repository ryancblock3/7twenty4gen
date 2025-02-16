import React, { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import html2pdf from 'html2pdf.js';
import CombinedInvoice from './CombinedInvoice';
import JobInvoice from './JobInvoice';
import { Button } from './ui/button';

const ExcelInvoiceGenerator = () => {
  const [invoices, setInvoices] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const invoiceRefs = useRef({});

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
        activity.regularTotal = activity.regularHours * activity.regularRate;
        if (activity.overtimeRate === 0) {
          activity.overtimeRate = burdenedRate * 1.5;
        }
      } else if (payType.toLowerCase() === 'overtime') {
        activity.overtimeHours += hours;
        activity.overtimeRate = burdenedRate;
        activity.overtimeTotal = activity.overtimeHours * activity.overtimeRate;
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
    <div className="max-w-6xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="mb-8 bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-4">Excel Invoice Generator</h1>
        <div {...getRootProps()} className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-blue-500">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-blue-600">Drop the Excel file here...</p>
          ) : (
            <p className="text-gray-600">Drag and drop an Excel file here, or click to select a file</p>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center my-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-blue-500">Processing file...</span>
        </div>
      )}

      {invoices && !isLoading && (
        <div className="mb-8 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Generated Invoices</h2>
          <Button onClick={handlePrintAll} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
            Download All Invoices as PDFs
          </Button>
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
                    regularHours += activity.regularHours || 0;
                    overtimeHours += activity.overtimeHours || 0;
                    total += activity.regularTotal + activity.overtimeTotal;
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
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExcelInvoiceGenerator;