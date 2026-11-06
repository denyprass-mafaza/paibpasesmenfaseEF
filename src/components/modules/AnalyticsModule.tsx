import React, { useState } from 'react';
import {
  AnalisisHasil,
  SiswaNilai,
  ProfilSekolah,
} from '../../types/curriculum';
import {
  BarChart3,
  Download,
  Upload,
  Plus,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportToExcel } from '../../utils/exportUtils';

interface Props {
  analyticsList: AnalisisHasil[];
  onUpdateAnalytics: (list: AnalisisHasil[]) => void;
  profil: ProfilSekolah;
  onOpenRemedialWithAnalytics?: (analysis: AnalisisHasil) => void;
}

export const AnalyticsModule: React.FC<Props> = ({
  analyticsList,
  onUpdateAnalytics,
  profil,
  onOpenRemedialWithAnalytics,
}) => {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(
    analyticsList[0]?.id || ''
  );
  const activeAnalysis =
    analyticsList.find((a) => a.id === selectedAnalysisId) || analyticsList[0];

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [newSiswaNama, setNewSiswaNama] = useState('');
  const [newSiswaNisn, setNewSiswaNisn] = useState('');
  const [newSiswaNilai, setNewSiswaNilai] = useState<number>(85);

  const handleAddSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAnalysis) return;

    const isTuntas = newSiswaNilai >= activeAnalysis.kktp;
    const newSiswa: SiswaNilai = {
      id: `SISWA-${Date.now()}`,
      nisn: newSiswaNisn || `008${Math.floor(1000000 + Math.random() * 9000000)}`,
      nama: newSiswaNama,
      jawabanSiswa: { 1: 'B', 2: 'C', 3: 'B' },
      skorPerButir: { 1: 10, 2: 10, 3: 10 },
      nilaiAkhir: newSiswaNilai,
      statusKetuntasan: isTuntas ? 'Tuntas' : 'Belum Tuntas',
      catatan: isTuntas ? 'Mencapai KKTP' : 'Perlu bimbingan remedial',
    };

    const updatedSiswaList = [...activeAnalysis.siswaList, newSiswa];

    // Recompute stats
    const totalPeserta = updatedSiswaList.length;
    const scores = updatedSiswaList.map((s) => s.nilaiAkhir);
    const sum = scores.reduce((a, b) => a + b, 0);
    const rataRataKelas = Math.round((sum / totalPeserta) * 10) / 10;
    const nilaiTertinggi = Math.max(...scores);
    const nilaiTerendah = Math.min(...scores);
    const tuntasCount = updatedSiswaList.filter((s) => s.statusKetuntasan === 'Tuntas').length;
    const persentaseKetuntasan = Math.round((tuntasCount / totalPeserta) * 100);

    const updatedAnalysis: AnalisisHasil = {
      ...activeAnalysis,
      totalPeserta,
      rataRataKelas,
      nilaiTertinggi,
      nilaiTerendah,
      persentaseKetuntasan,
      siswaList: updatedSiswaList,
    };

    onUpdateAnalytics(
      analyticsList.map((a) => (a.id === activeAnalysis.id ? updatedAnalysis : a))
    );

    setNewSiswaNama('');
    setNewSiswaNisn('');
    setNewSiswaNilai(85);
    setIsInputModalOpen(false);
  };

  const handleExportExcel = () => {
    if (!activeAnalysis) return;
    exportToExcel(`Analisis_Hasil_${activeAnalysis.namaAsesmen.replace(/\s+/g, '_')}`, {
      siswaList: activeAnalysis.siswaList,
      profil,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Analisis Hasil Belajar &amp; Ketercapaian TP
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              KKTP: {activeAnalysis?.kktp || 75}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Otomatis menghitung ketuntasan kelas, per butir soal, per TP, serta mengidentifikasi siswa remedial
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeAnalysis && onOpenRemedialWithAnalytics && (
            <button
              onClick={() => onOpenRemedialWithAnalytics(activeAnalysis)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Sparkles className="w-4 h-4" /> Susun Program Remedial &amp; Pengayaan
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Unduh Rekap Excel
          </button>
        </div>
      </div>

      {activeAnalysis && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                Peserta Didik
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {activeAnalysis.totalPeserta} Siswa
              </p>
              <span className="text-[10px] text-slate-500">Terdaftar dalam asesmen</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                Rata-Rata Kelas
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {activeAnalysis.rataRataKelas}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {activeAnalysis.rataRataKelas >= activeAnalysis.kktp ? 'Di Atas KKTP' : 'Di Bawah KKTP'}
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                Ketuntasan Kelas
              </span>
              <p className="text-2xl font-black text-blue-700 mt-1">
                {activeAnalysis.persentaseKetuntasan}%
              </p>
              <span className="text-[10px] text-slate-500">Target minimal 75%</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                Nilai Tertinggi
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {activeAnalysis.nilaiTertinggi}
              </p>
              <span className="text-[10px] text-slate-500">Skor maksimum siswa</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                Nilai Terendah
              </span>
              <p className="text-2xl font-black text-rose-700 mt-1">
                {activeAnalysis.nilaiTerendah}
              </p>
              <span className="text-[10px] text-rose-600 font-semibold">Perlu remedial</span>
            </div>
          </div>

          {/* TP Mastery & Grade Distribution Visuals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TP Mastery Progress */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Ketercapaian Tujuan Pembelajaran (TP)
                </h3>
                <span className="text-xs text-slate-500 font-medium">Berdasarkan Butir Soal</span>
              </div>

              <div className="space-y-3">
                {activeAnalysis.ketercapaianTP.map((tp, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">
                        [{tp.tpKode}] {tp.materi}
                      </span>
                      <span
                        className={`font-bold ${
                          tp.persentaseCapaian >= 75 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {tp.persentaseCapaian}% ({tp.status})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          tp.persentaseCapaian >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${tp.persentaseCapaian}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Distribusi Nilai Peserta Didik</h3>
                <span className="text-xs text-slate-500 font-medium">KKTP: {activeAnalysis.kktp}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-3 text-center">
                {activeAnalysis.distribusiNilai.map((d, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-lg font-black text-slate-800">{d.jumlah}</p>
                    <span className="text-[11px] font-bold text-slate-500">{d.rentang}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-600">Siswa Tuntas (&gt;= {activeAnalysis.kktp}):</span>
                <span className="font-bold text-emerald-700">
                  {activeAnalysis.siswaList.filter((s) => s.statusKetuntasan === 'Tuntas').length} Siswa
                </span>
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Nilai Siswa ({activeAnalysis.siswaList.length} Orang)
                </h3>
                <p className="text-xs text-slate-500">
                  Status ketuntasan dihitung otomatis berdasarkan KKTP ({activeAnalysis.kktp})
                </p>
              </div>

              <button
                onClick={() => setIsInputModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Siswa
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-bold">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-12">No</th>
                    <th className="px-3 py-2.5">NISN</th>
                    <th className="px-4 py-2.5">Nama Peserta Didik</th>
                    <th className="px-3 py-2.5 text-center">Nilai Akhir</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5">Rekomendasi Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {activeAnalysis.siswaList.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-3 py-2.5 text-center font-bold text-slate-700">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-500">{s.nisn}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">{s.nama}</td>
                      <td className="px-3 py-2.5 text-center font-black text-sm text-slate-900">
                        {s.nilaiAkhir}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.statusKetuntasan === 'Tuntas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.statusKetuntasan}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-[11px]">{s.catatan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* INPUT SISWA MODAL */}
      {isInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Input Nilai Siswa</h3>

            <form onSubmit={handleAddSiswa} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={newSiswaNama}
                  onChange={(e) => setNewSiswaNama(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Contoh: Muhammad Ihsan"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NISN (Opsional)</label>
                <input
                  type="text"
                  value={newSiswaNisn}
                  onChange={(e) => setNewSiswaNisn(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="0081234567"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nilai Akhir (0 - 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={newSiswaNilai}
                  onChange={(e) => setNewSiswaNilai(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInputModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
