import React, { useState } from 'react';
import { AppDatabase } from '../../services/storageService';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  PackageOpen,
  Sliders,
  BarChart3,
  CheckCircle,
  Lock,
  Eye,
  Sparkles,
} from 'lucide-react';
import {
  exportToWordDoc,
  exportToExcel,
  exportToCSV,
  generateGoogleFormsFormat,
} from '../../utils/exportUtils';

interface Props {
  db: AppDatabase;
  isPro?: boolean;
  onOpenProModal?: (title?: string, desc?: string) => void;
  watermarkText?: string;
}

export const ExportCenterModule: React.FC<Props> = ({
  db,
  isPro = false,
  onOpenProModal,
  watermarkText = 'DEMO – PAIBP SMART ASSESSMENT PRO',
}) => {
  const [copiedGoogleForms, setCopiedGoogleForms] = useState(false);
  const [copiedClipboard, setCopiedClipboard] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    db.assessmentPackages[0]?.id || ''
  );
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const activePackage =
    db.assessmentPackages.find((p) => p.id === selectedPackageId) ||
    db.assessmentPackages[0];

  // Helper for feature gate checking
  const handleProtectedAction = (
    actionName: string,
    actionDesc: string,
    onAllowed: () => void
  ) => {
    if (isPro) {
      onAllowed();
    } else {
      if (onOpenProModal) {
        onOpenProModal(
          `Export ${actionName} 🔒 PRO`,
          `📄 Preview tersedia. Export ${actionName} merupakan fitur PRO. Aktifkan lisensi Anda untuk mengunduh dokumen resmi tanpa watermark.`
        );
      }
    }
  };

  const handleCopyGoogleForms = () => {
    if (!activePackage) return;
    const text = generateGoogleFormsFormat(activePackage.soalList);
    navigator.clipboard.writeText(text);
    setCopiedGoogleForms(true);
    setTimeout(() => setCopiedGoogleForms(false), 3000);
  };

  const handleCopyAllToClipboard = () => {
    if (!activePackage) return;
    let fullText = `${activePackage.namaPaket}\n`;
    if (!isPro) fullText = `[${watermarkText}]\n` + fullText;
    fullText += `Fase: ${activePackage.fase} | Kelas: ${activePackage.kelas}\n\n`;
    activePackage.soalList.forEach((q, i) => {
      fullText += `${i + 1}. ${q.pertanyaan}\n`;
      if (q.opsi && q.opsi.length > 0) {
        q.opsi.forEach((op) => {
          fullText += `   ${op}\n`;
        });
      }
      fullText += `   Kunci: ${q.kunciJawaban}\n\n`;
    });
    navigator.clipboard.writeText(fullText);
    setCopiedClipboard(true);
    setTimeout(() => setCopiedClipboard(false), 3000);
  };

  const handleExportFullExcel = () => {
    if (!activePackage) return;
    exportToExcel(`Paket_Asesmen_PAIBP_${activePackage.namaPaket.replace(/\s+/g, '_')}`, {
      soalList: activePackage.soalList,
      kisiKisiList: activePackage.kisiKisiList,
      profil: db.profilSekolah,
    });
  };

  const handleExportStudentWord = () => {
    if (!activePackage) return;

    let itemsHtml = '';
    activePackage.soalList.forEach((q, idx) => {
      itemsHtml += `
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 5px 0; font-weight: bold;">${idx + 1}. ${q.pertanyaan}</p>
      `;
      if (q.stimulus?.konten) {
        itemsHtml += `<div style="padding: 6px; background-color: #f7f7f7; border-left: 3px solid #333; margin-bottom: 6px; font-style: italic;">${q.stimulus.konten}</div>`;
      }
      if (q.opsi && q.opsi.length > 0) {
        itemsHtml += `<div style="margin-left: 15px;">`;
        q.opsi.forEach((op) => {
          itemsHtml += `<p style="margin: 3px 0;">${op}</p>`;
        });
        itemsHtml += `</div>`;
      }
      itemsHtml += `</div>`;
    });

    const fullContent = `
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="margin: 0; text-transform: uppercase;">${activePackage.namaPaket}</h3>
        <p style="margin: 2px 0;">Fase ${activePackage.fase} • Kelas ${activePackage.kelas} • Waktu: ${activePackage.durasiMenit} Menit</p>
      </div>
      <div style="padding: 8px; border: 1px solid #333; margin-bottom: 20px; font-size: 10.5pt;">
        <strong>PETUNJUK UMUM:</strong><br>${activePackage.petunjukUmum.replace(/\n/g, '<br>')}
      </div>
      ${itemsHtml}
    `;

    exportToWordDoc(
      `Naskah_Soal_Siswa_${activePackage.namaPaket.replace(/\s+/g, '_')}`,
      'Naskah Soal Siswa',
      fullContent,
      db.profilSekolah
    );
  };

  const handleExportTeacherKeyWord = () => {
    if (!activePackage) return;

    let tableHtml = `
      <h3 style="text-align: center;">KUNCI JAWABAN &amp; PEMBAHASAN GURU</h3>
      <table border="1" style="border-collapse: collapse; width: 100%; font-size: 10.5pt;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="width: 8%;">No</th>
            <th style="width: 15%;">Bentuk</th>
            <th style="width: 15%;">Kunci</th>
            <th>Pembahasan &amp; Dalil</th>
          </tr>
        </thead>
        <tbody>
    `;

    activePackage.soalList.forEach((q, idx) => {
      tableHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td>${q.bentukSoal}</td>
          <td style="text-align: center; font-weight: bold; color: #006600;">${q.kunciJawaban}</td>
          <td>${q.pembahasan}</td>
        </tr>
      `;
    });
    tableHtml += `</tbody></table>`;

    exportToWordDoc(
      `Kunci_Guru_${activePackage.namaPaket.replace(/\s+/g, '_')}`,
      'Kunci Jawaban Guru',
      tableHtml,
      db.profilSekolah
    );
  };

  const handlePrint = () => {
    handleProtectedAction('Print PDF', 'Mencetak dokumen langsung ke printer atau PDF', () => {
      window.print();
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" />
              Pusat Ekspor Dokumen Asesmen (Export Center)
            </h2>
            {isPro ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                PRO UNLIMITED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Lock className="w-3 h-3" /> DEMO TERBATAS
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ekspor naskah soal siswa, kunci jawaban guru, kisi-kisi, rubrik, dan rekap nilai ke format Word, Excel, CSV, Google Forms &amp; Print
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Demo Preview Button */}
          <button
            onClick={() => setPreviewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border border-slate-200"
          >
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Lihat Preview Dokumen</span>
          </button>

          {/* Direct Print Button */}
          <button
            onClick={handlePrint}
            className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition ${
              isPro ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {!isPro && <Lock className="w-3.5 h-3.5 text-amber-300" />}
            <Printer className="w-4 h-4" />
            <span>Cetak Langsung (Print PDF)</span>
          </button>
        </div>
      </div>

      {/* Target Package Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700 whitespace-nowrap">Pilih Paket Asesmen:</span>
          <select
            value={activePackage?.id || ''}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white"
          >
            {db.assessmentPackages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.namaPaket} (Fase {pkg.fase} - Kelas {pkg.kelas})
              </option>
            ))}
          </select>
        </div>

        {/* Demo Allowed Action: Copy to Clipboard */}
        <button
          onClick={handleCopyAllToClipboard}
          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition border border-emerald-200 self-start sm:self-auto"
        >
          {copiedClipboard ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedClipboard ? 'Teks Tersalin!' : 'Salin Semua Teks Soal'}</span>
        </button>
      </div>

      {/* Demo Gating Notice if not PRO */}
      {!isPro && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-200/60 text-amber-800 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">Mode DEMO: Fitur Ekspor File (Word, Excel, PDF, CSV) Terkunci</p>
              <p className="text-[11px] text-amber-800/80">
                Anda dapat melihat preview dan menyalin naskah ke clipboard. Aktifkan lisensi PRO untuk mengunduh file resmi tanpa watermark.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenProModal && onOpenProModal('Export Center PRO')}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs transition"
          >
            AKTIVASI PRO
          </button>
        </div>
      )}

      {/* 6 Large Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Student Test Word */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              {!isPro && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PRO
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Naskah Soal Siswa (Word .doc)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Format siap cetak resmi berkop sekolah, petunjuk umum, stimulus, opsi jawaban, dan lembar uraian bersih tanpa kunci jawaban.
            </p>
          </div>

          <button
            onClick={() =>
              handleProtectedAction('Word Naskah Siswa', 'Unduh naskah soal dalam format Microsoft Word', handleExportStudentWord)
            }
            disabled={!activePackage}
            className={`w-full py-2 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 ${
              isPro ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {!isPro && <Lock className="w-3.5 h-3.5 text-amber-300" />}
            <span>Unduh Naskah Soal Siswa</span>
          </button>
        </div>

        {/* Card 2: Teacher Key Word */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              {!isPro && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PRO
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Kunci &amp; Pembahasan Guru (Word .doc)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dokumen pegangan pendidik terpisah yang memuat kunci jawaban, pembahasan detail, dalil rujukan, dan level kognitif Bloom/SOLO.
            </p>
          </div>

          <button
            onClick={() =>
              handleProtectedAction('Word Kunci Guru', 'Unduh kunci jawaban & pembahasan lengkap dalam format Word', handleExportTeacherKeyWord)
            }
            disabled={!activePackage}
            className={`w-full py-2 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 ${
              isPro ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {!isPro && <Lock className="w-3.5 h-3.5 text-amber-300" />}
            <span>Unduh Kunci Jawaban Guru</span>
          </button>
        </div>

        {/* Card 3: Multi-Sheet Excel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              {!isPro && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PRO
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Paket Komplit Excel (.xlsx)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Buku kerja Excel dengan 4 lembar kerja: (1) Naskah Soal, (2) Kunci &amp; Pembahasan, (3) Kisi-Kisi Lengkap, dan (4) Rekap Nilai Siswa.
            </p>
          </div>

          <button
            onClick={() =>
              handleProtectedAction('Excel .xlsx', 'Unduh spreadsheet komplit dengan 4 sheet kerja', handleExportFullExcel)
            }
            disabled={!activePackage}
            className={`w-full py-2 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 ${
              isPro ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {!isPro && <Lock className="w-3.5 h-3.5 text-amber-300" />}
            <span>Unduh Spreadsheet Lengkap (.xlsx)</span>
          </button>
        </div>

        {/* Card 4: Google Forms Import Format */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Copy className="w-5 h-5" />
              </div>
              {!isPro && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PRO
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Format Google Forms / Quizizz
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Teks terformat dengan tag otomatis (Question, Answer, Feedback) yang siap disalin ke Google Forms, Quizizz, atau sistem CBT sekolah.
            </p>
          </div>

          <button
            onClick={() =>
              handleProtectedAction('Google Forms', 'Salin format terstruktur Google Forms', handleCopyGoogleForms)
            }
            disabled={!activePackage}
            className={`w-full py-2 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 ${
              isPro ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {!isPro && <Lock className="w-3.5 h-3.5 text-amber-300" />}
            <span>{copiedGoogleForms ? 'Tersalin ke Clipboard!' : 'Salin Format Google Forms'}</span>
          </button>
        </div>

        {/* Card 5: Bank Soal Raw CSV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              {!isPro && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PRO
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Format Tabel CSV (Sistem CBT)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              File CSV universal untuk impor ke aplikasi e-learning Moodle, Google Classroom, atau aplikasi CBT lokal madrasah/sekolah.
            </p>
          </div>

          <button
            onClick={() => {
              handleProtectedAction('CSV CBT', 'Unduh format CSV untuk CBT', () => {
                if (activePackage) {
                  exportToCSV(
                    `CBT_Import_${activePackage.namaPaket.replace(/\s+/g, '_')}`,
                    activePackage.soalList.map((q, idx) => ({
                      No: idx + 1,
                      Pertanyaan: q.pertanyaan,
                      OpsiA: q.opsi?.[0] || '',
                      OpsiB: q.opsi?.[1] || '',
                      OpsiC: q.opsi?.[2] || '',
                      OpsiD: q.opsi?.[3] || '',
                      OpsiE: q.opsi?.[4] || '',
                      Kunci: q.kunciJawaban,
                    }))
                  );
                }
              });
            }}
            disabled={!activePackage}
            className={`w-full py-2 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 ${
              isPro ? 'bg-slate-800 hover:bg-slate-900' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {!isPro && <Lock className="w-3.5 h-3.5 text-amber-300" />}
            <span>Unduh CSV (.csv)</span>
          </button>
        </div>

        {/* Card 6: Print Preview Trigger */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              {!isPro && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PRO
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Format Cetak Langsung (PDF)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Membuka dialog cetak browser dengan tata letak halaman yang telah dioptimasi rapi untuk dicetak fisik atau disimpan sebagai PDF.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className={`w-full py-2 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 ${
              isPro ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {!isPro && <Lock className="w-3.5 h-3.5 text-amber-300" />}
            <span>Buka Print Dialog (PDF)</span>
          </button>
        </div>
      </div>

      {/* Document Preview Modal with Demo Watermark */}
      {previewModalOpen && activePackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  Preview Naskah: {activePackage.namaPaket}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar relative flex-1 text-xs text-slate-800 space-y-4">
              {/* Demo Watermark (Requirement 29) */}
              {!isPro && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none">
                  <span className="transform -rotate-45 text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-widest text-center">
                    {watermarkText}
                  </span>
                </div>
              )}

              {/* School Header */}
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <h4 className="font-extrabold uppercase text-sm">{db.profilSekolah.namaSekolah}</h4>
                <p className="text-[11px] text-slate-600">
                  NPSN: {db.profilSekolah.npsn} | {db.profilSekolah.alamat}
                </p>
                <h5 className="font-bold text-xs uppercase mt-2">{activePackage.namaPaket}</h5>
                <p className="text-[11px] text-slate-500">
                  Fase {activePackage.fase} • Kelas {activePackage.kelas} • Durasi: {activePackage.durasiMenit} Menit
                </p>
              </div>

              {/* Soal Preview */}
              <div className="space-y-4">
                {activePackage.soalList.map((q, i) => (
                  <div key={q.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <p className="font-bold text-slate-800 mb-1.5">
                      {i + 1}. {q.pertanyaan}
                    </p>
                    {q.stimulus?.konten && (
                      <div className="p-2 mb-2 bg-emerald-50/60 rounded border-l-2 border-emerald-500 text-[11px] text-slate-600 italic">
                        {q.stimulus.konten}
                      </div>
                    )}
                    {q.opsi && q.opsi.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-3">
                        {q.opsi.map((op, oIdx) => (
                          <span key={oIdx} className="text-slate-600">
                            {op}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {!isPro ? (
                <div className="text-[11px] text-slate-500">
                  Watermark aktif pada mode DEMO. Aktifkan PRO untuk menghilangkan watermark dan mengunduh format Word/PDF/Excel.
                </div>
              ) : (
                <div className="text-[11px] text-emerald-700 font-semibold">
                  ✓ Dokumen PRO resmi tanpa watermark
                </div>
              )}
              <div className="flex gap-2">
                {!isPro && (
                  <button
                    onClick={() => {
                      setPreviewModalOpen(false);
                      if (onOpenProModal) onOpenProModal('Unduh Tanpa Watermark');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs"
                  >
                    Buka PRO
                  </button>
                )}
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
