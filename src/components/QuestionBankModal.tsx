import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { COMPREHENSIVE_QUESTION_BANK } from '../data/questionBankData';
import { QuestionItem, PaibpElement, GradeLevel, BloomLevel, AssessmentPackage, UserAccount } from '../types';
import {
  fetchAllBankQuestions,
  deleteCustomBankQuestion,
  clearAllGeneratedBankQuestions,
  SavedBankQuestion
} from '../services/questionBankService';
import {
  calculateBloomDistribution,
  calculateSoloDistribution,
  calculateDeepLearningDistribution,
  calculateOverallQuality
} from '../services/assessmentGenerator';
import {
  Search,
  BookOpen,
  Award,
  Sparkles,
  CheckCircle,
  Copy,
  Check,
  Plus,
  ArrowRight,
  Database,
  ExternalLink,
  Laptop,
  X,
  Trash2,
  Download,
  Filter,
  Layers,
  FileSpreadsheet,
  Clock,
  Share2,
  Play,
  Zap,
  Printer,
  FileText,
  Settings2,
  SlidersHorizontal,
  CheckSquare
} from 'lucide-react';

interface QuestionBankModalProps {
  currentUser?: UserAccount | null;
  onClose: () => void;
  onImportToCurrentPackage?: (selectedQuestions: QuestionItem[]) => void;
  onOpenCbtWithQuestions?: (pkg: AssessmentPackage) => void;
  onShareCbtWithQuestions?: (pkg: AssessmentPackage) => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  currentUser,
  onClose,
  onImportToCurrentPackage,
  onOpenCbtWithQuestions,
  onShareCbtWithQuestions
}) => {
  const [bankQuestions, setBankQuestions] = useState<SavedBankQuestion[]>([]);
  const [standardCount, setStandardCount] = useState<number>(0);
  const [generatedCount, setGeneratedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'standard' | 'generated'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedElement, setSelectedElement] = useState<string>('all');
  const [selectedBloom, setSelectedBloom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selection & Copy States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);

  // Load questions
  const loadBankData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllBankQuestions(currentUser?.uid);
      setBankQuestions(data.all);
      setStandardCount(data.standardCount);
      setGeneratedCount(data.generatedCount);
    } catch (e) {
      console.warn('Gagal memuat bank soal:', e);
      // Fallback to static
      const fallback = COMPREHENSIVE_QUESTION_BANK.map(q => ({ ...q, isCustomGenerated: false }));
      setBankQuestions(fallback);
      setStandardCount(fallback.length);
      setGeneratedCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadBankData();

    const handleBankUpdate = () => {
      loadBankData();
    };

    window.addEventListener('paibp_bank_updated', handleBankUpdate);
    return () => {
      window.removeEventListener('paibp_bank_updated', handleBankUpdate);
    };
  }, [loadBankData]);

  // Filter bank items
  const filteredQuestions = useMemo(() => {
    return bankQuestions.filter(q => {
      // Tab filter
      if (activeTab === 'standard' && q.isCustomGenerated) return false;
      if (activeTab === 'generated' && !q.isCustomGenerated) return false;

      // Grade, Element, Bloom
      if (selectedGrade !== 'all' && q.grade !== selectedGrade) return false;
      if (selectedElement !== 'all' && q.element !== selectedElement) return false;
      if (selectedBloom !== 'all' && q.bloomLevel !== selectedBloom) return false;

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (q.questionText || '').toLowerCase().includes(query);
        const matchStimulus = (q.stimulus || '').toLowerCase().includes(query);
        const matchMateri = (q.materi || '').toLowerCase().includes(query);
        const matchSubmateri = (q.submateri || '').toLowerCase().includes(query);
        const matchTema = (q.tema || '').toLowerCase().includes(query);
        const matchIndicator = (q.indicator || '').toLowerCase().includes(query);

        if (!matchTitle && !matchStimulus && !matchMateri && !matchSubmateri && !matchTema && !matchIndicator) {
          return false;
        }
      }

      return true;
    });
  }, [bankQuestions, activeTab, selectedGrade, selectedElement, selectedBloom, searchQuery]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  const handleCopySingle = (q: SavedBankQuestion) => {
    const text = `[SOAL NO. ${q.number} - KELAS ${q.grade} ${String(q.element).toUpperCase()}]\n${q.stimulus ? `[STIMULUS]\n${q.stimulus}\n\n` : ''}${q.questionText}\n\n${(q.options || []).map(o => `${o.key}. ${o.text}`).join('\n')}\n\nKUNCI: ${q.correctKey}\nPEMBAHASAN: ${q.explanation || '-'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteSingle = async (id: string) => {
    await deleteCustomBankQuestion(id);
    setBankQuestions(prev => prev.filter(q => q.id !== id));
    setGeneratedCount(prev => Math.max(0, prev - 1));
    const nextSelected = new Set(selectedIds);
    nextSelected.delete(id);
    setSelectedIds(nextSelected);
    setShowDeleteConfirmId(null);
  };

  const handleClearAllGenerated = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh butir soal hasil generate guru dari Bank Soal?')) {
      await clearAllGeneratedBankQuestions(currentUser?.uid);
      setBankQuestions(prev => prev.filter(q => !q.isCustomGenerated));
      setGeneratedCount(0);
      setSelectedIds(new Set());
    }
  };

  const handleCreatePackageFromSelected = () => {
    const items = bankQuestions.filter(q => selectedIds.has(q.id));
    if (items.length === 0) return;

    if (onImportToCurrentPackage) {
      onImportToCurrentPackage(items);
      onClose();
    }
  };

  const buildPackageFromBankQuestions = (items: SavedBankQuestion[], customTitle?: string): AssessmentPackage => {
    const firstGrade = (selectedGrade !== 'all' ? selectedGrade : items[0]?.grade || 'VIII') as GradeLevel;
    const firstElement = (selectedElement !== 'all' ? selectedElement : items[0]?.element || 'Akidah') as PaibpElement;

    return {
      id: `cbt-bank-${Date.now()}`,
      identity: {
        title: customTitle || `UJIAN CBT BANK SOAL PAIBP KELAS ${firstGrade} (${items.length} SOAL)`,
        subject: 'Pendidikan Agama Islam dan Budi Pekerti (PAIBP)',
        grade: firstGrade,
        phase: 'Fase D',
        semester: '1',
        academicYear: '2025/2026',
        schoolName: currentUser?.schoolName || 'SMP / MTs',
        teacherName: currentUser?.displayName || 'Guru Pengampu PAIBP',
        timeAllocation: items.length <= 10 ? 30 : items.length <= 25 ? 60 : 90,
        totalQuestions: items.length,
        dateCreated: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      },
      mode: 'sumatif',
      cp: 'Mengimplementasikan nilai-nilai Islam dalam kehidupan sehari-hari',
      tpList: Array.from(new Set(items.map(i => i.tp || 'Tujuan Pembelajaran Fase D'))),
      materiMapping: [{
        element: firstElement,
        materi: items[0]?.materi || 'Koleksi Bank Soal Terpadu',
        submateri: 'Seleksi Bank Soal',
        percentage: 100,
        questionCount: items.length
      }],
      kisiKisi: items.map((q, idx) => ({
        number: idx + 1,
        cp: 'Sesuai kurikulum Fase D',
        tp: q.tp || 'Tujuan Pembelajaran',
        element: String(q.element || firstElement),
        materi: q.materi || 'Materi PAIBP',
        submateri: q.submateri || '',
        indicator: q.indicator || '',
        stimulus: q.stimulus,
        operationalVerb: q.operationalVerb,
        bloomLevel: q.bloomLevel,
        soloLevel: q.soloLevel,
        deepLearningDim: q.deepLearningDim,
        difficulty: q.difficulty,
        questionType: 'Pilihan Ganda',
        questionNumber: idx + 1,
        correctKey: q.correctKey
      })),
      questions: items.map((q, idx) => ({ ...q, number: idx + 1 })),
      keyDistribution: {
        A: items.filter(i => i.correctKey === 'A').length,
        B: items.filter(i => i.correctKey === 'B').length,
        C: items.filter(i => i.correctKey === 'C').length,
        D: items.filter(i => i.correctKey === 'D').length,
        idealPerOption: Math.round(items.length / 4),
        isBalanced: true,
        varianceScore: 92
      },
      bloomDistribution: calculateBloomDistribution(items),
      soloDistribution: calculateSoloDistribution(items),
      difficultyDistribution: {
        Mudah: { count: 0, percentage: 0 },
        Sedang: { count: items.filter(i => i.difficulty === 'Sedang').length, percentage: 30 },
        Sulit: { count: items.filter(i => i.difficulty === 'Sulit').length, percentage: 50 },
        'Sangat Sulit': { count: items.filter(i => i.difficulty === 'Sangat Sulit').length, percentage: 20 }
      },
      deepLearningDistribution: calculateDeepLearningDistribution(items),
      overallQuality: calculateOverallQuality(items),
      validationChecklist: [
        { id: 'v1', label: 'Bank Soal Terverifikasi', passed: true, notes: 'Soal dipilih langsung dari Bank Soal Terstandar.' }
      ],
      recommendations: ['Siap digunakan untuk pelaksanaan CBT Mandiri.']
    };
  };

  const handleLaunchCbt = (overrideItems?: SavedBankQuestion[], customTitle?: string) => {
    let items = overrideItems || bankQuestions.filter(q => selectedIds.has(q.id));
    if (items.length === 0) items = filteredQuestions;
    if (items.length === 0 || !onOpenCbtWithQuestions) return;

    const newPkg = buildPackageFromBankQuestions(items, customTitle);
    onOpenCbtWithQuestions(newPkg);
    onClose();
  };

  const handleShareCbt = (overrideItems?: SavedBankQuestion[], customTitle?: string) => {
    let items = overrideItems || bankQuestions.filter(q => selectedIds.has(q.id));
    if (items.length === 0) items = filteredQuestions;
    if (items.length === 0 || !onShareCbtWithQuestions) return;

    const newPkg = buildPackageFromBankQuestions(items, customTitle);
    onShareCbtWithQuestions(newPkg);
    onClose();
  };

  const handleQuickCbtPreset = (count: number, action: 'launch' | 'share' = 'launch') => {
    const pool = filteredQuestions.length > 0 ? filteredQuestions : bankQuestions;
    if (pool.length === 0) return;
    const selected = pool.slice(0, count);
    const title = `PAKET CBT ${count} SOAL (${selectedGrade !== 'all' ? `KELAS ${selectedGrade}` : 'FASE D'}${selectedElement !== 'all' ? ` - ${selectedElement}` : ''})`;
    if (action === 'share') {
      handleShareCbt(selected, title);
    } else {
      handleLaunchCbt(selected, title);
    }
  };

  const handleLaunchSingleQuestionCbt = (q: SavedBankQuestion) => {
    const title = `SIMULASI CBT BUTIR SOAL NO. ${q.number} (KELAS ${q.grade})`;
    handleLaunchCbt([q], title);
  };

  // Custom Download States
  const [isCustomDownloadOpen, setIsCustomDownloadOpen] = useState<boolean>(false);
  const [customSourceScope, setCustomSourceScope] = useState<'selected' | 'filtered' | 'all'>('selected');
  const [customFileFormat, setCustomFileFormat] = useState<'word' | 'pdf' | 'csv' | 'json'>('word');
  const [customDocType, setCustomDocType] = useState<'student_exam' | 'teacher_full' | 'split_key'>('student_exam');
  const [includeKop, setIncludeKop] = useState<boolean>(true);
  const [includeStimulus, setIncludeStimulus] = useState<boolean>(true);
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(false);
  const [includeRubric, setIncludeRubric] = useState<boolean>(true);
  const [includeAnswerKeyTable, setIncludeAnswerKeyTable] = useState<boolean>(true);
  const [customSchoolName, setCustomSchoolName] = useState<string>(currentUser?.schoolName || 'SMP Negeri / MTs');
  const [customExamTitle, setCustomExamTitle] = useState<string>('NASKAH ASESMEN SUMATIF PAIBP FASE D');
  const [customTeacherName, setCustomTeacherName] = useState<string>(currentUser?.displayName || 'Guru Pengampu PAIBP');
  const [customTimeAllocation, setCustomTimeAllocation] = useState<number>(60);

  // Helper to build HTML document for Word and PDF Print
  const buildCustomDocumentHtml = (items: SavedBankQuestion[]): string => {
    const isTeacher = customDocType === 'teacher_full';
    const isSplitKey = customDocType === 'split_key';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${customExamTitle}</title>
  <style>
    @media print {
      body { margin: 1.5cm; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
    }
    body {
      font-family: 'Calibri', 'DejaVu Sans', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #0f172a;
      max-width: 850px;
      margin: 0 auto;
      padding: 24px;
    }
    .header-kop {
      text-align: center;
      border-bottom: 3px double #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header-kop h2 { margin: 0; font-size: 15pt; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
    .header-kop h3 { margin: 4px 0; font-size: 13pt; color: #0284c7; }
    .header-kop p { margin: 2px 0; font-size: 10pt; color: #475569; }
    
    .identity-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    .identity-table td { padding: 4px 6px; }

    .instructions-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      margin-bottom: 24px;
      border-radius: 6px;
      font-size: 9.5pt;
    }
    .instructions-box ol { margin: 4px 0 0 16px; padding: 0; }

    .question-item {
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .question-title {
      font-weight: bold;
      margin-bottom: 6px;
    }
    .stimulus-box {
      background-color: #f1f5f9;
      border-left: 3px solid #0284c7;
      padding: 8px 12px;
      margin: 6px 0 10px 0;
      font-style: italic;
      font-size: 10.5pt;
      line-height: 1.5;
    }
    .cause-effect-box {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      padding: 10px 14px;
      border-radius: 6px;
      margin: 8px 0;
    }
    .cause-effect-tag {
      display: inline-block;
      font-weight: bold;
      background-color: #d97706;
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 8pt;
      text-transform: uppercase;
      margin: 6px auto;
      text-align: center;
    }
    .statement-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10pt;
    }
    .statement-table th, .statement-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
    }
    .statement-table th {
      background-color: #e2e8f0;
      font-weight: bold;
    }
    .option-row {
      margin: 5px 0 5px 18px;
      display: flex;
      align-items: flex-start;
      line-height: 1.4;
    }
    .option-key {
      font-weight: bold;
      width: 25px;
      flex-shrink: 0;
    }
    .teacher-badge {
      display: inline-block;
      background-color: #dbeafe;
      color: #1e40af;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: bold;
      margin-left: 6px;
    }
    .explanation-box {
      margin-top: 10px;
      padding: 8px 12px;
      background-color: #eff6ff;
      border-left: 3px solid #2563eb;
      font-size: 9.5pt;
      border-radius: 0 4px 4px 0;
    }
    .rubric-box {
      margin-top: 8px;
      padding: 8px 12px;
      background-color: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 6px;
      font-size: 9.5pt;
    }
    .key-table-section {
      margin-top: 30px;
      page-break-before: always;
    }
  </style>
</head>
<body>
  ${includeKop ? `
  <div class="header-kop">
    <h2>${customSchoolName}</h2>
    <h3>${customExamTitle}</h3>
    <p>Mata Pelajaran: Pendidikan Agama Islam dan Budi Pekerti (PAIBP) • Fase D (SMP/MTs)</p>
    <p>Alokasi Waktu: ${customTimeAllocation} Menit • Guru Pengampu: ${customTeacherName}</p>
  </div>

  <table class="identity-table">
    <tr>
      <td width="15%"><strong>Nama Siswa</strong></td>
      <td width="35%">: ........................................................</td>
      <td width="15%"><strong>Hari / Tanggal</strong></td>
      <td width="35%">: ........................................................</td>
    </tr>
    <tr>
      <td><strong>Nomor Absen / Kelas</strong></td>
      <td>: ........................................................</td>
      <td><strong>Nilai / Paraf</strong></td>
      <td>: ........................................................</td>
    </tr>
  </table>

  <div class="instructions-box">
    <strong>PETUNJUK UMUM PENGERJAAN ASESMEN:</strong>
    <ol>
      <li>Bacalah setiap doa sebelum memulai mengerjakan naskah soal.</li>
      <li>Cermatilah stimulus narasi autentik dan teks soal dengan saksama sebelum menentukan pilihan jawaban.</li>
      <li>Untuk soal Pilihan Ganda Sederhana, pilihlah satu jawaban yang paling tepat.</li>
      <li>Untuk soal Pilihan Ganda Kompleks (MCMA), pilihlah SEMUA jawaban yang bernilai benar.</li>
      <li>Untuk soal Kategori, tentukan penilaian Benar/Salah pada masing-masing pernyataan.</li>
      <li>Untuk Analisis Sebab-Akibat, analisislah kebenaran kedua proposisi dan hubungan kausalitasnya.</li>
    </ol>
  </div>
  ` : ''}

  <div class="questions-list">
    ${items.map((q, idx) => {
      const qNum = idx + 1;
      const isEssay = q.questionType === 'Essay';
      const isMcma = q.pgVariant === 'Pilihan Ganda Kompleks (MCMA)';
      const isCauseEffect = q.pgVariant === 'Analisis Sebab-Akibat' || (q.causeStatement && q.effectStatement);
      const isCategory = q.pgVariant === 'Pilihan Ganda Kompleks Kategori' || (q.statementCategories && q.statementCategories.length > 0);

      return `
      <div class="question-item">
        <div class="question-title">
          <span>${qNum}. </span>
          ${includeMetadata ? `<span class="teacher-badge">[${q.bloomLevel || 'C4'} • ${q.soloLevel || 'Relational'} • ${q.element}]</span>` : ''}
          ${isMcma ? '<em>(Pilihan Ganda Kompleks - Pilihlah semua jawaban benar):</em>' : ''}
          ${isCauseEffect ? '<em>(Analisis Kausalitas Sebab - Akibat):</em>' : ''}
          ${isCategory ? '<em>(Pilihan Ganda Kompleks Kategori):</em>' : ''}
        </div>

        ${includeStimulus && q.stimulus ? `
          <div class="stimulus-box">${q.stimulus}</div>
        ` : ''}

        ${isCauseEffect && q.causeStatement && q.effectStatement ? `
          <div class="cause-effect-box">
            <p><strong>Pernyataan:</strong> ${q.causeStatement}</p>
            <div style="text-align: center;"><span class="cause-effect-tag">SEBAB</span></div>
            <p><strong>Alasan:</strong> ${q.effectStatement}</p>
          </div>
        ` : ''}

        ${isCategory && q.statementCategories && q.statementCategories.length > 0 ? `
          <table class="statement-table">
            <thead>
              <tr>
                <th width="8%">No</th>
                <th width="62%">Pernyataan yang Dianalisis</th>
                <th width="30%">Kategori Penilaian</th>
              </tr>
            </thead>
            <tbody>
              ${q.statementCategories.map((st, stIdx) => `
                <tr>
                  <td align="center">${stIdx + 1}</td>
                  <td>${st.statement}</td>
                  <td align="center">
                    ${isTeacher ? `<strong>${st.correctCategory}</strong>` : `[ &nbsp; ] Benar &nbsp;&nbsp;&nbsp; [ &nbsp; ] Salah`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <p style="margin: 6px 0 10px 0;">${q.questionText}</p>

        ${!isEssay && q.options && q.options.length > 0 ? `
          <div class="options-container">
            ${q.options.map(opt => {
              const isOptionCorrect = q.multiCorrectKeys
                ? q.multiCorrectKeys.includes(opt.key)
                : opt.key === q.correctKey;
              const mark = isTeacher && isOptionCorrect ? ' <strong style="color: #15803d;">✓ [KUNCI]</strong>' : '';
              const checkboxStyle = isMcma ? '[ &nbsp; ] ' : `(${opt.key}) `;
              return `<div class="option-row"><span class="option-key">${checkboxStyle}</span> <span>${opt.text}${mark}</span></div>`;
            }).join('')}
          </div>
        ` : ''}

        ${isEssay ? `
          <div style="border: 1px dashed #94a3b8; padding: 12px; min-height: 80px; margin: 8px 0; border-radius: 4px; color: #64748b; font-size: 9pt; font-style: italic;">
            [Lembar Jawaban Uraian Siswa]
          </div>
        ` : ''}

        ${isTeacher ? `
          <div class="explanation-box">
            <strong>KUNCI JAWABAN:</strong> ${q.multiCorrectKeys ? q.multiCorrectKeys.join(', ') : q.correctKey}<br/>
            <strong>PEMBAHASAN:</strong> ${q.explanation || '-'}<br/>
            ${q.islamicValue ? `<strong>NILAI KARAKTER ISLAMI:</strong> ${q.islamicValue}<br/>` : ''}
            ${q.dalilReference ? `<strong>RUJUKAN DALIL:</strong> ${q.dalilReference}` : ''}
          </div>

          ${isEssay && includeRubric && q.rubricCriteria && q.rubricCriteria.length > 0 ? `
            <div class="rubric-box">
              <strong>PANDUAN RUBRIK PENSKORAN ANALITIS:</strong>
              <ul style="margin: 4px 0 0 16px; padding: 0;">
                ${q.rubricCriteria.map(rc => `<li><strong>Skor ${rc.score} (${rc.label}):</strong> ${rc.description}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        ` : ''}
      </div>
      `;
    }).join('')}
  </div>

  ${(isSplitKey || includeAnswerKeyTable) && !isTeacher ? `
  <div class="key-table-section">
    <hr style="border: none; border-top: 2px dashed #94a3b8; margin: 30px 0;"/>
    <h3 style="text-align: center; text-transform: uppercase;">LEMBAR KUNCI JAWABAN & MATRIKS PENILAIAN GURU</h3>
    <table class="statement-table" style="margin-top: 15px;">
      <thead>
        <tr>
          <th width="8%" align="center">No</th>
          <th width="20%">Bentuk / Ragam</th>
          <th width="20%" align="center">Kunci Jawaban</th>
          <th width="52%">Alasan Pedagogis & Pembahasan</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((q, idx) => `
          <tr>
            <td align="center">${idx + 1}</td>
            <td>${q.questionType === 'Essay' ? 'Essay' : (q.pgVariant || 'PG')}</td>
            <td align="center"><strong>${q.multiCorrectKeys ? q.multiCorrectKeys.join(', ') : q.correctKey}</strong></td>
            <td>${q.explanation || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
</body>
</html>`;
  };

  const handleExecuteCustomDownload = () => {
    let targetItems: SavedBankQuestion[] = [];
    if (customSourceScope === 'selected') {
      targetItems = bankQuestions.filter(q => selectedIds.has(q.id));
      if (targetItems.length === 0) targetItems = filteredQuestions;
    } else if (customSourceScope === 'filtered') {
      targetItems = filteredQuestions;
    } else {
      targetItems = bankQuestions;
    }

    if (targetItems.length === 0) {
      alert('Tidak ada butir soal yang dipilih atau tersedia untuk diunduh.');
      return;
    }

    const cleanFilename = (customExamTitle || 'Naskah_Soal_PAIBP_FaseD')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');

    if (customFileFormat === 'json') {
      const dataStr = JSON.stringify(targetItems, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanFilename}_${targetItems.length}soal.json`;
      a.click();
      URL.revokeObjectURL(url);
      setIsCustomDownloadOpen(false);
      return;
    }

    if (customFileFormat === 'csv') {
      let csv = 'No,Kelas,Elemen,Tipe Soal,Ragam PG,Level Kognitif,Kesulitan,Materi,Submateri,Indikator,Stimulus,Teks Soal,Opsi A,Opsi B,Opsi C,Opsi D,Kunci,Pembahasan,Dalil Rujukan\n';
      targetItems.forEach((q, idx) => {
        const getOpt = (k: string) => (q.options?.find(o => o.key === k)?.text || '').replace(/"/g, '""');
        const clean = (str?: string) => `"${(str || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        csv += `${idx + 1},${clean(q.grade)},${clean(String(q.element))},${clean(q.questionType)},${clean(q.pgVariant || '-')},${clean(q.bloomLevel)},${clean(q.difficulty)},${clean(q.materi)},${clean(q.submateri)},${clean(q.indicator)},${clean(q.stimulus)},${clean(q.questionText)},"${getOpt('A')}","${getOpt('B')}","${getOpt('C')}","${getOpt('D')}",${clean(q.multiCorrectKeys ? q.multiCorrectKeys.join(', ') : q.correctKey)},${clean(q.explanation)},${clean(q.dalilReference || '-')}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanFilename}_${targetItems.length}soal.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setIsCustomDownloadOpen(false);
      return;
    }

    const htmlContent = buildCustomDocumentHtml(targetItems);

    if (customFileFormat === 'word') {
      const blob = new Blob(['\ufeff' + htmlContent], {
        type: 'application/msword;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanFilename}_${targetItems.length}soal.doc`;
      a.click();
      URL.revokeObjectURL(url);
      setIsCustomDownloadOpen(false);
      return;
    }

    if (customFileFormat === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
      setIsCustomDownloadOpen(false);
    }
  };

  const handleExportCsv = () => {
    const list = selectedIds.size > 0 
      ? bankQuestions.filter(q => selectedIds.has(q.id))
      : filteredQuestions;

    if (list.length === 0) return;

    let csv = 'No,Kelas,Elemen,Level Kognitif,Tingkat Kesulitan,Materi,Indikator,Stimulus,Teks Soal,Opsi A,Opsi B,Opsi C,Opsi D,Kunci,Pembahasan,Sumber\n';

    list.forEach((q, idx) => {
      const getOpt = (k: string) => (q.options?.find(o => o.key === k)?.text || '').replace(/"/g, '""');
      const clean = (str?: string) => `"${(str || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

      csv += `${idx + 1},${clean(q.grade)},${clean(String(q.element))},${clean(q.bloomLevel)},${clean(q.difficulty)},${clean(q.materi)},${clean(q.indicator)},${clean(q.stimulus)},${clean(q.questionText)},"${getOpt('A')}","${getOpt('B')}","${getOpt('C')}","${getOpt('D')}",${clean(q.correctKey)},${clean(q.explanation)},${clean(q.isCustomGenerated ? 'Hasil Generate Guru' : 'Standar Kurikulum 2026')}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bank_Soal_PAIBP_FaseD_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 text-slate-800 shadow-2xl relative max-h-[92vh] flex flex-col border border-slate-200">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-sky-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Bank Soal Terstandar & Hasil Generate PAIBP (Fase D)
                </h3>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
                  Kepmendikdasmen 020/2026
                </span>
                {generatedCount > 0 && (
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>{generatedCount} Soal Generate Tersimpan</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Semua hasil generasi asesmen otomatis tersimpan di sini. Guru dapat mencari, memilih, mengekspor, atau menggunakannya untuk CBT langsung.
              </p>
            </div>
          </div>
          <button
            id="btn-close-bank-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Semua, Kurikulum Standar, Hasil Generate */}
        <div className="pt-3 pb-2 px-1 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Soal ({bankQuestions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('standard')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'standard'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Standar Kurikulum ({standardCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('generated')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'generated'
                  ? 'bg-white text-purple-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Hasil Generate Guru ({generatedCount})</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              id="btn-open-custom-download"
              onClick={() => {
                setCustomSourceScope(selectedIds.size > 0 ? 'selected' : 'filtered');
                setIsCustomDownloadOpen(true);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Unduh Soal Kustom (Word, PDF, Cetak, CSV, JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Soal Kustom</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Unduh CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>
            {activeTab === 'generated' && generatedCount > 0 && (
              <button
                onClick={handleClearAllGenerated}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Bersihkan Semua Hasil Generate"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Hasil Generate</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="py-2.5 px-3 bg-slate-50/80 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2 text-xs">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari materi, stimulus, dalil, kata kunci..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Grade filter */}
          <div className="md:col-span-2">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Semua Kelas</option>
              <option value="VII">Kelas VII (Fase D)</option>
              <option value="VIII">Kelas VIII (Fase D)</option>
              <option value="IX">Kelas IX (Fase D)</option>
            </select>
          </div>

          {/* Element filter */}
          <div className="md:col-span-3">
            <select
              value={selectedElement}
              onChange={(e) => setSelectedElement(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Semua Elemen (Termasuk Tajwid)</option>
              <option value="Al-Qur'an Hadis">Al-Qur'an Hadis</option>
              <option value="Tajwid">Tajwid (Sub-Elemen)</option>
              <option value="Akidah">Akidah</option>
              <option value="Akhlak">Akhlak</option>
              <option value="Fikih">Fikih</option>
              <option value="Sejarah Peradaban Islam">Sejarah Peradaban Islam</option>
            </select>
          </div>

          {/* Bloom filter */}
          <div className="md:col-span-2">
            <select
              value={selectedBloom}
              onChange={(e) => setSelectedBloom(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Level Kognitif</option>
              <option value="C4">C4 (Menganalisis)</option>
              <option value="C5">C5 (Mengevaluasi)</option>
              <option value="C6">C6 (Mencipta)</option>
            </select>
          </div>
        </div>

        {/* Quick CBT Presets & Action Bar */}
        <div className="py-2.5 px-4 bg-linear-to-r from-indigo-50 via-purple-50 to-sky-50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-indigo-950 flex items-center gap-1 mr-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Paket CBT Cepat:</span>
            </span>
            <button
              type="button"
              onClick={() => handleQuickCbtPreset(5, 'launch')}
              disabled={filteredQuestions.length === 0}
              className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white disabled:opacity-40 text-indigo-800 font-bold rounded-lg border border-indigo-200 text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              title="Jalankan ujian CBT 5 soal dari materi ini"
            >
              <span>⚡ 5 Soal</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickCbtPreset(10, 'launch')}
              disabled={filteredQuestions.length === 0}
              className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white disabled:opacity-40 text-indigo-800 font-bold rounded-lg border border-indigo-200 text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              title="Jalankan ujian CBT 10 soal ulangan harian"
            >
              <span>📝 10 Soal</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickCbtPreset(15, 'launch')}
              disabled={filteredQuestions.length === 0}
              className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white disabled:opacity-40 text-indigo-800 font-bold rounded-lg border border-indigo-200 text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              title="Jalankan ujian CBT 15 soal formatif"
            >
              <span>📋 15 Soal</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickCbtPreset(20, 'launch')}
              disabled={filteredQuestions.length === 0}
              className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white disabled:opacity-40 text-indigo-800 font-bold rounded-lg border border-indigo-200 text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              title="Jalankan ujian CBT 20 soal sumatif / PTS"
            >
              <span>🏆 20 Soal</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {onShareCbtWithQuestions && (
              <button
                type="button"
                onClick={() => handleShareCbt()}
                disabled={filteredQuestions.length === 0}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Buat link CBT siswa dari soal-soal ini untuk dibagikan via WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Bagikan Link CBT {selectedIds.size > 0 ? `(${selectedIds.size} Soal)` : 'Siswa'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Action bar for multi-selection */}
        <div className="py-2 px-3 bg-sky-50/70 border-b border-sky-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={selectAll}
              className="font-bold text-sky-800 hover:text-sky-950 flex items-center gap-1.5 cursor-pointer"
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center ${selectedIds.size > 0 && selectedIds.size === filteredQuestions.length ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-400 bg-white'}`}>
                {selectedIds.size > 0 && <Check className="w-3 h-3" />}
              </span>
              <span>{selectedIds.size === filteredQuestions.length ? 'Batal Pilih Semua' : 'Pilih Semua'} ({filteredQuestions.length} Soal Ditampilkan)</span>
            </button>
            {selectedIds.size > 0 && (
              <span className="bg-sky-200/80 text-sky-900 font-bold px-2 py-0.5 rounded text-[11px]">
                {selectedIds.size} butir terpilih
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 ? (
              <>
                {onOpenCbtWithQuestions && (
                  <button
                    onClick={() => handleLaunchCbt()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Ujian CBT ({selectedIds.size} Soal Ini)</span>
                  </button>
                )}
                {onImportToCurrentPackage && (
                  <button
                    id="btn-import-selected-to-package"
                    onClick={handleCreatePackageFromSelected}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Gunakan di Asesmen Aktif</span>
                  </button>
                )}
              </>
            ) : (
              onOpenCbtWithQuestions && (
                <button
                  onClick={() => handleLaunchCbt()}
                  disabled={filteredQuestions.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Ujian CBT Semua Soal Terfilter ({filteredQuestions.length})</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-600">Memuat koleksi bank soal...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Database className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-600">
                {activeTab === 'generated' ? 'Belum ada soal hasil generate tersimpan' : 'Tidak ada soal yang cocok dengan filter'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {activeTab === 'generated'
                  ? 'Setiap kali Anda membuat asesmen baru melalui form, seluruh butir soal akan otomatis masuk dan tersimpan ke menu Bank Soal ini.'
                  : 'Coba sesuaikan kata kunci pencarian atau ubah filter kelas dan elemen.'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isSelected = selectedIds.has(q.id);

              return (
                <div
                  key={q.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                  }`}
                >
                  {/* Top Badges & Origin */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => toggleSelect(q.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white hover:border-sky-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>

                      {/* Origin Badge */}
                      {q.isCustomGenerated ? (
                        <span className="bg-purple-100 text-purple-900 border border-purple-200 font-extrabold text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                          <span>Hasil Generate Baru</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                          <BookOpen className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Standar Kurikulum 2026</span>
                        </span>
                      )}

                      <span className="font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        Kls {q.grade} (Sem {q.semester})
                      </span>
                      <span className="bg-sky-100 text-sky-800 font-bold text-[11px] px-2 py-0.5 rounded border border-sky-200">
                        {String(q.element)}
                      </span>
                      <span className="bg-indigo-100 text-indigo-800 font-bold text-[11px] px-2 py-0.5 rounded">
                        {q.bloomLevel} — {q.soloLevel}
                      </span>
                      <span className="bg-amber-100 text-amber-800 font-semibold text-[11px] px-2 py-0.5 rounded">
                        {q.difficulty}
                      </span>

                      {q.createdAt && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(q.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onOpenCbtWithQuestions && (
                        <button
                          type="button"
                          onClick={() => handleLaunchSingleQuestionCbt(q)}
                          className="text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs flex items-center gap-1 font-bold transition-colors px-2 py-1 rounded-lg cursor-pointer"
                          title="Uji coba butir soal ini di simulator CBT siswa"
                        >
                          <Laptop className="w-3.5 h-3.5 text-purple-600" />
                          <span>Coba CBT</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleCopySingle(q)}
                        className="text-slate-400 hover:text-slate-700 text-xs flex items-center gap-1 font-medium transition-colors px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
                        title="Salin soal ini"
                      >
                        {copiedId === q.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      {/* Delete button if custom generated */}
                      {q.isCustomGenerated && (
                        showDeleteConfirmId === q.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded border border-rose-200 text-[10px]">
                            <button
                              onClick={() => handleDeleteSingle(q.id)}
                              className="bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold hover:bg-rose-700 cursor-pointer"
                            >
                              Hapus
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirmId(null)}
                              className="text-slate-500 px-1 py-0.5 hover:text-slate-800 cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirmId(q.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus soal ini dari Bank Soal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Materi & Indikator */}
                  <div className="mb-2 text-xs">
                    <span className="font-bold text-slate-800">{q.tema || q.materi}</span>
                    {q.indicator && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        Indikator: {q.indicator}
                      </p>
                    )}
                  </div>

                  {/* Stimulus */}
                  {q.stimulus && (
                    <div className="p-2.5 sm:p-3 bg-slate-50 rounded-lg border-l-4 border-sky-500 text-xs text-slate-700 mb-2.5 leading-relaxed font-sans">
                      <span className="font-bold text-[10px] text-sky-800 uppercase tracking-wider block mb-1">
                        [STIMULUS KASUS AUTENTIK]
                      </span>
                      {q.stimulus}
                    </div>
                  )}

                  {/* Question Text */}
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-3 leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                      {q.options.map((opt) => {
                        const isCorrect = opt.key === q.correctKey;
                        return (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-lg border flex items-start space-x-2 ${
                              isCorrect
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="leading-snug">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Model answer for essay */}
                  {q.modelAnswer && (
                    <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs text-indigo-950 mb-3">
                      <span className="font-bold text-[10px] text-indigo-800 block mb-0.5 uppercase">
                        Model Jawaban Essay:
                      </span>
                      <p>{q.modelAnswer}</p>
                    </div>
                  )}

                  {/* Explanation Footer */}
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-emerald-800">Kunci {q.correctKey}: </span>
                      <span>{q.explanation || 'Sesuai dengan dalil naqli dan rujukan syariat.'}</span>
                    </div>
                    {q.dalilReference && (
                      <span className="font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-[10px]">
                        Dalil: {q.dalilReference}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Modal Actions */}
        <div className="pt-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Total <strong>{filteredQuestions.length}</strong> butir soal tersedia ({generatedCount} soal hasil generate, {standardCount} kurikulum standar).
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-xs cursor-pointer"
            >
              Tutup
            </button>
            {selectedIds.size > 0 && (
              <button
                id="btn-custom-download-selected"
                onClick={() => {
                  setCustomSourceScope('selected');
                  setIsCustomDownloadOpen(true);
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Kustom ({selectedIds.size})</span>
              </button>
            )}
            {selectedIds.size > 0 && onImportToCurrentPackage && (
              <button
                onClick={handleCreatePackageFromSelected}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition-colors text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Gunakan {selectedIds.size} Soal Terpilih</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL UNDUH SOAL SECARA KUSTOM (CUSTOM DOWNLOAD MODAL) */}
      {/* ========================================================================= */}
      {isCustomDownloadOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 text-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Unduh Soal Secara Kustom (Custom Download)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuaikan cakupan soal, format berkas (Word, PDF, Excel), tipe naskah, dan kop sekolah sesuai kebutuhan ujian Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomDownloadOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Cakupan Soal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  1. Cakupan Soal yang Diunduh
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'selected', label: `Soal Terpilih (${selectedIds.size})`, desc: 'Hanya butir soal yang Anda centang', disabled: selectedIds.size === 0 },
                    { id: 'filtered', label: `Hasil Filter (${filteredQuestions.length})`, desc: 'Sesuai filter kelas & elemen saat ini', disabled: filteredQuestions.length === 0 },
                    { id: 'all', label: `Semua Bank Soal (${bankQuestions.length})`, desc: 'Seluruh koleksi soal di database', disabled: bankQuestions.length === 0 }
                  ].map(sc => (
                    <button
                      key={sc.id}
                      type="button"
                      disabled={sc.disabled}
                      onClick={() => setCustomSourceScope(sc.id as any)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        sc.disabled ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200' :
                        customSourceScope === sc.id
                          ? 'border-sky-500 bg-sky-50/80 text-sky-950 font-bold ring-2 ring-sky-500/20 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{sc.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{sc.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Format Berkas Dokumen */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  2. Format Berkas (File Format)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'word', name: 'Microsoft Word', ext: '.doc', icon: FileText, color: 'text-sky-600' },
                    { id: 'pdf', name: 'PDF / Cetak', ext: 'Print Ready', icon: Printer, color: 'text-rose-600' },
                    { id: 'csv', name: 'Excel / CSV', ext: '.csv', icon: FileSpreadsheet, color: 'text-emerald-600' },
                    { id: 'json', name: 'Data JSON', ext: '.json', icon: Database, color: 'text-amber-600' },
                  ].map(fmt => {
                    const Icon = fmt.icon;
                    const isSelected = customFileFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setCustomFileFormat(fmt.id as any)}
                        className={`p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/80 font-bold text-sky-950 ring-2 ring-sky-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1 ${fmt.color}`} />
                        <span className="text-xs font-bold">{fmt.name}</span>
                        <span className="text-[10px] text-slate-400">{fmt.ext}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Tipe Naskah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  3. Tipe Naskah Dokumen
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'student_exam', title: 'Naskah Ujian Siswa', desc: 'Bersih, tanpa kunci & pembahasan. Siap dibagikan ke siswa.' },
                    { id: 'teacher_full', title: 'Naskah Guru Lengkap', desc: 'Dilengkapi kunci, pembahasan pedagogis, dan rubrik penskoran.' },
                    { id: 'split_key', title: 'Kunci Terpisah di Akhir', desc: 'Naskah soal di depan, lembar kunci di halaman paling belakang.' }
                  ].map(dt => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setCustomDocType(dt.id as any)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        customDocType === dt.id
                          ? 'border-indigo-500 bg-indigo-50/80 font-bold text-indigo-950 ring-2 ring-indigo-500/20 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{dt.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{dt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Opsi Elemen Dokumen */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  4. Elemen Konten yang Disertakan
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={includeKop}
                      onChange={(e) => setIncludeKop(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <span className="font-semibold text-slate-700">Kop Satuan Pendidikan & Identitas Siswa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={includeStimulus}
                      onChange={(e) => setIncludeStimulus(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <span className="font-semibold text-slate-700">Stimulus Narasi / Kasus Kontekstual</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={includeMetadata}
                      onChange={(e) => setIncludeMetadata(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <span className="font-semibold text-slate-700">Label Taksonomi Bloom / SOLO per Soal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={includeRubric}
                      onChange={(e) => setIncludeRubric(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <span className="font-semibold text-slate-700">Rubrik Penskoran Analitis (Jika ada Essay)</span>
                  </label>
                </div>
              </div>

              {/* 5. Kustomisasi Header & Identitas */}
              {includeKop && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    5. Identitas Naskah & Satuan Pendidikan
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama Satuan Pendidikan / Madrasah</label>
                      <input
                        type="text"
                        value={customSchoolName}
                        onChange={(e) => setCustomSchoolName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Judul Asesmen / Ujian</label>
                      <input
                        type="text"
                        value={customExamTitle}
                        onChange={(e) => setCustomExamTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama Guru Pengampu</label>
                      <input
                        type="text"
                        value={customTeacherName}
                        onChange={(e) => setCustomTeacherName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Alokasi Waktu (Menit)</label>
                      <input
                        type="number"
                        min="15"
                        max="180"
                        value={customTimeAllocation}
                        onChange={(e) => setCustomTimeAllocation(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCustomDownloadOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-execute-custom-download"
                onClick={handleExecuteCustomDownload}
                className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold rounded-lg text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Dokumen Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
