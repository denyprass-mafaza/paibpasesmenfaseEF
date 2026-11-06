import React, { useState } from 'react';
import {
  CapaianPembelajaran,
  TujuanPembelajaran,
  KisiKisiItem,
  Fase,
  Kelas,
  Semester,
  ElemenPAI,
  BentukSoal,
  BloomLevel,
  SoloLevel,
  TingkatKesulitan,
  ProfilSekolah,
} from '../../types/curriculum';
import {
  FileSpreadsheet,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Printer,
  FileText,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { exportToExcel, exportToWordDoc } from '../../utils/exportUtils';

interface Props {
  cpList: CapaianPembelajaran[];
  tpList: TujuanPembelajaran[];
  profil: ProfilSekolah;
  onGenerateQuestionsFromMatrix: (kisiKisi: KisiKisiItem[]) => void;
}

export const KisiKisiModule: React.FC<Props> = ({
  cpList,
  tpList,
  profil,
  onGenerateQuestionsFromMatrix,
}) => {
  const [fase, setFase] = useState<Fase>('E');
  const [kelas, setKelas] = useState<Kelas>('X');
  const [semester, setSemester] = useState<Semester>('2');
  const [elemen, setElemen] = useState<ElemenPAI>('Fikih');
  const [jenisAsesmen, setJenisAsesmen] = useState('Sumatif Akhir Semester');

  // Filter available TPs based on selected Fase and Element (Rule 4, 5: strictly isolate)
  const availableTPs = tpList.filter((tp) => tp.fase === fase && tp.elemen === elemen);
  const [selectedTPId, setSelectedTPId] = useState<string>(
    availableTPs[0]?.id || ''
  );

  // Active TP
  const activeTP =
    availableTPs.find((tp) => tp.id === selectedTPId) || availableTPs[0];

  const availableCP = cpList.find((cp) => cp.fase === fase && cp.elemen === elemen);

  const [materi, setMateri] = useState<string>(activeTP?.materiPokok[0] || 'Al-Kulliyat Al-Khamsah');
  const [bentukSoal, setBentukSoal] = useState<BentukSoal>('Pilihan Ganda');
  const [levelBloom, setLevelBloom] = useState<BloomLevel>('C4');
  const [levelSolo, setLevelSolo] = useState<SoloLevel>('Relational');
  const [kesulitan, setKesulitan] = useState<TingkatKesulitan>('Sedang');
  const [jumlahButir, setJumlahButir] = useState<number>(5);

  // Generated matrix list
  const [kisiList, setKisiList] = useState<KisiKisiItem[]>([
    {
      id: 'KISI-INIT-1',
      nomorUrut: 1,
      fase: 'E',
      kelas: 'X',
      semester: '2',
      elemen: 'Fikih',
      cpDeskripsi:
        'Memahami sumber hukum Islam dan pentingnya menjaga lima prinsip dasar hukum Islam (al-kulliyat al-khamsah).',
      tpKode: 'E.F.2',
      tpDeskripsi:
        'Menjelaskan lima prinsip dasar hukum Islam dan menganalisis contoh upaya menjaganya.',
      materi: 'Al-Kulliyat Al-Khamsah - Hifz An-Nafs',
      indikatorSoal:
        'Disajikan kasus kebijakan keselamatan jalan raya, peserta didik dapat menganalisis implementasi hifz an-nafs dalam hukum Islam.',
      levelBloom: 'C4',
      levelSOLO: 'Relational',
      kesulitan: 'Sedang',
      bentukSoal: 'Pilihan Ganda',
      nomorSoalPaket: 1,
    },
    {
      id: 'KISI-INIT-2',
      nomorUrut: 2,
      fase: 'E',
      kelas: 'X',
      semester: '2',
      elemen: 'Fikih',
      cpDeskripsi:
        'Memahami sumber hukum Islam dan pentingnya menjaga lima prinsip dasar hukum Islam (al-kulliyat al-khamsah).',
      tpKode: 'E.F.2',
      tpDeskripsi:
        'Menjelaskan lima prinsip dasar hukum Islam dan menganalisis contoh upaya menjaganya.',
      materi: 'Al-Kulliyat Al-Khamsah - Hifz Al-\'Aql',
      indikatorSoal:
        'Disajikan narasi bahaya zat adiktif, peserta didik dapat membuktikan keharaman narkoba berbasis pemeliharaan akal (hifz al-\'aql).',
      levelBloom: 'C4',
      levelSOLO: 'Relational',
      kesulitan: 'Sedang',
      bentukSoal: 'Pilihan Ganda',
      nomorSoalPaket: 2,
    },
  ]);

  // Handle Fase Change and auto-update Kelas
  const handleFaseChange = (newFase: Fase) => {
    setFase(newFase);
    if (newFase === 'E') {
      setKelas('X');
    } else {
      setKelas('XI');
    }
    const newAvail = tpList.filter((tp) => tp.fase === newFase && tp.elemen === elemen);
    if (newAvail.length > 0) {
      setSelectedTPId(newAvail[0].id);
      setMateri(newAvail[0].materiPokok[0] || '');
    }
  };

  const handleElemenChange = (newEl: ElemenPAI) => {
    setElemen(newEl);
    const newAvail = tpList.filter((tp) => tp.fase === fase && tp.elemen === newEl);
    if (newAvail.length > 0) {
      setSelectedTPId(newAvail[0].id);
      setMateri(newAvail[0].materiPokok[0] || '');
    }
  };

  const handleTPChange = (tpId: string) => {
    setSelectedTPId(tpId);
    const found = tpList.find((t) => t.id === tpId);
    if (found && found.materiPokok.length > 0) {
      setMateri(found.materiPokok[0]);
    }
  };

  const handleAddItemsToMatrix = () => {
    if (!activeTP) return;
    const itemsToAdd: KisiKisiItem[] = [];
    const baseNum = kisiList.length;

    for (let i = 0; i < jumlahButir; i++) {
      const num = baseNum + i + 1;
      const defaultInd =
        activeTP.indikatorDefault[i % activeTP.indikatorDefault.length] ||
        `Menganalisis keterkaitan materi ${materi} dalam kehidupan sehari-hari`;

      itemsToAdd.push({
        id: `KISI-${Date.now()}-${num}`,
        nomorUrut: num,
        fase,
        kelas,
        semester,
        elemen,
        cpDeskripsi: availableCP?.deskripsi || '',
        tpKode: activeTP.kode,
        tpDeskripsi: activeTP.deskripsi,
        materi,
        indikatorSoal: `Disajikan stimulus kontekstual, peserta didik dapat ${defaultInd.toLowerCase()} (butir ${num}).`,
        levelBloom,
        levelSOLO: levelSolo,
        kesulitan,
        bentukSoal,
        nomorSoalPaket: num,
      });
    }

    setKisiList([...kisiList, ...itemsToAdd]);
  };

  const handleDeleteItem = (id: string) => {
    const updated = kisiList
      .filter((k) => k.id !== id)
      .map((k, idx) => ({ ...k, nomorUrut: idx + 1, nomorSoalPaket: idx + 1 }));
    setKisiList(updated);
  };

  const handleClearAll = () => {
    if (confirm('Bersihkan seluruh baris kisi-kisi?')) {
      setKisiList([]);
    }
  };

  const handleExportWord = () => {
    const tableHtml = `
      <h3 style="text-align: center; margin-bottom: 5px;">KISI-KISI PENULISAN SOAL ASESMEN</h3>
      <table style="width: 100%; border: none; margin-bottom: 15px; font-size: 11pt;">
        <tr><td style="width: 25%;">Satuan Pendidikan</td><td>: ${profil.namaSekolah}</td></tr>
        <tr><td>Mata Pelajaran</td><td>: Pendidikan Agama Islam & Budi Pekerti</td></tr>
        <tr><td>Fase / Kelas</td><td>: Fase ${fase} / Kelas ${kelas}</td></tr>
        <tr><td>Jenis Asesmen</td><td>: ${jenisAsesmen}</td></tr>
        <tr><td>Jumlah Soal</td><td>: ${kisiList.length} Butir</td></tr>
      </table>

      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>No</th>
            <th>Capaian Pembelajaran (CP)</th>
            <th>Tujuan Pembelajaran (TP)</th>
            <th>Materi Pokok</th>
            <th>Indikator Soal</th>
            <th>Level Kognitif</th>
            <th>Bentuk Soal</th>
            <th>No Soal</th>
          </tr>
        </thead>
        <tbody>
          ${kisiList
            .map(
              (k) => `
            <tr>
              <td style="text-align: center;">${k.nomorUrut}</td>
              <td>${k.cpDeskripsi}</td>
              <td>[${k.tpKode}] ${k.tpDeskripsi}</td>
              <td>${k.materi}</td>
              <td>${k.indikatorSoal}</td>
              <td style="text-align: center;">${k.levelBloom} (${k.levelSOLO})</td>
              <td style="text-align: center;">${k.bentukSoal}</td>
              <td style="text-align: center;">${k.nomorSoalPaket}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    exportToWordDoc(`Kisi_Kisi_PAIBP_Fase_${fase}_Kelas_${kelas}`, 'Kisi-Kisi Asesmen PAIBP', tableHtml, profil);
  };

  const handleExportExcel = () => {
    exportToExcel(`Kisi_Kisi_PAIBP_Fase_${fase}_Kelas_${kelas}`, {
      kisiKisiList: kisiList,
      profil,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Generator Kisi-Kisi Asesmen Terhubung
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kisi-kisi terstandarisasi Kemendikbudristek 11 kolom dan terhubung langsung 100% dengan Generator Soal AI
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onGenerateQuestionsFromMatrix(kisiList)}
            disabled={kisiList.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Sparkles className="w-4 h-4" />
            Generate Soal dari Kisi-Kisi Ini ({kisiList.length})
          </button>
        </div>
      </div>

      {/* Grid: Matrix Builder Configuration Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Langkah 1: Tentukan Parameter Indikator Kisi-Kisi
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Fase */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Fase</label>
            <select
              value={fase}
              onChange={(e) => handleFaseChange(e.target.value as Fase)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold bg-emerald-50/40 text-emerald-900"
            >
              <option value="E">Fase E (Kelas X)</option>
              <option value="F">Fase F (Kelas XI, XII)</option>
            </select>
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Kelas</label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value as Kelas)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              {fase === 'E' ? (
                <option value="X">Kelas X</option>
              ) : (
                <>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </>
              )}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as Semester)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              <option value="1">1 (Ganjil)</option>
              <option value="2">2 (Genap)</option>
            </select>
          </div>

          {/* Elemen */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Elemen</label>
            <select
              value={elemen}
              onChange={(e) => handleElemenChange(e.target.value as ElemenPAI)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
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

          {/* Jenis Asesmen */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Asesmen</label>
            <select
              value={jenisAsesmen}
              onChange={(e) => setJenisAsesmen(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              <option value="Sumatif Akhir Semester">Sumatif Akhir Semester (SAS)</option>
              <option value="Sumatif Tengah Semester">Sumatif Tengah Semester (STS)</option>
              <option value="Penilaian Formatif Bab">Penilaian Formatif Bab</option>
              <option value="Asesmen Diagnostik">Asesmen Diagnostik</option>
            </select>
          </div>

          {/* Bentuk Soal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Bentuk Soal</label>
            <select
              value={bentukSoal}
              onChange={(e) => setBentukSoal(e.target.value as BentukSoal)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
            >
              <option value="Pilihan Ganda">Pilihan Ganda</option>
              <option value="Pilihan Ganda Kompleks">Pilihan Ganda Kompleks</option>
              <option value="Benar/Salah">Benar/Salah</option>
              <option value="Menjodohkan">Menjodohkan</option>
              <option value="Isian Singkat">Isian Singkat</option>
              <option value="Uraian/Esai">Uraian/Esai</option>
              <option value="Studi Kasus">Studi Kasus</option>
            </select>
          </div>
        </div>

        {/* TP Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Pilih Tujuan Pembelajaran (TP)
            </label>
            <select
              value={activeTP?.id || ''}
              onChange={(e) => handleTPChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              {availableTPs.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  [{tp.kode}] {tp.deskripsi.substring(0, 70)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Materi Pokok Spesifik
            </label>
            <select
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              {activeTP?.materiPokok.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cognitive & Difficulty Setup */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Level Bloom</label>
            <select
              value={levelBloom}
              onChange={(e) => setLevelBloom(e.target.value as BloomLevel)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              <option value="C1">C1 - Mengingat (LOTS)</option>
              <option value="C2">C2 - Memahami (LOTS)</option>
              <option value="C3">C3 - Mengaplikasikan (MOTS)</option>
              <option value="C4">C4 - Menganalisis (HOTS)</option>
              <option value="C5">C5 - Mengevaluasi (HOTS)</option>
              <option value="C6">C6 - Mencipta (HOTS)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Level SOLO</label>
            <select
              value={levelSolo}
              onChange={(e) => setLevelSolo(e.target.value as SoloLevel)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              <option value="Unistructural">Unistructural (Satu Aspek)</option>
              <option value="Multistructural">Multistructural (Banyak Aspek)</option>
              <option value="Relational">Relational (Saling Terhubung)</option>
              <option value="Extended Abstract">Extended Abstract (Generalisasi Konseptual)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Tingkat Kesulitan</label>
            <select
              value={kesulitan}
              onChange={(e) => setKesulitan(e.target.value as TingkatKesulitan)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              <option value="Mudah">Mudah</option>
              <option value="Sedang">Sedang</option>
              <option value="Sukar">Sukar</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Jumlah Butir</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={jumlahButir}
                onChange={(e) => setJumlahButir(parseInt(e.target.value, 10) || 1)}
                className="w-20 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-center font-bold"
              />
              <button
                type="button"
                onClick={handleAddItemsToMatrix}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" /> Tambahkan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE DISPLAY */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Tabel Matriks Kisi-Kisi Asesmen ({kisiList.length} Butir)
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Format Resmi MGMP &amp; BSKAP</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportWord}
              disabled={kisiList.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition"
              title="Unduh Format Word .doc"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" /> Word
            </button>
            <button
              onClick={handleExportExcel}
              disabled={kisiList.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition"
              title="Unduh Format Excel .xlsx"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> Excel
            </button>
            <button
              onClick={handleClearAll}
              disabled={kisiList.length === 0}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Hapus Semua"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {kisiList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Belum ada baris kisi-kisi. Pilih parameter di atas dan klik "Tambahkan".
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="px-3 py-2.5 text-center w-12">No</th>
                  <th className="px-3 py-2.5">Capaian Pembelajaran (CP)</th>
                  <th className="px-3 py-2.5">Tujuan Pembelajaran (TP)</th>
                  <th className="px-3 py-2.5">Materi Pokok</th>
                  <th className="px-3 py-2.5">Indikator Soal</th>
                  <th className="px-3 py-2.5 text-center">Kognitif</th>
                  <th className="px-3 py-2.5 text-center">Bentuk</th>
                  <th className="px-3 py-2.5 text-center">No Soal</th>
                  <th className="px-2 py-2.5 text-center w-10">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {kisiList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-3 py-2 text-center font-bold text-slate-700">{k.nomorUrut}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-600 max-w-xs line-clamp-2">
                      {k.cpDeskripsi}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-800 max-w-xs">
                      <span className="font-mono text-emerald-700 font-bold">[{k.tpKode}]</span>{' '}
                      {k.tpDeskripsi}
                    </td>
                    <td className="px-3 py-2 text-slate-700 font-medium whitespace-nowrap">{k.materi}</td>
                    <td className="px-3 py-2 text-slate-600 text-[11px] max-w-sm">{k.indikatorSoal}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {k.levelBloom}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap text-slate-700">
                      {k.bentukSoal}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-slate-800">
                      #{k.nomorSoalPaket}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => handleDeleteItem(k.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded"
                        title="Hapus baris"
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
    </div>
  );
};
