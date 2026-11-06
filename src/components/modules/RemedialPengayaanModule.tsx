import React, { useState } from 'react';
import {
  ProgramRemedialPengayaan,
  AnalisisHasil,
  ProfilSekolah,
} from '../../types/curriculum';
import {
  RefreshCw,
  Sparkles,
  BookOpen,
  ArrowRight,
  Download,
  Users,
  CheckCircle,
  FileText,
  RotateCw,
} from 'lucide-react';
import { callGenerateRemedialAPI } from '../../services/aiService';
import { exportToWordDoc } from '../../utils/exportUtils';

interface Props {
  analyticsList: AnalisisHasil[];
  profil: ProfilSekolah;
  isPro?: boolean;
  onOpenProModal?: (title?: string, desc?: string) => void;
}

export const RemedialPengayaanModule: React.FC<Props> = ({
  analyticsList,
  profil,
  isPro = false,
  onOpenProModal,
}) => {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(
    analyticsList[0]?.id || ''
  );
  const activeAnalysis =
    analyticsList.find((a) => a.id === selectedAnalysisId) || analyticsList[0];

  const [activeTab, setActiveTab] = useState<'remedial' | 'pengayaan'>('remedial');
  const [isLoading, setIsLoading] = useState(false);

  // Remedial & Pengayaan state
  const [program, setProgram] = useState<ProgramRemedialPengayaan | null>(null);

  // Extract students
  const remedialStudents =
    activeAnalysis?.siswaList.filter((s) => s.statusKetuntasan === 'Belum Tuntas') || [];
  const pengayaanStudents =
    activeAnalysis?.siswaList.filter((s) => s.statusKetuntasan === 'Tuntas') || [];

  const handleGenerateProgram = async () => {
    if (!activeAnalysis) return;
    if (!isPro) {
      if (onOpenProModal) {
        onOpenProModal(
          'Remedial & Pengayaan AI 🔒 PRO',
          'Penyusunan modul dan materi remedial interaktif serta butir soal tantangan pengayaan HOTS otomatis merupakan fitur eksklusif versi PRO.'
        );
      }
      return;
    }
    setIsLoading(true);

    try {
      const res = await callGenerateRemedialAPI({
        fase: 'E',
        kelas: 'X',
        materi: activeAnalysis.ketercapaianTP[0]?.materi || 'Al-Kulliyat Al-Khamsah',
        tpKode: activeAnalysis.ketercapaianTP[0]?.tpKode || 'E.F.2',
        tpDeskripsi: 'Pemahaman mendalam prinsip maqashid syariah',
        kktp: activeAnalysis.kktp,
        daftarSiswaRemedial: remedialStudents.map((s) => s.nama),
        daftarSiswaPengayaan: pengayaanStudents.map((s) => s.nama),
      });

      setProgram(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportWord = () => {
    if (!program || !activeAnalysis) return;

    const docHtml = `
      <h3 style="text-align: center; text-transform: uppercase;">PROGRAM PEMBELAJARAN REMEDIAL &amp; PENGAYAAN</h3>
      <table style="width: 100%; border: none; font-size: 11pt; margin-bottom: 15px;">
        <tr><td style="width: 25%;">Satuan Pendidikan</td><td>: ${profil.namaSekolah}</td></tr>
        <tr><td>Mata Pelajaran</td><td>: Pendidikan Agama Islam &amp; Budi Pekerti</td></tr>
        <tr><td>Asesmen Induk</td><td>: ${activeAnalysis.namaAsesmen}</td></tr>
        <tr><td>Standar KKTP</td><td>: ${activeAnalysis.kktp}</td></tr>
      </table>

      <h4 style="margin: 15px 0 5px 0; color: #b30000;">A. PROGRAM PEMBELAJARAN REMEDIAL (Siswa &lt; KKTP)</h4>
      <p style="font-size: 11pt;"><strong>Daftar Peserta Didik Remedial:</strong> ${remedialStudents.map((s) => s.nama).join(', ') || 'Semua tuntas'}</p>
      <p style="font-size: 11pt;"><strong>Materi Penguatan:</strong> ${program.rencanaRemedial.materiPenguatan}</p>
      <p style="font-size: 11pt;"><strong>Metode Alternatif:</strong> ${program.rencanaRemedial.metodeAlternatif}</p>

      <h5 style="margin: 10px 0 5px 0;">Butir Soal Asesmen Remedial:</h5>
      ${program.rencanaRemedial.soalRemedial
        .map(
          (q, idx) => `
        <div style="margin-bottom: 8px; font-size: 10.5pt;">
          <p><strong>${idx + 1}. ${q.pertanyaan}</strong></p>
          <p style="color: #006600;">Kunci/Pedoman: ${q.kunciJawaban}</p>
        </div>
      `
        )
        .join('')}

      <h4 style="margin: 25px 0 5px 0; color: #006600;">B. PROGRAM PENGAYAAN (Siswa &gt;= KKTP)</h4>
      <p style="font-size: 11pt;"><strong>Daftar Peserta Didik Pengayaan:</strong> ${pengayaanStudents.map((s) => s.nama).join(', ')}</p>
      <p style="font-size: 11pt;"><strong>Topik Eksplorasi:</strong> ${program.rencanaPengayaan.topikEksplorasi}</p>
      <p style="font-size: 11pt;"><strong>Studi Kasus HOTS:</strong> ${program.rencanaPengayaan.studiKasusHots}</p>
      <p style="font-size: 11pt;"><strong>Tugas Proyek / Refleksi:</strong> ${program.rencanaPengayaan.tugasProyekRefleksi}</p>
    `;

    exportToWordDoc(
      `Program_Remedial_Pengayaan_${activeAnalysis.namaAsesmen.replace(/\s+/g, '_')}`,
      'Program Remedial & Pengayaan PAIBP',
      docHtml,
      profil
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-600" />
            Program Tindak Lanjut: Remedial &amp; Pengayaan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dihasilkan secara objektif berdasarkan skor riil ketercapaian TP tanpa penilaian subjektif religiositas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateProgram}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            {isLoading ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Rancang Program Otomatis dengan AI
          </button>
          {program && (
            <button
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
            >
              <FileText className="w-4 h-4 text-blue-600" /> Unduh Dokumen Word (.doc)
            </button>
          )}
        </div>
      </div>

      {/* Target Breakdown Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-rose-900">
            <span>Siswa Belum Tuntas (Remedial): {remedialStudents.length} Orang</span>
            <span className="text-[10px] bg-rose-100 px-2 py-0.5 rounded">&lt; KKTP {activeAnalysis?.kktp}</span>
          </div>
          <p className="text-rose-800 text-[11px]">
            Siswa: {remedialStudents.map((s) => s.nama).join(', ') || 'Alhamdulillah semua siswa tuntas!'}
          </p>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-emerald-900">
            <span>Siswa Tuntas (Pengayaan): {pengayaanStudents.length} Orang</span>
            <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded">&gt;= KKTP {activeAnalysis?.kktp}</span>
          </div>
          <p className="text-emerald-800 text-[11px]">
            Siswa: {pengayaanStudents.map((s) => s.nama).join(', ')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('remedial')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'remedial'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-rose-600" />
          Rencana Remedial &amp; Asesmen Ulang
        </button>
        <button
          onClick={() => setActiveTab('pengayaan')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'pengayaan'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Rencana Pengayaan &amp; Tantangan HOTS
        </button>
      </div>

      {/* Program Details Content */}
      {program ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {activeTab === 'remedial' ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 block">Materi Penguatan Esensial:</span>
                <p className="text-slate-700 leading-relaxed">{program.rencanaRemedial.materiPenguatan}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 block">Metode Pembelajaran Alternatif:</span>
                <p className="text-slate-700 leading-relaxed">{program.rencanaRemedial.metodeAlternatif}</p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">Soal Asesmen Ulang Remedial:</span>
                {program.rencanaRemedial.soalRemedial.map((q, idx) => (
                  <div key={idx} className="p-3 bg-rose-50/40 rounded-xl border border-rose-200 space-y-1">
                    <p className="font-bold text-slate-900">{idx + 1}. {q.pertanyaan}</p>
                    <p className="text-slate-600 text-[11px]">Kunci Jawaban: {q.kunciJawaban}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 block">Topik Eksplorasi Pengayaan:</span>
                <p className="text-slate-700 leading-relaxed">{program.rencanaPengayaan.topikEksplorasi}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 block">Studi Kasus HOTS Mandiri:</span>
                <p className="text-slate-700 leading-relaxed">{program.rencanaPengayaan.studiKasusHots}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 block">Tugas Proyek &amp; Refleksi Sosial:</span>
                <p className="text-slate-700 leading-relaxed">{program.rencanaPengayaan.tugasProyekRefleksi}</p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">Soal Tantangan HOTS:</span>
                {program.rencanaPengayaan.soalTantanganHots.map((q, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-1">
                    <p className="font-bold text-slate-900">{idx + 1}. {q.pertanyaan}</p>
                    <p className="text-slate-600 text-[11px]">Pedoman Analisis: {q.kunciJawaban}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          Klik tombol "Rancang Program Otomatis dengan AI" di atas untuk menganalisis hasil belajar dan menyusun program tindak lanjut.
        </div>
      )}
    </div>
  );
};
