import React, { useState } from 'react';
import {
  QuranAssessmentRecord,
  Fase,
  Kelas,
  ProfilSekolah,
} from '../../types/curriculum';
import {
  BookMarked,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  Calendar,
  Award,
  Search,
} from 'lucide-react';
import { exportToWordDoc } from '../../utils/exportUtils';

interface Props {
  quranRecords: QuranAssessmentRecord[];
  onUpdateQuranRecords: (records: QuranAssessmentRecord[]) => void;
  profil: ProfilSekolah;
}

export const QuranAssessmentModule: React.FC<Props> = ({
  quranRecords,
  onUpdateQuranRecords,
  profil,
}) => {
  const [activeTab, setActiveTab] = useState<'tahfiz' | 'tilawah'>('tahfiz');
  const [filterKelas, setFilterKelas] = useState<'SEMUA' | 'X' | 'XI' | 'XII'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for new assessment
  const [formNama, setFormNama] = useState('');
  const [formKelas, setFormKelas] = useState<Kelas>('X');
  const [formFase, setFormFase] = useState<Fase>('E');
  const [formTipe, setFormTipe] = useState<'Tahfiz' | 'Tilawah'>('Tahfiz');
  const [formSurahAyat, setFormSurahAyat] = useState('');
  const [formTargetJuz, setFormTargetJuz] = useState('Juz 30 (Fase E Target 2 Juz)');
  const [scoreMakhraj, setScoreMakhraj] = useState<number>(4);
  const [scoreTajwid, setScoreTajwid] = useState<number>(4);
  const [scoreKelancaran, setScoreKelancaran] = useState<number>(3);
  const [scoreFashahah, setScoreFashahah] = useState<number>(4);
  const [scoreMurojaah, setScoreMurojaah] = useState<number>(4);
  const [catatanGuru, setCatatanGuru] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  // Filter records
  const filteredRecords = quranRecords.filter((r) => {
    if (r.tipe !== (activeTab === 'tahfiz' ? 'Tahfiz' : 'Tilawah')) return false;
    if (filterKelas !== 'SEMUA' && r.kelas !== filterKelas) return false;
    if (searchQuery.trim()) {
      return (
        r.namaSiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.surahAyat.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleOpenAdd = (type: 'Tahfiz' | 'Tilawah') => {
    setFormTipe(type);
    setFormNama('');
    setFormKelas('X');
    setFormFase('E');
    setFormSurahAyat(type === 'Tahfiz' ? 'Q.S. An-Naba/78: 1-40' : 'Q.S. Al-Baqarah/2: 148');
    setFormTargetJuz('Target 2 Juz (Fase E)');
    setScoreMakhraj(4);
    setScoreTajwid(4);
    setScoreKelancaran(3);
    setScoreFashahah(4);
    setScoreMurojaah(4);
    setCatatanGuru('');
    setRekomendasi('');
    setIsVerified(true);
    setIsAddModalOpen(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-compute final score (0-100)
    const totalRaw =
      scoreMakhraj +
      scoreTajwid +
      scoreKelancaran +
      scoreFashahah +
      (formTipe === 'Tahfiz' ? scoreMurojaah : 0);

    const maxRaw = formTipe === 'Tahfiz' ? 20 : 16;
    const finalScore = Math.round((totalRaw / maxRaw) * 100);

    let predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' = 'Sangat Baik';
    if (finalScore >= 90) predikat = 'Sangat Baik';
    else if (finalScore >= 75) predikat = 'Baik';
    else if (finalScore >= 65) predikat = 'Cukup';
    else predikat = 'Perlu Bimbingan';

    const newRec: QuranAssessmentRecord = {
      id: `QR-${Date.now()}`,
      tanggal: new Date().toISOString().split('T')[0],
      namaSiswa: formNama,
      kelas: formKelas,
      fase: formFase,
      tipe: formTipe,
      surahAyat: formSurahAyat,
      targetJuz: formTargetJuz,
      skorAspek: {
        makharijulHuruf: scoreMakhraj,
        tajwid: scoreTajwid,
        kelancaran: scoreKelancaran,
        fashahahAdab: scoreFashahah,
        murojaahKemandirian: formTipe === 'Tahfiz' ? scoreMurojaah : undefined,
      },
      nilaiAkhir: finalScore,
      predikat,
      catatanGuru: catatanGuru || 'Hafalan dan tilawah tertib, pertahankan pembiasaan.',
      rekomendasiPerbaikan: rekomendasi || 'Tingkatkan pengulangan mandiri di rumah.',
      statusHafalanTerverifikasi: isVerified,
    };

    onUpdateQuranRecords([newRec, ...quranRecords]);
    setIsAddModalOpen(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('Hapus rekaman asesmen Al-Qur\'an ini?')) {
      onUpdateQuranRecords(quranRecords.filter((r) => r.id !== id));
    }
  };

  const handleExportWord = () => {
    const tableHtml = `
      <h3 style="text-align: center; text-transform: uppercase;">REKAPITULASI ASESMEN ${activeTab.toUpperCase()} AL-QUR'AN</h3>
      <p style="text-align: center; font-size: 11pt; margin-bottom: 15px;">Target Capaian Kurikulum Merdeka: 2 Juz per Fase</p>
      <table border="1" style="border-collapse: collapse; width: 100%; font-size: 11pt;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>No</th>
            <th>Tanggal</th>
            <th>Nama Siswa</th>
            <th>Kelas</th>
            <th>Surah &amp; Ayat</th>
            <th>Target Juz</th>
            <th>Nilai</th>
            <th>Predikat</th>
            <th>Catatan Guru</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRecords
            .map(
              (r, idx) => `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td>${r.tanggal}</td>
              <td>${r.namaSiswa}</td>
              <td style="text-align: center;">${r.kelas}</td>
              <td>${r.surahAyat}</td>
              <td>${r.targetJuz}</td>
              <td style="text-align: center; font-weight: bold;">${r.nilaiAkhir}</td>
              <td style="text-align: center;">${r.predikat}</td>
              <td>${r.catatanGuru}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    exportToWordDoc(
      `Rekap_Asesmen_${activeTab}_AlQuran`,
      `Asesmen ${activeTab} Al-Qur'an PAIBP`,
      tableHtml,
      profil
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-emerald-600" />
              Asesmen Khusus Al-Qur'an (Tilawah &amp; Tahfiz)
            </h2>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Target 2 Juz Fase E &amp; F
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Penilaian autentik pembiasaan harian membaca tartil (makhraj &amp; tajwid) serta verifikasi hafalan 2 juz
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAdd(activeTab === 'tahfiz' ? 'Tahfiz' : 'Tilawah')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Input Nilai Setoran {activeTab === 'tahfiz' ? 'Tahfiz' : 'Tilawah'}
          </button>
        </div>
      </div>

      {/* Target Progress Bar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-300 uppercase tracking-wider">
              Target Fase E (Kelas X)
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/30">
              Target 2 Juz
            </span>
          </div>
          <p className="text-sm font-bold">Tilawah Tartil &amp; Tahfiz Berkelanjutan</p>
          <p className="text-xs text-slate-300 leading-relaxed">
            CP mewajibkan pembiasaan setoran dan murojaah mandiri hingga mencapai kelulusan target 2 juz pada akhir fase dengan makharijul huruf dan tajwid yang sahih.
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-300 uppercase tracking-wider">
              Target Fase F (Kelas XI &amp; XII)
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-[10px] border border-indigo-500/30">
              Target 2 Juz Lanjutan
            </span>
          </div>
          <p className="text-sm font-bold">Kemandirian Setoran &amp; Tajwid Aplikatif</p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Menuntaskan hafalan 2 juz lanjutan pada akhir fase serta mampu membaca dengan waqaf-ibtida', fashahah, dan adab penghormatan terhadap kalamullah.
          </p>
        </div>
      </div>

      {/* Tabs and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
            <button
              onClick={() => setActiveTab('tahfiz')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'tahfiz'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Penilaian Tahfiz (Hafalan)
            </button>
            <button
              onClick={() => setActiveTab('tilawah')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'tilawah'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Penilaian Tilawah (Membaca)
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500">Kelas:</span>
            {['SEMUA', 'X', 'XI', 'XII'].map((k) => (
              <button
                key={k}
                onClick={() => setFilterKelas(k as any)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                  filterKelas === k
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa / surah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <button
            onClick={handleExportWord}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Word
          </button>
        </div>
      </div>

      {/* Table Records */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada data rekaman {activeTab}. Klik tombol "Input Nilai Setoran" di atas.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="px-3 py-2.5 text-center w-12">No</th>
                  <th className="px-3 py-2.5">Tanggal</th>
                  <th className="px-3 py-2.5">Nama Siswa</th>
                  <th className="px-3 py-2.5 text-center">Kelas</th>
                  <th className="px-3 py-2.5">Surah &amp; Ayat Setoran</th>
                  <th className="px-3 py-2.5">Target Juz</th>
                  <th className="px-3 py-2.5 text-center">Makhraj</th>
                  <th className="px-3 py-2.5 text-center">Tajwid</th>
                  <th className="px-3 py-2.5 text-center">Kelancaran</th>
                  <th className="px-3 py-2.5 text-center">Nilai Akhir</th>
                  <th className="px-3 py-2.5 text-center">Predikat</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-2 py-2.5 text-center w-10">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRecords.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-3 py-3 text-center font-bold text-slate-700">{idx + 1}</td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{r.tanggal}</td>
                    <td className="px-3 py-3 font-bold text-slate-800">{r.namaSiswa}</td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">{r.kelas}</td>
                    <td className="px-3 py-3 font-medium text-emerald-800">{r.surahAyat}</td>
                    <td className="px-3 py-3 text-slate-600 text-[11px]">{r.targetJuz}</td>
                    <td className="px-3 py-3 text-center font-mono">{r.skorAspek.makharijulHuruf}/4</td>
                    <td className="px-3 py-3 text-center font-mono">{r.skorAspek.tajwid}/4</td>
                    <td className="px-3 py-3 text-center font-mono">{r.skorAspek.kelancaran}/4</td>
                    <td className="px-3 py-3 text-center font-black text-sm text-emerald-700">
                      {r.nilaiAkhir}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {r.predikat}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {r.statusHafalanTerverifikasi ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Terverifikasi Guru
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          Menunggu Uji
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <button
                        onClick={() => handleDeleteRecord(r.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded"
                        title="Hapus rekaman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INPUT SETORAN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Input Asesmen {formTipe} Al-Qur'an
            </h3>

            <form onSubmit={handleSaveRecord} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Peserta Didik
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    placeholder="Contoh: Muhammad Ali"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formKelas}
                    onChange={(e) => {
                      const k = e.target.value as Kelas;
                      setFormKelas(k);
                      setFormFase(k === 'X' ? 'E' : 'F');
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="X">Kelas X (Fase E)</option>
                    <option value="XI">Kelas XI (Fase F)</option>
                    <option value="XII">Kelas XII (Fase F)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Surah &amp; Ayat
                  </label>
                  <input
                    type="text"
                    required
                    value={formSurahAyat}
                    onChange={(e) => setFormSurahAyat(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    placeholder="Q.S. Al-Mulk: 1-30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Capaian Juz
                  </label>
                  <input
                    type="text"
                    value={formTargetJuz}
                    onChange={(e) => setFormTargetJuz(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Rubric Aspect Ratings 1 - 4 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Penilaian Aspek Rubrik (Skala 1 - 4):
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-600">Makharijul Huruf (1-4)</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={scoreMakhraj}
                      onChange={(e) => setScoreMakhraj(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600">Ketepatan Tajwid (1-4)</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={scoreTajwid}
                      onChange={(e) => setScoreTajwid(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600">Kelancaran Setoran (1-4)</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={scoreKelancaran}
                      onChange={(e) => setScoreKelancaran(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600">Fashahah &amp; Adab (1-4)</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={scoreFashahah}
                      onChange={(e) => setScoreFashahah(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Guru &amp; Rekomendasi
                </label>
                <textarea
                  rows={2}
                  value={catatanGuru}
                  onChange={(e) => setCatatanGuru(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  placeholder="Catatan kelebihan dan bagian yang perlu diperbaiki..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Simpan Asesmen Al-Qur'an
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
