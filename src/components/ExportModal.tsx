import React, { useState } from 'react';
import { AssessmentPackage } from '../types';
import { exportToWordHtml, exportToExcelCsv, exportToAikenFormat } from '../services/assessmentGenerator';
import { FileText, FileSpreadsheet, Copy, Check, Printer, X, Download, Code, Sparkles } from 'lucide-react';

interface ExportModalProps {
  packageData: AssessmentPackage;
  onClose: () => void;
  onOpenCbtConverter?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ packageData, onClose, onOpenCbtConverter }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const generateGoogleDocsText = () => {
    return `
========================================================================
${packageData.identity.schoolName}
${packageData.identity.title}
Mata Pelajaran: ${packageData.identity.subject} | Kelas: ${packageData.identity.grade} (${packageData.identity.phase})
========================================================================

A. CAPAIAN PEMBELAJARAN (CP)
${packageData.cp}

B. TUJUAN PEMBELAJARAN (TP)
${packageData.tpList.map((t, i) => `${i + 1}. ${t}`).join('\n')}

C. KISI-KISI ASESMEN
${packageData.kisiKisi.map(k => `No. ${k.number} | Elemen: ${k.element} | Bloom: ${k.bloomLevel} | SOLO: ${k.soloLevel} | Dimensi: ${k.deepLearningDim} | Kunci: ${k.correctKey}
Indikator: ${k.indicator}`).join('\n\n')}

D. NASKAH SOAL UJIAN
${packageData.questions.map(q => `
${q.number}. ${q.stimulus ? `[STIMULUS] ${q.stimulus}\n` : ''}${q.questionText}
A. ${q.options.find(o => o.key === 'A')?.text}
B. ${q.options.find(o => o.key === 'B')?.text}
C. ${q.options.find(o => o.key === 'C')?.text}
D. ${q.options.find(o => o.key === 'D')?.text}
`).join('\n')}

E. KUNCI JAWABAN & DISTRIBUSI
Kunci: ${packageData.questions.map(q => `${q.number}.${q.correctKey}`).join(', ')}
Distribusi Kunci: A=${packageData.keyDistribution.A}, B=${packageData.keyDistribution.B}, C=${packageData.keyDistribution.C}, D=${packageData.keyDistribution.D}
`.trim();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 text-slate-800 shadow-xl relative max-h-[90vh] overflow-y-auto border border-slate-200">
        <button
          id="btn-close-export-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Pusat Ekspor & Salin Naskah Asesmen</h3>
            <p className="text-xs text-slate-500">
              Format kompatibel langsung dengan Microsoft Word, Google Docs, Google Forms, dan Cetak Ujian
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          {/* Google Form & CBT Full Converter Banner Card */}
          <div className="sm:col-span-2 p-4 rounded-xl border-2 border-purple-400 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm sm:text-base text-purple-950">
                    Converter Soal ke Google Form & CBT Sekolah
                  </h4>
                  <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Baru & Cepat
                  </span>
                </div>
                <p className="text-xs text-purple-800/80 mt-0.5 leading-relaxed">
                  Konversi otomatis ke <strong>Google Form Quiz (Auto-Script 1-Klik)</strong>, Moodle XML, Candy CBT / BeeSMART (.csv), Quizizz, dan AIKEN format standar.
                </p>
              </div>
            </div>
            {onOpenCbtConverter && (
              <button
                id="btn-open-cbt-from-export"
                onClick={() => {
                  onClose();
                  onOpenCbtConverter();
                }}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
              >
                <span>Buka Converter Form & CBT</span>
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Word Export */}
          <div className="p-4 rounded-lg border border-slate-200 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 mb-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h4 className="font-bold text-sm text-slate-900">Microsoft Word (.doc)</h4>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                File Word rapi lengkap dengan Kop Madrasah, Tabel Kisi-kisi, Naskah Soal, Kunci, dan Kartu Soal.
              </p>
            </div>
            <button
              id="btn-export-word"
              onClick={() => exportToWordHtml(packageData)}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File Word (.doc)</span>
            </button>
          </div>

          {/* Excel Export */}
          <div className="p-4 rounded-lg border border-slate-200 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 mb-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900">Excel / Spreadsheet (.csv)</h4>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Tabel terstruktur per butir soal, indikator, taksonomi Bloom-SOLO, opsi A-D, dan kunci.
              </p>
            </div>
            <button
              id="btn-export-excel"
              onClick={() => exportToExcelCsv(packageData)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File Excel (.csv)</span>
            </button>
          </div>

          {/* Google Forms / Aiken */}
          <div className="p-4 rounded-lg border border-slate-200 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-sm text-slate-900">Format Google Forms (Aiken)</h4>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Format teks standar Aiken untuk impor langsung ke Google Forms add-on atau platform CBT.
              </p>
            </div>
            <button
              id="btn-export-aiken"
              onClick={() => handleCopyText(exportToAikenFormat(packageData), 'aiken')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedType === 'aiken' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'aiken' ? 'Tersalin ke Clipboard!' : 'Salin Format Google Forms'}</span>
            </button>
          </div>

          {/* Google Docs Text */}
          <div className="p-4 rounded-lg border border-slate-200 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 mb-2">
                <Copy className="w-5 h-5 text-slate-600" />
                <h4 className="font-bold text-sm text-slate-900">Salin Teks Lengkap (Docs)</h4>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Salin seluruh naskah dan kisi-kisi untuk langsung di-paste ke Google Docs atau Word.
              </p>
            </div>
            <button
              id="btn-export-docs"
              onClick={() => handleCopyText(generateGoogleDocsText(), 'docs')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              {copiedType === 'docs' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'docs' ? 'Tersalin ke Clipboard!' : 'Salin Teks Google Docs'}</span>
            </button>
          </div>
        </div>

        {/* Quick Actions at bottom */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            id="btn-print-doc"
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Langsung / Simpan PDF (Ctrl+P)</span>
          </button>

          <button
            id="btn-copy-json"
            onClick={() => handleCopyText(JSON.stringify(packageData, null, 2), 'json')}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{copiedType === 'json' ? 'JSON Tersalin!' : 'Salin JSON Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
