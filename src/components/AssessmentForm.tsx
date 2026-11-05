import React, { useState, useEffect } from 'react';
import {
  GeneratorMode,
  GradeLevel,
  Semester,
  PaibpElement,
  DifficultyLevel,
  GenerateAssessmentRequest
} from '../types';
import {
  CURRICULUM_TOPICS,
  OFFICIAL_CP_PAIBP_FASED,
  CurriculumTopic
} from '../data/curriculumData';
import {
  CP_THEMES_CLASSIFICATION,
  getThemesByElement
} from '../data/cpThemesData';
import {
  Sparkles,
  Sliders,
  CheckCircle,
  HelpCircle,
  Zap,
  Layers,
  Brain,
  FileSpreadsheet,
  RefreshCw,
  Award,
  ChevronDown,
  Compass,
  BookOpen,
  BookmarkCheck
} from 'lucide-react';

interface AssessmentFormProps {
  onGenerate: (params: GenerateAssessmentRequest) => void;
  isLoading: boolean;
  onOpenThemeCatalog?: () => void;
  onOpenHolisticAssessment?: () => void;
  selectedCatalogTopic?: { topic: CurriculumTopic; temaName: string } | null;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  onGenerate,
  isLoading,
  onOpenThemeCatalog,
  onOpenHolisticAssessment,
  selectedCatalogTopic
}) => {
  // Mode selection (8 Modes as requested)
  const [mode, setMode] = useState<GeneratorMode>('sumatif');
  const [grade, setGrade] = useState<GradeLevel>('VIII');
  const [semester, setSemester] = useState<Semester>('1');
  const [element, setElement] = useState<PaibpElement>('Akidah');

  // Curriculum selection
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedThemeCode, setSelectedThemeCode] = useState<string>('tema-akidah-kitab-rasul');
  const [cp, setCp] = useState<string>('');
  const [tp, setTp] = useState<string>('');
  const [materi, setMateri] = useState<string>('');
  const [submateri, setSubmateri] = useState<string>('');

  // Assessment Specs
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [questionType, setQuestionType] = useState<'Pilihan Ganda' | 'Essay' | 'Campuran'>('Pilihan Ganda');
  const [essayCognitiveLevel, setEssayCognitiveLevel] = useState<'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'Berjenjang'>('C4');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'Custom'>('Sulit');
  const [contextType, setContextType] = useState<string>('Kehidupan siswa, sekolah, etika digital, dan masyarakat');
  const [allOptionsPositive, setAllOptionsPositive] = useState<boolean>(true);
  const [highDiscernmentOptions, setHighDiscernmentOptions] = useState<boolean>(true);
  const [noRoteMemorization, setNoRoteMemorization] = useState<boolean>(true);

  // Multi-Materi & TP state
  const [isMultiMateriTp, setIsMultiMateriTp] = useState<boolean>(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedTpList, setSelectedTpList] = useState<string[]>([]);
  const [pgVariantChoice, setPgVariantChoice] = useState<'Semua Ragam PG' | 'Pilihan Ganda Sederhana' | 'Pilihan Ganda Kompleks (MCMA)' | 'Pilihan Ganda Kompleks Kategori' | 'Analisis Sebab-Akibat'>('Semua Ragam PG');

  // Metadata
  const [schoolName, setSchoolName] = useState<string>('SMP Negeri / MTs');
  const [teacherName, setTeacherName] = useState<string>('Guru Pengampu PAIBP');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Filter themes and topics based on element
  const themesForElement = getThemesByElement(element);
  const availableTopics = CURRICULUM_TOPICS.filter(
    t => t.grade === grade && t.semester === semester && t.element === element
  );

  // Handle external selection from Theme Catalog modal
  useEffect(() => {
    if (selectedCatalogTopic) {
      const { topic } = selectedCatalogTopic;
      setGrade(topic.grade);
      setSemester(topic.semester);
      setElement(topic.element);
      setSelectedTopicId(topic.id);
      setSelectedThemeCode(topic.temaCode);
      setMateri(topic.materi);
      setSubmateri(topic.submateriList.join(', '));
      setCp(topic.officialCp);
      if (topic.suggestedTpList.length > 0) {
        setTp(topic.suggestedTpList[0]);
      }
    }
  }, [selectedCatalogTopic]);

  // Whenever Grade/Semester/Element changes, update default topic and theme
  useEffect(() => {
    const matched = CURRICULUM_TOPICS.find(
      t => t.grade === grade && t.semester === semester && t.element === element
    ) || CURRICULUM_TOPICS.find(t => t.grade === grade && t.element === element) || CURRICULUM_TOPICS[0];

    if (matched) {
      setSelectedTopicId(matched.id);
      setSelectedThemeCode(matched.temaCode);
      setCp(matched.officialCp);
      setTp(matched.suggestedTpList[0] || '');
      setMateri(matched.materi);
      setSubmateri(matched.submateriList.join(', '));
      setSelectedTopicIds([matched.id]);
      setSelectedTpList(matched.suggestedTpList || []);
    } else {
      setCp(OFFICIAL_CP_PAIBP_FASED[element] || '');
    }
  }, [grade, semester, element]);

  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    const found = CURRICULUM_TOPICS.find(t => t.id === topicId);
    if (found) {
      setSelectedThemeCode(found.temaCode);
      setCp(found.officialCp);
      setTp(found.suggestedTpList[0] || '');
      setMateri(found.materi);
      setSubmateri(found.submateriList.join(', '));
      setSelectedTopicIds([found.id]);
      setSelectedTpList(found.suggestedTpList || []);
    }
  };

  const handleToggleTopicMulti = (topicId: string) => {
    setSelectedTopicIds(prev => {
      const exists = prev.includes(topicId);
      const next = exists ? prev.filter(id => id !== topicId) : [...prev, topicId];
      // update selectedTpList accordingly
      const top = CURRICULUM_TOPICS.find(t => t.id === topicId);
      if (top) {
        if (!exists) {
          // add its TPs
          setSelectedTpList(currentTps => Array.from(new Set([...currentTps, ...top.suggestedTpList])));
        } else {
          // remove its TPs if no other selected topic uses them
          setSelectedTpList(currentTps => currentTps.filter(tpItem => !top.suggestedTpList.includes(tpItem)));
        }
      }
      return next;
    });
  };

  const handleToggleTpMulti = (tpItem: string) => {
    setSelectedTpList(prev => 
      prev.includes(tpItem) ? prev.filter(t => t !== tpItem) : [...prev, tpItem]
    );
  };

  const handleSelectAllTopics = () => {
    const allIds = availableTopics.map(t => t.id);
    setSelectedTopicIds(allIds);
    const allTps: string[] = [];
    availableTopics.forEach(t => {
      t.suggestedTpList.forEach(tp => {
        if (!allTps.includes(tp)) allTps.push(tp);
      });
    });
    setSelectedTpList(allTps);
  };

  const handleThemeSelect = (themeId: string) => {
    setSelectedThemeCode(themeId);
    const theme = CP_THEMES_CLASSIFICATION.find(t => t.themeId === themeId);
    if (theme) {
      // If current grade or semester doesn't match theme recommendation, adjust
      if (!theme.recommendedGrades.includes(grade)) {
        setGrade(theme.recommendedGrades[0]);
      }
      if (!theme.recommendedSemesters.includes(semester)) {
        setSemester(theme.recommendedSemesters[0]);
      }
      setElement(theme.element);
      setCp(theme.cpClause);
      if (theme.suggestedTpList.length > 0) {
        setTp(theme.suggestedTpList[0]);
      }
      setMateri(theme.temaName);
      setSubmateri(theme.submateriScope.join(', '));

      // Also match topic if available
      const topic = CURRICULUM_TOPICS.find(t => t.temaCode === themeId || t.tema === theme.temaName);
      if (topic) {
        setSelectedTopicId(topic.id);
      }
    }
  };

  const handleQuickPreset = (presetGrade: GradeLevel, presetElement: PaibpElement, presetSem: Semester, count: number) => {
    setGrade(presetGrade);
    setElement(presetElement);
    setSemester(presetSem);
    setQuestionCount(count);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeTopic = CURRICULUM_TOPICS.find(t => t.id === selectedTopicId);
    const activeTheme = CP_THEMES_CLASSIFICATION.find(t => t.themeId === selectedThemeCode);

    const resolvedMateriList = isMultiMateriTp && selectedTopicIds.length > 0
      ? selectedTopicIds.map(id => CURRICULUM_TOPICS.find(t => t.id === id)?.materi).filter(Boolean) as string[]
      : [materi];

    const finalMateri = resolvedMateriList.length > 1 ? resolvedMateriList.join(', ') : materi;
    const finalTp = isMultiMateriTp && selectedTpList.length > 0 ? selectedTpList.join(' | ') : tp;

    onGenerate({
      mode,
      grade,
      semester,
      element,
      tema: activeTopic?.tema || activeTheme?.temaName || '',
      temaCode: activeTopic?.temaCode || selectedThemeCode || '',
      cp,
      tp: finalTp,
      materi: finalMateri,
      submateri,
      questionCount,
      questionType,
      pgVariantChoice,
      isMultiMateriTp,
      selectedMateriList: resolvedMateriList,
      selectedTpList,
      selectedTopicIds,
      essayCognitiveLevel,
      difficulty,
      contextType,
      allOptionsPositive,
      balancedPositiveOptions: allOptionsPositive,
      highDiscernmentOptions,
      noRoteMemorization,
      schoolName,
      teacherName,
      customPrompt
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Top Banner */}
      <div className="bg-slate-900 px-6 py-5 text-white border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold bg-sky-500/20 text-sky-300 rounded border border-sky-400/30 uppercase tracking-wider mb-1.5">
              Standar Kurikulum Merdeka 2026 • Fase D
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Parameter Penyusunan Asesmen Deep Learning
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Rancang kisi-kisi, naskah soal HOTS, kartu soal, taksonomi Bloom-SOLO, dan analisis rubrik otomatis.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
            <button
              id="btn-preset-kls8"
              type="button"
              onClick={() => handleQuickPreset('VIII', 'Akidah', '1', 10)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 px-2.5 py-1.5 rounded-md transition-colors border border-slate-700 font-medium"
            >
              ⚡ Kls 8 Kitab & Rasul (10)
            </button>
            <button
              id="btn-preset-kls9"
              type="button"
              onClick={() => handleQuickPreset('IX', 'Fikih', '1', 10)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 px-2.5 py-1.5 rounded-md transition-colors border border-slate-700 font-medium"
            >
              ⚡ Kls 9 Jenazah & Haji (10)
            </button>
            <button
              id="btn-preset-kls7"
              type="button"
              onClick={() => handleQuickPreset('VII', "Al-Qur'an Hadis", '1', 10)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 px-2.5 py-1.5 rounded-md transition-colors border border-slate-700 font-medium"
            >
              ⚡ Kls 7 Ilmu & Takwa (10)
            </button>
            <button
              id="btn-preset-spi"
              type="button"
              onClick={() => handleQuickPreset('VIII', 'Sejarah Peradaban Islam', '2', 10)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 px-2.5 py-1.5 rounded-md transition-colors border border-slate-700 font-medium"
            >
              ⚡ Kls 8 Masuknya Islam RI (10)
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Section 1: Generator Mode Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            1. Pilihan Mode Generator Asesmen
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'sumatif', label: 'Sumatif Lengkap', desc: 'Kisi-kisi, Naskah, Kunci, Kartu Soal & Rubrik', icon: FileSpreadsheet, color: 'border-sky-500 bg-sky-50/70 text-sky-950' },
              { id: 'hots', label: 'HOTS Prioritas', desc: 'Dominan C4-C6 & SOLO Relational (Sulit)', icon: Brain, color: 'border-purple-500 bg-purple-50/70 text-purple-950' },
              { id: 'deep_learning', label: 'Deep Learning', desc: 'Fokus Refleksi & Transfer Nilai Nyata', icon: Sparkles, color: 'border-emerald-500 bg-emerald-50/70 text-emerald-950' },
              { id: 'cepat', label: 'Mode Cepat', desc: 'Instan Soal + Kunci Seimbang', icon: Zap, color: 'border-amber-500 bg-amber-50/70 text-amber-950' },
              { id: 'profesional', label: 'Profesional Guru', desc: 'CP + TP + Bloom + SOLO Lengkap', icon: Award, color: 'border-blue-500 bg-blue-50/70 text-blue-950' },
              { id: 'remedial', label: 'Remedial Miskonsepsi', desc: 'C2-C3 Kontekstual untuk Siswa Kesulitan', icon: RefreshCw, color: 'border-orange-500 bg-orange-50/70 text-orange-950' },
              { id: 'pengayaan', label: 'Pengayaan Khusus', desc: 'Extended Abstract & Kasus Kompleks', icon: Layers, color: 'border-indigo-500 bg-indigo-50/70 text-indigo-950' },
              { id: 'randomizer', label: 'Randomizer & Balanced', desc: 'Acak Nomor & Seimbangkan Kunci', icon: Sliders, color: 'border-slate-500 bg-slate-100 text-slate-950' },
            ].map(m => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  type="button"
                  id={`mode-${m.id}`}
                  key={m.id}
                  onClick={() => setMode(m.id as GeneratorMode)}
                  className={`text-left p-3 rounded-lg border transition-all flex flex-col justify-between ${
                    isSelected
                      ? `${m.color} shadow-xs font-semibold ring-2 ring-sky-500/30`
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{m.label}</span>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                    {m.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Core Curriculum Inputs (Jenjang, Elemen, Kelas, Semester) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider text-[11px]">
              Kelas (Fase D SMP/MTs)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['VII', 'VIII', 'IX'] as GradeLevel[]).map(g => (
                <button
                  type="button"
                  id={`grade-${g}`}
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`py-2 text-xs font-bold rounded-md border transition-colors ${
                    grade === g
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Kelas {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider text-[11px]">
              Semester
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['1', '2'] as Semester[]).map(s => (
                <button
                  type="button"
                  id={`semester-${s}`}
                  key={s}
                  onClick={() => setSemester(s)}
                  className={`py-2 text-xs font-bold rounded-md border transition-colors ${
                    semester === s
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semester {s}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider text-[11px]">
              Elemen Mata Pelajaran PAIBP
            </label>
            <select
              id="select-element"
              value={element}
              onChange={(e) => setElement(e.target.value as PaibpElement)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="Al-Qur'an Hadis">Al-Qur'an Hadis (Iman, Takwa, Toleransi, Cinta Tanah Air, Ilmu, Sabar)</option>
              <option value="Tajwid">Tajwid (Hukum Nun/Mim Sukun, Mad, Alif Lam, Idgham, Qalqalah, Waqaf, Gharib)</option>
              <option value="Akidah">Akidah (Rukun Iman & Hal-hal Peneguh Iman)</option>
              <option value="Akhlak">Akhlak (Ikhlas, Syukur, Cinta Rasul/Ilmu/Lingkungan/Sesama)</option>
              <option value="Fikih">Fikih (Sujud di Luar Salat, Rukhsah, Jenazah, Haji/Umrah, Kurban, Wakaf)</option>
              <option value="Sejarah Peradaban Islam">Sejarah Peradaban Islam (Kekhalifahan Pasca Khulafaur Rasyidin & Masuknya Islam RI)</option>
            </select>
            {element === 'Tajwid' && (
              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sub-Elemen Tajwid Terintegrasi ({grade === 'VII' ? 'Fase D Bag. 1 - Kls VII' : grade === 'VIII' ? 'Fase D Bag. 2 - Kls VIII' : 'Fase D Bag. 3 - Kls IX'})</span>
                </div>
                <div className="mt-1 text-[11px] text-emerald-700">
                  {grade === 'VII' && '• Fondasi Dasar, Lahn, Isti\'adzah/Basmalah, Nun Sukun & Tanwin, Mim Sukun, dan Ghunnah Musyaddadah.'}
                  {grade === 'VIII' && '• Hukum Alif Lam (Al-Qamariyah & Al-Syamsiyah), Mad Asli / Thobi\'i, dan Hubungan Huruf (Idgham Mutamatsilain, Mutajanisain, Mutaqaribain).'}
                  {grade === 'IX' && '• Mad Far\'i (Muttasil, Munfasil, \'Arid, Badal, Lazim), Qalqalah (Sugra/Kubra), Tafkhim/Tarqiq Ra & Lam Jalalah, Tanda Waqaf-Ibtida\', dan Bacaan Khusus Gharib (Saktah, Imalah, Isymam, Tashil).'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Topic & CP / TP Selector */}
        <div className="space-y-4">
          {/* Theme Classification Bar */}
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-sky-600 text-white flex items-center justify-center">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-sky-950 uppercase tracking-wider block">
                    Klasifikasi Tema CP PAIBP (SK 020/2026)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Elemen: {element} • {themesForElement.length} Tema Terpetakan
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {onOpenHolisticAssessment && (
                  <button
                    type="button"
                    id="btn-open-holistic-from-form"
                    onClick={onOpenHolisticAssessment}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                    title="Buka Pedoman Asesmen: 3 Ranah, 5 Elemen, dan 4 Pendekatan Kurikulum Merdeka (P5PPRA)"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Rubrik 3 Ranah & P5PPRA</span>
                  </button>
                )}

                {onOpenThemeCatalog && (
                  <button
                    type="button"
                    id="btn-open-catalog-from-form"
                    onClick={onOpenThemeCatalog}
                    className="bg-white hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                    <span>Katalog Tema CP</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              <div className="md:col-span-6">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Tema Terklasifikasi:
                </label>
                <select
                  id="select-theme-classification"
                  value={selectedThemeCode}
                  onChange={(e) => handleThemeSelect(e.target.value)}
                  className="w-full bg-white border border-sky-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                >
                  {themesForElement.map((th) => (
                    <option key={th.themeId} value={th.themeId}>
                      {th.temaName} (Kls {th.recommendedGrades.join('/')} • Sem {th.recommendedSemesters.join('/')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-6 bg-white p-2.5 rounded-lg border border-sky-200 text-xs flex flex-col justify-center">
                <div className="text-[10px] font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1">
                  <BookmarkCheck className="w-3 h-3 text-sky-600" />
                  <span>Klausul CP Resmi Elemen {element}</span>
                </div>
                <p className="text-[11px] text-slate-700 italic line-clamp-2 mt-0.5 leading-snug">
                  "{OFFICIAL_CP_PAIBP_FASED[element]}"
                </p>
              </div>
            </div>
          </div>

          {/* Multi-Materi & TP Komprehensif Toggle Banner */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isMultiMateriTp ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Mode Multi-Materi & Tujuan Pembelajaran (TP) Komprehensif
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isMultiMateriTp ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {isMultiMateriTp ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Pilih beberapa materi pokok dan TP sekaligus dalam sekali generate. Soal akan didistribusikan secara proporsional ke setiap materi terpilih.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  id="toggle-multi-materi-tp"
                  onClick={() => setIsMultiMateriTp(!isMultiMateriTp)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${isMultiMateriTp ? 'bg-sky-600' : 'bg-slate-300'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isMultiMateriTp ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* If Multi-Materi Mode is ACTIVE: Show interactive selector */}
            {isMultiMateriTp ? (
              <div className="mt-4 pt-3 border-t border-sky-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-950">
                      Pilih Materi & Tujuan Pembelajaran (Kelas {grade} • Sem {semester} • {element}):
                    </span>
                    <span className="text-[11px] bg-sky-200/80 text-sky-900 font-bold px-2.5 py-0.5 rounded-full">
                      {selectedTopicIds.length} Materi & {selectedTpList.length} TP Terpilih
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      id="btn-select-all-topics"
                      onClick={handleSelectAllTopics}
                      className="text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-100 hover:bg-sky-200 px-2.5 py-1 rounded transition-colors"
                    >
                      ✓ Pilih Semua
                    </button>
                    <button
                      type="button"
                      id="btn-clear-topics"
                      onClick={() => {
                        setSelectedTopicIds([]);
                        setSelectedTpList([]);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                    >
                      ✕ Reset
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                  {availableTopics.map(topic => {
                    const isTopicSelected = selectedTopicIds.includes(topic.id);
                    return (
                      <div
                        key={topic.id}
                        className={`p-3 rounded-lg border transition-all text-left ${
                          isTopicSelected
                            ? 'bg-white border-sky-400 shadow-2xs ring-1 ring-sky-300'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            id={`chk-topic-${topic.id}`}
                            checked={isTopicSelected}
                            onChange={() => handleToggleTopicMulti(topic.id)}
                            className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <label htmlFor={`chk-topic-${topic.id}`} className="text-xs font-bold text-slate-800 cursor-pointer">
                                {topic.materi}
                              </label>
                              <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                {topic.submateriList.length} Sub
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {topic.submateriList.join(', ')}
                            </p>

                            {/* TP List for this topic */}
                            {isTopicSelected && topic.suggestedTpList.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Tujuan Pembelajaran Terkait:
                                </span>
                                {topic.suggestedTpList.map((tpItem, tpIdx) => {
                                  const isTpSelected = selectedTpList.includes(tpItem);
                                  return (
                                    <label
                                      key={tpIdx}
                                      className={`flex items-start gap-2 text-[11px] p-1.5 rounded cursor-pointer transition-colors ${
                                        isTpSelected ? 'bg-sky-50/80 text-sky-950 font-medium' : 'text-slate-600 hover:bg-slate-50'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isTpSelected}
                                        onChange={() => handleToggleTpMulti(tpItem)}
                                        className="mt-0.5 w-3.5 h-3.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer shrink-0"
                                      />
                                      <span className="leading-snug">{tpItem}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Standard Single Topic & Inputs (Always visible or fallback) */}
          {!isMultiMateriTp && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Pilih Bank Topik & Materi Standar (atau Kustom)
                  </label>
                  <select
                    id="select-topic"
                    value={selectedTopicId}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {availableTopics.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.materi}
                      </option>
                    ))}
                    <option value="custom">-- Gunakan Materi / CP Kustom Guru --</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Materi Pokok
                  </label>
                  <input
                    id="input-materi"
                    type="text"
                    value={materi}
                    onChange={(e) => setMateri(e.target.value)}
                    placeholder="Contoh: Meyakini Hari Akhir dan Tanggung Jawab Moral"
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Submateri / Ruang Lingkup
                </label>
                <input
                  id="input-submateri"
                  type="text"
                  value={submateri}
                  onChange={(e) => setSubmateri(e.target.value)}
                  placeholder="Contoh: Tahapan Hari Kiamat, Hisab, Mizan, Perilaku Jujur Tanpa Pengawasan"
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* CP and TP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Capaian Pembelajaran (CP) Resmi
                  </label>
                  <textarea
                    id="textarea-cp"
                    rows={3}
                    value={cp}
                    onChange={(e) => setCp(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 leading-relaxed"
                    placeholder="Rumusan Capaian Pembelajaran (CP)..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Tujuan Pembelajaran (TP)
                  </label>
                  <textarea
                    id="textarea-tp"
                    rows={3}
                    value={tp}
                    onChange={(e) => setTp(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 leading-relaxed"
                    placeholder="Rumusan Tujuan Pembelajaran (TP)..."
                    required
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Section 3.5: Bentuk Soal & Tingkatan Kognitif Essay */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Pilihan Bentuk / Jenis Soal Asesmen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'Pilihan Ganda',
                  label: 'Pilihan Ganda HOTS',
                  tag: 'Extended Abstract',
                  desc: 'Opsi A-D bernada positif, seimbang karakternya, menuntut kecermatan tinggi.',
                  icon: Sliders
                },
                {
                  id: 'Essay',
                  label: 'Soal Uraian / Essay',
                  tag: 'Rubrik Terstruktur',
                  desc: 'Sesuai tingkatan kognitif pilihan (C2-C6) + model jawaban & rubrik analitis.',
                  icon: BookOpen
                },
                {
                  id: 'Campuran',
                  label: 'Campuran (PG + Essay)',
                  tag: 'Komprehensif',
                  desc: 'Kombinasi soal pilihan ganda dan soal uraian untuk evaluasi sumatif / ujian.',
                  icon: Layers
                }
              ].map(typeItem => {
                const Icon = typeItem.icon;
                const isSelected = questionType === typeItem.id;
                return (
                  <button
                    type="button"
                    key={typeItem.id}
                    id={`btn-question-type-${typeItem.id.toLowerCase().replace(/ /g, '-')}`}
                    onClick={() => setQuestionType(typeItem.id as any)}
                    className={`text-left p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/80 text-sky-950 ring-2 ring-sky-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                          {typeItem.label}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {typeItem.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {typeItem.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Essay or Campuran is selected: Show Tingkatan Kognitif Soal Essay */}
          {(questionType === 'Essay' || questionType === 'Campuran') && (
            <div className="p-3.5 bg-purple-50/60 rounded-lg border border-purple-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span>Tingkatan Kognitif Soal Uraian / Essay:</span>
                </label>
                <span className="text-[10px] text-purple-700 font-semibold">
                  Pertanyaan, stimulus, model jawaban & rubrik diselaraskan dengan ranah ini.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                {[
                  { level: 'C2', name: 'C2 Memahami', desc: 'Esensi & hikmah' },
                  { level: 'C3', name: 'C3 Menerapkan', desc: 'Kaidah syariat' },
                  { level: 'C4', name: 'C4 Menganalisis', desc: 'Sebab-akibat & dilema' },
                  { level: 'C5', name: 'C5 Mengevaluasi', desc: 'Kritis syar\'i' },
                  { level: 'C6', name: 'C6 Mencipta', desc: 'Rancang solusi inovatif' },
                  { level: 'Berjenjang', name: 'Berjenjang', desc: 'Progresif C2-C6' }
                ].map(cog => (
                  <button
                    type="button"
                    key={cog.level}
                    id={`btn-essay-cog-${cog.level.toLowerCase()}`}
                    onClick={() => setEssayCognitiveLevel(cog.level as any)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      essayCognitiveLevel === cog.level
                        ? 'border-purple-500 bg-white text-purple-950 ring-2 ring-purple-500/30 shadow-xs font-semibold'
                        : 'border-purple-200/70 bg-white/70 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-purple-900">{cog.name}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{cog.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If Pilihan Ganda or Campuran is selected: Show Pilihan Ragam PG Selector */}
          {(questionType === 'Pilihan Ganda' || questionType === 'Campuran') && (
            <div className="p-4 bg-sky-50/80 rounded-xl border border-sky-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  <span>Pilihan Ragam / Variasi Soal Pilihan Ganda:</span>
                </label>
                <span className="text-[10px] text-sky-700 font-semibold">
                  Tersedia 4 variasi spesifik sesuai standar asesmen AKM & Ujian Nasional
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'Semua Ragam PG',
                    name: 'Semua Ragam PG',
                    badge: 'Campuran Proposional',
                    desc: 'Kombinasi merata dari ke-4 ragam PG: Sederhana, MCMA, Kategori B/S, & Sebab-Akibat.'
                  },
                  {
                    id: 'Pilihan Ganda Sederhana',
                    name: 'Pilihan Ganda Sederhana (Tunggal)',
                    badge: '1 Jawaban Benar',
                    desc: 'Satu pokok soal (stem) dengan 4 opsi jawaban, di mana hanya ada 1 jawaban benar dan sisanya pengecoh.'
                  },
                  {
                    id: 'Pilihan Ganda Kompleks (MCMA)',
                    name: 'Pilihan Ganda Kompleks (MCMA)',
                    badge: 'Multiple Answers',
                    desc: 'Lebih dari satu jawaban benar dari opsi yang disediakan. Siswa wajib memilih semua jawaban yang tepat.'
                  },
                  {
                    id: 'Pilihan Ganda Kompleks Kategori',
                    name: 'Pilihan Ganda Kompleks Kategori',
                    badge: 'Benar / Salah',
                    desc: 'Menyajikan serangkaian pernyataan, siswa menilai setiap butir ke dalam kategori Benar/Salah atau Sesuai/Tidak Sesuai.'
                  },
                  {
                    id: 'Analisis Sebab-Akibat',
                    name: 'Analisis Sebab-Akibat',
                    badge: 'Kausalitas Logis',
                    desc: 'Dua pernyataan dihubungkan kata "SEBAB", siswa menganalisis kebenaran masing-masing dan hubungan kausalitasnya.'
                  }
                ].map(vItem => {
                  const isVarSelected = pgVariantChoice === vItem.id;
                  return (
                    <button
                      type="button"
                      key={vItem.id}
                      id={`btn-pg-var-${vItem.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      onClick={() => setPgVariantChoice(vItem.id as any)}
                      className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                        isVarSelected
                          ? 'border-sky-500 bg-white text-sky-950 ring-2 ring-sky-500/20 shadow-xs'
                          : 'border-sky-200/70 bg-white/70 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-sky-950">{vItem.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isVarSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {vItem.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {vItem.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Guardrail Note */}
              <div className="p-2.5 bg-white rounded-lg border border-sky-100 flex items-start space-x-2 mt-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Standar Deep Learning:</strong> Semua opsi dirancang homogen, bernada positif, bebas pilihan konyol, dan menuntut kecermatan berpikir tingkat tinggi (Relational / Extended Abstract) berakar pada tauhid dan dalil naqli.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Assessment Specifications (Questions count, difficulty, context) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Jumlah Butir Soal ({questionCount} Soal)
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="range-question-count"
                type="range"
                min="5"
                max="50"
                step="5"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-800 min-w-[40px] text-center">
                {questionCount}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5</span>
              <span>10 (Kuis)</span>
              <span>20 (PTS)</span>
              <span>30</span>
              <span>50 (PAS/Sumatif)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Tingkat Kesulitan Paket
            </label>
            <select
              id="select-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="Sedang">Sedang (Standar Formatif/PTS)</option>
              <option value="Sulit">Sulit (HOTS & Relational - Rekomendasi)</option>
              <option value="Sangat Sulit">Sangat Sulit (Extended Abstract 70%+)</option>
              <option value="Mudah">Mudah (Dasar & Remedial)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Fokus Konteks Stimulus
            </label>
            <select
              id="select-context"
              value={contextType}
              onChange={(e) => setContextType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="Kehidupan siswa, sekolah, etika digital, dan masyarakat">Kombinasi Kontekstual Seimbang (Rekomendasi)</option>
              <option value="Dilema moral dan integritas di sekolah & pergaulan">Dilema Moral & Kejujuran Sekolah</option>
              <option value="Etika digital, media sosial, AI, dan tabayyun">Etika Digital & Media Sosial Islami</option>
              <option value="Pelestarian lingkungan dan isu kontemporer">Lingkungan Hidup & Krisis Alam</option>
              <option value="Kepemimpinan OSIS dan toleransi keberagaman">Kepemimpinan Muda & Toleransi</option>
            </select>
          </div>
        </div>

        {/* Section 5: Essential Quality Guardrails (Toggles) */}
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-lg p-3.5 space-y-2">
          <div className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-sky-600" />
            Standar Mutu Pedagogik PAIBP 2026 (Diaktifkan):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                id="checkbox-all-options-positive"
                type="checkbox"
                checked={allOptionsPositive}
                onChange={(e) => setAllOptionsPositive(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700">
                <strong>Opsi Homogen & Positif (Aturan 13 & 34):</strong> Semua opsi tampak masuk akal, jawaban benar dibedakan oleh kedalaman tauhid/konsep.
              </span>
            </label>

            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                id="checkbox-no-rote-memorization"
                type="checkbox"
                checked={noRoteMemorization}
                onChange={(e) => setNoRoteMemorization(e.target.checked)}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700">
                <strong>Anti-Hafalan (Deep Learning):</strong> Menolak pertanyaan hafalan rutin; mengutamakan penalaran, refleksi, dan transfer kasus.
              </span>
            </label>
          </div>
        </div>

        {/* Advanced Options Accordion */}
        <div>
          <button
            id="btn-toggle-advanced"
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>{showAdvanced ? 'Sembunyikan Pengaturan Tambahan' : 'Tampilkan Identitas Madrasah / Catatan Khusus'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nama Sekolah / Madrasah</label>
                <input
                  id="input-school-name"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nama Guru Pengampu</label>
                <input
                  id="input-teacher-name"
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Instruksi Tambahan (Opsional)</label>
                <input
                  id="input-custom-prompt"
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Misal: Cantumkan ayat Al-Qur'an secara spesifik"
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span>Paket akan menghasilkan <strong>13 Bagian Output</strong> lengkap siap cetak dan ekspor.</span>
          </div>

          <button
            id="btn-submit-generate"
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-bold px-6 py-2.5 rounded-md shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyusun Asesmen Deep Learning...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Asesmen PAIBP 2026 ({questionCount} Soal)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
