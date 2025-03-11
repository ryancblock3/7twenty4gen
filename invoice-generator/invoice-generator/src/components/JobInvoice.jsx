import React, { useRef, useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';
import html2pdf from 'html2pdf.js';
import { createInvoice, fetchJobs, createJob, addInvoiceDetails } from '../api';

const logoUrl = '/logo.png';

const JobInvoice = ({ jobData, invoiceNumber, businessInfo, onSaveSuccess }) => {
  const componentRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [jobs, setJobs] = useState([]);

  // Initialize editedData with the original jobData
  useEffect(() => {
    setEditedData(JSON.parse(JSON.stringify(jobData)));
    
    // Fetch jobs for job_id lookup
    const getJobs = async () => {
      try {
        const jobsData = await fetchJobs();
        setJobs(jobsData);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };
    
    getJobs();
  }, [jobData]);

  const handleDownload = () => {
    const printContent = componentRef.current;
    if (!printContent) {
      console.error('Print content not found');
      return;
    }

    const fileName = `INV#${invoiceNumber} ${jobData.jobNumber} ${jobData.jobName}.pdf`;
    const opt = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(printContent).set(opt).save();
  };

  const calculateTotals = () => {
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalAmount = 0;
    let activityTotals = {};

    Object.values(jobData.employees).forEach(employee => {
      Object.entries(employee.activities).forEach(([activity, activityData]) => {
        // Round hours to 2 decimal places for consistency
        totalRegularHours = parseFloat((totalRegularHours + (activityData.regularHours || 0)).toFixed(2));
        totalOvertimeHours = parseFloat((totalOvertimeHours + (activityData.overtimeHours || 0)).toFixed(2));
        // Round to 2 decimal places to match Excel precision
        totalAmount = parseFloat((totalAmount + (activityData.regularTotal + activityData.overtimeTotal)).toFixed(2));

        if (!activityTotals[activity]) {
          activityTotals[activity] = {
            regularHours: 0,
            overtimeHours: 0,
            total: 0
          };
        }
        // Round activity hours to 2 decimal places for consistency
        activityTotals[activity].regularHours = parseFloat((activityTotals[activity].regularHours + (activityData.regularHours || 0)).toFixed(2));
        activityTotals[activity].overtimeHours = parseFloat((activityTotals[activity].overtimeHours + (activityData.overtimeHours || 0)).toFixed(2));
        // Round to 2 decimal places to match Excel precision
        activityTotals[activity].total = parseFloat((activityTotals[activity].total + (activityData.regularTotal + activityData.overtimeTotal)).toFixed(2));
      });
    });

    const sortedActivityTotals = Object.entries(activityTotals).sort((a, b) => b[1].total - a[1].total);

    return { totalRegularHours, totalOvertimeHours, totalAmount, sortedActivityTotals };
  };

  const { totalRegularHours, totalOvertimeHours, totalAmount, sortedActivityTotals } = calculateTotals();

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // Calculate total amount
      let totalAmount = 0;
      Object.values(editedData.employees).forEach(employee => {
        Object.values(employee.activities).forEach(activity => {
          totalAmount += (activity.regularTotal + activity.overtimeTotal);
        });
      });
      
      // Format dates
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Net 30
      const dueDateFormatted = dueDate.toISOString().split('T')[0];
      
      // Format week ending date to ensure it's in YYYY-MM-DD format
      let formattedWeekEnding = editedData.weekEnding;
      try {
        // Try to parse the date - if it's already a valid date string, this will work
        const weekEndingDate = new Date(editedData.weekEnding);
        if (!isNaN(weekEndingDate.getTime())) {
          // Valid date, format it as YYYY-MM-DD
          formattedWeekEnding = weekEndingDate.toISOString().split('T')[0];
        } else {
          // If it's not a valid date, try to parse it as MM/DD/YYYY
          const parts = editedData.weekEnding.split('/');
          if (parts.length === 3) {
            const month = parseInt(parts[0], 10);
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            const parsedDate = new Date(year, month - 1, day);
            if (!isNaN(parsedDate.getTime())) {
              formattedWeekEnding = parsedDate.toISOString().split('T')[0];
            }
          }
        }
      } catch (error) {
        console.error('Error formatting week ending date:', error);
        // Keep the original value if parsing fails
      }
      
      // Find job_id based on job_number
      let job_id;
      const matchingJob = jobs.find(job => job.job_number === editedData.jobNumber);
      
      if (matchingJob) {
        job_id = matchingJob.id;
      } else {
        // Create the job if it doesn't exist
        try {
          const newJob = await createJob({
            job_number: editedData.jobNumber,
            job_name: editedData.jobName,
            job_description: `Auto-created for invoice #${invoiceNumber}`,
            client_name: editedData.clientName || 'Unknown Client'
          });
          job_id = newJob.id;
          console.log(`Created new job with ID: ${job_id}`);
        } catch (jobError) {
          console.error('Error creating job:', jobError);
          // If job creation fails, use default job_id 1
          job_id = 1;
          console.warn(`Failed to create job, using default job_id: 1`);
        }
      }
      
      // Prepare invoice data for saving
      const invoiceData = {
        job_id,
        invoice_number: invoiceNumber,
        week_ending: formattedWeekEnding,
        total_amount: totalAmount,
        invoice_date: today,
        due_date: dueDateFormatted
      };

      // Save invoice to database
      const savedInvoice = await createInvoice(invoiceData);
      
      // Prepare invoice details for saving
      const invoiceDetails = [];
      
      // Convert the employee data to invoice details format
      Object.entries(editedData.employees).forEach(([employeeName, employeeData]) => {
        Object.entries(employeeData.activities).forEach(([activityDesc, activityData]) => {
          invoiceDetails.push({
            employee_name: employeeName,
            activity_description: activityDesc,
            regular_hours: activityData.regularHours || 0,
            overtime_hours: activityData.overtimeHours || 0,
            regular_rate: activityData.regularRate || 0,
            overtime_rate: activityData.overtimeRate || 0,
            total_amount: parseFloat((activityData.regularTotal + activityData.overtimeTotal).toFixed(2))
          });
        });
      });
      
      // Save invoice details to database
      if (invoiceDetails.length > 0) {
        await addInvoiceDetails(savedInvoice.id, invoiceDetails);
      }
      
      if (onSaveSuccess) {
        onSaveSuccess(invoiceNumber);
      }
      setEditMode(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      setSaveError(error.message || 'Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndPrint = async () => {
    await handleSave();
    handleDownload();
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleInputChange = (employee, activity, field, value) => {
    setEditedData(prevData => {
      const newData = { ...prevData };
      
      // Ensure the employee and activity exist
      if (!newData.employees[employee]) {
        newData.employees[employee] = { activities: {} };
      }
      if (!newData.employees[employee].activities[activity]) {
        newData.employees[employee].activities[activity] = {
          activityCode: '',
          activityDescription: '',
          regularHours: 0,
          overtimeHours: 0,
          regularRate: 0,
          overtimeRate: 0,
          regularTotal: 0,
          overtimeTotal: 0
        };
      }
      
      // Update the field
      newData.employees[employee].activities[activity][field] = value;
      
      // Recalculate totals if hours or rates changed
      if (['regularHours', 'regularRate', 'overtimeHours', 'overtimeRate'].includes(field)) {
        const activity = newData.employees[employee].activities[activity];
        activity.regularTotal = parseFloat((activity.regularHours * activity.regularRate).toFixed(2));
        activity.overtimeTotal = parseFloat((activity.overtimeHours * activity.overtimeRate).toFixed(2));
      }
      
      return newData;
    });
  };

  const handleJobDataChange = (field, value) => {
    setEditedData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const sortActivities = (activities) => {
    return Object.entries(activities).sort((a, b) => b[1].regularHours - a[1].regularHours);
  };

  // Use editedData for rendering if available, otherwise use jobData
  const dataToRender = editedData || jobData;

  return (
    <div className="invoice-container max-w-6xl mx-auto p-8 bg-background text-foreground shadow-lg rounded-lg print:w-full print:max-w-none">
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <Button onClick={handleDownload} variant="outline">Print</Button>
        <Button onClick={handleSave} disabled={isSaving}>Save</Button>
        <Button onClick={handleSaveAndPrint} disabled={isSaving}>Save & Print</Button>
        <Button onClick={handleEditToggle} variant={editMode ? "destructive" : "secondary"}>
          {editMode ? "Cancel Edit" : "Edit Invoice"}
        </Button>
      </div>
      
      {saveError && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          Error: {saveError}
        </div>
      )}
      
      <div ref={componentRef} className="p-8 bg-background text-foreground">
        <div className="flex justify-between items-start mb-8">
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
            <p><strong>Invoice #:</strong> {invoiceNumber}</p>
            <p>
              <strong>Job Name:</strong> 
              {editMode ? (
                <input 
                  type="text" 
                  value={dataToRender.jobName} 
                  onChange={(e) => handleJobDataChange('jobName', e.target.value)}
                  className="ml-2 border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <span> {dataToRender.jobName}</span>
              )}
            </p>
            <p>
              <strong>Job Number:</strong> 
              {editMode ? (
                <input 
                  type="text" 
                  value={dataToRender.jobNumber} 
                  onChange={(e) => handleJobDataChange('jobNumber', e.target.value)}
                  className="ml-2 border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <span> {dataToRender.jobNumber}</span>
              )}
            </p>
            <p>
              <strong>Week Ending Date:</strong> 
              {editMode ? (
                <input 
                  type="text" 
                  value={dataToRender.weekEnding} 
                  onChange={(e) => handleJobDataChange('weekEnding', e.target.value)}
                  className="ml-2 border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <span> {dataToRender.weekEnding}</span>
              )}
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="w-1/6">Employee</TableHead>
              <TableHead className="w-1/4">Activity</TableHead>
              <TableHead className="text-right w-1/12">Regular Hours</TableHead>
              <TableHead className="text-right w-1/12">OT Hours</TableHead>
              <TableHead className="text-right w-1/12">Regular Rate</TableHead>
              <TableHead className="text-right w-1/12">OT Rate</TableHead>
              <TableHead className="text-right w-1/6">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(dataToRender.employees).map(([employee, data], employeeIndex) => (
              <React.Fragment key={employee}>
                {sortActivities(data.activities).map(([activity, activityData], activityIndex) => (
                  <TableRow key={`${employee}-${activity}`} className={activityIndex % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                    <TableCell>{activityIndex === 0 ? employee : ''}</TableCell>
                    <TableCell>{activity === 'undefined' ? '' : activity}</TableCell>
                    <TableCell className="text-right">
                      {editMode ? (
                        <input 
                          type="number" 
                          value={activityData.regularHours} 
                          onChange={(e) => handleInputChange(employee, activity, 'regularHours', parseFloat(e.target.value) || 0)}
                          className="w-full text-right border border-gray-300 rounded px-2 py-1"
                          step="0.01"
                        />
                      ) : (
                        formatNumber(activityData.regularHours)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editMode ? (
                        <input 
                          type="number" 
                          value={activityData.overtimeHours} 
                          onChange={(e) => handleInputChange(employee, activity, 'overtimeHours', parseFloat(e.target.value) || 0)}
                          className="w-full text-right border border-gray-300 rounded px-2 py-1"
                          step="0.01"
                        />
                      ) : (
                        formatNumber(activityData.overtimeHours)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editMode ? (
                        <input 
                          type="number" 
                          value={activityData.regularRate} 
                          onChange={(e) => handleInputChange(employee, activity, 'regularRate', parseFloat(e.target.value) || 0)}
                          className="w-full text-right border border-gray-300 rounded px-2 py-1"
                          step="0.01"
                        />
                      ) : (
                        formatCurrency(activityData.regularRate)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editMode ? (
                        <input 
                          type="number" 
                          value={activityData.overtimeRate} 
                          onChange={(e) => handleInputChange(employee, activity, 'overtimeRate', parseFloat(e.target.value) || 0)}
                          className="w-full text-right border border-gray-300 rounded px-2 py-1"
                          step="0.01"
                        />
                      ) : (
                        formatCurrency(activityData.overtimeRate)
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(parseFloat((activityData.regularTotal + activityData.overtimeTotal).toFixed(2)))}</TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-2">Activity Totals</h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">Regular Hours</TableHead>
                <TableHead className="text-right">OT Hours</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedActivityTotals.map(([activity, totals], index) => (
                <TableRow key={activity} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                  <TableCell>{activity}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.regularHours)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.overtimeHours)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-8 text-right">
          <p className="text-lg font-semibold">Total Regular Hours: {formatNumber(totalRegularHours)}</p>
          <p className="text-lg font-semibold">Total Overtime Hours: {formatNumber(totalOvertimeHours)}</p>
          <p className="text-2xl font-bold mt-2">Total Amount: {formatCurrency(totalAmount)}</p>
        </div>

        <div className="mt-8 text-sm">
          <p><strong>Payment Terms:</strong> {businessInfo.paymentTerms}</p>
          <p><strong>Note:</strong> The pay shown is based on a burdened rate.</p>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>{businessInfo.name} | {businessInfo.address}, {businessInfo.city}, {businessInfo.state} {businessInfo.zip}</p>
          <p>Phone: {businessInfo.phone} | Email: {businessInfo.email}</p>
        </div>
      </div>
    </div>
  );
};

export default JobInvoice;
