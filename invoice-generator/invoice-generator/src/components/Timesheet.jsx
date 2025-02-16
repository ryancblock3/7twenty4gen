import React, { useState, useEffect } from "react";
import {
  fetchEmployees,
  fetchJobs,
  fetchActivities,
  createTimesheetEntry,
  createActivity,
  fetchAllTimesheets,
} from "../api";

const AddActivityModal = ({ isOpen, onClose, onAdd }) => {
  const [activityCode, setActivityCode] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(activityCode, activityDescription);
    setActivityCode("");
    setActivityDescription("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-5 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">Add New Activity</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="activityCode" className="block mb-2">
              Activity Code:
            </label>
            <input
              type="text"
              id="activityCode"
              value={activityCode}
              onChange={(e) => setActivityCode(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="activityDescription" className="block mb-2">
              Activity Description:
            </label>
            <input
              type="text"
              id="activityDescription"
              value={activityDescription}
              onChange={(e) => setActivityDescription(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Add Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Timesheet = () => {
  const [activeView, setActiveView] = useState("entry");
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [weekStartDate, setWeekStartDate] = useState("");
  const [timesheetData, setTimesheetData] = useState([]);
  const [viewTimesheets, setViewTimesheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [employeesData, jobsData, activitiesData] = await Promise.all([
          fetchEmployees(),
          fetchJobs(),
          fetchActivities(),
        ]);
        setEmployees(employeesData);
        setJobs(jobsData);
        setActivities(activitiesData);
        setError(null);
      } catch (error) {
        setError("Failed to fetch data. Please try again later.");
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set default week to previous week
    const today = new Date();
    const lastWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 7
    );
    const dayOfWeek = lastWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(
      lastWeek.getFullYear(),
      lastWeek.getMonth(),
      lastWeek.getDate() + diffToMonday
    );
    setWeekStartDate(monday.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (activeView === "entry" && selectedJob && weekStartDate) {
      setTimesheetData([createEmptyRow()]);
    } else if (activeView === "view" && weekStartDate) {
      fetchTimesheetsData();
    }
  }, [selectedJob, weekStartDate, activeView]);

  const createEmptyRow = () => ({
    employee_id: null,
    employee_name: "",
    searchTerm: "",
    matchingEmployees: [],
    job_id: selectedJob,
    activity_id: "",
    hours: Array(7).fill(""),
  });

  const handleJobChange = (e) => {
    setSelectedJob(e.target.value);
  };

  const handleWeekStartDateChange = (e) => {
    const date = new Date(e.target.value);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    setWeekStartDate(date.toISOString().split("T")[0]);
  };

  const handleHoursChange = (rowIndex, dayIndex, value) => {
    const newData = [...timesheetData];
    newData[rowIndex].hours[dayIndex] = value;
    setTimesheetData(newData);
  };

  const handleEmployeeSearch = (searchTerm, rowIndex) => {
    const matchingEmployees = employees.filter((emp) =>
      `${emp.first_name} ${emp.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    const newData = [...timesheetData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      searchTerm,
      matchingEmployees,
      employee_id: null,
      employee_name: "",
    };
    setTimesheetData(newData);
  };

  const handleEmployeeSelect = (employee, rowIndex) => {
    const newData = [...timesheetData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      searchTerm: "",
      matchingEmployees: [],
    };

    if (rowIndex === timesheetData.length - 1) {
      newData.push(createEmptyRow());
    }

    setTimesheetData(newData);
  };

  const handleActivityChange = (rowIndex, activityId) => {
    if (activityId === "new") {
      setCurrentRowIndex(rowIndex);
      setIsModalOpen(true);
    } else {
      const newData = [...timesheetData];
      newData[rowIndex].activity_id = activityId;
      setTimesheetData(newData);
    }
  };

  const handleAddActivity = async (code, description) => {
    try {
      const newActivity = await createActivity({
        activity_code: code,
        activity_description: description,
      });
      setActivities([...activities, newActivity]);
      const newData = [...timesheetData];
      newData[currentRowIndex].activity_id = newActivity.id;
      setTimesheetData(newData);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating new activity:", error);
      setError("Failed to create new activity. Please try again.");
    }
  };

  const fetchTimesheetsData = async () => {
    if (!weekStartDate) return;
  
    setIsLoading(true);
    setError(null);
  
    try {
      const timesheetsData = await fetchAllTimesheets(weekStartDate);
      
      // Log the raw data to help debug
      console.log('Raw timesheet data:', timesheetsData);
      
      const processedData = processTimesheetData(timesheetsData);
      
      // Log the processed data to help debug
      console.log('Processed timesheet data:', processedData);
      
      setViewTimesheets(processedData);
    } catch (error) {
      console.error("Error fetching timesheets:", error);
      setError("Failed to fetch timesheets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const processTimesheetData = (data) => {
    const processedData = {};
    data.forEach((entry) => {
      // Modified key to handle null activity_id
      const key = `${entry.employee_id}-${entry.job_id}-${entry.activity_id || 'none'}`;
      
      if (!processedData[key]) {
        const employeeName = `${entry.employee_first_name || ''} ${entry.employee_last_name || ''}`.trim() || 'Unknown Employee';
        
        processedData[key] = {
          employee_id: entry.employee_id,
          employee_name: employeeName,
          job_id: entry.job_id,
          job_name: entry.job_name || 'Unknown Job',
          activity_id: entry.activity_id || null,
          // Handle null activity description
          activity_description: entry.activity_id ? (entry.activity_description || 'N/A') : 'No Activity',
          hours: Array(7).fill(0),
        };
      }
      
      const dayIndex = new Date(entry.date).getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      processedData[key].hours[adjustedIndex] = parseFloat(entry.hours) || 0;
    });
    
    // Sort the processed data by employee name, then job name, then activity
    return Object.values(processedData).sort((a, b) => {
      // First sort by employee name
      if (a.employee_name < b.employee_name) return -1;
      if (a.employee_name > b.employee_name) return 1;
      
      // Then by job name
      if (a.job_name < b.job_name) return -1;
      if (a.job_name > b.job_name) return 1;
      
      // Finally by activity description
      if (a.activity_description < b.activity_description) return -1;
      if (a.activity_description > b.activity_description) return 1;
      
      return 0;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      for (const row of timesheetData) {
        if (row.employee_id) {
          for (let i = 0; i < 7; i++) {
            if (row.hours[i]) {
              const date = new Date(weekStartDate);
              date.setDate(date.getDate() + i);
              await createTimesheetEntry({
                employee_id: row.employee_id,
                job_id: selectedJob,
                activity_id: row.activity_id || null,
                date: date.toISOString().split("T")[0],
                hours: parseFloat(row.hours[i]),
                pay_type: "Regular", // You might want to add logic to determine overtime
              });
            }
          }
        }
      }
      alert("Timesheet data submitted successfully!");
      setTimesheetData([createEmptyRow()]);
      fetchTimesheetsData(); // Refresh the view data after submission
    } catch (error) {
      setError("Failed to submit timesheet data. Please try again.");
      console.error("Error submitting timesheet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="timesheet-container max-w-full mx-auto p-8 bg-white shadow-lg rounded-lg overflow-x-auto">
      <h1 className="text-3xl font-bold mb-6">Timesheet Management</h1>

      <div className="mb-4">
        <button
          onClick={() => setActiveView("entry")}
          className={`mr-2 px-4 py-2 rounded ${
            activeView === "entry" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Enter Timesheets
        </button>
        <button
          onClick={() => setActiveView("view")}
          className={`px-4 py-2 rounded ${
            activeView === "view" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          View Timesheets
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {activeView === "entry" && (
          <div>
            <label htmlFor="job" className="block mb-2">
              Select Job:
            </label>
            <select
              id="job"
              value={selectedJob}
              onChange={handleJobChange}
              required
              className="w-full border p-2 rounded"
            >
              <option value="">Select a Job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.job_name} - {job.job_number}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={activeView === "entry" ? "" : "col-span-2"}>
          <label htmlFor="weekStart" className="block mb-2">
            Week Start Date (Monday):
          </label>
          <input
            id="weekStart"
            type="date"
            value={weekStartDate}
            onChange={handleWeekStartDateChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      {activeView === "entry" && selectedJob && weekStartDate && (
        <form onSubmit={handleSubmit} className="mb-8">
          <table className="w-full border-collapse mt-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Employee</th>
                <th className="border p-2">Activity</th>
                {weekDays.map((day, index) => {
                  const date = new Date(weekStartDate);
                  date.setDate(date.getDate() + index);
                  return (
                    <th key={index} className="border p-2">
                      {day} ({date.getMonth() + 1}/{date.getDate()})
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timesheetData.map((row, rowIndex) => (
                <tr key={rowIndex} className="odd:bg-gray-100">
                  <td className="border p-2">
                    {row.employee_name ? (
                      row.employee_name
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={row.searchTerm}
                          onChange={(e) =>
                            handleEmployeeSearch(e.target.value, rowIndex)
                          }
                          placeholder="Search employee"
                          className="w-full p-1"
                        />
                        {row.matchingEmployees.length > 0 && (
                          <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1">
                            {row.matchingEmployees.map((emp) => (
                              <li
                                key={emp.id}
                                onClick={() =>
                                  handleEmployeeSelect(emp, rowIndex)
                                }
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                              >
                                {emp.first_name} {emp.last_name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="border p-2">
                    <select
                      value={row.activity_id || ""}
                      onChange={(e) =>
                        handleActivityChange(rowIndex, e.target.value)
                      }
                      className="w-full p-1"
                    >
                      <option value="">Select Activity (Optional)</option>
                      {activities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.activity_code} -{" "}
                          {activity.activity_description}
                        </option>
                      ))}
                      <option value="new">+ Add New Activity</option>
                    </select>
                  </td>
                  {row.hours.map((hours, dayIndex) => (
                    <td key={dayIndex} className="border p-2">
                      <input
                        type="number"
                        value={hours}
                        onChange={(e) =>
                          handleHoursChange(rowIndex, dayIndex, e.target.value)
                        }
                        className="w-full p-1"
                        step="0.25"
                        min="0"
                        max="24"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="submit"
            className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Timesheet"}
          </button>
        </form>
      )}

      {activeView === "view" && weekStartDate && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-4">
            Timesheet Entries for All Jobs
          </h2>
          {viewTimesheets.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Employee</th>
                  <th className="border p-2">Job</th>
                  <th className="border p-2">Activity</th>
                  {weekDays.map((day, index) => {
                    const date = new Date(weekStartDate);
                    date.setDate(date.getDate() + index);
                    return (
                      <th key={index} className="border p-2">
                        {day} ({date.getMonth() + 1}/{date.getDate()})
                      </th>
                    );
                  })}
                  <th className="border p-2">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {viewTimesheets.map((entry, index) => {
                  const totalHours = entry.hours.reduce(
                    (sum, hours) => sum + hours,
                    0
                  );
                  return (
                    <tr key={index} className="odd:bg-gray-100">
                      <td className="border p-2">{entry.employee_name}</td>
                      <td className="border p-2">{entry.job_name}</td>
                      <td className="border p-2">
                        {entry.activity_description || "N/A"}
                      </td>
                      {entry.hours.map((hours, dayIndex) => (
                        <td key={dayIndex} className="border p-2 text-center">
                          {hours || ""}
                        </td>
                      ))}
                      <td className="border p-2 text-center font-bold">
                        {totalHours.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center mt-4">
              No timesheet entries found for this week.
            </p>
          )}
        </div>
      )}

      <AddActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddActivity}
      />
    </div>
  );
};

export default Timesheet;
