import React from 'react';
import { Key, ArrowRight } from 'lucide-react';
import { DemoSession, DemoSettings } from '../types';

interface DemoBannerProps {
  demoSession: DemoSession | null;
  demoSettings: DemoSettings;
  onOpenActivation: () => void;
  onExitDemo: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  demoSession,
  demoSettings,
  onOpenActivation,
  onExitDemo
}) => {
  const usageCount = demoSession?.usageCount ?? 0;
  const maxUsage = demoSettings.maxGenerationsPerSession || 2;
  const remaining = Math.max(0, maxUsage - usageCount);
  const maxQuestions = demoSettings.maxQuestionsPerGeneration || 5;

  return (
    <div className="bg-amber-950/90 border-b border-amber-800/80 text-amber-200 px-4 py-2 text-xs sticky top-16 z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Left Info */}
        <div className="flex items-center gap-2">
          <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded uppercase shrink-0">
            Mode Demo
          </span>
          <span className="text-slate-300">
            Akses evaluasi terbatas (Maks {maxQuestions} soal/sesi).
          </span>
          <span className="hidden md:inline-flex items-center gap-1 font-medium text-amber-300">
            <span>Sisa kuota:</span>
            <span className="font-bold">{remaining} / {maxUsage} kali generasi</span>
          </span>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenActivation}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Aktifkan Lisensi</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            onClick={onExitDemo}
            className="text-slate-400 hover:text-white px-2 py-1 rounded text-xs transition-colors cursor-pointer"
            title="Keluar dari mode demo dan kembali ke beranda"
          >
            Keluar Demo
          </button>
        </div>
      </div>
    </div>
  );
};
