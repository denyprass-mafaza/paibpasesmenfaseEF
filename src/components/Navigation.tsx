import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileSpreadsheet,
  Sparkles,
  Layers,
  HeartHandshake,
  CheckCircle2,
  BookMarked,
  Sliders,
  ShieldCheck,
  Database,
  PackageOpen,
  BarChart3,
  RefreshCw,
  Download,
  School,
  Settings,
  Menu,
  X,
  GraduationCap,
  Users,
  KeyRound,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { ProfilSekolah } from '../types/curriculum';
import { ClientLicenseState } from '../types/license';

export type ActiveModule =
  | 'dashboard'
  | 'datasiswa'
  | 'grading'
  | 'curriculum'
  | 'kisikisi'
  | 'generator'
  | 'bloomsolo'
  | 'deeplearning'
  | 'nontest'
  | 'quran'
  | 'rubrik'
  | 'validator'
  | 'bank'
  | 'package'
  | 'analytics'
  | 'remedial'
  | 'export';

interface Props {
  activeModule: ActiveModule;
  setActiveModule: (m: ActiveModule) => void;
  profil: ProfilSekolah;
  onOpenSettings: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (o: boolean) => void;
  licenseState: ClientLicenseState;
  onOpenActivation: () => void;
  onOpenLicenseInfo: () => void;
  onOpenOwnerPanel: () => void;
}

export const NAV_ITEMS: { id: ActiveModule; label: string; icon: React.FC<any>; badge?: string; proOnly?: boolean }[] = [
  { id: 'dashboard', label: '1. Dashboard Utama', icon: LayoutDashboard },
  { id: 'datasiswa', label: '★ Data Siswa & Roster', icon: Users, badge: 'Import Excel' },
  { id: 'grading', label: '★ Sistem Penilaian Al-Islam', icon: GraduationCap, badge: 'Formatif, Sumatif, Sikap' },
  { id: 'curriculum', label: '2. Manajemen Kurikulum (CP/TP)', icon: BookOpen },
  { id: 'kisikisi', label: '3. Generator Kisi-Kisi', icon: FileSpreadsheet },
  { id: 'generator', label: '4. AI Question Generator', icon: Sparkles, badge: 'AI Pro' },
  { id: 'bloomsolo', label: '5. Taksonomi Bloom & SOLO', icon: Layers },
  { id: 'deeplearning', label: '6. Deep Learning Assessment', icon: HeartHandshake },
  { id: 'nontest', label: '7. Asesmen Non-Tes & Praktik', icon: CheckCircle2 },
  { id: 'quran', label: '8. Asesmen Tilawah & Tahfiz', icon: BookMarked, badge: 'Target 2 Juz' },
  { id: 'rubrik', label: '9. Generator Rubrik Penilaian', icon: Sliders },
  { id: 'validator', label: '10. AI Validator / Quality Control', icon: ShieldCheck, badge: '18 Cek' },
  { id: 'bank', label: '11. Bank Soal Digital', icon: Database },
  { id: 'package', label: '12. Paket Asesmen Siap Cetak', icon: PackageOpen },
  { id: 'analytics', label: '13. Analisis Hasil Asesmen', icon: BarChart3 },
  { id: 'remedial', label: '14. Remedial & Pengayaan', icon: RefreshCw, proOnly: true },
  { id: 'export', label: '15. Export Center (Word, PDF, Excel)', icon: Download, proOnly: true },
];

export const Sidebar: React.FC<Props> = ({
  activeModule,
  setActiveModule,
  profil,
  onOpenSettings,
  mobileMenuOpen,
  setMobileMenuOpen,
  licenseState,
  onOpenActivation,
  onOpenLicenseInfo,
  onOpenOwnerPanel,
}) => {
  const isPro = licenseState.isPro && licenseState.status === 'PRO_ACTIVE';
  const isExpired = licenseState.status === 'EXPIRED';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 font-bold text-lg">
              ☪
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-white tracking-wide leading-tight">
                  PAIBP SMART
                </h1>
                {isPro ? (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-400 text-slate-950 uppercase tracking-wider">
                    PRO
                  </span>
                ) : isExpired ? (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-400 text-slate-950 uppercase tracking-wider">
                    EXPIRED
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                {isPro ? 'Pro Edition 2026' : 'Fase E & F • Mode Demo'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pro Activation Button in Sidebar for DEMO */}
        {!isPro && (
          <div className="px-3 pt-3">
            <button
              onClick={onOpenActivation}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-900/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>🔓 AKTIVASI PRO</span>
            </button>
          </div>
        )}

        {/* School Mini Card */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 my-2">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-[11px] font-semibold text-slate-200 truncate">{profil.namaSekolah}</p>
              <p className="text-[10px] text-emerald-400 truncate">Fase E &amp; F (Kelas X, XI, XII)</p>
            </div>
            <button
              onClick={onOpenSettings}
              title="Pengaturan Kop & Identitas Sekolah"
              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            const isItemLocked = !isPro && item.proOnly;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveModule(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {isItemLocked ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5 shrink-0">
                    <Lock className="w-2.5 h-2.5" /> PRO
                  </span>
                ) : item.badge ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}

          {/* License Info Menu Item */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => {
                onOpenLicenseInfo();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white transition group"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Status &amp; Lisensi Saya</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                  isPro
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {isPro ? 'PRO' : 'DEMO'}
              </span>
            </button>
          </div>
        </nav>

        {/* Footer info & Discreet Owner Panel entry */}
        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-1.5">
            <span>PAIBP Merdeka</span>
            <span className="text-emerald-500 font-mono">v2.6.0</span>
          </div>
          {/* Discrete Owner Entry Point */}
          <button
            onClick={onOpenOwnerPanel}
            title="Akses Khusus Panel Owner (Dilindungi Password)"
            className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition p-1 rounded hover:bg-slate-800"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold">Panel Owner</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export const Navbar: React.FC<{
  profil: ProfilSekolah;
  onOpenSettings: () => void;
  setMobileMenuOpen: (o: boolean) => void;
  activeModule: ActiveModule;
  setActiveModule: (m: ActiveModule) => void;
  licenseState: ClientLicenseState;
  onOpenActivation: () => void;
  onOpenLicenseInfo: () => void;
}> = ({
  profil,
  onOpenSettings,
  setMobileMenuOpen,
  activeModule,
  setActiveModule,
  licenseState,
  onOpenActivation,
  onOpenLicenseInfo,
}) => {
  const currentTitle = NAV_ITEMS.find((n) => n.id === activeModule)?.label || 'PAIBP Assessment Pro';
  const isPro = licenseState.isPro && licenseState.status === 'PRO_ACTIVE';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-xs">
      {/* Left: Mobile hamburger & module title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 active:scale-95 transition"
          aria-label="Buka Menu Modul"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h2 className="text-xs sm:text-sm lg:text-base font-bold text-slate-800 truncate">
              {currentTitle}
            </h2>
            {isPro ? (
              <span className="shrink-0 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                PRO
              </span>
            ) : (
              <span className="shrink-0 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                DEMO
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block truncate">
            Pendidikan Agama Islam dan Budi Pekerti SMA/MA/SMK • TP {profil.tahunPelajaran}
          </p>
        </div>
      </div>

      {/* Right: Quick actions & status */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Quick Test Shortcuts (Desktop Only) */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Uji Cepat:</span>
          <button
            onClick={() => setActiveModule('generator')}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white text-emerald-700 shadow-xs hover:bg-emerald-50 transition border border-slate-200/80 cursor-pointer"
          >
            Test 1: Khamsah
          </button>
          <button
            onClick={() => setActiveModule('generator')}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white text-blue-700 shadow-xs hover:bg-blue-50 transition border border-slate-200/80 cursor-pointer"
          >
            Test 2: Kritis
          </button>
          <button
            onClick={() => setActiveModule('generator')}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white text-indigo-700 shadow-xs hover:bg-indigo-50 transition border border-slate-200/80 cursor-pointer"
          >
            Test 3: Mawaris
          </button>
        </div>

        {/* License Action Button */}
        {!isPro ? (
          <button
            onClick={onOpenActivation}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-xs transition active:scale-95 cursor-pointer min-h-[40px]"
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">AKTIVASI</span>
            <span className="xs:hidden">PRO</span>
          </button>
        ) : (
          <button
            onClick={onOpenLicenseInfo}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition active:scale-95 min-h-[40px] cursor-pointer"
            title="Informasi Lisensi Pro"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">PRO AKTIF</span>
            <span className="sm:hidden">PRO</span>
          </button>
        )}

        {/* School settings trigger */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200 active:scale-95 min-h-[40px] cursor-pointer"
          title="Pengaturan Profil Sekolah"
        >
          <School className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="hidden md:inline truncate max-w-[120px]">
            {profil.namaSekolah.split(' ')[0]} {profil.namaSekolah.split(' ')[1] || ''}
          </span>
          <Settings className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
        </button>
      </div>
    </header>
  );
};

/**
 * Pattern 1: Fixed Bottom Tab Bar for Mobile & Touch-First Viewports
 * Provides thumb-reachable instant access to primary modules and drawer toggle.
 */
export const MobileBottomNav: React.FC<{
  activeModule: ActiveModule;
  setActiveModule: (m: ActiveModule) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (o: boolean) => void;
  licenseState: ClientLicenseState;
}> = ({
  activeModule,
  setActiveModule,
  mobileMenuOpen,
  setMobileMenuOpen,
  licenseState,
}) => {
  const bottomTabs: {
    id: ActiveModule | 'menu';
    label: string;
    icon: React.FC<any>;
  }[] = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'generator', label: 'AI Soal', icon: Sparkles },
    { id: 'bank', label: 'Bank Soal', icon: Database },
    { id: 'grading', label: 'Nilai', icon: GraduationCap },
    { id: 'menu', label: 'Semua', icon: Menu },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 grid grid-cols-5 items-center"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 6px))' }}
    >
      {bottomTabs.map((tab) => {
        const Icon = tab.icon;
        const isMenuTab = tab.id === 'menu';
        const isCurrentActive = isMenuTab ? mobileMenuOpen : activeModule === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (isMenuTab) {
                setMobileMenuOpen(!mobileMenuOpen);
              } else {
                setActiveModule(tab.id as ActiveModule);
                setMobileMenuOpen(false);
              }
            }}
            className={`min-h-[48px] py-1 px-1 flex flex-col items-center justify-center rounded-xl transition relative group cursor-pointer active:scale-95 ${
              isCurrentActive
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            {isCurrentActive && (
              <span className="absolute top-0.5 w-6 h-0.5 bg-emerald-600 rounded-full" />
            )}
            <div
              className={`p-1 rounded-lg transition ${
                isCurrentActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[10px] tracking-tight truncate max-w-full leading-tight mt-0.5">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
