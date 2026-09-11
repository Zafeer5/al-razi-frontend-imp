import React, { useState, useEffect, useMemo } from "react";
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
  Filter,
  RotateCcw,
  ArrowUpDown,
  Download,
} from "lucide-react";

export default function MarksDatabase() {
  const navigate = useNavigate();

  const [marksRecords, setMarksRecords] = useState([]);
  const [studentsRecords, setStudentsRecords] = useState([]);

  // ================= GENERAL / TOOLBAR FILTERS =================
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("All");
  const [filterRound, setFilterRound] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPerformanceBand, setFilterPerformanceBand] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  // ================= PER-COLUMN (ROW HEADER) FILTERS =================
  const [showColFilters, setShowColFilters] = useState(true);
  const [colFilters, setColFilters] = useState({
    rollNo: "",
    studentName: "",
    class: "All",
    subject: "All",
    round: "All",
    minTotal: "",
    minObt: "",
    minPerc: "",
    status: "All",
  });

  // Inline dynamic editing states
  const [editingId, setEditingId] = useState(null);
  const [editObtainedMarks, setEditObtainedMarks] = useState("");

  // Live Data Fetch from Render Backend
  useEffect(() => {
    fetch("https://al-razi-backend-imp.onrender.com/api/marks")
      .then((res) => res.json())
      .then((data) => setMarksRecords(data))
      .catch((err) => console.error("Error fetching marks:", err));

    fetch("https://al-razi-backend-imp.onrender.com/api/students")
      .then((res) => res.json())
      .then((data) => setStudentsRecords(data))
      .catch((err) => console.error("Error fetching students:", err));
  }, []);

  // Data Joining (Marks ko Student details ke sath jorna)
  const enrichedMarks = useMemo(() => {
    return marksRecords.map((m) => {
      const studentObj = studentsRecords.find((s) => s.id === m.studentId) || {};
      const obt = Number(m.obtainedMarks || 0);
      const total = Number(m.totalMarks || 0);
      const perc = total > 0 ? Number(((obt / total) * 100).toFixed(1)) : 0;
      const isPass = perc >= 40;

      return {
        ...m,
        studentName: `${studentObj.firstName || "Unknown"} ${studentObj.lastName || ""}`.trim(),
        rollNo: studentObj.rollNo !== undefined ? studentObj.rollNo : "N/A",
        numericRollNo: Number(studentObj.rollNo) || 0,
        obtainedMarksNum: obt,
        totalMarksNum: total,
        perc,
        isPass,
      };
    });
  }, [marksRecords, studentsRecords]);

  // Unique lists for filter dropdowns
  const availableSubjects = useMemo(() => {
    return [...new Set(enrichedMarks.map((m) => m.subject).filter(Boolean))].sort();
  }, [enrichedMarks]);

  const availableClasses = useMemo(() => {
    const list = [...new Set(enrichedMarks.map((m) => m.class).filter(Boolean))].sort();
    return list.length > 0 ? list : ["9th", "10th", "11th", "12th"];
  }, [enrichedMarks]);

  // Handle column filter input
  const handleColFilterChange = (field, value) => {
    setColFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Reset all filters (general & column-wise)
  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterClass("All");
    setFilterRound("All");
    setFilterSubject("All");
    setFilterStatus("All");
    setFilterPerformanceBand("All");
    setSortBy("default");
    setColFilters({
      rollNo: "",
      studentName: "",
      class: "All",
      subject: "All",
      round: "All",
      minTotal: "",
      minObt: "",
      minPerc: "",
      status: "All",
    });
  };

  // ================= MULTI-TIER FILTERING & SORTING ENGINE =================
  const filteredData = useMemo(() => {
    let result = enrichedMarks.filter((m) => {
      // 1. GENERAL SEARCH
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.studentName.toLowerCase().includes(q) ||
        String(m.rollNo).toLowerCase().includes(q) ||
        (m.subject || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. GENERAL TOOLBAR FILTERS
      if (filterClass !== "All" && m.class !== filterClass) return false;
      if (filterRound !== "All" && String(m.round) !== String(filterRound)) return false;
      if (filterSubject !== "All" && m.subject !== filterSubject) return false;

      if (filterStatus === "PASS" && !m.isPass) return false;
      if (filterStatus === "FAIL" && m.isPass) return false;

      // Performance band filter (Grade Analysis)
      if (filterPerformanceBand === "TOP_80" && m.perc < 80) return false;
      if (filterPerformanceBand === "60_79" && (m.perc < 60 || m.perc >= 80)) return false;
      if (filterPerformanceBand === "40_59" && (m.perc < 40 || m.perc >= 60)) return false;
      if (filterPerformanceBand === "BELOW_40" && m.perc >= 40) return false;

      // 3. COLUMN-SPECIFIC FILTERS
      if (
        colFilters.rollNo &&
        !String(m.rollNo).toLowerCase().includes(colFilters.rollNo.toLowerCase().trim())
      ) {
        return false;
      }
      if (
        colFilters.studentName &&
        !m.studentName.toLowerCase().includes(colFilters.studentName.toLowerCase().trim())
      ) {
        return false;
      }
      if (colFilters.class !== "All" && m.class !== colFilters.class) {
        return false;
      }
      if (colFilters.subject !== "All" && m.subject !== colFilters.subject) {
        return false;
      }
      if (colFilters.round !== "All" && String(m.round) !== String(colFilters.round)) {
        return false;
      }
      if (colFilters.minTotal && m.totalMarksNum < Number(colFilters.minTotal)) {
        return false;
      }
      if (colFilters.minObt && m.obtainedMarksNum < Number(colFilters.minObt)) {
        return false;
      }
      if (colFilters.minPerc && m.perc < Number(colFilters.minPerc)) {
        return false;
      }
      if (colFilters.status === "PASS" && !m.isPass) return false;
      if (colFilters.status === "FAIL" && m.isPass) return false;

      return true;
    });

    // 4. SORTING ENGINE
    result.sort((a, b) => {
      switch (sortBy) {
        case "roll_asc":
          return a.numericRollNo - b.numericRollNo;
        case "roll_desc":
          return b.numericRollNo - a.numericRollNo;
        case "name_asc":
          return a.studentName.localeCompare(b.studentName);
        case "name_desc":
          return b.studentName.localeCompare(a.studentName);
        case "obt_desc":
          return b.obtainedMarksNum - a.obtainedMarksNum;
        case "obt_asc":
          return a.obtainedMarksNum - b.obtainedMarksNum;
        case "perc_desc":
          return b.perc - a.perc;
        case "perc_asc":
          return a.perc - b.perc;
        case "round_asc":
          return Number(a.round) - Number(b.round);
        case "round_desc":
          return Number(b.round) - Number(a.round);
        default:
          return b.id ? String(b.id).localeCompare(String(a.id)) : 0;
      }
    });

    return result;
  }, [
    enrichedMarks,
    searchQuery,
    filterClass,
    filterRound,
    filterSubject,
    filterStatus,
    filterPerformanceBand,
    colFilters,
    sortBy,
  ]);

  // Statistics calculated on active filtered data
  const totalRecords = filteredData.length;
  const uniqueStudents = [...new Set(filteredData.map((m) => m.studentId))].length;
  const uniqueSubjects = [...new Set(filteredData.map((m) => m.subject))].length;

  const avgPercentage =
    totalRecords > 0
      ? (
          (filteredData.reduce(
            (acc, curr) => acc + curr.obtainedMarksNum / (curr.totalMarksNum || 1),
            0
          ) /
            totalRecords) *
          100
        ).toFixed(1)
      : 0;

  // Single Record Deletion Handler
  const handleDeleteSingle = async (id) => {
    if (window.confirm("Are you sure you want to delete this marks entry record?")) {
      try {
        const response = await fetch(`https://al-razi-backend-imp.onrender.com/api/marks/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
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
        "CRITICAL: Wipe entire Marks Database history? This action cannot be undone!"
      )
    ) {
      try {
        const response = await fetch("https://al-razi-backend-imp.onrender.com/api/marks", {
          method: "DELETE",
        });
        if (response.ok) {
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

  // Save Edits Handler
  const handleSaveEdit = async (record) => {
    const newScore = Number(editObtainedMarks);

    if (isNaN(newScore) || editObtainedMarks.trim() === "") {
      alert("Please enter a valid numeric value for marks.");
      return;
    }
    if (newScore > record.totalMarks) {
      alert(`Validation Error: Obtained marks cannot be greater than total marks (${record.totalMarks}).`);
      return;
    }
    if (newScore < 0) {
      alert("Validation Error: Obtained marks cannot be less than zero.");
      return;
    }

    try {
      const response = await fetch(`https://al-razi-backend-imp.onrender.com/api/marks/${record.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ obtainedMarks: newScore }),
      });

      if (response.ok) {
        setMarksRecords(
          marksRecords.map((m) => {
            if (m.id === record.id) {
              return { ...m, obtainedMarks: newScore };
            }
            return m;
          })
        );
        setEditingId(null);
      } else {
        alert("Failed to update marks in database.");
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("Server connection failed during update.");
    }
  };

  // Export current filtered rows to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = ["Roll No", "Student Name", "Class", "Subject", "Round", "Total Marks", "Obtained Marks", "Percentage", "Status"];
    const rows = filteredData.map((m) => [
      `"${m.rollNo}"`,
      `"${m.studentName}"`,
      `"${m.class}"`,
      `"${m.subject}"`,
      `"R${m.round}"`,
      m.totalMarks,
      m.obtainedMarks,
      `${m.perc}%`,
      m.isPass ? "PASS" : "FAIL",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Marks_Analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased flex flex-col h-screen overflow-hidden">
      {/* Top Banner Navigation Header bar */}
      <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between shadow-sm shrink-0">
        <button
          onClick={() => navigate("/admin-panel")}
          className="flex items-center text-slate-500 hover:text-[#1e3a8a] font-bold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
            Al Razi Academy
          </h1>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
            Marks Database &amp; Analysis Workspace
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-red-500 hover:text-red-700 font-bold text-sm"
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </button>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
        {/* Dynamic Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Filtered Records</p>
              <h3 className="text-2xl font-black text-slate-800">#{totalRecords}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Hash className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Students In Cohort</p>
              <h3 className="text-2xl font-black text-slate-800">{uniqueStudents}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Distinct Subjects</p>
              <h3 className="text-2xl font-black text-slate-800">{uniqueSubjects}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Book className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm border-b-4 border-b-emerald-500">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cohort Avg Score</p>
              <h3 className="text-2xl font-black text-slate-800">{avgPercentage}%</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* General Analysis Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Global Search Bar */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Global search: name, roll no, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-blue-400"
              />
            </div>

            {/* Class Dropdown */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer"
            >
              <option value="All">All Classes</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>

            {/* Round Dropdown */}
            <select
              value={filterRound}
              onChange={(e) => setFilterRound(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer"
            >
              <option value="All">All Rounds</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((r) => (
                <option key={r} value={r}>
                  Round {r}
                </option>
              ))}
            </select>

            {/* Subject Dropdown */}
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer max-w-[160px]"
            >
              <option value="All">All Subjects</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            {/* Status Pass/Fail Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="PASS">Pass (≥40%)</option>
              <option value="FAIL">Fail (&lt;40%)</option>
            </select>

            {/* Score Performance Band (High/Low/Average) */}
            <select
              value={filterPerformanceBand}
              onChange={(e) => setFilterPerformanceBand(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer"
            >
              <option value="All">Score Band: All</option>
              <option value="TOP_80">High Honours (≥ 80%)</option>
              <option value="60_79">1st Div (60% - 79%)</option>
              <option value="40_59">Clearance (40% - 59%)</option>
              <option value="BELOW_40">Critical / Fail (&lt; 40%)</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="default">Sort: Default</option>
                <option value="roll_asc">Roll No (Low → High)</option>
                <option value="roll_desc">Roll No (High → Low)</option>
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="obt_desc">Marks (High → Low)</option>
                <option value="obt_asc">Marks (Low → High)</option>
                <option value="perc_desc">Percentage (High → Low)</option>
                <option value="perc_asc">Percentage (Low → High)</option>
                <option value="round_asc">Round (1 → 12)</option>
              </select>
            </div>
          </div>

          {/* Sub-toolbar utilities */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowColFilters(!showColFilters)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  showColFilters
                    ? "bg-blue-100 text-[#1e3a8a]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{showColFilters ? "Hide Column Filters" : "Show Column Filters"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>

              <span className="text-[11px] text-slate-400 font-medium ml-2">
                Showing <strong>{filteredData.length}</strong> of {enrichedMarks.length} records
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleDeleteAll}
                className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center transition-colors"
              >
                Delete All Data
              </button>
            </div>
          </div>
        </div>

        {/* Central Records Matrix with Row-level Column Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                {/* 1. Header Names */}
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="p-3 w-28">Roll No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3 w-28">Class</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center w-24">Round</th>
                  <th className="p-3 text-center w-24">Total</th>
                  <th className="p-3 text-center w-28">Obtained</th>
                  <th className="p-3 text-center w-24">%</th>
                  <th className="p-3 text-center w-28">Status</th>
                  <th className="p-3 text-center w-24">Action</th>
                </tr>

                {/* 2. Column-Level Individual Filters Row */}
                {showColFilters && (
                  <tr className="bg-slate-100/70 border-b-2 border-slate-200 text-[11px]">
                    {/* Roll No Filter */}
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Roll..."
                        value={colFilters.rollNo}
                        onChange={(e) => handleColFilterChange("rollNo", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500 font-mono"
                      />
                    </td>

                    {/* Student Name Filter */}
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Filter name..."
                        value={colFilters.studentName}
                        onChange={(e) => handleColFilterChange("studentName", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Class Filter */}
                    <td className="p-2">
                      <select
                        value={colFilters.class}
                        onChange={(e) => handleColFilterChange("class", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-1.5 py-1 text-xs outline-none focus:border-blue-500 font-semibold"
                      >
                        <option value="All">All</option>
                        {availableClasses.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Subject Filter */}
                    <td className="p-2">
                      <select
                        value={colFilters.subject}
                        onChange={(e) => handleColFilterChange("subject", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-1.5 py-1 text-xs outline-none focus:border-blue-500"
                      >
                        <option value="All">All</option>
                        {availableSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Round Filter */}
                    <td className="p-2 text-center">
                      <select
                        value={colFilters.round}
                        onChange={(e) => handleColFilterChange("round", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-1 py-1 text-xs outline-none focus:border-blue-500 font-mono"
                      >
                        <option value="All">All</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((r) => (
                          <option key={r} value={r}>
                            R{r}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Total Filter (Min) */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        placeholder="≥ Total"
                        value={colFilters.minTotal}
                        onChange={(e) => handleColFilterChange("minTotal", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-1 py-1 text-xs text-center outline-none focus:border-blue-500 font-mono"
                      />
                    </td>

                    {/* Obtained Filter (Min) */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        placeholder="≥ Obt"
                        value={colFilters.minObt}
                        onChange={(e) => handleColFilterChange("minObt", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-1 py-1 text-xs text-center outline-none focus:border-blue-500 font-mono"
                      />
                    </td>

                    {/* Percentage Filter (Min %) */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        placeholder="≥ %"
                        value={colFilters.minPerc}
                        onChange={(e) => handleColFilterChange("minPerc", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-1 py-1 text-xs text-center outline-none focus:border-blue-500 font-mono"
                      />
                    </td>

                    {/* Status Filter */}
                    <td className="p-2 text-center">
                      <select
                        value={colFilters.status}
                        onChange={(e) => handleColFilterChange("status", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-1 py-1 text-xs outline-none focus:border-blue-500 font-bold"
                      >
                        <option value="All">All</option>
                        <option value="PASS">Pass</option>
                        <option value="FAIL">Fail</option>
                      </select>
                    </td>

                    {/* Clear column filter indicator */}
                    <td className="p-2 text-center text-[10px] text-slate-400 font-bold">
                      Filters
                    </td>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="p-16 text-center text-slate-400 italic font-medium"
                    >
                      No records matched current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((m) => {
                    const isEditing = editingId === m.id;

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        <td className="p-3">
                          <span className="bg-[#1e3a8a] text-white px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                            {m.rollNo}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {m.studentName}
                        </td>
                        <td className="p-3 font-bold text-slate-500 uppercase">
                          {m.class}
                        </td>
                        <td className="p-3 font-black text-blue-700 tracking-tight">
                          {m.subject}
                        </td>
                        <td className="p-3 text-center">
                          <span className="w-6 h-6 inline-flex items-center justify-center bg-slate-800 text-white rounded-full text-[10px] font-bold font-mono">
                            R{m.round}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-400 font-mono">
                          {m.totalMarks}
                        </td>

                        {/* Dynamic Score cell */}
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max={m.totalMarks}
                              value={editObtainedMarks}
                              onChange={(e) => setEditObtainedMarks(e.target.value)}
                              className="w-16 text-center py-1 bg-slate-100 border border-slate-300 rounded-lg outline-none font-bold text-sm focus:bg-white focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="font-black text-slate-800 text-base font-mono">
                              {m.obtainedMarks}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center font-bold text-blue-600 font-mono">
                          {m.perc}%
                        </td>

                        <td className="p-3 text-center">
                          {m.isPass ? (
                            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase inline-flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" /> Pass
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase inline-flex items-center">
                              <XCircle className="w-3 h-3 mr-1" /> Fail
                            </span>
                          )}
                        </td>

                        {/* Actions Control Cell */}
                        <td className="p-3 text-center">
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
