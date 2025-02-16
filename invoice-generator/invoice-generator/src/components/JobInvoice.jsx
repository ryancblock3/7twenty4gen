import React, { useRef } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';
import html2pdf from 'html2pdf.js';

const logoUrl = '/logo.png';

const JobInvoice = ({ jobData, invoiceNumber, businessInfo }) => {
  const componentRef = useRef(null);

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
        totalRegularHours += activityData.regularHours || 0;
        totalOvertimeHours += activityData.overtimeHours || 0;
        totalAmount += activityData.regularTotal + activityData.overtimeTotal;

        if (!activityTotals[activity]) {
          activityTotals[activity] = {
            regularHours: 0,
            overtimeHours: 0,
            total: 0
          };
        }
        activityTotals[activity].regularHours += activityData.regularHours || 0;
        activityTotals[activity].overtimeHours += activityData.overtimeHours || 0;
        activityTotals[activity].total += activityData.regularTotal + activityData.overtimeTotal;
      });
    });

    const sortedActivityTotals = Object.entries(activityTotals).sort((a, b) => b[1].total - a[1].total);

    return { totalRegularHours, totalOvertimeHours, totalAmount, sortedActivityTotals };
  };

  const { totalRegularHours, totalOvertimeHours, totalAmount, sortedActivityTotals } = calculateTotals();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const sortActivities = (activities) => {
    return Object.entries(activities).sort((a, b) => b[1].regularHours - a[1].regularHours);
  };

  return (
    <div className="invoice-container max-w-6xl mx-auto p-8 bg-background text-foreground shadow-lg rounded-lg print:w-full print:max-w-none">
      <div className="no-print mb-4 space-x-4">
        <Button onClick={handleDownload}>Download PDF</Button>
      </div>
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
            <p><strong>Job Name:</strong> {jobData.jobName}</p>
            <p><strong>Job Number:</strong> {jobData.jobNumber}</p>
            <p><strong>Week Ending Date:</strong> {jobData.weekEnding}</p>
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
            {Object.entries(jobData.employees).map(([employee, data], employeeIndex) => (
              <React.Fragment key={employee}>
                {sortActivities(data.activities).map(([activity, activityData], activityIndex) => (
                  <TableRow key={`${employee}-${activity}`} className={activityIndex % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                    <TableCell>{activityIndex === 0 ? employee : ''}</TableCell>
                    <TableCell>{activity === 'undefined' ? '' : activity}</TableCell>
                    <TableCell className="text-right">{formatNumber(activityData.regularHours)}</TableCell>
                    <TableCell className="text-right">{formatNumber(activityData.overtimeHours)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(activityData.regularRate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(activityData.overtimeRate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(activityData.regularTotal + activityData.overtimeTotal)}</TableCell>
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