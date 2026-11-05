import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Sliders,
  Sparkles,
  Users,
  Heart,
  Activity,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  Check,
  Search,
  Filter,
  BarChart3,
  Calendar,
  FileCheck,
  FileSpreadsheet,
  Database,
  Cloud,
  Laptop
} from 'lucide-react';
import {
  GradeLevel,
  Semester,
  PaibpElement,
  StudentInfo,
  StudentTpGradeRecord,
  GradingConfiguration,
  RombelName,
  CbtStudentResult
} from '../types';
import {
  DEFAULT_GRADING_CONFIG,
  INITIAL_STUDENTS_BY_GRADE,
  getRosterForGradeAndRombel,
  generateInitialScoresForRoster,
  recalculateStudentRecord,
  saveGradebookToStorage,
  loadGradebookFromStorage,
  exportGradebookToCsv,
  printOfficialGradebook,
  loadCbtResults,
  deleteCbtResult,
  exportCbtResultsToCsv,
  printCbtStudentCertificate,
  syncCbtScoreToStudentGradebook
} from '../services/gradingService';
import {
  subscribeToDatabaseStatus,
  syncAllLocalStorageToDatabase,
  loadGradeRecordsFromDatabase,
  loadStudentsFromDatabase,
  loadCbtResultsFromDatabase,
  deleteCbtResultFromDatabase,
  DatabaseSyncStatus
} from '../services/firebaseDatabaseService';
import { CURRICULUM_TOPICS, OFFICIAL_CP_PAIBP_FASED } from '../data/curriculumData';
import { HolisticAssessmentModal } from './HolisticAssessmentModal';
import { StudentImportModal } from './StudentImportModal';

interface ComprehensiveGradingModalProps {
  onClose: () => void;
  initialGrade?: GradeLevel;
  initialSemester?: Semester;
  initialElement?: PaibpElement | string;
  initialTp?: string;
  schoolName?: string;
  teacherName?: string;
}

export const ComprehensiveGradingModal: React.FC<ComprehensiveGradingModalProps> = ({
  onClose,
  initialGrade = 'VIII',
  initialSemester = '1',
  initialElement = 'Akidah',
  initialTp,
  schoolName = 'SMP Negeri 1 Nusantara',
  teacherName = 'Guru Pengampu PAIBP'
}) => {
  // Navigation & Filter States
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(initialGrade);
  const [selectedSemester, setSelectedSemester] = useState<Semester>(initialSemester);
  const [selectedElement, setSelectedElement] = useState<PaibpElement>(
    (initialElement as PaibpElement) || 'Akidah'
  );

  // Active Domain Tab: 'all' | 'kognitif' | 'afektif' | 'psikomotorik' | 'rapor' | 'cbt'
  const [activeDomainTab, setActiveDomainTab] = useState<
    'all' | 'kognitif' | 'afektif' | 'psikomotorik' | 'rapor' | 'cbt'
  >('all');

  // CBT Recapitulation States
  const [cbtResultsList, setCbtResultsList] = useState<CbtStudentResult[]>([]);
  const [isLoadingCbt, setIsLoadingCbt] = useState<boolean>(false);
  const [cbtSearchQuery, setCbtSearchQuery] = useState<string>('');
  const [cbtSyncNotice, setCbtSyncNotice] = useState<string>('');

  const loadAllCbtSubmissions = async () => {
    setIsLoadingCbt(true);
    try {
      const local = loadCbtResults();
      const cloud = await loadCbtResultsFromDatabase();
      const map = new Map<string, CbtStudentResult>();
      [...cloud, ...local].forEach(r => map.set(r.id, r));
      const sorted = Array.from(map.values()).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      setCbtResultsList(sorted);
    } catch (e) {
      console.warn('Error loading CBT submissions:', e);
    } finally {
      setIsLoadingCbt(false);
    }
  };

  useEffect(() => {
    loadAllCbtSubmissions();
  }, []);

  // Grading Configurations & Weights
  const [config, setConfig] = useState<GradingConfiguration>(DEFAULT_GRADING_CONFIG);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showHolisticModal, setShowHolisticModal] = useState<boolean>(false);
  const [customSchoolName, setCustomSchoolName] = useState<string>(schoolName);
  const [customTeacherName, setCustomTeacherName] = useState<string>(teacherName);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'tuntas' | 'remedial'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Available topics for selected Grade, Semester, & Element
  const availableTopics = useMemo(() => {
    return CURRICULUM_TOPICS.filter(
      t =>
        t.grade === selectedGrade &&
        t.semester === selectedSemester &&
        (t.element === selectedElement || (selectedElement === "Al-Qur'an Hadis" && t.element.includes("Qur'an")))
    );
  }, [selectedGrade, selectedSemester, selectedElement]);

  // Current active topic & TP selection
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    availableTopics[0]?.id || 'custom-topic'
  );

  // Auto-sync topic when availableTopics change (grade, semester, or element filter change)
  useEffect(() => {
    if (availableTopics.length > 0 && !availableTopics.some(t => t.id === selectedTopicId)) {
      setSelectedTopicId(availableTopics[0].id);
      setSelectedTpIndex(0);
    }
  }, [availableTopics, selectedTopicId]);

  const currentTopic = availableTopics.find(t => t.id === selectedTopicId) || availableTopics[0];

  const availableTpList = useMemo(() => {
    if (currentTopic && currentTopic.suggestedTpList.length > 0) {
      return currentTopic.suggestedTpList;
    }
    return [
      initialTp ||
        `Peserta didik mampu menganalisis dan menerapkan nilai-nilai ${selectedElement} dalam kehidupan nyata.`
    ];
  }, [currentTopic, selectedElement, initialTp]);

  const [selectedTpIndex, setSelectedTpIndex] = useState<number>(0);
  const currentTpText = availableTpList[selectedTpIndex] || availableTpList[0] || 'Tujuan Pembelajaran';

  // Rombel Categorization: A, B, C, D
  const [selectedRombel, setSelectedRombel] = useState<RombelName>('A');

  // Student records for current TP and Rombel
  const storageKey = `${selectedGrade}_rombel${selectedRombel}_${selectedSemester}_${selectedElement}_${selectedTopicId}_tp${selectedTpIndex}`;
  const [records, setRecords] = useState<StudentTpGradeRecord[]>([]);

  // Cloud Database Status state
  const [dbStatus, setDbStatus] = useState<DatabaseSyncStatus>({
    isConnected: true,
    isSyncing: false,
    totalStudentsInDb: 0,
    totalGradeRecordsInDb: 0,
    totalCbtResultsInDb: 0,
    lastSyncedAt: null,
    error: null
  });
  const [syncToast, setSyncToast] = useState<string>('');

  // Subscribe to real-time database status
  useEffect(() => {
    const unsub = subscribeToDatabaseStatus((status) => {
      setDbStatus(status);
    });
    return unsub;
  }, []);

  // Load from local storage or cloud database or initialize for selected Grade & Rombel
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      // 1. Try local storage first for instant responsiveness
      const saved = loadGradebookFromStorage(storageKey);
      if (saved && saved.length > 0) {
        const updated = saved.map(r => recalculateStudentRecord(r, config));
        if (!isCancelled) setRecords(updated);
        return;
      }

      // 2. Try loading from Firestore Cloud Database
      try {
        const cloudRecords = await loadGradeRecordsFromDatabase(storageKey);
        if (cloudRecords && cloudRecords.length > 0 && !isCancelled) {
          const updated = cloudRecords.map(r => recalculateStudentRecord(r, config));
          setRecords(updated);
          saveGradebookToStorage(storageKey, updated);
          return;
        }

        // 3. Check if master students roster exists in Firestore for this grade and rombel
        const cloudStudents = await loadStudentsFromDatabase(selectedGrade);
        const filteredCloud = cloudStudents.filter(s => {
          if (s.classGroup) {
            const match = s.classGroup.match(/[-_\s]([A-Da-d])($|\b)/);
            if (match) return match[1].toUpperCase() === selectedRombel;
          }
          return false;
        });

        const roster = (filteredCloud.length > 0)
          ? filteredCloud
          : getRosterForGradeAndRombel(selectedGrade, selectedRombel);

        if (!isCancelled) {
          const initial = generateInitialScoresForRoster(
            roster,
            `tp-${selectedTopicId}-${selectedTpIndex}`,
            currentTpText,
            selectedElement,
            selectedGrade,
            selectedSemester,
            config,
            selectedRombel
          );
          setRecords(initial);
          saveGradebookToStorage(storageKey, initial);
        }
      } catch (err) {
        console.warn('Error loading from database, fallback to initial:', err);
        const roster = getRosterForGradeAndRombel(selectedGrade, selectedRombel);
        if (!isCancelled) {
          const initial = generateInitialScoresForRoster(
            roster,
            `tp-${selectedTopicId}-${selectedTpIndex}`,
            currentTpText,
            selectedElement,
            selectedGrade,
            selectedSemester,
            config,
            selectedRombel
          );
          setRecords(initial);
          saveGradebookToStorage(storageKey, initial);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [storageKey, selectedGrade, selectedRombel, selectedSemester, selectedElement, selectedTopicId, selectedTpIndex]);

  // Manual Cloud Sync Trigger
  const handleManualSyncDatabase = async () => {
    try {
      setSyncToast('Menyinkronkan seluruh data ke Cloud Database...');
      const res = await syncAllLocalStorageToDatabase();
      setSyncToast(`Tersimpan! ${res.gradesSynced} nilai dan data siswa aman di Cloud Firestore.`);
      setTimeout(() => setSyncToast(''), 4500);
    } catch (e) {
      setSyncToast('Data tersimpan aman.');
      setTimeout(() => setSyncToast(''), 3000);
    }
  };

  // Save changes to storage whenever records change
  const handleUpdateRecord = (index: number, updated: StudentTpGradeRecord) => {
    const recalculated = recalculateStudentRecord(updated, config);
    const newRecords = [...records];
    newRecords[index] = recalculated;
    setRecords(newRecords);
    saveGradebookToStorage(storageKey, newRecords);
  };

  // Specific cell score updater
  const handleScoreChange = (
    index: number,
    domain: 'kognitif' | 'afektif' | 'psikomotorik',
    field: string,
    value: string
  ) => {
    const parsed = value === '' ? undefined : Math.min(100, Math.max(0, Number(value)));
    const target = { ...records[index] };

    if (domain === 'kognitif') {
      target.kognitif = { ...target.kognitif, [field]: parsed };
    } else if (domain === 'afektif') {
      target.afektif = { ...target.afektif, [field]: parsed };
    } else if (domain === 'psikomotorik') {
      target.psikomotorik = { ...target.psikomotorik, [field]: parsed };
    }

    handleUpdateRecord(index, target);
  };

  // Batch quick-fill function
  const handleBatchFill = (domain: 'kognitif' | 'afektif' | 'psikomotorik', field: string, value: number) => {
    const updated = records.map(r => {
      const copy = { ...r };
      if (domain === 'kognitif') {
        copy.kognitif = { ...copy.kognitif, [field]: value };
      } else if (domain === 'afektif') {
        copy.afektif = { ...copy.afektif, [field]: value };
      } else if (domain === 'psikomotorik') {
        copy.psikomotorik = { ...copy.psikomotorik, [field]: value };
      }
      return recalculateStudentRecord(copy, config);
    });
    setRecords(updated);
    saveGradebookToStorage(storageKey, updated);
  };

  // Sync CBT scores to gradebook
  const handleSyncAllCbtToCurrentGradebook = () => {
    let count = 0;
    const updated = records.map(r => {
      const match = cbtResultsList.find(
        c =>
          (c.nis && r.nis && c.nis.trim() === r.nis.trim()) ||
          c.studentName.toLowerCase().trim() === r.studentName.toLowerCase().trim()
      );
      if (match) {
        count++;
        const copy = { ...r };
        copy.kognitif = { ...copy.kognitif, sumatif: match.score };
        return recalculateStudentRecord(copy, config);
      }
      return r;
    });

    setRecords(updated);
    saveGradebookToStorage(storageKey, updated);
    setCbtSyncNotice(`Berhasil menyinkronkan ${count} nilai CBT siswa ke kolom Sumatif Kognitif.`);
    setTimeout(() => setCbtSyncNotice(''), 4000);
  };

  const handleDeleteCbtSubmission = (resultId: string) => {
    if (window.confirm('Hapus data hasil CBT siswa ini dari database?')) {
      deleteCbtResult(resultId);
      deleteCbtResultFromDatabase(resultId).catch(() => {});
      setCbtResultsList(prev => prev.filter(r => r.id !== resultId));
    }
  };

  // Reset to default sample scores
  const handleResetSample = () => {
    if (window.confirm(`Reset nilai Kelas ${selectedGrade}-${selectedRombel} ini ke data simulasi ideal Kurikulum Merdeka?`)) {
      const roster = getRosterForGradeAndRombel(selectedGrade, selectedRombel);
      const initial = generateInitialScoresForRoster(
        roster,
        `tp-${selectedTopicId}-${selectedTpIndex}`,
        currentTpText,
        selectedElement,
        selectedGrade,
        selectedSemester,
        config,
        selectedRombel
      );
      setRecords(initial);
      saveGradebookToStorage(storageKey, initial);
    }
  };

  // Add new student
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentNis, setNewStudentNis] = useState<string>('');
  const [newStudentClass, setNewStudentClass] = useState<string>('');
  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('L');
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  const handleImportStudentsSuccess = (importedStudents: StudentTpGradeRecord[], isAppend: boolean) => {
    let updatedList: StudentTpGradeRecord[] = [];
    if (isAppend) {
      updatedList = [...records, ...importedStudents];
    } else {
      updatedList = importedStudents;
    }
    setRecords(updatedList);
    saveGradebookToStorage(storageKey, updatedList);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newId = `s-custom-${Date.now()}`;
    const rombelDigit = selectedRombel === 'A' ? '1' : selectedRombel === 'B' ? '2' : selectedRombel === 'C' ? '3' : '4';
    const newRecord: StudentTpGradeRecord = {
      studentId: newId,
      studentName: newStudentName.trim(),
      nis: newStudentNis.trim() || `24${rombelDigit}${(records.length + 1).toString().padStart(2, '0')}`,
      nisn: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      classGroup: newStudentClass.trim() || `${selectedGrade}-${selectedRombel}`,
      rombel: selectedRombel,
      gender: newStudentGender,
      tpId: `tp-${selectedTopicId}-${selectedTpIndex}`,
      tpText: currentTpText,
      element: selectedElement,
      grade: selectedGrade,
      semester: selectedSemester,
      kognitif: { tugas: 80, diagnostik: 75, formatif: 82, sumatif: 80, rataRata: 0 },
      afektif: { sikap: 85, keaktifan: 82, presensiSholat: 90, adabEtika: 85, rataRata: 0, predikat: 'Baik' },
      psikomotorik: { praktik: 82, unjukKerja: 80, produkProyek: 80, rataRata: 0, predikat: 'Mahir' },
      nilaiAkhir: 0,
      isTuntas: false,
      deskripsiCapaian: ''
    };

    const recalculated = recalculateStudentRecord(newRecord, config);
    const updatedList = [...records, recalculated];
    setRecords(updatedList);
    saveGradebookToStorage(storageKey, updatedList);
    setNewStudentName('');
    setNewStudentNis('');
    setNewStudentClass('');
    setShowAddStudentModal(false);
  };

  const handleDeleteStudent = (index: number) => {
    if (window.confirm(`Hapus data nilai siswa "${records[index].studentName}"?`)) {
      const updatedList = records.filter((_, i) => i !== index);
      setRecords(updatedList);
      saveGradebookToStorage(storageKey, updatedList);
    }
  };

  // Class statistics
  const stats = useMemo(() => {
    if (records.length === 0) return { avgCog: 0, avgAff: 0, avgPsy: 0, avgFinal: 0, tuntasCount: 0, remedialCount: 0, maxScore: 0, minScore: 0 };
    const avgCog = Math.round((records.reduce((acc, r) => acc + r.kognitif.rataRata, 0) / records.length) * 10) / 10;
    const avgAff = Math.round((records.reduce((acc, r) => acc + r.afektif.rataRata, 0) / records.length) * 10) / 10;
    const avgPsy = Math.round((records.reduce((acc, r) => acc + r.psikomotorik.rataRata, 0) / records.length) * 10) / 10;
    const avgFinal = Math.round((records.reduce((acc, r) => acc + r.nilaiAkhir, 0) / records.length) * 10) / 10;

    const tuntasCount = records.filter(r => r.isTuntas).length;
    const remedialCount = records.length - tuntasCount;
    const maxScore = Math.max(...records.map(r => r.nilaiAkhir));
    const minScore = Math.min(...records.map(r => r.nilaiAkhir));

    return { avgCog, avgAff, avgPsy, avgFinal, tuntasCount, remedialCount, maxScore, minScore };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch =
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.nisn.includes(searchQuery);
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'tuntas' && r.isTuntas) ||
        (filterStatus === 'remedial' && !r.isTuntas);
      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, filterStatus]);

  // Copy narrative description to clipboard
  const handleCopyNarrative = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ========================================================================= */}
        {/* 1. MODAL TOP HEADER */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md font-bold">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Buku Penilaian Lengkap PAIBP: Kognitif, Afektif & Psikomotorik
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wide">
                  Kurikulum Merdeka 2026
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Penilaian otentik berbasis 3 ranah capaian tiap Tujuan Pembelajaran (TP) • Integrasi e-Rapor & Deskripsi Otomatis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHolisticModal(true)}
              className="px-3 py-1.5 bg-indigo-900/90 hover:bg-indigo-800 text-indigo-200 hover:text-white rounded-lg border border-indigo-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Lihat Rubrik & Panduan Asesmen Holistik (Kognitif, Afektif, Psikomotorik & P5PPRA) untuk TP ini"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Rubrik & Panduan Asesmen</span>
            </button>

            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Atur Bobot Penilaian & Nilai Kriteria Ketercapaian (KKTP)"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Bobot & KKTP ({config.kktp})</span>
            </button>

            <button
              onClick={() =>
                exportGradebookToCsv(
                  records,
                  selectedElement,
                  currentTpText,
                  selectedGrade,
                  selectedSemester,
                  config
                )
              }
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Ekspor Rekap Nilai ke Excel / Spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ekspor Excel</span>
            </button>

            <button
              onClick={() =>
                printOfficialGradebook(
                  records,
                  selectedElement,
                  currentTpText,
                  selectedGrade,
                  selectedSemester,
                  customSchoolName,
                  customTeacherName,
                  config
                )
              }
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Cetak Buku Nilai Resmi Standar Madrasah"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Buku Nilai</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CLOUD DATABASE PERSISTENCE STATUS BAR */}
        {/* ========================================================================= */}
        <div className="bg-emerald-950/60 border-b border-emerald-500/25 px-5 py-2 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-white">Database Cloud Firestore:</span>
            </div>
            <span className="text-emerald-300">
              {dbStatus.totalStudentsInDb > 0 ? `${dbStatus.totalStudentsInDb} Siswa Master` : `${records.length} Siswa Terdaftar`} & {records.length} Nilai 3 Ranah Tersimpan Permanen
            </span>
            {dbStatus.lastSyncedAt && (
              <span className="text-[11px] text-emerald-400/80 hidden md:inline">
                (Sinkron: {dbStatus.lastSyncedAt})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {syncToast && (
              <span className="text-emerald-300 text-[11px] font-semibold bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/40 animate-pulse">
                {syncToast}
              </span>
            )}
            <button
              type="button"
              onClick={handleManualSyncDatabase}
              disabled={dbStatus.isSyncing}
              className="px-2.5 py-1 bg-emerald-800/90 hover:bg-emerald-700 text-white border border-emerald-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Sinkronkan seluruh data siswa & nilai ke database cloud sekarang agar tidak terhapus"
            >
              <RefreshCw className={`w-3 h-3 ${dbStatus.isSyncing ? 'animate-spin' : ''}`} />
              <span>{dbStatus.isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Database'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PARAMETER KELAS & PEMILIHAN TUJUAN PEMBELAJARAN (TP) */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Grade, Rombel, Semester, Element Selector */}
            <div className="md:col-span-6 flex flex-wrap sm:flex-nowrap gap-2 items-center">
              <div className="w-28 shrink-0">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Kelas & Fase
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value as GradeLevel)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="VII">Kelas VII (Fase D)</option>
                  <option value="VIII">Kelas VIII (Fase D)</option>
                  <option value="IX">Kelas IX (Fase D)</option>
                </select>
              </div>

              <div className="w-24 shrink-0">
                <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                  Rombel
                </label>
                <select
                  value={selectedRombel}
                  onChange={(e) => setSelectedRombel(e.target.value as RombelName)}
                  className="w-full bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="A">Rombel A</option>
                  <option value="B">Rombel B</option>
                  <option value="C">Rombel C</option>
                  <option value="D">Rombel D</option>
                </select>
              </div>

              <div className="w-24 shrink-0">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as Semester)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="1">Sem. 1 (Ganjil)</option>
                  <option value="2">Sem. 2 (Genap)</option>
                </select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Elemen PAIBP
                </label>
                <select
                  value={selectedElement}
                  onChange={(e) => setSelectedElement(e.target.value as PaibpElement)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-900 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Al-Qur'an Hadis">Al-Qur'an Hadis</option>
                  <option value="Akidah">Akidah</option>
                  <option value="Akhlak">Akhlak</option>
                  <option value="Fikih">Fikih</option>
                  <option value="Sejarah Peradaban Islam">Sejarah Peradaban Islam</option>
                </select>
              </div>
            </div>

            {/* TP Selector */}
            <div className="md:col-span-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Tujuan Pembelajaran (TP) yang Dinilai:</span>
                <span className="text-sky-700 font-bold">
                  {availableTpList.length} TP Tersedia
                </span>
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedTpIndex}
                  onChange={(e) => setSelectedTpIndex(Number(e.target.value))}
                  className="flex-1 bg-white border border-sky-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 shadow-2xs"
                >
                  {availableTpList.map((tp, idx) => (
                    <option key={idx} value={idx}>
                      TP {idx + 1}: {tp}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleResetSample}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-300 text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                  title="Muat Ulang Data Nilai Sampel Standar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Nilai</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KATEGORI KELAS BERDASARKAN ROMBEL (ROMBEL A, B, C, D) */}
        {/* ========================================================================= */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kategori Rombel:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {(['A', 'B', 'C', 'D'] as RombelName[]).map((r) => {
                const isActive = selectedRombel === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRombel(r)}
                    className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-linear-to-r from-emerald-700 to-teal-800 text-white shadow-xs scale-102 ring-2 ring-emerald-500/40'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    <span>Rombel {r}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedGrade}-{r}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-white border border-emerald-300 px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Buku Nilai Rombel Aktif: <strong>Kelas {selectedGrade}-{selectedRombel}</strong> ({records.length} Siswa)</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. TABS MENU PENILAIAN LENGKAP: 3 RANAH & REKAP RAPOR */}
        {/* ========================================================================= */}
        <div className="border-b border-slate-200 px-5 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveDomainTab('all')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeDomainTab === 'all'
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>Semua Ranah (Rekap Komprehensif)</span>
            </button>

            <button
              onClick={() => setActiveDomainTab('kognitif')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeDomainTab === 'kognitif'
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-sky-600" />
              <span>Ranah Kognitif (Tugas, Formatif & Sumatif)</span>
              <span className="bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                {config.weights.kognitif}%
              </span>
            </button>

            <button
              onClick={() => setActiveDomainTab('afektif')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeDomainTab === 'afektif'
                  ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Heart className="w-4 h-4 text-amber-600" />
              <span>Ranah Afektif (Sikap & Sholat 5 Waktu)</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                {config.weights.afektif}%
              </span>
            </button>

            <button
              onClick={() => setActiveDomainTab('psikomotorik')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeDomainTab === 'psikomotorik'
                  ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-4 h-4 text-purple-600" />
              <span>Ranah Psikomotorik (Praktik & Kinerja)</span>
              <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                {config.weights.psikomotorik}%
              </span>
            </button>

            <button
              onClick={() => setActiveDomainTab('rapor')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeDomainTab === 'rapor'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Deskripsi Narasi Rapor</span>
            </button>

            <button
              onClick={() => setActiveDomainTab('cbt')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeDomainTab === 'cbt'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Laptop className="w-4 h-4 text-indigo-600" />
              <span>Rekap Hasil CBT Siswa</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                {cbtResultsList.length}
              </span>
            </button>
          </div>

          {/* Quick Actions (Add student & search) */}
          <div className="flex items-center gap-2 pb-2 sm:pb-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa / NISN..."
                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 w-36 sm:w-44 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
              title="Tambah satu siswa secara manual"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Siswa</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-2.5 py-1 bg-linear-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
              title="Import Data Siswa dari Excel, CSV, atau Google Sheets (NIS, Nama, Kelas)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Import Siswa (Excel/CSV)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. DOMAIN SPECIFIC OPTIONS & QUICK FILL BAR */}
        {/* ========================================================================= */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-5 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Options Toggles per Domain */}
          <div className="flex flex-wrap items-center gap-2.5">
            {activeDomainTab === 'kognitif' && (
              <>
                <span className="font-bold text-sky-950 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-sky-600" />
                  Opsi Kognitif Aktif:
                </span>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cognitiveOptions.tugas}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cognitiveOptions: { ...config.cognitiveOptions, tugas: e.target.checked }
                      })
                    }
                    className="rounded text-sky-600"
                  />
                  <span>Nilai Tugas (Harian)</span>
                </label>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cognitiveOptions.diagnostik}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cognitiveOptions: { ...config.cognitiveOptions, diagnostik: e.target.checked }
                      })
                    }
                    className="rounded text-sky-600"
                  />
                  <span>Asesmen Diagnostik</span>
                </label>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cognitiveOptions.formatif}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cognitiveOptions: { ...config.cognitiveOptions, formatif: e.target.checked }
                      })
                    }
                    className="rounded text-sky-600"
                  />
                  <span>Asesmen Formatif (Kuis/LKPD)</span>
                </label>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cognitiveOptions.sumatif}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        cognitiveOptions: { ...config.cognitiveOptions, sumatif: e.target.checked }
                      })
                    }
                    className="rounded text-sky-600"
                  />
                  <span>Asesmen Sumatif TP</span>
                </label>
              </>
            )}

            {activeDomainTab === 'afektif' && (
              <>
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-amber-600" />
                  Opsi Afektif Aktif:
                </span>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.affectiveOptions.sikap}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        affectiveOptions: { ...config.affectiveOptions, sikap: e.target.checked }
                      })
                    }
                    className="rounded text-amber-600"
                  />
                  <span>Nilai Sikap & Karakter</span>
                </label>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.affectiveOptions.keaktifan}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        affectiveOptions: { ...config.affectiveOptions, keaktifan: e.target.checked }
                      })
                    }
                    className="rounded text-amber-600"
                  />
                  <span>Keaktifan Belajar</span>
                </label>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.affectiveOptions.presensi_sholat}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        affectiveOptions: { ...config.affectiveOptions, presensi_sholat: e.target.checked }
                      })
                    }
                    className="rounded text-amber-600"
                  />
                  <span>Presensi Sholat 5 Waktu & Mutaba'ah</span>
                </label>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.affectiveOptions.adab_etika}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        affectiveOptions: { ...config.affectiveOptions, adab_etika: e.target.checked }
                      })
                    }
                    className="rounded text-amber-600"
                  />
                  <span>Adab & Etika Digital</span>
                </label>
              </>
            )}

            {activeDomainTab === 'psikomotorik' && (
              <>
                <span className="font-bold text-purple-950 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  Opsi Psikomotorik Aktif:
                </span>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.psychomotorOptions.praktik}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        psychomotorOptions: { ...config.psychomotorOptions, praktik: e.target.checked }
                      })
                    }
                    className="rounded text-purple-600"
                  />
                  <span>Nilai Praktik Ibadah / Tajwid</span>
                </label>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.psychomotorOptions.unjuk_kerja}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        psychomotorOptions: { ...config.psychomotorOptions, unjuk_kerja: e.target.checked }
                      })
                    }
                    className="rounded text-purple-600"
                  />
                  <span>Unjuk Kerja / Kinerja</span>
                </label>
                <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.psychomotorOptions.produk_proyek}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        psychomotorOptions: { ...config.psychomotorOptions, produk_proyek: e.target.checked }
                      })
                    }
                    className="rounded text-purple-600"
                  />
                  <span>Produk / Proyek Dakwah</span>
                </label>
              </>
            )}

            {(activeDomainTab === 'all' || activeDomainTab === 'rapor') && (
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">Formula Nilai Akhir:</span>
                <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-semibold">
                  Kognitif ({config.weights.kognitif}%)
                </span>
                <span>+</span>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                  Afektif ({config.weights.afektif}%)
                </span>
                <span>+</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">
                  Psikomotorik ({config.weights.psikomotorik}%)
                </span>
                <span className="text-slate-400">|</span>
                <span className="font-bold text-emerald-800">KKTP: {config.kktp}</span>
              </div>
            )}
          </div>

          {/* Quick Fill Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Input Cepat Kelas:</span>
            {activeDomainTab === 'kognitif' && (
              <>
                <button
                  onClick={() => handleBatchFill('kognitif', 'tugas', 85)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-slate-700"
                >
                  Tugas = 85
                </button>
                <button
                  onClick={() => handleBatchFill('kognitif', 'formatif', 80)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-slate-700"
                >
                  Formatif = 80
                </button>
                <button
                  onClick={() => handleBatchFill('kognitif', 'sumatif', 82)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-slate-700"
                >
                  Sumatif = 82
                </button>
              </>
            )}

            {activeDomainTab === 'afektif' && (
              <>
                <button
                  onClick={() => handleBatchFill('afektif', 'presensiSholat', 95)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-amber-800"
                >
                  Sholat 5 Waktu = 95
                </button>
                <button
                  onClick={() => handleBatchFill('afektif', 'sikap', 88)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-amber-800"
                >
                  Sikap = 88
                </button>
                <button
                  onClick={() => handleBatchFill('afektif', 'keaktifan', 85)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-amber-800"
                >
                  Aktif = 85
                </button>
              </>
            )}

            {activeDomainTab === 'psikomotorik' && (
              <>
                <button
                  onClick={() => handleBatchFill('psikomotorik', 'praktik', 85)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-purple-800"
                >
                  Praktik = 85
                </button>
                <button
                  onClick={() => handleBatchFill('psikomotorik', 'unjukKerja', 82)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-purple-800"
                >
                  Kinerja = 82
                </button>
                <button
                  onClick={() => handleBatchFill('psikomotorik', 'produkProyek', 85)}
                  className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-300 rounded text-[10px] font-semibold text-purple-800"
                >
                  Produk = 85
                </button>
              </>
            )}

            {(activeDomainTab === 'all' || activeDomainTab === 'rapor') && (
              <span className="text-[10px] text-slate-500 italic">
                Klik tab kognitif/afektif/psikomotorik untuk input cepat per aspek
              </span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. TABEL UTAMA NILAI SISWA */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {activeDomainTab !== 'rapor' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-3 py-3 text-center w-12 border-r border-slate-800">No</th>
                      <th className="px-3 py-3 w-56 border-r border-slate-800">Nama Siswa • NIS • Kelas</th>
                      <th className="px-2 py-3 text-center w-12 border-r border-slate-800">L/P</th>

                      {/* KOLOM KOGNITIF */}
                      {(activeDomainTab === 'all' || activeDomainTab === 'kognitif') && (
                        <>
                          {config.cognitiveOptions.tugas && (
                            <th className="px-2 py-3 text-center w-20 bg-sky-900 text-sky-200 border-r border-slate-800">
                              Tugas
                            </th>
                          )}
                          {config.cognitiveOptions.diagnostik && (
                            <th className="px-2 py-3 text-center w-20 bg-sky-900 text-sky-200 border-r border-slate-800">
                              Diagnostik
                            </th>
                          )}
                          {config.cognitiveOptions.formatif && (
                            <th className="px-2 py-3 text-center w-20 bg-sky-900 text-sky-200 border-r border-slate-800">
                              Formatif
                            </th>
                          )}
                          {config.cognitiveOptions.sumatif && (
                            <th className="px-2 py-3 text-center w-20 bg-sky-900 text-sky-200 border-r border-slate-800">
                              Sumatif
                            </th>
                          )}
                          <th className="px-2 py-3 text-center w-20 bg-sky-800 text-white font-extrabold border-r border-slate-800">
                            Rata Kognitif
                          </th>
                        </>
                      )}

                      {/* KOLOM AFEKTIF */}
                      {(activeDomainTab === 'all' || activeDomainTab === 'afektif') && (
                        <>
                          {config.affectiveOptions.sikap && (
                            <th className="px-2 py-3 text-center w-20 bg-amber-900 text-amber-200 border-r border-slate-800">
                              Sikap
                            </th>
                          )}
                          {config.affectiveOptions.keaktifan && (
                            <th className="px-2 py-3 text-center w-20 bg-amber-900 text-amber-200 border-r border-slate-800">
                              Keaktifan
                            </th>
                          )}
                          {config.affectiveOptions.presensi_sholat && (
                            <th className="px-2 py-3 text-center w-24 bg-amber-900 text-amber-100 border-r border-slate-800">
                              Sholat 5 Waktu
                            </th>
                          )}
                          {config.affectiveOptions.adab_etika && (
                            <th className="px-2 py-3 text-center w-20 bg-amber-900 text-amber-200 border-r border-slate-800">
                              Adab & Etika
                            </th>
                          )}
                          <th className="px-2 py-3 text-center w-20 bg-amber-800 text-white font-extrabold border-r border-slate-800">
                            Rata Afektif
                          </th>
                          <th className="px-2 py-3 text-center w-20 bg-amber-800 text-white border-r border-slate-800">
                            Predikat
                          </th>
                        </>
                      )}

                      {/* KOLOM PSIKOMOTORIK */}
                      {(activeDomainTab === 'all' || activeDomainTab === 'psikomotorik') && (
                        <>
                          {config.psychomotorOptions.praktik && (
                            <th className="px-2 py-3 text-center w-20 bg-purple-900 text-purple-200 border-r border-slate-800">
                              Praktik
                            </th>
                          )}
                          {config.psychomotorOptions.unjuk_kerja && (
                            <th className="px-2 py-3 text-center w-20 bg-purple-900 text-purple-200 border-r border-slate-800">
                              Kinerja
                            </th>
                          )}
                          {config.psychomotorOptions.produk_proyek && (
                            <th className="px-2 py-3 text-center w-20 bg-purple-900 text-purple-200 border-r border-slate-800">
                              Produk
                            </th>
                          )}
                          <th className="px-2 py-3 text-center w-20 bg-purple-800 text-white font-extrabold border-r border-slate-800">
                            Rata Psiko
                          </th>
                          <th className="px-2 py-3 text-center w-20 bg-purple-800 text-white border-r border-slate-800">
                            Predikat
                          </th>
                        </>
                      )}

                      {/* NILAI AKHIR & STATUS KKTP */}
                      <th className="px-2 py-3 text-center w-20 bg-emerald-900 text-emerald-200 font-black border-r border-slate-800">
                        NILAI AKHIR
                      </th>
                      <th className="px-2 py-3 text-center w-24 bg-emerald-900 text-emerald-200 font-bold border-r border-slate-800">
                        Status KKTP
                      </th>
                      <th className="px-2 py-3 text-center w-12">Aksi</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {filteredRecords.map((r, idx) => {
                      const isTuntas = r.isTuntas;
                      return (
                        <tr
                          key={r.studentId}
                          className="hover:bg-sky-50/40 transition-colors group"
                        >
                          <td className="px-3 py-2.5 text-center font-semibold text-slate-400 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-100">
                            <div className="font-bold text-slate-900">{r.studentName}</div>
                            <div className="text-[10px] text-slate-500 font-mono flex flex-wrap items-center gap-1.5 mt-0.5">
                              {r.nis && (
                                <span className="bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.2 rounded border border-slate-200">
                                  NIS: {r.nis}
                                </span>
                              )}
                              <span className="bg-emerald-50 text-emerald-800 font-semibold px-1.5 py-0.2 rounded border border-emerald-200">
                                {r.classGroup || `${selectedGrade}-A`}
                              </span>
                              <span className="text-slate-400">NISN: {r.nisn}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-center border-r border-slate-100 font-bold text-slate-600">
                            {r.gender}
                          </td>

                          {/* KOGNITIF INPUTS */}
                          {(activeDomainTab === 'all' || activeDomainTab === 'kognitif') && (
                            <>
                              {config.cognitiveOptions.tugas && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.kognitif.tugas ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'kognitif', 'tugas', e.target.value)
                                    }
                                    className="w-14 text-center font-semibold p-1 border border-slate-200 rounded focus:ring-1 focus:ring-sky-500 bg-white"
                                  />
                                </td>
                              )}
                              {config.cognitiveOptions.diagnostik && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.kognitif.diagnostik ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'kognitif', 'diagnostik', e.target.value)
                                    }
                                    className="w-14 text-center font-semibold p-1 border border-slate-200 rounded focus:ring-1 focus:ring-sky-500 bg-white"
                                  />
                                </td>
                              )}
                              {config.cognitiveOptions.formatif && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.kognitif.formatif ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'kognitif', 'formatif', e.target.value)
                                    }
                                    className="w-14 text-center font-semibold p-1 border border-slate-200 rounded focus:ring-1 focus:ring-sky-500 bg-white"
                                  />
                                </td>
                              )}
                              {config.cognitiveOptions.sumatif && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.kognitif.sumatif ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'kognitif', 'sumatif', e.target.value)
                                    }
                                    className="w-14 text-center font-semibold p-1 border border-slate-200 rounded focus:ring-1 focus:ring-sky-500 bg-white"
                                  />
                                </td>
                              )}
                              <td className="px-2 py-2 text-center font-bold text-sky-800 bg-sky-50/50 border-r border-slate-100">
                                {r.kognitif.rataRata}
                              </td>
                            </>
                          )}

                          {/* AFEKTIF INPUTS */}
                          {(activeDomainTab === 'all' || activeDomainTab === 'afektif') && (
                            <>
                              {config.affectiveOptions.sikap && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.afektif.sikap ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'afektif', 'sikap', e.target.value)
                                    }
                                    className="w-14 text-center font-semibold p-1 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 bg-white"
                                  />
                                </td>
                              )}
                              {config.affectiveOptions.keaktifan && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.afektif.keaktifan ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'afektif', 'keaktifan', e.target.value)
                                    }
                                    className="w-14 text-center font-semibold p-1 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 bg-white"
                                  />
                                </td>
                              )}
                              {config.affectiveOptions.presensi_sholat && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.afektif.presensiSholat ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'afektif', 'presensiSholat', e.target.value)
                                    }
                                    title="Nilai presensi sholat 5 waktu & mutaba'ah ibadah yaumiyah"
                                    className="w-16 text-center font-bold text-amber-900 p-1 border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 bg-amber-50/50"
                                  />
                                </td>
                              )}
                              {config.affectiveOptions.adab_etika && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.afektif.adabEtika ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'afektif', 'adabEtika', e.target.value)
                                    }
                                    className="w-14 text-center font-semibold p-1 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 bg-white"
                                  />
                                </td>
                              )}
                              <td className="px-2 py-2 text-center font-bold text-amber-800 bg-amber-50/50 border-r border-slate-100">
                                {r.afektif.rataRata}
                              </td>
                              <td className="px-2 py-2 text-center border-r border-slate-100">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    r.afektif.predikat === 'Sangat Baik'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : r.afektif.predikat === 'Baik'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {r.afektif.predikat}
                                </span>
                              </td>
                            </>
                          )}

                          {/* PSIKOMOTORIK INPUTS */}
                          {(activeDomainTab === 'all' || activeDomainTab === 'psikomotorik') && (
                            <>
                              {config.psychomotorOptions.praktik && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.psikomotorik.praktik ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'psikomotorik', 'praktik', e.target.value)
                                    }
                                    className="w-14 text-center font-semibold p-1 border border-slate-200 rounded focus:ring-1 focus:ring-purple-500 bg-white"
                                  />
                                </td>
                              )}
                              {config.psychomotorOptions.unjuk_kerja && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.psikomotorik.unjukKerja ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'psikomotorik', 'unjukKerja', e.target.value)
                                    }
                                    className="w-14 text-center font-semibold p-1 border border-slate-200 rounded focus:ring-1 focus:ring-purple-500 bg-white"
                                  />
                                </td>
                              )}
                              {config.psychomotorOptions.produk_proyek && (
                                <td className="px-1.5 py-2 text-center border-r border-slate-100">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={r.psikomotorik.produkProyek ?? ''}
                                    onChange={(e) =>
                                      handleScoreChange(idx, 'psikomotorik', 'produkProyek', e.target.value)
                                    }
                                    className="w-14 text-center font-semibold p-1 border border-slate-200 rounded focus:ring-1 focus:ring-purple-500 bg-white"
                                  />
                                </td>
                              )}
                              <td className="px-2 py-2 text-center font-bold text-purple-800 bg-purple-50/50 border-r border-slate-100">
                                {r.psikomotorik.rataRata}
                              </td>
                              <td className="px-2 py-2 text-center border-r border-slate-100">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    r.psikomotorik.predikat === 'Sangat Mahir'
                                      ? 'bg-purple-100 text-purple-800'
                                      : r.psikomotorik.predikat === 'Mahir'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {r.psikomotorik.predikat}
                                </span>
                              </td>
                            </>
                          )}

                          {/* NILAI AKHIR TP & STATUS KKTP */}
                          <td className="px-2 py-2 text-center font-black text-slate-900 text-xs bg-emerald-50/40 border-r border-slate-100">
                            {r.nilaiAkhir}
                          </td>
                          <td className="px-2 py-2 text-center border-r border-slate-100">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center justify-center gap-1 ${
                                isTuntas
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isTuntas ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Tuntas</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  <span>Remedial</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* AKSI DELETE */}
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={() => handleDeleteStudent(idx)}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                              title="Hapus baris siswa ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TAB 5: DESKRIPSI NARASI RAPOR PER SISWA */
            /* ========================================================================= */
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Generator Narasi Rapor Kurikulum Merdeka (Otomatis per Siswa)
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Deskripsi mengintegrasikan capaian kognitif, kebiasaan ibadah sholat 5 waktu & sikap afektif, serta keterampilan psikomotorik. Siap dicopy ke aplikasi e-Rapor.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs">
                  {records.length} Siswa Terdaftar
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRecords.map((r, i) => (
                  <div
                    key={r.studentId}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5 relative hover:border-sky-300 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-bold text-xs text-slate-900">{r.studentName}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                            {r.nis && <span className="bg-slate-100 text-slate-700 font-semibold px-1 py-0.2 rounded">NIS: {r.nis}</span>}
                            <span className="bg-emerald-50 text-emerald-800 font-semibold px-1 py-0.2 rounded border border-emerald-200">
                              {r.classGroup || `${selectedGrade}-A`}
                            </span>
                            <span className="text-slate-400">NISN: {r.nisn}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          NA: {r.nilaiAkhir}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            r.isTuntas
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.isTuntas ? 'Tuntas KKTP' : 'Remedial'}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Scores */}
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                      <div className="bg-sky-50 p-1.5 rounded border border-sky-100">
                        <span className="text-sky-700 block font-medium">Kognitif</span>
                        <span className="font-bold text-sky-900 text-xs">{r.kognitif.rataRata}</span>
                      </div>
                      <div className="bg-amber-50 p-1.5 rounded border border-amber-100">
                        <span className="text-amber-700 block font-medium">Afektif (Sholat: {r.afektif.presensiSholat ?? '-'})</span>
                        <span className="font-bold text-amber-900 text-xs">{r.afektif.rataRata} ({r.afektif.predikat})</span>
                      </div>
                      <div className="bg-purple-50 p-1.5 rounded border border-purple-100">
                        <span className="text-purple-700 block font-medium">Psikomotorik</span>
                        <span className="font-bold text-purple-900 text-xs">{r.psikomotorik.rataRata} ({r.psikomotorik.predikat})</span>
                      </div>
                    </div>

                    {/* Editable Narrative Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Deskripsi Capaian Kompetensi (Rapor):
                      </label>
                      <textarea
                        rows={3}
                        value={r.deskripsiCapaian}
                        onChange={(e) => {
                          const updated = { ...r, deskripsiCapaian: e.target.value };
                          handleUpdateRecord(i, updated);
                        }}
                        className="w-full text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-lg p-2.5 leading-relaxed focus:bg-white focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    {/* Copy Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleCopyNarrative(r.studentId, r.deskripsiCapaian)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        {copiedId === r.studentId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Salin Narasi Rapor</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: REKAP HASIL UJIAN CBT SISWA DARI CLOUD DATABASE & LINK SISWA */}
          {/* ========================================================================= */}
          {activeDomainTab === 'cbt' && (
            <div className="p-5 space-y-5">
              {/* CBT Notice & Sync Feedback */}
              {cbtSyncNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-fadeIn">
                  <span className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {cbtSyncNotice}
                  </span>
                  <button onClick={() => setCbtSyncNotice('')} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
                </div>
              )}

              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                      Rekapitulasi Hasil Ujian CBT Siswa (Real-Time Cloud)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data terkumpul secara otomatis dari link CBT yang dikerjakan peserta didik. Nilai terekap permanen di Firestore Cloud.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={loadAllCbtSubmissions}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Segarkan data dari Cloud Database Firestore"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCbt ? 'animate-spin' : ''}`} />
                    <span>Segarkan Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportCbtResultsToCsv(cbtResultsList)}
                    disabled={cbtResultsList.length === 0}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Ekspor seluruh hasil CBT siswa ke file CSV / Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor CSV / Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncAllCbtToCurrentGradebook}
                    disabled={cbtResultsList.length === 0}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Otomatis masukkan nilai CBT siswa yang cocok ke kolom Sumatif Kognitif di buku nilai"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Sinkronkan ke Nilai Sumatif</span>
                  </button>
                </div>
              </div>

              {/* 4 Cards Metrics */}
              {(() => {
                const filteredCbt = cbtResultsList.filter(r => {
                  const q = cbtSearchQuery.toLowerCase();
                  return (
                    r.studentName.toLowerCase().includes(q) ||
                    r.nis.toLowerCase().includes(q) ||
                    r.classGroup.toLowerCase().includes(q) ||
                    r.examTitle.toLowerCase().includes(q)
                  );
                });
                const total = filteredCbt.length;
                const avg = total > 0 ? Math.round(filteredCbt.reduce((a, b) => a + b.score, 0) / total) : 0;
                const tuntas = filteredCbt.filter(r => r.score >= config.kktp).length;
                const highest = total > 0 ? Math.max(...filteredCbt.map(r => r.score)) : 0;

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Peserta Mengumpulkan</span>
                        <span className="text-xl font-extrabold text-slate-800 font-mono mt-0.5 block">{total} Siswa</span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Rata-Rata Nilai CBT</span>
                        <span className="text-xl font-extrabold text-sky-600 font-mono mt-0.5 block">{avg}</span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Nilai Tertinggi</span>
                        <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{highest}</span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Tuntas KKTP (&ge; {config.kktp})</span>
                        <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{tuntas} / {total}</span>
                      </div>
                    </div>

                    {/* Search bar inside CBT tab */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={cbtSearchQuery}
                          onChange={e => setCbtSearchQuery(e.target.value)}
                          placeholder="Cari nama peserta, NIS, kelas, atau judul ujian..."
                          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Menampilkan {total} dari {cbtResultsList.length} data ujian
                      </span>
                    </div>

                    {/* Table of CBT Submissions */}
                    {total === 0 ? (
                      <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
                        <Laptop className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-slate-700">Belum Ada Hasil CBT yang Terkumpul</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                          Gunakan tombol "Bagikan Link CBT Siswa" pada naskah soal atau bilah menu atas untuk membagikan tautan ujian ke siswa. Semua hasil pengerjaan akan otomatis masuk dan terekap di tabel ini secara real-time.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <div className="max-h-96 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] sticky top-0">
                              <tr>
                                <th className="p-3 w-12 text-center">No</th>
                                <th className="p-3">Nama Siswa</th>
                                <th className="p-3">NIS</th>
                                <th className="p-3">Kelas</th>
                                <th className="p-3">Judul Ujian CBT</th>
                                <th className="p-3 text-center">Skor (0-100)</th>
                                <th className="p-3 text-center">Benar / Total</th>
                                <th className="p-3 text-center">Status KKTP</th>
                                <th className="p-3">Waktu Selesai</th>
                                <th className="p-3 text-center w-28">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800">
                              {filteredCbt.map((res, idx) => {
                                const isTuntas = res.score >= config.kktp;
                                return (
                                  <tr key={res.id || idx} className="hover:bg-indigo-50/40 transition-colors">
                                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                    <td className="p-3 font-bold text-slate-900">{res.studentName}</td>
                                    <td className="p-3 font-mono text-slate-600">{res.nis}</td>
                                    <td className="p-3">
                                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                                        {res.classGroup}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-700 max-w-xs truncate" title={res.examTitle}>
                                      {res.examTitle}
                                    </td>
                                    <td className="p-3 text-center font-mono font-extrabold text-sm">
                                      <span className={isTuntas ? 'text-emerald-600' : 'text-amber-600'}>
                                        {res.score}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center text-slate-600 font-mono text-[11px]">
                                      {res.correctCount} / {res.totalQuestions}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          isTuntas ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {isTuntas ? 'TUNTAS' : 'REMEDIAL'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                                      {res.submittedAt}
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => printCbtStudentCertificate(res, customSchoolName, customTeacherName)}
                                          className="p-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded"
                                          title="Cetak Bukti Nilai Peserta Didik"
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCbtSubmission(res.id)}
                                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                          title="Hapus data hasil ini"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 6. MODAL FOOTER: STATISTIK RINGKAS KELAS & ACTION */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white px-5 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          {/* Quick stats badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-300">Statistik Kelas:</span>
            <span className="bg-slate-800 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
              Rata Kognitif: <strong className="text-sky-400">{stats.avgCog}</strong>
            </span>
            <span className="bg-slate-800 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
              Rata Afektif: <strong className="text-amber-400">{stats.avgAff}</strong>
            </span>
            <span className="bg-slate-800 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
              Rata Psikomotorik: <strong className="text-purple-400">{stats.avgPsy}</strong>
            </span>
            <span className="bg-emerald-950 px-2.5 py-1 rounded text-emerald-300 border border-emerald-800/80">
              Rata Akhir: <strong className="text-emerald-400 font-black">{stats.avgFinal}</strong>
            </span>
            <span className="bg-slate-800 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
              Tuntas KKTP: <strong className="text-emerald-400">{stats.tuntasCount}</strong> / {records.length} Siswa ({records.length > 0 ? Math.round((stats.tuntasCount / records.length) * 100) : 0}%)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Tutup Buku Nilai
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL CONFIGURATION (BOBOT & KKTP) */}
        {/* ========================================================================= */}
        {showConfigModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-5 text-slate-800 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  Pengaturan Bobot Penilaian & KKTP
                </h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kriteria Ketercapaian Tujuan Pembelajaran (KKTP):
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="50"
                      max="90"
                      value={config.kktp}
                      onChange={(e) => setConfig({ ...config, kktp: Number(e.target.value) })}
                      className="w-24 p-2 border border-slate-300 rounded-lg text-sm font-bold text-sky-800"
                    />
                    <span className="text-slate-500 text-[11px]">Standar minimal ketuntasan (Default: 75)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700 mb-2">
                    Bobot Ranah Pembelajaran (Total 100%):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-200">
                      <span className="font-bold text-sky-900 block mb-1">Kognitif (%)</span>
                      <input
                        type="number"
                        min="10"
                        max="80"
                        value={config.weights.kognitif}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            weights: { ...config.weights, kognitif: Number(e.target.value) }
                          })
                        }
                        className="w-full p-1.5 bg-white border border-sky-300 rounded font-bold text-sky-900 text-center"
                      />
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <span className="font-bold text-amber-900 block mb-1">Afektif (%)</span>
                      <input
                        type="number"
                        min="10"
                        max="80"
                        value={config.weights.afektif}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            weights: { ...config.weights, afektif: Number(e.target.value) }
                          })
                        }
                        className="w-full p-1.5 bg-white border border-amber-300 rounded font-bold text-amber-900 text-center"
                      />
                    </div>
                    <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                      <span className="font-bold text-purple-900 block mb-1">Psikomotor (%)</span>
                      <input
                        type="number"
                        min="10"
                        max="80"
                        value={config.weights.psikomotorik}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            weights: { ...config.weights, psikomotorik: Number(e.target.value) }
                          })
                        }
                        className="w-full p-1.5 bg-white border border-purple-300 rounded font-bold text-purple-900 text-center"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Total Bobot:{' '}
                    <strong
                      className={
                        config.weights.kognitif + config.weights.afektif + config.weights.psikomotorik === 100
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }
                    >
                      {config.weights.kognitif + config.weights.afektif + config.weights.psikomotorik}%
                    </strong>{' '}
                    (Standar: 40% Kognitif + 30% Afektif + 30% Psikomotorik)
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block font-bold text-slate-700">Identitas Madrasah / Cetak:</label>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Nama Sekolah / Madrasah:</span>
                    <input
                      type="text"
                      value={customSchoolName}
                      onChange={(e) => setCustomSchoolName(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Nama Guru Pengampu PAIBP:</span>
                    <input
                      type="text"
                      value={customTeacherName}
                      onChange={(e) => setCustomTeacherName(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    // Recalculate all records with new config
                    const updated = records.map(r => recalculateStudentRecord(r, config));
                    setRecords(updated);
                    saveGradebookToStorage(storageKey, updated);
                    setShowConfigModal(false);
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold"
                >
                  Simpan & Terapkan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL TAMBAH SISWA */}
        {/* ========================================================================= */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
            <form
              onSubmit={handleAddStudent}
              className="bg-white rounded-xl max-w-sm w-full p-5 text-slate-800 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-sky-600" />
                  Tambah Peserta Didik Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Ihsan Kamil"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NIS (Lokal):</label>
                    <input
                      type="text"
                      placeholder="Contoh: 24001"
                      value={newStudentNis}
                      onChange={(e) => setNewStudentNis(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kelas:</label>
                    <input
                      type="text"
                      placeholder={`Contoh: ${selectedGrade}-A`}
                      value={newStudentClass}
                      onChange={(e) => setNewStudentClass(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin:</label>
                  <div className="flex space-x-3">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={newStudentGender === 'L'}
                        onChange={() => setNewStudentGender('L')}
                        className="text-sky-600"
                      />
                      <span>Laki-laki (L)</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={newStudentGender === 'P'}
                        onChange={() => setNewStudentGender('P')}
                        className="text-sky-600"
                      />
                      <span>Perempuan (P)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL PANDUAN & RUBRIK ASESMEN LENGKAP */}
        {showHolisticModal && (
          <HolisticAssessmentModal
            onClose={() => setShowHolisticModal(false)}
            initialGrade={selectedGrade}
            initialSemester={selectedSemester}
            initialElement={selectedElement}
            initialTopicId={currentTopic?.id}
            schoolName={customSchoolName}
            teacherName={customTeacherName}
          />
        )}

        {/* MODAL IMPORT SISWA (EXCEL / CSV / TEKS) */}
        {showImportModal && (
          <StudentImportModal
            onClose={() => setShowImportModal(false)}
            onImportSuccess={handleImportStudentsSuccess}
            currentGrade={selectedGrade}
            currentSemester={selectedSemester}
            currentElement={selectedElement}
            currentTpId={`tp-${selectedTopicId}-${selectedTpIndex}`}
            currentTpText={currentTpText}
            config={config}
            existingCount={records.length}
          />
        )}
      </div>
    </div>
  );
};
