// File: src/components/ForgotPassword.js
import React, { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {
const [email, setEmail] = useState("");
const [message, setMessage] = useState("");
const [error, setError] = useState("");

const API_URL = process.env.REACT_APP_API_URL || "[http://localhost:5000](http://localhost:5000)";

const handleSubmit = async (e) => {
e.preventDefault();


if (!email.trim()) {
  setError("Email is required");
  setMessage("");
  return;
}

try {
  const res = await axios.post(`${API_URL}/api/users/forgot-password`, { email });
  setMessage(res.data.message || "Reset link sent successfully!");
  setError("");
} catch (err) {
  setError(err.response?.data?.message || "Something went wrong");
  setMessage("");
}


};

return (
<div className="container mt-5" style={{ maxWidth: "400px" }}> <h2 className="mb-4 text-center">Forgot Password</h2>

```
  {message && <div className="alert alert-success">{message}</div>}
  {error && <div className="alert alert-danger">{error}</div>}

  <form onSubmit={handleSubmit}>
    <div className="mb-3">
      <label className="form-label">Email</label>
      <input
        type="email"
        className="form-control"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="Enter your registered email"
      />
    </div>

    <button type="submit" className="btn btn-primary w-100">
      Send Reset Link
    </button>
  </form>
</div>

);
};

export default ForgotPassword;
