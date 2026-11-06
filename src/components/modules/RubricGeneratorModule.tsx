import React, { useState } from 'react';
import { RubrikItem, ProfilSekolah } from '../../types/curriculum';
import { Sliders, Sparkles, Plus, Download, FileText, CheckCircle2, RotateCw } from 'lucide-react';
import { callGenerateRubricAPI } from '../../services/aiService';
import { exportToWordDoc } from '../../utils/exportUtils';

interface Props {
  rubricList: RubrikItem[];
  onUpdateRubricList: (list: RubrikItem[]) => void;
  profil: ProfilSekolah;
}

export const RubricGeneratorModule: React.FC<Props> = ({
  rubricList,
  onUpdateRubricList,
  profil,
}) => {
  const [selectedRubricId, setSelectedRubricId] = useState<string>(rubricList[0]?.id || '');
  const activeRubric = rubricList.find((r) => r.id === selectedRubricId) || rubricList[0];

  const [tpKode, setTpKode] = useState('E.F.2');
  const [tpDeskripsi, setTpDeskripsi] = useState(
    'Menjelaskan lima prinsip dasar hukum Islam (al-kulliyat al-khamsah) dan menganalisis contoh upaya menjaganya.'
  );
  const [materi, setMateri] = useState('Al-Kulliyat Al-Khamsah');
  const [bentukAsesmen, setBentukAsesmen] = useState('Uraian / Studi Kasus Analitis');
  const [judulTugas, setJudulTugas] = useState('Analisis Dilema Etika Medis dan Perlindungan Jiwa (Hifz An-Nafs)');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateRubric = async () => {
    setIsLoading(true);
    try {
      const generated = await callGenerateRubricAPI({
        tpKode,
        tpDeskripsi,
        materi,
        bentukAsesmen,
        judulTugas,
      });

      onUpdateRubricList([generated, ...rubricList]);
      setSelectedRubricId(generated.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportWord = () => {
    if (!activeRubric) return;

    const docHtml = `
      <h3 style="text-align: center; text-transform: uppercase;">RUBRIK PENILAIAN ASESMEN AUTENTIK</h3>
      <table style="width: 100%; border: none; font-size: 11pt; margin-bottom: 15px;">
        <tr><td style="width: 25%;">Satuan Pendidikan</td><td>: ${profil.namaSekolah}</td></tr>
        <tr><td>Judul Asesmen</td><td>: ${activeRubric.judul}</td></tr>
        <tr><td>Tujuan Pembelajaran</td><td>: [${activeRubric.tpKode}]</td></tr>
        <tr><td>Bentuk Asesmen</td><td>: ${activeRubric.bentukAsesmen}</td></tr>
        <tr><td>Skala Penilaian</td><td>: 1 s/d ${activeRubric.skala}</td></tr>
      </table>

      <h4 style="margin: 10px 0 5px 0;">TABEL DESKRIPTOR ASPEK PENILAIAN</h4>
      <table border="1" style="border-collapse: collapse; width: 100%; font-size: 10.5pt;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="width: 20%;">Aspek &amp; Bobot</th>
            <th style="width: 20%;">Sangat Baik (Skor 4)</th>
            <th style="width: 20%;">Baik (Skor 3)</th>
            <th style="width: 20%;">Cukup (Skor 2)</th>
            <th style="width: 20%;">Perlu Bimbingan (Skor 1)</th>
          </tr>
        </thead>
        <tbody>
          ${activeRubric.aspekPenilaian
            .map(
              (a) => `
            <tr>
              <td><strong>${a.namaAspek}</strong><br><small style="color: #666;">Bobot: ${a.bobotPersen}%</small></td>
              <td>${a.deskriptor.level4}</td>
              <td>${a.deskriptor.level3}</td>
              <td>${a.deskriptor.level2}</td>
              <td>${a.deskriptor.level1}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <h4 style="margin: 15px 0 5px 0;">PEDOMAN PENSKORAN &amp; KRITERIA KKTP</h4>
      <p style="font-size: 11pt;">${activeRubric.pedomanPenskoran}</p>
      <ul>
        <li>Sangat Baik: ${activeRubric.kktpRentang.sangatBaik}</li>
        <li>Baik: ${activeRubric.kktpRentang.baik}</li>
        <li>Cukup: ${activeRubric.kktpRentang.cukup}</li>
        <li>Perlu Bimbingan: ${activeRubric.kktpRentang.perluBimbingan}</li>
      </ul>
    `;

    exportToWordDoc(
      `Rubrik_${activeRubric.tpKode}_${activeRubric.bentukAsesmen.replace(/\s+/g, '_')}`,
      'Rubrik Penilaian Asesmen PAIBP',
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
            <Sliders className="w-5 h-5 text-emerald-600" />
            Generator Rubrik Penilaian Otomatis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Merancang rubrik analitik skala 1 - 4 terpadu dengan KKTP, kriteria dalil, konsep syariat, dan analisis solutif
          </p>
        </div>

        {activeRubric && (
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition"
          >
            <FileText className="w-4 h-4 text-blue-600" /> Unduh Rubrik Word (.doc)
          </button>
        )}
      </div>

      {/* Generator Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Parameter Pembuatan Rubrik AI
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Target TP</label>
            <input
              type="text"
              value={tpKode}
              onChange={(e) => setTpKode(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              placeholder="E.F.2"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Materi Pembelajaran</label>
            <input
              type="text"
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
              placeholder="Al-Kulliyat Al-Khamsah"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Bentuk Asesmen</label>
            <select
              value={bentukAsesmen}
              onChange={(e) => setBentukAsesmen(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            >
              <option value="Uraian / Studi Kasus Analitis">Uraian / Studi Kasus Analitis</option>
              <option value="Praktik Khotbah & Tablig">Praktik Khotbah &amp; Tablig</option>
              <option value="Proyek Riset Maslahat">Proyek Riset Maslahat</option>
              <option value="Presentasi Kolaboratif">Presentasi Kolaboratif</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Judul Tugas / Aktivitas Asesmen
          </label>
          <input
            type="text"
            value={judulTugas}
            onChange={(e) => setJudulTugas(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            placeholder="Analisis Dilema Etika Medis dan Perlindungan Jiwa (Hifz An-Nafs)"
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={handleGenerateRubric}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            {isLoading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>AI Merancang Rubrik...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Hasilkan Rubrik Otomatis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rubric View */}
      {activeRubric && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                TP [{activeRubric.tpKode}] • {activeRubric.bentukAsesmen}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">{activeRubric.judul}</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Skala Standar 1 s/d 4</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="px-4 py-3 w-48">Aspek &amp; Bobot</th>
                  <th className="px-3 py-3">Sangat Baik (Skor 4)</th>
                  <th className="px-3 py-3">Baik (Skor 3)</th>
                  <th className="px-3 py-3">Cukup (Skor 2)</th>
                  <th className="px-3 py-3">Perlu Bimbingan (Skor 1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activeRubric.aspekPenilaian.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800 align-top">
                      <p>{a.namaAspek}</p>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold">
                        Bobot: {a.bobotPersen}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700 bg-emerald-50/20 align-top leading-relaxed text-[11px]">
                      {a.deskriptor.level4}
                    </td>
                    <td className="px-3 py-3 text-slate-700 align-top leading-relaxed text-[11px]">
                      {a.deskriptor.level3}
                    </td>
                    <td className="px-3 py-3 text-slate-700 align-top leading-relaxed text-[11px]">
                      {a.deskriptor.level2}
                    </td>
                    <td className="px-3 py-3 text-slate-600 bg-amber-50/20 align-top leading-relaxed text-[11px]">
                      {a.deskriptor.level1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* KKTP Conversion */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="font-bold text-emerald-900">Sangat Baik (A)</p>
              <p className="text-emerald-700 font-mono text-[11px]">
                {activeRubric.kktpRentang.sangatBaik}
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="font-bold text-blue-900">Baik (B)</p>
              <p className="text-blue-700 font-mono text-[11px]">{activeRubric.kktpRentang.baik}</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="font-bold text-amber-900">Cukup (C)</p>
              <p className="text-amber-700 font-mono text-[11px]">{activeRubric.kktpRentang.cukup}</p>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="font-bold text-rose-900">Perlu Bimbingan (D)</p>
              <p className="text-rose-700 font-mono text-[11px]">
                {activeRubric.kktpRentang.perluBimbingan}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
