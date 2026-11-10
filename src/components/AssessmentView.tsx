import React, { useState } from 'react';
import {
  AssessmentPackage,
  QuestionItem,
} from '../types';
import {
  FileText,
  Table,
  CheckCircle2,
  Layers,
  Award,
  Edit3,
  Download,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  BookOpen,
  Info,
  FileCheck,
  ShieldCheck,
  Laptop,
  Share2
} from 'lucide-react';

interface AssessmentViewProps {
  packageData: AssessmentPackage;
  onEditQuestion: (question: QuestionItem) => void;
  onOpenExport: () => void;
  onOpenSimulator: () => void;
  onOpenCbtConverter?: () => void;
  onOpenQuestionBank?: () => void;
  onOpenGrading?: () => void;
  onOpenHolisticAssessment?: () => void;
  onOpenShareCbt?: () => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  packageData,
  onEditQuestion,
  onOpenExport,
  onOpenSimulator,
  onOpenCbtConverter,
  onOpenQuestionBank,
  onOpenGrading,
  onOpenHolisticAssessment,
  onOpenShareCbt
}) => {
  const [activeTab, setActiveTab] = useState<
    'ringkasan' | 'kisi_kisi' | 'naskah_soal' | 'kunci' | 'taksonomi' | 'kartu_soal' | 'kualitas'
  >('naskah_soal');

  const [showAnswerKeysInExam, setShowAnswerKeysInExam] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterBloom] = useState<string>('all');
  const [filterSolo] = useState<string>('all');

  const questions = packageData.questions || [];

  // Filtered questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch =
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.stimulus?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.indicator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.materi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBloom = filterBloom === 'all' || q.bloomLevel === filterBloom;
    const matchesSolo = filterSolo === 'all' || q.soloLevel === filterSolo;

    return matchesSearch && matchesBloom && matchesSolo;
  });

  // Calculate summary ratios
  const hotsCount = questions.filter(q => ['C4', 'C5', 'C6'].includes(q.bloomLevel)).length;
  const hotsPercentage = Math.round((hotsCount / (questions.length || 1)) * 100);
  const soloDeepCount = questions.filter(q => ['Relational', 'Extended Abstract'].includes(q.soloLevel)).length;
  const soloRelationalPercentage = Math.round((soloDeepCount / (questions.length || 1)) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden mb-12">
      {/* Top Header & Identity */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
              <span className="bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-md">
                Kelas {packageData.identity.grade} ({packageData.identity.phase})
              </span>
              <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200">
                Semester {packageData.identity.semester}
              </span>
              {packageData.tema && (
                <span className="text-emerald-800 bg-emerald-50 text-[11px] font-medium px-2 py-0.5 rounded-md border border-emerald-200">
                  Tema: {packageData.tema}
                </span>
              )}
              <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200">
                Mode: {packageData.mode.toUpperCase()}
              </span>
              <span className="bg-emerald-100 text-emerald-900 text-[11px] font-medium px-2 py-0.5 rounded-md">
                Mutu: {packageData.overallQuality.averageScore}/32 ({packageData.overallQuality.category})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {packageData.identity.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {packageData.identity.schoolName} • Guru: {packageData.identity.teacherName} • Total: {packageData.questions.length} Butir ({packageData.identity.timeAllocation} Menit)
            </p>
          </div>

          {/* Action Buttons: Unified, Clean, Professional */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary CBT Launch */}
            <button
              id="btn-open-simulator"
              onClick={onOpenSimulator}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Jalankan Ujian CBT Langsung untuk Siswa"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Ujian CBT</span>
            </button>

            {/* Share CBT Link */}
            {onOpenShareCbt && (
              <button
                id="btn-open-share-cbt"
                onClick={onOpenShareCbt}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-2 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Bagikan link ujian CBT ke siswa via WhatsApp / Tautan online"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bagikan Link</span>
              </button>
            )}

            {/* Export & Copy */}
            <button
              id="btn-open-export"
              onClick={onOpenExport}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Soal</span>
            </button>

            {/* Buku Nilai */}
            {onOpenGrading && (
              <button
                id="btn-open-grading-assessment"
                onClick={onOpenGrading}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-2 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Buka Buku Penilaian 3 Ranah"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Buku Nilai</span>
              </button>
            )}

            {/* Bank Soal */}
            {onOpenQuestionBank && (
              <button
                id="btn-open-bank-soal"
                onClick={onOpenQuestionBank}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-2 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Buka Bank Soal Fase D"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                <span>Bank Soal</span>
              </button>
            )}

            {/* Cbt Converter */}
            {onOpenCbtConverter && (
              <button
                id="btn-open-cbt-converter"
                onClick={onOpenCbtConverter}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-2 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Konversi ke Google Form & Quizizz"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Converter Form</span>
              </button>
            )}

            {/* Holistic Rubric */}
            {onOpenHolisticAssessment && (
              <button
                id="btn-open-holistic-rubric"
                onClick={onOpenHolisticAssessment}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-2 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Rubrik 3 Ranah & P5PPRA"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Rubrik P5PPRA</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4-Stat Metric Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white border-b border-slate-200">
        <div className="p-3.5 rounded-lg border border-slate-150 bg-slate-50/50">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Kelas & Fase</div>
          <div className="text-base font-bold text-slate-900">Kelas {packageData.identity.grade} ({packageData.identity.phase})</div>
        </div>
        <div className="p-3.5 rounded-lg border border-slate-150 bg-slate-50/50">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tema CP Terklasifikasi</div>
          <div className="text-sm font-semibold text-emerald-800 line-clamp-1" title={packageData.tema || packageData.materiMapping[0]?.materi}>
            {packageData.tema || packageData.materiMapping[0]?.materi || 'Akidah Islam'}
          </div>
        </div>
        <div className="p-3.5 rounded-lg border border-slate-150 bg-slate-50/50">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Rasio HOTS (C4–C6)</div>
          <div className="text-base font-bold text-slate-900">
            {hotsPercentage}% <span className="text-xs font-normal text-slate-500">({hotsPercentage >= 60 ? 'Tinggi' : 'Standar'})</span>
          </div>
        </div>
        <div className="p-3.5 rounded-lg border border-slate-150 bg-slate-50/50">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">SOLO Relational</div>
          <div className="text-base font-bold text-slate-900">
            {soloRelationalPercentage}% <span className="text-xs font-normal text-slate-500">(Deep Learning)</span>
          </div>
        </div>
      </div>

      {/* Pedagogical Chain Banner */}
      <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-semibold text-slate-800">Alur Pedagogis SK 020/2026:</span>
          <span>CP ➔ Tema ({packageData.tema || 'PAIBP'}) ➔ Indikator HOTS ➔ Stimulus Autentik ➔ 4 Opsi Homogen</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
            Distribusi Kunci: A({packageData.keyDistribution.A}) B({packageData.keyDistribution.B}) C({packageData.keyDistribution.C}) D({packageData.keyDistribution.D})
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/30 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'naskah_soal', label: '1. Naskah Soal Ujian', icon: FileText },
          { id: 'kisi_kisi', label: '2. Kisi-Kisi Lengkap', icon: Table },
          { id: 'kartu_soal', label: '3. Kartu Soal', icon: BookOpen },
          { id: 'kunci', label: '4. Kunci & Distribusi', icon: CheckCircle2 },
          { id: 'taksonomi', label: '5. Bloom & SOLO', icon: Layers },
          { id: 'kualitas', label: '6. Analisis Mutu & Rubrik', icon: Award },
          { id: 'ringkasan', label: '7. CP, TP & Validasi', icon: Info },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              id={`tab-${t.id}`}
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-3.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'border-emerald-600 text-emerald-800 bg-white font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Container */}
      <div className="p-6">
        {/* ========================================================================= */}
        {/* TAB 1: NASKAH SOAL UJIAN */}
        {/* ========================================================================= */}
        {activeTab === 'naskah_soal' && (
          <div className="space-y-6">
            {/* Filter & Options Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  id="input-search-question"
                  type="text"
                  placeholder="Cari kata kunci soal, stimulus, atau materi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-toggle-answer-keys"
                  onClick={() => setShowAnswerKeysInExam(!showAnswerKeysInExam)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    showAnswerKeysInExam
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {showAnswerKeysInExam ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAnswerKeysInExam ? 'Sembunyikan Kunci' : 'Tampilkan Kunci & Pembahasan'}</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-5">
              {filteredQuestions.map((q) => (
                <div
                  key={q.number}
                  className="p-5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white shadow-2xs transition-all relative group"
                >
                  {/* Question Meta Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {q.number}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {q.questionType === 'Essay' ? 'Uraian / Essay' : (q.pgVariant || 'Pilihan Ganda')}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-600 font-medium">
                        {q.element}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        {q.bloomLevel} — {q.soloLevel}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-500">
                        {q.deepLearningDim}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400">
                        Mutu: {q.qualityScore?.total || 32}/32
                      </span>
                      <button
                        id={`btn-edit-q-${q.number}`}
                        onClick={() => onEditQuestion(q)}
                        className="text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>

                  {/* Stimulus */}
                  {q.stimulus && (
                    <div className="bg-slate-50 border-l-2 border-emerald-600 p-3.5 rounded-r-lg mb-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                      {q.stimulus}
                    </div>
                  )}

                  {/* Khusus Analisis Sebab-Akibat: Boxed Pernyataan & Alasan */}
                  {q.causeStatement && q.effectStatement && (
                    <div className="my-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                          Pernyataan
                        </span>
                        <span className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                          {q.causeStatement}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-700 text-white px-2.5 py-0.5 rounded-full">
                          SEBAB
                        </span>
                      </div>
                      <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                          Alasan
                        </span>
                        <span className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                          {q.effectStatement}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Khusus Pilihan Ganda Kompleks Kategori */}
                  {q.statementCategories && q.statementCategories.length > 0 && (
                    <div className="my-3 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
                        <span>Pernyataan Teruji:</span>
                        <span className="text-[10px] text-slate-500 font-normal">Kategori ({q.categoryType || 'Benar / Salah'})</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {q.statementCategories.map((st, stIdx) => (
                          <div key={stIdx} className="p-3 bg-white flex items-start justify-between gap-3 text-xs sm:text-sm">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="font-bold text-slate-400 shrink-0">({stIdx + 1})</span>
                              <span className="text-slate-800 font-medium leading-relaxed">{st.statement}</span>
                            </div>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 border ${
                              showAnswerKeysInExam
                                ? (st.correctCategory === 'Benar' || st.correctCategory === 'Sesuai' || st.correctCategory === 'Ya'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                                    : 'bg-rose-50 text-rose-800 border-rose-300 font-bold')
                                : 'bg-slate-100 text-slate-500 border-slate-200 italic'
                            }`}>
                              {showAnswerKeysInExam ? st.correctCategory : '[ Benar / Salah ]'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question Stem */}
                  <p className="font-semibold text-sm sm:text-base text-slate-900 leading-relaxed mb-3.5">
                    {q.questionText}
                  </p>

                  {/* Multiple Choice Options */}
                  {q.questionType !== 'Essay' && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                      {q.options.map(opt => {
                        const isCorrect = q.multiCorrectKeys && q.multiCorrectKeys.length > 0
                          ? q.multiCorrectKeys.includes(opt.key)
                          : opt.key === q.correctKey;
                        const showHighlight = showAnswerKeysInExam && isCorrect;
                        const isMcma = q.pgVariant === 'Pilihan Ganda Kompleks (MCMA)';
                        return (
                          <div
                            key={opt.key}
                            className={`p-3 rounded-lg border transition-colors flex items-start space-x-3 ${
                              showHighlight
                                ? 'bg-emerald-50/80 border-emerald-400 font-medium text-emerald-950 ring-1 ring-emerald-400/30'
                                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50/60'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                showHighlight
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isMcma ? (showHighlight ? '☑' : opt.key) : opt.key}
                            </span>
                            <span className="leading-relaxed flex-1">{opt.text}</span>
                            {showHighlight && (
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                                Kunci Jawaban
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay Student Workspace */}
                  {q.questionType === 'Essay' && (
                    <div className="space-y-2">
                      <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50/60 min-h-[80px] text-xs text-slate-400 italic flex flex-col justify-between">
                        <span>[Ruang Lembar Jawaban Siswa]</span>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 not-italic pt-3 border-t border-slate-200/60">
                          <span>Kriteria: Ketepatan Konsep • Kedalaman Analisis • Landasan Dalil</span>
                          <span className="font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">Bobot: {q.maxScore || 20} Poin</span>
                        </div>
                      </div>

                      {q.keywords && q.keywords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-600">Kata Kunci:</span>
                          {q.keywords.map((kw, i) => (
                            <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation Section if Toggled */}
                  {showAnswerKeysInExam && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                      {q.questionType === 'Essay' ? (
                        <>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span>Model Jawaban Guru:</span>
                          </div>
                          <div className="bg-white p-3 rounded-md border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line text-[11px]">
                            {q.modelAnswer || q.explanation}
                          </div>

                          {q.rubricCriteria && q.rubricCriteria.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="font-semibold text-slate-700 block">Rubrik Penskoran Analitis:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.rubricCriteria.map(rc => (
                                  <div key={rc.score} className="bg-white p-2.5 rounded border border-slate-200 text-[11px]">
                                    <div className="font-semibold text-emerald-800">Skor {rc.score} — {rc.label}</div>
                                    <p className="text-slate-600 mt-0.5 leading-snug">{rc.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Kunci Jawaban: {q.multiCorrectKeys && q.multiCorrectKeys.length > 0 ? q.multiCorrectKeys.join(', ') : q.correctKey}</span>
                            {q.pgVariant && q.pgVariant !== 'Pilihan Ganda Sederhana' && (
                              <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                {q.pgVariant}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 leading-relaxed">
                            <strong>Alasan Pedagogik:</strong> {q.explanation}
                          </p>
                        </>
                      )}

                      {q.islamicValue && (
                        <p className="text-slate-600 pt-1 border-t border-slate-200">
                          <strong>Nilai Karakter:</strong> {q.islamicValue} | <strong>Konteks:</strong> {q.realLifeContext}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: KISI-KISI LENGKAP */}
        {/* ========================================================================= */}
        {activeTab === 'kisi_kisi' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span>Kisi-Kisi Asesmen PAIBP 2026</span>
              </h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded">
                Mode: {packageData.mode.toUpperCase()}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
              <table className="w-full text-left text-xs border-collapse bg-white">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] uppercase text-slate-500 font-semibold">
                    <th className="px-3 py-2.5 text-center w-12">No</th>
                    <th className="px-3 py-2.5 w-40">Elemen & Materi</th>
                    <th className="px-2 py-2.5 text-center w-16">Bentuk</th>
                    <th className="px-3 py-2.5">Indikator Soal</th>
                    <th className="px-3 py-2.5 text-center w-20">Bloom</th>
                    <th className="px-3 py-2.5 text-center w-24">SOLO</th>
                    <th className="px-3 py-2.5 text-center w-24">Deep Learning</th>
                    <th className="px-3 py-2.5 text-center w-20">Tingkat</th>
                    <th className="px-3 py-2.5 text-center w-20">Kunci</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700">
                  {packageData.kisiKisi.map((k) => {
                    const isEssay = k.questionType === 'Essay';
                    return (
                      <tr key={k.number} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 text-center text-slate-400 font-medium">
                          {k.number < 10 ? `0${k.number}` : k.number}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-900">{k.element}</div>
                          <div className="text-[11px] text-emerald-800">{k.tema || k.materi}</div>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isEssay ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isEssay ? 'Essay' : 'PG'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 leading-relaxed">
                          <p className="font-medium text-slate-800">{k.indicator}</p>
                          {k.stimulus && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                              Stimulus: {k.stimulus}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-semibold text-emerald-700">
                          {k.bloomLevel}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-700">
                          {k.soloLevel}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-600">
                          {k.deepLearningDim}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {k.difficulty}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-800">
                          {isEssay ? <span className="text-purple-700 text-[11px]">Rubrik</span> : k.correctKey}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: KARTU SOAL */}
        {/* ========================================================================= */}
        {activeTab === 'kartu_soal' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Kartu Soal Lengkap
              </h3>
              <span className="text-xs text-slate-500">
                Format Standar Guru Pengampu
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packageData.questions.map((q) => (
                <div
                  key={q.number}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">
                      KARTU SOAL NO. {q.number}
                    </span>
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {q.bloomLevel} | {q.soloLevel}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700">
                    <div><strong>Elemen / Materi:</strong> {q.element} / {q.materi}</div>
                    <div><strong>Indikator:</strong> {q.indicator}</div>
                    {q.stimulus && (
                      <div className="bg-slate-50 p-2.5 rounded-md text-slate-700 italic border-l-2 border-emerald-600 my-1">
                        {q.stimulus}
                      </div>
                    )}
                    <div className="font-semibold text-slate-900 pt-1">
                      {q.questionText}
                    </div>
                  </div>

                  {q.questionType !== 'Essay' && q.options && q.options.length > 0 && (
                    <div className="space-y-1 text-xs">
                      {q.options.map(opt => (
                        <div
                          key={opt.key}
                          className={`p-2 rounded-md flex items-start space-x-2 ${
                            opt.key === q.correctKey ? 'bg-emerald-50 text-emerald-950 font-medium border border-emerald-200' : 'text-slate-700'
                          }`}
                        >
                          <span className="font-bold">{opt.key}.</span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                    <div>
                      <strong className="text-slate-800">
                        {q.questionType === 'Essay' ? 'Status:' : 'Kunci:'}
                      </strong>{' '}
                      {q.questionType === 'Essay' ? 'Rubrik Terlampir' : q.correctKey}
                    </div>
                    <div><strong>Alasan:</strong> {q.explanation}</div>
                    <div><strong>Karakter Islami:</strong> {q.islamicValue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: KUNCI & DISTRIBUSI */}
        {/* ========================================================================= */}
        {activeTab === 'kunci' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Key Distribution Visualizer */}
            <div className="p-6 rounded-xl bg-slate-900 text-white shadow-xs border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold">Keseimbangan Kunci Jawaban</h3>
                  <p className="text-xs text-slate-400">
                    Pola acak merata (~25% per opsi) untuk reliabilitas tes
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {packageData.keyDistribution.isBalanced ? '✓ Seimbang' : 'Perlu Penyesuaian'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center my-4">
                {(['A', 'B', 'C', 'D'] as const).map(k => {
                  const count = packageData.keyDistribution[k];
                  const percent = Math.round((count / (packageData.questions.length || 1)) * 100);
                  return (
                    <div key={k} className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                      <span className="text-xs text-slate-400 block mb-1">Opsi {k}</span>
                      <span className="text-2xl font-bold text-white">{count}</span>
                      <span className="text-xs text-slate-400 block mt-1">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Answer Key Grid */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tabel Kunci Jawaban</h4>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-center text-xs">
                {packageData.questions.map(q => (
                  <div
                    key={q.number}
                    className="p-2 rounded-lg border border-slate-200 bg-slate-50 font-bold"
                  >
                    <span className="text-slate-400 block text-[10px]">No {q.number}</span>
                    <span className="text-sm font-bold text-slate-900">
                      {q.questionType === 'Essay' ? 'Essay' : q.correctKey}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TAKSONOMI BLOOM & SOLO */}
        {/* ========================================================================= */}
        {activeTab === 'taksonomi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-semibold text-xs text-slate-700 mb-3 uppercase tracking-wider">
                  Bloom (C1-C6)
                </h4>
                <div className="space-y-2">
                  {Object.entries(packageData.bloomDistribution).map(([level, stat]) => {
                    const s = stat as { count: number; percentage: number };
                    return (
                      <div key={level} className="text-xs flex justify-between">
                        <span className="text-slate-600 font-medium">{level}</span>
                        <span className="font-bold text-slate-900">{s.count} ({s.percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-semibold text-xs text-slate-700 mb-3 uppercase tracking-wider">
                  SOLO 4-Level
                </h4>
                <div className="space-y-2">
                  {Object.entries(packageData.soloDistribution).map(([level, stat]) => {
                    const s = stat as { count: number; percentage: number };
                    return (
                      <div key={level} className="text-xs flex justify-between">
                        <span className="text-slate-600 font-medium">{level}</span>
                        <span className="font-bold text-slate-900">{s.count} ({s.percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-semibold text-xs text-slate-700 mb-3 uppercase tracking-wider">
                  Deep Learning
                </h4>
                <div className="space-y-2">
                  {Object.entries(packageData.deepLearningDistribution).map(([dim, stat]) => {
                    const s = stat as { count: number; percentage: number };
                    return (
                      <div key={dim} className="text-xs flex justify-between">
                        <span className="text-slate-600 font-medium">{dim}</span>
                        <span className="font-bold text-slate-900">{s.count} ({s.percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ANALISIS MUTU & RUBRIK */}
        {/* ========================================================================= */}
        {activeTab === 'kualitas' && (
          <div className="space-y-5 max-w-4xl mx-auto">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Skor Mutu Asesmen
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {packageData.overallQuality.averageScore} / 32 Poin ({packageData.overallQuality.category})
                </h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Rekomendasi Pembelajaran
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
                {packageData.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: CP, TP & VALIDASI */}
        {/* ========================================================================= */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-5 max-w-4xl mx-auto">
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Capaian Pembelajaran (CP)</h4>
                <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {packageData.cp}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Tujuan Pembelajaran (TP)</h4>
                <ul className="space-y-1.5 text-xs text-slate-800">
                  {packageData.tpList.map((t, idx) => (
                    <li key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                      <span className="font-bold text-slate-700">{idx + 1}.</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Validasi Pedagogik Otomatis</span>
              </h4>
              <div className="space-y-2">
                {packageData.validationChecklist.map((check) => (
                  <div
                    key={check.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{check.label}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{check.notes}</div>
                    </div>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      Lolos Validasi ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
