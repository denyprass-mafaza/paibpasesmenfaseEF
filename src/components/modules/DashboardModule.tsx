import React, { useState } from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  Database,
  BarChart3,
  Layers,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  BookMarked,
  Download,
  GraduationCap,
  Users,
} from 'lucide-react';
import { AppDatabase } from '../../services/storageService';
import { ActiveModule } from '../Navigation';

interface Props {
  db: AppDatabase;
  setActiveModule: (m: ActiveModule) => void;
  onOpenTestPreset?: (testNum: number) => void;
}

export const DashboardModule: React.FC<Props> = ({ db, setActiveModule, onOpenTestPreset }) => {
  const [filterFase, setFilterFase] = useState<'ALL' | 'E' | 'F'>('ALL');

  const filteredQuestions =
    filterFase === 'ALL' ? db.questionBank : db.questionBank.filter((q) => q.fase === filterFase);

  // Compute stats
  const totalCP = db.cpList.length;
  const totalTP = db.tpList.length;
  const totalQuestions = db.questionBank.length;
  const totalPackages = db.assessmentPackages.length;
  const totalAnalyzed = db.analyticsList.length;
  const totalQuranRecords = db.quranRecords.length;
  const totalSiswa = db.siswaList.length;

  // Cognitive distribution
  const hotsCount = filteredQuestions.filter((q) => q.kategoriKognitif === 'HOTS').length;
  const motsCount = filteredQuestions.filter((q) => q.kategoriKognitif === 'MOTS').length;
  const lotsCount = filteredQuestions.filter((q) => q.kategoriKognitif === 'LOTS').length;
  const totalCount = filteredQuestions.length || 1;

  const hotsPct = Math.round((hotsCount / totalCount) * 100);
  const motsPct = Math.round((motsCount / totalCount) * 100);
  const lotsPct = 100 - hotsPct - motsPct;

  // Bloom distribution C1 - C6
  const bloomCounts = {
    C1: filteredQuestions.filter((q) => q.levelBloom === 'C1').length,
    C2: filteredQuestions.filter((q) => q.levelBloom === 'C2').length,
    C3: filteredQuestions.filter((q) => q.levelBloom === 'C3').length,
    C4: filteredQuestions.filter((q) => q.levelBloom === 'C4').length,
    C5: filteredQuestions.filter((q) => q.levelBloom === 'C5').length,
    C6: filteredQuestions.filter((q) => q.levelBloom === 'C6').length,
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Kurikulum Merdeka 2026 Terpadu • Fase E &amp; F
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug">
            PAIBP Smart Assessment Pro
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-300 leading-relaxed">
            Platform komprehensif bagi Guru Pendidikan Agama Islam &amp; Budi Pekerti SMA/MA/SMK.
            Rancang kisi-kisi terhubung, hasilkan soal berbasis AI, validasi mutu dalil, dan susun analisis pembelajaran secara otomatis.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveModule('datasiswa')}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-teal-950/40 transition transform active:scale-95"
            >
              <Users className="w-4 h-4 text-slate-950" />
              ★ Data Siswa ({totalSiswa}) &amp; Import Excel
            </button>
            <button
              onClick={() => setActiveModule('grading')}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-950/40 transition transform active:scale-95"
            >
              <GraduationCap className="w-4 h-4 text-slate-950" />
              ★ Sistem Penilaian Al-Islam Pro
            </button>
            <button
              onClick={() => setActiveModule('generator')}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Buka AI Question Generator
            </button>
            <button
              onClick={() => setActiveModule('kisikisi')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Generator Kisi-Kisi
            </button>
            <button
              onClick={() => setActiveModule('bank')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-xs transition"
            >
              <Database className="w-4 h-4" />
              Bank Soal ({totalQuestions})
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Top Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Statistik Portofolio Asesmen</h2>
          <p className="text-xs text-slate-500">Ringkasan kurikulum dan bank instrumen tersimpan</p>
        </div>

        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterFase('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterFase === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Fase
          </button>
          <button
            onClick={() => setFilterFase('E')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterFase === 'E'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fase E (Kelas X)
          </button>
          <button
            onClick={() => setFilterFase('F')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterFase === 'F'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fase F (Kelas XI &amp; XII)
          </button>
        </div>
      </div>

      {/* Featured: Sistem Penilaian Al-Islam Pro */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 text-white border border-emerald-500/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-400/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Fitur Baru Terintegrasi
              </span>
              <span className="text-[11px] text-slate-300 font-medium">Fase D, E &amp; F</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">Sistem Penilaian Al-Islam Smart Assessment Pro</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Kelola Penilaian Formatif (Awal-Tengah-Akhir), Penilaian Sumatif 5 Elemen (Multi-level Sticky Header), Jurnal Sikap, serta Rekapitulasi Rapor &amp; Ekspor Excel.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => setActiveModule('datasiswa')}
            className="w-full sm:w-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-xs border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-emerald-300" />
            Data Siswa &amp; Import
          </button>
          <button
            onClick={() => setActiveModule('grading')}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Buka Penilaian
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div
          onClick={() => setActiveModule('curriculum')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCP}</p>
          <p className="text-xs font-medium text-slate-500">Capaian Pembelajaran (CP)</p>
        </div>

        <div
          onClick={() => setActiveModule('curriculum')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <Layers className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalTP}</p>
          <p className="text-xs font-medium text-slate-500">Tujuan Pembelajaran (TP)</p>
        </div>

        <div
          onClick={() => setActiveModule('bank')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <Database className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{filteredQuestions.length}</p>
          <p className="text-xs font-medium text-slate-500">Butir Soal di Bank</p>
        </div>

        <div
          onClick={() => setActiveModule('package')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalPackages}</p>
          <p className="text-xs font-medium text-slate-500">Paket Asesmen Lengkap</p>
        </div>

        <div
          onClick={() => setActiveModule('quran')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <BookMarked className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalQuranRecords}</p>
          <p className="text-xs font-medium text-slate-500">Catatan Tilawah &amp; Tahfiz</p>
        </div>

        <div
          onClick={() => setActiveModule('analytics')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <BarChart3 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalAnalyzed}</p>
          <p className="text-xs font-medium text-slate-500">Hasil Ujian Dianalisis</p>
        </div>
      </div>

      {/* Cognitive Analysis Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: LOTS / MOTS / HOTS Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Distribusi Kognitif Soal</h3>
            <span className="text-[11px] text-slate-500 font-medium">{filteredQuestions.length} Soal Terpilih</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">HOTS (C4 - C6)</span>
                <span className="text-emerald-800 font-bold">{hotsPct}% ({hotsCount} Soal)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${hotsPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-700">MOTS (C3 Aplikasi)</span>
                <span className="text-blue-800 font-bold">{motsPct}% ({motsCount} Soal)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${motsPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">LOTS (C1 - C2 Konsep)</span>
                <span className="text-amber-800 font-bold">{lotsPct}% ({lotsCount} Soal)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${lotsPct}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed">
              <strong>Rekomendasi MGMP:</strong> Proporsi soal ideal untuk jenjang SMA/MA/SMK Kurikulum Merdeka adalah minimal 40% HOTS, 40% MOTS, dan maksimal 20% LOTS guna membiasakan nalar analitis.
            </div>
          </div>
        </div>

        {/* Center: Bloom Taxonomy Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Sebaran Level Bloom Revisi (C1 s/d C6)</h3>
            <button
              onClick={() => setActiveModule('bloomsolo')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              Pedoman Detail <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2 text-center pt-2">
            {[
              { level: 'C1', label: 'Mengingat', count: bloomCounts.C1, color: 'bg-amber-100 text-amber-800' },
              { level: 'C2', label: 'Memahami', count: bloomCounts.C2, color: 'bg-amber-200 text-amber-900' },
              { level: 'C3', label: 'Menerapkan', count: bloomCounts.C3, color: 'bg-blue-100 text-blue-800' },
              { level: 'C4', label: 'Menganalisis', count: bloomCounts.C4, color: 'bg-emerald-100 text-emerald-800' },
              { level: 'C5', label: 'Mengevaluasi', count: bloomCounts.C5, color: 'bg-emerald-200 text-emerald-900' },
              { level: 'C6', label: 'Mencipta', count: bloomCounts.C6, color: 'bg-indigo-100 text-indigo-900' },
            ].map((b) => (
              <div key={b.level} className="flex flex-col items-center">
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-2 hover:border-slate-300 transition">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${b.color}`}>
                    {b.level}
                  </span>
                  <p className="text-lg font-extrabold text-slate-800 mt-1">{b.count}</p>
                </div>
                <span className="text-[10px] font-medium text-slate-500 leading-tight">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Quick verification callout */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Seluruh butir soal telah melewati pemeriksaan 18 parameter validasi AI</span>
            </div>
            <button
              onClick={() => setActiveModule('validator')}
              className="text-xs font-semibold text-slate-700 hover:text-emerald-600 transition"
            >
              Lihat Laporan QC →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Test Scenarios Cards (Explicit Master Prompt Tests) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          Pengujian Cepat Sesuai Ketentuan Master Prompt
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Klik pintasan berikut untuk langsung memuat skenario uji verifikasi kurikulum dan generator:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div
            onClick={() => {
              if (onOpenTestPreset) onOpenTestPreset(1);
              else setActiveModule('generator');
            }}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:shadow-xs transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                UJI TEST 1
              </span>
              <span className="text-xs font-bold text-emerald-800">Fase E • Fikih</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              TP E.F.2: Al-Kulliyat Al-Khamsah (10 Soal HOTS)
            </h4>
            <p className="text-[11px] text-slate-600">
              10 butir soal pilihan ganda HOTS murni mengupas hifz an-nafs, hifz al-'aql, hifz al-mal, hifz an-nasl, hifz ad-din.
            </p>
          </div>

          <div
            onClick={() => {
              if (onOpenTestPreset) onOpenTestPreset(2);
              else setActiveModule('generator');
            }}
            className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 hover:shadow-xs transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                UJI TEST 2
              </span>
              <span className="text-xs font-bold text-blue-800">Fase F • Al-Qur'an Hadis</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              TP F.AQH.1: Berpikir Kritis &amp; Tabayyun
            </h4>
            <p className="text-[11px] text-slate-600">
              Soal mengukur kemampuan analisis kritis (Q.S. Ali 'Imran 190-191) dan tabayyun informasi media sosial.
            </p>
          </div>

          <div
            onClick={() => {
              if (onOpenTestPreset) onOpenTestPreset(3);
              else setActiveModule('generator');
            }}
            className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:shadow-xs transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                UJI TEST 3
              </span>
              <span className="text-xs font-bold text-indigo-800">Fase F • Fikih</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              TP F.F.4: Perhitungan Mawaris (Waris Islam)
            </h4>
            <p className="text-[11px] text-slate-600">
              Kasus pembagian warisan riil dengan hitungan akurat dzawil furudh (1/8, 1/6, ashobah) dan hijab hirman.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Question Bank Preview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Riwayat Soal Terbaru</h3>
            <p className="text-xs text-slate-500">Soal-soal yang siap dimasukkan ke naskah asesmen</p>
          </div>
          <button
            onClick={() => setActiveModule('bank')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            Buka Seluruh Bank Soal ({totalQuestions}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredQuestions.slice(0, 4).map((q, idx) => (
            <div key={q.id} className="py-3 flex items-start justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    #{idx + 1}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Fase {q.fase} • Kelas {q.kelas}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {q.elemen} • [{q.tpKode}]
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {q.levelBloom} ({q.kategoriKognitif})
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-800 line-clamp-2">{q.pertanyaan}</p>
                <p className="text-[11px] text-slate-500 truncate">Materi: {q.materi}</p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  {q.validation.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
