import {
  CapaianPembelajaran,
  TujuanPembelajaran,
  QuestionItem,
  PaketAsesmen,
  QuranAssessmentRecord,
  AnalisisHasil,
  RubrikItem,
  ProfilSekolah,
  SiswaMaster,
  PenilaianFormatifRecord,
  PenilaianSumatifRecord,
  CatatanSikapRecord,
  KonfigurasiPenilaian,
} from '../types/curriculum';
import { DEFAULT_CP_LIST, DEFAULT_TP_LIST, DEFAULT_PROFIL_SEKOLAH } from '../data/defaultCurriculum';
import { SEED_QUESTIONS } from '../data/seedQuestions';
import {
  DEFAULT_SISWA_LIST,
  DEFAULT_FORMATIF_LIST,
  DEFAULT_SUMATIF_LIST,
  DEFAULT_CATATAN_SIKAP_LIST,
  DEFAULT_KONFIGURASI_PENILAIAN,
} from '../data/defaultGradingData';

export interface AppDatabase {
  profilSekolah: ProfilSekolah;
  cpList: CapaianPembelajaran[];
  tpList: TujuanPembelajaran[];
  questionBank: QuestionItem[];
  assessmentPackages: PaketAsesmen[];
  quranRecords: QuranAssessmentRecord[];
  rubricList: RubrikItem[];
  analyticsList: AnalisisHasil[];
  siswaList: SiswaMaster[];
  formatifList: PenilaianFormatifRecord[];
  sumatifList: PenilaianSumatifRecord[];
  catatanSikapList: CatatanSikapRecord[];
  konfigurasiPenilaian: KonfigurasiPenilaian;
  lastUpdated: string;
}

const LOCAL_STORAGE_KEY = 'paibp_smart_assessment_db_v1';

export const getInitialData = (): AppDatabase => {
  return {
    profilSekolah: DEFAULT_PROFIL_SEKOLAH,
    cpList: DEFAULT_CP_LIST,
    tpList: DEFAULT_TP_LIST,
    questionBank: SEED_QUESTIONS,
    assessmentPackages: [
      {
        id: 'PKG-DEMO-01',
        namaPaket: 'Asesmen Sumatif Akhir Semester (SAS) PAIBP Kelas X Fase E',
        satuanPendidikan: 'SMA NEGERI 1 MERDEKA BELAJAR',
        mataPelajaran: 'Pendidikan Agama Islam dan Budi Pekerti',
        fase: 'E',
        kelas: 'X',
        semester: '2',
        tahunPelajaran: '2025/2026',
        jenisAsesmen: 'Sumatif Akhir Semester',
        materiCakupan: ['Al-Kulliyat Al-Khamsah', 'Larangan Pergaulan Bebas dan Zina', 'Cabang Iman'],
        durasiMenit: 90,
        totalSoal: 10,
        petunjukUmum:
          '1. Bacalah basmalah sebelum memulai.\n2. Pilihlah salah satu jawaban yang paling tepat.\n3. Periksa kembali lembar jawaban sebelum dikumpulkan.',
        kisiKisiList: [],
        soalIds: SEED_QUESTIONS.filter((q) => q.fase === 'E').map((q) => q.id),
        soalList: SEED_QUESTIONS.filter((q) => q.fase === 'E'),
        kunciDanPembahasanTerpisah: true,
        createdAt: '2026-02-15T08:00:00.000Z',
        updatedAt: '2026-02-15T08:00:00.000Z',
      },
      {
        id: 'PKG-DEMO-02',
        namaPaket: 'Asesmen Formatif Berpikir Kritis & Fikih Mawaris Fase F',
        satuanPendidikan: 'SMA NEGERI 1 MERDEKA BELAJAR',
        mataPelajaran: 'Pendidikan Agama Islam dan Budi Pekerti',
        fase: 'F',
        kelas: 'XI',
        semester: '1',
        tahunPelajaran: '2025/2026',
        jenisAsesmen: 'Formatif Bab',
        materiCakupan: ['Berpikir Kritis (Q.S. Ali \'Imran/3: 190-191)', 'Khotbah & Tablig', 'Mawaris'],
        durasiMenit: 60,
        totalSoal: 5,
        petunjukUmum:
          '1. Bacalah basmalah.\n2. Analisis stimulus kasus dengan teliti dan gunakan prinsip syariat.',
        kisiKisiList: [],
        soalIds: SEED_QUESTIONS.filter((q) => q.fase === 'F').map((q) => q.id),
        soalList: SEED_QUESTIONS.filter((q) => q.fase === 'F'),
        kunciDanPembahasanTerpisah: true,
        createdAt: '2026-02-15T08:00:00.000Z',
        updatedAt: '2026-02-15T08:00:00.000Z',
      },
    ],
    quranRecords: [
      {
        id: 'QR-01',
        tanggal: '2026-02-10',
        namaSiswa: 'Ahmad Farhan',
        kelas: 'X',
        fase: 'E',
        tipe: 'Tilawah',
        surahAyat: 'Q.S. Al-Baqarah/2: 148',
        targetJuz: 'Juz 1',
        skorAspek: {
          makharijulHuruf: 4,
          tajwid: 4,
          kelancaran: 3,
          fashahahAdab: 4,
        },
        nilaiAkhir: 94,
        predikat: 'Sangat Baik',
        catatanGuru: 'Tilawah sangat tertib, kaidah mad dan ikhfa sangat rapi.',
        rekomendasiPerbaikan: 'Tingkatkan kestabilan nafas pada waqaf panjang.',
        statusHafalanTerverifikasi: true,
      },
      {
        id: 'QR-02',
        tanggal: '2026-02-12',
        namaSiswa: 'Siti Nurhaliza',
        kelas: 'XI',
        fase: 'F',
        tipe: 'Tahfiz',
        surahAyat: 'Q.S. Ali \'Imran/3: 190-200',
        targetJuz: 'Juz 4',
        skorAspek: {
          makharijulHuruf: 4,
          tajwid: 3,
          kelancaran: 4,
          fashahahAdab: 4,
          murojaahKemandirian: 4,
        },
        nilaiAkhir: 95,
        predikat: 'Sangat Baik',
        catatanGuru: 'Hafalan mutqin, siap masuk ke juz berikutnya.',
        rekomendasiPerbaikan: 'Pertahankan murojaah rutin ba\'da subuh.',
        statusHafalanTerverifikasi: true,
      },
    ],
    rubricList: [
      {
        id: 'RUB-01',
        judul: 'Rubrik Penilaian Esai Analisis Al-Kulliyat Al-Khamsah',
        tpKode: 'E.F.2',
        bentukAsesmen: 'Uraian Kasus',
        skala: 4,
        aspekPenilaian: [
          {
            namaAspek: 'Ketepatan Konsep Maqashid',
            bobotPersen: 30,
            deskriptor: {
              level4: 'Menjelaskan kelima pilar maqashid secara komprehensif tanpa kekeliruan.',
              level3: 'Menjelaskan minimal 4 pilar secara tepat dengan argumen memadai.',
              level2: 'Menjelaskan 2-3 pilar namun terdapat ketidaktepatan konsep minor.',
              level1: 'Belum memahami pembagian dan makna Al-Kulliyat Al-Khamsah.',
            },
          },
          {
            namaAspek: 'Analisis Kasus & Solusi Syariat',
            bobotPersen: 40,
            deskriptor: {
              level4: 'Analisis kritis, mendalam, dan solutif mengaitkan kasus dengan perlindungan jiwa/harta.',
              level3: 'Analisis relevan dan mampu memberikan saran solusi yang logis.',
              level2: 'Analisis bersifat permukaan dan solusi kurang terhubung dengan konsep.',
              level1: 'Tidak ada analisis kasus yang relevan.',
            },
          },
          {
            namaAspek: 'Integrasi Dalil Al-Qur\'an / Hadis',
            bobotPersen: 30,
            deskriptor: {
              level4: 'Mengutip dalil sahih dengan nomor surah/ayat tepat dan istidlal yang kuat.',
              level3: 'Mengutip dalil yang relevan dengan terjemahan yang benar.',
              level2: 'Menyebutkan konsep dalil secara umum tanpa nomor atau rujukan jelas.',
              level1: 'Tidak menyertakan rujukan dalil sama sekali.',
            },
          },
        ],
        pedomanPenskoran: 'Nilai Akhir = (Total Skor Perolehan / Total Skor Maksimum) × 100',
        kktpRentang: {
          perluBimbingan: '0 - 64',
          cukup: '65 - 74',
          baik: '75 - 89',
          sangatBaik: '90 - 100',
        },
      },
    ],
    analyticsList: [
      {
        id: 'ANA-DEMO-01',
        paketId: 'PKG-DEMO-01',
        namaAsesmen: 'Asesmen Sumatif Akhir Semester (SAS) PAIBP Kelas X Fase E',
        kktp: 75,
        totalPeserta: 10,
        rataRataKelas: 83.2,
        nilaiTertinggi: 96,
        nilaiTerendah: 68,
        standarDeviasi: 8.4,
        persentaseKetuntasan: 80,
        distribusiNilai: [
          { rentang: '90 - 100', jumlah: 3 },
          { rentang: '80 - 89', jumlah: 4 },
          { rentang: '70 - 79', jumlah: 2 },
          { rentang: '< 70', jumlah: 1 },
        ],
        ketercapaianTP: [
          {
            tpKode: 'E.F.2',
            materi: 'Al-Kulliyat Al-Khamsah',
            persentaseCapaian: 85,
            status: 'Tercapai',
            soalTerkait: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          },
          {
            tpKode: 'E.AQH.2',
            materi: 'Larangan Pergaulan Bebas dan Zina',
            persentaseCapaian: 78,
            status: 'Tercapai',
            soalTerkait: [4, 9],
          },
        ],
        analisisButirSoal: [
          { nomorSoal: 1, dayaPembeda: 'Sangat Baik (0.45)', tingkatKesukaran: 'Sedang (0.62)', efektivitasDistraktor: 'Berfungsi Baik' },
          { nomorSoal: 2, dayaPembeda: 'Baik (0.38)', tingkatKesukaran: 'Sedang (0.58)', efektivitasDistraktor: 'Berfungsi Baik' },
          { nomorSoal: 4, dayaPembeda: 'Sangat Baik (0.48)', tingkatKesukaran: 'Sukar (0.35)', efektivitasDistraktor: 'Berfungsi Baik' },
        ],
        siswaList: [
          { id: 'S1', nisn: '0081234561', nama: 'Ahmad Zaki', jawabanSiswa: { 1: 'B', 2: 'C', 3: 'B', 4: 'B', 5: 'B' }, skorPerButir: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10 }, nilaiAkhir: 96, statusKetuntasan: 'Tuntas' },
          { id: 'S2', nisn: '0081234562', nama: 'Aisyah Putri', jawabanSiswa: { 1: 'B', 2: 'C', 3: 'B', 4: 'B', 5: 'B' }, skorPerButir: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10 }, nilaiAkhir: 92, statusKetuntasan: 'Tuntas' },
          { id: 'S3', nisn: '0081234563', nama: 'Budi Santoso', jawabanSiswa: { 1: 'B', 2: 'A', 3: 'B', 4: 'C', 5: 'B' }, skorPerButir: { 1: 10, 2: 0, 3: 10, 4: 0, 5: 10 }, nilaiAkhir: 68, statusKetuntasan: 'Belum Tuntas', catatan: 'Perlu bimbingan remedial pada materi Maqashid Syariah' },
          { id: 'S4', nisn: '0081234564', nama: 'Dewi Lestari', jawabanSiswa: { 1: 'B', 2: 'C', 3: 'B', 4: 'B', 5: 'B' }, skorPerButir: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10 }, nilaiAkhir: 88, statusKetuntasan: 'Tuntas' },
          { id: 'S5', nisn: '0081234565', nama: 'Fajar Nugraha', jawabanSiswa: { 1: 'B', 2: 'C', 3: 'A', 4: 'B', 5: 'B' }, skorPerButir: { 1: 10, 2: 10, 3: 0, 4: 10, 5: 10 }, nilaiAkhir: 82, statusKetuntasan: 'Tuntas' },
        ],
      },
    ],
    siswaList: DEFAULT_SISWA_LIST,
    formatifList: DEFAULT_FORMATIF_LIST,
    sumatifList: DEFAULT_SUMATIF_LIST,
    catatanSikapList: DEFAULT_CATATAN_SIKAP_LIST,
    konfigurasiPenilaian: DEFAULT_KONFIGURASI_PENILAIAN,
    lastUpdated: new Date().toISOString(),
  };
};

export const loadDatabase = async (): Promise<AppDatabase> => {
  const sanitizeLoaded = (data: any): AppDatabase => {
    const defaults = getInitialData();
    return {
      profilSekolah: data.profilSekolah || defaults.profilSekolah,
      cpList: data.cpList || defaults.cpList,
      tpList: data.tpList || defaults.tpList,
      questionBank: data.questionBank || defaults.questionBank,
      assessmentPackages: data.assessmentPackages || defaults.assessmentPackages,
      quranRecords: data.quranRecords || defaults.quranRecords,
      rubricList: data.rubricList || defaults.rubricList,
      analyticsList: data.analyticsList || defaults.analyticsList,
      siswaList: data.siswaList || defaults.siswaList,
      formatifList: data.formatifList || defaults.formatifList,
      sumatifList: data.sumatifList || defaults.sumatifList,
      catatanSikapList: data.catatanSikapList || defaults.catatanSikapList,
      konfigurasiPenilaian: data.konfigurasiPenilaian || defaults.konfigurasiPenilaian,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  };

  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const sanitized = sanitizeLoaded(json.data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
        return sanitized;
      }
    }
  } catch (err) {
    console.warn('Backend fetch failed, trying localStorage:', err);
  }

  // Check localStorage fallback
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      const sanitized = sanitizeLoaded(parsed);
      return sanitized;
    } catch (e) {
      console.error('Error parsing local storage:', e);
    }
  }

  // Initialize fresh defaults
  const initial = getInitialData();
  saveDatabase(initial);
  return initial;
};

export const saveDatabase = async (data: AppDatabase): Promise<boolean> => {
  data.lastUpdated = new Date().toISOString();
  // Always save to localStorage immediately
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }

  // Sync to server-side persistent JSON
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to sync to backend persistent db, saved locally:', err);
    return false;
  }
};
