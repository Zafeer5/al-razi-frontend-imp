import React, { useState, useEffect, useMemo } from "react";
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
  CheckSquare,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";
import academyLogo from "../assets/logo ac.jpg";

// Exact standard spellings
const OFFICIAL_SUBJECT_NAMES = [
  "Accounting",
  "Agriculture",
  "Arabic",
  "Banking",
  "Biology",
  "Business Math",
  "Business Statistics",
  "Chemistry",
  "Civics",
  "Clothing & Textile",
  "Commercial Geography",
  "Computer",
  "Computer-Tech",
  "Economics",
  "Education",
  "English",
  "Ethics",
  "Food & Nutrition",
  "General Math",
  "General Science",
  "Geography",
  "Health & Physical Education",
  "History",
  "Home Economics",
  "ICT-Tech",
  "Islamiyat (Compulsory)",
  "Islamiyat (Elective)",
  "Library Science",
  "Math",
  "Pakistan Studies",
  "Persian",
  "Physics",
  "Principles of Commerce",
  "Psychology",
  "Punjabi",
  "Statistics",
  "Tarjuma-tul-Quran",
  "Urdu",
];

const normalizeSubjectName = (name) => {
  if (!name) return "";
  const cleaned = name.trim().toLowerCase();

  if (cleaned === "math" || cleaned === "mathematics") return "Math";
  if (cleaned === "bio" || cleaned === "biology") return "Biology";
  if (cleaned === "computer" || cleaned === "computer science" || cleaned === "comp") return "Computer";
  if (cleaned === "urdu") return "Urdu";
  if (cleaned === "english" || cleaned === "eng") return "English";
  if (cleaned === "physics" || cleaned === "phy") return "Physics";
  if (cleaned === "chemistry" || cleaned === "chem") return "Chemistry";
  if (cleaned === "civics") return "Civics";
  if (cleaned === "education" || cleaned === "edu") return "Education";
  if (cleaned === "ethics") return "Ethics";
  if (cleaned === "gen. sci" || cleaned === "gen sci" || cleaned === "general science") return "General Science";
  if (cleaned === "pak study" || cleaned === "pak studies" || cleaned === "pakistan studies") return "Pakistan Studies";
  if (
    cleaned === "quran" ||
    cleaned === "tarjuma-tul-quran" ||
    cleaned === "tarjumatul quran" ||
    cleaned === "tarjuma tul quran"
  )
    return "Tarjuma-tul-Quran";
  if (
    cleaned === "isl. elective" ||
    cleaned === "islamiyat elective" ||
    cleaned === "islamiyat (elective)"
  )
    return "Islamiyat (Elective)";
  if (
    cleaned === "islamiyat" ||
    cleaned === "islamiyat compulsory" ||
    cleaned === "islamiyat (compulsory)" ||
    cleaned === "islamiat"
  )
    return "Islamiyat (Compulsory)";

  const matched = OFFICIAL_SUBJECT_NAMES.find(
    (item) => item.toLowerCase() === cleaned
  );
  return matched || name.trim();
};

const CLASS_SUBJECT_GROUPS = {
  "9th": [
    ["Urdu"],
    ["Chemistry", "Education"],
    ["Computer", "Biology", "Civics", "Islamiyat (Elective)"],
    ["Physics", "General Science"],
    ["English"],
    ["Islamiyat (Compulsory)", "Pakistan Studies"],
    ["Tarjuma-tul-Quran", "Ethics"],
    ["Math"],
  ],
  "10th": [
    ["Urdu"],
    ["Chemistry", "Education"],
    ["Computer", "Biology", "Civics", "Islamiyat (Elective)"],
    ["Physics", "General Science"],
    ["English"],
    ["Islamiyat (Compulsory)", "Pakistan Studies"],
    ["Tarjuma-tul-Quran", "Ethics"],
    ["Math"],
  ],
  "11th": [
    ["Computer", "Chemistry", "Islamiyat (Elective)"],
    ["Islamiyat (Compulsory)", "Pakistan Studies"],
    ["Urdu"],
    ["Math", "Biology", "Education"],
    ["English"],
    ["Physics", "Civics"],
    ["Tarjuma-tul-Quran", "Ethics"],
  ],
  "12th": [
    ["Computer", "Chemistry", "Islamiyat (Elective)"],
    ["Islamiyat (Compulsory)", "Pakistan Studies"],
    ["Urdu"],
    ["Math", "Biology", "Education"],
    ["English"],
    ["Physics", "Civics"],
    ["Tarjuma-tul-Quran", "Ethics"],
  ],
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [adminSelectedClass, setAdminSelectedClass] = useState("9th");
  const [selectedRounds, setSelectedRounds] = useState(["R1", "R2", "R3"]);
  const [searchQuery, setSearchQuery] = useState("");

  const [globalGrandTotal, setGlobalGrandTotal] = useState("");

  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDbChoiceOpen, setIsDbChoiceOpen] = useState(false);

  const [activeStudent, setActiveStudent] = useState(null);
  const [sequenceInput, setSequenceInput] = useState("");
  const [activeReportMode, setActiveReportMode] = useState("single");

  const [students, setStudents] = useState([]);
  const [globalMarks, setGlobalMarks] = useState([]);

  // ================= SUBJECT CHECKLIST PANEL STATES =================
  const [subjectPanelClass, setSubjectPanelClass] = useState("9th");
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");

  const [classExtraSubjects, setClassExtraSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem("alrazi_class_subjects_v3");
      return saved
        ? JSON.parse(saved)
        : { "9th": [], "10th": [], "11th": [], "12th": [] };
    } catch {
      return { "9th": [], "10th": [], "11th": [], "12th": [] };
    }
  });

  // ================= TEMPORARY IN-MEMORY CARD EDITS =================
  // Reset on student change or page refresh
  const [editableCardRows, setEditableCardRows] = useState([]);

  useEffect(() => {
    setSubjectPanelClass(adminSelectedClass);
  }, [adminSelectedClass]);

  useEffect(() => {
    try {
      localStorage.setItem("alrazi_class_subjects_v3", JSON.stringify(classExtraSubjects));
    } catch (err) {
      console.error("Local storage sync error:", err);
    }
  }, [classExtraSubjects]);

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

  const currentClassChecklistSubjects = useMemo(() => {
    const classGroups = CLASS_SUBJECT_GROUPS[subjectPanelClass] || [];
    const baseSubjects = classGroups.flat();

    const classStudentIds = new Set(
      students.filter((s) => s.class === subjectPanelClass).map((s) => s.id)
    );
    const fromMarks = globalMarks
      .filter((m) => classStudentIds.has(m.studentId))
      .map((m) => normalizeSubjectName(m.subject))
      .filter(Boolean);

    const extraSaved = classExtraSubjects[subjectPanelClass] || [];

    const set = new Set([...baseSubjects, ...fromMarks, ...extraSaved]);
    return Array.from(set);
  }, [subjectPanelClass, students, globalMarks, classExtraSubjects]);

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

    const finalFatherName = formData.fatherName.trim() || "NA";
    const finalPhone = formData.phone.trim() || "NA";
    const finalDob = formData.dob.trim() || "2000-01-01";

    const newStudent = {
      id: "STUD-" + Date.now(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      fatherName: finalFatherName,
      phone: finalPhone,
      dob: finalDob,
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
        alert("✅ Student Saved Successfully!");
      } else {
        const errorData = await response.json();
        console.error("Backend Reject Error:", errorData);
        alert(
          "❌ Error: " +
            (errorData.message || "Database ne data reject kar diya"),
        );
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("❌ Server connection failed! Kya backend chal raha hai?");
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

      const rawFather = row.FatherName || row.fatherName || "";
      const rawPhone = row.FatherPhone || row.fatherPhone || "";
      const rawDob = row.DOB || row.dob || "";

      const newStud = {
        id: `BULK-${Date.now()}-${index}`,
        firstName: String(row.FirstName || row.firstName || "Unknown").trim(),
        lastName: String(row.LastName || row.lastName || "").trim(),
        fatherName: String(rawFather).trim() || "NA",
        phone: String(rawPhone).trim() || "NA",
        dob: String(rawDob).trim() || "2000-01-01",
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

  const handleToggleSubjectForClass = (subjectName, targetClass) => {
    const standardName = normalizeSubjectName(subjectName);
    setClassExtraSubjects((prev) => {
      const currentList = prev[targetClass] || [];
      if (currentList.includes(standardName)) {
        return {
          ...prev,
          [targetClass]: currentList.filter((s) => s !== standardName),
        };
      } else {
        return {
          ...prev,
          [targetClass]: [...currentList, standardName],
        };
      }
    });
  };

  // Generate initial rows for student report based on database records & checklist
  const generateInitialStudentRows = (studentObj) => {
    if (!studentObj) return [];
    const studentScores = globalMarks.filter((m) => m.studentId === studentObj.id);
    const studentDbSubjects = studentScores.map((m) => normalizeSubjectName(m.subject));
    const extraForClass = classExtraSubjects[studentObj.class] || [];
    const activeClassSubjects = new Set([...studentDbSubjects, ...extraForClass]);

    const predefinedGroups = CLASS_SUBJECT_GROUPS[studentObj.class] || [];
    const groupedRowsConfig = [];
    const handledSubjects = new Set();

    predefinedGroups.forEach((group) => {
      const activeInGroup = group.filter((sub) => activeClassSubjects.has(sub));
      if (activeInGroup.length > 0) {
        groupedRowsConfig.push({
          displayName: activeInGroup.join(" / "),
          subjectsInGroup: activeInGroup,
        });
        activeInGroup.forEach((sub) => handledSubjects.add(sub));
      }
    });

    activeClassSubjects.forEach((sub) => {
      if (!handledSubjects.has(sub)) {
        groupedRowsConfig.push({
          displayName: sub,
          subjectsInGroup: [sub],
        });
      }
    });

    return groupedRowsConfig.map(({ displayName, subjectsInGroup }, idx) => {
      const roundScoresMap = {};
      const roundMaxMap = {};

      selectedRounds.forEach((r) => {
        const roundNum = Number(r.replace("R", ""));
        let matchedScore = null;

        for (const sub of subjectsInGroup) {
          const entry = studentScores.find(
            (m) => normalizeSubjectName(m.subject) === sub && Number(m.round) === roundNum
          );
          if (entry) {
            matchedScore = entry;
            break;
          }
        }

        if (matchedScore) {
          roundScoresMap[r] = String(matchedScore.obtainedMarks);
          roundMaxMap[r] = matchedScore.totalMarks || 30;
        } else {
          roundScoresMap[r] = "—";
          roundMaxMap[r] = 30;
        }
      });

      return {
        id: `row-${idx}-${Date.now()}`,
        subjectName: displayName,
        rounds: roundScoresMap,
        roundMaxMap: roundMaxMap,
      };
    });
  };

  // Whenever activeStudent, rounds, or class extra subjects update, re-initialize editableCardRows
  useEffect(() => {
    if (activeStudent) {
      setEditableCardRows(generateInitialStudentRows(activeStudent));
    } else {
      setEditableCardRows([]);
    }
  }, [activeStudent, selectedRounds, classExtraSubjects]);

  // Handle in-place editing of card table cells
  const handleCellSubjectChange = (rowIndex, value) => {
    setEditableCardRows((prev) => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex], subjectName: value };
      return copy;
    });
  };

  const handleCellRoundChange = (rowIndex, roundKey, value) => {
    setEditableCardRows((prev) => {
      const copy = [...prev];
      const updatedRounds = { ...copy[rowIndex].rounds, [roundKey]: value };
      copy[rowIndex] = { ...copy[rowIndex], rounds: updatedRounds };
      return copy;
    });
  };

  // Add a new empty row to the card
  const handleAddNewRow = () => {
    const emptyRounds = {};
    const defaultMaxMap = {};
    selectedRounds.forEach((r) => {
      emptyRounds[r] = "—";
      defaultMaxMap[r] = 30;
    });

    setEditableCardRows((prev) => [
      ...prev,
      {
        id: `custom-row-${Date.now()}`,
        subjectName: "NEW SUBJECT",
        rounds: emptyRounds,
        roundMaxMap: defaultMaxMap,
      },
    ]);
  };

  // Remove a row
  const handleDeleteRow = (rowIndex) => {
    setEditableCardRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  // Dynamic calculations on the editable rows
  const activeReportCardCalculations = useMemo(() => {
    let grandTotalMax = 0;
    let grandTotalObt = 0;
    let failedSubjectsCount = 0;

    const computedRows = editableCardRows.map((row) => {
      let subjectMax = 0;
      let subjectObt = 0;
      let hasValidScore = false;

      selectedRounds.forEach((r) => {
        const val = row.rounds[r];
        const numVal = parseFloat(val);
        const maxForRound = row.roundMaxMap?.[r] || 30;

        if (!isNaN(numVal) && val !== "—" && val !== "") {
          hasValidScore = true;
          subjectObt += numVal;
          subjectMax += maxForRound;
        }
      });

      grandTotalMax += subjectMax;
      grandTotalObt += subjectObt;

      const subPercentage = subjectMax > 0 ? (subjectObt / subjectMax) * 100 : 0;
      const status = subjectMax === 0 ? "—" : subPercentage >= 40 ? "PASS" : "FAIL";

      if (status === "FAIL") {
        failedSubjectsCount += 1;
      }

      return {
        ...row,
        totalMax: subjectMax,
        totalObt: subjectObt,
        status,
        hasValidScore,
      };
    });

    const appliedGrandTotalMax =
      globalGrandTotal.toString().trim() !== "" && !isNaN(Number(globalGrandTotal))
        ? Number(globalGrandTotal)
        : grandTotalMax;

    const perc =
      appliedGrandTotalMax > 0
        ? ((grandTotalObt / appliedGrandTotalMax) * 100).toFixed(1)
        : 0;

    const evaluatedCount = computedRows.filter((r) => r.totalMax > 0).length;
    const isFailedInMajority =
      evaluatedCount > 0 && failedSubjectsCount >= evaluatedCount / 2;

    const overallStatus =
      Number(perc) >= 40 && !isFailedInMajority && appliedGrandTotalMax > 0
        ? "PASS"
        : "FAIL";

    return {
      rows: computedRows,
      grandTotalMax: appliedGrandTotalMax,
      grandTotalObt,
      perc,
      status: overallStatus,
      originalGrandTotalMax: grandTotalMax,
    };
  }, [editableCardRows, selectedRounds, globalGrandTotal]);

  // Bulk student computations
  const getSingleStudentMetrics = (studentObj) => {
    if (!studentObj)
      return { rows: [], grandTotalMax: 0, grandTotalObt: 0, perc: 0, status: "FAIL", originalGrandTotalMax: 0 };

    const rows = generateInitialStudentRows(studentObj);
    let grandTotalMax = 0;
    let grandTotalObt = 0;
    let failedSubjectsCount = 0;

    const computedRows = rows.map((row) => {
      let subjectMax = 0;
      let subjectObt = 0;

      selectedRounds.forEach((r) => {
        const val = row.rounds[r];
        const numVal = parseFloat(val);
        const maxForRound = row.roundMaxMap?.[r] || 30;
        if (!isNaN(numVal) && val !== "—") {
          subjectObt += numVal;
          subjectMax += maxForRound;
        }
      });

      grandTotalMax += subjectMax;
      grandTotalObt += subjectObt;

      const subPercentage = subjectMax > 0 ? (subjectObt / subjectMax) * 100 : 0;
      const status = subjectMax === 0 ? "—" : subPercentage >= 40 ? "PASS" : "FAIL";
      if (status === "FAIL") failedSubjectsCount++;

      return {
        subjectName: row.subjectName,
        rounds: row.rounds,
        totalMax: subjectMax,
        totalObt: subjectObt,
        status,
      };
    });

    const appliedGrandTotalMax =
      globalGrandTotal.toString().trim() !== "" && !isNaN(Number(globalGrandTotal))
        ? Number(globalGrandTotal)
        : grandTotalMax;

    const perc =
      appliedGrandTotalMax > 0
        ? ((grandTotalObt / appliedGrandTotalMax) * 100).toFixed(1)
        : 0;

    const evaluatedCount = computedRows.filter((r) => r.totalMax > 0).length;
    const isFailedInMajority =
      evaluatedCount > 0 && failedSubjectsCount >= evaluatedCount / 2;

    const overallStatus =
      Number(perc) >= 40 && !isFailedInMajority && appliedGrandTotalMax > 0
        ? "PASS"
        : "FAIL";

    return {
      rows: computedRows,
      grandTotalMax: appliedGrandTotalMax,
      grandTotalObt,
      perc,
      status: overallStatus,
      originalGrandTotalMax: grandTotalMax,
    };
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
      .filter((p) => p.originalGrandTotalMax > 0);
  };

  const getBulkFilteredStudentsBySequence = () => {
    const currentClassList = students.filter(
      (s) => s.class === adminSelectedClass,
    );
    if (!sequenceInput.trim())
      return currentClassList
        .map((student) => ({ student, ...getSingleStudentMetrics(student) }))
        .filter((p) => p.originalGrandTotalMax > 0);

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
      .filter((p) => p.originalGrandTotalMax > 0);
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

  const activeStudentOriginalSubjects = useMemo(() => {
    if (!activeStudent) return new Set();
    const scores = globalMarks.filter((m) => m.studentId === activeStudent.id);
    return new Set(scores.map((m) => normalizeSubjectName(m.subject)));
  }, [activeStudent, globalMarks]);

  const processedSubjectChecklist = useMemo(() => {
    const q = subjectSearchQuery.trim().toLowerCase();
    let list = [...currentClassChecklistSubjects];

    if (q) {
      const normalizedQuery = normalizeSubjectName(subjectSearchQuery);
      if (!list.includes(normalizedQuery)) {
        list = [normalizedQuery, ...list];
      }
    }

    return list.sort((a, b) => {
      const aMatches = q ? a.toLowerCase().includes(q) : false;
      const bMatches = q ? b.toLowerCase().includes(q) : false;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return a.localeCompare(b);
    });
  }, [currentClassChecklistSubjects, subjectSearchQuery]);

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
      {/* ===================== PRINT CSS ===================== */}
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

          .min-h-screen { min-height: 0 !important; }
          .h-screen { height: auto !important; }
          .overflow-hidden { overflow: visible !important; }

          aside, header, .no-print, button, .delete-row-btn {
            display: none !important;
          }

          /* Remove input borders and styles in print so it looks like raw table text */
          .editable-card-input {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            font-size: inherit !important;
            font-weight: inherit !important;
            text-align: inherit !important;
            width: 100% !important;
          }

          .main-canvas-wrapper {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
          }

          main {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            padding: 0 !important;
            background: white !important;
          }

          .bulk-print-wrapper {
            display: block !important;
            width: 100% !important;
          }

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

      {/* LEFT SIDEBAR: STUDENT LIST */}
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
                      className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition-all border ${
                        isCurrentActive
                          ? "bg-white text-slate-900 border-white shadow-md font-bold scale-[1.01]"
                          : "bg-white/5 text-slate-200 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xs tracking-wide truncate">
                        {student.firstName} {student.lastName}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                          isCurrentActive
                            ? "bg-[#1e3a8a] text-white"
                            : "bg-white/10 text-slate-300"
                        }`}
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
          {/* GLOBAL GRAND TOTAL BOX */}
          <div className="bg-white p-4 mb-6 rounded-xl shadow-sm border border-slate-200 w-[210mm] shrink-0 no-print flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">
                Global Grand Total Override
              </h3>
              <p className="text-[11px] text-slate-400">
                Leave empty to use dynamic calculation. This acts as the total marks for every student's result.
              </p>
            </div>
            <input
              type="number"
              value={globalGrandTotal}
              onChange={(e) => setGlobalGrandTotal(e.target.value)}
              placeholder="Auto Calculate"
              className="bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg text-slate-900 font-black font-mono outline-none focus:border-blue-500 w-44 text-center shadow-inner"
            />
          </div>

          {/* 1. SINGLE TRANSCRIPT MODE (WITH EDITABLE CARD) */}
          {activeReportMode === "single" && activeStudent && (
            <div className="flex items-start justify-center gap-6 w-full max-w-[290mm]">
              {/* LEFT SUBJECT CHECKLIST PANEL (NO-PRINT) */}
              <div className="w-64 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 shrink-0 no-print flex flex-col">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 mb-3">
                  <CheckSquare className="w-4 h-4 text-blue-700" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Manage Subjects
                  </h3>
                </div>

                {/* Class Select Buttons */}
                <div className="mb-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Select Class:
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {classesList.map((c) => {
                      const isSelected = subjectPanelClass === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSubjectPanelClass(c);
                            setAdminSelectedClass(c);
                          }}
                          className={`py-1.5 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subject Search */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={subjectSearchQuery}
                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                    placeholder="Search Subject..."
                    className="w-full bg-slate-100 text-slate-800 text-xs py-2 pl-3 pr-8 rounded-xl outline-none font-medium border border-transparent focus:border-blue-400 focus:bg-white"
                  />
                  <div className="absolute right-2.5 top-2.5 text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2 px-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {subjectPanelClass} Subjects
                  </span>
                  <span className="text-[10px] font-mono text-blue-600 font-bold">
                    {processedSubjectChecklist.length} Listed
                  </span>
                </div>

                {/* Scrollable Checklist */}
                <div className="space-y-1 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
                  {processedSubjectChecklist.map((sub) => {
                    const isFromStudentOriginal =
                      activeStudent.class === subjectPanelClass &&
                      activeStudentOriginalSubjects.has(sub);

                    const isClassExtra = (classExtraSubjects[subjectPanelClass] || []).includes(sub);
                    const isChecked = isFromStudentOriginal || isClassExtra;

                    return (
                      <label
                        key={sub}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors select-none ${
                          isFromStudentOriginal
                            ? "bg-slate-100/80 text-slate-400 cursor-not-allowed border border-slate-200/50"
                            : isChecked
                            ? "bg-blue-50 text-blue-900 font-bold border border-blue-200 cursor-pointer"
                            : "hover:bg-slate-50 text-slate-700 border border-transparent cursor-pointer"
                        }`}
                      >
                        <span className="truncate mr-2 text-[11px] font-semibold">
                          {sub}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isFromStudentOriginal}
                          onChange={() => handleToggleSubjectForClass(sub, subjectPanelClass)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 leading-tight">
                  ✍️ <strong>Editable Mode Active:</strong> Table mein Subject name aur Round marks direct click karke change karein. Page refresh ya student badalne par reset ho jayega.
                </div>
              </div>

              {/* SINGLE RESULT CARD */}
              <div className="bg-white w-[210mm] min-h-[297mm] p-10 border border-slate-200 shadow-xl rounded-sm print-area flex flex-col justify-between text-slate-800 select-text shrink-0">
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
                      {activeReportCardCalculations.rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={selectedRounds.length + 4}
                            className="p-8 text-center text-slate-400 italic bg-slate-50/50"
                          >
                            No record of this student exists in the database.
                          </td>
                        </tr>
                      ) : (
                        activeReportCardCalculations.rows.map((row, idx) => (
                          <tr key={row.id || idx} className="border-b border-slate-900 group">
                            {/* EDITABLE SUBJECT NAME */}
                            <td className="p-2 border-r border-slate-900 font-bold uppercase relative">
                              <input
                                type="text"
                                value={row.subjectName}
                                onChange={(e) => handleCellSubjectChange(idx, e.target.value)}
                                className="editable-card-input w-full bg-transparent outline-none font-bold uppercase text-slate-900 focus:bg-blue-50/50 rounded px-1 transition-colors"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(idx)}
                                title="Remove row"
                                className="delete-row-btn absolute right-1 top-2.5 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>

                            {/* EDITABLE ROUNDS */}
                            {selectedRounds.map((r) => (
                              <td
                                key={r}
                                className="p-2 border-r border-slate-900 text-center font-mono font-bold text-slate-800"
                              >
                                <input
                                  type="text"
                                  value={row.rounds[r] ?? "—"}
                                  onChange={(e) => handleCellRoundChange(idx, r, e.target.value)}
                                  className="editable-card-input w-full text-center bg-transparent outline-none font-mono font-bold text-slate-800 focus:bg-blue-50/50 rounded px-0.5 transition-colors"
                                />
                              </td>
                            ))}

                            {/* AUTO CALCULATED TOTAL FOR ROW */}
                            <td className="p-3 border-r border-slate-900 text-center font-bold text-slate-500">
                              {row.totalMax}
                            </td>

                            {/* AUTO CALCULATED OBTAINED FOR ROW */}
                            <td className="p-3 border-r border-slate-900 text-center font-black text-slate-900 text-sm">
                              {row.totalObt}
                            </td>

                            {/* AUTO CALCULATED STATUS FOR ROW */}
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded font-black text-[10px] ${
                                  row.status === "PASS"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : row.status === "FAIL"
                                    ? "bg-rose-50 text-rose-700"
                                    : "text-slate-400"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}

                      {/* GRAND TOTAL ROW */}
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
                          {activeReportCardCalculations.grandTotalMax}
                        </td>
                        <td className="p-3 border-r border-slate-900 text-center text-sm font-black text-blue-900">
                          {activeReportCardCalculations.grandTotalObt}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-3 py-1 rounded font-black text-xs ${
                              activeReportCardCalculations.status === "PASS"
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                          >
                            {activeReportCardCalculations.status} ({activeReportCardCalculations.perc}%)
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* + ADD ROW ACTION BUTTON (NO-PRINT) */}
                  <div className="mt-3 flex justify-end no-print">
                    <button
                      type="button"
                      onClick={handleAddNewRow}
                      className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 bg-blue-50 text-[#1e3a8a] hover:bg-blue-100 rounded-lg border border-blue-200 shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>
                  </div>
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
            </div>
          )}

          {/* 2. BULK PRINT MODE */}
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
                                    className={`font-black ${
                                      row.status === "PASS"
                                        ? "text-emerald-600"
                                        : row.status === "FAIL"
                                        ? "text-rose-600"
                                        : "text-slate-400"
                                    }`}
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
                                  className={`font-black text-xs ${
                                    status === "PASS" ? "text-emerald-600" : "text-rose-600"
                                  }`}
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
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black border-2 ${
                            idx === 0
                              ? "bg-amber-100 text-amber-700 border-amber-400"
                              : idx === 1
                              ? "bg-slate-100 text-slate-700 border-slate-400"
                              : "bg-orange-100 text-orange-700 border-orange-400"
                          }`}
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
                            className={`font-black uppercase text-[10px] ${
                              item.status === "PASS" ? "text-emerald-600" : "text-rose-600"
                            }`}
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

      {/* RIGHT SIDEBAR: REPORTING PANEL */}
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
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md"
                          : "bg-slate-200/50 text-slate-400 border-transparent hover:bg-slate-200"
                      }`}
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
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer ${
                  activeReportMode === "bulk"
                    ? "bg-blue-900 text-white"
                    : "bg-[#1e3a8a] text-white hover:bg-blue-800"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4" />
                  <span>Print Bulk Results</span>
                </div>
              </button>
              <button
                onClick={() => setActiveReportMode("positions")}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer ${
                  activeReportMode === "positions"
                    ? "bg-amber-600 text-white"
                    : "bg-[#f59e0b] text-white hover:bg-amber-600"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>Top 3 Positions</span>
                </div>
              </button>
              <button
                onClick={() => setActiveReportMode("summary")}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer ${
                  activeReportMode === "summary"
                    ? "bg-purple-800 text-white"
                    : "bg-[#a855f7] text-white hover:bg-purple-600"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Pass/Fail Summary</span>
                </div>
              </button>
              <button
                onClick={() => setActiveReportMode("gazette")}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer ${
                  activeReportMode === "gazette"
                    ? "bg-slate-900 text-white"
                    : "bg-[#0f172a] text-white hover:bg-slate-800"
                }`}
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
                    <User className="w-3 h-3 inline mr-1" /> First Name *
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
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="e.g. Batool"
                    required
                    className="w-full bg-slate-100 text-slate-700 text-sm py-2 px-3.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Father's Name (Optional)
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  placeholder="Enter father's full name (Default: NA)"
                  className="w-full bg-slate-100 text-slate-700 text-sm py-2 px-3.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <Phone className="w-3 h-3 inline mr-1" /> Father Phone No. (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 03001234567 (Default: NA)"
                    className="w-full bg-slate-100 text-slate-700 text-sm py-2 px-3.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <Calendar className="w-3 h-3 inline mr-1" /> Date of Birth (Optional)
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full bg-slate-100 text-slate-700 text-sm py-2 px-3.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Select Class *
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
                    className={`w-full text-sm py-2 px-3.5 rounded-xl font-mono font-bold border flex items-center justify-between ${
                      calculatedRollNo
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-400 border-transparent"
                    }`}
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
                  Top headers bilkul is tarah rakhein. Roll numbers auto allot ho jayenge.
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-200/70 text-slate-700 font-bold border-b border-slate-300">
                        <th className="p-2 border-r border-slate-200">FirstName</th>
                        <th className="p-2 border-r border-slate-200">LastName</th>
                        <th className="p-2 border-r border-slate-200">FatherName</th>
                        <th className="p-2 border-r border-slate-200">FatherPhone</th>
                        <th className="p-2 border-r border-slate-200">DOB</th>
                        <th className="p-2">Class</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-500 font-medium">
                      <tr className="border-b border-slate-200">
                        <td className="p-2 border-r border-slate-200 bg-white">Zainab</td>
                        <td className="p-2 border-r border-slate-200 bg-white">Ali</td>
                        <td className="p-2 border-r border-slate-200 bg-white">Muhammad Ali</td>
                        <td className="p-2 border-r border-slate-200 bg-white">03217654321</td>
                        <td className="p-2 border-r border-slate-200 bg-white">2009-04-14</td>
                        <td className="p-2 bg-white font-bold text-blue-800">9th</td>
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
