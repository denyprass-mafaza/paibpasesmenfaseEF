export type Fase = 'D' | 'E' | 'F';
export type Kelas = 'VII' | 'VIII' | 'IX' | 'X' | 'XI' | 'XII';
export type Semester = '1' | '2';

export type ElemenPAI =
  | "Al-Qur'an Hadis"
  | 'Akidah'
  | 'Akhlak'
  | 'Fikih'
  | 'Sejarah Peradaban Islam';

export interface CapaianPembelajaran {
  id: string;
  fase: Fase;
  elemen: ElemenPAI;
  deskripsi: string;
  sumberDokumen: string;
  isVerified: boolean;
}

export interface TujuanPembelajaran {
  id: string; // e.g. E.AQH.1
  fase: Fase;
  kelas: Kelas[];
  semester: Semester;
  elemen: ElemenPAI;
  cpId: string;
  kode: string;
  deskripsi: string;
  alokasiJP: number;
  materiPokok: string[];
  indikatorDefault: string[];
  isCustom?: boolean;
}

export type BentukSoal =
  | 'Pilihan Ganda'
  | 'Pilihan Ganda Kompleks'
  | 'Benar/Salah'
  | 'Menjodohkan'
  | 'Isian Singkat'
  | 'Uraian/Esai'
  | 'Studi Kasus'
  | 'Berbasis Stimulus';

export type BloomLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
export type CognitiveDomain = 'LOTS' | 'MOTS' | 'HOTS';

export type SoloLevel =
  | 'Prestructural'
  | 'Unistructural'
  | 'Multistructural'
  | 'Relational'
  | 'Extended Abstract';

export type TingkatKesulitan = 'Mudah' | 'Sedang' | 'Sukar';

export type ValidationStatus = 'Valid' | 'Perlu Revisi' | 'Tidak Valid';

export interface ValidationDetail {
  status: ValidationStatus;
  score: number; // 0 - 100
  checks: {
    kesesuaianFaseKelas: boolean;
    kesesuaianCPTPMateri: boolean;
    ketepatanLevelKognitif: boolean;
    ketepatanKonsepIslam: boolean;
    validitasDalilHadis: boolean;
    kualitasDistraktorBahasa: boolean;
    ketiadaanAmbiguitas: boolean;
  };
  reasons: string[];
  suggestions: string[];
  dalilWarning?: string;
}

export interface MatchingPair {
  id: string;
  premise: string;
  response: string;
}

export interface QuestionItem {
  id: string;
  nomorSoal?: number;
  fase: Fase;
  kelas: Kelas;
  semester: Semester;
  elemen: ElemenPAI;
  cpId: string;
  tpId: string;
  tpKode: string;
  materi: string;
  indikator: string;
  bentukSoal: BentukSoal;
  levelBloom: BloomLevel;
  levelSOLO: SoloLevel;
  kategoriKognitif: CognitiveDomain;
  kesulitan: TingkatKesulitan;
  stimulus?: {
    tipe: 'teks' | 'kasus' | 'ayat_hadis' | 'tabel' | 'infografis';
    konten: string;
    sumber?: string;
  };
  pertanyaan: string;
  opsi?: string[]; // for PG (A-D or A-E)
  kunciJawaban: string; // "A", or array JSON string for complex/matching
  kunciKompleks?: string[]; // For Pilihan Ganda Kompleks
  pasanganMenjodohkan?: MatchingPair[]; // For Menjodohkan
  pernyataanBenarSalah?: { pernyataan: string; jawaban: boolean; penjelasan: string }[];
  pembahasan: string;
  dalilRujukan?: {
    surahAyat?: string;
    teksArab?: string;
    terjemah?: string;
    riwayatHadis?: string;
    statusVerifikasi: 'Terverifikasi' | 'Perlu Dicek Guru';
  };
  rubrikSkor?: {
    kriteria: string[];
    skorMaksimal: number;
    pedoman: { rentangSkor: string; deskripsi: string }[];
  };
  deepLearningDimensi?: {
    mindful: boolean;
    meaningful: boolean;
    joyful: boolean;
    pengalaman: 'Memahami' | 'Mengaplikasikan' | 'Merefleksikan';
  };
  validation: ValidationDetail;
  createdAt: string;
  updatedAt: string;
}

export interface KisiKisiItem {
  id: string;
  nomorUrut: number;
  fase: Fase;
  kelas: Kelas;
  semester: Semester;
  elemen: ElemenPAI;
  cpDeskripsi: string;
  tpKode: string;
  tpDeskripsi: string;
  materi: string;
  indikatorSoal: string;
  levelBloom: BloomLevel;
  levelSOLO: SoloLevel;
  kesulitan: TingkatKesulitan;
  bentukSoal: BentukSoal;
  nomorSoalPaket: number;
}

export interface RubrikItem {
  id: string;
  judul: string;
  tpKode: string;
  bentukAsesmen: string;
  skala: number; // 4 default
  aspekPenilaian: {
    namaAspek: string;
    bobotPersen: number;
    deskriptor: {
      level4: string; // Sangat Baik
      level3: string; // Baik
      level2: string; // Cukup
      level1: string; // Perlu Bimbingan
    };
  }[];
  pedomanPenskoran: string;
  kktpRentang: {
    perluBimbingan: string;
    cukup: string;
    baik: string;
    sangatBaik: string;
  };
}

export interface QuranAssessmentRecord {
  id: string;
  tanggal: string;
  namaSiswa: string;
  kelas: Kelas;
  fase: Fase;
  tipe: 'Tilawah' | 'Tahfiz';
  surahAyat: string;
  targetJuz: string;
  skorAspek: {
    makharijulHuruf: number; // 1-4
    tajwid: number; // 1-4
    kelancaran: number; // 1-4
    fashahahAdab: number; // 1-4
    murojaahKemandirian?: number; // 1-4
  };
  nilaiAkhir: number; // 0-100
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  catatanGuru: string;
  rekomendasiPerbaikan: string;
  statusHafalanTerverifikasi: boolean;
}

export interface NonTestInstrument {
  id: string;
  jenis:
    | 'Observasi Sikap'
    | 'Penilaian Diri'
    | 'Penilaian Antarteman'
    | 'Jurnal Refleksi'
    | 'Penilaian Praktik'
    | 'Penilaian Proyek'
    | 'Penilaian Produk'
    | 'Penilaian Portofolio'
    | 'Penilaian Presentasi'
    | 'Penilaian Diskusi';
  fase: Fase;
  kelas: Kelas;
  elemen: ElemenPAI;
  tpKode: string;
  materi: string;
  tujuanPenilaian: string;
  aspekDinilai: string[];
  indikator: string[];
  teknikPenilaian: string;
  daftarPernyataan: {
    id: number;
    butir: string;
    kategori: 'Positif' | 'Negatif' | 'Keterampilan' | 'Refleksi';
  }[];
  pedomanPenskoran: string;
  rubrikDeskripsi: string;
}

export interface PaketAsesmen {
  id: string;
  namaPaket: string;
  satuanPendidikan: string;
  mataPelajaran: string;
  fase: Fase;
  kelas: Kelas;
  semester: Semester;
  tahunPelajaran: string;
  jenisAsesmen: 'Sumatif Akhir Semester' | 'Sumatif Tengah Semester' | 'Formatif Bab' | 'Penilaian Harian' | 'Asesmen Diagnostik';
  materiCakupan: string[];
  durasiMenit: number;
  totalSoal: number;
  petunjukUmum: string;
  kisiKisiList: KisiKisiItem[];
  soalIds: string[];
  soalList: QuestionItem[];
  kunciDanPembahasanTerpisah: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiswaNilai {
  id: string;
  nisn: string;
  nama: string;
  jawabanSiswa: Record<number, string>; // nomorSoal -> jawaban
  skorPerButir: Record<number, number>; // nomorSoal -> skor
  nilaiAkhir: number;
  statusKetuntasan: 'Tuntas' | 'Belum Tuntas';
  catatan?: string;
}

export interface AnalisisHasil {
  id: string;
  paketId: string;
  namaAsesmen: string;
  kktp: number; // default 75
  totalPeserta: number;
  rataRataKelas: number;
  nilaiTertinggi: number;
  nilaiTerendah: number;
  standarDeviasi: number;
  persentaseKetuntasan: number;
  distribusiNilai: {
    rentang: string;
    jumlah: number;
  }[];
  ketercapaianTP: {
    tpKode: string;
    materi: string;
    persentaseCapaian: number;
    status: 'Tercapai' | 'Perlu Perbaikan';
    soalTerkait: number[];
  }[];
  analisisButirSoal: {
    nomorSoal: number;
    dayaPembeda: string;
    tingkatKesukaran: string;
    efektivitasDistraktor: string;
  }[];
  siswaList: SiswaNilai[];
}

export interface ProgramRemedialPengayaan {
  id: string;
  analisisId: string;
  fase: Fase;
  kelas: Kelas;
  tpBelumTercapai: {
    tpKode: string;
    deskripsi: string;
    materi: string;
    daftarSiswa: string[];
  }[];
  rencanaRemedial: {
    materiPenguatan: string;
    metodeAlternatif: string;
    bentukAsesmenUlang: string;
    soalRemedial: QuestionItem[];
  };
  rencanaPengayaan: {
    daftarSiswaPengayaan: string[];
    topikEksplorasi: string;
    studiKasusHots: string;
    tugasProyekRefleksi: string;
    soalTantanganHots: QuestionItem[];
  };
}

export interface ProfilSekolah {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  guruMataPelajaran: string;
  nipGuru: string;
  tahunPelajaran: string;
  kktpDefault: number;
}

// ==========================================
// SISTEM PENILAIAN AL-ISLAM SMART ASSESSMENT PRO
// ==========================================

export interface SiswaMaster {
  id: string;
  nisn: string;
  nama: string;
  kelas: Kelas;
  fase: Fase;
  jenisKelamin: 'L' | 'P';
}

export interface PenilaianFormatifRecord {
  id: string;
  siswaId: string;
  kelas: Kelas;
  fase: Fase;
  semester: Semester;
  tahunPelajaran: string;
  awal?: number | null;
  tengah?: number | null;
  akhir?: number | null;
  catatan?: string;
  updatedAt: string;
}

export interface ElemenNilaiSumatif {
  kognitif?: number | null;
  sikap?: number | null;
}

export interface PenilaianSumatifRecord {
  id: string;
  siswaId: string;
  kelas: Kelas;
  fase: Fase;
  semester: Semester;
  tahunPelajaran: string;
  elemen: {
    quranHadis: ElemenNilaiSumatif;
    akidah: ElemenNilaiSumatif;
    akhlak: ElemenNilaiSumatif;
    fikih: ElemenNilaiSumatif;
    spi: ElemenNilaiSumatif;
  };
  sts?: number | null;
  sas?: number | null;
  updatedAt: string;
}

export interface CatatanSikapRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  namaSiswa: string;
  kelas: Kelas;
  fase: Fase;
  kejadian: string;
  tindakLanjut: string;
  predikat: 'A' | 'B' | 'C' | 'D';
  keterangan: string;
  createdAt: string;
}

export interface KonfigurasiPenilaian {
  batasPredikatA: number; // default >= 90
  batasPredikatB: number; // default >= 80
  batasPredikatC: number; // default >= 70
  batasPredikatD: number; // default < 70
  jumlahDesimal: number; // default 1
  kktp: number; // default 75
  tahunPelajaran: string;
  semester: Semester;
}

