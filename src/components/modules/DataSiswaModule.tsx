import React, { useState, useMemo, useRef } from 'react';
import {
  SiswaMaster,
  Kelas,
  Fase,
  PenilaianFormatifRecord,
  PenilaianSumatifRecord,
  CatatanSikapRecord,
  ProfilSekolah,
} from '../../types/curriculum';
import {
  Users,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  GraduationCap,
  X,
  HelpCircle,
  Check,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';

interface Props {
  siswaList: SiswaMaster[];
  onUpdateSiswaList: (list: SiswaMaster[]) => void;
  profilSekolah: ProfilSekolah;
  onNavigateToGrading?: (targetKelas?: Kelas) => void;
  formatifList?: PenilaianFormatifRecord[];
  sumatifList?: PenilaianSumatifRecord[];
  catatanSikapList?: CatatanSikapRecord[];
}

interface ParsedStudentRow {
  raw: any;
  nisn: string;
  nama: string;
  kelas: Kelas;
  fase: Fase;
  jenisKelamin: 'L' | 'P';
  isValid: boolean;
  errors: string[];
  isDuplicateInDB: boolean;
  isDuplicateInFile: boolean;
}

// Helpers
export const deduceFaseFromKelas = (kelas: Kelas): Fase => {
  if (kelas === 'VII' || kelas === 'VIII' || kelas === 'IX') return 'D';
  if (kelas === 'X') return 'E';
  return 'F'; // XI, XII
};

export const normalizeKelas = (val: any): Kelas | null => {
  if (!val) return null;
  const str = String(val).toUpperCase().trim();
  if (str === 'VII' || str === '7' || str.includes('7') || str.includes('VII')) return 'VII';
  if (str === 'VIII' || str === '8' || str.includes('8') || str.includes('VIII')) return 'VIII';
  if (str === 'IX' || str === '9' || str.includes('9') || str.includes('IX')) return 'IX';
  if (str === 'X' || str === '10' || str.startsWith('X') || str.includes('10')) return 'X';
  if (str === 'XI' || str === '11' || str.startsWith('XI') || str.includes('11')) return 'XI';
  if (str === 'XII' || str === '12' || str.startsWith('XII') || str.includes('12')) return 'XII';
  return null;
};

export const normalizeGender = (val: any): 'L' | 'P' => {
  if (!val) return 'L';
  const str = String(val).toUpperCase().trim();
  if (str.startsWith('P') || str.includes('WANITA') || str.includes('PEREMPUAN') || str === 'F') {
    return 'P';
  }
  return 'L';
};

export const DataSiswaModule: React.FC<Props> = ({
  siswaList,
  onUpdateSiswaList,
  profilSekolah,
  onNavigateToGrading,
  formatifList = [],
  sumatifList = [],
  catatanSikapList = [],
}) => {
  // Filters & Search
  const [filterKelas, setFilterKelas] = useState<string>('ALL');
  const [filterFase, setFilterFase] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<SiswaMaster | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Manual Form State
  const [formNisn, setFormNisn] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKelas, setFormKelas] = useState<Kelas>('X');
  const [formFase, setFormFase] = useState<Fase>('E');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formError, setFormError] = useState('');

  // Import Wizard State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [importError, setImportError] = useState<string>('');
  const [importSuccessCount, setImportSuccessCount] = useState<number>(0);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync Fase with Kelas in Form
  const handleKelasChange = (k: Kelas) => {
    setFormKelas(k);
    setFormFase(deduceFaseFromKelas(k));
  };

  // Filtered student list
  const filteredSiswa = useMemo(() => {
    return siswaList.filter((s) => {
      if (filterKelas !== 'ALL' && s.kelas !== filterKelas) return false;
      if (filterFase !== 'ALL' && s.fase !== filterFase) return false;
      if (filterGender !== 'ALL' && s.jenisKelamin !== filterGender) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchNama = s.nama.toLowerCase().includes(q);
        const matchNisn = s.nisn.toLowerCase().includes(q);
        if (!matchNama && !matchNisn) return false;
      }
      return true;
    });
  }, [siswaList, filterKelas, filterFase, filterGender, searchTerm]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = siswaList.length;
    const lCount = siswaList.filter((s) => s.jenisKelamin === 'L').length;
    const pCount = siswaList.filter((s) => s.jenisKelamin === 'P').length;
    const faseDCount = siswaList.filter((s) => s.fase === 'D').length;
    const faseECount = siswaList.filter((s) => s.fase === 'E').length;
    const faseFCount = siswaList.filter((s) => s.fase === 'F').length;

    const kelasCounts: Record<Kelas, number> = {
      VII: siswaList.filter((s) => s.kelas === 'VII').length,
      VIII: siswaList.filter((s) => s.kelas === 'VIII').length,
      IX: siswaList.filter((s) => s.kelas === 'IX').length,
      X: siswaList.filter((s) => s.kelas === 'X').length,
      XI: siswaList.filter((s) => s.kelas === 'XI').length,
      XII: siswaList.filter((s) => s.kelas === 'XII').length,
    };

    return { total, lCount, pCount, faseDCount, faseECount, faseFCount, kelasCounts };
  }, [siswaList]);

  // Handle select all checkbox
  const isAllSelected = filteredSiswa.length > 0 && selectedIds.length === filteredSiswa.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSiswa.map((s) => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Modal Add
  const handleOpenAddModal = () => {
    setEditingSiswa(null);
    setFormNisn('');
    setFormNama('');
    const defaultKelas: Kelas = (filterKelas !== 'ALL' ? (filterKelas as Kelas) : 'X');
    setFormKelas(defaultKelas);
    setFormFase(deduceFaseFromKelas(defaultKelas));
    setFormGender('L');
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEditModal = (siswa: SiswaMaster) => {
    setEditingSiswa(siswa);
    setFormNisn(siswa.nisn);
    setFormNama(siswa.nama);
    setFormKelas(siswa.kelas);
    setFormFase(siswa.fase);
    setFormGender(siswa.jenisKelamin);
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Save manual add/edit
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanNama = formNama.trim();
    const cleanNisn = formNisn.trim();

    if (!cleanNama) {
      setFormError('Nama lengkap siswa wajib diisi.');
      return;
    }

    if (!cleanNisn) {
      setFormError('NISN / Nomor Induk siswa wajib diisi.');
      return;
    }

    // Check duplicate NISN (except current editing)
    const duplicateNisn = siswaList.find(
      (s) => s.nisn === cleanNisn && (!editingSiswa || s.id !== editingSiswa.id)
    );
    if (duplicateNisn) {
      setFormError(`NISN "${cleanNisn}" sudah digunakan oleh siswa ${duplicateNisn.nama} (Kelas ${duplicateNisn.kelas}).`);
      return;
    }

    if (editingSiswa) {
      const updatedList = siswaList.map((s) =>
        s.id === editingSiswa.id
          ? {
              ...s,
              nisn: cleanNisn,
              nama: cleanNama,
              kelas: formKelas,
              fase: formFase,
              jenisKelamin: formGender,
            }
          : s
      );
      onUpdateSiswaList(updatedList);
      showToast(`Data siswa "${cleanNama}" berhasil diperbarui.`, 'success');
    } else {
      const newSiswa: SiswaMaster = {
        id: `SISWA-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        nisn: cleanNisn,
        nama: cleanNama,
        kelas: formKelas,
        fase: formFase,
        jenisKelamin: formGender,
      };
      onUpdateSiswaList([...siswaList, newSiswa]);
      showToast(`Siswa baru "${cleanNama}" berhasil ditambahkan.`, 'success');
    }

    setIsAddModalOpen(false);
  };

  // Delete student
  const handleDeleteStudent = (id: string) => {
    const target = siswaList.find((s) => s.id === id);
    const updated = siswaList.filter((s) => s.id !== id);
    onUpdateSiswaList(updated);
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    setDeleteConfirmId(null);
    showToast(`Siswa "${target?.nama || id}" telah dihapus.`, 'info');
  };

  // Bulk delete
  const handleBulkDelete = () => {
    const updated = siswaList.filter((s) => !selectedIds.includes(s.id));
    const count = selectedIds.length;
    onUpdateSiswaList(updated);
    setSelectedIds([]);
    setIsBulkDeleteConfirmOpen(false);
    showToast(`${count} siswa terpilih berhasil dihapus dari data roster.`, 'info');
  };

  // ==========================================
  // FITUR TEMPLATE DOWNLOAD EXCEL & CSV
  // ==========================================
  const handleDownloadExcelTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: DATA_SISWA
    const sampleData = [
      {
        'No': 1,
        'NISN': '0081234501',
        'Nama Lengkap': 'Ahmad Fauzan Pratama',
        'Kelas': 'X',
        'Jenis Kelamin': 'L',
      },
      {
        'No': 2,
        'NISN': '0081234502',
        'Nama Lengkap': 'Aisyah Rahmadani',
        'Kelas': 'X',
        'Jenis Kelamin': 'P',
      },
      {
        'No': 3,
        'NISN': '0081234503',
        'Nama Lengkap': 'Bilal Habibi Ramadhan',
        'Kelas': 'X',
        'Jenis Kelamin': 'L',
      },
      {
        'No': 4,
        'NISN': '0071234601',
        'Nama Lengkap': 'Muhammad Azzam Izzuddin',
        'Kelas': 'XI',
        'Jenis Kelamin': 'L',
      },
      {
        'No': 5,
        'NISN': '0061234702',
        'Nama Lengkap': 'Siti Maryam Shalihah',
        'Kelas': 'XII',
        'Jenis Kelamin': 'P',
      },
    ];

    const wsData = XLSX.utils.json_to_sheet(sampleData);
    // Col widths
    wsData['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 32 },
      { wch: 10 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, wsData, 'DATA_SISWA');

    // Sheet 2: PANDUAN PENGISIAN
    const guideData = [
      { 'Panduan Pengisian Template Import Siswa PAIBP Smart Assessment Pro': '' },
      { 'Panduan Pengisian Template Import Siswa PAIBP Smart Assessment Pro': '1. Kolom "NISN": Isi nomor induk siswa (10 digit angka atau NIS sekolah).' },
      { 'Panduan Pengisian Template Import Siswa PAIBP Smart Assessment Pro': '2. Kolom "Nama Lengkap": Isi nama lengkap siswa (wajib diisi).' },
      { 'Panduan Pengisian Template Import Siswa PAIBP Smart Assessment Pro': '3. Kolom "Kelas": Pilihan yang valid: VII, VIII, IX, X, XI, XII (atau angka 7, 8, 9, 10, 11, 12).' },
      { 'Panduan Pengisian Template Import Siswa PAIBP Smart Assessment Pro': '4. Kolom "Jenis Kelamin": Isi "L" untuk Laki-laki atau "P" untuk Perempuan.' },
      { 'Panduan Pengisian Template Import Siswa PAIBP Smart Assessment Pro': '5. Kolom "Fase" akan ditentukan otomatis oleh sistem berdasarkan kelas yang dipilih:' },
      { 'Panduan Pengisian Template Import Siswa PAIBP Smart Assessment Pro': '   - Kelas VII, VIII, IX = Fase D (SMP/MTs)' },
      { 'Panduan Pengisian Template Import Siswa PAIBP Smart Assessment Pro': '   - Kelas X = Fase E (SMA/SMK/MA)' },
      { 'Panduan Pengisian Template Import Siswa PAIBP Smart Assessment Pro': '   - Kelas XI, XII = Fase F (SMA/SMK/MA)' },
      { 'Panduan Pengisian Template Import Siswa PAIBP Smart Assessment Pro': '6. Hapus baris contoh atau ganti langsung dengan data siswa Anda.' },
    ];
    const wsGuide = XLSX.utils.json_to_sheet(guideData, { skipHeader: true });
    wsGuide['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK_PENGISIAN');

    XLSX.writeFile(wb, `Template_Import_Data_Siswa_PAIBP.xlsx`);
    showToast('Template Excel berhasil diunduh.', 'success');
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent =
      'No,NISN,Nama Lengkap,Kelas,Jenis Kelamin\n' +
      '1,0081234501,Ahmad Fauzan Pratama,X,L\n' +
      '2,0081234502,Aisyah Rahmadani,X,P\n' +
      '3,0081234503,Bilal Habibi Ramadhan,X,L\n' +
      '4,0071234601,Muhammad Azzam Izzuddin,XI,L\n' +
      '5,0061234702,Siti Maryam Shalihah,XII,P\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Template_Import_Data_Siswa_PAIBP.csv';
    link.click();
    showToast('Template CSV berhasil diunduh.', 'success');
  };

  // Export current student list to Excel
  const handleExportStudents = () => {
    const wb = XLSX.utils.book_new();
    const rows = filteredSiswa.map((s, idx) => ({
      No: idx + 1,
      NISN: s.nisn,
      'Nama Lengkap': s.nama,
      Kelas: s.kelas,
      Fase: s.fase,
      'Jenis Kelamin': s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 32 },
      { wch: 10 },
      { wch: 8 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'ROSTER_SISWA');

    const fileName = `Data_Siswa_PAIBP_${filterKelas !== 'ALL' ? 'Kelas_' + filterKelas : 'Semua_Kelas'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(`Berhasil mengekspor ${filteredSiswa.length} data siswa ke Excel.`, 'success');
  };

  // ==========================================
  // FITUR IMPORT DATA SISWA (PARSER & PREVIEW)
  // ==========================================
  const handleOpenImportModal = () => {
    setImportFile(null);
    setParsedRows([]);
    setImportStep('upload');
    setImportError('');
    setIsImportModalOpen(true);
  };

  const processUploadedFile = (file: File) => {
    setImportError('');
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('File tidak dapat dibaca atau kosong.');

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('Lembar kerja kosong atau tidak ada data yang terbaca.');
        }

        // Auto-detect headers
        const parsed: ParsedStudentRow[] = rawJson.map((row, index) => {
          const errors: string[] = [];

          // Find NISN column
          const nisnKey = Object.keys(row).find((k) => {
            const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              lk.includes('nisn') ||
              lk.includes('nis') ||
              lk.includes('noinduk') ||
              lk.includes('nipd') ||
              lk.includes('nomor')
            );
          });
          const rawNisn = nisnKey ? String(row[nisnKey]).trim() : '';

          // Find Nama column
          const namaKey = Object.keys(row).find((k) => {
            const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              lk.includes('nama') ||
              lk.includes('siswa') ||
              lk.includes('pesertadidik') ||
              lk.includes('student') ||
              lk.includes('fullname')
            );
          });
          const rawNama = namaKey ? String(row[namaKey]).trim() : '';

          // Find Kelas column
          const kelasKey = Object.keys(row).find((k) => {
            const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              lk.includes('kelas') ||
              lk.includes('rombel') ||
              lk.includes('tingkat') ||
              lk.includes('grade') ||
              lk.includes('class')
            );
          });
          const rawKelas = kelasKey ? row[kelasKey] : '';
          const cleanKelas = normalizeKelas(rawKelas) || (filterKelas !== 'ALL' ? (filterKelas as Kelas) : 'X');

          // Find Jenis Kelamin column
          const genderKey = Object.keys(row).find((k) => {
            const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              lk.includes('jk') ||
              lk.includes('jeniskelamin') ||
              lk.includes('gender') ||
              lk.includes('lp') ||
              lk.includes('sex')
            );
          });
          const rawGender = genderKey ? row[genderKey] : '';
          const cleanGender = normalizeGender(rawGender);

          // Find Fase column if present, or deduce
          const faseKey = Object.keys(row).find((k) => {
            const lk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            return lk === 'fase' || lk.includes('fase');
          });
          let cleanFase: Fase = deduceFaseFromKelas(cleanKelas);
          if (faseKey && row[faseKey]) {
            const fStr = String(row[faseKey]).toUpperCase().trim();
            if (fStr === 'D' || fStr === 'E' || fStr === 'F') cleanFase = fStr as Fase;
          }

          // Validations
          let finalNisn = rawNisn;
          if (!finalNisn) {
            finalNisn = `GEN-${Date.now()}-${String(index + 1).padStart(3, '0')}`;
          }

          if (!rawNama) {
            errors.push('Nama siswa kosong');
          }

          return {
            raw: row,
            nisn: finalNisn,
            nama: rawNama,
            kelas: cleanKelas,
            fase: cleanFase,
            jenisKelamin: cleanGender,
            isValid: errors.length === 0,
            errors,
            isDuplicateInDB: siswaList.some((s) => s.nisn === finalNisn),
            isDuplicateInFile: false,
          };
        });

        // Mark duplicates within the imported file itself
        const seenNisns = new Set<string>();
        parsed.forEach((item) => {
          if (seenNisns.has(item.nisn)) {
            item.isDuplicateInFile = true;
          } else {
            seenNisns.add(item.nisn);
          }
        });

        setParsedRows(parsed);
        setImportStep('preview');
      } catch (err: any) {
        console.error('File parsing error:', err);
        setImportError(err.message || 'Gagal membaca isi file. Pastikan format Excel/CSV valid.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Commit imported rows to database
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid && r.nama);
    if (validRows.length === 0) {
      setImportError('Tidak ada data siswa yang valid untuk diimpor.');
      return;
    }

    let nextList: SiswaMaster[] = [];

    if (importMode === 'replace') {
      nextList = validRows.map((r, idx) => ({
        id: `SISWA-IMP-${Date.now()}-${idx + 1}`,
        nisn: r.nisn,
        nama: r.nama,
        kelas: r.kelas,
        fase: r.fase,
        jenisKelamin: r.jenisKelamin,
      }));
    } else {
      // Append / merge
      const existingMap = new Map(siswaList.map((s) => [s.nisn, s]));

      validRows.forEach((r, idx) => {
        const existing = existingMap.get(r.nisn);
        if (existing) {
          // Update details
          existingMap.set(r.nisn, {
            ...existing,
            nama: r.nama,
            kelas: r.kelas,
            fase: r.fase,
            jenisKelamin: r.jenisKelamin,
          });
        } else {
          // New student
          const newId = `SISWA-IMP-${Date.now()}-${idx + 1}`;
          existingMap.set(r.nisn, {
            id: newId,
            nisn: r.nisn,
            nama: r.nama,
            kelas: r.kelas,
            fase: r.fase,
            jenisKelamin: r.jenisKelamin,
          });
        }
      });

      nextList = Array.from(existingMap.values());
    }

    onUpdateSiswaList(nextList);
    setImportSuccessCount(validRows.length);
    setImportStep('success');

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    showToast(`Berhasil mengimpor ${validRows.length} data siswa!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-semibold animate-slide-up ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600'
              : toastMessage.type === 'error'
              ? 'bg-rose-600'
              : 'bg-slate-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-200" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Users className="w-3.5 h-3.5" />
              Master Data Siswa &amp; Roster Kelas Terintegrasi
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Manajemen Data Siswa
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Pusat pengelolaan peserta didik untuk seluruh fase (Fase D, E, dan F). Data siswa otomatis terhubung
              ke Penilaian Formatif, Penilaian Sumatif 5 Elemen, dan Jurnal Catatan Sikap.
            </p>
          </div>

          {/* Action Buttons in Hero */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenImportModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-900/40 transition transform active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Import Data Siswa (Excel/CSV)
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-xs transition border border-white/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Siswa
            </button>
            <button
              onClick={handleDownloadExcelTemplate}
              title="Unduh Format Excel Siap Pakai"
              className="flex items-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-semibold rounded-xl backdrop-blur-xs transition border border-white/10 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Template Excel
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-xs font-medium text-slate-500">Total Siswa Terdaftar</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <UserCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.lCount}</p>
          <p className="text-xs font-medium text-slate-500">Laki-laki (L)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center mb-2">
            <UserCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.pCount}</p>
          <p className="text-xs font-medium text-slate-500">Perempuan (P)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.faseDCount}</p>
          <p className="text-xs font-medium text-slate-500">Fase D (VII, VIII, IX)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.faseECount}</p>
          <p className="text-xs font-medium text-slate-500">Fase E (Kelas X)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.faseFCount}</p>
          <p className="text-xs font-medium text-slate-500">Fase F (XI &amp; XII)</p>
        </div>
      </div>

      {/* Main Filter & Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama siswa atau NISN..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Kelas filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-[11px] font-bold text-slate-500">Kelas:</span>
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas ({stats.total})</option>
                <option value="VII">Kelas VII (SMP)</option>
                <option value="VIII">Kelas VIII (SMP)</option>
                <option value="IX">Kelas IX (SMP)</option>
                <option value="X">Kelas X ({stats.kelasCounts.X})</option>
                <option value="XI">Kelas XI ({stats.kelasCounts.XI})</option>
                <option value="XII">Kelas XII ({stats.kelasCounts.XII})</option>
              </select>
            </div>

            {/* Fase filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-[11px] font-bold text-slate-500">Fase:</span>
              <select
                value={filterFase}
                onChange={(e) => setFilterFase(e.target.value)}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Fase</option>
                <option value="D">Fase D</option>
                <option value="E">Fase E</option>
                <option value="F">Fase F</option>
              </select>
            </div>

            {/* Gender filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-[11px] font-bold text-slate-500">Gender:</span>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua L/P</option>
                <option value="L">Laki-laki ({stats.lCount})</option>
                <option value="P">Perempuan ({stats.pCount})</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {(filterKelas !== 'ALL' || filterFase !== 'ALL' || filterGender !== 'ALL' || searchTerm) && (
              <button
                onClick={() => {
                  setFilterKelas('ALL');
                  setFilterFase('ALL');
                  setFilterGender('ALL');
                  setSearchTerm('');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            {/* Export Roster Button */}
            <button
              onClick={handleExportStudents}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Ekspor Excel
            </button>
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs animate-fade-in">
            <span className="font-bold text-emerald-800">
              {selectedIds.length} siswa terpilih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-800 font-medium"
              >
                Batalkan Pilihan
              </button>
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
                className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Terpilih
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4">NISN / Nomor Induk</th>
                <th className="py-3 px-4">Nama Lengkap Siswa</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3 text-center">Fase</th>
                <th className="py-3 px-3 text-center">Gender</th>
                <th className="py-3 px-4 text-center">Status di Penilaian</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-10 h-10 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">Tidak ada data siswa ditemukan</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchTerm || filterKelas !== 'ALL' || filterFase !== 'ALL'
                          ? 'Coba ubah kata kunci pencarian atau reset filter untuk menampilkan data.'
                          : 'Belum ada data siswa yang diinput atau diimpor ke sistem.'}
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={handleOpenImportModal}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Import Excel/CSV
                        </button>
                        <button
                          onClick={handleOpenAddModal}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tambah Manual
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((siswa, idx) => {
                  const isSelected = selectedIds.includes(siswa.id);
                  const hasFormatif = formatifList.some((f) => f.siswaId === siswa.id);
                  const hasSumatif = sumatifList.some((s) => s.siswaId === siswa.id);
                  const hasSikap = catatanSikapList.some((c) => c.siswaId === siswa.id);

                  return (
                    <tr
                      key={siswa.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(siswa.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 font-semibold text-[11px]">
                        {siswa.nisn}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {siswa.nama}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          Kelas {siswa.kelas}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                          Fase {siswa.fase}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-black text-[10px] ${
                            siswa.jenisKelamin === 'L'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-pink-100 text-pink-700'
                          }`}
                        >
                          {siswa.jenisKelamin === 'L' ? 'L' : 'P'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            title={hasFormatif ? 'Sudah memiliki nilai formatif' : 'Belum ada nilai formatif'}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              hasFormatif
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            Formatif
                          </span>
                          <span
                            title={hasSumatif ? 'Sudah memiliki nilai sumatif' : 'Belum ada nilai sumatif'}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              hasSumatif
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            Sumatif
                          </span>
                          <span
                            title={hasSikap ? 'Sudah ada catatan sikap di jurnal' : 'Belum ada catatan sikap'}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              hasSikap
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            Sikap
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onNavigateToGrading && (
                            <button
                              onClick={() => onNavigateToGrading(siswa.kelas)}
                              title="Buka Lembar Penilaian Siswa Ini"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(siswa)}
                            title="Edit Data Siswa"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(siswa.id)}
                            title="Hapus Siswa"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with count info */}
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Menampilkan <strong className="text-slate-700">{filteredSiswa.length}</strong> dari{' '}
            <strong className="text-slate-700">{siswaList.length}</strong> total siswa
          </span>
          {onNavigateToGrading && (
            <button
              onClick={() => onNavigateToGrading(filterKelas !== 'ALL' ? (filterKelas as Kelas) : 'X')}
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
            >
              <span>Lanjut ke Penilaian Kelas {filterKelas !== 'ALL' ? filterKelas : 'X'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: IMPORT DATA SISWA WIZARD (EXCEL / CSV) */}
      {/* ======================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 p-6 md:p-7 space-y-5 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Import Data Siswa dari File
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* STEP 1: UPLOAD AREA */}
            {importStep === 'upload' && (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Klik atau Seret (Drag &amp; Drop) File Excel / CSV ke Sini
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    File harus memiliki kolom <strong>NISN</strong>, <strong>Nama Lengkap</strong>,{' '}
                    <strong>Kelas</strong>, dan <strong>Jenis Kelamin (L/P)</strong>.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-500 transition">
                    Pilih File dari Komputer
                  </div>
                </div>

                {/* Templates download helper */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Belum punya format file yang sesuai?</p>
                    <p className="text-slate-500 text-[11px]">
                      Unduh template resmi berisikan contoh format data yang benar dan petunjuk pengisian.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadExcelTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 font-bold border border-slate-200 rounded-xl shadow-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Template (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl shadow-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Template (.csv)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PREVIEW & CONFIRMATION */}
            {importStep === 'preview' && (
              <div className="space-y-4">
                {/* Summary & Mode Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">File: </span>
                    <strong className="text-slate-800">{importFile?.name}</strong>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                        {parsedRows.filter((r) => r.isValid).length} baris valid
                      </span>
                      {parsedRows.some((r) => !r.isValid) && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                          {parsedRows.filter((r) => !r.isValid).length} error
                        </span>
                      )}
                      {parsedRows.some((r) => r.isDuplicateInDB) && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                          {parsedRows.filter((r) => r.isDuplicateInDB).length} NISN ada di database
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mode radio */}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-700 text-[11px]">Metode Import:</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Tambah / Gabung (Append)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-rose-700">Gantikan Semua (Replace)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="py-2 px-3 w-8 text-center">No</th>
                        <th className="py-2 px-3">NISN</th>
                        <th className="py-2 px-3">Nama Siswa</th>
                        <th className="py-2 px-2 text-center">Kelas</th>
                        <th className="py-2 px-2 text-center">Fase</th>
                        <th className="py-2 px-2 text-center">L/P</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={
                            !row.isValid
                              ? 'bg-rose-50/70'
                              : row.isDuplicateInDB
                              ? 'bg-amber-50/50'
                              : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 font-semibold text-[11px]">
                            {row.nisn}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {row.nama || <span className="text-rose-500 italic">Nama kosong</span>}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="font-bold">{row.kelas}</span>
                          </td>
                          <td className="py-2 px-2 text-center text-[10px] text-slate-500">
                            {row.fase}
                          </td>
                          <td className="py-2 px-2 text-center font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                row.jenisKelamin === 'L'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-pink-100 text-pink-700'
                              }`}
                            >
                              {row.jenisKelamin}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              row.isDuplicateInDB ? (
                                <span className="text-[10px] font-bold text-amber-700">
                                  {importMode === 'append' ? 'Akan diupdate' : 'Valid'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Siap import
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] font-bold text-rose-600">
                                {row.errors.join(', ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setImportStep('upload');
                      setParsedRows([]);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Pilih File Lain
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Proses &amp; Simpan {parsedRows.filter((r) => r.isValid).length} Siswa
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {importStep === 'success' && (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900">
                    Import Data Siswa Berhasil!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Sebanyak <strong>{importSuccessCount} siswa</strong> telah berhasil didaftarkan dan kini siap
                    dinilai pada Penilaian Formatif, Sumatif, dan Jurnal Sikap.
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                  >
                    Tutup &amp; Lihat Roster
                  </button>
                  {onNavigateToGrading && (
                    <button
                      onClick={() => {
                        setIsImportModalOpen(false);
                        onNavigateToGrading();
                      }}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Buka Sistem Penilaian
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: TAMBAH / EDIT SISWA MANUAL */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 md:p-7 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  {editingSiswa ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi identitas siswa untuk keperluan asesmen &amp; rapor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NISN / Nomor Induk Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNisn}
                  onChange={(e) => setFormNisn(e.target.value)}
                  placeholder="Contoh: 0081234509"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Muhammad Rayhan Fadhilah"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formKelas}
                    onChange={(e) => handleKelasChange(e.target.value as Kelas)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="VII">Kelas VII (Fase D)</option>
                    <option value="VIII">Kelas VIII (Fase D)</option>
                    <option value="IX">Kelas IX (Fase D)</option>
                    <option value="X">Kelas X (Fase E)</option>
                    <option value="XI">Kelas XI (Fase F)</option>
                    <option value="XII">Kelas XII (Fase F)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                <p>
                  <strong>Fase Kurikulum Merdeka:</strong> Terdeteksi otomatis sebagai{' '}
                  <span className="font-bold text-emerald-700">Fase {formFase}</span>.
                </p>
                <p>
                  Data ini akan langsung disinkronkan ke daftar nilai Formatif, Sumatif, dan Jurnal Sikap.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition"
                >
                  {editingSiswa ? 'Simpan Perubahan' : 'Tambahkan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: KONFIRMASI HAPUS SATU SISWA */}
      {/* ======================================================== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 p-5 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus Data Siswa?</h4>
                <p className="text-xs text-slate-500">
                  {siswaList.find((s) => s.id === deleteConfirmId)?.nama}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus siswa ini dari daftar? Siswa ini tidak akan muncul lagi di lembar
              penilaian.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteStudent(deleteConfirmId)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: KONFIRMASI BULK DELETE */}
      {/* ======================================================== */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 p-5 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus Banyak Siswa?</h4>
                <p className="text-xs text-slate-500">
                  {selectedIds.length} siswa akan dihapus permanen
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan menghapus seluruh data siswa yang dicentang dari daftar roster.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
              >
                Hapus {selectedIds.length} Siswa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
