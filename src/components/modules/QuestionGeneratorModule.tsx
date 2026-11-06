import React, { useState, useEffect } from 'react';
import {
  CapaianPembelajaran,
  TujuanPembelajaran,
  QuestionItem,
  Fase,
  Kelas,
  Semester,
  ElemenPAI,
  BentukSoal,
  BloomLevel,
  SoloLevel,
  TingkatKesulitan,
  CognitiveDomain,
  KisiKisiItem,
} from '../../types/curriculum';
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  Copy,
  Edit3,
  Trash2,
  Save,
  Plus,
  BookOpen,
  Scale,
  ShieldCheck,
  RotateCw,
  FileText,
  Sliders,
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { callGenerateQuestionsAPI, callValidateQuestionAPI } from '../../services/aiService';
import confetti from 'canvas-confetti';

interface Props {
  cpList: CapaianPembelajaran[];
  tpList: TujuanPembelajaran[];
  onSaveQuestionsToBank: (questions: QuestionItem[]) => void;
  incomingKisiKisi?: KisiKisiItem[];
  initialTestPreset?: number;
  isPro?: boolean;
  onOpenActivation?: () => void;
  onOpenProModal?: (title?: string, desc?: string) => void;
  bankCount?: number;
}

export const QuestionGeneratorModule: React.FC<Props> = ({
  cpList,
  tpList,
  onSaveQuestionsToBank,
  incomingKisiKisi,
  initialTestPreset,
  isPro = false,
  onOpenActivation,
  onOpenProModal,
  bankCount = 0,
}) => {
  // 1. Selector States
  const [fase, setFase] = useState<Fase>('E');
  const [kelas, setKelas] = useState<Kelas>('X');
  const [semester, setSemester] = useState<Semester>('2');
  const [elemen, setElemen] = useState<ElemenPAI>('Fikih');

  // Filter available TPs based on isolated phase & element (NO PHASE MIXING - Section 4 Rule 4, 5, 6)
  const availableTPs = tpList.filter((tp) => tp.fase === fase && tp.elemen === elemen);
  const [selectedTPId, setSelectedTPId] = useState<string>(availableTPs[0]?.id || '');
  const activeTP = availableTPs.find((tp) => tp.id === selectedTPId) || availableTPs[0];
  const activeCP = cpList.find((cp) => cp.fase === fase && cp.elemen === elemen);

  const [materi, setMateri] = useState<string>(activeTP?.materiPokok[0] || 'Al-Kulliyat Al-Khamsah');
  const [indikator, setIndikator] = useState<string>(activeTP?.indikatorDefault[0] || '');
  const [bentukSoal, setBentukSoal] = useState<BentukSoal>('Pilihan Ganda');
  const [jumlahSoal, setJumlahSoal] = useState<number>(isPro ? 10 : 5);
  const [levelBloom, setLevelBloom] = useState<BloomLevel>('C4');
  const [levelSOLO, setLevelSOLO] = useState<SoloLevel>('Relational');
  const [kategoriKognitif, setKategoriKognitif] = useState<CognitiveDomain>('HOTS');
  const [kesulitan, setKesulitan] = useState<TingkatKesulitan>('Sedang');

  // Composition ratios
  const [proporsiLots, setProporsiLots] = useState<number>(20);
  const [proporsiMots, setProporsiMots] = useState<number>(40);
  const [proporsiHots, setProporsiHots] = useState<number>(40);

  // Advanced settings
  const [modeGenerator, setModeGenerator] = useState<string>('Generator HOTS');
  const [gunakanDalil, setGunakanDalil] = useState<boolean>(true);
  const [konteksTambahan, setKonteksTambahan] = useState<string>('');

  // Results & Editor State
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Sync if initial preset passed
  useEffect(() => {
    if (initialTestPreset === 1) applyTestPreset1();
    else if (initialTestPreset === 2) applyTestPreset2();
    else if (initialTestPreset === 3) applyTestPreset3();
  }, [initialTestPreset]);

  // Sync if incoming kisi-kisi passed
  useEffect(() => {
    if (incomingKisiKisi && incomingKisiKisi.length > 0) {
      const first = incomingKisiKisi[0];
      setFase(first.fase);
      setKelas(first.kelas);
      setSemester(first.semester);
      setElemen(first.elemen);
      setMateri(first.materi);
      setIndikator(first.indikatorSoal);
      setBentukSoal(first.bentukSoal);
      setLevelBloom(first.levelBloom);
      setLevelSOLO(first.levelSOLO);
      setKesulitan(first.kesulitan);
      setJumlahSoal(incomingKisiKisi.length);
    }
  }, [incomingKisiKisi]);

  // Handlers for phase/element switches
  const handleFaseChange = (newFase: Fase) => {
    setFase(newFase);
    const newClass = newFase === 'E' ? 'X' : 'XI';
    setKelas(newClass);
    const av = tpList.filter((tp) => tp.fase === newFase && tp.elemen === elemen);
    if (av.length > 0) {
      setSelectedTPId(av[0].id);
      setMateri(av[0].materiPokok[0] || '');
      setIndikator(av[0].indikatorDefault[0] || '');
    }
  };

  const handleElemenChange = (newEl: ElemenPAI) => {
    setElemen(newEl);
    const av = tpList.filter((tp) => tp.fase === fase && tp.elemen === newEl);
    if (av.length > 0) {
      setSelectedTPId(av[0].id);
      setMateri(av[0].materiPokok[0] || '');
      setIndikator(av[0].indikatorDefault[0] || '');
    }
  };

  const handleTPChange = (tpId: string) => {
    setSelectedTPId(tpId);
    const found = tpList.find((t) => t.id === tpId);
    if (found) {
      if (found.materiPokok.length > 0) setMateri(found.materiPokok[0]);
      if (found.indikatorDefault.length > 0) setIndikator(found.indikatorDefault[0]);
    }
  };

  // ==========================================
  // MASTER PROMPT PRESETS (TEST 1, 2, 3, 4)
  // ==========================================
  const applyTestPreset1 = () => {
    // TEST 1: Fase E, Kelas X, Elemen Fikih, TP E.F.2, materi Al-Kulliyat Al-Khamsah, 10 soal PG HOTS
    setFase('E');
    setKelas('X');
    setSemester('2');
    setElemen('Fikih');
    const tpEF2 = tpList.find((t) => t.kode === 'E.F.2');
    if (tpEF2) {
      setSelectedTPId(tpEF2.id);
      setMateri('Al-Kulliyat Al-Khamsah');
      setIndikator('Menganalisis lima prinsip dasar hukum Islam (hifz al-din, hifz an-nafs, hifz al-\'aql, hifz an-nasl, hifz al-mal)');
    }
    setBentukSoal('Pilihan Ganda');
    setJumlahSoal(isPro ? 10 : 5);
    setLevelBloom('C4');
    setLevelSOLO('Relational');
    setKategoriKognitif('HOTS');
    setKesulitan('Sedang');
    setModeGenerator('Generator HOTS');
    setGunakanDalil(true);
    setSuccessToast(
      isPro
        ? 'Preset Uji TEST 1 (Al-Kulliyat Al-Khamsah 10 Soal PG HOTS) berhasil dimuat!'
        : 'Preset Uji TEST 1 (Al-Kulliyat Al-Khamsah 5 Soal PG HOTS Mode DEMO) berhasil dimuat!'
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const applyTestPreset2 = () => {
    // TEST 2: Fase F, Kelas XI, Elemen Al-Qur'an Hadis, TP F.AQH.1, materi berpikir kritis
    setFase('F');
    setKelas('XI');
    setSemester('1');
    setElemen("Al-Qur'an Hadis");
    const tpFAQH1 = tpList.find((t) => t.kode === 'F.AQH.1');
    if (tpFAQH1) {
      setSelectedTPId(tpFAQH1.id);
      setMateri('Berpikir kritis (Q.S. Ali \'Imran/3: 190-191)');
      setIndikator('Menganalisis ayat dan hadis tentang pentingnya berpikir kritis serta menerapkannya dalam menyikapi informasi di era digital');
    }
    setBentukSoal('Pilihan Ganda');
    setJumlahSoal(5);
    setLevelBloom('C4');
    setLevelSOLO('Relational');
    setKategoriKognitif('HOTS');
    setKesulitan('Sedang');
    setModeGenerator('Generator Berbasis Literasi');
    setGunakanDalil(true);
    setSuccessToast('Preset Uji TEST 2 (Berpikir Kritis & Tabayyun Fase F) berhasil dimuat!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const applyTestPreset3 = () => {
    // TEST 3: Fase F, Kelas XII, Elemen Fikih, TP F.F.4, materi Mawaris
    setFase('F');
    setKelas('XII');
    setSemester('1');
    setElemen('Fikih');
    const tpFF4 = tpList.find((t) => t.kode === 'F.F.4');
    if (tpFF4) {
      setSelectedTPId(tpFF4.id);
      setMateri('Mawaris (hukum waris Islam)');
      setIndikator('Menjelaskan ketentuan mawaris dan menerapkannya dalam contoh kasus perhitungan warisan sederhana secara cermat');
    }
    setBentukSoal('Pilihan Ganda');
    setJumlahSoal(5);
    setLevelBloom('C3');
    setLevelSOLO('Relational');
    setKategoriKognitif('MOTS');
    setKesulitan('Sedang');
    setModeGenerator('Generator Profesional');
    setGunakanDalil(true);
    setSuccessToast('Preset Uji TEST 3 (Perhitungan Mawaris Fase F) berhasil dimuat!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const applyTestPreset4 = () => {
    // TEST 4: Soal Uraian dengan Rubrik Otomatis
    setBentukSoal('Uraian/Esai');
    setJumlahSoal(3);
    setLevelBloom('C4');
    setKategoriKognitif('HOTS');
    setModeGenerator('Generator Studi Kasus');
    setSuccessToast('Preset Uji TEST 4 (Soal Uraian dengan Rubrik Penskoran) aktif!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Main Generator Action
  const handleGenerate = async () => {
    // Demo Limits Check (Requirement 3: Max 5 questions per session)
    if (!isPro) {
      if (jumlahSoal > 5) {
        setErrorMessage(
          'Pengguna DEMO dapat menghasilkan maksimal 5 soal per sesi. Silakan ubah jumlah soal menjadi 5 atau aktifkan lisensi PRO untuk menghasilkan hingga 25+ soal sekaligus.'
        );
        return;
      }
      if (modeGenerator === 'Batch Generator') {
        if (onOpenProModal) {
          onOpenProModal('Batch Question Generator', 'Fitur Batch Generator massal hanya tersedia untuk versi PRO.');
        }
        return;
      }
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const questions = await callGenerateQuestionsAPI({
        fase,
        kelas,
        semester,
        elemen,
        cpId: activeCP?.id || '',
        cpDeskripsi: activeCP?.deskripsi || '',
        tpId: activeTP?.id || '',
        tpKode: activeTP?.kode || '',
        tpDeskripsi: activeTP?.deskripsi || '',
        materi,
        indikator: indikator || `Menganalisis ${materi}`,
        jumlahSoal,
        bentukSoal,
        levelBloom,
        levelSOLO,
        kategoriKognitif,
        kesulitan,
        mode: modeGenerator,
        gunakanDalil,
        konteksTambahan,
      });

      setGeneratedQuestions(questions);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      setSuccessToast(`Berhasil menghasilkan ${questions.length} butir soal ${bentukSoal}!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat menghasilkan soal.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save all to bank
  const handleSaveToBank = () => {
    if (generatedQuestions.length === 0) return;
    if (!isPro && bankCount >= 5) {
      if (onOpenProModal) {
        onOpenProModal(
          'Penyimpanan Bank Soal Penuh',
          'Batas penyimpanan Bank Soal mode DEMO adalah maksimal 5 soal. Aktifkan lisensi PRO Anda untuk menyimpan ribuan soal tanpa batas.'
        );
      }
      return;
    }
    onSaveQuestionsToBank(generatedQuestions);
    setSuccessToast(`${generatedQuestions.length} butir soal berhasil disimpan ke Bank Soal!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Edit in-place handler (TEST 6 requirement)
  const handleUpdateQuestion = (id: string, updatedFields: Partial<QuestionItem>) => {
    const updated = generatedQuestions.map((q) =>
      q.id === id ? { ...q, ...updatedFields, updatedAt: new Date().toISOString() } : q
    );
    setGeneratedQuestions(updated);
  };

  const handleDeleteGeneratedQuestion = (id: string) => {
    setGeneratedQuestions(generatedQuestions.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* Preset Action Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Pintasan Uji Validasi Master Prompt
            </h3>
            <p className="text-[11px] text-slate-300">
              Muat konfigurasi otomatis sesuai kriteria pengujian resmi kurikulum 2026:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={applyTestPreset1}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
          >
            TEST 1: Khamsah 10 PG HOTS
          </button>
          <button
            onClick={applyTestPreset2}
            className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 rounded-lg transition"
          >
            TEST 2: Kritis &amp; Tabayyun
          </button>
          <button
            onClick={applyTestPreset3}
            className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
          >
            TEST 3: Hitungan Mawaris
          </button>
          <button
            onClick={applyTestPreset4}
            className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 rounded-lg transition"
          >
            TEST 4: Uraian &amp; Rubrik
          </button>
        </div>
      </div>

      {/* Generator Configuration Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Parameter Generator Asesmen AI Terarah
            </h2>
            <p className="text-xs text-slate-500">
              AI secara mutlak patuh pada materi yang dipilih dan tidak akan mencampurkan materi antarfase
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Mode:</span>
            <select
              value={modeGenerator}
              onChange={(e) => setModeGenerator(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 font-semibold text-slate-800 bg-slate-50"
            >
              <option value="Generator Cepat">Generator Cepat</option>
              <option value="Generator Profesional">Generator Profesional</option>
              <option value="Generator HOTS">Generator HOTS (C4 - C6)</option>
              <option value="Generator Asesmen Formatif">Asesmen Formatif</option>
              <option value="Generator Asesmen Sumatif">Asesmen Sumatif</option>
              <option value="Generator Berbasis Literasi">Berbasis Literasi &amp; Kasus</option>
              <option value="Generator Remedial">Generator Remedial</option>
              <option value="Generator Pengayaan">Generator Pengayaan</option>
            </select>
          </div>
        </div>

        {/* Row 1: Target Curriculum Hierarchy */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Fase Kurikulum</label>
            <select
              value={fase}
              onChange={(e) => handleFaseChange(e.target.value as Fase)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-bold bg-emerald-50 text-emerald-900"
            >
              <option value="E">Fase E (Kelas X)</option>
              <option value="F">Fase F (Kelas XI, XII)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Kelas</label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value as Kelas)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              {fase === 'E' ? (
                <option value="X">Kelas X</option>
              ) : (
                <>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as Semester)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              <option value="1">1 (Ganjil)</option>
              <option value="2">2 (Genap)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Elemen</label>
            <select
              value={elemen}
              onChange={(e) => handleElemenChange(e.target.value as ElemenPAI)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              {[
                "Al-Qur'an Hadis",
                'Akidah',
                'Akhlak',
                'Fikih',
                'Sejarah Peradaban Islam',
              ].map((el) => (
                <option key={el} value={el}>{el}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Bentuk Soal</label>
            <select
              value={bentukSoal}
              onChange={(e) => setBentukSoal(e.target.value as BentukSoal)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
            >
              <option value="Pilihan Ganda">Pilihan Ganda (A-E)</option>
              <option value="Pilihan Ganda Kompleks">Pilihan Ganda Kompleks</option>
              <option value="Benar/Salah">Benar / Salah</option>
              <option value="Menjodohkan">Menjodohkan</option>
              <option value="Isian Singkat">Isian Singkat</option>
              <option value="Uraian/Esai">Uraian / Esai (Rubrik)</option>
              <option value="Studi Kasus">Studi Kasus Kontekstual</option>
              <option value="Berbasis Stimulus">Berbasis Stimulus Ayat/Tabel</option>
            </select>
          </div>
        </div>

        {/* Row 2: Selected CP & TP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Tujuan Pembelajaran (TP)
            </label>
            <select
              value={activeTP?.id || ''}
              onChange={(e) => handleTPChange(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-medium"
            >
              {availableTPs.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  [{tp.kode}] {tp.deskripsi}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Materi Pokok Pembelajaran (Fokus Utama)
            </label>
            <select
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-semibold bg-emerald-50/20 text-emerald-950"
            >
              {activeTP?.materiPokok.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Indikator & Context */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Indikator Soal Ketercapaian
            </label>
            <input
              type="text"
              value={indikator}
              onChange={(e) => setIndikator(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              placeholder="Contoh: Disajikan studi kasus, peserta didik dapat menganalisis..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Jumlah Butir Soal Dihasilkan
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={40}
                value={jumlahSoal}
                onChange={(e) => setJumlahSoal(parseInt(e.target.value, 10) || 5)}
                className="w-24 px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-center font-bold"
              />
              <span className="text-xs text-slate-500">butir soal</span>
            </div>
          </div>
        </div>

        {/* Row 4: Cognitive Taxonomies & Ratio */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Level Bloom</label>
            <select
              value={levelBloom}
              onChange={(e) => setLevelBloom(e.target.value as BloomLevel)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
            >
              <option value="C1">C1 - Mengingat (Konsep Dasar)</option>
              <option value="C2">C2 - Memahami (Penjelasan Konsep)</option>
              <option value="C3">C3 - Mengaplikasikan (Penerapan Fikih)</option>
              <option value="C4">C4 - Menganalisis (Kasus &amp; Masalah)</option>
              <option value="C5">C5 - Mengevaluasi (Kritik &amp; Penilaian)</option>
              <option value="C6">C6 - Mencipta (Rancangan Solusi)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Level SOLO</label>
            <select
              value={levelSOLO}
              onChange={(e) => setLevelSOLO(e.target.value as SoloLevel)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              <option value="Unistructural">Unistructural</option>
              <option value="Multistructural">Multistructural</option>
              <option value="Relational">Relational (HOTS)</option>
              <option value="Extended Abstract">Extended Abstract (HOTS)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori Kognitif</label>
            <select
              value={kategoriKognitif}
              onChange={(e) => setKategoriKognitif(e.target.value as CognitiveDomain)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
            >
              <option value="HOTS">HOTS (Higher Order Thinking)</option>
              <option value="MOTS">MOTS (Middle Order Thinking)</option>
              <option value="LOTS">LOTS (Lower Order Thinking)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Tingkat Kesulitan</label>
            <select
              value={kesulitan}
              onChange={(e) => setKesulitan(e.target.value as TingkatKesulitan)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              <option value="Mudah">Mudah</option>
              <option value="Sedang">Sedang</option>
              <option value="Sukar">Sukar</option>
            </select>
          </div>
        </div>

        {/* Row 5: Dalil & Generation trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={gunakanDalil}
              onChange={(e) => setGunakanDalil(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span>Sertakan Rujukan Dalil Al-Qur'an &amp; Hadis Sahih (Nomor Surah &amp; Ayat Terverifikasi)</span>
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-900/30 transition transform active:scale-98"
          >
            {isLoading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>AI Sedang Merumuskan {jumlahSoal} Soal...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate {jumlahSoal} Soal Sekarang</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            {!isPro && (
              <button
                type="button"
                onClick={onOpenActivation}
                className="shrink-0 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AKTIVASI PRO</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* GENERATED QUESTIONS & IN-PLACE EDITOR */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Hasil Generator: {generatedQuestions.length} Butir Soal</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Siap Diedit &amp; Disimpan
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Setiap butir soal dapat disunting langsung di bawah ini (memenuhi Uji TEST 6)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToBank}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                Simpan Seluruh Soal ke Bank ({generatedQuestions.length})
              </button>
            </div>
          </div>

          {/* Question List Accordion / Editor Cards */}
          <div className="space-y-4">
            {generatedQuestions.map((q, idx) => {
              const isEditing = editingQuestionId === q.id;
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {q.fase} • Kelas {q.kelas}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700">
                        [{q.tpKode}] {q.elemen}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {q.levelBloom} • {q.levelSOLO} ({q.kategoriKognitif})
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {q.bentukSoal}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingQuestionId(isEditing ? null : q.id)}
                        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                          isEditing
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="Edit soal manual"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>{isEditing ? 'Selesai Edit' : 'Edit Manual'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteGeneratedQuestion(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Hapus butir ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stimulus Section if present */}
                  {q.stimulus && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Stimulus ({q.stimulus.tipe}):
                      </span>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={q.stimulus.konten}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, {
                              stimulus: { ...q.stimulus!, konten: e.target.value },
                            })
                          }
                          className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      ) : (
                        <p className="text-slate-700 italic">{q.stimulus.konten}</p>
                      )}
                    </div>
                  )}

                  {/* Question Prompt */}
                  <div className="text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pertanyaan Soal:
                    </span>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={q.pertanyaan}
                        onChange={(e) => handleUpdateQuestion(q.id, { pertanyaan: e.target.value })}
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                      />
                    ) : (
                      <p className="text-slate-900 font-semibold text-[13px] leading-relaxed">
                        {q.pertanyaan}
                      </p>
                    )}
                  </div>

                  {/* Options (Pilihan Ganda A-E) */}
                  {q.opsi && q.opsi.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Pilihan Jawaban:
                      </span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {q.opsi.map((op, oIdx) => {
                          const isCorrect =
                            op.startsWith(q.kunciJawaban) ||
                            q.kunciJawaban.includes(String.fromCharCode(65 + oIdx));
                          return isEditing ? (
                            <input
                              key={oIdx}
                              type="text"
                              value={op}
                              onChange={(e) => {
                                const newOps = [...q.opsi!];
                                newOps[oIdx] = e.target.value;
                                handleUpdateQuestion(q.id, { opsi: newOps });
                              }}
                              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
                            />
                          ) : (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                                isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span>{op}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                  Kunci Benar
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Key & Discussion */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                      <div className="flex items-center justify-between font-bold text-emerald-900">
                        <span>Kunci Jawaban: {q.kunciJawaban}</span>
                        {q.dalilRujukan?.surahAyat && (
                          <span className="text-[10px] text-emerald-700 font-normal">
                            Dalil: {q.dalilRujukan.surahAyat}
                          </span>
                        )}
                      </div>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={q.pembahasan}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { pembahasan: e.target.value })
                          }
                          className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      ) : (
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {q.pembahasan}
                        </p>
                      )}
                    </div>

                    {/* Rubric for Essays */}
                    {q.rubrikSkor && (
                      <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100 space-y-1 text-xs">
                        <span className="font-bold text-purple-900">
                          Rubrik Penskoran Analitik (Skor Maks: {q.rubrikSkor.skorMaksimal})
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-purple-950 space-y-0.5">
                          {q.rubrikSkor.kriteria.map((crit, cIdx) => (
                            <li key={cIdx}>{crit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
