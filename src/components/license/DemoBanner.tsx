import React from 'react';
import { Sparkles, AlertTriangle, KeyRound, Info } from 'lucide-react';
import { ClientLicenseState } from '../../types/license';
import { getExpiryNotification } from '../../services/licenseService';

interface Props {
  state: ClientLicenseState;
  onOpenActivation: () => void;
}

export const DemoBanner: React.FC<Props> = ({ state, onOpenActivation }) => {
  // Check for expiring license notice first if PRO
  const expiryNotice = getExpiryNotification();

  if (expiryNotice && expiryNotice.show) {
    const isDanger = expiryNotice.urgency === 'danger';
    return (
      <div
        className={`mb-5 p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
          isDanger
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold">{expiryNotice.message}</p>
            <p className="text-[11px] opacity-90">
              Data Anda tetap aman tersimpan. Perbarui lisensi Anda untuk kelancaran akses tanpa jeda.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenActivation}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 ${
            isDanger
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          PERPANJANG LISENSI
        </button>
      </div>
    );
  }

  // If PRO is active and healthy, do not display demo banner
  if (state.isPro && state.status === 'PRO_ACTIVE') {
    return null;
  }

  // DEMO Mode Banner with live quota counter
  const { quotaToday, demoSettings } = state;
  const generateLeft = Math.max(0, demoSettings.maxGeneratePerDay - quotaToday.generateCount);
  const isNearLimit = generateLeft <= 3 && generateLeft > 0;
  const isExhausted = generateLeft === 0;

  const generatePercent = Math.min(100, Math.round((quotaToday.generateCount / demoSettings.maxGeneratePerDay) * 100));

  return (
    <div className="mb-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-emerald-700/40">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-wide text-white">
                Anda sedang menggunakan MODE DEMO
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                DEMO GRATIS
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Coba fitur utama PAIBP SMART ASSESSMENT PRO. Aktivasi PRO untuk membuka seluruh fitur tanpa batas &amp; export siap cetak.
            </p>

            {/* Warning if near limit or exhausted */}
            {isExhausted ? (
              <p className="text-[11px] text-amber-300 font-semibold mt-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Batas generate soal hari ini telah tercapai (20/20). Aktivasi PRO untuk akses tanpa batas.
              </p>
            ) : isNearLimit ? (
              <p className="text-[11px] text-amber-300 font-semibold mt-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                Anda memiliki {generateLeft} generate soal DEMO tersisa hari ini.
              </p>
            ) : null}
          </div>
        </div>

        {/* Right: Quota Counters & CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Quota Indicators */}
          <div className="bg-slate-950/50 border border-slate-700/60 rounded-xl p-2.5 px-3.5 flex items-center gap-4 text-xs">
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Soal Hari Ini</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {quotaToday.generateCount} / {demoSettings.maxGeneratePerDay}
                </span>
              </div>
              <div className="w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isExhausted ? 'bg-rose-500' : isNearLimit ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${generatePercent}%` }}
                />
              </div>
            </div>

            <div className="border-l border-slate-800 pl-3">
              <span className="text-[10px] text-slate-400 block">Kisi-kisi</span>
              <span className="font-mono text-emerald-400 font-bold text-[11px]">
                {quotaToday.kisiKisiCount} / {demoSettings.maxKisiKisiPerDay}
              </span>
            </div>

            <div className="border-l border-slate-800 pl-3">
              <span className="text-[10px] text-slate-400 block">Paket</span>
              <span className="font-mono text-emerald-400 font-bold text-[11px]">
                {quotaToday.packageCount} / {demoSettings.maxPackagePerDay}
              </span>
            </div>
          </div>

          {/* Activate Button */}
          <button
            onClick={onOpenActivation}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            AKTIFKAN PRO
          </button>
        </div>
      </div>
    </div>
  );
};
