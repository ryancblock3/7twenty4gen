import React, { useRef, useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';
import html2pdf from 'html2pdf.js';

const logoUrl = '/logo.png';

const NewCompanyInvoice = () => {
  const [activeJob, setActiveJob] = useState('all'); // 'all', 'Atlanta', or 'Austin'
  const [editMode, setEditMode] = useState(false);
  const [invoiceData, setInvoiceData] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState(`BTC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`);
  const [useBtcPrefix, setUseBtcPrefix] = useState(true);
  const [useRelPrefix, setUseRelPrefix] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toLocaleDateString());
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString());
  const componentRef = useRef(null);
  const atlantaRef = useRef(null);
  const austinRef = useRef(null);

  // Business information (7Twenty4 Services LLC - the company issuing the invoice)
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

  // Client information (Build.Test.Connect Solutions LLC - the company being invoiced)
  const clientInfo = {
    name: "Build.Test.Connect Solutions LLC",
    address: "4141 FORTUNE LN",
    city: "Dallas",
    state: "TX",
    zip: "75216"
  };

  // Initialize invoice data from the provided table
  useEffect(() => {
    // Initial employee data from the provided table
    const initialEmployeeData = [
      { 
        id: 1,
        name: "Miguel Martinez", 
        job: "Atlanta", 
        hours: 24, 
        rate: 58.37, 
        totalLabor: 1400.88, 
        perDiem: "", 
        mileage: 1014.00, 
        safetyEquipment: 793.54, 
        total: 3208.42 // Removed classes value (100.00) from total
      },
      { 
        id: 2,
        name: "Ron Gil", 
        job: "Atlanta", 
        hours: 12, 
        rate: 27.64, 
        totalLabor: 331.68, 
        perDiem: 250.00, 
        mileage: 507.00, 
        safetyEquipment: "", 
        total: 1088.68 // Removed classes value (100.00) from total
      },
      { 
        id: 3,
        name: "Jose Rene Lobez", 
        job: "Austin", 
        hours: 3, 
        rate: 27.64, 
        totalLabor: 82.92, 
        perDiem: 225.00, 
        mileage: 157.30, 
        safetyEquipment: "", 
        total: 465.22 // Removed classes value (100.00) from total
      },
      { 
        id: 4,
        name: "Jesus Vasquez", 
        job: "Atlanta", 
        hours: 12, 
        rate: 38.44, 
        totalLabor: 461.28, 
        perDiem: 250.00, 
        mileage: 507.00, 
        safetyEquipment: "", 
        total: 1218.28 // Removed classes value (100.00) from total
      },
      { 
        id: 5,
        name: "Jose Luis Gonzalez", 
        job: "Atlanta", 
        hours: 12, 
        rate: 38.44, 
        totalLabor: 461.28, 
        perDiem: 250.00, 
        mileage: 507.00, 
        safetyEquipment: "", 
        total: 1218.28 // Removed classes value (100.00) from total
      },
      { 
        id: 6,
        name: "Adal Mora", 
        job: "Atlanta", 
        hours: 0, 
        rate: 29.80, 
        totalLabor: 0, 
        perDiem: 250.00, 
        mileage: "", 
        safetyEquipment: "", 
        total: 250.00 // Removed classes value (100.00) from total
      },
      { 
        id: 7,
        name: "Adrian Achury", 
        job: "Atlanta", 
        hours: 0, 
        rate: 27.64, 
        totalLabor: 0, 
        perDiem: 250.00, 
        mileage: "", 
        safetyEquipment: "", 
        total: 250.00 // Removed classes value (100.00) from total
      },
      { 
        id: 8,
        name: "Carlos Escalona", 
        job: "Atlanta", 
        hours: 0, 
        rate: 27.64, 
        totalLabor: 0, 
        perDiem: 250.00, 
        mileage: "", 
        safetyEquipment: "", 
        total: 250.00 // Removed classes value (100.00) from total
      },
      { 
        id: 9,
        name: "Erick Gonsales", 
        job: "Austin", 
        hours: 0, 
        rate: 29.80, 
        totalLabor: 0, 
        perDiem: 180.00, 
        mileage: "", 
        safetyEquipment: "", 
        total: 180.00
      },
      { 
        id: 10,
        name: "Jober Luis Torrez Escarlona", 
        job: "Austin", 
        hours: 0, 
        rate: 27.64, 
        totalLabor: 0, 
        perDiem: 180.00, 
        mileage: "", 
        safetyEquipment: "", 
        total: 180.00
      }
    ];

    setInvoiceData(initialEmployeeData);
  }, []);

  // Group employees by job
  const getEmployeesByJob = (job) => {
    if (job === 'all') {
      return invoiceData;
    }
    return invoiceData.filter(employee => employee.job === job);
  };

  // Calculate totals for a group of employees
  const calculateTotals = (employees) => {
    let totalHours = 0;
    let totalLabor = 0;
    let totalPerDiem = 0;
    let totalMileage = 0;
    let totalSafetyEquipment = 0;
    let grandTotal = 0;

    employees.forEach(employee => {
      totalHours += employee.hours || 0;
      totalLabor += employee.totalLabor || 0;
      totalPerDiem += employee.perDiem || 0;
      totalMileage += employee.mileage || 0;
      totalSafetyEquipment += employee.safetyEquipment || 0;
      grandTotal += employee.total || 0;
    });

    return {
      totalHours,
      totalLabor,
      totalPerDiem,
      totalMileage,
      totalSafetyEquipment,
      grandTotal
    };
  };

  // Update employee data
  const updateEmployee = (employeeId, field, value) => {
    const updatedData = invoiceData.map(employee => {
      if (employee.id === employeeId) {
        const updatedEmployee = { ...employee, [field]: value };
        
        // If updating hours or rate, recalculate totalLabor
        if (field === 'hours' || field === 'rate') {
          updatedEmployee.totalLabor = parseFloat((updatedEmployee.hours * updatedEmployee.rate).toFixed(2));
        }
        
        // Recalculate total
        updatedEmployee.total = parseFloat((
          (updatedEmployee.totalLabor || 0) + 
          (updatedEmployee.perDiem || 0) + 
          (updatedEmployee.mileage || 0) + 
          (updatedEmployee.safetyEquipment || 0)
        ).toFixed(2));
        
        return updatedEmployee;
      }
      return employee;
    });
    
    setInvoiceData(updatedData);
  };

  // Add a new employee
  const addEmployee = (job) => {
    const newId = Math.max(...invoiceData.map(emp => emp.id), 0) + 1;
    const newEmployee = {
      id: newId,
      name: "New Employee",
      job: job || "Atlanta",
      hours: 0,
      rate: 0,
      totalLabor: 0,
      perDiem: 0,
      mileage: 0,
      safetyEquipment: 0,
      total: 0
    };
    
    setInvoiceData([...invoiceData, newEmployee]);
  };

  // Remove an employee
  const removeEmployee = (employeeId) => {
    const updatedData = invoiceData.filter(employee => employee.id !== employeeId);
    setInvoiceData(updatedData);
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  // No longer needed as we're using state variables

  const handleDownloadAll = () => {
    // Temporarily disable edit mode for printing
    setEditMode(false);
    
    setTimeout(() => {
      const printContent = componentRef.current;
      if (!printContent) {
        console.error('Print content not found');
        return;
      }

      const fileName = `Build.Test.Connect_Invoice_All_${new Date().toISOString().split('T')[0]}.pdf`;
      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      html2pdf().from(printContent).set(opt).save();
    }, 100);
  };

  const handleDownloadAtlanta = () => {
    // Temporarily disable edit mode for printing
    setEditMode(false);
    
    setTimeout(() => {
      const printContent = atlantaRef.current;
      if (!printContent) {
        console.error('Print content not found');
        return;
      }

      const fileName = `Build.Test.Connect_Invoice_Atlanta_${new Date().toISOString().split('T')[0]}.pdf`;
      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      html2pdf().from(printContent).set(opt).save();
    }, 100);
  };

  const handleDownloadAustin = () => {
    // Temporarily disable edit mode for printing
    setEditMode(false);
    
    setTimeout(() => {
      const printContent = austinRef.current;
      if (!printContent) {
        console.error('Print content not found');
        return;
      }

      const fileName = `Build.Test.Connect_Invoice_Austin_${new Date().toISOString().split('T')[0]}.pdf`;
      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      html2pdf().from(printContent).set(opt).save();
    }, 100);
  };

  // Invoice header component with editable fields
  const InvoiceHeader = ({ jobName = null }) => (
    <div className="mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <img src={logoUrl} alt="Company Logo" className="h-24 mb-4" />
          <h1 className="text-3xl font-bold">{businessInfo.name}</h1>
          <p>{businessInfo.address}</p>
          <p>{businessInfo.city}, {businessInfo.state} {businessInfo.zip}</p>
          <p>Phone: {businessInfo.phone}</p>
          <p>Email: {businessInfo.email}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold mb-2">Invoice</h2>
          <div className="flex items-center justify-end mb-1">
            <strong className="mr-2">Invoice #:</strong> 
            {editMode ? (
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 w-40 text-right"
              />
            ) : (
              <span>{invoiceNumber}</span>
            )}
          </div>
          <div className="flex items-center justify-end mb-1">
            <strong className="mr-2">Week Ending Date:</strong> 
            {editMode ? (
              <input
                type="text"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 w-40 text-right"
              />
            ) : (
              <span>{invoiceDate}</span>
            )}
          </div>
          <div className="flex items-center justify-end mb-1">
            <strong className="mr-2">Due Date:</strong> 
            {editMode ? (
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 w-40 text-right"
              />
            ) : (
              <span>{dueDate}</span>
            )}
          </div>
          {jobName && <p><strong>Job Location:</strong> {jobName}</p>}
        </div>
      </div>
      
      <div className="border-t border-b border-gray-200 py-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
        <p className="font-medium">{clientInfo.name}</p>
        <p>{clientInfo.address}</p>
        <p>{clientInfo.city}, {clientInfo.state} {clientInfo.zip}</p>
      </div>
    </div>
  );

  // Invoice footer component
  const InvoiceFooter = ({ totals }) => (
    <>
      <div className="mt-8 text-right">
        <p className="text-2xl font-bold">Grand Total: {formatCurrency(totals.grandTotal)}</p>
      </div>

      <div className="mt-8 text-sm">
        <p><strong>Payment Terms:</strong> {businessInfo.paymentTerms}</p>
        <p><strong>Note:</strong> Please make checks payable to {businessInfo.name}</p>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>{businessInfo.name} | {businessInfo.address}, {businessInfo.city}, {businessInfo.state} {businessInfo.zip}</p>
        {businessInfo.phone && businessInfo.email && (
          <p>Phone: {businessInfo.phone} | Email: {businessInfo.email}</p>
        )}
      </div>
    </>
  );

  // Editable invoice table component
  const EditableInvoiceTable = ({ employees, totals }) => (
    <Table className="mb-4">
      <TableHeader>
        <TableRow className="bg-muted">
          <TableHead>Name</TableHead>
          <TableHead>Job</TableHead>
          <TableHead className="text-right">Hours</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Total Labor</TableHead>
          <TableHead className="text-right">Per Diem</TableHead>
          <TableHead className="text-right">Mileage</TableHead>
          <TableHead className="text-right">Safety Equipment</TableHead>
          <TableHead className="text-right">Total</TableHead>
          {editMode && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee, index) => (
          <TableRow key={employee.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
            <TableCell>
              {editMode ? (
                <input
                  type="text"
                  value={employee.name}
                  onChange={(e) => updateEmployee(employee.id, 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                employee.name
              )}
            </TableCell>
            <TableCell>
              {editMode ? (
                <select
                  value={employee.job}
                  onChange={(e) => updateEmployee(employee.id, 'job', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                >
                  <option value="Atlanta">Atlanta</option>
                  <option value="Austin">Austin</option>
                </select>
              ) : (
                employee.job
              )}
            </TableCell>
            <TableCell className="text-right">
              {editMode ? (
                <input
                  type="number"
                  value={employee.hours || 0}
                  onChange={(e) => updateEmployee(employee.id, 'hours', parseFloat(e.target.value) || 0)}
                  className="w-full text-right border border-gray-300 rounded px-2 py-1"
                  step="0.01"
                />
              ) : (
                formatNumber(employee.hours)
              )}
            </TableCell>
            <TableCell className="text-right">
              {editMode ? (
                <input
                  type="number"
                  value={employee.rate || 0}
                  onChange={(e) => updateEmployee(employee.id, 'rate', parseFloat(e.target.value) || 0)}
                  className="w-full text-right border border-gray-300 rounded px-2 py-1"
                  step="0.01"
                />
              ) : (
                formatCurrency(employee.rate)
              )}
            </TableCell>
            <TableCell className="text-right">
              {editMode ? (
                <input
                  type="number"
                  value={employee.totalLabor || 0}
                  onChange={(e) => updateEmployee(employee.id, 'totalLabor', parseFloat(e.target.value) || 0)}
                  className="w-full text-right border border-gray-300 rounded px-2 py-1"
                  step="0.01"
                />
              ) : (
                formatCurrency(employee.totalLabor)
              )}
            </TableCell>
            <TableCell className="text-right">
              {editMode ? (
                <input
                  type="number"
                  value={employee.perDiem || 0}
                  onChange={(e) => updateEmployee(employee.id, 'perDiem', parseFloat(e.target.value) || 0)}
                  className="w-full text-right border border-gray-300 rounded px-2 py-1"
                  step="0.01"
                />
              ) : (
                formatCurrency(employee.perDiem)
              )}
            </TableCell>
            <TableCell className="text-right">
              {editMode ? (
                <input
                  type="number"
                  value={employee.mileage || 0}
                  onChange={(e) => updateEmployee(employee.id, 'mileage', parseFloat(e.target.value) || 0)}
                  className="w-full text-right border border-gray-300 rounded px-2 py-1"
                  step="0.01"
                />
              ) : (
                formatCurrency(employee.mileage)
              )}
            </TableCell>
            <TableCell className="text-right">
              {editMode ? (
                <input
                  type="number"
                  value={employee.safetyEquipment || 0}
                  onChange={(e) => updateEmployee(employee.id, 'safetyEquipment', parseFloat(e.target.value) || 0)}
                  className="w-full text-right border border-gray-300 rounded px-2 py-1"
                  step="0.01"
                />
              ) : (
                formatCurrency(employee.safetyEquipment)
              )}
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatCurrency(employee.total)}
            </TableCell>
            {editMode && (
              <TableCell className="text-right">
                <Button
                  onClick={() => removeEmployee(employee.id)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
        
        {/* Add employee button - only in edit mode */}
        {editMode && (
          <TableRow>
            <TableCell colSpan={editMode ? 11 : 10} className="text-center py-4">
              <Button
                onClick={() => addEmployee(activeJob !== 'all' ? activeJob : undefined)}
                variant="default"
              >
                Add Employee
              </Button>
            </TableCell>
          </TableRow>
        )}
        
        {/* Totals row */}
        <TableRow className="bg-muted font-bold">
          <TableCell colSpan={2}>Totals</TableCell>
          <TableCell className="text-right">{formatNumber(totals.totalHours)}</TableCell>
          <TableCell className="text-right"></TableCell>
          <TableCell className="text-right">{formatCurrency(totals.totalLabor)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.totalPerDiem)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.totalMileage)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.totalSafetyEquipment)}</TableCell>
          <TableCell className="text-right">{formatCurrency(totals.grandTotal)}</TableCell>
          {editMode && <TableCell></TableCell>}
        </TableRow>
      </TableBody>
    </Table>
  );

  return (
    <div className="invoice-container max-w-6xl mx-auto p-8 bg-background text-foreground">
      <div className="mb-8 bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
          <h1 className="text-3xl font-bold text-center mb-2">Invoice for Build.Test.Connect Solutions</h1>
          <p className="text-center text-blue-100">View and print invoices by job location</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6 justify-center">
            <Button 
              onClick={() => setActiveJob('all')} 
              variant={activeJob === 'all' ? 'default' : 'outline'}
              className="px-6"
            >
              All Jobs
            </Button>
            <Button 
              onClick={() => setActiveJob('Atlanta')} 
              variant={activeJob === 'Atlanta' ? 'default' : 'outline'}
              className="px-6"
            >
              Atlanta
            </Button>
            <Button 
              onClick={() => setActiveJob('Austin')} 
              variant={activeJob === 'Austin' ? 'default' : 'outline'}
              className="px-6"
            >
              Austin
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-6 justify-center">
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? "destructive" : "default"}
              className="px-6"
            >
              {editMode ? "Cancel Edit" : "Edit Invoice"}
            </Button>
            
            {activeJob === 'all' && (
              <Button onClick={handleDownloadAll} variant="outline" className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All Jobs Invoice
              </Button>
            )}
            {activeJob === 'Atlanta' && (
              <Button onClick={handleDownloadAtlanta} variant="outline" className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Atlanta Invoice
              </Button>
            )}
            {activeJob === 'Austin' && (
              <Button onClick={handleDownloadAustin} variant="outline" className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Austin Invoice
              </Button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center">
            <div className="flex items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="btcPrefix"
                checked={useBtcPrefix}
                onChange={(e) => {
                  setUseBtcPrefix(e.target.checked);
                  if (e.target.checked) {
                    setUseRelPrefix(false);
                    const dateStr = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;
                    setInvoiceNumber(`BTC-${dateStr}`);
                  }
                }}
                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="btcPrefix" className="ml-2 text-sm font-medium text-gray-700">
                Use BTC prefix for invoice numbers
              </label>
            </div>
            
            <div className="flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
              <input
                type="checkbox"
                id="relPrefix"
                checked={useRelPrefix}
                onChange={(e) => {
                  setUseRelPrefix(e.target.checked);
                  if (e.target.checked) {
                    setUseBtcPrefix(false);
                    const dateStr = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;
                    setInvoiceNumber(`REL-${dateStr}`);
                  }
                }}
                className="h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <label htmlFor="relPrefix" className="ml-2 text-sm font-medium text-gray-700">
                Use REL prefix for invoice numbers
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* All Jobs Invoice */}
      {activeJob === 'all' && (
        <div className="bg-white shadow-lg rounded-lg p-6 print:shadow-none mb-8">
          <div ref={componentRef} className="p-6 bg-background text-foreground">
            <InvoiceHeader />
            
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Employee Expenses - All Jobs</h3>
              <EditableInvoiceTable 
                employees={getEmployeesByJob('all')} 
                totals={calculateTotals(getEmployeesByJob('all'))} 
              />
            </div>
            
            <InvoiceFooter totals={calculateTotals(getEmployeesByJob('all'))} />
          </div>
        </div>
      )}

      {/* Atlanta Invoice */}
      {activeJob === 'Atlanta' && (
        <div className="bg-white shadow-lg rounded-lg p-6 print:shadow-none mb-8">
          <div ref={atlantaRef} className="p-6 bg-background text-foreground">
            <InvoiceHeader jobName="Atlanta" />
            
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Employee Expenses - Atlanta</h3>
              <EditableInvoiceTable 
                employees={getEmployeesByJob('Atlanta')} 
                totals={calculateTotals(getEmployeesByJob('Atlanta'))} 
              />
            </div>
            
            <InvoiceFooter totals={calculateTotals(getEmployeesByJob('Atlanta'))} />
          </div>
        </div>
      )}

      {/* Austin Invoice */}
      {activeJob === 'Austin' && (
        <div className="bg-white shadow-lg rounded-lg p-6 print:shadow-none mb-8">
          <div ref={austinRef} className="p-6 bg-background text-foreground">
            <InvoiceHeader jobName="Austin" />
            
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Employee Expenses - Austin</h3>
              <EditableInvoiceTable 
                employees={getEmployeesByJob('Austin')} 
                totals={calculateTotals(getEmployeesByJob('Austin'))} 
              />
            </div>
            
            <InvoiceFooter totals={calculateTotals(getEmployeesByJob('Austin'))} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewCompanyInvoice;
