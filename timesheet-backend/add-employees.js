const axios = require('axios');

// API base URL - adjust if needed
const API_BASE_URL = 'http://localhost:3000/api';

// Employee data from the table
const employees = [
  { lastName: 'AGUILAR', firstName: 'PABLO', payType: 'Regular', rate: 40.02 },
  { lastName: 'ALVAREZ', firstName: 'ALBERTO', payType: 'Regular', rate: 40.51 },
  { lastName: 'ASCENSIO', firstName: 'FABIAN', payType: 'Regular', rate: 25.98 },
  { lastName: 'BAEZ', firstName: 'MANUEL', payType: 'Regular', rate: 30.30 },
  { lastName: 'CERVANTES', firstName: 'ULISES', payType: 'Regular', rate: 27.06 },
  { lastName: 'CHAPARRO', firstName: 'JAIME', payType: 'Regular', rate: 34.62 },
  { lastName: 'ESQUIVEL GONZALEZ', firstName: 'NOEL', payType: 'Regular', rate: 36.19 },
  { lastName: 'GOMEZ', firstName: 'ISRAEL', payType: 'Regular', rate: 28.14 },
  { lastName: 'GONZALEZ', firstName: 'DANIEL', payType: 'Regular', rate: 35.70 },
  { lastName: 'HERNANDEZ', firstName: 'FRANCISCO', payType: 'Regular', rate: 24.90 },
  { lastName: 'HUERTA', firstName: 'JOSE', payType: 'Regular', rate: 42.18 },
  { lastName: 'HUERTA', firstName: 'MARCOS', payType: 'Regular', rate: 39.43 },
  { lastName: 'MARTINEZ', firstName: 'JESUS', payType: 'Regular', rate: 28.14 },
  { lastName: 'MELCHOR', firstName: 'CRISTIAN', payType: 'Regular', rate: 29.22 },
  { lastName: 'MELCHOR', firstName: 'FELIX', payType: 'Regular', rate: 36.78 },
  { lastName: 'MELCHOR', firstName: 'JAVIER', payType: 'Regular', rate: 29.22 },
  { lastName: 'MENDOZA', firstName: 'RENE', payType: 'Regular', rate: 49.21 },
  { lastName: 'MURILLO', firstName: 'FERNANDO', payType: 'Regular', rate: 32.46 },
  { lastName: 'NAJERA', firstName: 'ANTONIO', payType: 'Regular', rate: 24.90 },
  { lastName: 'OLVERA', firstName: 'SALVADOR', payType: 'Regular', rate: 30.30 },
  { lastName: 'ORTIZ', firstName: 'CHRISTIAN', payType: 'Regular', rate: 36.78 },
  { lastName: 'ORTIZ', firstName: 'HECTOR', payType: 'Regular', rate: 30.30 },
  { lastName: 'PACHECO', firstName: 'JOSUE', payType: 'Regular', rate: 28.14 },
  { lastName: 'PERIEDE', firstName: 'JORGE', payType: 'Regular', rate: 25.98 },
  { lastName: 'QUINTERO', firstName: 'LUIS', payType: 'Regular', rate: 41.59 },
  { lastName: 'RAMIREZ', firstName: 'JUAN', payType: 'Regular', rate: 42.18 },
  { lastName: 'RODRIGUEZ', firstName: 'MARIO', payType: 'Regular', rate: 40.00 },
  { lastName: 'ROSAS', firstName: 'ISAI', payType: 'Regular', rate: 33.54 },
  { lastName: 'SANDOVAL', firstName: 'JOSE', payType: 'Regular', rate: 37.86 },
  { lastName: 'SEGOVIANO', firstName: 'SERGIO', payType: 'Regular', rate: 25.98 },
  { lastName: 'TAPIA', firstName: 'FERNANDO', payType: 'Regular', rate: 29.22 },
  { lastName: 'TUDON', firstName: 'JUAN', payType: 'Regular', rate: 43.26 },
  { lastName: 'VALDEZ', firstName: 'HECTOR', payType: 'Regular', rate: 34.62 }
];

// Function to generate employee code
function generateEmployeeCode(firstName, lastName) {
  // Use first letter of first name and first 3 letters of last name (or all if shorter)
  // Then add a number to make it unique
  const firstInitial = firstName.charAt(0);
  const lastPart = lastName.substring(0, 3);
  
  // For employees with compound last names, use first part
  const lastNamePart = lastPart.split(' ')[0];
  
  return `${firstInitial}${lastNamePart}`.toUpperCase();
}

// Function to add an employee
async function addEmployee(employee) {
  try {
    // Generate employee code
    const baseCode = generateEmployeeCode(employee.firstName, employee.lastName);
    
    // Calculate overtime rate (1.5x regular rate)
    const regularRate = parseFloat(employee.rate);
    const overtimeRate = regularRate * 1.5;
    
    // Create employee data object
    const employeeData = {
      ee_code: baseCode,
      first_name: employee.firstName,
      last_name: employee.lastName,
      regular_rate: regularRate,
      overtime_rate: overtimeRate
    };
    
    console.log(`Adding employee: ${employee.firstName} ${employee.lastName} (${baseCode})`);
    
    // Send POST request to API
    const response = await axios.post(`${API_BASE_URL}/employees`, employeeData);
    
    console.log(`Successfully added employee with ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`Error adding employee ${employee.firstName} ${employee.lastName}:`, error.message);
    
    // If error is due to duplicate ee_code, try with a number suffix
    if (error.message.includes('UNIQUE constraint failed') && error.message.includes('ee_code')) {
      // Extract the base code and try with a number suffix
      const baseCode = generateEmployeeCode(employee.firstName, employee.lastName);
      let suffix = 1;
      let success = false;
      
      // Try up to 10 different suffixes
      while (!success && suffix <= 10) {
        try {
          const newCode = `${baseCode}${suffix}`;
          
          // Update employee data with new code
          const regularRate = parseFloat(employee.rate);
          const overtimeRate = regularRate * 1.5;
          
          const employeeData = {
            ee_code: newCode,
            first_name: employee.firstName,
            last_name: employee.lastName,
            regular_rate: regularRate,
            overtime_rate: overtimeRate
          };
          
          console.log(`Retrying with code: ${newCode}`);
          
          const response = await axios.post(`${API_BASE_URL}/employees`, employeeData);
          
          console.log(`Successfully added employee with ID: ${response.data.id} and code: ${newCode}`);
          success = true;
          return response.data;
        } catch (retryError) {
          if (!retryError.message.includes('UNIQUE constraint failed') || !retryError.message.includes('ee_code')) {
            console.error(`Error during retry:`, retryError.message);
            break;
          }
          suffix++;
        }
      }
      
      if (!success) {
        console.error(`Failed to add employee after multiple attempts`);
      }
    }
    
    return null;
  }
}

// Main function to add all employees
async function addAllEmployees() {
  console.log(`Starting to add ${employees.length} employees...`);
  
  // Process employees sequentially to avoid race conditions with employee codes
  for (const employee of employees) {
    await addEmployee(employee);
  }
  
  console.log('Finished adding employees');
}

// Run the script
addAllEmployees().catch(error => {
  console.error('Error in main process:', error);
});
