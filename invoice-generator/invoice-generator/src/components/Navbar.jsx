import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-500 p-4">
      <ul className="flex space-x-4">
        <li>
          <Link to="/" className="text-white hover:underline">Home</Link>
        </li>
        <li>
          <Link to="/timesheet" className="text-white hover:underline">Timesheet</Link>
        </li>
        <li>
          <Link to="/invoice-generator" className="text-white hover:underline">Invoice Generator</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;