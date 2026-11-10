import React, { useState } from 'react';
import {
  Key,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Laptop,
  FileCheck,
  Brain,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Info
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingPageProps {
  onEnterWithLicense: () => void;
  onEnterAsDemo: () => void;
  onEnterAsOwner: () => void;
  onOpenGuide: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterWithLicense,
  onEnterAsDemo,
  onEnterAsOwner,
  onOpenGuide
}) => {
  const [showFaq, setShowFaq] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              P
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-tight text-white leading-none">
                  PAIBP FASE D
                </span>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-800/60 uppercase tracking-wider">
                  Kurikulum Merdeka 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                SMP/MTs Fase D (Kelas VII, VIII, IX)
              </p>
            </div>
          </div>

          {/* Quick Header Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <PWAInstallButton />

            <button
              onClick={onOpenGuide}
              className="text-slate-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Panduan</span>
            </button>

            <button
              onClick={onEnterAsOwner}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 text-amber-300 hover:text-white border border-amber-600/40 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Portal Khusus Pemilik Aplikasi / Super Admin"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal Owner</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtle Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Standar Asesmen SK BSKAP No. 020 Tahun 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Sistem Pembuat Asesmen PAIBP <br />
            <span className="text-emerald-400">
              SMP/MTs Fase D Terstandar
            </span>
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Platform asesmen komprehensif untuk guru Pendidikan Agama Islam dan Budi Pekerti (Kelas VII, VIII, IX). Mendukung penalaran HOTS C4–C6, Taksonomi SOLO, Ujian CBT Langsung, serta Buku Nilai 3 Ranah capaian.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {/* CTA 1: Masuk Dengan Lisensi */}
            <button
              onClick={onEnterWithLicense}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Masuk Dengan Kode Lisensi</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* CTA 2: Coba Demo Gratis */}
            <button
              onClick={onEnterAsDemo}
              className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-xs sm:text-sm rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Coba Demo Gratis</span>
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Penyimpanan permanen dan paket ujian lengkap memerlukan kode lisensi resmi guru.
          </p>

          {/* Value Props 4-Card Grid */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center mb-3">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">HOTS & Deep Learning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Penalaran kognitif C4–C6, Taksonomi SOLO Relational, dan stimulus kontekstual nyata.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center mb-3">
                <Laptop className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Ujian CBT Terintegrasi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Langsung diuji ke siswa dengan batas waktu, pengacakan opsi, token ujian, dan link share.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center mb-3">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Buku Nilai (3 Ranah)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rekap capaian Kognitif, Afektif, dan Psikomotorik per Tujuan Pembelajaran di Cloud Firestore.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Ruang Kerja Mandiri</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Data setiap guru terisolasi secara mandiri, data tidak tertukar, aman dan tersinkronisasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="py-12 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-white">
              Perbandingan Hak Akses
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Transparan, aman, dan siap digunakan untuk kebutuhan sekolah.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Fitur Sistem</th>
                    <th className="py-3 px-4 text-center text-slate-400">
                      Mode Demo
                    </th>
                    <th className="py-3 px-4 text-center text-emerald-400 bg-emerald-950/20">
                      Guru Berlisensi
                    </th>
                    <th className="py-3 px-4 text-center text-amber-400">
                      Owner / Super Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Akses Generator Soal PAIBP</td>
                    <td className="py-3 px-4 text-center text-slate-400">Maks 5 soal / sesi</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">Tak Terbatas (10–50 Soal)</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400">Penuh</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Materi & Elemen Fase D</td>
                    <td className="py-3 px-4 text-center text-slate-400">Contoh Terpilih</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">Semua Kelas (VII, VIII, IX)</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400">Penuh</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Ujian CBT Langsung & Link Siswa</td>
                    <td className="py-3 px-4 text-center text-slate-400">Pratinjau</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">Aktif Penuh</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400">Penuh</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Buku Nilai (3 Ranah Capaian)</td>
                    <td className="py-3 px-4 text-center text-slate-400">Pratinjau</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">Simpan Cloud Database</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400">Penuh</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Ekspor Word, PDF, & Google Form</td>
                    <td className="py-3 px-4 text-center text-slate-400">Dibatasi</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">Bebas Unduh Lengkap</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400">Penuh</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">Penerbitan Kode Lisensi</td>
                    <td className="py-3 px-4 text-center text-slate-500">—</td>
                    <td className="py-3 px-4 text-center text-slate-500">—</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400">Owner Tunggal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-slate-900/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Informasi Aktivasi & Lisensi</span>
            </h3>
            <button
              onClick={() => setShowFaq(!showFaq)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>{showFaq ? 'Sembunyikan' : 'Buka Detail'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFaq ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
              <h4 className="font-semibold text-white mb-1">Bagaimana cara mendapatkan Kode Lisensi?</h4>
              <p className="text-slate-400 leading-relaxed">
                Kode Lisensi diterbitkan secara resmi oleh Owner / Super Admin aplikasi. Anda dapat meminta kode lisensi melalui koordinator MGMP PAIBP atau pimpinan madrasah/sekolah Anda.
              </p>
            </div>

            {showFaq && (
              <>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <h4 className="font-semibold text-white mb-1">Apakah data asesmen saya tersimpan aman?</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Ya. Seluruh bank soal, hasil CBT, dan buku nilai siswa tersimpan aman di Cloud Firestore dan di-cache secara otomatis di browser sehingga dapat dibuka kembali secara offline.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <h4 className="font-semibold text-white mb-1">Bagaimana isolasi data antar-guru bekerja?</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Setiap guru yang mengaktifkan kode lisensi memiliki Workspace ID unik. Soal dan nilai yang Anda simpan tidak dapat dibaca atau diedit oleh guru lain.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="text-slate-400 font-semibold">
              PAIBP FASE D SMART LEARNING PRO 2026
            </p>
            <p className="text-[11px] text-slate-500">
              Pendidikan Agama Islam dan Budi Pekerti • SMP/MTs (Kelas 7, 8, 9)
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            Hak Cipta Terpelihara © 2026 • Kurikulum Merdeka
          </div>
        </div>
      </footer>
    </div>
  );
};
