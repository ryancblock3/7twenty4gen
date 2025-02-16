import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ExcelInvoiceGenerator from './components/ExcelInvoiceGenerator';
import Timesheet from './components/Timesheet';
import './print.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/invoice-generator" element={<ExcelInvoiceGenerator />} />
            <Route path="/timesheet" element={<Timesheet />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Simple Home component
const Home = () => (
  <div>
    <h1 className="text-3xl font-bold mb-4">Welcome to the Invoice and Timesheet System</h1>
    <p>Use the navigation bar to access different features.</p>
  </div>
);

export default App;