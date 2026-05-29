import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Hash,
  Users,
  Book,
  TrendingUp,
  LogOut,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X,
  Trash2,
} from "lucide-react";

export default function MarksDatabase() {
  const navigate = useNavigate();

  const [marksRecords, setMarksRecords] = useState([]);
  const [studentsRecords, setStudentsRecords] = useState([]); // Naya state students data ke liye

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("All");
  const [filterRound, setFilterRound] = useState("All");

  // Inline dynamic editing states
  const [editingId, setEditingId] = useState(null);
  const [editObtainedMarks, setEditObtainedMarks] = useState("");

  // Live Data Fetch from Render Backend
  useEffect(() => {
    // 1. Fetch Marks
    fetch("https://al-razi-backend-imp.onrender.com/api/marks")
      .then((res) => res.json())
      .then((data) => setMarksRecords(data))
      .catch((err) => console.error("Error fetching marks:", err));

    // 2. Fetch Students (Taake naam aur roll number marks ke sath join kiye ja sakein)
    fetch("https://al-razi-backend-imp.onrender.com/api/students")
      .then((res) => res.json())
      .then((data) => setStudentsRecords(data))
      .catch((err) => console.error("Error fetching students:", err));
  }, []);

  // Data Joining (Marks ko Student details ke sath jorna)
  const enrichedMarks = marksRecords.map((m) => {
    const studentObj = studentsRecords.find((s) => s.id === m.studentId) || {};
    return {
      ...m,
      studentName: `${studentObj.firstName || "Unknown"} ${studentObj.lastName || ""}`.trim(),
      rollNo: studentObj.rollNo || "N/A",
    };
  });

  // General Statistics Metric Calculations
  const totalRecords = enrichedMarks.length;
  const uniqueStudents = [...new Set(enrichedMarks.map((m) => m.studentId))].length;
  const uniqueSubjects = [...new Set(enrichedMarks.map((m) => m.subject))].length;

  const avgPercentage =
    totalRecords > 0
      ? (
          (enrichedMarks.reduce(
            (acc, curr) =>
              acc +
              Number(curr.obtainedMarks || 0) / Number(curr.totalMarks || 1),
            0,
          ) /
            totalRecords) *
          100
        ).toFixed(1)
      : 0;

  // =========================================================================
  // DELETE FUNCTIONS (CONNECTED TO LIVE API)
  // =========================================================================
  
  // Single Record Deletion Handler
  const handleDeleteSingle = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this marks entry record?")
    ) {
      try {
        const response = await fetch(`https://al-razi-backend-imp.onrender.com/api/marks/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          // Frontend se record hata dein agar backend se success mil jaye
          setMarksRecords(marksRecords.filter((m) => m.id !== id));
        } else {
          alert("Failed to delete marks from MongoDB.");
        }
      } catch (error) {
        console.error("Delete Error:", error);
        alert("Server connection failed during deletion.");
      }
    }
  };

  // Central Database Core Wipe Handler
  const handleDeleteAll = async () => {
    if (
      window.confirm(
        "CRITICAL: Wipe entire Marks Database history? This action cannot be undone!",
      )
    ) {
      try {
        const response = await fetch("https://al-razi-backend-imp.onrender.com/api/marks", {
          method: "DELETE",
        });
        if (response.ok) {
           // Frontend state khali kar dein
          setMarksRecords([]);
        } else {
          alert("Failed to wipe marks in MongoDB.");
        }
      } catch (error) {
        console.error("Wipe Error:", error);
        alert("Server connection failed during wipe.");
      }
    }
  };

  // Start Row Inline Score Modification mode
  const startEditing = (record) => {
    setEditingId(record.id);
    setEditObtainedMarks(String(record.obtainedMarks));
  };

  // Commit and Save modified student scores matrix row (Note: Frontend Only - Update API pending)
  const handleSaveEdit = (record) => {
    const newScore = Number(editObtainedMarks);

    // Safety verification check bounds rule
    if (isNaN(newScore) || editObtainedMarks.trim() === "") {
      alert("Please enter a valid numeric value for marks.");
      return;
    }
    if (newScore > record.totalMarks) {
      alert(
        `Validation Error: Obtained marks cannot be greater than total marks (${record.totalMarks}).`,
      );
      return;
    }
    if (newScore < 0) {
      alert("Validation Error: Obtained marks cannot be less than zero.");
      return;
    }

    setMarksRecords(
      marksRecords.map((m) => {
        if (m.id === record.id) {
          return { ...m, obtainedMarks: newScore };
        }
        return m;
      }),
    );
    setEditingId(null);
  };

  // Multi-Query Filter Pipeline Engine
  const filteredData = enrichedMarks.filter((m) => {
    const query = searchQuery.toLowerCase().trim();
    const nameStr = (m.studentName || "").toLowerCase();
    const subStr = (m.subject || "").toLowerCase();
    const rollStr = String(m.rollNo || "");

    const matchesSearch =
      !query ||
      nameStr.includes(query) ||
      rollStr.includes(query) ||
      subStr.includes(query);
    const matchesClass = filterClass === "All" || m.class === filterClass;
    const matchesRound =
      filterRound === "All" || String(m.round) === filterRound;
    return matchesSearch && matchesClass && matchesRound;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased flex flex-col h-screen overflow-hidden">
      {/* Top Banner Navigation Header bar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm shrink-0">
        <button
          onClick={() => navigate("/admin-panel")}
          className="flex items-center text-slate-500 hover:text-[#1e3a8a] font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase">
            Al Razi Academy
          </h1>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            Marks Database Workspace
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-red-500 hover:text-red-700 font-bold text-sm"
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </button>
      </header>

      {/* Main Workspace Frame panel */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Statistics Dashboards Cards Row block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Total Records
              </p>
              <h3 className="text-2xl font-black text-slate-800">
                #{totalRecords}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Hash className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Total Students
              </p>
              <h3 className="text-2xl font-black text-slate-800">
                {uniqueStudents}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Total Subjects
              </p>
              <h3 className="text-2xl font-black text-slate-800">
                {uniqueSubjects}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Book className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm border-b-4 border-b-emerald-500">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Avg Score
              </p>
              <h3 className="text-2xl font-black text-slate-800">
                {avgPercentage}%
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters and Utilities Control Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4 shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll no, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
            />
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold p-2 rounded-xl outline-none"
          >
            <option value="All">All Classes</option>
            {["9th", "10th", "11th", "12th"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filterRound}
            onChange={(e) => setFilterRound(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-bold p-2 rounded-xl outline-none"
          >
            <option value="All">All Rounds</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((r) => (
              <option key={r} value={r}>
                Round {r}
              </option>
            ))}
          </select>
          <button
            onClick={handleDeleteAll}
            className="ml-auto text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center"
          >
            Delete All
          </button>
        </div>

        {/* Centralized Records Grid Matrix sheet structure */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-4">Roll No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4 text-center">Round</th>
                  <th className="p-4 text-center">Total</th>
                  <th className="p-4 text-center">Obtained</th>
                  <th className="p-4 text-center">%</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="p-20 text-center text-slate-400 italic font-medium"
                    >
                      No records found. Enter marks from Dashboard first.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((m) => {
                    const perc =
                      m.totalMarks > 0
                        ? ((m.obtainedMarks / m.totalMarks) * 100).toFixed(1)
                        : 0;
                    const isPass = perc >= 40;
                    const isEditing = editingId === m.id;

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="p-4">
                          <span className="bg-[#1e3a8a] text-white px-2 py-1 rounded font-mono font-bold">
                            {m.rollNo}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {m.studentName}
                        </td>
                        <td className="p-4 font-bold text-slate-400 uppercase">
                          {m.class}
                        </td>
                        <td className="p-4 font-black text-blue-600 tracking-tighter">
                          {m.subject}
                        </td>
                        <td className="p-4 text-center">
                          <span className="w-6 h-6 inline-flex items-center justify-center bg-slate-800 text-white rounded-full text-[10px] font-bold">
                            R{m.round}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-400">
                          {m.totalMarks}
                        </td>

                        {/* Dynamic Score cell with inline input mode */}
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max={m.totalMarks}
                              value={editObtainedMarks}
                              onChange={(e) =>
                                setEditObtainedMarks(e.target.value)
                              }
                              className="w-16 text-center py-1 bg-slate-100 border border-slate-300 rounded-lg outline-none font-bold text-sm focus:bg-white focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="font-black text-slate-800 text-lg">
                              {m.obtainedMarks}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-center font-bold text-blue-600">
                          {perc}%
                        </td>
                        <td className="p-4 text-center">
                          {isPass ? (
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black text-[9px] uppercase inline-flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" /> Pass
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full font-black text-[9px] uppercase inline-flex items-center">
                              <XCircle className="w-3 h-3 mr-1" /> Fail
                            </span>
                          )}
                        </td>

                        {/* Actions Control Cell */}
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleSaveEdit(m)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Save changes"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-1 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <button
                                onClick={() => startEditing(m)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                                title="Edit marks"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSingle(m.id)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
