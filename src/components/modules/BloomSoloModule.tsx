import React, { useState } from 'react';
import {
  Layers,
  HeartHandshake,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Brain,
  Smile,
  Compass,
} from 'lucide-react';
import { AppDatabase } from '../../services/storageService';

interface Props {
  db: AppDatabase;
}

export const BloomSoloModule: React.FC<Props> = ({ db }) => {
  const [activeTab, setActiveTab] = useState<'bloom' | 'solo' | 'deeplearning'>('bloom');

  // Compute bank distribution
  const total = db.questionBank.length || 1;
  const countC1 = db.questionBank.filter((q) => q.levelBloom === 'C1').length;
  const countC2 = db.questionBank.filter((q) => q.levelBloom === 'C2').length;
  const countC3 = db.questionBank.filter((q) => q.levelBloom === 'C3').length;
  const countC4 = db.questionBank.filter((q) => q.levelBloom === 'C4').length;
  const countC5 = db.questionBank.filter((q) => q.levelBloom === 'C5').length;
  const countC6 = db.questionBank.filter((q) => q.levelBloom === 'C6').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Integrasi Taksonomi Bloom, SOLO &amp; Deep Learning
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Panduan kognitif asesmen Pendidikan Agama Islam: dari penguasaan konsep dasar hingga refleksi nilai bermakna
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('bloom')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'bloom'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bloom Revisi (C1-C6)
          </button>
          <button
            onClick={() => setActiveTab('solo')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'solo'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Taksonomi SOLO
          </button>
          <button
            onClick={() => setActiveTab('deeplearning')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'deeplearning'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Deep Learning PAIBP
          </button>
        </div>
      </div>

      {/* TAB 1: BLOOM REVISI */}
      {activeTab === 'bloom' && (
        <div className="space-y-6">
          {/* Visual Bank Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Sebaran Butir Soal Bank Saat Ini (Total {db.questionBank.length} Soal)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { level: 'C1', label: 'Mengingat', count: countC1, domain: 'LOTS', color: 'bg-amber-500' },
                { level: 'C2', label: 'Memahami', count: countC2, domain: 'LOTS', color: 'bg-amber-600' },
                { level: 'C3', label: 'Mengaplikasikan', count: countC3, domain: 'MOTS', color: 'bg-blue-500' },
                { level: 'C4', label: 'Menganalisis', count: countC4, domain: 'HOTS', color: 'bg-emerald-500' },
                { level: 'C5', label: 'Mengevaluasi', count: countC5, domain: 'HOTS', color: 'bg-emerald-600' },
                { level: 'C6', label: 'Mencipta', count: countC6, domain: 'HOTS', color: 'bg-indigo-600' },
              ].map((b) => (
                <div key={b.level} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800">{b.level}</span>
                    <span className="text-[10px] text-slate-500">{b.domain}</span>
                  </div>
                  <p className="text-xl font-black text-slate-900">{b.count}</p>
                  <p className="text-[10px] text-slate-500 truncate">{b.label}</p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`${b.color} h-1.5 rounded-full`}
                      style={{ width: `${Math.min(100, (b.count / total) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Matrix for Teachers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                level: 'C1 - Mengingat (Remembering)',
                domain: 'LOTS',
                kko: 'Menyebutkan, mengenali, mengingat kembali, mendaftar, mencocokkan.',
                fokusPAI: 'Mengingat hafalan surah pilihan, lafaz ayat, tahun peristiwa sejarah Islam, nama tokoh.',
                contoh: 'Menyebutkan 5 rukun Islam atau menyebutkan perawi hadis syu\'ab al-iman.',
              },
              {
                level: 'C2 - Memahami (Understanding)',
                domain: 'LOTS',
                kko: 'Menjelaskan, mengklasifikasi, meringkas, mengilustrasikan, menerjemahkan.',
                fokusPAI: 'Menjelaskan makna ayat fastabiqul khairat, mengelompokkan 77 cabang iman ke dalam 3 ranah.',
                contoh: 'Menjelaskan perbedaan mendasar antara zakat, infak, dan sedekah.',
              },
              {
                level: 'C3 - Mengaplikasikan (Applying)',
                domain: 'MOTS',
                kko: 'Menerapkan, menghitung, mendemonstrasikan, menggunakan, mempraktikkan.',
                fokusPAI: 'Menerapkan kaidah tajwid saat membaca, menghitung pembagian warisan (Mawaris) sederhana.',
                contoh: 'Menghitung nominal tirkah istri yang memiliki anak (1/8 bagian bersih).',
              },
              {
                level: 'C4 - Menganalisis (Analyzing)',
                domain: 'HOTS',
                kko: 'Membedah, mengkorelasikan, membedakan, mengorganisasi, menguji hipotesis.',
                fokusPAI: 'Menganalisis implementasi Al-Kulliyat Al-Khamsah dalam keselamatan jalan atau perlindungan data digital.',
                contoh: 'Menganalisis bahaya pergaulan bebas terhadap ketahanan nasab dan hak waris anak.',
              },
              {
                level: 'C5 - Mengevaluasi (Evaluating)',
                domain: 'HOTS',
                kko: 'Menilai, mengkritik, mempertimbangkan, memutuskan, memvalidasi.',
                fokusPAI: 'Menilai keabsahan transaksi e-commerce kontemporer berdasarkan kaidah fikih muamalah.',
                contoh: 'Mengevaluasi sikap toleransi beragama dalam masyarakat majemuk tanpa mencampuradukkan akidah.',
              },
              {
                level: 'C6 - Mencipta (Creating)',
                domain: 'HOTS',
                kko: 'Merancang, merumuskan, membangun, mengkonstruksi, memproduksi solusi.',
                fokusPAI: 'Merancang rencana aksi nyata kampanye anti-bullying atau pakta integritas sekolah berlandaskan maqashid.',
                contoh: 'Merancang naskah khotbah bertema moderasi beragama dan pelestarian lingkungan hidup.',
              },
            ].map((card, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{card.level}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {card.domain}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Kata Kerja Operasional:</strong> {card.kko}
                </p>
                <p className="text-xs text-slate-600">
                  <strong>Fokus Pembelajaran PAIBP:</strong> {card.fokusPAI}
                </p>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-700 italic">
                  <strong>Contoh Soal:</strong> {card.contoh}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SOLO TAXONOMY */}
      {activeTab === 'solo' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Struktur Taksonomi SOLO (Structure of Observed Learning Outcomes)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Taksonomi SOLO mengukur kedalaman kompleksitas respon peserta didik: dari belum memahami konsep hingga mampu menggeneralisasikan prinsip ajaran Islam ke ranah kehidupan baru.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              {[
                {
                  level: 'Prestructural',
                  desc: 'Peserta didik tidak memiliki pemahaman atau menggunakan informasi yang salah.',
                  kriteria: 'Jawaban meleset jauh dari pokok ajaran syariat.',
                },
                {
                  level: 'Unistructural',
                  desc: 'Peserta didik memahami satu aspek relevan secara sederhana.',
                  kriteria: 'Dapat menyebutkan 1 dalil atau 1 contoh konkret tanpa elaborasi.',
                },
                {
                  level: 'Multistructural',
                  desc: 'Memahami beberapa aspek terpisah namun belum melihat keterkaitannya.',
                  kriteria: 'Dapat menyebutkan rukun nikah atau cabang iman secara lengkap berjejer.',
                },
                {
                  level: 'Relational',
                  desc: 'Mampu menghubungkan berbagai fakta menjadi satu sistem pemahaman terpadu.',
                  kriteria: 'Menghubungkan sifat malu dan amanah dengan pencegahan kecurangan akademik.',
                },
                {
                  level: 'Extended Abstract',
                  desc: 'Mampu melakukan konseptualisasi tingkat tinggi dan generalisasi ke situasi baru.',
                  kriteria: 'Menerapkan maqashid syariah untuk merumuskan etika kecerdasan buatan.',
                },
              ].map((s, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-extrabold text-blue-700 block text-xs">
                    {idx + 1}. {s.level}
                  </span>
                  <p className="text-slate-700 leading-relaxed text-[11px]">{s.desc}</p>
                  <p className="text-slate-500 text-[10px] pt-1 border-t border-slate-200">
                    <strong>Indikator:</strong> {s.kriteria}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEEP LEARNING ASSESSMENT */}
      {activeTab === 'deeplearning' && (
        <div className="space-y-6">
          {/* Deep Learning 3 Pillars Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-extrabold text-emerald-200">1. Berkesadaran (Mindful)</h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                Asesmen melatih kehadiran hati (khusyuk &amp; muraqabah) dalam beribadah, berpikir reflektif, serta menyadari bahwa seluruh amal perbuatan senantiasa diawasi Allah Swt.
              </p>
            </div>

            <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-extrabold text-indigo-200">2. Bermakna (Meaningful)</h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                Menghubungkan konsep fikih dan dalil Al-Qur'an dengan solusi permasalahan riil: pencegahan korupsi, adab bermedia sosial, kepedulian kelompok rentan, dan pelestarian bumi.
              </p>
            </div>

            <div className="bg-teal-900 text-white p-5 rounded-2xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
                <Smile className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-extrabold text-teal-200">3. Menggembirakan (Joyful)</h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                Penilaian dirancang apresiatif, memotivasi pembiasaan akhlak mulia tanpa intimidasi rasa takut berlebihan, serta menumbuhkan cinta kepada Al-Qur'an dan teladan Rasulullah Saw.
              </p>
            </div>
          </div>

          {/* Trias Pengalaman Belajar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Integrasi Tiga Dimensi Pengalaman Belajar PAIBP
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h5 className="font-bold text-slate-800 text-xs">Dimensi 1: Memahami</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Menyerap sari pati hikmah syariat, memahami sanad keilmuan, dan menguasai kaidah fikih secara kontekstual.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h5 className="font-bold text-slate-800 text-xs">Dimensi 2: Mengaplikasikan</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Mewujudkan ilmu dalam bentuk kepedulian sosial, transaksi muamalah jujur, serta tilawah dan tajwid yang tartil.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <h5 className="font-bold text-slate-800 text-xs">Dimensi 3: Merefleksikan</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Melakukan muhasabah yaumiyah, mengevaluasi konsistensi integritas diri, dan merumuskan komitmen akhlak karimah.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
