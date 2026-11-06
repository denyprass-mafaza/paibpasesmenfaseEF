import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  LayoutDashboard,
  PlusCircle,
  FileSpreadsheet,
  Settings,
  Sliders,
  History,
  Search,
  Filter,
  Copy,
  Download,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Ban,
  CheckCircle2,
  Trash2,
  Users,
  Smartphone,
  Eye,
  LogOut,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  LicenseRecord,
  LicenseType,
  LicenseStatus,
  FeatureFlagKey,
  FeatureAccess,
  OwnerOverviewStats,
  ActivationLogRecord,
  DemoSettings,
  OwnerContactInfo,
} from '../../types/license';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefreshLicenseState: () => void;
}

type OwnerTab =
  | 'overview'
  | 'generator'
  | 'bulk'
  | 'management'
  | 'features'
  | 'settings'
  | 'logs';

export const OwnerPanelModal: React.FC<Props> = ({ isOpen, onClose, onRefreshLicenseState }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');

  // Owner Data States
  const [overview, setOverview] = useState<OwnerOverviewStats | null>(null);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [logs, setLogs] = useState<ActivationLogRecord[]>([]);
  const [settings, setSettings] = useState<{
    contactInfo: OwnerContactInfo;
    demoSettings: DemoSettings;
    featureFlags: Record<FeatureFlagKey, FeatureAccess>;
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Single Generate Form
  const [genType, setGenType] = useState<LicenseType>('LIFETIME');
  const [genDuration, setGenDuration] = useState(30);
  const [genCustomEnd, setGenCustomEnd] = useState('');
  const [genLimit, setGenLimit] = useState(1);
  const [genMaxDevices, setGenMaxDevices] = useState(1);
  const [genCustomer, setGenCustomer] = useState('');
  const [genNotes, setGenNotes] = useState('');
  const [lastGenerated, setLastGenerated] = useState<LicenseRecord | null>(null);

  // Bulk Generate Form
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkType, setBulkType] = useState<LicenseType>('LIFETIME');
  const [bulkMaxDevices, setBulkMaxDevices] = useState(1);
  const [bulkCustomerPrefix, setBulkCustomerPrefix] = useState('Paket Guru PAIBP');
  const [bulkNotes, setBulkNotes] = useState('Batch pengadaan lisensi sekolah');
  const [lastBulkList, setLastBulkList] = useState<LicenseRecord[]>([]);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [copiedCode, setCopiedCode] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Check existing session
  useEffect(() => {
    const sessionToken = sessionStorage.getItem('paibp_owner_session');
    if (sessionToken === 'OWNER_AUTHENTICATED_SESSION_KEY_2026') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOverview();
      fetchLicenses();
      fetchLogs();
      fetchSettings();
    }
  }, [isAuthenticated, activeTab, statusFilter, typeFilter]);

  if (!isOpen) return null;

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-owner-token': 'OWNER_AUTHENTICATED_SESSION_KEY_2026',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/owner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('paibp_owner_session', data.token);
      } else {
        setLoginError(data.message || 'Password salah.');
      }
    } catch (err: any) {
      setLoginError('Gagal menghubungi server: ' + err.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('paibp_owner_session');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/owner/overview', { headers: authHeaders });
      const data = await res.json();
      if (data.success) setOverview(data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLicenses = async () => {
    try {
      const query = new URLSearchParams({
        status: statusFilter,
        type: typeFilter,
        search: searchQuery,
      }).toString();
      const res = await fetch(`/api/owner/licenses?${query}`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setLicenses(data.licenses);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/owner/logs', { headers: authHeaders });
      const data = await res.json();
      if (data.success) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/owner/settings', { headers: authHeaders });
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/owner/generate-license', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          license_type: genType,
          duration_days: genDuration,
          end_date: genCustomEnd,
          activation_limit: genLimit,
          max_devices: genMaxDevices,
          customer_label: genCustomer,
          notes: genNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastGenerated(data.license);
        fetchLicenses();
        fetchOverview();
        onRefreshLicenseState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/owner/bulk-generate', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          count: bulkCount,
          license_type: bulkType,
          activation_limit: 1,
          max_devices: bulkMaxDevices,
          customer_label_prefix: bulkCustomerPrefix,
          notes: bulkNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastBulkList(data.licenses);
        fetchLicenses();
        fetchOverview();
        onRefreshLicenseState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLicense = async (
    licenseId: string,
    action: 'revoke' | 'suspend' | 'activate' | 'reset_devices' | 'reset_activation',
    payload?: any
  ) => {
    try {
      const res = await fetch('/api/owner/update-license', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ licenseId, action, payload }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLicenses();
        fetchOverview();
        onRefreshLicenseState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg('Pengaturan Owner berhasil disimpan!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
        onRefreshLicenseState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = (list: LicenseRecord[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(
      list.map((l) => ({
        'Kode Lisensi': l.license_code,
        Tipe: l.license_type,
        Status: l.status,
        'Maks Perangkat': l.max_devices,
        'Pelanggan / Label': l.customer_label,
        'Dibuat Pada': l.created_at,
        'Kedaluwarsa': l.expired_at || 'LIFETIME',
        Catatan: l.notes,
      }))
    );
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
  };

  const handleExportExcel = (list: LicenseRecord[], filename: string) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(
      list.map((l, i) => ({
        No: i + 1,
        'Kode Lisensi': l.license_code,
        Tipe: l.license_type,
        Status: l.status,
        'Batas Perangkat': l.max_devices,
        'Jumlah Aktivasi': l.activation_count,
        'Perangkat Terdaftar': l.devices.length,
        Pelanggan: l.customer_label,
        Kedaluwarsa: l.expired_at || 'LIFETIME',
        Dibuat: l.created_at,
        Catatan: l.notes,
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, 'Lisensi_PAIBP');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Top Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-wide text-white">
                  PAIBP OWNER PANEL
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase tracking-wider">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pusat Kendali Lisensi, Kuota Demo, Feature Flags &amp; Monitoring Sistem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Authentication View */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center max-w-md mx-auto my-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Kredensial Owner Diperlukan</h3>
            <p className="text-xs text-slate-400 mb-6">
              Hanya akun OWNER terverifikasi yang memiliki izin mengelola lisensi, feature flags, dan kuota.
            </p>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left">
                  {loginError}
                </div>
              )}
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password Owner:
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password owner..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  autoFocus
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Default pengujian: <code>PAIBPOwner2026!</code>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                MASUK KE OWNER PANEL
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard Body */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-60 bg-slate-950/80 border-r border-slate-800 p-3 space-y-1 overflow-x-auto lg:overflow-y-auto shrink-0 flex lg:flex-col">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('generator')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'generator'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Generate Lisensi Baru</span>
              </button>

              <button
                onClick={() => setActiveTab('bulk')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'bulk'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Bulk Generator (Massal)</span>
              </button>

              <button
                onClick={() => setActiveTab('management')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'management'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Manajemen Lisensi</span>
              </button>

              <button
                onClick={() => setActiveTab('features')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'features'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Feature Flags Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan Demo &amp; Kontak</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  activeTab === 'logs'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Audit &amp; Aktivasi Logs</span>
              </button>
            </div>

            {/* Main Panel Content Area */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-900/50">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && overview && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Statistik Sistem Lisensi</h3>
                    <p className="text-xs text-slate-400">Ringkasan status lisensi dan aktivitas pengguna hari ini</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase block">Total Lisensi</span>
                      <span className="text-2xl font-extrabold text-white mt-1 block">{overview.totalLicenses}</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Tercatat di sistem</span>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                      <span className="text-[11px] text-emerald-400 font-semibold uppercase block">Lisensi Aktif</span>
                      <span className="text-2xl font-extrabold text-emerald-300 mt-1 block">{overview.activeLicenses}</span>
                      <span className="text-[10px] text-emerald-500/80 mt-1 block">Mode PRO Aktif</span>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40">
                      <span className="text-[11px] text-blue-400 font-semibold uppercase block">Belum Digunakan</span>
                      <span className="text-2xl font-extrabold text-blue-300 mt-1 block">{overview.unusedLicenses}</span>
                      <span className="text-[10px] text-blue-500/80 mt-1 block">Siap didistribusikan</span>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40">
                      <span className="text-[11px] text-amber-400 font-semibold uppercase block">Aktivasi Hari Ini</span>
                      <span className="text-2xl font-extrabold text-amber-300 mt-1 block">{overview.activationsToday}</span>
                      <span className="text-[10px] text-amber-500/80 mt-1 block">Total: {overview.totalActivations}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        Status Lisensi Lainnya
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center py-2 border-b border-slate-700/60">
                          <span className="text-rose-400 font-medium">Lisensi Expired (Kedaluwarsa):</span>
                          <span className="font-mono font-bold text-rose-300">{overview.expiredLicenses}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-700/60">
                          <span className="text-slate-400 font-medium">Lisensi Dicabut (Revoked):</span>
                          <span className="font-mono font-bold text-slate-300">{overview.revokedLicenses}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-emerald-400 font-medium">Perangkat Terdaftar:</span>
                          <span className="font-mono font-bold text-emerald-300">{overview.devicesRegistered} Perangkat</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                          Aksi Cepat Owner
                        </h4>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                          Anda dapat membuat kode tunggal, menghasilkan paket lisensi massal (bulk) hingga 100 kode untuk satu sekolah/MKKS, mengontrol feature flags, atau mereset perangkat pelanggan yang berganti laptop.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveTab('generator')}
                          className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                        >
                          + Buat Lisensi
                        </button>
                        <button
                          onClick={() => setActiveTab('bulk')}
                          className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition"
                        >
                          Generate 100 Massal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SINGLE LICENSE GENERATOR */}
              {activeTab === 'generator' && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Generator Lisensi Baru</h3>
                    <p className="text-xs text-slate-400">
                      Sistem akan membuat kode acak berentropi tinggi yang sulit ditebak sesuai standar keamanan.
                    </p>
                  </div>

                  {lastGenerated && (
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> KODE LISENSI BERHASIL DIBUAT:
                        </span>
                        <button
                          onClick={() => copyToClipboard(lastGenerated.license_code)}
                          className="p-1 text-slate-300 hover:text-white"
                          title="Salin"
                        >
                          {copiedCode === lastGenerated.license_code ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg font-mono text-sm font-bold text-emerald-300 text-center tracking-wider">
                        {lastGenerated.license_code}
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between">
                        <span>Tipe: {lastGenerated.license_type}</span>
                        <span>Maks Perangkat: {lastGenerated.max_devices}</span>
                        <span>Pelanggan: {lastGenerated.customer_label}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleGenerateSingle} className="space-y-4 bg-slate-800/50 p-5 rounded-xl border border-slate-700 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Tipe Lisensi:</label>
                        <select
                          value={genType}
                          onChange={(e) => setGenType(e.target.value as LicenseType)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        >
                          <option value="LIFETIME">LIFETIME (Tanpa Kedaluwarsa)</option>
                          <option value="YEARLY">YEARLY (365 Hari)</option>
                          <option value="TRIAL">TRIAL (Uji Coba)</option>
                          <option value="CUSTOM">CUSTOM (Tanggal Spesifik)</option>
                        </select>
                      </div>

                      {genType === 'CUSTOM' ? (
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Tanggal Berakhir:</label>
                          <input
                            type="date"
                            value={genCustomEnd}
                            onChange={(e) => setGenCustomEnd(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                            required
                          />
                        </div>
                      ) : genType === 'TRIAL' ? (
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Durasi Hari:</label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={genDuration}
                            onChange={(e) => setGenDuration(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Masa Berlaku:</label>
                          <input
                            type="text"
                            disabled
                            value={genType === 'LIFETIME' ? 'Aktif Selamanya' : '365 Hari'}
                            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-slate-400"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Maksimal Perangkat (Devices):</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={genMaxDevices}
                          onChange={(e) => setGenMaxDevices(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                        <p className="text-[10px] text-slate-500 mt-0.5">Berapa laptop yang boleh diaktivasi</p>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Batas Aktivasi (Count):</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={genLimit}
                          onChange={(e) => setGenLimit(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Label Pelanggan / Guru / Sekolah:</label>
                      <input
                        type="text"
                        value={genCustomer}
                        onChange={(e) => setGenCustomer(e.target.value)}
                        placeholder="Contoh: SMAN 1 Belajar - Ibu Guru Fatimah"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Catatan Tambahan:</label>
                      <input
                        type="text"
                        value={genNotes}
                        onChange={(e) => setGenNotes(e.target.value)}
                        placeholder="Contoh: Pembelian via WhatsApp 05 Nov 2026"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      GENERATE LICENSE
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: BULK GENERATOR */}
              {activeTab === 'bulk' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Bulk License Generator (Massal)</h3>
                    <p className="text-xs text-slate-400">
                      Hasilkan puluhan hingga 100 kode lisensi unik sekaligus dan ekspor langsung ke Excel atau CSV.
                    </p>
                  </div>

                  <form onSubmit={handleBulkGenerate} className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 text-xs space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Jumlah Kode:</label>
                        <select
                          value={bulkCount}
                          onChange={(e) => setBulkCount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        >
                          <option value="5">5 Kode</option>
                          <option value="10">10 Kode</option>
                          <option value="25">25 Kode</option>
                          <option value="50">50 Kode</option>
                          <option value="100">100 Kode (Uji TEST 14)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Tipe Lisensi:</label>
                        <select
                          value={bulkType}
                          onChange={(e) => setBulkType(e.target.value as LicenseType)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        >
                          <option value="LIFETIME">LIFETIME (Tanpa Batas)</option>
                          <option value="YEARLY">YEARLY (1 Tahun)</option>
                          <option value="TRIAL">TRIAL (14 Hari)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Maksimal Perangkat:</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={bulkMaxDevices}
                          onChange={(e) => setBulkMaxDevices(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Prefix Label Pelanggan:</label>
                        <input
                          type="text"
                          value={bulkCustomerPrefix}
                          onChange={(e) => setBulkCustomerPrefix(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Catatan Batch:</label>
                        <input
                          type="text"
                          value={bulkNotes}
                          onChange={(e) => setBulkNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      GENERATE {bulkCount} KODE LISENSI MASSAL
                    </button>
                  </form>

                  {lastBulkList.length > 0 && (
                    <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="font-bold text-emerald-400 text-xs">
                          Berhasil Menghasilkan {lastBulkList.length} Kode Unik:
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              copyToClipboard(lastBulkList.map((l) => l.license_code).join('\n'))
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            {copiedCode ? 'Disalin!' : 'Copy Semua'}
                          </button>
                          <button
                            onClick={() => handleExportCSV(lastBulkList, `Bulk_Lisensi_PAIBP_${lastBulkList.length}`)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download CSV
                          </button>
                          <button
                            onClick={() => handleExportExcel(lastBulkList, `Bulk_Lisensi_PAIBP_${lastBulkList.length}`)}
                            className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Excel
                          </button>
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-emerald-400 space-y-1 custom-scrollbar">
                        {lastBulkList.map((lic, idx) => (
                          <div key={lic.license_id} className="flex justify-between items-center py-0.5 border-b border-slate-900">
                            <span>
                              {idx + 1}. {lic.license_code}
                            </span>
                            <span className="text-slate-500">{lic.customer_label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MANAGEMENT */}
              {activeTab === 'management' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white">Manajemen Lisensi Pelanggan</h3>
                      <p className="text-xs text-slate-400">Total {licenses.length} lisensi terdaftar</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari kode/pelanggan..."
                          className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs w-48 focus:outline-none"
                        />
                      </div>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="UNUSED">UNUSED</option>
                        <option value="EXPIRED">EXPIRED</option>
                        <option value="REVOKED">REVOKED</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>

                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      >
                        <option value="ALL">Semua Tipe</option>
                        <option value="LIFETIME">LIFETIME</option>
                        <option value="YEARLY">YEARLY</option>
                        <option value="TRIAL">TRIAL</option>
                        <option value="CUSTOM">CUSTOM</option>
                      </select>

                      <button
                        onClick={() => handleExportExcel(licenses, 'Database_Lisensi_PAIBP_Export')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                        title="Ekspor Seluruh Lisensi ke Excel"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Excel
                      </button>
                    </div>
                  </div>

                  {/* License Table */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Kode Lisensi</th>
                            <th className="p-3">Pelanggan</th>
                            <th className="p-3">Tipe</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Perangkat</th>
                            <th className="p-3">Kedaluwarsa</th>
                            <th className="p-3 text-right">Aksi Owner</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {licenses.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-500">
                                Tidak ada lisensi yang cocok dengan filter.
                              </td>
                            </tr>
                          ) : (
                            licenses.map((lic) => {
                              const isRevoked = lic.status === 'REVOKED';
                              const isSuspended = lic.status === 'SUSPENDED';
                              const isActive = lic.status === 'ACTIVE';
                              return (
                                <tr key={lic.license_id} className="hover:bg-slate-900/40 transition">
                                  <td className="p-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-amber-300">
                                        {lic.license_code}
                                      </span>
                                      <button
                                        onClick={() => copyToClipboard(lic.license_code)}
                                        className="text-slate-500 hover:text-white"
                                        title="Salin Kode"
                                      >
                                        {copiedCode === lic.license_code ? (
                                          <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                    <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                                      {lic.notes || '-'}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className="font-medium text-slate-200 block">{lic.customer_label}</span>
                                    <span className="text-[10px] text-slate-500">
                                      Dibuat: {new Date(lic.created_at).toLocaleDateString('id-ID')}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className="font-semibold text-slate-300">{lic.license_type}</span>
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        isActive
                                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                          : isRevoked
                                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                          : isSuspended
                                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                          : lic.status === 'EXPIRED'
                                          ? 'bg-red-950 text-red-400 border border-red-800'
                                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                                      }`}
                                    >
                                      {lic.status}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className="font-mono font-semibold text-slate-300">
                                      {lic.devices.length} / {lic.max_devices}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block">
                                      Akt: {lic.activation_count}x
                                    </span>
                                  </td>
                                  <td className="p-3 text-[11px] text-slate-400">
                                    {lic.expired_at
                                      ? new Date(lic.expired_at).toLocaleDateString('id-ID')
                                      : 'Lifetime'}
                                  </td>
                                  <td className="p-3 text-right space-x-1">
                                    {/* Reset Device Activation Button (Requirement 22) */}
                                    <button
                                      onClick={() => {
                                        setConfirmModal({
                                          isOpen: true,
                                          title: 'Reset Device Activation',
                                          message: `Reset binding perangkat untuk lisensi "${lic.license_code}" (${lic.customer_label})? Perangkat terdaftar akan dihapus sehingga pelanggan dapat mengaktivasi ulang pada perangkat baru.`,
                                          onConfirm: () => {
                                            handleUpdateLicense(lic.license_id, 'reset_devices');
                                            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                          },
                                        });
                                      }}
                                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold transition"
                                      title="Reset Device Binding Pelanggan (Ganti Laptop)"
                                    >
                                      Reset Device
                                    </button>

                                    {/* Revoke Button (Requirement 21) */}
                                    {!isRevoked ? (
                                      <button
                                        onClick={() => {
                                          setConfirmModal({
                                            isOpen: true,
                                            title: 'Revoke (Cabut) Lisensi',
                                            message: `Apakah Anda yakin ingin me-revoke lisensi ${lic.license_code}? Lisensi ini tidak akan dapat digunakan lagi.`,
                                            onConfirm: () => {
                                              handleUpdateLicense(lic.license_id, 'revoke');
                                              setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                            },
                                          });
                                        }}
                                        className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[10px] font-semibold transition"
                                        title="Cabut Lisensi"
                                      >
                                        Revoke
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleUpdateLicense(lic.license_id, 'activate')}
                                        className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 text-[10px] font-semibold transition"
                                      >
                                        Reaktifkan
                                      </button>
                                    )}

                                    {/* Suspend Button */}
                                    {!isRevoked && (
                                      <button
                                        onClick={() =>
                                          handleUpdateLicense(
                                            lic.license_id,
                                            isSuspended ? 'activate' : 'suspend'
                                          )
                                        }
                                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition"
                                      >
                                        {isSuspended ? 'Buka' : 'Suspend'}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: FEATURE FLAGS MATRIX */}
              {activeTab === 'features' && settings && (
                <div className="space-y-5 max-w-3xl">
                  <div>
                    <h3 className="text-base font-bold text-white">Owner Feature Control Matrix</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Atur izin akses fitur apakah dapat dicoba dalam mode DEMO, hanya untuk versi PRO, atau DINONAKTIFKAN sementara tanpa mengubah source code.
                    </p>
                  </div>

                  {saveSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {saveSuccessMsg}
                    </div>
                  )}

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Nama Fitur</th>
                          <th className="p-3">Keterangan</th>
                          <th className="p-3 text-right">Akses Kontrol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {Object.entries(settings.featureFlags).map(([key, val]) => (
                          <tr key={key} className="hover:bg-slate-900/40 transition">
                            <td className="p-3 font-mono font-semibold text-amber-300">{key}</td>
                            <td className="p-3 text-slate-400 capitalize">
                              {key.replace(/_/g, ' ')}
                            </td>
                            <td className="p-3 text-right">
                              <select
                                value={val}
                                onChange={(e) => {
                                  const newVal = e.target.value as FeatureAccess;
                                  setSettings((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          featureFlags: { ...prev.featureFlags, [key]: newVal },
                                        }
                                      : null
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  val === 'DEMO'
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : val === 'PRO'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                                }`}
                              >
                                <option value="DEMO">DEMO (Gratis Terbatas)</option>
                                <option value="PRO">PRO (Terkunci di Demo)</option>
                                <option value="DISABLED">DISABLED (Nonaktif Total)</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                  >
                    Simpan Perubahan Feature Flags
                  </button>
                </div>
              )}

              {/* TAB 6: DEMO SETTINGS & CONTACT */}
              {activeTab === 'settings' && settings && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl text-xs">
                  <div>
                    <h3 className="text-base font-bold text-white">Pengaturan Batas Kuota Demo &amp; Kontak Owner</h3>
                    <p className="text-xs text-slate-400">
                      Konfigurasikan kuota default untuk pengguna DEMO gratis dan saluran kontak resmi.
                    </p>
                  </div>

                  {saveSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {saveSuccessMsg}
                    </div>
                  )}

                  {/* Demo Limits Section */}
                  <div className="p-5 bg-slate-800/40 border border-slate-700/80 rounded-xl space-y-4">
                    <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                      Batas Penggunaan Mode DEMO (Harian &amp; Sesi)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Maksimal Soal per Sesi Generate:
                        </label>
                        <input
                          type="number"
                          value={settings.demoSettings.maxGeneratePerSession}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              demoSettings: {
                                ...settings.demoSettings,
                                maxGeneratePerSession: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Maksimal Soal per Hari:
                        </label>
                        <input
                          type="number"
                          value={settings.demoSettings.maxGeneratePerDay}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              demoSettings: {
                                ...settings.demoSettings,
                                maxGeneratePerDay: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Maksimal Kisi-Kisi per Hari:
                        </label>
                        <input
                          type="number"
                          value={settings.demoSettings.maxKisiKisiPerDay}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              demoSettings: {
                                ...settings.demoSettings,
                                maxKisiKisiPerDay: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Maksimal Indikator per Kisi-Kisi:
                        </label>
                        <input
                          type="number"
                          value={settings.demoSettings.maxIndicatorsPerKisi}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              demoSettings: {
                                ...settings.demoSettings,
                                maxIndicatorsPerKisi: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Maksimal Paket Asesmen Tersimpan (Demo):
                        </label>
                        <input
                          type="number"
                          value={settings.demoSettings.maxStoredPackages}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              demoSettings: {
                                ...settings.demoSettings,
                                maxStoredPackages: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Maksimal Siswa di Analisis (Demo):
                        </label>
                        <input
                          type="number"
                          value={settings.demoSettings.maxStudentsInAnalytics}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              demoSettings: {
                                ...settings.demoSettings,
                                maxStudentsInAnalytics: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Teks Watermark Mode DEMO:
                      </label>
                      <input
                        type="text"
                        value={settings.demoSettings.watermarkText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            demoSettings: {
                              ...settings.demoSettings,
                              watermarkText: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  {/* Contact Info Section */}
                  <div className="p-5 bg-slate-800/40 border border-slate-700/80 rounded-xl space-y-4">
                    <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                      Saluran Kontak &amp; Pembelian Owner
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Nomor WhatsApp Owner:</label>
                        <input
                          type="text"
                          value={settings.contactInfo.whatsapp}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              contactInfo: {
                                ...settings.contactInfo,
                                whatsapp: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          placeholder="628123456789"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Email Resmi Owner:</label>
                        <input
                          type="email"
                          value={settings.contactInfo.email}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              contactInfo: {
                                ...settings.contactInfo,
                                email: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Pesan / Petunjuk Pembelian:</label>
                      <textarea
                        rows={2}
                        value={settings.contactInfo.customNote}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contactInfo: {
                              ...settings.contactInfo,
                              customNote: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    Simpan Semua Pengaturan
                  </button>
                </form>
              )}

              {/* TAB 7: LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Audit &amp; Aktivasi Logs</h3>
                    <p className="text-xs text-slate-400">
                      Riwayat rekaman aktivasi kode, percobaan login, dan deteksi proteksi anti-brute force
                    </p>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                    <div className="overflow-x-auto max-h-96 custom-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] sticky top-0">
                          <tr>
                            <th className="p-3">Waktu</th>
                            <th className="p-3">Kode Lisensi</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Device (Masked)</th>
                            <th className="p-3">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {logs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-500">
                                Belum ada log aktivitas tercatat.
                              </td>
                            </tr>
                          ) : (
                            logs.map((lg) => (
                              <tr key={lg.id} className="hover:bg-slate-900/40">
                                <td className="p-3 text-[11px] text-slate-400 whitespace-nowrap">
                                  {new Date(lg.timestamp).toLocaleString('id-ID')}
                                </td>
                                <td className="p-3 font-mono font-bold text-amber-300">
                                  {lg.license_code}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      lg.status === 'SUCCESS'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                                    }`}
                                  >
                                    {lg.status}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-slate-400">
                                  {lg.device_id_masked}
                                </td>
                                <td className="p-3 text-slate-300">{lg.details}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{confirmModal.title}</h4>
                  <p className="text-[11px] text-slate-400">Konfirmasi tindakan keamanan</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-900/30"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
