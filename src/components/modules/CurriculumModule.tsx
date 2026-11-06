import React, { useState } from 'react';
import {
  CapaianPembelajaran,
  TujuanPembelajaran,
  Fase,
  Kelas,
  ElemenPAI,
  Semester,
} from '../../types/curriculum';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  cpList: CapaianPembelajaran[];
  tpList: TujuanPembelajaran[];
  onUpdateTPList: (updated: TujuanPembelajaran[]) => void;
  onUpdateCPList: (updated: CapaianPembelajaran[]) => void;
  onSelectTPForGenerator?: (tp: TujuanPembelajaran) => void;
}

export const CurriculumModule: React.FC<Props> = ({
  cpList,
  tpList,
  onUpdateTPList,
  onUpdateCPList,
  onSelectTPForGenerator,
}) => {
  const [selectedFase, setSelectedFase] = useState<Fase>('E');
  const [selectedElemen, setSelectedElemen] = useState<ElemenPAI | 'SEMUA'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTP, setEditingTP] = useState<TujuanPembelajaran | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tp_list' | 'cp_list' | 'atp_map'>('tp_list');

  // Filtered CP & TP based on strictly selected Fase (NO PHASE MIXING - Section 4 Rule 4, 5, 6)
  const filteredCP = cpList.filter((cp) => cp.fase === selectedFase);

  const filteredTP = tpList.filter((tp) => {
    if (tp.fase !== selectedFase) return false;
    if (selectedElemen !== 'SEMUA' && tp.elemen !== selectedElemen) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tp.kode.toLowerCase().includes(q) ||
        tp.deskripsi.toLowerCase().includes(q) ||
        tp.materiPokok.some((m) => m.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Modal Form State
  const [formKode, setFormKode] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formElemen, setFormElemen] = useState<ElemenPAI>("Al-Qur'an Hadis");
  const [formKelas, setFormKelas] = useState<Kelas[]>(selectedFase === 'E' ? ['X'] : ['XI']);
  const [formSemester, setFormSemester] = useState<Semester>('1');
  const [formAlokasiJP, setFormAlokasiJP] = useState<number>(6);
  const [formMateri, setFormMateri] = useState<string>('');
  const [formIndikator, setFormIndikator] = useState<string>('');

  const openAddModal = () => {
    setEditingTP(null);
    setFormKode(selectedFase === 'E' ? 'E.BARU.1' : 'F.BARU.1');
    setFormDeskripsi('');
    setFormElemen("Al-Qur'an Hadis");
    setFormKelas(selectedFase === 'E' ? ['X'] : ['XI']);
    setFormSemester('1');
    setFormAlokasiJP(6);
    setFormMateri('');
    setFormIndikator('');
    setIsModalOpen(true);
  };

  const openEditModal = (tp: TujuanPembelajaran) => {
    setEditingTP(tp);
    setFormKode(tp.kode);
    setFormDeskripsi(tp.deskripsi);
    setFormElemen(tp.elemen);
    setFormKelas(tp.kelas);
    setFormSemester(tp.semester);
    setFormAlokasiJP(tp.alokasiJP);
    setFormMateri(tp.materiPokok.join(', '));
    setFormIndikator(tp.indikatorDefault.join('\n'));
    setIsModalOpen(true);
  };

  const handleSaveTP = (e: React.FormEvent) => {
    e.preventDefault();
    const materiArr = formMateri
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    const indikatorArr = formIndikator
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean);

    if (editingTP) {
      // Update
      const updated = tpList.map((item) =>
        item.id === editingTP.id
          ? {
              ...item,
              kode: formKode,
              deskripsi: formDeskripsi,
              elemen: formElemen,
              kelas: formKelas,
              semester: formSemester,
              alokasiJP: formAlokasiJP,
              materiPokok: materiArr.length > 0 ? materiArr : ['Materi esensial'],
              indikatorDefault: indikatorArr.length > 0 ? indikatorArr : ['Indikator kompetensi terukur'],
            }
          : item
      );
      onUpdateTPList(updated);
    } else {
      // Add new
      const correspondingCP = cpList.find(
        (c) => c.fase === selectedFase && c.elemen === formElemen
      );
      const newTP: TujuanPembelajaran = {
        id: `TP-${selectedFase}-CUSTOM-${Date.now()}`,
        fase: selectedFase,
        kelas: formKelas,
        semester: formSemester,
        elemen: formElemen,
        cpId: correspondingCP?.id || `CP-${selectedFase}-${formElemen}`,
        kode: formKode,
        deskripsi: formDeskripsi,
        alokasiJP: formAlokasiJP,
        materiPokok: materiArr.length > 0 ? materiArr : ['Materi esensial'],
        indikatorDefault: indikatorArr.length > 0 ? indikatorArr : ['Indikator kompetensi terukur'],
        isCustom: true,
      };
      onUpdateTPList([...tpList, newTP]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteTP = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus Tujuan Pembelajaran ini?')) {
      onUpdateTPList(tpList.filter((item) => item.id !== id));
    }
  };

  const handleDuplicateTP = (tp: TujuanPembelajaran) => {
    const copy: TujuanPembelajaran = {
      ...tp,
      id: `TP-${tp.fase}-COPY-${Date.now()}`,
      kode: `${tp.kode}.SALIN`,
      deskripsi: `${tp.deskripsi} (Salinan)`,
      isCustom: true,
    };
    onUpdateTPList([...tpList, copy]);
  };

  const exportCurriculumToExcel = () => {
    const data = filteredTP.map((tp, idx) => {
      const cp = cpList.find((c) => c.id === tp.cpId);
      return {
        No: idx + 1,
        Fase: tp.fase,
        Kelas: tp.kelas.join(', '),
        Semester: tp.semester === '1' ? 'Ganjil' : 'Genap',
        Elemen: tp.elemen,
        'Capaian Pembelajaran (CP)': cp?.deskripsi || '',
        'Kode TP': tp.kode,
        'Tujuan Pembelajaran (TP)': tp.deskripsi,
        'Alokasi JP': tp.alokasiJP,
        'Materi Pokok': tp.materiPokok.join('; '),
        'Indikator Soal': tp.indikatorDefault.join('; '),
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, `Kurikulum_Fase_${selectedFase}`);
    XLSX.writeFile(wb, `Pemetaan_Kurikulum_PAIBP_Fase_${selectedFase}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Phase Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Manajemen Kurikulum PAIBP</h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              Resmi 2026
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Database Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), Alur Tujuan Pembelajaran (ATP), dan Materi Pokok
          </p>
        </div>

        {/* Phase Toggle - strictly separates Phase E and F */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
            <button
              onClick={() => {
                setSelectedFase('E');
                setSelectedElemen('SEMUA');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                selectedFase === 'E'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Fase E (Kelas X)</span>
            </button>
            <button
              onClick={() => {
                setSelectedFase('F');
                setSelectedElemen('SEMUA');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                selectedFase === 'F'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Fase F (Kelas XI &amp; XII)</span>
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Tambah TP
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('tp_list')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'tp_list'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Daftar Tujuan Pembelajaran ({filteredTP.length})
        </button>
        <button
          onClick={() => setActiveTab('cp_list')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'cp_list'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          5 Elemen &amp; Capaian Pembelajaran (CP)
        </button>
        <button
          onClick={() => setActiveTab('atp_map')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'atp_map'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Pemetaan ATP Semester &amp; JP
        </button>
      </div>

      {/* TAB 1: TP LIST */}
      {activeTab === 'tp_list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Elemen:
              </span>
              {[
                'SEMUA',
                "Al-Qur'an Hadis",
                'Akidah',
                'Akhlak',
                'Fikih',
                'Sejarah Peradaban Islam',
              ].map((el) => (
                <button
                  key={el}
                  onClick={() => setSelectedElemen(el as any)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition ${
                    selectedElemen === el
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {el}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode, materi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <button
                onClick={exportCurriculumToExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition"
                title="Ekspor ke Excel"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                Ekspor
              </button>
            </div>
          </div>

          {/* TP Cards List */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredTP.map((tp) => {
              const cp = cpList.find((c) => c.id === tp.cpId);
              return (
                <div
                  key={tp.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {tp.kode}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {tp.elemen}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Kelas {tp.kelas.join(', ')} • Semester {tp.semester === '1' ? 'Ganjil' : 'Genap'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {tp.alokasiJP} JP
                      </span>
                      {tp.isCustom && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          TP Kustom Guru
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {onSelectTPForGenerator && (
                        <button
                          onClick={() => onSelectTPForGenerator(tp)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                          title="Gunakan untuk membuat soal"
                        >
                          <Sparkles className="w-3 h-3" /> Buat Soal
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicateTP(tp)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                        title="Duplikasi TP"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(tp)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                        title="Edit TP"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTP(tp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Hapus TP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {tp.deskripsi}
                  </p>

                  {/* Materials & Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Materi Pokok:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {tp.materiPokok.map((m, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Indikator Asesmen:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                        {tp.indikatorDefault.map((ind, idx) => (
                          <li key={idx} className="line-clamp-1">{ind}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CP Traceability */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-600 shrink-0">Induk CP:</span>
                    <span className="line-clamp-1">{cp?.deskripsi}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CP LIST */}
      {activeTab === 'cp_list' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredCP.map((cp) => (
            <div
              key={cp.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-600 text-white">
                    {cp.elemen}
                  </span>
                  <span className="text-xs font-bold text-slate-700">Fase {cp.fase}</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terverifikasi BSKAP
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-xs text-slate-700 leading-relaxed font-serif text-[13px]">
                  "{cp.deskripsi}"
                </p>
              </div>

              <p className="text-[11px] text-slate-500">
                <strong>Sumber Resmi:</strong> {cp.sumberDokumen}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ATP MAP */}
      {activeTab === 'atp_map' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Alur Tujuan Pembelajaran (ATP) Fase {selectedFase}
            </h3>
            <span className="text-xs text-slate-500">
              Total JP Semester 1 &amp; 2: {filteredTP.reduce((acc, t) => acc + t.alokasiJP, 0)} JP
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Semester Ganjil */}
            <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/20">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">
                Semester Ganjil
              </h4>
              <div className="space-y-2">
                {filteredTP
                  .filter((t) => t.semester === '1')
                  .map((t, idx) => (
                    <div
                      key={t.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-emerald-700">{idx + 1}. [{t.kode}] {t.elemen}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{t.alokasiJP} JP</span>
                      </div>
                      <p className="text-slate-700 text-[11px] line-clamp-2">{t.deskripsi}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Semester Genap */}
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/20">
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">
                Semester Genap
              </h4>
              <div className="space-y-2">
                {filteredTP
                  .filter((t) => t.semester === '2')
                  .map((t, idx) => (
                    <div
                      key={t.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-blue-700">{idx + 1}. [{t.kode}] {t.elemen}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{t.alokasiJP} JP</span>
                      </div>
                      <p className="text-slate-700 text-[11px] line-clamp-2">{t.deskripsi}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT TP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingTP ? 'Edit Tujuan Pembelajaran' : 'Tambah Tujuan Pembelajaran Baru'}
            </h3>

            <form onSubmit={handleSaveTP} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode TP</label>
                  <input
                    type="text"
                    required
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    placeholder="Contoh: E.AQH.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Elemen</label>
                  <select
                    value={formElemen}
                    onChange={(e) => setFormElemen(e.target.value as ElemenPAI)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Tujuan Pembelajaran
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  placeholder="Rumuskan tujuan pembelajaran operasional dengan kata kerja..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value as Semester)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="1">Semester Ganjil (1)</option>
                    <option value="2">Semester Genap (2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alokasi JP</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={formAlokasiJP}
                    onChange={(e) => setFormAlokasiJP(parseInt(e.target.value, 10) || 6)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Materi Pokok (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={formMateri}
                  onChange={(e) => setFormMateri(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  placeholder="Contoh: Fastabiqul khairat, Makna Q.S. Al-Baqarah/2: 148"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Indikator Asesmen (Satu per baris)
                </label>
                <textarea
                  rows={2}
                  value={formIndikator}
                  onChange={(e) => setFormIndikator(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  placeholder="Contoh: Menjelaskan pengertian fastabiqul khairat..."
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Simpan TP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
