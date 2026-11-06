import React, { useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Mail,
  X,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { activateProLicense, getCurrentLicenseState } from '../../services/licenseService';
import { ClientLicenseState } from '../../types/license';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (state: ClientLicenseState) => void;
}

export const ActivationModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    state?: ClientLicenseState;
  } | null>(null);
  const [showTestCodes, setShowTestCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  if (!isOpen) return null;

  const currentState = getCurrentLicenseState();
  const contactInfo = currentState.contactInfo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setResult(null);

    const res = await activateProLicense(code);
    setIsLoading(false);
    setResult(res);

    if (res.success && res.state) {
      if (onSuccess) onSuccess(res.state);
    }
  };

  const handleCopy = (sample: string) => {
    navigator.clipboard.writeText(sample);
    setCopiedCode(sample);
    setCode(sample);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">AKTIVASI LISENSI PRO</h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Buka seluruh kemampuan PAIBP SMART ASSESSMENT PRO
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {result?.success ? (
            /* Success State */
            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-800">🎉 Aktivasi Berhasil!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  PAIBP SMART ASSESSMENT PRO sekarang aktif dalam <b>MODE PRO</b>.
                </p>
              </div>

              {result.state?.licenseInfo && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200/70">
                    <span className="text-slate-500">Status Lisensi:</span>
                    <span className="font-bold text-emerald-600">PRO AKTIF</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/70">
                    <span className="text-slate-500">Tipe Lisensi:</span>
                    <span className="font-bold text-slate-800">{result.state.licenseInfo.license_type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/70">
                    <span className="text-slate-500">Aktivasi:</span>
                    <span className="font-medium text-slate-700">
                      {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/70">
                    <span className="text-slate-500">Masa Berlaku:</span>
                    <span className="font-medium text-slate-700">
                      {result.state.licenseInfo.expired_at
                        ? new Date(result.state.licenseInfo.expired_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Tidak ada (Lifetime)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Kapasitas Perangkat:</span>
                    <span className="font-medium text-slate-700">
                      {result.state.licenseInfo.device_count || 1} / {result.state.licenseInfo.max_devices || 1} Perangkat
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                MULAI MENGGUNAKAN PRO
              </button>
            </div>
          ) : (
            /* Activation Input Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {result && !result.success && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-relaxed">{result.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Masukkan Kode Aktivasi Resmi Anda:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="PAIBP-EF26-XXXX-XXXX-XXXX"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-xs font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase font-semibold text-slate-900 bg-slate-50/50"
                    autoFocus
                    required
                  />
                  <div className="absolute right-3 top-3 text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: <code>PAIBP-EF26-XXXX-XXXX-XXXX</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !code.trim()}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    AKTIFKAN LISENSI
                  </>
                )}
              </button>

              {/* Contact Owner Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Belum memiliki kode aktivasi?</p>
                  <div className="flex items-center justify-center gap-2">
                    {contactInfo.whatsapp && (
                      <a
                        href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}?text=Halo%20Owner%20PAIBP,%20saya%20ingin%20membeli/aktivasi%20lisensi%20PRO`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Hubungi Owner (WhatsApp)
                      </a>
                    )}
                    {contactInfo.email && (
                      <a
                        href={`mailto:${contactInfo.email}?subject=Permintaan%20Aktivasi%20Lisensi%20PAIBP%20Pro`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-[11px] font-semibold transition"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Developer / Testing Sample Codes Accordion */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestCodes(!showTestCodes)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg transition"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    Contoh Kode Uji (Test Scenarios 5 - 11)
                  </span>
                  <span>{showTestCodes ? '▲ Tutup' : '▼ Lihat'}</span>
                </button>

                {showTestCodes && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px]">
                    <div className="text-slate-600 font-semibold mb-1">
                      Klik tombol salin di samping untuk mengisi kode:
                    </div>

                    <div className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded-md">
                      <div>
                        <div className="font-mono font-bold text-emerald-700">PAIBP-EF26-LIFE-PRO1-9988</div>
                        <div className="text-[10px] text-slate-400">Lifetime Pro (Aktif tanpa batas waktu, 3 Perangkat)</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('PAIBP-EF26-LIFE-PRO1-9988')}
                        className="p-1 text-slate-500 hover:text-emerald-600"
                        title="Salin & Gunakan"
                      >
                        {copiedCode === 'PAIBP-EF26-LIFE-PRO1-9988' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded-md">
                      <div>
                        <div className="font-mono font-bold text-blue-700">PAIBP-EF26-YEAR-2026-7711</div>
                        <div className="text-[10px] text-slate-400">Yearly Pro (Aktif 365 Hari, 1 Perangkat)</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('PAIBP-EF26-YEAR-2026-7711')}
                        className="p-1 text-slate-500 hover:text-blue-600"
                        title="Salin & Gunakan"
                      >
                        {copiedCode === 'PAIBP-EF26-YEAR-2026-7711' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded-md">
                      <div>
                        <div className="font-mono font-bold text-amber-700">PAIBP-EF26-DEV1-MAX1-5533</div>
                        <div className="text-[10px] text-slate-400">Single Device (Batas Maksimal 1 Perangkat)</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('PAIBP-EF26-DEV1-MAX1-5533')}
                        className="p-1 text-slate-500 hover:text-amber-600"
                        title="Salin & Gunakan"
                      >
                        {copiedCode === 'PAIBP-EF26-DEV1-MAX1-5533' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded-md">
                      <div>
                        <div className="font-mono font-bold text-slate-600">PAIBP-EF26-EXPD-TEST-0001</div>
                        <div className="text-[10px] text-rose-500 font-medium">Uji Coba Expired (Kadaluwarsa 2025)</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('PAIBP-EF26-EXPD-TEST-0001')}
                        className="p-1 text-slate-500 hover:text-rose-600"
                        title="Salin & Gunakan"
                      >
                        {copiedCode === 'PAIBP-EF26-EXPD-TEST-0001' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded-md">
                      <div>
                        <div className="font-mono font-bold text-slate-600">PAIBP-EF26-REVK-STOP-4422</div>
                        <div className="text-[10px] text-rose-500 font-medium">Uji Coba Revoked (Lisensi Dicabut)</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('PAIBP-EF26-REVK-STOP-4422')}
                        className="p-1 text-slate-500 hover:text-rose-600"
                        title="Salin & Gunakan"
                      >
                        {copiedCode === 'PAIBP-EF26-REVK-STOP-4422' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
