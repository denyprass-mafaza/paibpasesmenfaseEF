import {
  ClientLicenseState,
  FeatureFlagKey,
  LicenseRecord,
  QuotaToday,
  DemoSettings,
  OwnerContactInfo,
  FeatureAccess,
} from '../types/license';

const STORAGE_KEY_LICENSE_CODE = 'paibp_license_code_v1';
const STORAGE_KEY_DEVICE_ID = 'paibp_device_id_v1';

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

const DEFAULT_DEMO_SETTINGS: DemoSettings = {
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

const DEFAULT_CONTACT_INFO: OwnerContactInfo = {
  whatsapp: '6281234567890',
  email: 'owner@paibp-smartassessment.id',
  purchaseUrl: 'https://wa.me/6281234567890?text=Halo%20Owner%20PAIBP%20Smart%20Assessment%20Pro',
  supportUrl: 'https://wa.me/6281234567890?text=Bantuan%20Lisensi%20PAIBP',
  customNote: 'Hubungi Tim Pengembang Resmi PAIBP Smart Assessment Pro untuk aktivasi lisensi sekolah atau pribadi.',
};

const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, FeatureAccess> = {
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

// Initial state for DEMO mode
let currentLicenseState: ClientLicenseState = {
  role: 'DEMO_USER',
  status: 'DEMO',
  isPro: false,
  licenseInfo: null,
  quotaToday: {
    generateCount: 0,
    kisiKisiCount: 0,
    packageCount: 0,
    rubricCount: 0,
    analyticsCount: 0,
    date: new Date().toISOString().slice(0, 10),
  },
  demoSettings: DEFAULT_DEMO_SETTINGS,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  contactInfo: DEFAULT_CONTACT_INFO,
  deviceId: getOrCreateDeviceId(),
};

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

export async function fetchLicenseStatus(): Promise<ClientLicenseState> {
  const deviceId = getOrCreateDeviceId();
  const code = getStoredLicenseCode();

  try {
    const res = await fetch(`/api/license/status?deviceId=${encodeURIComponent(deviceId)}&licenseCode=${encodeURIComponent(code)}`, {
      headers: {
        'x-device-id': deviceId,
        'x-license-code': code,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        currentLicenseState = {
          role: data.isPro ? 'PRO_USER' : 'DEMO_USER',
          status: data.status,
          isPro: data.isPro,
          licenseInfo: data.licenseInfo,
          quotaToday: data.quotaToday,
          demoSettings: data.demoSettings || DEFAULT_DEMO_SETTINGS,
          featureFlags: data.featureFlags || DEFAULT_FEATURE_FLAGS,
          contactInfo: data.contactInfo || DEFAULT_CONTACT_INFO,
          deviceId,
        };

        // If license became invalid or revoked on server, remove it from local storage
        if (code && !data.isPro && (data.status === 'REVOKED' || data.status === 'DEMO')) {
          // Keep expired code for notice, but remove unrecognized codes
          if (data.status === 'DEMO') {
            setStoredLicenseCode('');
          }
        }

        notifyListeners();
        return currentLicenseState;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch license status from backend:', err);
  }

  return currentLicenseState;
}

export async function activateProLicense(code: string): Promise<{ success: boolean; message: string; state?: ClientLicenseState }> {
  const deviceId = getOrCreateDeviceId();
  const cleanCode = (code || '').trim().toUpperCase();

  try {
    const res = await fetch('/api/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode, deviceId }),
    });

    const json = await res.json();
    if (json.success) {
      setStoredLicenseCode(cleanCode);
      await fetchLicenseStatus();
      return { success: true, message: json.message, state: currentLicenseState };
    } else {
      return { success: false, message: json.message || 'Kode aktivasi tidak valid.' };
    }
  } catch (err: any) {
    return { success: false, message: 'Gagal terhubung ke server validasi lisensi: ' + err.message };
  }
}

export async function deactivateLicense(): Promise<void> {
  setStoredLicenseCode('');
  await fetchLicenseStatus();
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

    if (res.ok) {
      const data = await res.json();
      if (data.allowed) {
        // Update local quota record
        if (action === 'generate') currentLicenseState.quotaToday.generateCount += amount;
        else if (action === 'kisi') currentLicenseState.quotaToday.kisiKisiCount += amount;
        else if (action === 'package') currentLicenseState.quotaToday.packageCount += amount;
        else if (action === 'rubric') currentLicenseState.quotaToday.rubricCount += amount;
        else if (action === 'analytics') currentLicenseState.quotaToday.analyticsCount += amount;
        notifyListeners();
      }
      return data;
    }
  } catch (err) {
    console.warn('Backend quota check failed:', err);
  }

  return { allowed: true, remaining: 1 };
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
