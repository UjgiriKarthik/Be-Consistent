// File: client/src/components/Signup.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState(""); // For development only
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const sendOtp = async () => {
    if (!email || !name || !password) {
      setError("⚠️ Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/verify/send-otp`, { email });
      setDevOtp(data.otp); // Dev debug
      setStep(2);
      setError("");
      setMessage("OTP sent to your email.");
      setOtpSent(true);
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async () => {
    if (!otp.trim()) {
      setError("⚠️ Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await axios.post(`${API_BASE}/api/verify/verify-otp`, { email, otp: otp.trim() });

      if (!verifyRes.data.verified) {
        setError("❌ Invalid OTP");
        return;
      }

      await axios.post(`${API_BASE}/api/users/register`, { name, email, password });

      setMessage("✅ Registration successful! Redirecting to login...");
      setError("");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "User registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      const { data } = await axios.post(`${API_BASE}/api/verify/send-otp`, { email });
      setDevOtp(data.otp);
      setError("");
      setMessage("OTP resent successfully.");
      setOtp("");
      setResendTimer(60);
    } catch (err) {
      setError("Resend failed. Try again later.");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4 text-center">Sign Up</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {devOtp && <div className="alert alert-info">🧪 Dev OTP: {devOtp}</div>}

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp();
          }}
        >
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || (otpSent && resendTimer > 0)}
          >
            {loading ? "Sending OTP..." : otpSent ? "OTP Sent" : "Send OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyAndRegister();
          }}
        >
          <div className="mb-3">
            <label className="form-label">Enter OTP</label>
            <input
              type="text"
              className="form-control"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-success w-100 mb-2" disabled={loading}>
            {loading ? "Verifying..." : "Verify & Register"}
          </button>

          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-muted">Resend OTP in {resendTimer}s</p>
            ) : (
              <button type="button" className="btn btn-link p-0" onClick={handleResendOtp}>
                Resend OTP
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-3 text-center">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default Signup;
