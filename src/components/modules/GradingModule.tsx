import React, { useState, useMemo } from 'react';
import {
  SiswaMaster,
  PenilaianFormatifRecord,
  PenilaianSumatifRecord,
  CatatanSikapRecord,
  KonfigurasiPenilaian,
  ProfilSekolah,
  Fase,
  Kelas,
  Semester,
} from '../../types/curriculum';
import {
  GraduationCap,
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Printer,
  Settings,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  UserPlus,
  BookOpen,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';

interface Props {
  siswaList: SiswaMaster[];
  formatifList: PenilaianFormatifRecord[];
  sumatifList: PenilaianSumatifRecord[];
  catatanSikapList: CatatanSikapRecord[];
  konfigurasiPenilaian: KonfigurasiPenilaian;
  profilSekolah: ProfilSekolah;
  onUpdateSiswaList: (list: SiswaMaster[]) => void;
  onUpdateFormatifList: (list: PenilaianFormatifRecord[]) => void;
  onUpdateSumatifList: (list: PenilaianSumatifRecord[]) => void;
  onUpdateCatatanSikapList: (list: CatatanSikapRecord[]) => void;
  onUpdateKonfigurasi: (config: KonfigurasiPenilaian) => void;
  onNavigateToDataSiswa?: () => void;
}

export const GradingModule: React.FC<Props> = ({
  siswaList,
  formatifList,
  sumatifList,
  catatanSikapList,
  konfigurasiPenilaian,
  profilSekolah,
  onUpdateSiswaList,
  onUpdateFormatifList,
  onUpdateSumatifList,
  onUpdateCatatanSikapList,
  onUpdateKonfigurasi,
  onNavigateToDataSiswa,
}) => {
  // Tabs: formatif, sumatif, sikap, rekap
  const [activeTab, setActiveTab] = useState<'formatif' | 'sumatif' | 'sikap' | 'rekap'>('formatif');

  // Filter States
  const [selectedTahun, setSelectedTahun] = useState<string>(konfigurasiPenilaian.tahunPelajaran || '2025/2026');
  const [selectedSemester, setSelectedSemester] = useState<Semester>(konfigurasiPenilaian.semester || '2');
  const [selectedFase, setSelectedFase] = useState<Fase>('E');
  const [selectedKelas, setSelectedKelas] = useState<Kelas>('X');
  const [searchSiswa, setSearchSiswa] = useState<string>('');

  // Sikap specific filters
  const [filterSikapPredikat, setFilterSikapPredikat] = useState<string>('ALL');
  const [filterSikapTglMulai, setFilterSikapTglMulai] = useState<string>('');
  const [filterSikapTglSelesai, setFilterSikapTglSelesai] = useState<string>('');

  // Error alert state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAddSiswaModalOpen, setIsAddSiswaModalOpen] = useState(false);
  const [isAddSikapModalOpen, setIsAddSikapModalOpen] = useState(false);
  const [isStudentTimelineOpen, setIsStudentTimelineOpen] = useState<SiswaMaster | null>(null);

  // Temporary Sikap Form state
  const [editingSikapId, setEditingSikapId] = useState<string | null>(null);
  const [formSikapSiswaId, setFormSikapSiswaId] = useState<string>('');
  const [formSikapTanggal, setFormSikapTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formSikapKejadian, setFormSikapKejadian] = useState<string>('');
  const [formSikapTindakLanjut, setFormSikapTindakLanjut] = useState<string>('');
  const [formSikapPredikat, setFormSikapPredikat] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formSikapKeterangan, setFormSikapKeterangan] = useState<string>('');

  // Add Student Form state
  const [newSiswaNisn, setNewSiswaNisn] = useState('');
  const [newSiswaNama, setNewSiswaNama] = useState('');
  const [newSiswaGender, setNewSiswaGender] = useState<'L' | 'P'>('L');

  // Handle Fase Change and adjust classes
  const handleFaseChange = (newFase: Fase) => {
    setSelectedFase(newFase);
    if (newFase === 'D') {
      setSelectedKelas('VII');
    } else if (newFase === 'E') {
      setSelectedKelas('X');
    } else {
      setSelectedKelas('XI');
    }
  };

  // Filter students for current class
  const classStudents = useMemo(() => {
    return siswaList.filter((s) => {
      if (s.kelas !== selectedKelas) return false;
      if (searchSiswa.trim()) {
        const q = searchSiswa.toLowerCase();
        return s.nama.toLowerCase().includes(q) || s.nisn.includes(q);
      }
      return true;
    });
  }, [siswaList, selectedKelas, searchSiswa]);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const showValidationError = (msg: string) => {
    setValidationError(msg);
    setTimeout(() => setValidationError(null), 3500);
  };

  // Number validation helper
  const validateScoreInput = (val: string): { isValid: boolean; numVal: number | null } => {
    const trimmed = val.trim();
    if (trimmed === '') return { isValid: true, numVal: null };
    const num = Number(trimmed);
    if (isNaN(num)) {
      showValidationError('Nilai harus berupa angka valid.');
      return { isValid: false, numVal: null };
    }
    if (num < 0 || num > 100) {
      showValidationError('Nilai harus berada dalam rentang 0 sampai 100.');
      return { isValid: false, numVal: null };
    }
    return { isValid: true, numVal: num };
  };

  // Format number with configured decimals
  const formatNum = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '-';
    return val.toFixed(konfigurasiPenilaian.jumlahDesimal || 1);
  };

  // Predicate calculator
  const calculatePredikat = (score: number | null | undefined): string => {
    if (score === null || score === undefined || isNaN(score)) return '-';
    if (score >= konfigurasiPenilaian.batasPredikatA) return 'A';
    if (score >= konfigurasiPenilaian.batasPredikatB) return 'B';
    if (score >= konfigurasiPenilaian.batasPredikatC) return 'C';
    return 'D';
  };

  // ==========================================
  // 1. FORMATIF HANDLERS & CALCULATIONS
  // ==========================================
  const getFormatifRecord = (siswaId: string): PenilaianFormatifRecord => {
    const found = formatifList.find(
      (f) =>
        f.siswaId === siswaId &&
        f.kelas === selectedKelas &&
        f.semester === selectedSemester &&
        f.tahunPelajaran === selectedTahun
    );
    if (found) return found;
    return {
      id: `FM-${siswaId}-${selectedKelas}-${selectedSemester}`,
      siswaId,
      kelas: selectedKelas,
      fase: selectedFase,
      semester: selectedSemester,
      tahunPelajaran: selectedTahun,
      awal: null,
      tengah: null,
      akhir: null,
      catatan: '',
      updatedAt: new Date().toISOString(),
    };
  };

  const computeFormatifAverage = (rec: PenilaianFormatifRecord): number | null => {
    const values: number[] = [];
    if (typeof rec.awal === 'number' && !isNaN(rec.awal)) values.push(rec.awal);
    if (typeof rec.tengah === 'number' && !isNaN(rec.tengah)) values.push(rec.tengah);
    if (typeof rec.akhir === 'number' && !isNaN(rec.akhir)) values.push(rec.akhir);
    if (values.length === 0) return null;
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return Math.round((sum / values.length) * 10) / 10;
  };

  const handleUpdateFormatifCell = (
    siswaId: string,
    field: 'awal' | 'tengah' | 'akhir' | 'catatan',
    value: string
  ) => {
    const existing = getFormatifRecord(siswaId);
    let updated: PenilaianFormatifRecord;

    if (field === 'catatan') {
      updated = { ...existing, catatan: value, updatedAt: new Date().toISOString() };
    } else {
      const check = validateScoreInput(value);
      if (!check.isValid) return;
      updated = { ...existing, [field]: check.numVal, updatedAt: new Date().toISOString() };
    }

    const nextList = formatifList.some((f) => f.id === existing.id)
      ? formatifList.map((f) => (f.id === existing.id ? updated : f))
      : [...formatifList, updated];

    onUpdateFormatifList(nextList);
  };

  // ==========================================
  // 2. SUMATIF HANDLERS & CALCULATIONS
  // ==========================================
  const getSumatifRecord = (siswaId: string): PenilaianSumatifRecord => {
    const found = sumatifList.find(
      (s) =>
        s.siswaId === siswaId &&
        s.kelas === selectedKelas &&
        s.semester === selectedSemester &&
        s.tahunPelajaran === selectedTahun
    );
    if (found) return found;
    return {
      id: `SM-${siswaId}-${selectedKelas}-${selectedSemester}`,
      siswaId,
      kelas: selectedKelas,
      fase: selectedFase,
      semester: selectedSemester,
      tahunPelajaran: selectedTahun,
      elemen: {
        quranHadis: { kognitif: null, sikap: null },
        akidah: { kognitif: null, sikap: null },
        akhlak: { kognitif: null, sikap: null },
        fikih: { kognitif: null, sikap: null },
        spi: { kognitif: null, sikap: null },
      },
      sts: null,
      sas: null,
      updatedAt: new Date().toISOString(),
    };
  };

  // Rt elemen = (Kognitif + Sikap) / 2. If only one filled, that value. If both empty, null.
  const computeRtElemen = (kog: number | null | undefined, skp: number | null | undefined): number | null => {
    const hasKog = typeof kog === 'number' && !isNaN(kog);
    const hasSkp = typeof skp === 'number' && !isNaN(skp);
    if (hasKog && hasSkp) return Math.round(((kog! + skp!) / 2) * 10) / 10;
    if (hasKog) return kog!;
    if (hasSkp) return skp!;
    return null;
  };

  // Full row calculation for Sumatif
  const computeSumatifRow = (rec: PenilaianSumatifRecord) => {
    const rtQH = computeRtElemen(rec.elemen.quranHadis.kognitif, rec.elemen.quranHadis.sikap);
    const rtAk = computeRtElemen(rec.elemen.akidah.kognitif, rec.elemen.akidah.sikap);
    const rtAkh = computeRtElemen(rec.elemen.akhlak.kognitif, rec.elemen.akhlak.sikap);
    const rtFk = computeRtElemen(rec.elemen.fikih.kognitif, rec.elemen.fikih.sikap);
    const rtSpi = computeRtElemen(rec.elemen.spi.kognitif, rec.elemen.spi.sikap);

    // Rt Sumatif = average of filled Rt elements
    const filledRtElements: number[] = [];
    if (rtQH !== null) filledRtElements.push(rtQH);
    if (rtAk !== null) filledRtElements.push(rtAk);
    if (rtAkh !== null) filledRtElements.push(rtAkh);
    if (rtFk !== null) filledRtElements.push(rtFk);
    if (rtSpi !== null) filledRtElements.push(rtSpi);

    const rtSumatif =
      filledRtElements.length > 0
        ? Math.round((filledRtElements.reduce((a, b) => a + b, 0) / filledRtElements.length) * 10) / 10
        : null;

    // Jml = Rt Sumatif + STS + SAS (empty components skipped, not zero)
    const sumComponents: number[] = [];
    if (rtSumatif !== null) sumComponents.push(rtSumatif);
    if (typeof rec.sts === 'number' && !isNaN(rec.sts)) sumComponents.push(rec.sts);
    if (typeof rec.sas === 'number' && !isNaN(rec.sas)) sumComponents.push(rec.sas);

    const jml =
      sumComponents.length > 0
        ? Math.round(sumComponents.reduce((a, b) => a + b, 0) * 10) / 10
        : null;

    // Rata-rata Akhir = Jml / count of filled components
    const rataRataAkhir =
      sumComponents.length > 0 && jml !== null
        ? Math.round((jml / sumComponents.length) * 10) / 10
        : null;

    const predikat = calculatePredikat(rataRataAkhir);

    return {
      rtQH,
      rtAk,
      rtAkh,
      rtFk,
      rtSpi,
      rtSumatif,
      jml,
      rataRataAkhir,
      predikat,
    };
  };

  const handleUpdateSumatifCell = (
    siswaId: string,
    path: string, // e.g. "elemen.quranHadis.kognitif", "sts", "sas"
    value: string
  ) => {
    const check = validateScoreInput(value);
    if (!check.isValid) return;

    const existing = getSumatifRecord(siswaId);
    const copy: PenilaianSumatifRecord = JSON.parse(JSON.stringify(existing));

    if (path.startsWith('elemen.')) {
      const parts = path.split('.');
      const elKey = parts[1] as keyof PenilaianSumatifRecord['elemen'];
      const fieldKey = parts[2] as 'kognitif' | 'sikap';
      copy.elemen[elKey][fieldKey] = check.numVal;
    } else if (path === 'sts') {
      copy.sts = check.numVal;
    } else if (path === 'sas') {
      copy.sas = check.numVal;
    }

    copy.updatedAt = new Date().toISOString();

    const nextList = sumatifList.some((s) => s.id === existing.id)
      ? sumatifList.map((s) => (s.id === existing.id ? copy : s))
      : [...sumatifList, copy];

    onUpdateSumatifList(nextList);
  };

  // ==========================================
  // 3. CATATAN SIKAP HANDLERS
  // ==========================================
  const filteredCatatanSikap = useMemo(() => {
    return catatanSikapList.filter((c) => {
      if (c.kelas !== selectedKelas) return false;
      if (filterSikapPredikat !== 'ALL' && c.predikat !== filterSikapPredikat) return false;
      if (filterSikapTglMulai && c.tanggal < filterSikapTglMulai) return false;
      if (filterSikapTglSelesai && c.tanggal > filterSikapTglSelesai) return false;
      if (searchSiswa.trim()) {
        const q = searchSiswa.toLowerCase();
        return c.namaSiswa.toLowerCase().includes(q) || c.kejadian.toLowerCase().includes(q);
      }
      return true;
    });
  }, [
    catatanSikapList,
    selectedKelas,
    filterSikapPredikat,
    filterSikapTglMulai,
    filterSikapTglSelesai,
    searchSiswa,
  ]);

  const handleOpenAddSikap = (preselectedSiswa?: SiswaMaster) => {
    setEditingSikapId(null);
    if (preselectedSiswa) {
      setFormSikapSiswaId(preselectedSiswa.id);
    } else if (classStudents.length > 0) {
      setFormSikapSiswaId(classStudents[0].id);
    } else {
      setFormSikapSiswaId('');
    }
    setFormSikapTanggal(new Date().toISOString().split('T')[0]);
    setFormSikapKejadian('');
    setFormSikapTindakLanjut('');
    setFormSikapPredikat('A');
    setFormSikapKeterangan('');
    setIsAddSikapModalOpen(true);
  };

  const handleOpenEditSikap = (rec: CatatanSikapRecord) => {
    setEditingSikapId(rec.id);
    setFormSikapSiswaId(rec.siswaId);
    setFormSikapTanggal(rec.tanggal);
    setFormSikapKejadian(rec.kejadian);
    setFormSikapTindakLanjut(rec.tindakLanjut);
    setFormSikapPredikat(rec.predikat);
    setFormSikapKeterangan(rec.keterangan);
    setIsAddSikapModalOpen(true);
  };

  const handleSaveSikap = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = siswaList.find((s) => s.id === formSikapSiswaId);
    if (!targetStudent) {
      showValidationError('Pilih siswa yang valid.');
      return;
    }

    if (editingSikapId) {
      // Edit
      const updated = catatanSikapList.map((item) =>
        item.id === editingSikapId
          ? {
              ...item,
              tanggal: formSikapTanggal,
              siswaId: targetStudent.id,
              namaSiswa: targetStudent.nama,
              kelas: targetStudent.kelas,
              fase: targetStudent.fase,
              kejadian: formSikapKejadian,
              tindakLanjut: formSikapTindakLanjut,
              predikat: formSikapPredikat,
              keterangan: formSikapKeterangan,
            }
          : item
      );
      onUpdateCatatanSikapList(updated);
      showToast('Catatan sikap berhasil diperbarui.');
    } else {
      // Add
      const newRec: CatatanSikapRecord = {
        id: `SKP-${Date.now()}`,
        tanggal: formSikapTanggal,
        siswaId: targetStudent.id,
        namaSiswa: targetStudent.nama,
        kelas: targetStudent.kelas,
        fase: targetStudent.fase,
        kejadian: formSikapKejadian,
        tindakLanjut: formSikapTindakLanjut,
        predikat: formSikapPredikat,
        keterangan: formSikapKeterangan,
        createdAt: new Date().toISOString(),
      };
      onUpdateCatatanSikapList([newRec, ...catatanSikapList]);
      showToast('Catatan sikap baru berhasil ditambahkan.');
    }

    setIsAddSikapModalOpen(false);
  };

  const handleDeleteSikap = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan sikap ini?')) {
      onUpdateCatatanSikapList(catatanSikapList.filter((c) => c.id !== id));
      showToast('Catatan sikap telah dihapus.');
    }
  };

  // ==========================================
  // 4. ADD STUDENT HANDLER
  // ==========================================
  const handleAddNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiswaNama.trim()) return;

    const newS: SiswaMaster = {
      id: `SISWA-${selectedKelas}-${Date.now()}`,
      nisn: newSiswaNisn.trim() || `008${Math.floor(1000000 + Math.random() * 9000000)}`,
      nama: newSiswaNama.trim(),
      kelas: selectedKelas,
      fase: selectedFase,
      jenisKelamin: newSiswaGender,
    };

    onUpdateSiswaList([...siswaList, newS]);
    setNewSiswaNama('');
    setNewSiswaNisn('');
    setIsAddSiswaModalOpen(false);
    showToast(`Peserta didik "${newS.nama}" berhasil ditambahkan ke Kelas ${selectedKelas}.`);
  };

  // ==========================================
  // 5. REKAPITULASI CALCULATIONS
  // ==========================================
  const rekapStats = useMemo(() => {
    let assessedCount = 0;
    let incompleteCount = 0;
    const allFinalScores: number[] = [];
    const predikatCounts = { A: 0, B: 0, C: 0, D: 0 };

    classStudents.forEach((s) => {
      const sumatifRec = getSumatifRecord(s.id);
      const computed = computeSumatifRow(sumatifRec);
      if (computed.rataRataAkhir !== null) {
        assessedCount++;
        allFinalScores.push(computed.rataRataAkhir);
        if (computed.predikat in predikatCounts) {
          predikatCounts[computed.predikat as keyof typeof predikatCounts]++;
        }
      } else {
        incompleteCount++;
      }
    });

    const averageClass =
      allFinalScores.length > 0
        ? Math.round((allFinalScores.reduce((a, b) => a + b, 0) / allFinalScores.length) * 10) / 10
        : 0;

    const highestScore = allFinalScores.length > 0 ? Math.max(...allFinalScores) : 0;
    const lowestScore = allFinalScores.length > 0 ? Math.min(...allFinalScores) : 0;
    const tuntasCount = allFinalScores.filter((sc) => sc >= konfigurasiPenilaian.kktp).length;
    const tuntasPct =
      allFinalScores.length > 0 ? Math.round((tuntasCount / allFinalScores.length) * 100) : 0;

    return {
      totalSiswa: classStudents.length,
      assessedCount,
      incompleteCount,
      averageClass,
      highestScore,
      lowestScore,
      tuntasPct,
      predikatCounts,
    };
  }, [classStudents, sumatifList, konfigurasiPenilaian, selectedKelas, selectedSemester, selectedTahun]);

  // ==========================================
  // 6. EXPORT EXCEL HANDLER
  // ==========================================
  const handleExportFullExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Formatif
    const formatifRows = classStudents.map((s, idx) => {
      const rec = getFormatifRecord(s.id);
      const avg = computeFormatifAverage(rec);
      return {
        No: idx + 1,
        NISN: s.nisn,
        Nama: s.nama,
        Kelas: s.kelas,
        Awal: rec.awal ?? '',
        Tengah: rec.tengah ?? '',
        Akhir: rec.akhir ?? '',
        Rata_Rata: avg ?? '',
        Catatan: rec.catatan || '',
      };
    });
    const wsFormatif = XLSX.utils.json_to_sheet(formatifRows);
    XLSX.utils.book_append_sheet(wb, wsFormatif, 'Penilaian_Formatif');

    // Sheet 2: Sumatif
    const sumatifRows = classStudents.map((s, idx) => {
      const rec = getSumatifRecord(s.id);
      const comp = computeSumatifRow(rec);
      return {
        No: idx + 1,
        NISN: s.nisn,
        Nama: s.nama,
        QH_Kog: rec.elemen.quranHadis.kognitif ?? '',
        QH_Skp: rec.elemen.quranHadis.sikap ?? '',
        QH_Rt: comp.rtQH ?? '',
        Ak_Kog: rec.elemen.akidah.kognitif ?? '',
        Ak_Skp: rec.elemen.akidah.sikap ?? '',
        Ak_Rt: comp.rtAk ?? '',
        Akh_Kog: rec.elemen.akhlak.kognitif ?? '',
        Akh_Skp: rec.elemen.akhlak.sikap ?? '',
        Akh_Rt: comp.rtAkh ?? '',
        Fk_Kog: rec.elemen.fikih.kognitif ?? '',
        Fk_Skp: rec.elemen.fikih.sikap ?? '',
        Fk_Rt: comp.rtFk ?? '',
        SPI_Kog: rec.elemen.spi.kognitif ?? '',
        SPI_Skp: rec.elemen.spi.sikap ?? '',
        SPI_Rt: comp.rtSpi ?? '',
        Rt_Sumatif: comp.rtSumatif ?? '',
        STS: rec.sts ?? '',
        SAS: rec.sas ?? '',
        Jml: comp.jml ?? '',
        Rata_Rata_Akhir: comp.rataRataAkhir ?? '',
        Predikat: comp.predikat,
      };
    });
    const wsSumatif = XLSX.utils.json_to_sheet(sumatifRows);
    XLSX.utils.book_append_sheet(wb, wsSumatif, 'Penilaian_Sumatif');

    // Sheet 3: Sikap
    const sikapRows = filteredCatatanSikap.map((c, idx) => ({
      No: idx + 1,
      Tanggal: c.tanggal,
      Nama_Siswa: c.namaSiswa,
      Kelas: c.kelas,
      Kejadian: c.kejadian,
      Tindak_Lanjut: c.tindakLanjut,
      Predikat: c.predikat,
      Keterangan: c.keterangan,
    }));
    const wsSikap = XLSX.utils.json_to_sheet(sikapRows);
    XLSX.utils.book_append_sheet(wb, wsSikap, 'Catatan_Sikap');

    XLSX.writeFile(
      wb,
      `Rekap_Penilaian_AlIslam_Kelas_${selectedKelas}_Sem_${selectedSemester}_${selectedTahun.replace('/', '-')}.xlsx`
    );
    showToast('Seluruh lembar penilaian berhasil diekspor ke Excel!');
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

      {/* Validation Error Alert */}
      {validationError && (
        <div className="fixed top-20 right-6 z-50 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-5">
          <AlertTriangle className="w-5 h-5 text-rose-200" />
          <span className="text-xs font-bold">{validationError}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Award className="w-3.5 h-3.5" />
            Sistem Penilaian Terpadu Al-Islam &amp; Budi Pekerti
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Penilaian Formatif, Sumatif &amp; Sikap Siswa
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Pengelolaan otomatis dan real-time nilai harian, multi-elemen Al-Islam (Al-Qur'an Hadis, Akidah, Akhlak, Fikih, SPI), STS, SAS, dan jurnal karakter.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToDataSiswa && (
            <button
              onClick={onNavigateToDataSiswa}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Users className="w-4 h-4" />
              Kelola &amp; Import Siswa
            </button>
          )}
          <button
            onClick={() => setIsAddSiswaModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-xs transition"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            + Tambah Siswa
          </button>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-xs transition"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            Konfigurasi Predikat
          </button>
          <button
            onClick={handleExportFullExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* FILTER BAR SECTION */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filter &amp; Pengelolaan Kelas
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Guru: {profilSekolah.guruMataPelajaran}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
          {/* Tahun Ajaran */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Tahun Ajaran</label>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
            >
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as Semester)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
            >
              <option value="1">1 (Ganjil)</option>
              <option value="2">2 (Genap)</option>
            </select>
          </div>

          {/* Fase */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Fase</label>
            <select
              value={selectedFase}
              onChange={(e) => handleFaseChange(e.target.value as Fase)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold bg-emerald-50/50 text-emerald-950"
            >
              <option value="D">Fase D (SMP/MTs)</option>
              <option value="E">Fase E (Kelas X)</option>
              <option value="F">Fase F (Kelas XI, XII)</option>
            </select>
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value as Kelas)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-extrabold text-slate-900"
            >
              {selectedFase === 'D' && (
                <>
                  <option value="VII">Kelas VII</option>
                  <option value="VIII">Kelas VIII</option>
                  <option value="IX">Kelas IX</option>
                </>
              )}
              {selectedFase === 'E' && <option value="X">Kelas X</option>}
              {selectedFase === 'F' && (
                <>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </>
              )}
            </select>
          </div>

          {/* Search Siswa */}
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Cari Nama Siswa / NISN</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ketik nama siswa..."
                value={searchSiswa}
                onChange={(e) => setSearchSiswa(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABS SWITCHER */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('formatif')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'formatif'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          A. Penilaian Formatif
        </button>
        <button
          onClick={() => setActiveTab('sumatif')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'sumatif'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          B. Penilaian Sumatif (Header Bertingkat)
        </button>
        <button
          onClick={() => setActiveTab('sikap')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'sikap'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          C. Penilaian Sikap / Catatan Guru
        </button>
        <button
          onClick={() => setActiveTab('rekap')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'rekap'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          D. Rekapitulasi Hasil Belajar
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUBMODUL A: PENILAIAN FORMATIF */}
      {/* ======================================================== */}
      {activeTab === 'formatif' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tabel Penilaian Formatif — Kelas {selectedKelas} (Semester {selectedSemester})
              </h3>
              <p className="text-xs text-slate-500">
                Nilai Awal, Tengah, dan Akhir dihitung rata-rata otomatis (hanya komponen terisi yang dihitung). Sel kuning dapat diedit langsung.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-[#FFF8DB] border border-amber-300 rounded inline-block" />
                <span className="text-slate-600">Input Guru</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-[#E5F5E9] border border-emerald-300 rounded inline-block" />
                <span className="text-slate-600">Hasil Otomatis</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="px-3 py-3 text-center w-12 sticky left-0 bg-slate-900 z-10">No</th>
                  <th className="px-4 py-3 sticky left-12 bg-slate-900 z-10 w-64">Nama Peserta Didik</th>
                  <th className="px-3 py-3 text-center w-28 bg-slate-800">Awal</th>
                  <th className="px-3 py-3 text-center w-28 bg-slate-800">Tengah</th>
                  <th className="px-3 py-3 text-center w-28 bg-slate-800">Akhir</th>
                  <th className="px-3 py-3 text-center w-32 bg-emerald-950 text-emerald-200">Rata-rata</th>
                  <th className="px-4 py-3">Catatan Perkembangan Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-sans">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada siswa terdaftar di Kelas {selectedKelas}. Klik tombol "+ Tambah Siswa" di atas.
                    </td>
                  </tr>
                ) : (
                  classStudents.map((s, idx) => {
                    const rec = getFormatifRecord(s.id);
                    const avg = computeFormatifAverage(rec);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2 text-center font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2 font-bold text-slate-900 sticky left-12 bg-white z-10 border-r border-slate-100 whitespace-nowrap">
                          {s.nama}
                          <span className="block text-[10px] font-mono font-normal text-slate-400">{s.nisn}</span>
                        </td>

                        {/* Input Awal */}
                        <td className="p-1 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={rec.awal !== null && rec.awal !== undefined ? rec.awal : ''}
                            onChange={(e) => handleUpdateFormatifCell(s.id, 'awal', e.target.value)}
                            placeholder="-"
                            className="w-full py-1.5 px-2 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </td>

                        {/* Input Tengah */}
                        <td className="p-1 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={rec.tengah !== null && rec.tengah !== undefined ? rec.tengah : ''}
                            onChange={(e) => handleUpdateFormatifCell(s.id, 'tengah', e.target.value)}
                            placeholder="-"
                            className="w-full py-1.5 px-2 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </td>

                        {/* Input Akhir */}
                        <td className="p-1 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={rec.akhir !== null && rec.akhir !== undefined ? rec.akhir : ''}
                            onChange={(e) => handleUpdateFormatifCell(s.id, 'akhir', e.target.value)}
                            placeholder="-"
                            className="w-full py-1.5 px-2 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </td>

                        {/* Rata-Rata Otomatis (Read-Only) */}
                        <td className="p-1 text-center">
                          <div className="w-full py-1.5 px-2 text-center font-mono font-black text-xs bg-[#E5F5E9] border border-emerald-300 text-emerald-950 rounded-lg select-none">
                            {formatNum(avg)}
                          </div>
                        </td>

                        {/* Catatan Guru */}
                        <td className="p-1">
                          <input
                            type="text"
                            value={rec.catatan || ''}
                            onChange={(e) => handleUpdateFormatifCell(s.id, 'catatan', e.target.value)}
                            placeholder="Tulis catatan perkembangan belajar..."
                            className="w-full py-1.5 px-3 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-700"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBMODUL B: PENILAIAN SUMATIF (MULTI-LEVEL HEADER) */}
      {/* ======================================================== */}
      {activeTab === 'sumatif' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tabel Penilaian Sumatif Multi-Elemen Al-Islam — Kelas {selectedKelas}
              </h3>
              <p className="text-xs text-slate-500">
                Header bertingkat 5 Elemen (Kognitif, Sikap, Rt). Rt Sumatif, Jml, Rata-rata &amp; Predikat dihitung real-time.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-[#FFF8DB] border border-amber-300 rounded inline-block" />
                <span className="text-slate-600">Sel Input Guru</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-[#E5F5E9] border border-emerald-300 rounded inline-block" />
                <span className="text-slate-600">Kalkulasi Otomatis (Terkunci)</span>
              </span>
            </div>
          </div>

          {/* Table Container with Horizontal and Vertical Scrolling */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[650px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* Multi-Level Sticky Header */}
              <thead className="sticky top-0 z-20 bg-slate-900 text-white font-bold select-none shadow-sm">
                {/* Header Row 1 */}
                <tr className="border-b border-slate-700">
                  <th rowSpan={2} className="px-3 py-2 text-center w-12 sticky left-0 bg-slate-900 z-30 border-r border-slate-700">
                    No
                  </th>
                  <th rowSpan={2} className="px-4 py-2 w-64 sticky left-12 bg-slate-900 z-30 border-r border-slate-700 whitespace-nowrap">
                    Nama Peserta Didik
                  </th>

                  {/* 5 Elemen Al-Islam Colspan 3 Each */}
                  <th colSpan={3} className="px-2 py-1.5 text-center bg-emerald-950 border-r border-slate-700">
                    Al-Qur'an Hadis
                  </th>
                  <th colSpan={3} className="px-2 py-1.5 text-center bg-teal-950 border-r border-slate-700">
                    Akidah
                  </th>
                  <th colSpan={3} className="px-2 py-1.5 text-center bg-blue-950 border-r border-slate-700">
                    Akhlak
                  </th>
                  <th colSpan={3} className="px-2 py-1.5 text-center bg-indigo-950 border-r border-slate-700">
                    Fikih
                  </th>
                  <th colSpan={3} className="px-2 py-1.5 text-center bg-purple-950 border-r border-slate-700">
                    Sejarah Peradaban Islam
                  </th>

                  {/* Rekapitulasi Rowspan 2 */}
                  <th rowSpan={2} className="px-2 py-2 text-center w-24 bg-slate-800 text-emerald-300 border-r border-slate-700">
                    Rt Sumatif
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center w-20 bg-slate-800 border-r border-slate-700">
                    STS
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center w-20 bg-slate-800 border-r border-slate-700">
                    SAS
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center w-20 bg-slate-800 border-r border-slate-700">
                    Jml
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center w-24 bg-emerald-900 text-emerald-200 border-r border-slate-700">
                    Rata-rata
                  </th>
                  <th rowSpan={2} className="px-2 py-2 text-center w-16 bg-slate-900 text-amber-300">
                    Predikat
                  </th>
                </tr>

                {/* Header Row 2 (Subheaders) */}
                <tr className="bg-slate-800 text-[11px] border-b border-slate-700 text-center">
                  {/* QH */}
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-slate-300">Kog</th>
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-slate-300">Skp</th>
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-emerald-400 bg-slate-900/60 font-black">Rt</th>

                  {/* Akidah */}
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-slate-300">Kog</th>
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-slate-300">Skp</th>
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-emerald-400 bg-slate-900/60 font-black">Rt</th>

                  {/* Akhlak */}
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-slate-300">Kog</th>
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-slate-300">Skp</th>
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-emerald-400 bg-slate-900/60 font-black">Rt</th>

                  {/* Fikih */}
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-slate-300">Kog</th>
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-slate-300">Skp</th>
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-emerald-400 bg-slate-900/60 font-black">Rt</th>

                  {/* SPI */}
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-slate-300">Kog</th>
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-slate-300">Skp</th>
                  <th className="px-1.5 py-1 w-16 border-r border-slate-700 text-emerald-400 bg-slate-900/60 font-black">Rt</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 bg-white">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={24} className="py-8 text-center text-slate-400">
                      Belum ada siswa terdaftar.
                    </td>
                  </tr>
                ) : (
                  classStudents.map((s, idx) => {
                    const rec = getSumatifRecord(s.id);
                    const comp = computeSumatifRow(rec);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        {/* No - Sticky */}
                        <td className="px-2 py-1.5 text-center font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        {/* Nama - Sticky */}
                        <td className="px-3 py-1.5 font-bold text-slate-900 sticky left-12 bg-white z-10 border-r border-slate-200 whitespace-nowrap">
                          {s.nama}
                        </td>

                        {/* 1. Al-Qur'an Hadis */}
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.elemen.quranHadis.kognitif ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'elemen.quranHadis.kognitif', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.elemen.quranHadis.sikap ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'elemen.quranHadis.sikap', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-0.5">
                          <div className="w-full py-1 text-center font-mono font-black text-xs bg-[#E5F5E9] border border-emerald-300 text-emerald-900 rounded">
                            {formatNum(comp.rtQH)}
                          </div>
                        </td>

                        {/* 2. Akidah */}
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.elemen.akidah.kognitif ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'elemen.akidah.kognitif', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.elemen.akidah.sikap ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'elemen.akidah.sikap', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-0.5">
                          <div className="w-full py-1 text-center font-mono font-black text-xs bg-[#E5F5E9] border border-emerald-300 text-emerald-900 rounded">
                            {formatNum(comp.rtAk)}
                          </div>
                        </td>

                        {/* 3. Akhlak */}
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.elemen.akhlak.kognitif ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'elemen.akhlak.kognitif', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.elemen.akhlak.sikap ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'elemen.akhlak.sikap', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-0.5">
                          <div className="w-full py-1 text-center font-mono font-black text-xs bg-[#E5F5E9] border border-emerald-300 text-emerald-900 rounded">
                            {formatNum(comp.rtAkh)}
                          </div>
                        </td>

                        {/* 4. Fikih */}
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.elemen.fikih.kognitif ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'elemen.fikih.kognitif', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.elemen.fikih.sikap ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'elemen.fikih.sikap', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-0.5">
                          <div className="w-full py-1 text-center font-mono font-black text-xs bg-[#E5F5E9] border border-emerald-300 text-emerald-900 rounded">
                            {formatNum(comp.rtFk)}
                          </div>
                        </td>

                        {/* 5. SPI */}
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.elemen.spi.kognitif ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'elemen.spi.kognitif', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.elemen.spi.sikap ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'elemen.spi.sikap', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-0.5">
                          <div className="w-full py-1 text-center font-mono font-black text-xs bg-[#E5F5E9] border border-emerald-300 text-emerald-900 rounded">
                            {formatNum(comp.rtSpi)}
                          </div>
                        </td>

                        {/* Rt Sumatif */}
                        <td className="p-0.5 border-l border-slate-200">
                          <div className="w-full py-1 text-center font-mono font-black text-xs bg-[#E5F5E9] border border-emerald-300 text-emerald-950 rounded">
                            {formatNum(comp.rtSumatif)}
                          </div>
                        </td>

                        {/* STS */}
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.sts ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'sts', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>

                        {/* SAS */}
                        <td className="p-0.5">
                          <input
                            type="text"
                            value={rec.sas ?? ''}
                            onChange={(e) => handleUpdateSumatifCell(s.id, 'sas', e.target.value)}
                            placeholder="-"
                            className="w-full py-1 text-center font-mono font-bold text-xs bg-[#FFF8DB] border border-amber-200 rounded focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Jml */}
                        <td className="p-0.5">
                          <div className="w-full py-1 text-center font-mono font-bold text-xs bg-[#E5F5E9] border border-emerald-300 text-slate-800 rounded">
                            {formatNum(comp.jml)}
                          </div>
                        </td>

                        {/* Rata-rata Akhir */}
                        <td className="p-0.5">
                          <div className="w-full py-1 text-center font-mono font-black text-xs bg-[#E5F5E9] border border-emerald-400 text-emerald-900 rounded">
                            {formatNum(comp.rataRataAkhir)}
                          </div>
                        </td>

                        {/* Predikat */}
                        <td className="px-1 py-1 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-black ${
                              comp.predikat === 'A'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : comp.predikat === 'B'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : comp.predikat === 'C'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : comp.predikat === 'D'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {comp.predikat}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBMODUL C: PENILAIAN SIKAP / CATATAN GURU */}
      {/* ======================================================== */}
      {activeTab === 'sikap' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Jurnal Sikap &amp; Catatan Perkembangan Karakter Siswa
              </h3>
              <p className="text-xs text-slate-500">
                Mendokumentasikan kejadian perilaku, tindak lanjut pembinaan, dan predikat sikap secara berkesinambungan
              </p>
            </div>

            <button
              onClick={() => handleOpenAddSikap()}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Catat Sikap Baru
            </button>
          </div>

          {/* Sikap Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Filter Predikat</label>
              <select
                value={filterSikapPredikat}
                onChange={(e) => setFilterSikapPredikat(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="ALL">Semua Predikat (A, B, C, D)</option>
                <option value="A">Predikat A (Sangat Baik)</option>
                <option value="B">Predikat B (Baik)</option>
                <option value="C">Predikat C (Cukup)</option>
                <option value="D">Predikat D (Perlu Pembinaan)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={filterSikapTglMulai}
                onChange={(e) => setFilterSikapTglMulai(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={filterSikapTglSelesai}
                onChange={(e) => setFilterSikapTglSelesai(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterSikapPredikat('ALL');
                  setFilterSikapTglMulai('');
                  setFilterSikapTglSelesai('');
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filter
              </button>
            </div>
          </div>

          {/* Sikap Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="px-3 py-3 text-center w-12">No</th>
                  <th className="px-3 py-3 text-center w-28">Hari/Tgl</th>
                  <th className="px-4 py-3 w-48">Nama Siswa</th>
                  <th className="px-2 py-3 text-center w-16">Kelas</th>
                  <th className="px-4 py-3">Kejadian / Uraian Perilaku</th>
                  <th className="px-4 py-3">Tindak Lanjut Guru</th>
                  <th className="px-3 py-3 text-center w-20">Predikat</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-3 py-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCatatanSikap.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Belum ada catatan sikap untuk kriteria filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredCatatanSikap.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-3 text-center font-bold text-slate-700">{idx + 1}</td>
                      <td className="px-3 py-3 text-center font-mono text-slate-600 whitespace-nowrap">
                        {item.tanggal}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <button
                          onClick={() => {
                            const found = siswaList.find((s) => s.id === item.siswaId);
                            if (found) setIsStudentTimelineOpen(found);
                          }}
                          className="hover:text-emerald-600 text-left transition underline decoration-dotted"
                          title="Lihat riwayat siswa ini"
                        >
                          {item.namaSiswa}
                        </button>
                      </td>
                      <td className="px-2 py-3 text-center font-semibold text-slate-700">{item.kelas}</td>
                      <td className="px-4 py-3 text-slate-800 leading-relaxed font-medium">{item.kejadian}</td>
                      <td className="px-4 py-3 text-slate-700 leading-relaxed">{item.tindakLanjut}</td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            item.predikat === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.predikat === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : item.predikat === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.predikat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px]">{item.keterangan || '-'}</td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditSikap(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSikap(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBMODUL D: REKAPITULASI HASIL BELAJAR SISWA */}
      {/* ======================================================== */}
      {activeTab === 'rekap' && (
        <div className="space-y-6">
          {/* Top Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Siswa
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">{rekapStats.totalSiswa}</p>
              <span className="text-[10px] text-slate-500">Kelas {selectedKelas}</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tuntas Dinilai
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{rekapStats.assessedCount}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {rekapStats.totalSiswa - rekapStats.assessedCount} Belum Lengkap
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Rata-Rata Kelas
              </span>
              <p className="text-2xl font-black text-blue-700 mt-1">{rekapStats.averageClass}</p>
              <span className="text-[10px] text-slate-500">Target KKTP: {konfigurasiPenilaian.kktp}</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nilai Tertinggi
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{rekapStats.highestScore}</p>
              <span className="text-[10px] text-slate-500">Skor maksimum</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nilai Terendah
              </span>
              <p className="text-2xl font-black text-rose-700 mt-1">{rekapStats.lowestScore}</p>
              <span className="text-[10px] text-rose-600 font-semibold">Perlu remedial</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Distribusi Predikat Kelas
              </span>
              <div className="grid grid-cols-4 gap-1.5 mt-2 text-center text-xs font-mono font-bold">
                <span className="bg-emerald-100 text-emerald-800 p-1.5 rounded">
                  A: {rekapStats.predikatCounts.A}
                </span>
                <span className="bg-blue-100 text-blue-800 p-1.5 rounded">
                  B: {rekapStats.predikatCounts.B}
                </span>
                <span className="bg-amber-100 text-amber-800 p-1.5 rounded">
                  C: {rekapStats.predikatCounts.C}
                </span>
                <span className="bg-rose-100 text-rose-800 p-1.5 rounded">
                  D: {rekapStats.predikatCounts.D}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Rekapitulasi Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Tabel Rekapitulasi Nilai Akhir Siswa — Kelas {selectedKelas}
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Ketuntasan: {rekapStats.tuntasPct}%
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-12">No</th>
                    <th className="px-3 py-2.5 w-32">NISN</th>
                    <th className="px-4 py-2.5">Nama Peserta Didik</th>
                    <th className="px-3 py-2.5 text-center">Rt Formatif</th>
                    <th className="px-3 py-2.5 text-center">Rt Sumatif Elemen</th>
                    <th className="px-3 py-2.5 text-center">STS</th>
                    <th className="px-3 py-2.5 text-center">SAS</th>
                    <th className="px-3 py-2.5 text-center bg-emerald-950 text-emerald-200">Nilai Akhir</th>
                    <th className="px-3 py-2.5 text-center">Predikat</th>
                    <th className="px-3 py-2.5 text-center">Ketuntasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {classStudents.map((s, idx) => {
                    const fRec = getFormatifRecord(s.id);
                    const fAvg = computeFormatifAverage(fRec);
                    const sRec = getSumatifRecord(s.id);
                    const sComp = computeSumatifRow(sRec);
                    const isTuntas =
                      sComp.rataRataAkhir !== null && sComp.rataRataAkhir >= konfigurasiPenilaian.kktp;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5 text-center font-bold text-slate-700">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-500">{s.nisn}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{s.nama}</td>
                        <td className="px-3 py-2.5 text-center font-mono">{formatNum(fAvg)}</td>
                        <td className="px-3 py-2.5 text-center font-mono">{formatNum(sComp.rtSumatif)}</td>
                        <td className="px-3 py-2.5 text-center font-mono">{sRec.sts ?? '-'}</td>
                        <td className="px-3 py-2.5 text-center font-mono">{sRec.sas ?? '-'}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-black text-emerald-900 bg-emerald-50">
                          {formatNum(sComp.rataRataAkhir)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                              sComp.predikat === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sComp.predikat === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : sComp.predikat === 'C'
                                ? 'bg-amber-100 text-amber-800'
                                : sComp.predikat === 'D'
                                ? 'bg-rose-100 text-rose-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {sComp.predikat}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {sComp.rataRataAkhir !== null ? (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isTuntas
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isTuntas ? 'Tuntas' : 'Remedial'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Belum Lengkap</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: KONFIGURASI PREDIKAT & PENGATURAN PENILAIAN */}
      {/* ======================================================== */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                Konfigurasi Standar Predikat &amp; KKTP
              </h3>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Validate non-overlapping
                if (
                  konfigurasiPenilaian.batasPredikatA <= konfigurasiPenilaian.batasPredikatB ||
                  konfigurasiPenilaian.batasPredikatB <= konfigurasiPenilaian.batasPredikatC ||
                  konfigurasiPenilaian.batasPredikatC <= konfigurasiPenilaian.batasPredikatD
                ) {
                  showValidationError('Batas predikat tidak boleh tumpang tindih (harus A > B > C > D).');
                  return;
                }
                onUpdateKonfigurasi({ ...konfigurasiPenilaian });
                setIsConfigModalOpen(false);
                showToast('Konfigurasi predikat berhasil disimpan permanen.');
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batas Minimum Predikat A</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={konfigurasiPenilaian.batasPredikatA}
                    onChange={(e) =>
                      onUpdateKonfigurasi({
                        ...konfigurasiPenilaian,
                        batasPredikatA: parseInt(e.target.value, 10) || 90,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-center"
                  />
                  <span className="text-[10px] text-slate-400">Default &gt;= 90</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batas Minimum Predikat B</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={konfigurasiPenilaian.batasPredikatB}
                    onChange={(e) =>
                      onUpdateKonfigurasi({
                        ...konfigurasiPenilaian,
                        batasPredikatB: parseInt(e.target.value, 10) || 80,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-center"
                  />
                  <span className="text-[10px] text-slate-400">Default &gt;= 80</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batas Minimum Predikat C</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={konfigurasiPenilaian.batasPredikatC}
                    onChange={(e) =>
                      onUpdateKonfigurasi({
                        ...konfigurasiPenilaian,
                        batasPredikatC: parseInt(e.target.value, 10) || 70,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-center"
                  />
                  <span className="text-[10px] text-slate-400">Default &gt;= 70</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batas Predikat D (Kurang)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={konfigurasiPenilaian.batasPredikatD}
                    onChange={(e) =>
                      onUpdateKonfigurasi({
                        ...konfigurasiPenilaian,
                        batasPredikatD: parseInt(e.target.value, 10) || 60,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-center"
                  />
                  <span className="text-[10px] text-slate-400">Di bawah batas C</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">KKTP Satuan Pendidikan</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    required
                    value={konfigurasiPenilaian.kktp}
                    onChange={(e) =>
                      onUpdateKonfigurasi({
                        ...konfigurasiPenilaian,
                        kktp: parseInt(e.target.value, 10) || 75,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Angka Desimal</label>
                  <select
                    value={konfigurasiPenilaian.jumlahDesimal}
                    onChange={(e) =>
                      onUpdateKonfigurasi({
                        ...konfigurasiPenilaian,
                        jumlahDesimal: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="1">1 Angka Desimal (Contoh: 85.0)</option>
                    <option value="2">2 Angka Desimal (Contoh: 85.25)</option>
                    <option value="0">Bulat Tanpa Desimal (Contoh: 85)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: INPUT CATATAN SIKAP */}
      {/* ======================================================== */}
      {isAddSikapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingSikapId ? 'Edit Catatan Sikap Siswa' : 'Tambah Catatan Sikap Baru'}
              </h3>
              <button
                onClick={() => setIsAddSikapModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSikap} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kejadian</label>
                  <input
                    type="date"
                    required
                    value={formSikapTanggal}
                    onChange={(e) => setFormSikapTanggal(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas Terpilih</label>
                  <input
                    type="text"
                    disabled
                    value={`Kelas ${selectedKelas} (Otomatis)`}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Nama Peserta Didik</label>
                <select
                  required
                  value={formSikapSiswaId}
                  onChange={(e) => setFormSikapSiswaId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="">-- Pilih Siswa dari Database --</option>
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kejadian / Uraian Perilaku</label>
                <textarea
                  required
                  rows={3}
                  value={formSikapKejadian}
                  onChange={(e) => setFormSikapKejadian(e.target.value)}
                  placeholder="Contoh: Membuang sampah pada tempatnya dan memungut plastik yang berserakan di depan mushola."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tindak Lanjut Guru</label>
                <textarea
                  required
                  rows={2}
                  value={formSikapTindakLanjut}
                  onChange={(e) => setFormSikapTindakLanjut(e.target.value)}
                  placeholder="Contoh: Diapresiasi di depan kelas dan diberikan penguatan positif."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Predikat Sikap</label>
                  <select
                    value={formSikapPredikat}
                    onChange={(e) => setFormSikapPredikat(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="A">A - Sangat Baik</option>
                    <option value="B">B - Baik</option>
                    <option value="C">C - Cukup</option>
                    <option value="D">D - Perlu Pembinaan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
                  <input
                    type="text"
                    value={formSikapKeterangan}
                    onChange={(e) => setFormSikapKeterangan(e.target.value)}
                    placeholder="Contoh: Kepedulian lingkungan"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSikapModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Simpan Catatan Sikap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: TAMBAH SISWA KE KELAS */}
      {/* ======================================================== */}
      {isAddSiswaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Tambah Siswa ke Kelas {selectedKelas}
              </h3>
              <button
                onClick={() => setIsAddSiswaModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={newSiswaNama}
                  onChange={(e) => setNewSiswaNama(e.target.value)}
                  placeholder="Contoh: Muhammad Raihan Pratama"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN</label>
                  <input
                    type="text"
                    value={newSiswaNisn}
                    onChange={(e) => setNewSiswaNisn(e.target.value)}
                    placeholder="Contoh: 0081234567"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={newSiswaGender}
                    onChange={(e) => setNewSiswaGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <p><strong>Fase &amp; Kelas:</strong> Fase {selectedFase} • Kelas {selectedKelas}</p>
                <p>Siswa baru akan langsung muncul di daftar Formatif, Sumatif, dan Jurnal Sikap.</p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSiswaModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: RIWAYAT / TIMELINE SIKAP SISWA */}
      {/* ======================================================== */}
      {isStudentTimelineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{isStudentTimelineOpen.nama}</h3>
                <p className="text-xs text-slate-500">
                  NISN: {isStudentTimelineOpen.nisn} • Kelas: {isStudentTimelineOpen.kelas}
                </p>
              </div>
              <button
                onClick={() => setIsStudentTimelineOpen(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {catatanSikapList.filter((c) => c.siswaId === isStudentTimelineOpen.id).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Belum ada catatan sikap khusus untuk siswa ini.
                </p>
              ) : (
                catatanSikapList
                  .filter((c) => c.siswaId === isStudentTimelineOpen.id)
                  .map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-500 font-bold">{c.tanggal}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            c.predikat === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.predikat === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : c.predikat === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          Predikat: {c.predikat}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{c.kejadian}</p>
                      <p className="text-slate-600"><strong>Tindak Lanjut:</strong> {c.tindakLanjut}</p>
                      {c.keterangan && (
                        <p className="text-[11px] text-slate-400 italic">Ket: {c.keterangan}</p>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => {
                  const s = isStudentTimelineOpen;
                  setIsStudentTimelineOpen(null);
                  handleOpenAddSikap(s);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Catatan Siswa Ini
              </button>
              <button
                onClick={() => setIsStudentTimelineOpen(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
