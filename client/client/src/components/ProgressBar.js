// File: client/src/components/ProgressBar.js
import React from "react";
import "./ProgressBar.css";

const ProgressBar = ({ percentage = 0 }) => {
  const getColor = (percent) => {
    if (percent === 100) return "#4caf50"; // green
    if (percent >= 75) return "#82ca9d";   // light green
    if (percent >= 50) return "#ff9800";   // orange
    if (percent > 0) return "#ffc658";     // yellow
    return "#f44336";                      // red
  };

  return (
    <div className="progress-container" style={{ width: "100%" }}>
      <div
        className="progress-bar"
        style={{
          width: `${percentage}%`,
          backgroundColor: getColor(percentage),
        }}
      >
        {percentage}% 
      </div>
    </div>
  );
};

export default ProgressBar;
