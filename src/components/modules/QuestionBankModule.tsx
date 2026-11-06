import React, { useState } from 'react';
import {
  QuestionItem,
  Fase,
  Kelas,
  ElemenPAI,
  BentukSoal,
  BloomLevel,
  TingkatKesulitan,
  ProfilSekolah,
} from '../../types/curriculum';
import {
  Database,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  CheckCircle,
  Eye,
  FileSpreadsheet,
  PackagePlus,
} from 'lucide-react';
import { exportToExcel } from '../../utils/exportUtils';

interface Props {
  questionBank: QuestionItem[];
  onUpdateQuestionBank: (updated: QuestionItem[]) => void;
  profil: ProfilSekolah;
  onAddQuestionsToPackage?: (selectedQuestions: QuestionItem[]) => void;
  isPro?: boolean;
  onOpenProModal?: (title?: string, desc?: string) => void;
}

export const QuestionBankModule: React.FC<Props> = ({
  questionBank,
  onUpdateQuestionBank,
  profil,
  onAddQuestionsToPackage,
  isPro = false,
  onOpenProModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFase, setFilterFase] = useState<'ALL' | Fase>('ALL');
  const [filterKelas, setFilterKelas] = useState<'ALL' | Kelas>('ALL');
  const [filterElemen, setFilterElemen] = useState<'ALL' | ElemenPAI>('ALL');
  const [filterBentuk, setFilterBentuk] = useState<'ALL' | BentukSoal>('ALL');
  const [filterBloom, setFilterBloom] = useState<'ALL' | BloomLevel>('ALL');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectQuestion, setInspectQuestion] = useState<QuestionItem | null>(null);

  // Filtered list
  const filtered = questionBank.filter((q) => {
    if (filterFase !== 'ALL' && q.fase !== filterFase) return false;
    if (filterKelas !== 'ALL' && q.kelas !== filterKelas) return false;
    if (filterElemen !== 'ALL' && q.elemen !== filterElemen) return false;
    if (filterBentuk !== 'ALL' && q.bentukSoal !== filterBentuk) return false;
    if (filterBloom !== 'ALL' && q.levelBloom !== filterBloom) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        q.pertanyaan.toLowerCase().includes(query) ||
        q.materi.toLowerCase().includes(query) ||
        q.tpKode.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((q) => q.id));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus butir soal ini dari bank?')) {
      onUpdateQuestionBank(questionBank.filter((q) => q.id !== id));
      setSelectedIds(selectedIds.filter((item) => item !== id));
      if (inspectQuestion?.id === id) setInspectQuestion(null);
    }
  };

  const handleDuplicate = (q: QuestionItem) => {
    if (!isPro && questionBank.length >= 5) {
      if (onOpenProModal) {
        onOpenProModal(
          'Batas Bank Soal Mode DEMO',
          'Penyimpanan Bank Soal pada mode DEMO dibatasi maksimal 5 butir soal. Aktifkan lisensi PRO untuk kapasitas ribuan soal.'
        );
      }
      return;
    }
    const copy: QuestionItem = {
      ...q,
      id: `Q-DUP-${Date.now()}`,
      pertanyaan: `${q.pertanyaan} (Duplikasi)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateQuestionBank([copy, ...questionBank]);
  };

  const handleExportExcel = () => {
    if (!isPro && onOpenProModal) {
      onOpenProModal('Export Bank Soal Excel 🔒 PRO', 'Ekspor seluruh database bank soal ke Excel tersedia pada versi PRO.');
      return;
    }
    exportToExcel(`Bank_Soal_PAIBP_Fase_${filterFase}`, {
      soalList: filtered,
      profil,
    });
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `Bank_Soal_PAIBP_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
  };

  const handleAddSelectedToPackage = () => {
    if (!onAddQuestionsToPackage || selectedIds.length === 0) return;
    const selected = questionBank.filter((q) => selectedIds.includes(q.id));
    onAddQuestionsToPackage(selected);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Bank Soal Digital PAIBP ({questionBank.length} Butir)
            </h2>
            {isPro ? (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                PRO Unlimited
              </span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                DEMO: Maks. 5 Soal
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola, filter, duplikasi, sunting, dan kelompokkan butir soal ke dalam paket asesmen
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && onAddQuestionsToPackage && (
            <button
              onClick={handleAddSelectedToPackage}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <PackagePlus className="w-4 h-4" /> Masukkan ke Paket ({selectedIds.length})
            </button>
          )}

          {/* Import Button (Requirement 3 & 4: Import bank soal dikunci di demo) */}
          <button
            onClick={() => {
              if (isPro) {
                alert('Silakan pilih file naskah soal JSON/Excel untuk diimpor.');
              } else {
                if (onOpenProModal) {
                  onOpenProModal(
                    'Import Bank Soal 🔒 PRO',
                    'Fitur impor bank soal secara massal dari Excel atau berkas digital lain merupakan fitur eksklusif PRO.'
                  );
                }
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition ${
              isPro
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Import Soal</span>
            {!isPro && (
              <span className="text-[9px] px-1 bg-amber-400 text-slate-950 rounded font-black">
                PRO
              </span>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
            {!isPro && (
              <span className="text-[9px] px-1 bg-amber-400 text-slate-950 rounded font-black">
                PRO
              </span>
            )}
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
          >
            <Download className="w-4 h-4 text-blue-600" /> JSON
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          {/* Fase */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Fase</label>
            <select
              value={filterFase}
              onChange={(e) => setFilterFase(e.target.value as any)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-semibold"
            >
              <option value="ALL">Semua Fase</option>
              <option value="E">Fase E</option>
              <option value="F">Fase F</option>
            </select>
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Kelas</label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value as any)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
            >
              <option value="ALL">Semua Kelas</option>
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </select>
          </div>

          {/* Elemen */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Elemen</label>
            <select
              value={filterElemen}
              onChange={(e) => setFilterElemen(e.target.value as any)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
            >
              <option value="ALL">Semua Elemen</option>
              <option value="Al-Qur'an Hadis">Al-Qur'an Hadis</option>
              <option value="Akidah">Akidah</option>
              <option value="Akhlak">Akhlak</option>
              <option value="Fikih">Fikih</option>
              <option value="Sejarah Peradaban Islam">SPI</option>
            </select>
          </div>

          {/* Bentuk Soal */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Bentuk</label>
            <select
              value={filterBentuk}
              onChange={(e) => setFilterBentuk(e.target.value as any)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
            >
              <option value="ALL">Semua Bentuk</option>
              <option value="Pilihan Ganda">Pilihan Ganda</option>
              <option value="Pilihan Ganda Kompleks">PG Kompleks</option>
              <option value="Menjodohkan">Menjodohkan</option>
              <option value="Uraian/Esai">Uraian / Esai</option>
              <option value="Studi Kasus">Studi Kasus</option>
            </select>
          </div>

          {/* Bloom */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Level Bloom</label>
            <select
              value={filterBloom}
              onChange={(e) => setFilterBloom(e.target.value as any)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-bold"
            >
              <option value="ALL">Semua Level</option>
              <option value="C1">C1 - Mengingat</option>
              <option value="C2">C2 - Memahami</option>
              <option value="C3">C3 - Menerapkan</option>
              <option value="C4">C4 - Menganalisis</option>
              <option value="C5">C5 - Mengevaluasi</option>
              <option value="C6">C6 - Mencipta</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Kata Kunci</label>
            <input
              type="text"
              placeholder="Cari teks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.length === filtered.length && filtered.length > 0}
              onChange={handleSelectAll}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Pilih Semua ({filtered.length} Butir)</span>
          </label>
          <span>Menampilkan {filtered.length} dari {questionBank.length} butir</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="px-3 py-2.5 text-center w-10">Pilih</th>
                <th className="px-3 py-2.5 text-center w-12">No</th>
                <th className="px-3 py-2.5">Fase / Elemen</th>
                <th className="px-3 py-2.5">Materi Pokok &amp; TP</th>
                <th className="px-4 py-2.5">Isi Pertanyaan</th>
                <th className="px-3 py-2.5 text-center">Bentuk</th>
                <th className="px-3 py-2.5 text-center">Bloom</th>
                <th className="px-3 py-2.5 text-center">Kunci</th>
                <th className="px-3 py-2.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((q, idx) => {
                const isSelected = selectedIds.includes(q.id);
                return (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(q.id)}
                        className="rounded text-emerald-600"
                      />
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700">{idx + 1}</td>
                    <td className="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold mr-1">
                        {q.fase}-{q.kelas}
                      </span>
                      {q.elemen}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800 max-w-xs">
                      <span className="font-mono text-emerald-700 font-bold">[{q.tpKode}]</span>{' '}
                      {q.materi}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-normal max-w-md">
                      <p className="line-clamp-2">{q.pertanyaan}</p>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap text-slate-600">
                      {q.bentukSoal}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap font-bold text-indigo-700">
                      {q.levelBloom}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-emerald-800">
                      {q.kunciJawaban}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setInspectQuestion(q)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(q)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Duplikasi"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT DETAIL MODAL */}
      {inspectQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
                  Fase {inspectQuestion.fase} • Kelas {inspectQuestion.kelas}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  [{inspectQuestion.tpKode}] {inspectQuestion.elemen}
                </span>
              </div>
              <button
                onClick={() => setInspectQuestion(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-semibold text-slate-500">Materi: {inspectQuestion.materi}</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-900 text-[13px] leading-relaxed">
                  {inspectQuestion.pertanyaan}
                </p>
              </div>

              {inspectQuestion.opsi && inspectQuestion.opsi.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700">Pilihan Jawaban:</span>
                  <div className="grid grid-cols-1 gap-1">
                    {inspectQuestion.opsi.map((op, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border ${
                          op.startsWith(inspectQuestion.kunciJawaban)
                            ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {op}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <p className="font-bold text-emerald-950">Kunci: {inspectQuestion.kunciJawaban}</p>
                <p className="text-emerald-900">{inspectQuestion.pembahasan}</p>
                {inspectQuestion.dalilRujukan?.surahAyat && (
                  <p className="text-[11px] text-emerald-800 italic pt-1 border-t border-emerald-200">
                    Rujukan Dalil: {inspectQuestion.dalilRujukan.surahAyat}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
