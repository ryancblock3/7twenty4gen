import React, { useRef } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';

const CombinedInvoice = ({ invoices }) => {
  const componentRef = useRef(null);
  // Calculate the total using a precise approach
  const totalAmount = parseFloat(invoices.reduce((sum, invoice) => {
    // Add each invoice total with rounding to 2 decimal places
    return parseFloat((sum + invoice.total).toFixed(2));
  }, 0).toFixed(2));
  // Use the same precise approach for hours
  const totalRegularHours = parseFloat(invoices.reduce((sum, invoice) => {
    return parseFloat((sum + invoice.regularHours).toFixed(2));
  }, 0).toFixed(2));
  
  const totalOvertimeHours = parseFloat(invoices.reduce((sum, invoice) => {
    return parseFloat((sum + invoice.overtimeHours).toFixed(2));
  }, 0).toFixed(2));

  const handlePrint = () => {
    const printContent = componentRef.current;
    if (!printContent) {
      console.error('Print content not found');
      return;
    }

    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;

    window.print();

    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return the original string if parsing fails
    }
  };

  return (
    <div className="combined-invoice-container max-w-4xl mx-auto p-8 bg-background text-foreground shadow-lg rounded-lg print:w-full print:max-w-none">
      <div className="no-print mb-4">
        <Button onClick={handlePrint}>Print Combined Invoice</Button>
      </div>
      <div ref={componentRef} className="p-8 bg-background text-foreground">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Twenty4 Services LLC</h1>
          <p className="text-xl">Combined Invoice</p>
          <p>Week Ending: {invoices[0]?.weekEnding ? formatDate(invoices[0].weekEnding) : 'N/A'}</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Invoice #</TableHead>
              <TableHead>Job Name</TableHead>
              <TableHead>Job Number</TableHead>
              <TableHead className="text-right">Regular Hours</TableHead>
              <TableHead className="text-right">Overtime Hours</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice, index) => (
              <TableRow key={invoice.invNumber} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                <TableCell>{invoice.invNumber}</TableCell>
                <TableCell>{invoice.jobName}</TableCell>
                <TableCell>{invoice.jobNumber}</TableCell>
                <TableCell className="text-right">{formatNumber(invoice.regularHours)}</TableCell>
                <TableCell className="text-right">{formatNumber(invoice.overtimeHours)}</TableCell>
                <TableCell className="text-right">${formatNumber(invoice.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-8 text-right">
          <p className="text-lg font-semibold">Total Regular Hours: {formatNumber(totalRegularHours)}</p>
          <p className="text-lg font-semibold">Total Overtime Hours: {formatNumber(totalOvertimeHours)}</p>
          <p className="text-2xl font-bold mt-2">Grand Total: ${formatNumber(totalAmount)}</p>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>Note: The pay shown is based on a burdened rate.</p>
        </div>
      </div>
    </div>
  );
};

export default CombinedInvoice;
