import React, { useState } from 'react';
import {
  PaketAsesmen,
  QuestionItem,
  ProfilSekolah,
  Fase,
  Kelas,
  Semester,
} from '../../types/curriculum';
import {
  PackageOpen,
  Plus,
  FileText,
  Printer,
  Download,
  Trash2,
  CheckCircle,
  Eye,
  Key,
  Clock,
  Layers,
} from 'lucide-react';
import { exportToWordDoc, exportToExcel } from '../../utils/exportUtils';

interface Props {
  packages: PaketAsesmen[];
  questionBank: QuestionItem[];
  onUpdatePackages: (pkgs: PaketAsesmen[]) => void;
  profil: ProfilSekolah;
}

export const AssessmentPackageModule: React.FC<Props> = ({
  packages,
  questionBank,
  onUpdatePackages,
  profil,
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string>(packages[0]?.id || '');
  const activePackage = packages.find((p) => p.id === selectedPackageId) || packages[0];
  const [viewMode, setViewMode] = useState<'student_test' | 'teacher_key' | 'kisi_rekap' | 'ljk'>('student_test');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating a new package
  const [namaPaket, setNamaPaket] = useState('Asesmen Sumatif Akhir Semester PAIBP');
  const [fase, setFase] = useState<Fase>('E');
  const [kelas, setKelas] = useState<Kelas>('X');
  const [semester, setSemester] = useState<Semester>('2');
  const [durasiMenit, setDurasiMenit] = useState<number>(90);
  const [jenisAsesmen, setJenisAsesmen] = useState<PaketAsesmen['jenisAsesmen']>('Sumatif Akhir Semester');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const handleOpenCreateModal = () => {
    // pre-select matching questions
    const matching = questionBank.filter((q) => q.fase === fase);
    setSelectedQuestionIds(matching.slice(0, 10).map((q) => q.id));
    setIsCreateModalOpen(true);
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenQuestions = questionBank.filter((q) => selectedQuestionIds.includes(q.id));

    const newPkg: PaketAsesmen = {
      id: `PKG-${Date.now()}`,
      namaPaket,
      satuanPendidikan: profil.namaSekolah,
      mataPelajaran: 'Pendidikan Agama Islam dan Budi Pekerti',
      fase,
      kelas,
      semester,
      tahunPelajaran: profil.tahunPelajaran,
      jenisAsesmen,
      materiCakupan: Array.from(new Set(chosenQuestions.map((q) => q.materi))),
      durasiMenit,
      totalSoal: chosenQuestions.length,
      petunjukUmum:
        '1. Mulailah dengan membaca basmalah.\n2. Isikan identitas pada lembar jawaban secara lengkap.\n3. Dahulukan menjawab soal yang Anda anggap mudah.\n4. Periksa kembali seluruh jawaban sebelum diserahkan.',
      kisiKisiList: chosenQuestions.map((q, idx) => ({
        id: `KISI-${q.id}`,
        nomorUrut: idx + 1,
        fase: q.fase,
        kelas: q.kelas,
        semester: q.semester,
        elemen: q.elemen,
        cpDeskripsi: q.materi,
        tpKode: q.tpKode,
        tpDeskripsi: q.materi,
        materi: q.materi,
        indikatorSoal: q.indikator,
        levelBloom: q.levelBloom,
        levelSOLO: q.levelSOLO,
        kesulitan: q.kesulitan,
        bentukSoal: q.bentukSoal,
        nomorSoalPaket: idx + 1,
      })),
      soalIds: chosenQuestions.map((q) => q.id),
      soalList: chosenQuestions,
      kunciDanPembahasanTerpisah: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdatePackages([newPkg, ...packages]);
    setSelectedPackageId(newPkg.id);
    setIsCreateModalOpen(false);
  };

  const handleDeletePackage = (id: string) => {
    if (confirm('Hapus paket asesmen ini?')) {
      onUpdatePackages(packages.filter((p) => p.id !== id));
    }
  };

  // Export Student Test Sheet (NO ANSWERS - Section 5 Module 12 requirement)
  const handleExportStudentDoc = () => {
    if (!activePackage) return;

    let itemsHtml = '';
    activePackage.soalList.forEach((q, idx) => {
      itemsHtml += `
        <div style="margin-bottom: 18px; page-break-inside: avoid;">
          <p style="margin: 0 0 6px 0; font-weight: bold;">
            ${idx + 1}. ${q.pertanyaan}
          </p>
      `;

      if (q.stimulus?.konten) {
        itemsHtml += `
          <div style="padding: 6px 10px; background-color: #f7f7f7; border-left: 3px solid #333; margin-bottom: 8px; font-style: italic;">
            ${q.stimulus.konten}
          </div>
        `;
      }

      if (q.opsi && q.opsi.length > 0) {
        itemsHtml += `<div style="margin-left: 15px;">`;
        q.opsi.forEach((op) => {
          itemsHtml += `<p style="margin: 3px 0;">${op}</p>`;
        });
        itemsHtml += `</div>`;
      } else if (q.bentukSoal === 'Uraian/Esai') {
        itemsHtml += `
          <div style="border: 1px dashed #999; height: 120px; margin: 10px 0; padding: 5px; color: #999; font-size: 10pt;">
            [Lembar Jawaban Uraian Peserta Didik]
          </div>
        `;
      }

      itemsHtml += `</div>`;
    });

    const fullContent = `
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="margin: 0; text-transform: uppercase;">${activePackage.namaPaket}</h3>
        <p style="margin: 3px 0; font-size: 11pt;">Mata Pelajaran: ${activePackage.mataPelajaran} | Kelas: ${activePackage.kelas} (Fase ${activePackage.fase}) | Waktu: ${activePackage.durasiMenit} Menit</p>
      </div>
      <div style="padding: 8px; border: 1px solid #333; margin-bottom: 20px; font-size: 10.5pt;">
        <strong>PETUNJUK UMUM:</strong><br>
        ${activePackage.petunjukUmum.replace(/\n/g, '<br>')}
      </div>
      ${itemsHtml}
    `;

    exportToWordDoc(
      `Naskah_Soal_${activePackage.namaPaket.replace(/\s+/g, '_')}`,
      'Naskah Soal Peserta Didik',
      fullContent,
      profil
    );
  };

  // Export Teacher Key & Discussion Sheet (Separate document)
  const handleExportTeacherKeyDoc = () => {
    if (!activePackage) return;

    let itemsHtml = `
      <h3 style="text-align: center; margin-bottom: 5px;">KUNCI JAWABAN &amp; PEMBAHASAN GURU</h3>
      <p style="text-align: center; font-size: 11pt; color: #666; margin-bottom: 15px;">(DOKUMEN RAHASIA PEGANGAN PENDIDIK)</p>
      <table border="1" style="border-collapse: collapse; width: 100%; font-size: 10.5pt;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="width: 8%;">No</th>
            <th style="width: 15%;">Bentuk Soal</th>
            <th style="width: 15%;">Kunci Jawaban</th>
            <th>Pembahasan &amp; Istidlal Dalil</th>
            <th style="width: 15%;">Kognitif</th>
          </tr>
        </thead>
        <tbody>
    `;

    activePackage.soalList.forEach((q, idx) => {
      itemsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td>${q.bentukSoal}</td>
          <td style="text-align: center; font-weight: bold; color: #006600;">${q.kunciJawaban}</td>
          <td>
            ${q.pembahasan}<br>
            ${q.dalilRujukan?.surahAyat ? `<small style="color: #004488;"><strong>Dalil:</strong> ${q.dalilRujukan.surahAyat}</small>` : ''}
          </td>
          <td style="text-align: center;">${q.levelBloom} (${q.kategoriKognitif})</td>
        </tr>
      `;
    });

    itemsHtml += `</tbody></table>`;

    exportToWordDoc(
      `Kunci_Jawaban_Guru_${activePackage.namaPaket.replace(/\s+/g, '_')}`,
      'Kunci Jawaban Guru',
      itemsHtml,
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
              <PackageOpen className="w-5 h-5 text-emerald-600" />
              Generator Paket Asesmen Siap Cetak
            </h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Dokumen Terpisah Guru &amp; Siswa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Menghasilkan naskah soal bersih tanpa kunci bagi siswa, naskah kunci &amp; rubrik bagi pendidik, serta lembar jawaban (LJK)
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Rancang Paket Asesmen Baru
        </button>
      </div>

      {/* Package Selector Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Pilih Paket:
          </span>
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackageId(pkg.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                pkg.id === activePackage?.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{pkg.namaPaket.substring(0, 35)}...</span>
              <span className="text-[10px] opacity-75 font-mono">({pkg.soalList.length} Soal)</span>
            </button>
          ))}
        </div>

        {activePackage && (
          <button
            onClick={() => handleDeletePackage(activePackage.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs flex items-center gap-1"
            title="Hapus paket ini"
          >
            <Trash2 className="w-4 h-4" /> Hapus Paket
          </button>
        )}
      </div>

      {/* Main Active Package View Card */}
      {activePackage && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Package Details Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {activePackage.jenisAsesmen}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Fase {activePackage.fase} • Kelas {activePackage.kelas} • Semester {activePackage.semester}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {activePackage.durasiMenit} Menit
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">{activePackage.namaPaket}</h3>
              <p className="text-xs text-slate-500">
                Satuan Pendidikan: {activePackage.satuanPendidikan} • Total: {activePackage.soalList.length} Butir Soal
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportStudentDoc}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Download className="w-4 h-4" /> Unduh Naskah Soal Siswa (.doc)
              </button>
              <button
                onClick={handleExportTeacherKeyDoc}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Key className="w-4 h-4 text-emerald-400" /> Kunci &amp; Pembahasan Guru (.doc)
              </button>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold">
            <button
              onClick={() => setViewMode('student_test')}
              className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
                viewMode === 'student_test'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Tinjauan Naskah Soal Siswa (Tanpa Kunci)
            </button>
            <button
              onClick={() => setViewMode('teacher_key')}
              className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
                viewMode === 'teacher_key'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Key className="w-4 h-4 text-amber-500" />
              Dokumen Kunci &amp; Pembahasan Guru
            </button>
            <button
              onClick={() => setViewMode('ljk')}
              className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
                viewMode === 'ljk'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Printer className="w-4 h-4" />
              Format Lembar Jawaban Siswa (LJK)
            </button>
          </div>

          {/* VIEW: STUDENT TEST */}
          {viewMode === 'student_test' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block mb-1">PETUNJUK UMUM PENGERJAAN:</span>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {activePackage.petunjukUmum}
                </p>
              </div>

              <div className="space-y-3">
                {activePackage.soalList.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs"
                  >
                    <div className="flex items-start gap-2 font-bold text-slate-900 text-sm">
                      <span className="shrink-0">{idx + 1}.</span>
                      <p className="leading-snug">{q.pertanyaan}</p>
                    </div>

                    {q.stimulus && (
                      <div className="ml-5 p-2.5 bg-slate-50 border-l-2 border-emerald-500 text-slate-700 italic">
                        {q.stimulus.konten}
                      </div>
                    )}

                    {q.opsi && q.opsi.length > 0 && (
                      <div className="ml-5 space-y-1 pt-1">
                        {q.opsi.map((op, oIdx) => (
                          <div key={oIdx} className="text-slate-700 font-medium">
                            {op}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: TEACHER KEY */}
          {viewMode === 'teacher_key' && (
            <div className="space-y-3">
              {activePackage.soalList.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900">
                      Soal #{idx + 1} ({q.bentukSoal} • {q.levelBloom})
                    </span>
                    <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-mono font-bold">
                      Kunci: {q.kunciJawaban}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium">{q.pertanyaan}</p>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-600 space-y-1">
                    <p><strong>Pembahasan:</strong> {q.pembahasan}</p>
                    {q.dalilRujukan?.surahAyat && (
                      <p className="text-[11px] text-blue-700">
                        <strong>Rujukan Dalil:</strong> {q.dalilRujukan.surahAyat}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW: LJK */}
          {viewMode === 'ljk' && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs font-mono">
              <div className="text-center font-serif font-bold text-sm">
                LEMBAR JAWABAN PESERTA DIDIK (LJK)<br />
                {activePackage.namaPaket}
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3 font-sans">
                <div>Nama Siswa: ___________________________</div>
                <div>NISN: ___________________________</div>
                <div>Kelas: {activePackage.kelas}</div>
                <div>Tanda Tangan: ____________________</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                {activePackage.soalList.map((_, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded">
                    <span className="w-5 text-right font-bold text-slate-700">{idx + 1}.</span>
                    <span className="text-slate-400">[A] [B] [C] [D] [E]</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE PACKAGE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Rancang Paket Asesmen Baru</h3>

            <form onSubmit={handleCreatePackage} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Paket Asesmen</label>
                <input
                  type="text"
                  required
                  value={namaPaket}
                  onChange={(e) => setNamaPaket(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fase</label>
                  <select
                    value={fase}
                    onChange={(e) => setFase(e.target.value as Fase)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="E">Fase E</option>
                    <option value="F">Fase F</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value as Kelas)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durasi</label>
                  <input
                    type="number"
                    value={durasiMenit}
                    onChange={(e) => setDurasiMenit(parseInt(e.target.value, 10) || 60)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Butir Soal dari Bank ({selectedQuestionIds.length} Dipilih)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                  {questionBank
                    .filter((q) => q.fase === fase)
                    .map((q) => (
                      <label
                        key={q.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.includes(q.id)}
                          onChange={() => {
                            if (selectedQuestionIds.includes(q.id)) {
                              setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== q.id));
                            } else {
                              setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                            }
                          }}
                          className="rounded text-emerald-600"
                        />
                        <span className="font-mono text-emerald-700 font-bold">[{q.tpKode}]</span>
                        <span className="truncate">{q.pertanyaan}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={selectedQuestionIds.length === 0}
                  className="px-4 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Buat Paket Asesmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
