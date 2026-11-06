import * as XLSX from 'xlsx';
import { QuestionItem, KisiKisiItem, ProfilSekolah, PaketAsesmen, SiswaNilai, RubrikItem } from '../types/curriculum';

export const exportToExcel = (
  filename: string,
  data: {
    soalList?: QuestionItem[];
    kisiKisiList?: KisiKisiItem[];
    siswaList?: SiswaNilai[];
    profil?: ProfilSekolah;
  }
) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Naskah Soal
  if (data.soalList && data.soalList.length > 0) {
    const soalData = data.soalList.map((q, idx) => ({
      No: idx + 1,
      Fase: q.fase,
      Kelas: q.kelas,
      Elemen: q.elemen,
      'Kode TP': q.tpKode,
      Materi: q.materi,
      'Bentuk Soal': q.bentukSoal,
      'Level Bloom': q.levelBloom,
      Kategori: q.kategoriKognitif,
      Kesulitan: q.kesulitan,
      'Stimulus (Jika Ada)': q.stimulus?.konten || '-',
      Pertanyaan: q.pertanyaan,
      'Opsi A': q.opsi?.[0] || '',
      'Opsi B': q.opsi?.[1] || '',
      'Opsi C': q.opsi?.[2] || '',
      'Opsi D': q.opsi?.[3] || '',
      'Opsi E': q.opsi?.[4] || '',
    }));
    const wsSoal = XLSX.utils.json_to_sheet(soalData);
    XLSX.utils.book_append_sheet(wb, wsSoal, 'Naskah_Soal');

    // Sheet 2: Kunci & Pembahasan (Guru)
    const kunciData = data.soalList.map((q, idx) => ({
      No: idx + 1,
      'Bentuk Soal': q.bentukSoal,
      'Kunci Jawaban': q.kunciJawaban,
      'Rujukan Dalil': q.dalilRujukan?.surahAyat || '-',
      Pembahasan: q.pembahasan,
      'Status Validasi': q.validation.status,
    }));
    const wsKunci = XLSX.utils.json_to_sheet(kunciData);
    XLSX.utils.book_append_sheet(wb, wsKunci, 'Kunci_Jawaban_Guru');
  }

  // Sheet 3: Kisi-kisi
  if (data.kisiKisiList && data.kisiKisiList.length > 0) {
    const kisiData = data.kisiKisiList.map((k, idx) => ({
      'No Urut': idx + 1,
      'No Soal': k.nomorSoalPaket,
      Fase: k.fase,
      Kelas: k.kelas,
      Elemen: k.elemen,
      'Capaian Pembelajaran': k.cpDeskripsi,
      'Tujuan Pembelajaran': `[${k.tpKode}] ${k.tpDeskripsi}`,
      Materi: k.materi,
      'Indikator Soal': k.indikatorSoal,
      'Level Kognitif': k.levelBloom,
      'Level SOLO': k.levelSOLO,
      Kesulitan: k.kesulitan,
      'Bentuk Soal': k.bentukSoal,
    }));
    const wsKisi = XLSX.utils.json_to_sheet(kisiData);
    XLSX.utils.book_append_sheet(wb, wsKisi, 'Kisi_Kisi_Asesmen');
  }

  // Sheet 4: Rekap Nilai Siswa
  if (data.siswaList && data.siswaList.length > 0) {
    const siswaData = data.siswaList.map((s, idx) => ({
      No: idx + 1,
      NISN: s.nisn,
      'Nama Siswa': s.nama,
      'Nilai Akhir': s.nilaiAkhir,
      Ketuntasan: s.statusKetuntasan,
      Catatan: s.catatan || '',
    }));
    const wsSiswa = XLSX.utils.json_to_sheet(siswaData);
    XLSX.utils.book_append_sheet(wb, wsSiswa, 'Rekap_Nilai_Siswa');
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToCSV = (filename: string, rows: any[]) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToWordDoc = (
  filename: string,
  title: string,
  htmlContent: string,
  profil: ProfilSekolah
) => {
  const headerHtml = `
    <div style="text-align: center; font-family: 'Times New Roman', serif; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px;">
      <h3 style="margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase;">PEMERINTAH DAERAH PROVINSI</h3>
      <h2 style="margin: 4px 0; font-size: 18pt; font-weight: bold; text-transform: uppercase;">${profil.namaSekolah}</h2>
      <p style="margin: 0; font-size: 11pt; color: #333;">NPSN: ${profil.npsn} | Alamat: ${profil.alamat}</p>
    </div>
  `;

  const footerHtml = `
    <div style="margin-top: 40px; font-family: 'Times New Roman', serif; page-break-inside: avoid;">
      <table style="width: 100%; border: none;">
        <tr>
          <td style="width: 50%; text-align: center;">
            <p style="margin: 0;">Mengetahui,</p>
            <p style="margin: 0 0 60px 0;">Kepala Sekolah</p>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${profil.kepalaSekolah}</p>
            <p style="margin: 0;">NIP. ${profil.nipKepalaSekolah}</p>
          </td>
          <td style="width: 50%; text-align: center;">
            <p style="margin: 0;">Kota, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style="margin: 0 0 60px 0;">Guru Mata Pelajaran PAI &amp; BP</p>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${profil.guruMataPelajaran}</p>
            <p style="margin: 0;">NIP. ${profil.nipGuru}</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  const fullDocHtml = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 20px; }
        h1, h2, h3, h4 { color: #000; font-family: 'Times New Roman', serif; }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th, td { border: 1px solid #333; padding: 6px 8px; font-size: 11pt; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .no-border, .no-border td { border: none !important; }
        .page-break { page-break-after: always; }
      </style>
    </head>
    <body>
      ${headerHtml}
      ${htmlContent}
      ${footerHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', fullDocHtml], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const generateGoogleFormsFormat = (soalList: QuestionItem[]): string => {
  return soalList
    .map((q, idx) => {
      let text = `${idx + 1}. ${q.pertanyaan}\n`;
      if (q.stimulus?.konten) {
        text = `[STIMULUS: ${q.stimulus.konten}]\n` + text;
      }
      if (q.opsi && q.opsi.length > 0) {
        q.opsi.forEach((op) => {
          text += `${op}\n`;
        });
      }
      text += `ANSWER: ${q.kunciJawaban}\n`;
      text += `FEEDBACK: ${q.pembahasan}\n\n`;
      return text;
    })
    .join('');
};
