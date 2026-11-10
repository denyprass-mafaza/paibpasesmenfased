import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  Award,
  X,
  ShieldCheck,
  FileCheck,
  Laptop,
  Database,
  Key,
  LogOut,
  User,
  ChevronDown,
  Share2,
  Menu,
  MoreHorizontal,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { UserAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenGuide: () => void;
  onOpenCatalog?: () => void;
  onOpenQuestionBank?: () => void;
  onOpenCbtConverter?: () => void;
  onOpenGrading?: () => void;
  onOpenHolisticAssessment?: () => void;
  onOpenDirectCbt?: () => void;
  onOpenShareCbt?: () => void;
  activeMode: string;
  currentUser?: UserAccount | null;
  onOpenActivation?: () => void;
  onOpenOwnerDashboard?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGuide,
  onOpenCatalog,
  onOpenQuestionBank,
  onOpenCbtConverter,
  onOpenGrading,
  onOpenHolisticAssessment,
  onOpenDirectCbt,
  onOpenShareCbt,
  currentUser,
  onOpenActivation,
  onOpenOwnerDashboard,
  onLogout
}) => {
  const [showAbout, setShowAbout] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(target)) {
        setShowToolsMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800/90 text-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              P
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-tight text-white leading-none">
                  PAIBP GEN
                </span>
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 uppercase tracking-wider">
                  Fase D 2026
                </span>
                {currentUser?.role === 'owner' && (
                  <span className="bg-amber-950 text-amber-300 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-700/50 uppercase">
                    Owner
                  </span>
                )}
                {currentUser?.role === 'demo' && (
                  <span className="bg-amber-950/80 text-amber-300 text-[10px] font-medium px-1.5 py-0.5 rounded border border-amber-800/50 uppercase">
                    Demo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate mt-0.5">
                SMP/MTs (Kelas VII, VIII, IX) • Kurikulum Merdeka
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tools */}
          <div className="hidden lg:flex items-center space-x-1.5">
            {/* Primary Action 1: Buku Nilai */}
            {onOpenGrading && (
              <button
                id="btn-nav-grading"
                onClick={onOpenGrading}
                className="px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/70 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Buku Penilaian: Kognitif, Afektif, dan Psikomotorik per TP"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Buku Nilai (3 Ranah)</span>
              </button>
            )}

            {/* Primary Action 2: Ujian CBT Langsung */}
            {onOpenDirectCbt && (
              <button
                id="btn-nav-direct-cbt"
                onClick={onOpenDirectCbt}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Buka Ujian CBT Langsung (Computer-Based Test) untuk siswa"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Ujian CBT</span>
              </button>
            )}

            {/* Primary Action 3: Bank Soal */}
            {onOpenQuestionBank && (
              <button
                id="btn-nav-question-bank"
                onClick={onOpenQuestionBank}
                className="px-3 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/70 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Bank Soal Terstandar PAIBP Fase D"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Bank Soal</span>
              </button>
            )}

            {/* Secondary Tools Dropdown */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                id="btn-nav-tools-dropdown"
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer border ${
                  showToolsMenu
                    ? 'bg-slate-800 text-white border-slate-600'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
                }`}
                title="Menu alat asesmen lainnya"
              >
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                <span>Alat Asesmen</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showToolsMenu && (
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-xl shadow-xl p-1.5 text-xs space-y-0.5 z-50">
                  {onOpenShareCbt && (
                    <button
                      id="btn-dropdown-share-cbt"
                      onClick={() => {
                        setShowToolsMenu(false);
                        onOpenShareCbt();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-medium">Bagikan Link CBT Siswa</div>
                        <div className="text-[10px] text-slate-400">Tautan online siswa via WhatsApp</div>
                      </div>
                    </button>
                  )}

                  {onOpenCbtConverter && (
                    <button
                      id="btn-dropdown-cbt-converter"
                      onClick={() => {
                        setShowToolsMenu(false);
                        onOpenCbtConverter();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div className="font-medium">Converter Form & CBT</div>
                        <div className="text-[10px] text-slate-400">Ekspor ke Google Form & Quizizz</div>
                      </div>
                    </button>
                  )}

                  {onOpenHolisticAssessment && (
                    <button
                      id="btn-dropdown-holistic"
                      onClick={() => {
                        setShowToolsMenu(false);
                        onOpenHolisticAssessment();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                      <div>
                        <div className="font-medium">Rubrik Asesmen & P5PPRA</div>
                        <div className="text-[10px] text-slate-400">3 Ranah Capaian & Karakter</div>
                      </div>
                    </button>
                  )}

                  {onOpenCatalog && (
                    <button
                      id="btn-dropdown-catalog"
                      onClick={() => {
                        setShowToolsMenu(false);
                        onOpenCatalog();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-medium">Katalog Tema CP (SK 020)</div>
                        <div className="text-[10px] text-slate-400">Daftar tema resmi per elemen</div>
                      </div>
                    </button>
                  )}

                  <div className="border-t border-slate-800 my-1" />

                  <button
                    id="btn-dropdown-about"
                    onClick={() => {
                      setShowToolsMenu(false);
                      setShowAbout(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <div className="font-medium">Prinsip Asesmen 2026</div>
                      <div className="text-[10px] text-slate-400">Kaidah opsi homogen & HOTS</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Area (Guide, Cloud Status, PWA, User Profile) */}
          <div className="flex items-center space-x-2">
            {/* Cloud Status Indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300"
              title="Cloud Database Firestore Terhubung"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-medium text-slate-300">Cloud Aktif</span>
            </div>

            {/* Guide Button */}
            <button
              id="btn-nav-panduan"
              onClick={onOpenGuide}
              className="text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700/70 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Panduan</span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* User Account / Role Menu */}
            {currentUser && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700/80 bg-slate-800 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-750 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Menu Akun & Lisensi"
                >
                  {currentUser.role === 'owner' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="max-w-[100px] truncate hidden md:inline">
                    {currentUser.displayName || 'Pengguna'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 text-xs space-y-2.5 z-50 animate-fadeIn">
                    <div className="pb-2 border-b border-slate-800">
                      <p className="font-bold text-white truncate">{currentUser.displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email || currentUser.schoolName}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                          currentUser.role === 'owner'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : currentUser.role === 'licensed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {currentUser.role === 'owner' ? 'Super Admin' : currentUser.role === 'licensed' ? 'Guru Berlisensi' : 'Mode Demo'}
                        </span>
                        {currentUser.licenseCode && (
                          <span className="text-[10px] font-mono text-emerald-400">
                            {currentUser.licenseCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {currentUser.role === 'owner' && onOpenOwnerDashboard && (
                      <button
                        onClick={() => { setShowUserMenu(false); onOpenOwnerDashboard(); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 text-amber-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Buka Dashboard Owner</span>
                      </button>
                    )}

                    {currentUser.role === 'demo' && onOpenActivation && (
                      <button
                        onClick={() => { setShowUserMenu(false); onOpenActivation(); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Key className="w-4 h-4 text-emerald-400" />
                        <span>Aktivasi Kode Lisensi</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        onClick={() => { setShowUserMenu(false); onLogout(); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-red-300 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Keluar / Ganti Akun</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/70"
              title="Buka menu navigasi"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {showMobileMenu && (
          <div className="lg:hidden py-3 border-t border-slate-800 space-y-1 text-xs">
            {onOpenGrading && (
              <button
                onClick={() => { setShowMobileMenu(false); onOpenGrading(); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Buku Nilai (3 Ranah)</span>
              </button>
            )}

            {onOpenDirectCbt && (
              <button
                onClick={() => { setShowMobileMenu(false); onOpenDirectCbt(); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-emerald-600 text-white font-medium flex items-center gap-2"
              >
                <Laptop className="w-4 h-4" />
                <span>Ujian CBT Langsung</span>
              </button>
            )}

            {onOpenQuestionBank && (
              <button
                onClick={() => { setShowMobileMenu(false); onOpenQuestionBank(); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
              >
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Bank Soal (Fase D)</span>
              </button>
            )}

            {onOpenShareCbt && (
              <button
                onClick={() => { setShowMobileMenu(false); onOpenShareCbt(); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Bagikan Link CBT Siswa</span>
              </button>
            )}

            {onOpenCbtConverter && (
              <button
                onClick={() => { setShowMobileMenu(false); onOpenCbtConverter(); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Converter Form & CBT</span>
              </button>
            )}

            {onOpenHolisticAssessment && (
              <button
                onClick={() => { setShowMobileMenu(false); onOpenHolisticAssessment(); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Rubrik Asesmen & P5PPRA</span>
              </button>
            )}

            {onOpenCatalog && (
              <button
                onClick={() => { setShowMobileMenu(false); onOpenCatalog(); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Katalog Tema CP PAIBP</span>
              </button>
            )}

            <button
              onClick={() => { setShowMobileMenu(false); setShowAbout(true); }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
            >
              <Award className="w-4 h-4 text-teal-400" />
              <span>Prinsip Asesmen 2026</span>
            </button>
          </div>
        )}
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              id="btn-close-about-modal"
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                P
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Prinsip Asesmen Deep Learning PAIBP 2026</h3>
                <p className="text-xs text-slate-400">SMP/MTs Fase D (Kelas 7, 8, 9) Kurikulum Merdeka</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Hierarki Kualitas Berpikir (Higher Order Thinking)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-700/80">
                    <span className="text-emerald-300 font-bold block mb-0.5">Deep Understanding</span> &gt; Hafalan Rutin
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-700/80">
                    <span className="text-emerald-300 font-bold block mb-0.5">Reasoning</span> &gt; Recall
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-700/80">
                    <span className="text-emerald-300 font-bold block mb-0.5">Application</span> &gt; Definition
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-700/80">
                    <span className="text-emerald-300 font-bold block mb-0.5">Analysis</span> &gt; Recognition
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-700/80">
                    <span className="text-emerald-300 font-bold block mb-0.5">Reflection</span> &gt; Repetition
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-700/80">
                    <span className="text-emerald-300 font-bold block mb-0.5">Transfer</span> &gt; Routine
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs bg-slate-800/50 p-3.5 rounded-lg border border-slate-700/60">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Kaidah Opsi Homogen & Distribusi Kunci:</h4>
                <p className="text-slate-400 leading-relaxed">
                  Semua opsi jawaban (A, B, C, D) disusun bernada positif dan masuk akal. Perbedaan opsi kunci bukan antara benar vs salah mentah, melainkan pada kedalaman pemahaman tauhid, ketepatan syariat, dan kemaslahatan moral.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Distribusi kunci jawaban (A, B, C, D) dihitung secara proporsional (~25% per kunci) tanpa urutan berpola agar reliabilitas tes terjamin.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                id="btn-close-about-modal-footer"
                onClick={() => setShowAbout(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup Pedoman
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
