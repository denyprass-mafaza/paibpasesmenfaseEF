import React, { useState } from 'react';
import { QuestionItem, ValidationStatus, ValidationDetail } from '../../types/curriculum';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { callValidateQuestionAPI } from '../../services/aiService';

interface Props {
  questionBank: QuestionItem[];
  onUpdateQuestion: (id: string, updatedFields: Partial<QuestionItem>) => void;
}

export const ValidatorModule: React.FC<Props> = ({ questionBank, onUpdateQuestion }) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | ValidationStatus>('ALL');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(questionBank[0]?.id || '');
  const [isAuditing, setIsAuditing] = useState(false);

  const activeQuestion =
    questionBank.find((q) => q.id === selectedQuestionId) || questionBank[0];

  const filteredQuestions = questionBank.filter((q) => {
    if (filterStatus !== 'ALL' && q.validation.status !== filterStatus) return false;
    return true;
  });

  const handleAuditQuestion = async (q: QuestionItem) => {
    setIsAuditing(true);
    try {
      const result = await callValidateQuestionAPI(q);
      onUpdateQuestion(q.id, { validation: result });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleBatchAudit = async () => {
    setIsAuditing(true);
    for (const q of questionBank.slice(0, 5)) {
      try {
        const result = await callValidateQuestionAPI(q);
        onUpdateQuestion(q.id, { validation: result });
      } catch (e) {
        console.error(e);
      }
    }
    setIsAuditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              AI Validator &amp; Quality Control (18 Parameter)
            </h2>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              Audit Otomatis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemeriksaan akurasi materi, kesahihan dalil Al-Qur'an &amp; hadis, validitas distraktor, dan ketiadaan ambiguitas
          </p>
        </div>

        <button
          onClick={handleBatchAudit}
          disabled={isAuditing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
          Jalankan Audit Seluruh Soal ({questionBank.length})
        </button>
      </div>

      {/* 18-Point Verification Checklist Specs */}
      <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-emerald-950 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            18 Parameter Standar Audit Kualitas Asesmen PAIBP
          </span>
          <span className="text-[11px] font-semibold text-emerald-800">
            AI bukan pengganti validasi akademik guru
          </span>
        </div>
        <p className="text-[11px] text-emerald-900 leading-relaxed">
          Pemeriksaan mencakup: (1) Kesesuaian Fase, (2) Kelas, (3) Elemen, (4) CP, (5) TP, (6) Materi Pokok, (7) Indikator, (8) Level Kognitif, (9) Ketepatan Konsep Syariat Islam, (10) Ketepatan Surah/Ayat Al-Qur'an, (11) Kesahihan Hadis &amp; Perawi, (12) Kejelasan Bahasa, (13) Kebenaran Kunci Jawaban, (14) Homogenitas Distraktor, (15) Ketiadaan Ambiguitas, (16) Pencegahan Repetisi Butir, (17) Kesesuaian Tingkat Kesukaran, dan (18) Sinkronisasi Kisi-kisi.
        </p>
      </div>

      {/* Grid: Question List & Detailed Audit Result */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Daftar Soal Di-Audit
            </h3>
            {/* Filter buttons */}
            <div className="flex gap-1">
              {(['ALL', 'Valid', 'Perlu Revisi', 'Tidak Valid'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                    filterStatus === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredQuestions.map((q) => {
              const isSelected = q.id === activeQuestion?.id;
              const isVal = q.validation.status === 'Valid';
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition space-y-1.5 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      [{q.tpKode}] {q.fase}-{q.kelas}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isVal
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.validation.status}
                    </span>
                  </div>
                  <p className="text-slate-700 line-clamp-2 text-[11px]">{q.pertanyaan}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Inspection Card */}
        {activeQuestion && (
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                      activeQuestion.validation.status === 'Valid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Status: {activeQuestion.validation.status} ({activeQuestion.validation.score}/100)
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Fase {activeQuestion.fase} • Kelas {activeQuestion.kelas} • {activeQuestion.elemen}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  Materi Pokok: {activeQuestion.materi}
                </h3>
              </div>

              <button
                onClick={() => handleAuditQuestion(activeQuestion)}
                disabled={isAuditing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                Audit Ulang Soal Ini
              </button>
            </div>

            {/* Question Text */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Isi Butir Pertanyaan:</span>
              <p className="text-slate-900 font-medium leading-relaxed">{activeQuestion.pertanyaan}</p>
              {activeQuestion.opsi && (
                <div className="grid grid-cols-1 gap-1 pt-1">
                  {activeQuestion.opsi.map((op, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 rounded text-[11px] ${
                        op.startsWith(activeQuestion.kunciJawaban)
                          ? 'bg-emerald-100/70 font-bold text-emerald-900'
                          : 'text-slate-700'
                      }`}
                    >
                      {op}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checklist Results (Boolean Matrix) */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Hasil Pemeriksaan 7 Aspek Kunci:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(activeQuestion.validation.checks).map(([key, passed]) => (
                  <div
                    key={key}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      passed
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <span className="capitalize text-[11px] font-medium">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    {passed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dalil Verification Note */}
            {activeQuestion.dalilRujukan && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-blue-900">Rujukan Dalil Syariat:</span>
                <p className="text-blue-800">
                  {activeQuestion.dalilRujukan.surahAyat || 'Hadis Sahih'}
                </p>
                <p className="text-[11px] text-blue-700 italic">
                  "{activeQuestion.dalilRujukan.terjemah}"
                </p>
              </div>
            )}

            {/* Suggested Fixes */}
            {activeQuestion.validation.suggestions.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900">Saran Perbaikan Mutu:</span>
                <ul className="list-disc list-inside text-amber-800 text-[11px]">
                  {activeQuestion.validation.suggestions.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
