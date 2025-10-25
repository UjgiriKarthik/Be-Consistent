
// client/src/components/Calendar.js
import AssistantChat from './AssistantChat';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import React, { useState, useEffect, useCallback } from 'react';
import './Calendar.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const Calendar = () => {
  const navigate = useNavigate();
  const today = new Date();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [taskMap, setTaskMap] = useState({});
  const [summary, setSummary] = useState(null);
  const [miniMonth, setMiniMonth] = useState(today.getMonth());
  const [miniYear, setMiniYear] = useState(today.getFullYear());

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
  const encodedUser = encodeURIComponent(user?.email?.toLowerCase() || '');

  const [reminderTime, setReminderTime] = useState('');
  const [reportTime, setReportTime] = useState('');

  // redirect if not logged in
  useEffect(() => {
    if (!user?.email) navigate('/login');
  }, [user, navigate]);

  // fetch progress data
  const fetchProgressData = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/tasks/monthly/${currentYear}-${String(currentMonth + 1).padStart(2, '0')}/${encodedUser}`
      );
      setTaskMap(res.data);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  }, [currentMonth, currentYear, encodedUser, API_URL]);

  // fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/tasks/summary/${currentYear}-${String(currentMonth + 1).padStart(2, '0')}/${encodedUser}`
      );
      const rawTaskMap = await axios.get(
        `${API_URL}/api/tasks/monthly/${currentYear}-${String(currentMonth + 1).padStart(2, '0')}/${encodedUser}`
      );
      const daysCompleted = Object.values(rawTaskMap.data).filter(val => val === 100).length;
      setSummary({ ...res.data, daysCompleted });
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, [currentMonth, currentYear, encodedUser, API_URL]);

  useEffect(() => {
    fetchProgressData();
    fetchSummary();
  }, [fetchProgressData, fetchSummary]);

  // listen for custom task update events
  useEffect(() => {
    const onUpdate = () => {
      fetchProgressData();
      fetchSummary();
    };
    window.addEventListener('tasks-updated', onUpdate);
    return () => window.removeEventListener('tasks-updated', onUpdate);
  }, [fetchProgressData, fetchSummary]);

  // task color coding
  const getColor = (percent) => {
    if (percent === 100) return '#4caf50';
    if (percent >= 75) return '#82ca9d';
    if (percent >= 50) return '#ff9800';
    if (percent > 0) return '#ffc658';
    if (percent === 0) return '#f44336';
    return '#e0e0e0';
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    navigate(`/tasks/${date}`);
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // ✅ clear user + assistant messages on logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('assistantMessages'); // 🧹 clear chat on logout
    navigate('/login');
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const chartData = summary
    ? [
        { name: 'Total Tasks', value: summary.totalTasks },
        { name: 'Completed Tasks', value: summary.completedTasks },
      ]
    : [];

  const barColors = ['#8884d8', '#82ca9d'];

  // mini calendar rendering
  const renderMiniCalendar = () => {
    const totalDays = new Date(miniYear, miniMonth + 1, 0).getDate();
    const miniFirstDay = new Date(miniYear, miniMonth, 1).getDay();
    const rows = [];
    let dayCounter = 1;

    for (let i = 0; i < 6; i++) {
      const cells = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < miniFirstDay) {
          cells.push(<td key={j}></td>);
        } else if (dayCounter > totalDays) {
          cells.push(<td key={j}></td>);
        } else {
          const dateStr = `${miniYear}-${String(miniMonth + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
          const isComplete = summary?.completedDates?.includes(dateStr);
          cells.push(
            <td
              key={j}
              style={{
                backgroundColor: isComplete ? '#add8e6' : 'transparent',
                borderRadius: '5px',
                padding: '4px',
              }}
            >
              {dayCounter++}
            </td>
          );
        }
      }
      rows.push(<tr key={i}>{cells}</tr>);
    }

    const miniMonthName = new Date(miniYear, miniMonth).toLocaleString('default', { month: 'long' });

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              if (miniMonth === 0) {
                setMiniMonth(11);
                setMiniYear(miniYear - 1);
              } else {
                setMiniMonth(miniMonth - 1);
              }
            }}
          >
            {'<'}
          </button>
          <strong>{miniMonthName} {miniYear}</strong>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              if (miniMonth === 11) {
                setMiniMonth(0);
                setMiniYear(miniYear + 1);
              } else {
                setMiniMonth(miniMonth + 1);
              }
            }}
          >
            {'>'}
          </button>
        </div>
        <table className="table table-sm w-100 text-center">
          <thead>
            <tr>
              <th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  // fetch user info + reminder/report times
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/${user.email?.toLowerCase()}`);
        setUser(res.data);
        setReminderTime(res.data.reminderTime ?? '');
        setReportTime(res.data.reportTime ?? '');
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    if (user?.email) {
      fetchUser();
    }
  }, [user.email, API_URL]);

  // update handler for reminder/report
  const handleFieldChange = async (field, value) => {
    try {
      const updatedUser = { ...user, [field]: value };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (field === "reminderTime") setReminderTime(value);
      if (field === "reportTime") setReportTime(value);

      await axios.put(`${API_URL}/api/users/${user.email}`, { [field]: value });
    } catch (err) {
      console.error("Failed to update user field:", err);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg px-3 shadow-sm">
        <span className="navbar-brand fw-bold">Be Consistent</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <h5 className='pt-3'>{user?.name}</h5>
          <div className="dropdown">
            <div
              role="button"
              id="profileDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ display: "inline-block", cursor: "pointer" }}
            >
              <img
                src={user?.avatar || "https://assets.leetcode.com/users/default_avatar.jpg"}
                alt="Profile"
                className="rounded-circle"
                style={{ width: "30px", height: "30px" }}
              />
            </div>

            <ul className="dropdown-menu dropdown-menu-end p-3" aria-labelledby="profileDropdown">
              <li className="mb-2"><strong>{user?.name}</strong></li>
              <li className="mb-2">
                <label className="form-label">Reminder Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-sm mt-2 w-100"
                  onClick={() => handleFieldChange("reminderTime", reminderTime)}
                >
                  Set
                </button>
              </li>
              <li className="mb-2">
                <label className="form-label">Report Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={reportTime}
                  onChange={(e) => setReportTime(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-sm mt-2 w-100"
                  onClick={() => handleFieldChange("reportTime", reportTime)}
                >
                  Set
                </button>
              </li>
              <li>
                <button className="btn btn-danger w-100" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container-fluid p-3">
        <div className="row g-3">
        {/* LEFT: Report + Streak + Mini Calendar */}
        {summary && (
          <div className="col-12 col-md-4 col-lg-3">
            <div className="rounded shadow p-3 bg-white text-dark">
              <h5 className="text-center">📊 Monthly Report</h5>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded shadow p-3 text-center bg-white text-dark">
              <h6>🔥 <strong>Current Streak:</strong> {summary.currentStreak} day(s)</h6>
              <h6>🏆 <strong>Best Streak:</strong> {summary.bestStreak} day(s)</h6>
              {renderMiniCalendar()}
            </div>
          </div>
        )}

        {/* CENTER: Main Calendar */}
        <div className="col-12 col-md-8 col-lg-6">
          <div className="calendar-wrapper p-3 rounded shadow bg-white text-dark">
          <div className="calendar-header d-flex justify-content-center align-items-center mb-3 gap-3">
            <button onClick={prevMonth} className="btn btn-outline-primary btn-sm">{'<'}</button>
            <h4 className="mb-0">{monthName} {currentYear}</h4>
            <button onClick={nextMonth} className="btn btn-outline-primary btn-sm">{'>'}</button>
          </div>

          <div className="calendar-grid">
            {Array.from({ length: daysInMonth }, (_, idx) => {
              const day = idx + 1;
              const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();
              const percentage = taskMap[dateKey];
              const bgColor =
                percentage === undefined || percentage === null
                  ? '#f5f5f5'
                  : getColor(percentage);

              return (
                <div
                  key={day}
                  className={`calendar-day clickable ${isToday ? 'today-highlight' : ''}`}
                  onClick={() => handleDateClick(day)}
                  style={{
                    backgroundColor: bgColor,
                    gridColumnStart: day === 1 ? firstDay + 1 : 'auto',
                  }}
                >
                  <div style={{ fontSize: '18px' }}>{day}</div>
                  {percentage !== undefined && (
                    <div style={{ fontSize: '12px', color: '#000' }}>
                      {percentage}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* RIGHT: Productivity Assistant */}
        <div className="col-12 col-lg-3">
          <div className="rounded shadow p-3 h-100 d-flex flex-column bg-white text-dark">
            <h6 className="text-center">💬 Productivity Assistant</h6>
            <AssistantChat />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Calendar;

