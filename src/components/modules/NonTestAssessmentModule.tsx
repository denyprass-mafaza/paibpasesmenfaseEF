import React, { useState } from 'react';
import {
  NonTestInstrument,
  Fase,
  Kelas,
  ElemenPAI,
  ProfilSekolah,
} from '../../types/curriculum';
import {
  CheckCircle2,
  Download,
  Plus,
  FileText,
  Printer,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { exportToWordDoc } from '../../utils/exportUtils';

interface Props {
  profil: ProfilSekolah;
}

export const NonTestAssessmentModule: React.FC<Props> = ({ profil }) => {
  const [selectedJenis, setSelectedJenis] = useState<NonTestInstrument['jenis']>('Observasi Sikap');
  const [fase, setFase] = useState<Fase>('E');
  const [kelas, setKelas] = useState<Kelas>('X');
  const [elemen, setElemen] = useState<ElemenPAI>('Akhlak');
  const [materi, setMateri] = useState<string>('Meneladani Akhlak Rasulullah Saw. & Menghindari Penyakit Hati');

  // Sample Generated Instruments State
  const [instruments, setInstruments] = useState<NonTestInstrument[]>([
    {
      id: 'NT-01',
      jenis: 'Observasi Sikap',
      fase: 'E',
      kelas: 'X',
      elemen: 'Akhlak',
      tpKode: 'E.AKH.2',
      materi: 'Meneladani Akhlak Rasulullah Saw.',
      tujuanPenilaian:
        'Mengamati pembiasaan perilaku jujur (shiddiq), amanah, tawadhu, dan peduli sesama dalam interaksi harian di sekolah.',
      aspekDinilai: [
        'Kejujuran dalam ucapan dan pengerjaan tugas',
        'Kerapian dan amanah menjaga fasilitas bersama',
        'Sikap rendah hati (tidak takabur atau ujub)',
        'Kepedulian membantu teman yang kesulitan',
      ],
      indikator: [
        'Tidak berbohong saat memberikan keterangan',
        'Mengembalikan barang pinjaman tepat waktu',
        'Menyapa dengan senyum, salam, sapa santun',
      ],
      teknikPenilaian: 'Observasi Terstruktur Guru dengan Lembar Ceklis Bergradasi',
      daftarPernyataan: [
        { id: 1, butir: 'Menyampaikan alasan yang sebenarnya dan jujur bila terlambat masuk kelas.', kategori: 'Positif' },
        { id: 2, butir: 'Mengakui kesalahan diri sendiri tanpa mencari kambing hitam orang lain.', kategori: 'Positif' },
        { id: 3, butir: 'Membanggakan kekayaan materi atau status sosial di depan teman sekelas.', kategori: 'Negatif' },
        { id: 4, butir: 'Menjaga kebersihan meja dan membuang sampah pada tempatnya dengan sukarela.', kategori: 'Positif' },
        { id: 5, butir: 'Menghargai pendapat teman yang berbeda saat berdiskusi di kelas.', kategori: 'Positif' },
      ],
      pedomanPenskoran:
        'Skala 1 - 4: 4 = Selalu Konsisten, 3 = Sering Tampak, 2 = Kadang-kadang, 1 = Tidak Pernah / Perlu Pembinaan. Nilai Akhir = (Total Skor / 20) × 100.',
      rubrikDeskripsi:
        'Sangat Baik (90-100), Baik (75-89), Cukup (65-74), Perlu Pembinaan (<65).',
    },
    {
      id: 'NT-02',
      jenis: 'Penilaian Praktik',
      fase: 'F',
      kelas: 'XI',
      elemen: 'Fikih',
      tpKode: 'F.F.1',
      materi: 'Khotbah Jum\'at dan Dakwah Santun',
      tujuanPenilaian:
        'Mengukur keterampilan peserta didik dalam menyampaikan khotbah Jum\'at sesuai rukun, syarat, sunnah, dan retorika dakwah sejuk.',
      aspekDinilai: [
        'Ketepatan rukun khotbah (Hamdalah, Shalawat, Wasiat Takwa, Ayat Qur\'an, Doa Mukmin)',
        'Pengucapan ayat dan hadis secara fasih dan bertajwid',
        'Intonasi, artikulasi, dan kontak mata dengan jamaah',
        'Relevansi pesan khotbah dengan problem kemasyarakatan masa kini',
      ],
      indikator: [
        'Membaca hamdalah dan shalawat dengan makhraj fasih',
        'Menyampaikan wasiat takwa secara tegas dan mengajak kebaikan',
        'Melakukan duduk di antara dua khotbah secara tertib',
      ],
      teknikPenilaian: 'Uji Unjuk Kerja / Praktik Langsung dengan Rubrik Skala 1 - 4',
      daftarPernyataan: [
        { id: 1, butir: 'Kelengkapan 5 rukun khotbah Jum\'at pada khotbah pertama dan kedua.', kategori: 'Keterampilan' },
        { id: 2, butir: 'Kefasihan membaca lafaz Al-Qur\'an dan hadis dalam khotbah.', kategori: 'Keterampilan' },
        { id: 3, butir: 'Sikap percaya diri, kesantunan busana, dan adab mimbar.', kategori: 'Keterampilan' },
        { id: 4, butir: 'Isi khotbah memotivasi persaudaraan dan menjauhi provokasi kebencian.', kategori: 'Refleksi' },
      ],
      pedomanPenskoran:
        'Skor maksimal = 16. Nilai = (Skor Perolehan / 16) × 100.',
      rubrikDeskripsi:
        'Level 4: Memenuhi seluruh rukun tanpa teks, fasih, dan retorika sejuk. Level 3: Rukun lengkap dengan teks, tajwid cukup baik. Level 2: Ada rukun yang terlewat minor. Level 1: Rukun tidak lengkap.',
    },
  ]);

  const activeInstrument =
    instruments.find((i) => i.jenis === selectedJenis) || instruments[0];

  const handleGenerateNew = () => {
    const newInst: NonTestInstrument = {
      id: `NT-${Date.now()}`,
      jenis: selectedJenis,
      fase,
      kelas,
      elemen,
      tpKode: fase === 'E' ? 'E.AKH.1' : 'F.AKH.2',
      materi,
      tujuanPenilaian: `Mengukur ketercapaian kompetensi afektif/psikomotorik peserta didik pada materi "${materi}" melalui teknik ${selectedJenis}.`,
      aspekDinilai: [
        'Pemahaman nilai esensial ajaran syariat',
        'Konsistensi penerapan dalam keseharian sekolah',
        'Refleksi diri dan komitmen perbaikan berkelanjutan',
        'Tanggung jawab dan kerja sama antarteman',
      ],
      indikator: [
        'Mampu menunjukkan perilaku sesuai tuntunan akhlak karimah',
        'Mampu memberikan masukan konstruktif berlandaskan nilai Islam',
      ],
      teknikPenilaian: `Instrumen ${selectedJenis} terstandarisasi skala likert 1 - 4`,
      daftarPernyataan: [
        { id: 1, butir: `Menunjukkan ketulusan niat (keikhlasan) dalam melaksanakan tugas pembelajaran ${materi}.`, kategori: 'Positif' },
        { id: 2, butir: `Berani menolak ajakan yang melanggar adab kesopanan dan etika keislaman.`, kategori: 'Positif' },
        { id: 3, butir: `Mengabaikan nasihat teman saat berbuat keliru.`, kategori: 'Negatif' },
        { id: 4, butir: `Mengaitkan ajaran ${materi} dengan perbaikan karakter pribadi secara berkala.`, kategori: 'Refleksi' },
      ],
      pedomanPenskoran:
        'Skala 1 - 4: 4 = Sangat Baik, 3 = Baik, 2 = Cukup, 1 = Perlu Bimbingan. Nilai Akhir = (Total Skor / 16) × 100.',
      rubrikDeskripsi:
        'Predikat A (90-100), Predikat B (75-89), Predikat C (65-74), Predikat D (<65).',
    };

    setInstruments([newInst, ...instruments]);
  };

  const handleExportWord = () => {
    const docHtml = `
      <h3 style="text-align: center; text-transform: uppercase;">INSTRUMEN PENILAIAN NON-TES / PRAKTIK</h3>
      <table style="width: 100%; border: none; font-size: 11pt; margin-bottom: 15px;">
        <tr><td style="width: 25%;">Satuan Pendidikan</td><td>: ${profil.namaSekolah}</td></tr>
        <tr><td>Mata Pelajaran</td><td>: Pendidikan Agama Islam &amp; Budi Pekerti</td></tr>
        <tr><td>Jenis Instrumen</td><td>: ${activeInstrument.jenis}</td></tr>
        <tr><td>Fase / Kelas</td><td>: Fase ${activeInstrument.fase} / Kelas ${activeInstrument.kelas}</td></tr>
        <tr><td>Elemen / Materi</td><td>: ${activeInstrument.elemen} / ${activeInstrument.materi}</td></tr>
        <tr><td>Tujuan Penilaian</td><td>: ${activeInstrument.tujuanPenilaian}</td></tr>
      </table>

      <h4 style="margin: 10px 0 5px 0;">A. DAFTAR INDIKATOR / BUTIR PERNYATAAN AMATAN</h4>
      <table border="1" style="border-collapse: collapse; width: 100%; font-size: 11pt;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="width: 8%;">No</th>
            <th>Pernyataan / Butir Observasi</th>
            <th style="width: 10%;">Skor 4</th>
            <th style="width: 10%;">Skor 3</th>
            <th style="width: 10%;">Skor 2</th>
            <th style="width: 10%;">Skor 1</th>
          </tr>
        </thead>
        <tbody>
          ${activeInstrument.daftarPernyataan
            .map(
              (p) => `
            <tr>
              <td style="text-align: center;">${p.id}</td>
              <td>${p.butir}</td>
              <td></td><td></td><td></td><td></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <h4 style="margin: 15px 0 5px 0;">B. PEDOMAN PENSKORAN &amp; KRITERIA KKTP</h4>
      <p style="font-size: 11pt; margin: 4px 0;">${activeInstrument.pedomanPenskoran}</p>
      <p style="font-size: 11pt; margin: 4px 0;"><strong>Kriteria:</strong> ${activeInstrument.rubrikDeskripsi}</p>
    `;

    exportToWordDoc(
      `Instrumen_${activeInstrument.jenis.replace(/\s+/g, '_')}_Fase_${activeInstrument.fase}`,
      'Instrumen Asesmen Non-Tes PAIBP',
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
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Generator Asesmen Non-Tes &amp; Praktik (10 Instrumen)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Menyusun instrumen observasi sikap, penilaian diri, jurnal refleksi, unjuk kerja praktik, proyek, dan portofolio
          </p>
        </div>

        <button
          onClick={handleGenerateNew}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          <Sparkles className="w-4 h-4" />
          Rancang Instrumen Baru
        </button>
      </div>

      {/* 10 Non-test Selector Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Pilih Jenis Instrumen Penilaian:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            'Observasi Sikap',
            'Penilaian Diri',
            'Penilaian Antarteman',
            'Jurnal Refleksi',
            'Penilaian Praktik',
            'Penilaian Proyek',
            'Penilaian Produk',
            'Penilaian Portofolio',
            'Penilaian Presentasi',
            'Penilaian Diskusi',
          ].map((jenis) => (
            <button
              key={jenis}
              onClick={() => setSelectedJenis(jenis as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedJenis === jenis
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {jenis}
            </button>
          ))}
        </div>
      </div>

      {/* Main Active Instrument Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {activeInstrument.jenis}
              </span>
              <span className="text-xs font-bold text-slate-700">
                Fase {activeInstrument.fase} • Kelas {activeInstrument.kelas}
              </span>
              <span className="text-xs text-slate-500 font-medium">{activeInstrument.elemen}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              {activeInstrument.materi}
            </h3>
          </div>

          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-300"
          >
            <FileText className="w-4 h-4 text-blue-600" /> Unduh Dokumen Word (.doc)
          </button>
        </div>

        {/* Objectives & Technique */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700">Tujuan Penilaian:</span>
            <p className="text-slate-600 leading-relaxed">{activeInstrument.tujuanPenilaian}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700">Teknik &amp; Skala Penilaian:</span>
            <p className="text-slate-600 leading-relaxed">{activeInstrument.teknikPenilaian}</p>
          </div>
        </div>

        {/* Observation Items Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Daftar Butir Pernyataan / Indikator Perilaku Diamati
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="px-3 py-2.5 text-center w-12">No</th>
                  <th className="px-4 py-2.5">Pernyataan Perilaku / Keterampilan</th>
                  <th className="px-3 py-2.5 text-center w-28">Kategori</th>
                  <th className="px-2 py-2.5 text-center w-16">Skor 4</th>
                  <th className="px-2 py-2.5 text-center w-16">Skor 3</th>
                  <th className="px-2 py-2.5 text-center w-16">Skor 2</th>
                  <th className="px-2 py-2.5 text-center w-16">Skor 1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activeInstrument.daftarPernyataan.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-3 py-3 text-center font-bold text-slate-700">{p.id}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{p.butir}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.kategori}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center border-l border-slate-100 font-mono text-slate-300">○</td>
                    <td className="px-2 py-3 text-center font-mono text-slate-300">○</td>
                    <td className="px-2 py-3 text-center font-mono text-slate-300">○</td>
                    <td className="px-2 py-3 text-center font-mono text-slate-300">○</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scoring Guide */}
        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs space-y-1">
          <span className="font-bold text-emerald-900">Pedoman Penskoran &amp; Konversi KKTP:</span>
          <p className="text-emerald-800">{activeInstrument.pedomanPenskoran}</p>
          <p className="text-[11px] text-emerald-700 italic">{activeInstrument.rubrikDeskripsi}</p>
        </div>
      </div>
    </div>
  );
};
