// File: client/src/components/TodoList.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./TodoList.css";

const TodoList = ({ date, onTasksUpdated }) => {
  const userId = JSON.parse(localStorage.getItem("user"))?.email;

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [yesterdayTasks, setYesterdayTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState("");

  const isToday = new Date().toISOString().slice(0, 10) === date;

  // ✅ Stable fetch function with useCallback
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/tasks/${date}/${userId}`
      );
      setTasks(res.data);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [date, userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchYesterdayIncomplete = async () => {
    const y = new Date(date);
    y.setDate(y.getDate() - 1);
    const yDate = y.toISOString().slice(0, 10);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/tasks/incomplete/${yDate}/${userId}`
      );
      setYesterdayTasks(res.data);
      setSelectedTasks([]);
    } catch {
      setError("Failed to import tasks from yesterday.");
    }
  };

  const handleImport = async () => {
    if (!selectedTasks.length) return;
    setImportLoading(true);

    try {
      await Promise.all(
        selectedTasks.map((task) =>
          axios.post("http://localhost:5000/api/tasks", {
            userId,
            title: task.title,
            date,
            isCompleted: false,
          })
        )
      );
      await fetchTasks();
      onTasksUpdated?.(date);
      setYesterdayTasks([]);
      setSelectedTasks([]);
      alert(`${selectedTasks.length} task(s) imported successfully.`);
    } catch {
      setError("Failed to import tasks.");
    } finally {
      setImportLoading(false);
    }
  };

  const toggleTaskSelection = (task) => {
    setSelectedTasks((prev) =>
      prev.includes(task)
        ? prev.filter((t) => t !== task)
        : [...prev, task]
    );
  };

  const addTask = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/tasks", {
        userId,
        title,
        date,
        isCompleted: false,
      });
      setTitle("");
      await fetchTasks();
      onTasksUpdated?.(date);
    } catch {
      setError("Failed to add task.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id, isCompleted) => {
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/tasks/${id}`, {
        isCompleted: !isCompleted,
      });
      await fetchTasks();
      onTasksUpdated?.(date);
    } catch {
      setError("Failed to update task.");
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`);
      await fetchTasks();
      onTasksUpdated?.(date);
    } catch {
      setError("Failed to delete task.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.isCompleted;
    if (filter === "pending") return !task.isCompleted;
    return true;
  });

  return (
    <div className="todo-container">
      <h2 className="todo-heading">Tasks for {date}</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="todo-input-container">
        <input
          type="text"
          className="todo-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task"
        />
        <button className="add-btn" onClick={addTask} disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      <div className="filter-container">
        <label htmlFor="filter">
          <strong>Filter:</strong>
        </label>
        <select
          id="filter"
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <div className="loader">Loading tasks...</div>
      ) : (
        <>
          {isToday && (
            <div className="text-center mb-3">
              <button
                className="btn btn-warning btn-sm"
                onClick={fetchYesterdayIncomplete}
              >
                📂 Import from Yesterday
              </button>
            </div>
          )}

          {yesterdayTasks.length > 0 && (
            <div className="import-dropdown mb-3">
              <h6>Select Tasks to Import:</h6>
              <ul className="list-group">
                {yesterdayTasks.map((task) => (
                  <li
                    key={task._id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task)}
                        onChange={() => toggleTaskSelection(task)}
                        className="form-check-input me-2"
                      />
                      {task.title}
                    </label>
                  </li>
                ))}
              </ul>
              <button
                className="btn btn-success btn-sm mt-2"
                disabled={!selectedTasks.length || importLoading}
                onClick={handleImport}
              >
                {importLoading ? "Importing..." : "✅ Import Selected"}
              </button>
            </div>
          )}

          <ul className="task-list">
            {filteredTasks.length === 0 ? (
              <li className="empty">No tasks found</li>
            ) : (
              filteredTasks.map((task) => (
                <li key={task._id} className="task-item">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => toggleTask(task._id, task.isCompleted)}
                  />
                  <span className={task.isCompleted ? "task-completed" : ""}>
                    {task.title}
                  </span>
                  <button
                    className="delete-btn"
                    onClick={() => deleteTask(task._id)}
                  >
                    🗑️
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
};

export default TodoList;
