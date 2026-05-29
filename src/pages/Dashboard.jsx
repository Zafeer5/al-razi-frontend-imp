import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Save,
  CheckCircle,
  X,
} from "lucide-react";
import academyLogo from "../assets/logo ac.jpg";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState("");
  const [subject, setSubject] = useState("");
  const [round, setRound] = useState("");
  const [total, setTotal] = useState("");

  const [classStudents, setClassStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // States for dynamic overwrite alert matrix
  const [isDuplicateDetected, setIsDuplicateDetected] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  // 1. LIVE DATABASE STATES ADD KIYE HAIN
  const [allStudents, setAllStudents] = useState([]);
  const [allMarks, setAllMarks] = useState([]);

  // SECURITY LOCK: Check if teacher is logged in
  useEffect(() => {
    const isVerified = sessionStorage.getItem("isTeacherVerified");
    if (isVerified !== "true") {
      // Agar chabi nahi mili toh seedha login page par wapas bhej do
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

  // 3. DYNAMIC CLASS FILTERING
  useEffect(() => {
    if (!selectedClass) {
      setClassStudents([]);
      setMarksData({});
      return;
    }

    // Ab data API wale state 'allStudents' se filter hoga
    const filtered = allStudents.filter((s) => s.class === selectedClass);

    filtered.sort((a, b) => Number(a.rollNo) - Number(b.rollNo));
    setClassStudents(filtered);

    const initialMarks = {};
    filtered.forEach((s) => {
      initialMarks[s.id] = "";
    });
    setMarksData(initialMarks);
    setSaveSuccess(false);
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

  // Intercept data packet submission request
  const handleSaveClickAttempt = (e) => {
    e.preventDefault();
    if (!selectedClass || !subject || !round || !total) {
      alert("Please fill all configuration parameters before saving records.");
      return;
    }

    // High validation constraint pass pipeline
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
      alert(
        "Cannot save! Some students have marks greater than the Total marks.",
      );
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

    // If duplicate configuration found, trigger modal instead of saving blindly
    if (isDuplicateDetected) {
      setShowConfirmModal(true);
    } else {
      executeCommitSaveToDatabase(false); // Normal routine save
    }
  };

  // =========================================================================
  // SAVE DATA TO MONGODB (LIVE API)
  // =========================================================================
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
        
        // Local state update taake check dubara properly chale refresh ke baghair
        setAllMarks((prev) => [...prev, ...(Array.isArray(savedMarks) ? savedMarks : [savedMarks])]);

        // UI parameters reset
        setShowConfirmModal(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
        
        // Form clear karein
        const resetMarks = {};
        classStudents.forEach(s => { resetMarks[s.id] = ""; });
        setMarksData(resetMarks);
        setTotal("");
        setSubject("");
      } else {
        alert("Error: Database ne marks save nahi kiye.");
      }
    } catch (error) {
      console.error("API Error saving marks:", error);
      alert("Server connection failed!");
    }
  };

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
              Excellence lies in determination
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

            {/* LIVE DYNAMIC SYSTEM STATE WARNING INDICATOR */}
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
                {/* HTML5 DATALIST IMPLEMENTATION */}
                <input
                  type="text"
                  list="subject-suggestions"
                  placeholder="SUBJECT"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-100 text-slate-700 font-semibold placeholder-slate-400 py-3 px-4 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none uppercase tracking-wider text-sm"
                />
                <datalist id="subject-suggestions">
                  {predefinedSubjects.map((sub, index) => (
                    <option key={index} value={sub.toUpperCase()} />
                  ))}
                </datalist>
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
                    Roster Sheet: Class {selectedClass} ({classStudents.length}{" "}
                    Students)
                  </span>
                  {total && (
                    <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-lg font-bold">
                      Max: {total}
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto p-3 space-y-1 bg-slate-50/50">
                  {classStudents.map((student) => {
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
                  })}
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

      {/* =========================================================================
         TAILWIND CUSTOM MODAL POP-UP WITH OVERWRITE INTERACTION FUNCTION
         ========================================================================= */}
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
