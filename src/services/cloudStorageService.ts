import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { ProfilSekolah, QuestionItem } from '../types/curriculum';

export interface CloudSyncStatus {
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
}

/**
 * Saves school profile to Firestore for the authenticated user
 */
export async function saveSchoolProfileToCloud(profile: ProfilSekolah): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const docPath = `users/${user.uid}/schoolProfile/config`;
  try {
    await setDoc(doc(db, docPath), {
      userId: user.uid,
      namaSekolah: profile.namaSekolah,
      npsn: profile.npsn || '',
      alamat: profile.alamat || '',
      kepalaSekolah: profile.kepalaSekolah || '',
      nipKepalaSekolah: profile.nipKepalaSekolah || '',
      guruMataPelajaran: profile.guruMataPelajaran,
      nipGuru: profile.nipGuru || '',
      tahunPelajaran: profile.tahunPelajaran,
      kktpDefault: profile.kktpDefault || 75,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Loads school profile from Firestore for the authenticated user
 */
export async function loadSchoolProfileFromCloud(): Promise<Partial<ProfilSekolah> | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const docPath = `users/${user.uid}/schoolProfile/config`;
  try {
    const snap = await getDoc(doc(db, docPath));
    if (snap.exists()) {
      const data = snap.data();
      return {
        namaSekolah: data.namaSekolah,
        npsn: data.npsn || '',
        alamat: data.alamat || '',
        kepalaSekolah: data.kepalaSekolah || '',
        nipKepalaSekolah: data.nipKepalaSekolah || '',
        guruMataPelajaran: data.guruMataPelajaran || '',
        nipGuru: data.nipGuru || '',
        tahunPelajaran: data.tahunPelajaran,
        kktpDefault: data.kktpDefault || 75,
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

/**
 * Saves a single question item to Firestore
 */
export async function saveQuestionToCloud(question: QuestionItem): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const docPath = `users/${user.uid}/questions/${question.id}`;
  try {
    await setDoc(doc(db, docPath), {
      id: question.id,
      userId: user.uid,
      fase: question.fase,
      kelas: question.kelas,
      elemen: question.elemen,
      bentukSoal: question.bentukSoal,
      levelBloom: question.levelBloom,
      kategoriKognitif: question.kategoriKognitif,
      materi: question.materi,
      indikator: question.indikator,
      pertanyaan: question.pertanyaan,
      kunciJawaban: question.kunciJawaban,
      createdAt: question.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Loads user questions from Firestore
 */
export async function loadUserQuestionsFromCloud(): Promise<QuestionItem[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const colPath = `users/${user.uid}/questions`;
  try {
    const snap = await getDocs(collection(db, colPath));
    return snap.docs.map((d) => d.data() as QuestionItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}
