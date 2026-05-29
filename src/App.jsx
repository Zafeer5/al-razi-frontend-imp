import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import StudentsDatabase from "./pages/StudentsDatabase";
import MarksDatabase from "./pages/MarksDatabase";
import TeacherLogin from "./pages/TeacherLogin"; // 1. Naya Import add kiya gaya hai

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Absolute Error-Free App Routing Table Map */}
        
        {/* Teacher / Main Interface */}
        <Route path="/teacher-login" element={<TeacherLogin />} /> {/* 2. Naya Route add kiya gaya hai */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Admin Interface */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/admin-panel/students-database" element={<StudentsDatabase />} />
        <Route path="/admin-panel/marks-database" element={<MarksDatabase />} />
      </Routes>
    </Router>
  );
}
