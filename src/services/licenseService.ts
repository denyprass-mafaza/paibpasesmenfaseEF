import {
  ClientLicenseState,
  FeatureFlagKey,
  LicenseRecord,
  QuotaToday,
  DemoSettings,
  OwnerContactInfo,
  FeatureAccess,
} from '../types/license';
import { DEFAULT_LICENSES, verifyLicenseCodeLocally } from '../data/defaultLicenses';

const STORAGE_KEY_LICENSE_CODE = 'paibp_license_code_v1';
const STORAGE_KEY_DEVICE_ID = 'paibp_device_id_v1';
const STORAGE_KEY_LOCAL_QUOTA = 'paibp_local_quota_v1';

export function getOrCreateDeviceId(): string {
  let devId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
  if (!devId) {
    devId = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    localStorage.setItem(STORAGE_KEY_DEVICE_ID, devId);
  }
  return devId;
}

export function getStoredLicenseCode(): string {
  return localStorage.getItem(STORAGE_KEY_LICENSE_CODE) || '';
}

export function setStoredLicenseCode(code: string) {
  if (code) {
    localStorage.setItem(STORAGE_KEY_LICENSE_CODE, code.trim().toUpperCase());
  } else {
    localStorage.removeItem(STORAGE_KEY_LICENSE_CODE);
  }
}

export const DEFAULT_DEMO_SETTINGS: DemoSettings = {
  maxGeneratePerSession: 5,
  maxGeneratePerDay: 20,
  maxKisiKisiPerDay: 1,
  maxIndicatorsPerKisi: 10,
  maxPackagePerDay: 1,
  maxQuestionsPerPackage: 10,
  maxRubricPerDay: 1,
  maxStoredQuestionsInBank: 5,
  maxStoredPackages: 1,
  maxStudentsInAnalytics: 5,
  maxAnalyticsPerDay: 1,
  allowImportInDemo: false,
  watermarkText: 'DEMO – PAIBP SMART ASSESSMENT PRO',
};

export const DEFAULT_CONTACT_INFO: OwnerContactInfo = {
  whatsapp: '6282242645862',
  email: 'denyprass38@gmail.com',
  purchaseUrl: 'https://wa.me/6282242645862?text=Halo%20Owner%20PAIBP%20Smart%20Assessment%20Pro,%20saya%20ingin%20mendapatkan%20kode%20aktivasi%20lisensi%20PRO',
  supportUrl: 'https://wa.me/6282242645862?text=Bantuan%20Lisensi%20PAIBP%20Smart%20Assessment%20Pro',
  customNote: 'Hubungi Owner (Deny Prasetyo) via WhatsApp 082242645862 atau email denyprass38@gmail.com untuk aktivasi lisensi resmi.',
};

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, FeatureAccess> = {
  basic_generator: 'DEMO',
  advanced_generator: 'PRO',
  question_bank: 'DEMO',
  kisi_kisi: 'DEMO',
  rubric: 'DEMO',
  analytics: 'DEMO',
  remedial_ai: 'PRO',
  enrichment_ai: 'PRO',
  validator: 'DEMO',
  quran: 'DEMO',
  word_export: 'PRO',
  pdf_export: 'PRO',
  excel_export: 'PRO',
  csv_export: 'PRO',
  google_forms: 'PRO',
  batch_generate: 'PRO',
  import_bank: 'PRO',
};

function getLocalQuota(): QuotaToday {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_QUOTA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  const fresh: QuotaToday = {
    generateCount: 0,
    kisiKisiCount: 0,
    packageCount: 0,
    rubricCount: 0,
    analyticsCount: 0,
    date: today,
  };
  localStorage.setItem(STORAGE_KEY_LOCAL_QUOTA, JSON.stringify(fresh));
  return fresh;
}

function saveLocalQuota(quota: QuotaToday) {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_QUOTA, JSON.stringify(quota));
  } catch {
    // ignore
  }
}

// Compute initial state synchronously so app never flashes DEMO if PRO code exists
function computeInitialState(): ClientLicenseState {
  const deviceId = getOrCreateDeviceId();
  const storedCode = getStoredLicenseCode();

  const baseState: ClientLicenseState = {
    role: 'DEMO_USER',
    status: 'DEMO',
    isPro: false,
    licenseInfo: null,
    quotaToday: getLocalQuota(),
    demoSettings: DEFAULT_DEMO_SETTINGS,
    featureFlags: DEFAULT_FEATURE_FLAGS,
    contactInfo: DEFAULT_CONTACT_INFO,
    deviceId,
  };

  if (storedCode) {
    const local = verifyLicenseCodeLocally(storedCode, deviceId);
    if (local.success && local.license) {
      baseState.role = 'PRO_USER';
      baseState.status = 'PRO_ACTIVE';
      baseState.isPro = true;
      baseState.licenseInfo = local.license;
    } else if (local.errorType === 'EXPIRED') {
      baseState.status = 'EXPIRED';
      baseState.isPro = false;
      baseState.licenseInfo = local.license || null;
    } else if (local.errorType === 'REVOKED') {
      baseState.status = 'REVOKED';
      baseState.isPro = false;
      baseState.licenseInfo = local.license || null;
    }
  }

  return baseState;
}

let currentLicenseState: ClientLicenseState = computeInitialState();

type StateChangeListener = (state: ClientLicenseState) => void;
const listeners: Set<StateChangeListener> = new Set();

export function subscribeLicenseState(listener: StateChangeListener): () => void {
  listeners.add(listener);
  listener(currentLicenseState);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  for (const listener of listeners) {
    listener(currentLicenseState);
  }
}

export function getCurrentLicenseState(): ClientLicenseState {
  return currentLicenseState;
}

/**
 * Fetches license status from backend if available, or falls back seamlessly to
 * bundled master database for static hosting environments like Vercel and GitHub exports.
 */
export async function fetchLicenseStatus(): Promise<ClientLicenseState> {
  const deviceId = getOrCreateDeviceId();
  const code = getStoredLicenseCode();

  // If code exists, pre-validate locally so state is immediately reliable
  if (code) {
    const local = verifyLicenseCodeLocally(code, deviceId);
    if (local.success && local.license) {
      currentLicenseState.role = 'PRO_USER';
      currentLicenseState.status = 'PRO_ACTIVE';
      currentLicenseState.isPro = true;
      currentLicenseState.licenseInfo = local.license;
    }
  }

  try {
    const res = await fetch(
      `/api/license/status?deviceId=${encodeURIComponent(deviceId)}&licenseCode=${encodeURIComponent(code)}`,
      {
        headers: {
          'x-device-id': deviceId,
          'x-license-code': code,
        },
      }
    );

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.success) {
        currentLicenseState = {
          role: data.isPro ? 'PRO_USER' : 'DEMO_USER',
          status: data.status,
          isPro: data.isPro,
          licenseInfo: data.licenseInfo,
          quotaToday: data.quotaToday || currentLicenseState.quotaToday,
          demoSettings: data.demoSettings || DEFAULT_DEMO_SETTINGS,
          featureFlags: data.featureFlags || DEFAULT_FEATURE_FLAGS,
          contactInfo: data.contactInfo || DEFAULT_CONTACT_INFO,
          deviceId,
        };

        if (code && !data.isPro && (data.status === 'REVOKED' || data.status === 'DEMO')) {
          if (data.status === 'DEMO') {
            setStoredLicenseCode('');
          }
        }

        notifyListeners();
        return currentLicenseState;
      }
    }
  } catch (err) {
    // Fallback for Vercel static deployments or offline use:
    // Retain current verified PRO state if code is valid
    console.warn('Backend server unavailable (static Vercel/offline mode): running with local license engine.');
  }

  notifyListeners();
  return currentLicenseState;
}

/**
 * Activates PRO license.
 * Dual-Mode: Attempts server-authoritative activation first.
 * If server is unavailable (such as on Vercel static deployments),
 * performs authoritative client-side validation against DEFAULT_LICENSES and official key patterns.
 */
export async function activateProLicense(
  code: string
): Promise<{ success: boolean; message: string; state?: ClientLicenseState }> {
  const deviceId = getOrCreateDeviceId();
  const cleanCode = (code || '').trim().toUpperCase();

  if (!cleanCode) {
    return { success: false, message: 'Silakan masukkan kode aktivasi Anda.' };
  }

  // Pre-validate locally
  const localCheck = verifyLicenseCodeLocally(cleanCode, deviceId);

  // 1. Try server activation first (when Express server is running)
  try {
    const res = await fetch('/api/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode, deviceId }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success) {
        setStoredLicenseCode(cleanCode);
        currentLicenseState = {
          ...currentLicenseState,
          role: 'PRO_USER',
          status: 'PRO_ACTIVE',
          isPro: true,
          licenseInfo: json.license || localCheck.license,
        };
        notifyListeners();
        return { success: true, message: json.message, state: currentLicenseState };
      } else {
        // Explicit rejection from server (e.g. REVOKED or RATE_LIMIT)
        return { success: false, message: json.message || 'Kode aktivasi tidak valid.' };
      }
    }
  } catch (err) {
    console.warn('Backend activation endpoint unreachable, switching to static/Vercel verification mode:', err);
  }

  // 2. Fallback for Vercel Static Deployments & GitHub Repositories
  if (localCheck.success && localCheck.license) {
    setStoredLicenseCode(cleanCode);
    currentLicenseState = {
      ...currentLicenseState,
      role: 'PRO_USER',
      status: 'PRO_ACTIVE',
      isPro: true,
      licenseInfo: localCheck.license,
    };
    notifyListeners();
    return {
      success: true,
      message: localCheck.message || '🎉 Aktivasi berhasil! PAIBP SMART ASSESSMENT PRO sekarang aktif dalam MODE PRO.',
      state: currentLicenseState,
    };
  }

  return {
    success: false,
    message:
      localCheck.message ||
      'Kode aktivasi tidak valid. Periksa kembali kode yang Anda masukkan atau hubungi OWNER untuk mendapatkan bantuan.',
  };
}

export async function deactivateLicense(): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  setStoredLicenseCode('');

  try {
    await fetch('/api/license/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
  } catch {
    // Ignore backend failure on static hosting
  }

  currentLicenseState = {
    role: 'DEMO_USER',
    status: 'DEMO',
    isPro: false,
    licenseInfo: null,
    quotaToday: getLocalQuota(),
    demoSettings: DEFAULT_DEMO_SETTINGS,
    featureFlags: DEFAULT_FEATURE_FLAGS,
    contactInfo: DEFAULT_CONTACT_INFO,
    deviceId,
  };
  notifyListeners();
}

export async function consumeServerQuota(
  action: 'generate' | 'kisi' | 'package' | 'rubric' | 'analytics',
  amount = 1
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  if (currentLicenseState.isPro) {
    return { allowed: true, remaining: 9999 };
  }

  const deviceId = getOrCreateDeviceId();
  const licenseCode = getStoredLicenseCode();

  // Try server first
  try {
    const res = await fetch('/api/license/consume-quota', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        'x-license-code': licenseCode,
      },
      body: JSON.stringify({ deviceId, action, amount }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.allowed) {
        if (action === 'generate') currentLicenseState.quotaToday.generateCount += amount;
        else if (action === 'kisi') currentLicenseState.quotaToday.kisiKisiCount += amount;
        else if (action === 'package') currentLicenseState.quotaToday.packageCount += amount;
        else if (action === 'rubric') currentLicenseState.quotaToday.rubricCount += amount;
        else if (action === 'analytics') currentLicenseState.quotaToday.analyticsCount += amount;
        saveLocalQuota(currentLicenseState.quotaToday);
        notifyListeners();
      }
      return data;
    }
  } catch (err) {
    console.warn('Backend quota check unreachable, using local quota system:', err);
  }

  // Local quota fallback for Vercel static deployments
  const quota = getLocalQuota();
  const s = currentLicenseState.demoSettings;

  if (action === 'generate') {
    if (quota.generateCount + amount > s.maxGeneratePerDay) {
      return {
        allowed: false,
        remaining: 0,
        message: 'Batas penggunaan DEMO hari ini telah tercapai (maksimal 20 soal per hari). Aktivasi PRO untuk membuka generator tanpa batas.',
      };
    }
    quota.generateCount += amount;
    saveLocalQuota(quota);
    currentLicenseState.quotaToday = quota;
    notifyListeners();
    return { allowed: true, remaining: s.maxGeneratePerDay - quota.generateCount };
  }

  if (action === 'kisi') {
    if (quota.kisiKisiCount + amount > s.maxKisiKisiPerDay) {
      return {
        allowed: false,
        remaining: 0,
        message: 'Batas pembuatan kisi-kisi mode DEMO (1 kisi-kisi per hari) telah tercapai. Aktivasi PRO untuk akses tanpa batas.',
      };
    }
    quota.kisiKisiCount += amount;
    saveLocalQuota(quota);
    currentLicenseState.quotaToday = quota;
    notifyListeners();
    return { allowed: true, remaining: s.maxKisiKisiPerDay - quota.kisiKisiCount };
  }

  if (action === 'package') {
    if (quota.packageCount + amount > s.maxPackagePerDay) {
      return {
        allowed: false,
        remaining: 0,
        message: 'Batas pembuatan paket asesmen mode DEMO (1 paket per hari) telah tercapai. Aktivasi PRO untuk akses tanpa batas.',
      };
    }
    quota.packageCount += amount;
    saveLocalQuota(quota);
    currentLicenseState.quotaToday = quota;
    notifyListeners();
    return { allowed: true, remaining: s.maxPackagePerDay - quota.packageCount };
  }

  if (action === 'rubric') {
    if (quota.rubricCount + amount > s.maxRubricPerDay) {
      return {
        allowed: false,
        remaining: 0,
        message: 'Batas pembuatan rubrik mode DEMO (1 rubrik per hari) telah tercapai. Aktivasi PRO untuk akses tanpa batas.',
      };
    }
    quota.rubricCount += amount;
    saveLocalQuota(quota);
    currentLicenseState.quotaToday = quota;
    notifyListeners();
    return { allowed: true, remaining: s.maxRubricPerDay - quota.rubricCount };
  }

  if (action === 'analytics') {
    if (quota.analyticsCount + amount > s.maxAnalyticsPerDay) {
      return {
        allowed: false,
        remaining: 0,
        message: 'Batas analisis hasil mode DEMO (1 kali per hari) telah tercapai. Aktivasi PRO untuk analisis tanpa batas.',
      };
    }
    quota.analyticsCount += amount;
    saveLocalQuota(quota);
    currentLicenseState.quotaToday = quota;
    notifyListeners();
    return { allowed: true, remaining: s.maxAnalyticsPerDay - quota.analyticsCount };
  }

  return { allowed: true, remaining: 999 };
}

// ----------------------------------------------------
// Centralized Permission Engine
// ----------------------------------------------------

export interface PermissionResult {
  allowed: boolean;
  isProOnly: boolean;
  reason?: string;
}

export function canUseFeature(feature: FeatureFlagKey): PermissionResult {
  const state = currentLicenseState;
  const flag = state.featureFlags[feature] || 'PRO';

  if (flag === 'DISABLED') {
    return {
      allowed: false,
      isProOnly: false,
      reason: 'Fitur ini sedang dinonaktifkan sementara oleh OWNER sistem.',
    };
  }

  // If PRO is active
  if (state.isPro && state.status === 'PRO_ACTIVE') {
    return { allowed: true, isProOnly: false };
  }

  // If status is EXPIRED
  if (state.status === 'EXPIRED') {
    return {
      allowed: flag === 'DEMO',
      isProOnly: true,
      reason: 'Lisensi Anda telah berakhir. Data Anda tetap aman, tetapi fitur PRO saat ini dikunci. Silakan perpanjang atau gunakan kode aktivasi baru.',
    };
  }

  // If status is REVOKED
  if (state.status === 'REVOKED') {
    return {
      allowed: false,
      isProOnly: true,
      reason: 'Lisensi ini sudah tidak aktif. Silakan hubungi OWNER untuk informasi lebih lanjut.',
    };
  }

  // In DEMO mode
  if (flag === 'PRO') {
    return {
      allowed: false,
      isProOnly: true,
      reason: 'Fitur ini tersedia pada versi PRO. Aktifkan lisensi Anda untuk membuka akses.',
    };
  }

  // DEMO feature allowed
  return { allowed: true, isProOnly: false };
}

export function getExpiryNotification(): { show: boolean; message: string; urgency: 'normal' | 'warning' | 'danger' } | null {
  const state = currentLicenseState;
  if (!state.licenseInfo || !state.licenseInfo.expired_at) {
    return null;
  }

  const exp = new Date(state.licenseInfo.expired_at).getTime();
  const now = Date.now();
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      show: true,
      message: 'Lisensi PRO Anda telah berakhir. Data Anda tetap aman, aktifkan lisensi baru untuk membuka kembali seluruh fitur PRO.',
      urgency: 'danger',
    };
  }

  if (diffDays <= 1) {
    return {
      show: true,
      message: '⚠️ Lisensi PRO Anda akan berakhir besok.',
      urgency: 'danger',
    };
  }

  if (diffDays <= 3) {
    return {
      show: true,
      message: `⚠️ Lisensi PRO Anda akan berakhir dalam ${diffDays} hari.`,
      urgency: 'warning',
    };
  }

  if (diffDays <= 7) {
    return {
      show: true,
      message: `⚠️ Lisensi Anda akan berakhir dalam ${diffDays} hari.`,
      urgency: 'normal',
    };
  }

  return null;
}
