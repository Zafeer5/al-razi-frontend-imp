import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  Edit2,
  Trash2,
  GraduationCap,
  Save,
  X,
  Database,
  Users,
  Download,
  Trash,
  AlertTriangle,
  RotateCcw,
  ArrowUpDown,
} from "lucide-react";

export default function StudentsDatabase() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);

  // ================= GENERAL SEARCH & TOOLBAR FILTERS =================
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  // ================= PER-COLUMN (ROW HEADER) FILTERS =================
  const [showColFilters, setShowColFilters] = useState(true);
  const [colFilters, setColFilters] = useState({
    rollNo: "",
    fullName: "",
    fatherName: "",
    phone: "",
    dob: "",
    class: "All",
  });

  // Inline Editing States
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    phone: "",
    dob: "",
    class: "",
  });

  // Custom Double-Layer Wipe Pop-up Modals States
  const [showWipeModal1, setShowWipeModal1] = useState(false);
  const [showWipeModal2, setShowWipeModal2] = useState(false);

  // Live Data Fetch from Render Backend
  useEffect(() => {
    fetch("https://al-razi-backend-imp.onrender.com/api/students")
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => console.error("Error fetching students:", err));
  }, []);

  // =========================================================================
  // CRASH-PROOF & ROBUST DATE PARSER (UNTOUCHED)
  // =========================================================================
  const formatDisplayDate = (dateInput) => {
    if (!dateInput) return "—";

    try {
      let parsedDate = null;

      if (typeof dateInput === "number") {
        parsedDate = new Date((dateInput - 25569) * 86400 * 1000);
      } else if (dateInput instanceof Date) {
        parsedDate = dateInput;
      } else if (typeof dateInput === "string") {
        const cleanStr = dateInput.trim();

        if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(cleanStr)) {
          return cleanStr.replace(/\//g, "-");
        }

        const parts = cleanStr.split(/[-/]/);
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
        }

        const timestamp = Date.parse(cleanStr);
        if (!isNaN(timestamp)) {
          parsedDate = new Date(timestamp);
        }
      }

      if (parsedDate && !isNaN(parsedDate.getTime())) {
        const day = String(parsedDate.getDate()).padStart(2, "0");
        const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const year = parsedDate.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch (error) {
      console.error("Date extraction runtime error fallback:", error);
    }

    return String(dateInput);
  };

  // Helper for column-level filter changes
  const handleColFilterChange = (field, value) => {
    setColFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchQuery("");
    setClassFilter("All");
    setSortBy("default");
    setColFilters({
      rollNo: "",
      fullName: "",
      fatherName: "",
      phone: "",
      dob: "",
      class: "All",
    });
  };

  // ================= MULTI-TIER FILTERING & SORTING ENGINE =================
  const filteredStudents = useMemo(() => {
    let result = students.filter((s) => {
      // 1. GENERAL SEARCH
      const query = searchQuery.toLowerCase().trim();
      const fName = (s.firstName || "").toLowerCase();
      const lName = (s.lastName || "").toLowerCase();
      const fullName = `${fName} ${lName}`.trim();
      const fatherName = (s.fatherName || "").toLowerCase();
      const phoneStr = String(s.phone || "").toLowerCase();
      const rollStr = String(s.rollNo || "");

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        rollStr.includes(query) ||
        fatherName.includes(query) ||
        phoneStr.includes(query);

      if (!matchesSearch) return false;

      // 2. GENERAL TOOLBAR CLASS FILTER
      if (classFilter !== "All" && s.class !== classFilter) return false;

      // 3. COLUMN-LEVEL FILTERS
      if (
        colFilters.rollNo &&
        !rollStr.toLowerCase().includes(colFilters.rollNo.toLowerCase().trim())
      ) {
        return false;
      }
      if (
        colFilters.fullName &&
        !fullName.includes(colFilters.fullName.toLowerCase().trim())
      ) {
        return false;
      }
      if (
        colFilters.fatherName &&
        !fatherName.includes(colFilters.fatherName.toLowerCase().trim())
      ) {
        return false;
      }
      if (
        colFilters.phone &&
        !phoneStr.includes(colFilters.phone.toLowerCase().trim())
      ) {
        return false;
      }
      if (colFilters.dob) {
        const formatted = formatDisplayDate(s.dob).toLowerCase();
        const rawDob = String(s.dob || "").toLowerCase();
        const dobQ = colFilters.dob.toLowerCase().trim();
        if (!formatted.includes(dobQ) && !rawDob.includes(dobQ)) {
          return false;
        }
      }
      if (colFilters.class !== "All" && s.class !== colFilters.class) {
        return false;
      }

      return true;
    });

    // 4. SORTING
    result.sort((a, b) => {
      const numA = Number(a.rollNo) || 0;
      const numB = Number(b.rollNo) || 0;
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();

      switch (sortBy) {
        case "roll_asc":
          return numA - numB;
        case "roll_desc":
          return numB - numA;
        case "name_asc":
          return nameA.localeCompare(nameB);
        case "name_desc":
          return nameB.localeCompare(nameA);
        case "dob_desc":
          return new Date(b.dob || 0) - new Date(a.dob || 0);
        case "dob_asc":
          return new Date(a.dob || 0) - new Date(b.dob || 0);
        default:
          return numA - numB;
      }
    });

    return result;
  }, [students, searchQuery, classFilter, colFilters, sortBy]);

  // Live count per class
  const getClassCount = (cls) => students.filter((s) => s.class === cls).length;

  // Delete Record Handler (LIVE API)
  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you absolutely sure you want to delete this student permanently from the database?"
      )
    ) {
      try {
        const response = await fetch(`https://al-razi-backend-imp.onrender.com/api/students/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setStudents(students.filter((s) => s.id !== id));
        } else {
          alert("Failed to delete student from MongoDB.");
        }
      } catch (error) {
        console.error("Delete Error:", error);
        alert("Server connection failed during deletion.");
      }
    }
  };

  // FINAL TRANSACTION COMMIT WIPE (LIVE API)
  const executeFinalWipeRepository = async () => {
    try {
      const response = await fetch("https://al-razi-backend-imp.onrender.com/api/students", {
        method: "DELETE",
      });
      if (response.ok) {
        setStudents([]);
        setShowWipeModal2(false);
      } else {
        alert("Failed to wipe repository in MongoDB.");
      }
    } catch (error) {
      console.error("Wipe Error:", error);
      alert("Server connection failed during wipe.");
    }
  };

  // CSV Export Engine
  const handleDownloadCSV = () => {
    if (filteredStudents.length === 0) {
      alert("Download karne ke liye koi data maujood nahi hai.");
      return;
    }

    const headers = [
      "Roll No",
      "First Name",
      "Last Name",
      "Father Name",
      "Father Phone",
      "Date of Birth",
      "Class",
    ];
    const rows = filteredStudents.map((s) => [
      s.rollNo,
      `"${(s.firstName || "").replace(/"/g, '""')}"`,
      `"${(s.lastName || "").replace(/"/g, '""')}"`,
      `"${(s.fatherName || "").replace(/"/g, '""')}"`,
      `'${s.phone || ""}`,
      formatDisplayDate(s.dob),
      s.class,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `AlRazi_Students_Export_${classFilter}_Class.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Start Editing Row Handler
  const startEditing = (student) => {
    setEditingId(student.id);
    setEditFormData({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      fatherName: student.fatherName || "",
      phone: student.phone || "",
      dob: student.dob || "",
      class: student.class || "9th",
    });
  };

  // UPDATE / SAVE EDITS HANDLER (LIVE API CONNECTED)
  const handleEditSave = async (id) => {
    try {
      const response = await fetch(`https://al-razi-backend-imp.onrender.com/api/students/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        setStudents(
          students.map((s) => {
            if (s.id === id) {
              return { ...s, ...editFormData };
            }
            return s;
          })
        );
        setEditingId(null);
      } else {
        alert("Failed to update student in database.");
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("Server connection failed during update.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased flex flex-col h-screen overflow-hidden">
      {/* Sub-Header Layout */}
      <header className="h-16 bg-[#1e3a8a] text-white px-6 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/admin-panel")}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-blue-200 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold tracking-wide uppercase flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-300" /> Central Students Repository
            </h2>
            <p className="text-[11px] text-blue-200/80 font-medium">
              Full Administrative CRUD &amp; Multi-Filter Control Panel
            </p>
          </div>
        </div>

        <div className="bg-white/10 px-4 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold font-mono tracking-wider">
            Filtered: {filteredStudents.length} / Total: {students.length}
          </span>
        </div>
      </header>

      {/* Analytics & Filters Grid */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col space-y-4">
        {/* Class Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
          {["9th", "10th", "11th", "12th"].map((cls) => (
            <div
              key={cls}
              onClick={() => setClassFilter(classFilter === cls ? "All" : cls)}
              className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-sm relative group overflow-hidden ${
                classFilter === cls
                  ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20"
                  : "border-slate-200/70 hover:border-slate-300"
              }`}
            >
              <div className="absolute right-[-5%] bottom-[-10%] opacity-[0.05] group-hover:scale-110 transition-transform">
                <GraduationCap className="w-16 h-16 text-slate-900" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Class {cls}
              </p>
              <h3 className="text-2xl font-black text-slate-800 mt-1 font-mono">
                {getClassCount(cls)}{" "}
                <span className="text-xs text-slate-400 font-sans font-semibold">
                  Active
                </span>
              </h3>
            </div>
          ))}
        </div>

        {/* General Controls & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Global Search Bar */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Global search: name, roll number, father name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 text-xs py-2 pl-10 pr-4 rounded-xl border border-slate-200 outline-none font-medium focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>

            {/* Class Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Class:
              </span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="All">All Classes</option>
                <option value="9th">9th Standard</option>
                <option value="10th">10th Standard</option>
                <option value="11th">11th Standard</option>
                <option value="12th">12th Standard</option>
              </select>
            </div>

            {/* Sorting Engine */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="default">Sort: Roll No (Asc)</option>
                <option value="roll_desc">Roll No (High → Low)</option>
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="dob_desc">DOB (Newest First)</option>
                <option value="dob_asc">DOB (Oldest First)</option>
              </select>
            </div>
          </div>

          {/* Sub-toolbar utilities */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
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
                Showing <strong>{filteredStudents.length}</strong> of {students.length} students
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (students.length === 0) alert("Database is already empty.");
                  else setShowWipeModal1(true);
                }}
                className="flex items-center justify-center space-x-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 px-3.5 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wide transition-all active:scale-95"
              >
                <Trash className="w-3.5 h-3.5" />
                <span>Wipe Repository</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN DATA SHEET WORKSPACE WITH COLUMN-LEVEL FILTERS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs min-w-[850px]">
              <thead className="sticky top-0 bg-slate-50 shadow-sm z-10 border-b border-slate-200">
                {/* 1. Header Labels */}
                <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3 pl-5 w-28">Roll No</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Father's Name</th>
                  <th className="p-3 w-36">Father Phone</th>
                  <th className="p-3 w-32">Date of Birth</th>
                  <th className="p-3 w-28">Class</th>
                  <th className="p-3 text-center pr-5 w-24">Actions</th>
                </tr>

                {/* 2. Column-Specific Filter Inputs */}
                {showColFilters && (
                  <tr className="bg-slate-100/70 border-b-2 border-slate-200 text-[11px]">
                    {/* Roll Filter */}
                    <td className="p-2 pl-5">
                      <input
                        type="text"
                        placeholder="Roll..."
                        value={colFilters.rollNo}
                        onChange={(e) => handleColFilterChange("rollNo", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500 font-mono"
                      />
                    </td>

                    {/* Name Filter */}
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Filter name..."
                        value={colFilters.fullName}
                        onChange={(e) => handleColFilterChange("fullName", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Father Name Filter */}
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Filter father..."
                        value={colFilters.fatherName}
                        onChange={(e) => handleColFilterChange("fatherName", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Phone Filter */}
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Filter phone..."
                        value={colFilters.phone}
                        onChange={(e) => handleColFilterChange("phone", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500 font-mono"
                      />
                    </td>

                    {/* DOB Filter */}
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="Year/Date..."
                        value={colFilters.dob}
                        onChange={(e) => handleColFilterChange("dob", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500 font-mono"
                      />
                    </td>

                    {/* Class Dropdown Filter */}
                    <td className="p-2">
                      <select
                        value={colFilters.class}
                        onChange={(e) => handleColFilterChange("class", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-1.5 py-1 text-xs outline-none focus:border-blue-500 font-bold"
                      >
                        <option value="All">All</option>
                        <option value="9th">9th</option>
                        <option value="10th">10th</option>
                        <option value="11th">11th</option>
                        <option value="12th">12th</option>
                      </select>
                    </td>

                    <td className="p-2 text-center text-[10px] text-slate-400 font-bold pr-5">
                      Filters
                    </td>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white text-slate-600 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center p-12 text-slate-400 italic"
                    >
                      No student records found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const isEditing = editingId === student.id;

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="p-3 pl-5 font-mono font-bold text-slate-800">
                          <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                            {student.rollNo}
                          </span>
                        </td>

                        <td className="p-3">
                          {isEditing ? (
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={editFormData.firstName}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    firstName: e.target.value,
                                  })
                                }
                                className="bg-slate-50 border border-slate-300 p-1 rounded font-semibold w-24 outline-none focus:bg-white"
                              />
                              <input
                                type="text"
                                value={editFormData.lastName}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    lastName: e.target.value,
                                  })
                                }
                                className="bg-slate-50 border border-slate-300 p-1 rounded font-semibold w-24 outline-none focus:bg-white"
                              />
                            </div>
                          ) : (
                            <div className="font-bold text-slate-800">
                              {student.firstName || ""} {student.lastName || ""}
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.fatherName}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  fatherName: e.target.value,
                                })
                              }
                              className="bg-slate-50 border border-slate-300 p-1 rounded w-full font-medium outline-none focus:bg-white"
                            />
                          ) : (
                            student.fatherName || "—"
                          )}
                        </td>

                        <td className="p-3 font-mono">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.phone}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  phone: e.target.value,
                                })
                              }
                              className="bg-slate-50 border border-slate-300 p-1 rounded w-full font-mono outline-none focus:bg-white"
                            />
                          ) : (
                            student.phone || "—"
                          )}
                        </td>

                        <td className="p-3 font-mono text-slate-700 font-semibold">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editFormData.dob}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  dob: e.target.value,
                                })
                              }
                              className="bg-slate-50 border border-slate-300 p-1 rounded font-mono outline-none focus:bg-white"
                            />
                          ) : (
                            formatDisplayDate(student.dob)
                          )}
                        </td>

                        <td className="p-3 font-bold text-blue-700">
                          {isEditing ? (
                            <select
                              value={editFormData.class}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  class: e.target.value,
                                })
                              }
                              className="bg-slate-50 border border-slate-300 p-1 rounded font-bold outline-none cursor-pointer"
                            >
                              <option value="9th">9th</option>
                              <option value="10th">10th</option>
                              <option value="11th">11th</option>
                              <option value="12th">12th</option>
                            </select>
                          ) : (
                            student.class
                          )}
                        </td>

                        <td className="p-3 text-center pr-5">
                          {isEditing ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleEditSave(student.id)}
                                className="bg-emerald-600 text-white p-1.5 rounded-lg hover:bg-emerald-700 shadow-sm cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-slate-200 text-slate-600 p-1.5 rounded-lg hover:bg-slate-300 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditing(student)}
                                className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
                                className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

      {/* POP-UP MODAL LAYER 1: FIRST WARNING */}
      {showWipeModal1 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 relative animate-scale-up">
            <button
              onClick={() => setShowWipeModal1(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-5 mt-2">
              <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide">
                Wipe Students Repository?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Kya aap Al Razi Academy ka poora central students database khali karna chahte hain?
              </p>
            </div>
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-800 font-medium leading-relaxed mb-6">
              Is operation se system mein moujood tamam classes (9th, 10th, 11th, 12th) ke students ka record saaf ho jayega.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWipeModal1(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowWipeModal1(false);
                  setShowWipeModal2(true);
                }}
                className="flex-1 bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL LAYER 2: CRITICAL MAXIMUM WARNING */}
      {showWipeModal2 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 relative animate-scale-up">
            <button
              onClick={() => setShowWipeModal2(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-5 mt-2">
              <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-rose-600 text-lg uppercase tracking-wide">
                Final Warning Validation
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you 100% absolutely certain? Yeh rollback nahi ho sakega!
              </p>
            </div>
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs font-bold leading-relaxed mb-6">
              🛑 CRITICAL ALERT: Agar aapne abhi 'Wipe Everything' par click kiya, toh backup ke bina saara data hamesha ke liye ud jayega. Roll numbers aur personal details mukammal urr jayengi.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWipeModal2(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                No, Go Back
              </button>
              <button
                onClick={executeFinalWipeRepository}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
              >
                Wipe Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
