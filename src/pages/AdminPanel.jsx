import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Menu,
  Database,
  Home,
  LogOut,
  Sidebar,
  BarChart3,
  Printer,
  Trophy,
  FileText,
  ClipboardList,
  X,
  Calendar,
  User,
  Phone,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import academyLogo from "../assets/logo ac.jpg";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [adminSelectedClass, setAdminSelectedClass] = useState("9th");
  const [selectedRounds, setSelectedRounds] = useState(["R1", "R2", "R3"]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDbChoiceOpen, setIsDbChoiceOpen] = useState(false);

  const [activeStudent, setActiveStudent] = useState(null);
  const [sequenceInput, setSequenceInput] = useState("");
  const [activeReportMode, setActiveReportMode] = useState("single");

  const [students, setStudents] = useState([]);
  const [globalMarks, setGlobalMarks] = useState([]); // API se Live Data Fetch karein

  useEffect(() => {
    fetch("https://al-razi-backend-imp.onrender.com/api/students")
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => console.error("Error fetching students:", err));

    fetch("https://al-razi-backend-imp.onrender.com/api/marks")
      .then((res) => res.json())
      .then((data) => setGlobalMarks(data))
      .catch((err) => console.error("Error fetching marks:", err));
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    phone: "",
    dob: "",
    class: "",
  });
  const [calculatedRollNo, setCalculatedRollNo] = useState("");

  const [bulkParsedData, setBulkParsedData] = useState([]);
  const [fileName, setFileName] = useState("");

  const classesList = ["9th", "10th", "11th", "12th"];
  const roundsList = [
    "R1",
    "R2",
    "R3",
    "R4",
    "R5",
    "R6",
    "R7",
    "R8",
    "R9",
    "R10",
    "R11",
    "R12",
  ];

  const getActiveRollNoRange = () => {
    const activeClassStudents = students.filter(
      (s) => s.class === adminSelectedClass,
    );
    if (activeClassStudents.length === 0) return "No students registered";
    const rollNumbers = activeClassStudents.map((s) => Number(s.rollNo));
    const minRoll = Math.min(...rollNumbers);
    const maxRoll = Math.max(...rollNumbers);
    return `${minRoll} - ${maxRoll}`;
  };

  useEffect(() => {
    const currentClassList = students.filter(
      (s) => s.class === adminSelectedClass,
    );
    if (currentClassList.length > 0) {
      setActiveStudent(currentClassList[0]);
    } else {
      setActiveStudent(null);
    }
    setActiveReportMode("single");
  }, [adminSelectedClass, students]);

  useEffect(() => {
    if (!formData.class) {
      setCalculatedRollNo("");
      return;
    }
    let baseRoll = 901;
    if (formData.class === "10th") baseRoll = 1001;
    if (formData.class === "11th") baseRoll = 1101;
    if (formData.class === "12th") baseRoll = 1201;

    const classStudents = students.filter((s) => s.class === formData.class);
    if (classStudents.length > 0) {
      const maxRoll = Math.max(...classStudents.map((s) => s.rollNo));
      setCalculatedRollNo(maxRoll + 1);
    } else {
      setCalculatedRollNo(baseRoll);
    }
  }, [formData.class, students]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    const newStudent = {
      id: "STUD-" + Date.now(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      fatherName: formData.fatherName,
      phone: formData.phone,
      dob: formData.dob,
      class: formData.class,
      rollNo: calculatedRollNo,
    };

    try {
      const response = await fetch("https://al-razi-backend-imp.onrender.com/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });

      if (response.ok) {
        const savedStudent = await response.json();
        setStudents((prev) => [...prev, savedStudent]);
        setFormData({
          firstName: "",
          lastName: "",
          fatherName: "",
          phone: "",
          dob: "",
          class: "",
        });
        setIsSingleModalOpen(false);
        alert("✅ Student Saved Successfully!"); // Kamyabi ka message
      } else {
        // Agar backend reject kare toh error dikhaye
        const errorData = await response.json();
        console.error("Backend Reject Error:", errorData);
        alert(
          "❌ Error: " +
            (errorData.message || "Database ne data reject kar diya"),
        );
      }
    } catch (error) {
      // Agar server hi connect na ho
      console.error("API Error:", error);
      alert(
        "❌ Server connection failed! Kya aapka backend (node server.js) chal raha hai?",
      );
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setBulkParsedData(data);
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSaveToDatabase = async () => {
    if (bulkParsedData.length === 0) return;
    let newStudentsToAdd = [];
    let currentClassRolls = [...students];

    bulkParsedData.forEach((row, index) => {
      const targetClass = String(row.Class || row.class || "").trim();
      let baseRoll = 901;
      if (targetClass === "10th") baseRoll = 1001;
      if (targetClass === "11th") baseRoll = 1101;
      if (targetClass === "12th") baseRoll = 1201;

      const classStudents = currentClassRolls.filter(
        (s) => s.class === targetClass,
      );
      let nextRollNo = baseRoll;
      if (classStudents.length > 0) {
        nextRollNo = Math.max(...classStudents.map((s) => s.rollNo)) + 1;
      }

      const newStud = {
        id: `BULK-${Date.now()}-${index}`,
        firstName: row.FirstName || row.firstName || "Unknown",
        lastName: row.LastName || row.lastName || "",
        fatherName: row.FatherName || row.fatherName || "",
        phone: row.FatherPhone || row.fatherPhone || "",
        dob: row.DOB || row.dob || "",
        class: targetClass,
        rollNo: nextRollNo,
      };

      newStudentsToAdd.push(newStud);
      currentClassRolls.push(newStud);
    });

    try {
      const response = await fetch("https://al-razi-backend-imp.onrender.com/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudentsToAdd),
      });

      if (response.ok) {
        const savedStudents = await response.json();
        setStudents((prev) => [...prev, ...savedStudents]);
        setBulkParsedData([]);
        setFileName("");
        setIsBulkModalOpen(false);
      }
    } catch (error) {
      console.error("Bulk upload API Error:", error);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesClass = s.class === adminSelectedClass;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesClass;
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const rollNoStr = String(s.rollNo);
    return (
      matchesClass && (fullName.includes(query) || rollNoStr.includes(query))
    );
  });

  const toggleRound = (r) => {
    if (selectedRounds.includes(r)) {
      setSelectedRounds(selectedRounds.filter((item) => item !== r));
    } else {
      setSelectedRounds(
        [...selectedRounds, r].sort(
          (a, b) => Number(a.replace("R", "")) - Number(b.replace("R", "")),
        ),
      );
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const getSingleStudentMetrics = (studentObj) => {
    if (!studentObj)
      return { rows: [], totalMax: 0, totalObt: 0, perc: 0, status: "FAIL" };

    const studentScores = globalMarks.filter(
      (m) => m.studentId === studentObj.id,
    );
    const uniqueStudentSubjects = [
      ...new Set(studentScores.map((m) => m.subject)),
    ];

    let grandTotalMax = 0;
    let grandTotalObt = 0;
    let crossRoundFailFlag = false;

    const rows = uniqueStudentSubjects.map((sub) => {
      const roundScoresMap = {};
      let totalMaxSubject = 0;
      let totalObtSubject = 0;

      selectedRounds.forEach((r) => {
        const roundNum = Number(r.replace("R", ""));
        const matchEntry = studentScores.find(
          (m) => m.subject === sub && Number(m.round) === roundNum,
        );
        if (matchEntry) {
          roundScoresMap[r] = matchEntry.obtainedMarks;
          totalMaxSubject += matchEntry.totalMarks;
          totalObtSubject += matchEntry.obtainedMarks;
        } else {
          roundScoresMap[r] = "—";
        }
      });

      grandTotalMax += totalMaxSubject;
      grandTotalObt += totalObtSubject;

      const subPercentage =
        totalMaxSubject > 0 ? (totalObtSubject / totalMaxSubject) * 100 : 0;
      const subjectStatus = subPercentage >= 40 ? "PASS" : "FAIL";
      if (subjectStatus === "FAIL") crossRoundFailFlag = true;

      return {
        subjectName: sub,
        rounds: roundScoresMap,
        totalMax: totalMaxSubject,
        totalObt: totalObtSubject,
        status: subjectStatus,
      };
    });

    const perc =
      grandTotalMax > 0
        ? ((grandTotalObt / grandTotalMax) * 100).toFixed(1)
        : 0;
    const status =
      Number(perc) >= 40 && !crossRoundFailFlag && grandTotalMax > 0
        ? "PASS"
        : "FAIL";

    return { rows, grandTotalMax, grandTotalObt, perc, status };
  };

  const getBatchAnalysisDataset = () => {
    const currentClassList = students.filter(
      (s) => s.class === adminSelectedClass,
    );
    return currentClassList
      .map((student) => {
        const metrics = getSingleStudentMetrics(student);
        return { student, ...metrics };
      })
      .filter((p) => p.grandTotalMax > 0);
  };

  const getBulkFilteredStudentsBySequence = () => {
    const currentClassList = students.filter(
      (s) => s.class === adminSelectedClass,
    );
    if (!sequenceInput.trim())
      return currentClassList
        .map((student) => ({ student, ...getSingleStudentMetrics(student) }))
        .filter((p) => p.grandTotalMax > 0);

    const parts = sequenceInput.split(",");
    const allowedRollNumbers = new Set();

    parts.forEach((part) => {
      const rangeParts = part.trim().split("-");
      if (rangeParts.length === 2) {
        const start = Number(rangeParts[0]);
        const end = Number(rangeParts[1]);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) allowedRollNumbers.add(String(i));
        }
      } else {
        const singleNum = rangeParts[0].trim();
        if (singleNum) allowedRollNumbers.add(singleNum);
      }
    });

    return currentClassList
      .filter((s) => allowedRollNumbers.has(String(s.rollNo)))
      .map((student) => ({ student, ...getSingleStudentMetrics(student) }))
      .filter((p) => p.grandTotalMax > 0);
  };

  const bulkStudentsList =
    activeReportMode === "bulk" ? getBulkFilteredStudentsBySequence() : [];

  const positionHolders = getBatchAnalysisDataset()
    .sort((a, b) => Number(b.perc) - Number(a.perc))
    .slice(0, 3);

  const classSummary = (() => {
    const dataset = getBatchAnalysisDataset();
    const totalCount = dataset.length;
    const passedCount = dataset.filter((p) => p.status === "PASS").length;
    const failedCount = totalCount - passedCount;
    const classPassingRate =
      totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) : 0;
    return {
      totalCount,
      passedCount,
      failedCount,
      classPassingRate,
      honoursList: dataset.filter((p) => Number(p.perc) >= 80),
      firstDivList: dataset.filter(
        (p) => Number(p.perc) >= 60 && Number(p.perc) < 80,
      ),
      regularPassedList: dataset.filter((p) => Number(p.perc) < 60),
    };
  })();

  const gazetteRecords = getBatchAnalysisDataset().sort(
    (a, b) => Number(a.student.rollNo) - Number(b.student.rollNo),
  );
  const reportCard = getSingleStudentMetrics(activeStudent);

  const renderMasterHeader = (reportTitleText) => (
    <div className="w-full flex flex-col mb-6">
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-0.5 border border-slate-200 shrink-0">
          <img
            src={academyLogo}
            alt="Academy Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-center flex-1 px-4">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Al Razi Academy
          </h2>
          <p className="text-[11px] italic font-semibold text-slate-600 tracking-wider">
            Excellence lies in determination
          </p>
          <p className="text-[9px] font-medium text-slate-400 mt-0.5">
            122 FAZAL BLOCK ITTEFAQ TOWN, MANSOORAH, MULTAN ROAD, LAHORE.
            03094040218
          </p>
        </div>
        <div className="w-16 h-16 opacity-0 shrink-0" />
      </div>
      {reportTitleText && (
        <div className="text-center mt-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white inline-block px-4 py-0.5 rounded-sm shadow-sm">
            {reportTitleText}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans antialiased flex h-screen overflow-hidden">
      {/* ===================== PRINT CSS — FIXED ===================== */}
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          body, html, #root {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Taki bulk pages cut na hon (Tailwind classes override) */
          .min-h-screen { min-height: 0 !important; }
          .h-screen { height: auto !important; }
          .overflow-hidden { overflow: visible !important; }

          /* Sidebar, header, buttons sab hide */
          aside, header, .no-print, button {
            display: none !important;
          }

          /* Main wrapper — flex hatao, block karo */
          .main-canvas-wrapper {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
          }

          /* main element override */
          main {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Bulk wrapper — flex se block otherwise page-break kaam nahi karta */
          .bulk-print-wrapper {
            display: block !important;
            width: 100% !important;
          }

          /* Har ek print-area = ek perfect A4 page, 
             display:flex with flex-col rakha gaya hai taa kay bottom elements neechay hi rahain! */
          .print-area {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 15mm !important;
            margin: 0 auto !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      {/* LEFT SIDEBAR */}
      {showLeftSidebar && (
        <aside className="w-64 bg-[#1e3a8a] text-white flex flex-col justify-between shrink-0 h-full shadow-xl no-print">
          <div>
            <div className="p-4 bg-[#162e72] flex items-center justify-between border-b border-blue-900/40 relative">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-300" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Student Database
                </span>
              </div>
              <button
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className="p-1 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              {showPlusMenu && (
                <div className="absolute right-4 top-14 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 py-1.5 w-44 z-50">
                  <button
                    onClick={() => {
                      setIsSingleModalOpen(true);
                      setShowPlusMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold hover:bg-slate-50 text-left"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Add Single Student</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsBulkModalOpen(true);
                      setShowPlusMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold hover:bg-slate-50 text-left border-t border-slate-100"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add Bulk Students</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search class students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 text-slate-800 text-xs py-2 pl-9 pr-4 rounded-lg outline-none font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider mt-3 px-1">
                {filteredStudents.length} Students ({adminSelectedClass})
              </p>
            </div>

            <div className="overflow-y-auto px-3 space-y-1.5 max-h-[calc(100vh-140px)] custom-scrollbar">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-blue-200/60 italic text-center pt-8">
                  No records in this class
                </p>
              ) : (
                filteredStudents.map((student) => {
                  const isCurrentActive =
                    activeReportMode === "single" &&
                    activeStudent &&
                    activeStudent.id === student.id;
                  return (
                    <div
                      key={student.id}
                      onClick={() => {
                        setActiveStudent(student);
                        setActiveReportMode("single");
                      }}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition-all border ${isCurrentActive ? "bg-white text-slate-900 border-white shadow-md font-bold scale-[1.01]" : "bg-white/5 text-slate-200 border-transparent hover:bg-white/10"}`}
                    >
                      <span className="text-xs tracking-wide truncate">
                        {student.firstName} {student.lastName}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ml-2 ${isCurrentActive ? "bg-[#1e3a8a] text-white" : "bg-white/10 text-slate-300"}`}
                      >
                        {student.rollNo}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      )}

      {/* MAIN CANVAS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden main-canvas-wrapper">
        <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between shadow-sm shrink-0 no-print">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="text-slate-600 hover:text-slate-950 p-1.5 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold tracking-widest text-slate-800 uppercase">
              Al Razi Academy Admin
            </h2>
          </div>
          <div className="flex items-center space-x-4 text-slate-500">
            <button
              onClick={() => setIsDbChoiceOpen(true)}
              className="hover:text-slate-800"
            >
              <Database className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/")}
              className="hover:text-slate-800"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="hover:text-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="hover:text-slate-955 p-1"
            >
              <Sidebar className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 bg-slate-50 flex flex-col items-center justify-start p-8 overflow-y-auto custom-scrollbar">
          {/* 1. SINGLE TRANSCRIPT MODE */}
          {activeReportMode === "single" && activeStudent && (
            <div className="bg-white w-[210mm] min-h-[297mm] p-10 border border-slate-200 shadow-xl rounded-sm print-area flex flex-col justify-between text-slate-800 select-text">
              <div>
                {renderMasterHeader()}
                <div className="border border-slate-900 grid grid-cols-4 text-xs font-bold bg-slate-50 text-slate-700 divide-x divide-slate-900 mb-6">
                  <div className="p-2.5">
                    NAME:{" "}
                    <span className="font-black text-slate-900 uppercase truncate">
                      {activeStudent.firstName} {activeStudent.lastName}
                    </span>
                  </div>
                  <div className="p-2.5">
                    ROLL#:{" "}
                    <span className="font-mono font-black text-slate-900">
                      {activeStudent.rollNo}
                    </span>
                  </div>
                  <div className="p-2.5">
                    CLASS:{" "}
                    <span className="font-black text-slate-900 uppercase">
                      {activeStudent.class}
                    </span>
                  </div>
                  <div className="p-2.5 truncate">
                    ROUNDS:{" "}
                    <span className="font-mono font-black text-slate-900">
                      {selectedRounds.map((r) => r.replace("R", "")).join(", ")}
                    </span>
                  </div>
                </div>
                <table className="w-full border border-slate-900 text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-800 uppercase border-b border-slate-900">
                      <th className="p-3 border-r border-slate-900 text-left w-[35%]">
                        SUBJECT
                      </th>
                      {selectedRounds.map((r) => (
                        <th
                          key={r}
                          className="p-3 border-r border-slate-900 text-center font-mono w-[12%]"
                        >
                          {r}
                        </th>
                      ))}
                      <th className="p-3 border-r border-slate-900 text-center w-[12%]">
                        TOTAL
                      </th>
                      <th className="p-3 border-r border-slate-900 text-center w-[12%]">
                        OBT.
                      </th>
                      <th className="p-3 text-center w-[15%]">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-medium text-slate-700">
                    {reportCard.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={selectedRounds.length + 4}
                          className="p-8 text-center text-slate-400 italic bg-slate-50/50"
                        >
                          No record of this student exists in the database.
                        </td>
                      </tr>
                    ) : (
                      reportCard.rows.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-900">
                          <td className="p-3 border-r border-slate-900 font-bold uppercase">
                            {row.subjectName}
                          </td>
                          {selectedRounds.map((r) => (
                            <td
                              key={r}
                              className="p-3 border-r border-slate-900 text-center font-mono font-bold text-slate-800"
                            >
                              {row.rounds[r]}
                            </td>
                          ))}
                          <td className="p-3 border-r border-slate-900 text-center font-bold text-slate-500">
                            {row.totalMax}
                          </td>
                          <td className="p-3 border-r border-slate-900 text-center font-black text-slate-900 text-sm">
                            {row.totalObt}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-black text-[10px] ${row.status === "PASS" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-slate-50 font-black border-t-2 border-slate-900 text-slate-900">
                      <td className="p-3 border-r border-slate-900">
                        GRAND TOTAL
                      </td>
                      {selectedRounds.map((r) => (
                        <td
                          key={r}
                          className="p-3 border-r border-slate-900 bg-slate-100/40"
                        />
                      ))}
                      <td className="p-3 border-r border-slate-900 text-center text-slate-500">
                        {reportCard.grandTotalMax}
                      </td>
                      <td className="p-3 border-r border-slate-900 text-center text-sm font-black text-blue-900">
                        {reportCard.grandTotalObt}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-3 py-1 rounded font-black text-xs ${reportCard.status === "PASS" ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {reportCard.status} ({reportCard.perc}%)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-20 pt-6 flex items-end justify-between text-[11px] font-bold text-slate-700">
                <div className="w-48 border-b border-dotted border-slate-400 pb-1">
                  REMARKS:{" "}
                </div>
                <div className="w-44 border-t border-slate-900 text-center pt-1.5 uppercase font-black">
                  PRINCIPAL
                </div>
              </div>
            </div>
          )}

          {/* 2. BULK PRINT MODE — bulk-print-wrapper class added for print fix */}
          {activeReportMode === "bulk" && (
            <div className="w-full flex flex-col items-center bulk-print-wrapper">
              {bulkStudentsList.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl text-center shadow-sm w-full">
                  <p className="text-slate-400 text-sm font-medium">
                    No data found.
                  </p>
                </div>
              ) : (
                bulkStudentsList.map(
                  ({
                    student,
                    rows,
                    grandTotalMax,
                    grandTotalObt,
                    perc,
                    status,
                  }) => (
                    <div
                      key={student.id}
                      className="bg-white w-[210mm] h-[297mm] p-[15mm] border border-slate-200 shadow-xl rounded-sm print-area flex flex-col justify-between text-slate-800 shrink-0"
                    >
                      <div>
                        {renderMasterHeader()}
                        <div className="border border-slate-900 grid grid-cols-4 text-[11px] font-bold bg-slate-50 text-slate-700 divide-x divide-slate-900 mb-5">
                          <div className="p-2">
                            NAME:{" "}
                            <span className="font-black text-slate-900 uppercase">
                              {student.firstName} {student.lastName}
                            </span>
                          </div>
                          <div className="p-2 text-center">
                            ROLL#:{" "}
                            <span className="font-mono font-black text-slate-900">
                              {student.rollNo}
                            </span>
                          </div>
                          <div className="p-2 text-center">
                            CLASS:{" "}
                            <span className="font-black text-slate-900 uppercase">
                              {student.class}
                            </span>
                          </div>
                          <div className="p-2 text-center">
                            ROUNDS:{" "}
                            <span className="font-mono font-black text-slate-900">
                              {selectedRounds
                                .map((r) => r.replace("R", ""))
                                .join(", ")}
                            </span>
                          </div>
                        </div>

                        <table className="w-full border border-slate-900 text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-slate-100 font-black border-b border-slate-900 uppercase">
                              <th className="p-2 border-r border-slate-900 text-left">
                                SUBJECT
                              </th>
                              {selectedRounds.map((r) => (
                                <th
                                  key={r}
                                  className="p-2 border-r border-slate-900 text-center"
                                >
                                  {r}
                                </th>
                              ))}
                              <th className="p-2 border-r border-slate-900 text-center">
                                TOTAL
                              </th>
                              <th className="p-2 border-r border-slate-900 text-center">
                                OBT.
                              </th>
                              <th className="p-2 text-center">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900 font-bold">
                            {rows.map((row, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-slate-900"
                              >
                                <td className="p-2 border-r border-slate-900 uppercase">
                                  {row.subjectName}
                                </td>
                                {selectedRounds.map((r) => (
                                  <td
                                    key={r}
                                    className="p-2 border-r border-slate-900 text-center font-mono"
                                  >
                                    {row.rounds[r]}
                                  </td>
                                ))}
                                <td className="p-2 border-r border-slate-900 text-center text-slate-400">
                                  {row.totalMax}
                                </td>
                                <td className="p-2 border-r border-slate-900 text-center">
                                  {row.totalObt}
                                </td>
                                <td className="p-2 text-center">
                                  <span
                                    className={`font-black ${row.status === "PASS" ? "text-emerald-600" : "text-rose-600"}`}
                                  >
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50 font-black border-t-2 border-slate-900 text-slate-900">
                              <td className="p-2 border-r border-slate-900">
                                GRAND TOTAL
                              </td>
                              {selectedRounds.map((r) => (
                                <td
                                  key={r}
                                  className="p-2 border-r border-slate-900 bg-slate-100/40"
                                />
                              ))}
                              <td className="p-2 border-r border-slate-900 text-center text-slate-500">
                                {grandTotalMax}
                              </td>
                              <td className="p-2 border-r border-slate-900 text-center text-blue-900">
                                {grandTotalObt}
                              </td>
                              <td className="p-2 text-center">
                                <span
                                  className={`font-black text-xs ${status === "PASS" ? "text-emerald-600" : "text-rose-600"}`}
                                >
                                  {status} ({perc}%)
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-4 flex items-end justify-between text-[10px] font-black text-slate-700">
                        <div className="w-48 border-b border-dotted border-slate-400 pb-1">
                          REMARKS:{" "}
                        </div>
                        <div className="w-44 border-t border-slate-900 text-center pt-1.5 uppercase font-black">
                          PRINCIPAL
                        </div>
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          )}

          {/* 3. TOP 3 POSITIONS */}
          {activeReportMode === "positions" && (
            <div className="bg-white w-[210mm] min-h-[297mm] p-10 border border-slate-200 shadow-xl rounded-sm print-area flex flex-col justify-between text-slate-800">
              <div>
                {renderMasterHeader(
                  `TOP 3 POSITIONS — CLASS ${adminSelectedClass}`,
                )}
                <div className="space-y-6 mt-12">
                  {positionHolders.map((item, idx) => (
                    <div
                      key={item.student.id}
                      className="border border-slate-900 rounded-xl p-5 flex items-center justify-between bg-slate-50/50"
                    >
                      <div className="flex items-center space-x-6">
                        <span
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black border-2 ${idx === 0 ? "bg-amber-100 text-amber-700 border-amber-400" : idx === 1 ? "bg-slate-100 text-slate-700 border-slate-400" : "bg-orange-100 text-orange-700 border-orange-400"}`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            {item.student.firstName} {item.student.lastName}
                          </h4>
                          <p className="text-[11px] font-semibold text-slate-500 font-mono mt-0.5">
                            Roll Number: {item.student.rollNo} | Father:{" "}
                            {item.student.fatherName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h3 className="text-xl font-black text-blue-900 font-mono">
                          {item.perc}%
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          Score: {item.grandTotalObt}/{item.grandTotalMax}
                        </p>
                      </div>
                    </div>
                  ))}
                  {positionHolders.length === 0 && (
                    <p className="text-center p-12 text-slate-400 italic">
                      Is class parameters mein koi entry trace nahi hui.
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-6 flex justify-between text-[11px] font-black tracking-wider">
                <span>
                  GENERATED DATE: {new Date().toLocaleDateString("en-GB")}
                </span>
                <span>PRINCIPAL SIGNATURE</span>
              </div>
            </div>
          )}

          {/* 4. PASS/FAIL SUMMARY */}
          {activeReportMode === "summary" && (
            <div className="bg-white w-[210mm] min-h-[297mm] p-10 border border-slate-200 shadow-xl rounded-sm print-area flex flex-col justify-between text-slate-800">
              <div>
                {renderMasterHeader(
                  `PERFORMANCE SUMMARY — CLASS ${adminSelectedClass}`,
                )}
                <div className="grid grid-cols-4 border border-slate-900 divide-x divide-slate-900 text-center font-bold text-xs bg-slate-50 mb-8 mt-6">
                  <div className="p-3">
                    TOTAL ASSESSED:{" "}
                    <span className="font-black text-slate-900 block text-lg font-mono">
                      {classSummary.totalCount}
                    </span>
                  </div>
                  <div className="p-3 text-emerald-700">
                    TOTAL PASSED:{" "}
                    <span className="font-black text-emerald-600 block text-lg font-mono">
                      {classSummary.passedCount}
                    </span>
                  </div>
                  <div className="p-3 text-rose-700">
                    TOTAL FAILED:{" "}
                    <span className="font-black text-rose-600 block text-lg font-mono">
                      {classSummary.failedCount}
                    </span>
                  </div>
                  <div className="p-3 text-blue-700">
                    CLASS PASS RATE:{" "}
                    <span className="font-black text-blue-900 block text-lg font-mono">
                      {classSummary.classPassingRate}%
                    </span>
                  </div>
                </div>
                <div className="space-y-6 text-xs">
                  <div>
                    <h4 className="font-black text-amber-700 uppercase border-b border-amber-200 pb-1 mb-2 tracking-wide">
                      🏆 High Honours List (&gt;= 80%):{" "}
                      {classSummary.honoursList.length} Students
                    </h4>
                    <div className="grid grid-cols-2 gap-2 font-mono font-bold text-slate-700">
                      {classSummary.honoursList.map((p) => (
                        <div
                          key={p.student.id}
                          className="bg-slate-50 p-1.5 border border-slate-200 rounded"
                        >
                          {p.student.rollNo} - {p.student.firstName} ({p.perc}%)
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-blue-700 uppercase border-b border-blue-200 pb-1 mb-2 tracking-wide">
                      ⭐ First Division Rank (&gt;= 60% &amp; &lt; 80%):{" "}
                      {classSummary.firstDivList.length} Students
                    </h4>
                    <div className="grid grid-cols-2 gap-2 font-mono font-bold text-slate-700">
                      {classSummary.firstDivList.map((p) => (
                        <div
                          key={p.student.id}
                          className="bg-slate-50 p-1.5 border border-slate-200 rounded"
                        >
                          {p.student.rollNo} - {p.student.firstName} ({p.perc}%)
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-500 uppercase border-b border-slate-200 pb-1 mb-2 tracking-wide">
                      Regular Clearance / Remedials (&lt; 60%):{" "}
                      {classSummary.regularPassedList.length} Students
                    </h4>
                    <div className="grid grid-cols-2 gap-2 font-mono font-bold text-slate-600">
                      {classSummary.regularPassedList.map((p) => (
                        <div
                          key={p.student.id}
                          className="bg-slate-50 p-1.5 border border-slate-200 rounded"
                        >
                          {p.student.rollNo} - {p.student.firstName} ({p.perc}%)
                          - {p.status}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-200 flex justify-between text-[11px] font-black">
                <span>CLASS TEACHER SIGNATURE</span>
                <span>PRINCIPAL SIGNATURE</span>
              </div>
            </div>
          )}

          {/* 5. GAZETTE */}
          {activeReportMode === "gazette" && (
            <div className="bg-white w-[210mm] min-h-[297mm] p-10 border border-slate-200 shadow-xl rounded-sm print-area flex flex-col justify-between text-slate-800">
              <div>
                {renderMasterHeader(
                  `OFFICIAL TERM GAZETTE REGISTER | CLASS ${adminSelectedClass}`,
                )}
                <table className="w-full border border-slate-900 text-[11px] border-collapse mt-6">
                  <thead>
                    <tr className="bg-slate-100 font-black border-b border-slate-900 uppercase">
                      <th className="p-2 border-r border-slate-900 text-center w-[12%]">
                        ROLL NO
                      </th>
                      <th className="p-2 border-r border-slate-900 text-left w-[40%]">
                        STUDENT NAME
                      </th>
                      <th className="p-2 border-r border-slate-900 text-center w-[12%]">
                        TOTAL
                      </th>
                      <th className="p-2 border-r border-slate-900 text-center w-[12%]">
                        OBTAINED
                      </th>
                      <th className="p-2 border-r border-slate-900 text-center w-[12%]">
                        PERC (%)
                      </th>
                      <th className="p-2 text-center w-[12%]">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-medium font-mono text-slate-700">
                    {gazetteRecords.map((item) => (
                      <tr
                        key={item.student.id}
                        className="border-b border-slate-900"
                      >
                        <td className="p-2 border-r border-slate-900 text-center font-bold text-slate-900">
                          {item.student.rollNo}
                        </td>
                        <td className="p-2 border-r border-slate-900 font-sans font-bold uppercase text-slate-800">
                          {item.student.firstName} {item.student.lastName}
                        </td>
                        <td className="p-2 border-r border-slate-900 text-center text-slate-400 font-bold">
                          {item.grandTotalMax}
                        </td>
                        <td className="p-2 border-r border-slate-900 text-center font-black text-slate-900">
                          {item.grandTotalObt}
                        </td>
                        <td className="p-2 border-r border-slate-900 text-center text-blue-700 font-bold">
                          {item.perc}%
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`font-black uppercase text-[10px] ${item.status === "PASS" ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {gazetteRecords.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-8 text-center text-slate-400 font-sans italic bg-slate-50"
                        >
                          Is class filters ledger data entry khali hai.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="pt-4 text-right text-[10px] font-black uppercase tracking-wider">
                Principal Signature
              </div>
            </div>
          )}
        </main>
      </div>

      {/* RIGHT SIDEBAR */}
      {showRightSidebar && (
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-lg no-print">
          <div className="bg-[#22c55e] text-white p-3.5 flex items-center justify-end space-x-2 shadow-sm shrink-0">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase">
              Reporting Panel
            </span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-5">
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold tracking-wider text-blue-900 uppercase">
                  Parameters
                </h3>
                <button
                  onClick={() => setIsDbChoiceOpen(true)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={adminSelectedClass}
                onChange={(e) => setAdminSelectedClass(e.target.value)}
                className="w-full bg-white text-slate-700 font-semibold py-2.5 px-3 rounded-xl border border-slate-200 shadow-sm focus:outline-none text-sm cursor-pointer"
              >
                {classesList.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-4 gap-1.5">
                {roundsList.map((r, i) => {
                  const isActive = selectedRounds.includes(r);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleRound(r)}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${isActive ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md" : "bg-slate-200/50 text-slate-400 border-transparent hover:bg-slate-200"}`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2">
              <h3 className="text-[11px] font-bold tracking-wider text-blue-900 uppercase">
                Roll No Range
              </h3>
              <p className="text-[11px] text-emerald-600 font-bold font-mono tracking-wide">
                Class Range: {getActiveRollNoRange()}
              </p>
              <input
                type="text"
                placeholder="Ex: 901-915, 920"
                value={sequenceInput}
                onChange={(e) => setSequenceInput(e.target.value)}
                className="w-full bg-white text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200 text-xs outline-none shadow-sm font-medium"
              />
            </div>

            <div className="space-y-2.5 pt-2 border-b border-slate-100 pb-4">
              <button
                onClick={() => setActiveReportMode("bulk")}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer ${activeReportMode === "bulk" ? "bg-blue-900 text-white" : "bg-[#1e3a8a] text-white hover:bg-blue-800"}`}
              >
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4" />
                  <span>Print Bulk Results</span>
                </div>
              </button>
              <button
                onClick={() => setActiveReportMode("positions")}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer ${activeReportMode === "positions" ? "bg-amber-600 text-white" : "bg-[#f59e0b] text-white hover:bg-amber-600"}`}
              >
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>Top 3 Positions</span>
                </div>
              </button>
              <button
                onClick={() => setActiveReportMode("summary")}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer ${activeReportMode === "summary" ? "bg-purple-800 text-white" : "bg-[#a855f7] text-white hover:bg-purple-600"}`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Pass/Fail Summary</span>
                </div>
              </button>
              <button
                onClick={() => setActiveReportMode("gazette")}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer ${activeReportMode === "gazette" ? "bg-slate-900 text-white" : "bg-[#0f172a] text-white hover:bg-slate-800"}`}
              >
                <div className="flex items-center space-x-2">
                  <ClipboardList className="w-4 h-4" />
                  <span>Class Gazette</span>
                </div>
              </button>
            </div>

            <div className="pt-1.5">
              <button
                onClick={handleTriggerPrint}
                className="w-full flex items-center justify-center space-x-2 bg-[#22c55e] hover:bg-[#1ca84f] text-white py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Send to Printer</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* DATABASE MODAL */}
      {isDbChoiceOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 relative">
            <button
              onClick={() => setIsDbChoiceOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6 mt-2">
              <Database className="w-10 h-10 text-[#1e3a8a] mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide">
                Select Central Database
              </h3>
              <p className="text-xs text-slate-400">
                Choose which core records library you want to manage
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  setIsDbChoiceOpen(false);
                  navigate("/admin-panel/students-database");
                }}
                className="w-full flex items-center space-x-4 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/60 hover:border-blue-300 p-4 rounded-2xl transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-[#1e3a8a] text-white rounded-xl group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    Students Database
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    View, edit, filter, delete, or search student records.
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsDbChoiceOpen(false);
                  navigate("/admin-panel/marks-database");
                }}
                className="w-full flex items-center space-x-4 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/60 hover:border-emerald-300 p-4 rounded-2xl transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-[#22c55e] text-white rounded-xl group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    Marks Database
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Manage student terms, marks entries, and transcripts sheet.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SINGLE STUDENT */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-[#1e3a8a] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <UserPlus className="w-4 h-4" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  Add Single Student
                </h3>
              </div>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="text-white/70 hover:text-white p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSingleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <User className="w-3 h-3 inline mr-1" /> First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="e.g. Laiba"
                    required
                    className="w-full bg-slate-100 text-slate-700 text-sm py-2 px-3.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="e.g. Batool"
                    className="w-full bg-slate-100 text-slate-700 text-sm py-2 px-3.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Father's Name
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  placeholder="Enter father's full name"
                  required
                  className="w-full bg-slate-100 text-slate-700 text-sm py-2 px-3.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <Phone className="w-3 h-3 inline mr-1" /> Father Phone No.
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 03001234567"
                    required
                    className="w-full bg-slate-100 text-slate-700 text-sm py-2 px-3.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <Calendar className="w-3 h-3 inline mr-1" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-100 text-slate-700 text-sm py-2 px-3.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Select Class
                  </label>
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-100 text-slate-700 font-semibold text-sm py-2 px-3.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="" disabled hidden>
                      Choose...
                    </option>
                    {classesList.map((c, i) => (
                      <option key={i} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Assigned Roll No.
                  </label>
                  <div
                    className={`w-full text-sm py-2 px-3.5 rounded-xl font-mono font-bold border flex items-center justify-between ${calculatedRollNo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-400 border-transparent"}`}
                  >
                    <span>{calculatedRollNo || "Select Class first"}</span>
                    {calculatedRollNo && (
                      <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-sans uppercase font-bold">
                        Auto
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 font-semibold text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1e3a8a] text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK UPLOAD */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#1e3a8a] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  Bulk Students Import Workspace
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkParsedData([]);
                  setFileName("");
                }}
                className="text-white/70 hover:text-white p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#1e3a8a] uppercase tracking-wider">
                  Required Excel Format Preview:
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Top headers bilkul is tarah rakhein. Roll numbers auto allot
                  ho jayenge.
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-200/70 text-slate-700 font-bold border-b border-slate-300">
                        <th className="p-2 border-r border-slate-200">
                          FirstName
                        </th>
                        <th className="p-2 border-r border-slate-200">
                          LastName
                        </th>
                        <th className="p-2 border-r border-slate-200">
                          FatherName
                        </th>
                        <th className="p-2 border-r border-slate-200">
                          FatherPhone
                        </th>
                        <th className="p-2 border-r border-slate-200">DOB</th>
                        <th className="p-2">Class</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-500 font-medium">
                      <tr className="border-b border-slate-200">
                        <td className="p-2 border-r border-slate-200 bg-white">
                          Zainab
                        </td>
                        <td className="p-2 border-r border-slate-200 bg-white">
                          Ali
                        </td>
                        <td className="p-2 border-r border-slate-200 bg-white">
                          Muhammad Ali
                        </td>
                        <td className="p-2 border-r border-slate-200 bg-white">
                          03217654321
                        </td>
                        <td className="p-2 border-r border-slate-200 bg-white">
                          2009-04-14
                        </td>
                        <td className="p-2 bg-white font-bold text-blue-800">
                          9th
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50 relative transition-all group">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
                <p className="text-xs font-bold text-slate-700">
                  {fileName || "Click or Drag Excel File Here"}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Supports Standard .xlsx format
                </p>
              </div>
              {bulkParsedData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Loaded Rows Preview ({bulkParsedData.length}):
                    </h4>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 shadow-sm">
                        <tr className="text-slate-600 font-bold">
                          <th className="p-2">Name</th>
                          <th className="p-2">Father Name</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Class</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600 font-medium divide-y divide-slate-100 bg-white">
                        {bulkParsedData.map((row, index) => (
                          <tr key={index}>
                            <td className="p-2 font-semibold">
                              {row.FirstName || row.firstName || ""}{" "}
                              {row.LastName || row.lastName || ""}
                            </td>
                            <td className="p-2">
                              {row.FatherName || row.fatherName || "—"}
                            </td>
                            <td className="p-2 font-mono">
                              {row.FatherPhone || row.fatherPhone || "—"}
                            </td>
                            <td className="p-2 font-bold text-blue-700">
                              {row.Class || row.class || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkParsedData([]);
                  setFileName("");
                }}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              {bulkParsedData.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkSaveToDatabase}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all"
                >
                  Add to Database
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
