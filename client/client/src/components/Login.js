// File: client/src/components/Login.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const navigate = useNavigate();

const API_URL = process.env.REACT_APP_API_URL || "[http://localhost:5000](http://localhost:5000)";

const handleLogin = async (e) => {
e.preventDefault();
setLoading(true);
setError("");


if (!email.trim() || !password.trim()) {
  setError("Email and password are required.");
  setLoading(false);
  return;
}

try {
  const { data } = await axios.post(`${API_URL}/api/users/login`, {
    email: email.toLowerCase(),
    password,
  });

  localStorage.setItem("user", JSON.stringify(data));
  navigate("/calendar");
} catch (err) {
  setError(err.response?.data?.message || "Login failed. Check credentials.");
} finally {
  setLoading(false);
}


};

return (
<div className="container mt-5" style={{ maxWidth: "400px" }}> <h2 className="mb-4 text-center">Login</h2>

  {error && <div className="alert alert-danger">{error}</div>}

  <form onSubmit={handleLogin}>
    <div className="mb-3">
      <label className="form-label">Email</label>
      <input
        type="email"
        className="form-control"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
    </div>

    <div className="mb-3">
      <label className="form-label">Password</label>
      <input
        type="password"
        className="form-control"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
      />
    </div>

    <button
      type="submit"
      className="btn btn-primary w-100"
      disabled={loading}
    >
      {loading ? "Logging in..." : "Login"}
    </button>

    <p className="mt-2 text-center">
      <Link to="/forgot-password">Forgot Password?</Link>
    </p>
  </form>

  <div className="mt-3 text-center">
    Don’t have an account? <Link to="/signup">Signup</Link>
  </div>
</div>

);
};

export default Login;
