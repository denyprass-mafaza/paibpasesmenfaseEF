import React from 'react';
import { ShieldCheck, Check, X, Sparkles, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenActivation: () => void;
  featureTitle?: string;
  featureDescription?: string;
}

export const ProFeatureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenActivation,
  featureTitle = 'Fitur Eksklusif PRO',
  featureDescription,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all max-h-[92vh] flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-4 sm:p-6 text-white text-center relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
            <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-amber-400 text-slate-900 shadow-xs mb-2">
            🔐 FITUR PRO
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">{featureTitle}</h3>
          <p className="text-emerald-100 text-xs mt-1 leading-relaxed">
            {featureDescription || 'Fitur ini tersedia pada versi PRO PAIBP Smart Assessment Pro 2026.'}
          </p>
        </div>

        {/* Benefits List */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <p className="text-xs font-semibold text-slate-700">
            Aktifkan lisensi Anda untuk membuka seluruh fitur premium:
          </p>

          <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span><b>Generator Lebih Banyak:</b> Tanpa batas kuota harian &amp; mode batch</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span><b>Bank Soal Lengkap:</b> Penyimpanan tanpa batas &amp; fitur import soal</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span><b>Export Siap Cetak:</b> Format Word (.doc), PDF, Excel (.xlsx), CSV &amp; Google Forms</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span><b>Analisis Asesmen Lengkap:</b> Daya pembeda, tingkat kesukaran &amp; seluruh siswa</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span><b>Rubrik Otomatis:</b> Skala 1-4 berbasis KKTP &amp; AI Validator 18 QC parameter</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span><b>Bebas Watermark:</b> Dokumen bersih tanpa label DEMO</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenActivation();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-700/20 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AKTIVASI PRO SEKARANG
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-semibold transition"
            >
              KEMBALI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
