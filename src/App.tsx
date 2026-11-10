import React, { useState, useEffect } from 'react';
import {
  AppDatabase,
  loadDatabase,
  saveDatabase,
} from './services/storageService';
import {
  CapaianPembelajaran,
  TujuanPembelajaran,
  QuestionItem,
  PaketAsesmen,
  QuranAssessmentRecord,
  AnalisisHasil,
  RubrikItem,
  ProfilSekolah,
  KisiKisiItem,
} from './types/curriculum';
import { ClientLicenseState } from './types/license';
import {
  getCurrentLicenseState,
  subscribeLicenseState,
  fetchLicenseStatus,
} from './services/licenseService';

import { Sidebar, Navbar, MobileBottomNav, ActiveModule } from './components/Navigation';
import { SchoolProfileModal } from './components/SchoolProfileModal';

// License & Owner Components
import { DemoBanner } from './components/license/DemoBanner';
import { ActivationModal } from './components/license/ActivationModal';
import { LicenseInfoModal } from './components/license/LicenseInfoModal';
import { ProFeatureModal } from './components/license/ProFeatureModal';
import { OwnerPanelModal } from './components/license/OwnerPanelModal';

// Modules
import { DashboardModule } from './components/modules/DashboardModule';
import { CurriculumModule } from './components/modules/CurriculumModule';
import { KisiKisiModule } from './components/modules/KisiKisiModule';
import { QuestionGeneratorModule } from './components/modules/QuestionGeneratorModule';
import { BloomSoloModule } from './components/modules/BloomSoloModule';
import { NonTestAssessmentModule } from './components/modules/NonTestAssessmentModule';
import { QuranAssessmentModule } from './components/modules/QuranAssessmentModule';
import { RubricGeneratorModule } from './components/modules/RubricGeneratorModule';
import { ValidatorModule } from './components/modules/ValidatorModule';
import { QuestionBankModule } from './components/modules/QuestionBankModule';
import { AssessmentPackageModule } from './components/modules/AssessmentPackageModule';
import { AnalyticsModule } from './components/modules/AnalyticsModule';
import { RemedialPengayaanModule } from './components/modules/RemedialPengayaanModule';
import { ExportCenterModule } from './components/modules/ExportCenterModule';
import { GradingModule } from './components/modules/GradingModule';
import { DataSiswaModule } from './components/modules/DataSiswaModule';

export function App() {
  const [db, setDb] = useState<AppDatabase | null>(null);
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // License & Security States
  const [licenseState, setLicenseState] = useState<ClientLicenseState>(getCurrentLicenseState());
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [isLicenseInfoOpen, setIsLicenseInfoOpen] = useState(false);
  const [isOwnerPanelOpen, setIsOwnerPanelOpen] = useState(false);
  const [proModal, setProModal] = useState<{
    isOpen: boolean;
    title?: string;
    desc?: string;
  }>({
    isOpen: false,
  });

  // Cross-module states
  const [incomingKisiKisi, setIncomingKisiKisi] = useState<KisiKisiItem[]>([]);
  const [testPresetTarget, setTestPresetTarget] = useState<number | undefined>(undefined);

  // Load persistent database on mount
  useEffect(() => {
    loadDatabase().then((loaded) => {
      setDb(loaded);
    });
  }, []);

  // Subscribe to license state and fetch status from server
  useEffect(() => {
    const unsub = subscribeLicenseState((state) => {
      setLicenseState(state);
    });
    fetchLicenseStatus();
    return () => unsub();
  }, []);

  // Sync to database
  const updateDatabase = (updater: (prev: AppDatabase) => AppDatabase) => {
    setDb((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveDatabase(next);
      return next;
    });
  };

  if (!db) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold">Memuat PAIBP Smart Assessment Pro...</h2>
        <p className="text-xs text-slate-400 mt-1">Menyiapkan Kurikulum Merdeka Fase E &amp; F 2026</p>
      </div>
    );
  }

  const isPro = licenseState.isPro && licenseState.status === 'PRO_ACTIVE';

  const handleOpenProModal = (title?: string, desc?: string) => {
    setProModal({
      isOpen: true,
      title,
      desc,
    });
  };

  // Cross-module callbacks
  const handleSelectTPForGenerator = (tp: TujuanPembelajaran) => {
    setActiveModule('generator');
  };

  const handleGenerateQuestionsFromMatrix = (kisiList: KisiKisiItem[]) => {
    setIncomingKisiKisi(kisiList);
    setActiveModule('generator');
  };

  const handleSaveQuestionsToBank = (newQuestions: QuestionItem[]) => {
    updateDatabase((prev) => ({
      ...prev,
      questionBank: [...newQuestions, ...prev.questionBank],
    }));
  };

  const handleAddQuestionsToPackage = (selected: QuestionItem[]) => {
    const newPkg: PaketAsesmen = {
      id: `PKG-${Date.now()}`,
      namaPaket: `Paket Asesmen Pilihan Guru (${selected.length} Soal)`,
      satuanPendidikan: db.profilSekolah.namaSekolah,
      mataPelajaran: 'Pendidikan Agama Islam dan Budi Pekerti',
      fase: selected[0]?.fase || 'E',
      kelas: selected[0]?.kelas || 'X',
      semester: selected[0]?.semester || '1',
      tahunPelajaran: db.profilSekolah.tahunPelajaran,
      jenisAsesmen: 'Sumatif Akhir Semester',
      materiCakupan: Array.from(new Set(selected.map((q) => q.materi))),
      durasiMenit: 90,
      totalSoal: selected.length,
      petunjukUmum:
        '1. Bacalah basmalah sebelum mulai.\n2. Jawablah soal dengan cermat.\n3. Periksa kembali jawaban sebelum dikumpulkan.',
      kisiKisiList: [],
      soalIds: selected.map((q) => q.id),
      soalList: selected,
      kunciDanPembahasanTerpisah: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateDatabase((prev) => ({
      ...prev,
      assessmentPackages: [newPkg, ...prev.assessmentPackages],
    }));
    setActiveModule('package');
  };

  const handleOpenTestPreset = (testNum: number) => {
    setTestPresetTarget(testNum);
    setActiveModule('generator');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        profil={db.profilSekolah}
        onOpenSettings={() => setIsSettingsOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        licenseState={licenseState}
        onOpenActivation={() => setIsActivationOpen(true)}
        onOpenLicenseInfo={() => setIsLicenseInfoOpen(true)}
        onOpenOwnerPanel={() => setIsOwnerPanelOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar
          profil={db.profilSekolah}
          onOpenSettings={() => setIsSettingsOpen(true)}
          setMobileMenuOpen={setMobileMenuOpen}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          licenseState={licenseState}
          onOpenActivation={() => setIsActivationOpen(true)}
          onOpenLicenseInfo={() => setIsLicenseInfoOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {/* Non-intrusive Demo Banner & Quota Indicator */}
          <DemoBanner
            state={licenseState}
            onOpenActivation={() => setIsActivationOpen(true)}
          />

          {activeModule === 'dashboard' && (
            <DashboardModule
              db={db}
              setActiveModule={setActiveModule}
              onOpenTestPreset={handleOpenTestPreset}
            />
          )}

          {activeModule === 'datasiswa' && (
            <DataSiswaModule
              siswaList={db.siswaList}
              onUpdateSiswaList={(siswaList) => updateDatabase((prev) => ({ ...prev, siswaList }))}
              profilSekolah={db.profilSekolah}
              onNavigateToGrading={() => setActiveModule('grading')}
              formatifList={db.formatifList}
              sumatifList={db.sumatifList}
              catatanSikapList={db.catatanSikapList}
            />
          )}

          {activeModule === 'grading' && (
            <GradingModule
              siswaList={db.siswaList}
              formatifList={db.formatifList}
              sumatifList={db.sumatifList}
              catatanSikapList={db.catatanSikapList}
              konfigurasiPenilaian={db.konfigurasiPenilaian}
              profilSekolah={db.profilSekolah}
              onUpdateSiswaList={(siswaList) => updateDatabase((prev) => ({ ...prev, siswaList }))}
              onUpdateFormatifList={(formatifList) => updateDatabase((prev) => ({ ...prev, formatifList }))}
              onUpdateSumatifList={(sumatifList) => updateDatabase((prev) => ({ ...prev, sumatifList }))}
              onUpdateCatatanSikapList={(catatanSikapList) =>
                updateDatabase((prev) => ({ ...prev, catatanSikapList }))
              }
              onUpdateKonfigurasi={(konfigurasiPenilaian) =>
                updateDatabase((prev) => ({ ...prev, konfigurasiPenilaian }))
              }
              onNavigateToDataSiswa={() => setActiveModule('datasiswa')}
            />
          )}

          {activeModule === 'curriculum' && (
            <CurriculumModule
              cpList={db.cpList}
              tpList={db.tpList}
              onUpdateTPList={(tpList) => updateDatabase((prev) => ({ ...prev, tpList }))}
              onUpdateCPList={(cpList) => updateDatabase((prev) => ({ ...prev, cpList }))}
              onSelectTPForGenerator={handleSelectTPForGenerator}
            />
          )}

          {activeModule === 'kisikisi' && (
            <KisiKisiModule
              cpList={db.cpList}
              tpList={db.tpList}
              profil={db.profilSekolah}
              onGenerateQuestionsFromMatrix={handleGenerateQuestionsFromMatrix}
            />
          )}

          {activeModule === 'generator' && (
            <QuestionGeneratorModule
              cpList={db.cpList}
              tpList={db.tpList}
              onSaveQuestionsToBank={handleSaveQuestionsToBank}
              incomingKisiKisi={incomingKisiKisi}
              initialTestPreset={testPresetTarget}
              isPro={isPro}
              onOpenActivation={() => setIsActivationOpen(true)}
              onOpenProModal={handleOpenProModal}
              bankCount={db.questionBank.length}
            />
          )}

          {(activeModule === 'bloomsolo' || activeModule === 'deeplearning') && (
            <BloomSoloModule db={db} />
          )}

          {activeModule === 'nontest' && (
            <NonTestAssessmentModule profil={db.profilSekolah} />
          )}

          {activeModule === 'quran' && (
            <QuranAssessmentModule
              quranRecords={db.quranRecords}
              onUpdateQuranRecords={(quranRecords) =>
                updateDatabase((prev) => ({ ...prev, quranRecords }))
              }
              profil={db.profilSekolah}
            />
          )}

          {activeModule === 'rubrik' && (
            <RubricGeneratorModule
              rubricList={db.rubricList}
              onUpdateRubricList={(rubricList) =>
                updateDatabase((prev) => ({ ...prev, rubricList }))
              }
              profil={db.profilSekolah}
            />
          )}

          {activeModule === 'validator' && (
            <ValidatorModule
              questionBank={db.questionBank}
              onUpdateQuestion={(id, fields) =>
                updateDatabase((prev) => ({
                  ...prev,
                  questionBank: prev.questionBank.map((q) =>
                    q.id === id ? { ...q, ...fields } : q
                  ),
                }))
              }
            />
          )}

          {activeModule === 'bank' && (
            <QuestionBankModule
              questionBank={db.questionBank}
              onUpdateQuestionBank={(questionBank) =>
                updateDatabase((prev) => ({ ...prev, questionBank }))
              }
              profil={db.profilSekolah}
              onAddQuestionsToPackage={handleAddQuestionsToPackage}
              isPro={isPro}
              onOpenProModal={handleOpenProModal}
            />
          )}

          {activeModule === 'package' && (
            <AssessmentPackageModule
              packages={db.assessmentPackages}
              questionBank={db.questionBank}
              onUpdatePackages={(assessmentPackages) =>
                updateDatabase((prev) => ({ ...prev, assessmentPackages }))
              }
              profil={db.profilSekolah}
            />
          )}

          {activeModule === 'analytics' && (
            <AnalyticsModule
              analyticsList={db.analyticsList}
              onUpdateAnalytics={(analyticsList) =>
                updateDatabase((prev) => ({ ...prev, analyticsList }))
              }
              profil={db.profilSekolah}
              onOpenRemedialWithAnalytics={() => setActiveModule('remedial')}
            />
          )}

          {activeModule === 'remedial' && (
            <RemedialPengayaanModule
              analyticsList={db.analyticsList}
              profil={db.profilSekolah}
              isPro={isPro}
              onOpenProModal={handleOpenProModal}
            />
          )}

          {activeModule === 'export' && (
            <ExportCenterModule
              db={db}
              isPro={isPro}
              onOpenProModal={handleOpenProModal}
              watermarkText={licenseState.demoSettings.watermarkText}
            />
          )}
        </main>
      </div>

      {/* School Profile Settings Modal */}
      <SchoolProfileModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profil={db.profilSekolah}
        onSave={(updated) => updateDatabase((prev) => ({ ...prev, profilSekolah: updated }))}
      />

      {/* Activation Modal */}
      <ActivationModal
        isOpen={isActivationOpen}
        onClose={() => setIsActivationOpen(false)}
        onSuccess={(newState) => {
          setLicenseState(newState);
        }}
      />

      {/* License Info Modal */}
      <LicenseInfoModal
        isOpen={isLicenseInfoOpen}
        onClose={() => setIsLicenseInfoOpen(false)}
        state={licenseState}
        onOpenActivation={() => {
          setIsLicenseInfoOpen(false);
          setIsActivationOpen(true);
        }}
      />

      {/* Pro Feature Prompt Modal */}
      <ProFeatureModal
        isOpen={proModal.isOpen}
        onClose={() => setProModal({ isOpen: false })}
        onOpenActivation={() => {
          setProModal({ isOpen: false });
          setIsActivationOpen(true);
        }}
        featureTitle={proModal.title}
        featureDescription={proModal.desc}
      />

      {/* Owner Control Panel Modal */}
      <OwnerPanelModal
        isOpen={isOwnerPanelOpen}
        onClose={() => setIsOwnerPanelOpen(false)}
        onRefreshLicenseState={() => fetchLicenseStatus()}
      />

      {/* Mobile-First Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        licenseState={licenseState}
      />
    </div>
  );
}

export default App;
