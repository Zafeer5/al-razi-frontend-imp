import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Save,
  CheckCircle,
  X,
  Search,
  MoreVertical, // NAYA ICON 3 DOTS KE LIYE
  Zap,          // NAYA ICON AUTO-FILL ZERO KE LIYE
} from "lucide-react";
import academyLogo from "../assets/logo ac.jpg";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("");
  const [subject, setSubject] = useState("");
  const [round, setRound] = useState("");
  const [total, setTotal] = useState("");
  
  // NAYA STATE: Inline error dikhane ke liye
  const [subjectError, setSubjectError] = useState("");

  const [classStudents, setClassStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // NAYA STATE: Student search shortlist karne ke liye
  const [searchQuery, setSearchQuery] = useState("");

  // States for dynamic overwrite alert matrix
  const [isDuplicateDetected, setIsDuplicateDetected] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // NAYI STATES: 3-Dots dropdown open/close control karne ke liye
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const classesList = ["9th", "10th", "11th", "12th"];
  
  // PREDEFINED SUBJECTS LIST FOR AUTO-SUGGESTION
  const predefinedSubjects = [
    "Accounting", "Agriculture", "Arabic", "Banking", "Biology",
    "Business Math", "Business Statistics", "Chemistry", "Civics",
    "Clothing & Textile", "Commercial Geography", "Computer", "Computer-Tech",
    "Economics", "Education", "English", "Ethics", "Food & Nutrition",
    "General Math", "General Science", "Geography", "Health & Physical Education",
    "History", "Home Economics", "ICT-Tech", "Islamiyat (Compulsory)",
    "Islamiyat (Elective)", "Library Science", "Math", "Pakistan Studies",
    "Persian", "Physics", "Principles of Commerce", "Psychology", "Punjabi",
    "Statistics", "Tarjuma-tul-Quran", "Urdu"
  ];

  // NAYI LIST: Jin subjects par yeh 3-dots feature show hoga (Uppercase check ke liye)
  const allowedGeneralSubjects = [
    "ENGLISH",
    "URDU",
    "MATH",
    "ISLAMIYAT (COMPULSORY)",
    "TARJUMA-TUL-QURAN",
    "PAKISTAN STUDIES"
  ];

  // 1. LIVE DATABASE STATES ADD KIYE HAIN
  const [allStudents, setAllStudents] = useState([]);
  const [allMarks, setAllMarks] = useState([]);

  // SECURITY LOCK: Check if teacher is logged in
  useEffect(() => {
    const isVerified = sessionStorage.getItem("isTeacherVerified");
    if (isVerified !== "true") {
      navigate("/teacher-login"); 
    }
  }, [navigate]);

  // 2. FETCH FROM CLOUD ON MOUNT
  useEffect(() => {
    fetch("https://al-razi-backend-imp.onrender.com/api/students")
      .then((res) => res.json())
      .then((data) => setAllStudents(data))
      .catch((err) => console.error("Error fetching students:", err));

    fetch("https://al-razi-backend-imp.onrender.com/api/marks")
      .then((res) => res.json())
      .then((data) => setAllMarks(data))
      .catch((err) => console.error("Error fetching marks:", err));
  }, []);

  // Dropdown ke baahar click karne se menu close ho jaye uski logic
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. DYNAMIC CLASS FILTERING
  useEffect(() => {
    if (!selectedClass) {
      setClassStudents([]);
      setMarksData({});
      setSearchQuery(""); 
      return;
    }

    const filtered = allStudents.filter((s) => s.class === selectedClass);

    filtered.sort((a, b) => Number(a.rollNo) - Number(b.rollNo));
    setClassStudents(filtered);

    const initialMarks = {};
    filtered.forEach((s) => {
      initialMarks[s.id] = "";
    });
    setMarksData(initialMarks);
    setSaveSuccess(false);
    setSearchQuery(""); 
  }, [selectedClass, allStudents]);

  // =========================================================================
  // REAL-TIME DUPLICATE DETECTION LOGIC (Now using Live API Data)
  // =========================================================================
  useEffect(() => {
    if (!selectedClass || !subject.trim() || !round) {
      setIsDuplicateDetected(false);
      return;
    }

    const currentSubjectUpper = subject.trim().toUpperCase();

    const matchFound = allMarks.some(
      (record) =>
        record.class === selectedClass &&
        record.subject === currentSubjectUpper &&
        String(record.round) === String(round),
    );

    setIsDuplicateDetected(matchFound);
  }, [selectedClass, subject, round, allMarks]);

  const handleMarksChange = (studentId, value) => {
    setMarksData((prev) => ({
      ...prev,
      [studentId]: value,
    }));
    if (saveSuccess) setSaveSuccess(false);
  };

  // NAYA FUNCTION: Jo empty fields ko dhoond kar 0 set karega
  const handleFillEmptyWithZeros = () => {
    setMarksData((prev) => {
      const updatedMarks = { ...prev };
      classStudents.forEach((student) => {
        // Agar pehle se koi value nahi likhi hui toh usey '0' assign kar do
        if (
          updatedMarks[student.id] === undefined ||
          updatedMarks[student.id] === null ||
          String(updatedMarks[student.id]).trim() === ""
        ) {
          updatedMarks[student.id] = "0";
        }
      });
      return updatedMarks;
    });
    setShowDropdown(false); // Action perform hote hi menu close ho jaye
  };

  const handleSaveClickAttempt = (e) => {
    e.preventDefault();
    if (!selectedClass || !subject || !round || !total) {
      alert("Please fill all configuration parameters before saving records.");
      return;
    }

    const currentSubjectUpper = subject.trim().toUpperCase();
    const isValidSubject = predefinedSubjects.some(
      (sub) => sub.toUpperCase() === currentSubjectUpper
    );

    if (!isValidSubject) {
      setSubjectError("Please select a valid subject from the list.");
      setTimeout(() => setSubjectError(""), 3000); 
      return;
    }

    let hasValidationError = false;
    classStudents.forEach((s) => {
      const markValue = marksData[s.id];
      if (markValue !== undefined && markValue !== "") {
        const score = Number(markValue);
        const maxScore = Number(total);
        if (score > maxScore) {
          hasValidationError = true;
        }
      }
    });

    if (hasValidationError) {
      alert("Cannot save! Some students have marks greater than the Total marks.");
      return;
    }

    const enteredEntriesCount = classStudents.filter((student) => {
      const markValue = marksData[student.id];
      return (
        markValue !== undefined &&
        markValue !== null &&
        String(markValue).trim() !== ""
      );
    }).length;

    if (enteredEntriesCount === 0) {
      alert("Please enter marks for at least one student before saving.");
      return;
    }

    if (isDuplicateDetected) {
      setShowConfirmModal(true);
    } else {
      executeCommitSaveToDatabase(false); 
    }
  };

  const executeCommitSaveToDatabase = async (shouldOverwrite = false) => {
    const currentSubjectUpper = subject.trim().toUpperCase();

    const newEntries = classStudents
      .filter((student) => {
        const markValue = marksData[student.id];
        return (
          markValue !== undefined &&
          markValue !== null &&
          String(markValue).trim() !== ""
        );
      })
      .map((student) => ({
        id: `MARK-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
        rollNo: student.rollNo,
        class: selectedClass,
        subject: currentSubjectUpper,
        round: round,
        totalMarks: Number(total),
        obtainedMarks: Number(marksData[student.id])
      }));

    try {
      const response = await fetch("https://al-razi-backend-imp.onrender.com/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntries),
      });

      if (response.ok) {
        const savedMarks = await response.json();
        setAllMarks((prev) => [...prev, ...(Array.isArray(savedMarks) ? savedMarks : [savedMarks])]);

        setShowConfirmModal(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
        
        const resetMarks = {};
        classStudents.forEach(s => { resetMarks[s.id] = ""; });
        setMarksData(resetMarks);
        setTotal("");
        setSubject("");
        setSearchQuery(""); 
      } else {
        alert("Error: Database ne marks save nahi kiye.");
      }
    } catch (error) {
      console.error("API Error saving marks:", error);
      alert("Server connection failed!");
    }
  };

  const filteredStudentsBySearch = classStudents.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName || ""}`.toLowerCase();
    const rollNoStr = String(student.rollNo);
    const search = searchQuery.toLowerCase().trim();
    return fullName.includes(search) || rollNoStr.includes(search);
  });

  // Check variables for displaying feature conditionally
  const currentSubjectClean = subject.trim().toUpperCase();
  const isFeatureAllowedSubject = allowedGeneralSubjects.includes(currentSubjectClean);

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased flex flex-col h-screen overflow-hidden">
      <header className="w-full bg-[#1e3a8a] text-white px-6 py-4 md:px-12 flex flex-col sm:flex-row items-center justify-between shadow-md shrink-0">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-0.5 overflow-hidden shadow-inner border border-slate-200">
            <img
              src={academyLogo}
              alt="Al Razi Academy Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wide">
              Al Razi Academy
            </h1>
            <p className="text-xs md:text-sm italic text-slate-300 font-light">
              Excellent lies in determination
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="flex items-center space-x-2 bg-transparent border border-white/40 hover:bg-white/10 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="uppercase tracking-wider text-xs">Admin</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8">
            <div className="flex items-center space-x-2 text-emerald-700 font-semibold tracking-wider text-sm mb-4">
              <BookOpen className="w-4 h-4" />
              <span className="uppercase">Mark Entry</span>
            </div>

            {isDuplicateDetected ? (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start space-x-2.5 mb-6 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed font-bold">
                  ⚠️ ALREADY ENTERED NOTICE: Is Class, Subject aur Round ke
                  marks pehle se database mein maujood hain. Save karne par
                  purana data automatic overwrite ho jayega.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-2.5 mb-6">
                <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Subject ka naam type karna shuru karein, system automatically suggest kar dega.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-100 text-slate-700 font-medium py-3 px-4 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                >
                  <option value="" disabled hidden>
                    Select Class
                  </option>
                  {classesList.map((c, idx) => (
                    <option key={idx} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  list="subject-suggestions"
                  placeholder="SUBJECT"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (subjectError) setSubjectError(""); 
                  }}
                  className={`w-full font-semibold py-3 px-4 rounded-xl border outline-none uppercase tracking-wider text-sm transition-all ${
                    subjectError
                      ? "border-red-400 text-red-600 bg-red-50 focus:bg-white"
                      : "bg-slate-100 text-slate-700 placeholder-slate-400 border-transparent focus:border-slate-300 focus:bg-white"
                  }`}
                />
                <datalist id="subject-suggestions">
                  {predefinedSubjects.map((sub, index) => (
                    <option key={index} value={sub.toUpperCase()} />
                  ))}
                </datalist>

                {subjectError && (
                  <div className="flex items-center space-x-1 mt-1.5 ml-1 animate-fade-in">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <p className="text-[10px] text-red-500 font-bold tracking-wide">
                      {subjectError}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <select
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="w-full bg-slate-100 text-slate-700 font-medium py-3 px-4 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                >
                  <option value="" disabled hidden>
                    Round (1-12)
                  </option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Round {num}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Total Marks"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  className="w-full bg-orange-50/60 border border-orange-200/70 text-orange-800 placeholder-orange-400 font-medium py-3 px-4 rounded-xl focus:border-orange-300 focus:bg-white outline-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden min-h-[220px]">
            {!selectedClass ? (
              <div className="p-12 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
                <p className="text-slate-400 text-sm font-medium">
                  Select a class to begin...
                </p>
              </div>
            ) : classStudents.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">
                  No Students Found
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Is class ke students database mein add nahi hain. Pehle Admin
                  repository mein ja kar students register karein.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveClickAttempt} className="flex flex-col">
                <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Marks Sheet: Class {selectedClass} ({classStudents.length}{" "}
                    Students)
                  </span>
                  {total && (
                    <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-lg font-bold">
                      Max: {total}
                    </span>
                  )}
                </div>

                {/* SEARCH INPUT BOX WITH CONDITIONAL 3-DOTS ACTION DROP-DOWN */}
                <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search student by name or roll no..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 text-slate-700 placeholder-slate-400 text-sm font-medium pl-10 pr-10 py-2.5 rounded-xl focus:border-slate-300 focus:bg-white outline-none transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* CONDITIONAL 3-DOTS RENDER PIPELINE */}
                  {isFeatureAllowedSubject && (
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all focus:outline-none flex items-center justify-center"
                        title="Options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* DRILLDOWN BUTTON CONTAINER MENU */}
                      {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-30 p-1.5 animate-fade-in origin-top-right">
                          <button
                            type="button"
                            onClick={handleFillEmptyWithZeros}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-all text-left"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                            <span>Fill Empty with 0</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto p-3 space-y-1 bg-slate-50/50">
                  {filteredStudentsBySearch.length === 0 ? (
                    <div className="p-8 text-center text-sm font-medium text-slate-400">
                      No matching student found.
                    </div>
                  ) : (
                    filteredStudentsBySearch.map((student) => {
                      const currentScore = Number(marksData[student.id] || 0);
                      const maxAllowed = Number(total || 0);
                      const isInvalid = total !== "" && currentScore > maxAllowed;

                      return (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-3 rounded-xl border ${
                            isInvalid
                              ? "bg-red-50 border-red-200"
                              : "bg-white border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center space-x-4 truncate">
                            <span className="w-10 h-10 bg-[#1e3a8a] text-white rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0">
                              {student.rollNo}
                            </span>
                            <span className="text-sm font-bold text-slate-800 truncate">
                              {student.firstName} {student.lastName || ""}
                            </span>
                          </div>

                          <div className="flex flex-col items-end space-y-1">
                            <input
                              type="number"
                              min="0"
                              placeholder="—"
                              value={marksData[student.id] || ""}
                              onChange={(e) =>
                                handleMarksChange(student.id, e.target.value)
                              }
                              className={`w-20 text-center py-2 px-1 rounded-xl font-mono font-bold text-sm border outline-none ${
                                isInvalid
                                  ? "bg-red-100 text-red-800 border-red-400"
                                  : "bg-slate-100 text-slate-800 border-transparent focus:border-slate-300 focus:bg-white"
                              }`}
                            />
                            {isInvalid && (
                              <span className="text-[9px] text-red-600 font-bold uppercase tracking-wide animate-pulse">
                                Exceeds Max!
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {saveSuccess && (
                      <div className="flex items-center space-x-1.5 text-emerald-600 text-xs font-bold">
                        <CheckCircle className="w-4 h-4" />
                        <span>All scores successfully committed!</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-[#22c55e] hover:bg-[#1ca84f] text-white py-2.5 px-6 rounded-xl font-bold text-sm tracking-wide shadow-md shadow-emerald-700/10 active:scale-[0.98]"
                  >
                    <Save className="w-4 h-4" />
                    <span>SAVE ALL MARKS</span>
                  </button>
                </div>
              </form>
            )}
          </section>
        </main>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 relative animate-scale-up">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6 mt-2">
              <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base uppercase tracking-wide">
                Data Overwrite Confirmation
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Class{" "}
                <span className="font-bold text-slate-700">
                  {selectedClass}
                </span>
                , Subject:{" "}
                <span className="font-bold text-slate-700">
                  {subject.trim().toUpperCase()}
                </span>
                , Round{" "}
                <span className="font-bold text-slate-700">{round}</span> ke
                marks pehle se save hain.
              </p>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-800 font-medium leading-relaxed mb-6">
              Agar aap naya data save karte hain, toh purana records database se
              delete hokar is naye data se safely replace (overwrite) ho jayega.
              Duplicate rows nahi banengi!
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => executeCommitSaveToDatabase(true)}
                className="flex-1 bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-blue-900/10 transition-all active:scale-95"
              >
                Overwrite & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
