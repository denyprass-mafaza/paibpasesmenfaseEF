import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Mail,
  X,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { ClientLicenseState } from '../../types/license';
import { deactivateLicense } from '../../services/licenseService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  state: ClientLicenseState;
  onOpenActivation: () => void;
}

export const LicenseInfoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  state,
  onOpenActivation,
}) => {
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  if (!isOpen) return null;

  const isProActive = state.isPro && state.status === 'PRO_ACTIVE';
  const isExpired = state.status === 'EXPIRED';
  const isRevoked = state.status === 'REVOKED';
  const isDemo = state.status === 'DEMO';

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    await deactivateLicense();
    setIsDeactivating(false);
    setShowDeactivateConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wide">INFORMASI LISENSI PENGGUNA</h3>
              <p className="text-[11px] text-slate-400">PAIBP Smart Assessment Pro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Status Badge Block */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-700">STATUS LISENSI</span>
            {isProActive && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> PRO AKTIF
              </span>
            )}
            {isDemo && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> MODE DEMO
              </span>
            )}
            {isExpired && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> EXPIRED
              </span>
            )}
            {isRevoked && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> REVOKED
              </span>
            )}
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Produk:</span>
              <span className="font-semibold text-slate-800 text-right">
                PAIBP SMART ASSESSMENT PRO – FASE E &amp; F
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tipe Lisensi:</span>
              <span className="font-semibold text-slate-800">
                {isProActive && state.licenseInfo
                  ? state.licenseInfo.license_type
                  : 'Demo Terbatas'}
              </span>
            </div>

            {isProActive && state.licenseInfo && (
              <>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Kode Lisensi:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {state.licenseInfo.license_code}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tanggal Aktivasi:</span>
                  <span className="font-medium text-slate-700">
                    {state.licenseInfo.activated_at
                      ? new Date(state.licenseInfo.activated_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Masa Berlaku:</span>
                  <span className="font-medium text-slate-700">
                    {state.licenseInfo.expired_at
                      ? new Date(state.licenseInfo.expired_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Tidak ada (Lifetime)'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Kapasitas Perangkat:</span>
                  <span className="font-medium text-slate-700">
                    {state.licenseInfo.device_count || 1} / {state.licenseInfo.max_devices || 1}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Device ID:</span>
              <span className="font-mono text-[11px] text-slate-400">
                {state.deviceId.slice(0, 10)}...{state.deviceId.slice(-6)}
              </span>
            </div>
          </div>

          {/* Action Area */}
          {isDemo || isExpired ? (
            <div className="space-y-3">
              <button
                onClick={() => {
                  onClose();
                  onOpenActivation();
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                AKTIFKAN PRO
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {!showDeactivateConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeactivateConfirm(true)}
                  className="w-full py-2 px-3 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-medium transition flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Lepas Lisensi dari Perangkat Ini
                </button>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-center">
                  <p className="text-[11px] text-rose-800 font-semibold">
                    Yakin ingin melepas lisensi ini dari browser ini? Anda dapat mengaktifkannya kembali dengan kode yang sama.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleDeactivate}
                      disabled={isDeactivating}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition"
                    >
                      {isDeactivating ? 'Melepas...' : 'Ya, Lepas Lisensi'}
                    </button>
                    <button
                      onClick={() => setShowDeactivateConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-semibold"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Owner Link */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Butuh bantuan aktivasi?</span>
            <a
              href={`https://wa.me/${state.contactInfo.whatsapp.replace(/\D/g, '')}?text=Halo%20Owner%20PAIBP,%20saya%20membutuhkan%20bantuan%20lisensi`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Hubungi OWNER
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
