import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ExcelInvoiceGenerator from './components/ExcelInvoiceGenerator';
import Timesheet from './components/Timesheet';
import TimesheetProcessor from './components/TimesheetProcessor';
import ManualTimesheetEntry from './components/ManualTimesheetEntry';
import EmployeeInformation from './components/EmployeeInformation';
import TimesheetHistory from './components/TimesheetHistory';
import InvoiceHistory from './components/InvoiceHistory';
import InvoiceEditor from './components/InvoiceEditor';
import NewCompanyInvoice from './components/NewCompanyInvoice';
import './print.css';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 relative">
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full" style={{ 
            backgroundImage: `radial-gradient(circle, #3b82f6 1px, transparent 1px)`, 
            backgroundSize: '30px 30px' 
          }}></div>
        </div>
        <Navbar />
        <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-24 md:pt-28 relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/invoice-generator" element={<ExcelInvoiceGenerator />} />
            <Route path="/timesheet" element={<Timesheet />} />
            <Route path="/timesheet-processor" element={<TimesheetProcessor />} />
            <Route path="/manual-timesheet" element={<ManualTimesheetEntry />} />
            <Route path="/employee-information" element={<EmployeeInformation />} />
            <Route path="/timesheet-history" element={<TimesheetHistory />} />
            <Route path="/invoice-history" element={<InvoiceHistory />} />
            <Route path="/invoice-editor/:id" element={<InvoiceEditor />} />
            <Route path="/new-company-invoice" element={<NewCompanyInvoice />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Enhanced Home component
const Home = () => (
  <div className="max-w-5xl mx-auto">
    <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-16 text-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute top-20 right-10 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute bottom-10 left-1/4 w-30 h-30 bg-white rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
            Welcome to the <span className="text-yellow-300">Invoice</span> and <span className="text-yellow-300">Timesheet</span> System
          </h1>
          <p className="text-blue-100 text-xl max-w-2xl">
            Streamline your invoicing and timesheet management with our powerful tools designed for efficiency and accuracy
          </p>
        </div>
      </div>
      
      <div className="p-8 md:p-10">
        <div className="grid md:grid-cols-2 gap-8">
          <FeatureCard 
            title="BTC Solutions Invoice" 
            description="Generate invoices with BTC prefix for Build.Test.Connect Solutions LLC"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            link="/new-company-invoice"
          />
          
          <FeatureCard 
            title="Invoice Generator" 
            description="Generate professional invoices from Excel timesheet data"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            link="/invoice-generator"
          />
          
          <FeatureCard 
            title="Timesheet Processor" 
            description="Process and format timesheet data for invoice generation"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            link="/timesheet-processor"
          />
          
          <FeatureCard 
            title="Timesheet Entry" 
            description="Enter and manage employee timesheet data"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            link="/timesheet"
          />
          
          <FeatureCard 
            title="Manual Timesheet" 
            description="Manually enter timesheet data for invoice generation"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
            link="/manual-timesheet"
          />
          
          <FeatureCard 
            title="Employee Information" 
            description="View employee details, pay rates, and hours worked history"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            link="/employee-information"
          />
          
          <FeatureCard 
            title="Timesheet History" 
            description="View and analyze historical timesheet data"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
            link="/timesheet-history"
          />
          
          <FeatureCard 
            title="Invoice History" 
            description="View and manage historical invoices"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            }
            link="/invoice-history"
          />
          
          <div className="group bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:bg-blue-50 transform hover:-translate-y-1">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-full text-purple-600 mb-6 shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-110 group-hover:text-purple-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-purple-700">Need Help?</h3>
            <p className="text-gray-600 group-hover:text-gray-700">
              Contact support at support@twenty4services.com for assistance with the system
            </p>
            <div className="mt-4 text-purple-600 font-medium opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
              Contact Support →
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Feature card component
const FeatureCard = ({ title, description, icon, link }) => (
  <a 
    href={link} 
    className="group bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:bg-blue-50 transform hover:-translate-y-1"
  >
    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-full text-blue-600 mb-6 shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-110 group-hover:text-indigo-700">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-blue-700">{title}</h3>
    <p className="text-gray-600 group-hover:text-gray-700">
      {description}
    </p>
    <div className="mt-4 text-blue-600 font-medium opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
      Get Started →
    </div>
  </a>
);

export default App;
