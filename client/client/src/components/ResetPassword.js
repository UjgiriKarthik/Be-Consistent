// File: client/src/components/ResetPassword.js
import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
const { token } = useParams();
const navigate = useNavigate();

const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [message, setMessage] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const API_URL = process.env.REACT_APP_API_URL || "[http://localhost:5000](http://localhost:5000)";

const handleReset = async (e) => {
e.preventDefault();

if (newPassword !== confirmPassword) {
  setError("⚠️ Passwords do not match.");
  setMessage("");
  return;
}

setLoading(true);
try {
  const res = await axios.post(`${API_URL}/api/users/reset-password`, {
    token,
    newPassword,
  });

  setMessage(res.data.message || "✅ Password reset successful!");
  setError("");
  setTimeout(() => navigate("/login"), 2000);
} catch (err) {
  setError(err.response?.data?.message || "❌ Invalid or expired link.");
  setMessage("");
} finally {
  setLoading(false);
}

};

return (
<div className="container mt-5" style={{ maxWidth: "400px" }}> <h2 className="mb-4 text-center">Reset Password</h2>

  {message && <div className="alert alert-success">{message}</div>}
  {error && <div className="alert alert-danger">{error}</div>}

  <form onSubmit={handleReset}>
    <div className="mb-3">
      <label className="form-label">New Password</label>
      <input
        type="password"
        className="form-control"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={6}
        placeholder="Enter new password"
      />
    </div>

    <div className="mb-3">
      <label className="form-label">Confirm Password</label>
      <input
        type="password"
        className="form-control"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={6}
        placeholder="Confirm new password"
      />
    </div>

    <button
      type="submit"
      className="btn btn-success w-100"
      disabled={loading}
    >
      {loading ? "Resetting..." : "Reset Password"}
    </button>
  </form>
</div>
);
};

export default ResetPassword;
