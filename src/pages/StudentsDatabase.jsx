import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export default function StudentsDatabase() {
  const navigate = useNavigate();

 const [students, setStudents] = useState([]);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All");

  // Inline Editing States
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "", lastName: "", fatherName: "", phone: "", dob: "", class: "",
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

  // Live count per class
  const getClassCount = (cls) => students.filter((s) => s.class === cls).length;

  // =========================================================================
  // CRASH-PROOF & ROBUST DATE PARSER (Handles Excel Objects, Strings & Serials)
  // =========================================================================
  const formatDisplayDate = (dateInput) => {
    if (!dateInput) return "—";

    try {
      let parsedDate = null;

      // Case 1: Agar Excel ne data ko numerical serial number mein parse kiya ho (e.g., 41009)
      if (typeof dateInput === "number") {
        parsedDate = new Date((dateInput - 25569) * 86400 * 1000);
      }
      // Case 2: Agar standard JavaScript Date Object ho
      else if (dateInput instanceof Date) {
        parsedDate = dateInput;
      }
      // Case 3: Agar normal text/string format ho
      else if (typeof dateInput === "string") {
        const cleanStr = dateInput.trim();

        // Agar already DD-MM-YYYY ya DD/MM/YYYY ha, toh directly return karein
        if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(cleanStr)) {
          return cleanStr.replace(/\//g, "-");
        }

        // Agar HTML input standard form mein ha (YYYY-MM-DD)
        const parts = cleanStr.split(/[-/]/);
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
        }

        // Try standard browser parsing fallback
        const timestamp = Date.parse(cleanStr);
        if (!isNaN(timestamp)) {
          parsedDate = new Date(timestamp);
        }
      }

      // Agar data safe matrix se successfully parse ho gaya, toh output generate karein
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

  // Delete Record Handler
  const handleDelete = (id) => {
    if (
      window.confirm(
        "Are you absolutely sure you want to delete this student permanently from the database?",
      )
    ) {
      setStudents(students.filter((s) => s.id !== id));
    }
  };

  // =========================================================================
  // FINAL TRANSACTION COMMIT WIPE
  // =========================================================================
  const executeFinalWipeRepository = () => {
    setStudents([]);
    setShowWipeModal2(false);
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
      `AlRazi_Students_Export_${classFilter}_Class.csv`,
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

  // Save Edits Handler
  const handleEditSave = (id) => {
    setStudents(
      students.map((s) => {
        if (s.id === id) {
          return { ...s, ...editFormData };
        }
        return s;
      }),
    );
    setEditingId(null);
  };

  // Multi-Query Search Filter Logic
  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    const fName = (s.firstName || "").toLowerCase();
    const lName = (s.lastName || "").toLowerCase();
    const fullName = `${fName} ${lName}`.trim();
    const rollStr = String(s.rollNo || "");

    const matchesSearch =
      !query || fullName.includes(query) || rollStr.includes(query);
    const matchesClass = classFilter === "All" || s.class === classFilter;

    return matchesSearch && matchesClass;
  });

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
              <Database className="w-4 h-4 text-blue-300" /> Central Students
              Repository
            </h2>
            <p className="text-[11px] text-blue-200/80 font-medium">
              Full Administrative CRUD Control Panel
            </p>
          </div>
        </div>

        <div className="bg-white/10 px-4 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold font-mono tracking-wider">
            Total Strength: {students.length}
          </span>
        </div>
      </header>

      {/* Analytics & Filters Grid */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col space-y-6">
        {/* Class Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
          {["9th", "10th", "11th", "12th"].map((cls) => (
            <div
              key={cls}
              onClick={() => setClassFilter(cls)}
              className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-sm relative group overflow-hidden ${
                classFilter === cls
                  ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10"
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

        {/* Controls Box */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student full name or automatic roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 text-xs py-2.5 pl-10 pr-4 rounded-xl border border-slate-200/60 outline-none font-medium focus:border-slate-300 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (students.length === 0)
                    alert("Database is already empty.");
                  else setShowWipeModal1(true);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all active:scale-95"
              >
                <Trash className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Wipe Repository</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Filter:
            </span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">All Registered Classes</option>
              <option value="9th">9th Standard</option>
              <option value="10th">10th Standard</option>
              <option value="11th">11th Standard</option>
              <option value="12th">12th Standard</option>
            </select>
          </div>
        </div>

        {/* MAIN DATA SHEET WORKSPACE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs min-w-[800px]">
              <thead className="sticky top-0 bg-slate-50 shadow-sm z-10 border-b border-slate-200">
                <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3 pl-5">Roll No</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Father's Name</th>
                  <th className="p-3">Father Phone</th>
                  <th className="p-3">Date of Birth</th>
                  <th className="p-3">Class</th>
                  <th className="p-3 text-center pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-600 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center p-12 text-slate-400 italic"
                    >
                      No student records found matching the active filters or
                      search parameters.
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

      {/* ==========================================
          POP-UP MODAL LAYER 1: FIRST WARNING
         ========================================== */}
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
                Kya aap Al Razi Academy ka poora central students database khali
                karna chahte hain?
              </p>
            </div>
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-800 font-medium leading-relaxed mb-6">
              Is operation se system mein moujood tamam classes (9th, 10th,
              11th, 12th) ke students ka record saaf ho jayega.
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

      {/* ==========================================
          POP-UP MODAL LAYER 2: CRITICAL MAXIMUM WARNING
         ========================================== */}
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
              🛑 CRITICAL ALERT: Agar aapne abhi 'Wipe Everything' par click
              kiya, toh backup ke bina saara data hamesha ke liye ud jayega.
              Roll numbers aur personal details mukammal urr jayengi.
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
