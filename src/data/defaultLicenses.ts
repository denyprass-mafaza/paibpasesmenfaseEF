import { LicenseRecord } from '../types/license';

export const DEFAULT_LICENSES: LicenseRecord[] = [
  {
    license_id: 'LIC-USER-DENYPRAS-01',
    license_code: 'PAIBP-EF26-CYCF-9U2W-RSL9',
    product_id: 'PAIBP-EF-2026',
    status: 'ACTIVE',
    license_type: 'LIFETIME',
    created_at: '2026-11-06T00:00:00.000Z',
    activated_at: '2026-11-06T00:00:00.000Z',
    expired_at: null,
    activation_limit: 10,
    activation_count: 1,
    max_devices: 10,
    devices: [],
    customer_label: 'Deny Prasetyo (denyprass38@gmail.com)',
    notes: 'Lisensi Resmi Eksklusif Lifetime PRO (Sinkron GitHub & Vercel)',
    created_by: 'OWNER',
  },
  {
    license_id: 'LIC-INIT-LIFETIME-01',
    license_code: 'PAIBP-EF26-LIFE-PRO1-9988',
    product_id: 'PAIBP-EF-2026',
    status: 'ACTIVE',
    license_type: 'LIFETIME',
    created_at: '2026-11-06T00:00:00.000Z',
    activated_at: null,
    expired_at: null,
    activation_limit: 5,
    activation_count: 0,
    max_devices: 5,
    devices: [],
    customer_label: 'Lisensi Resmi Lifetime (Guru Penggerak PAIBP)',
    notes: 'Lisensi seumur hidup tanpa batas kedaluwarsa. Mendukung hingga 5 perangkat.',
    created_by: 'SYSTEM_OWNER',
  },
  {
    license_id: 'LIC-INIT-YEARLY-01',
    license_code: 'PAIBP-EF26-YEAR-2026-7711',
    product_id: 'PAIBP-EF-2026',
    status: 'ACTIVE',
    license_type: 'YEARLY',
    created_at: '2026-11-06T00:00:00.000Z',
    activated_at: null,
    expired_at: '2027-12-31T23:59:59.000Z',
    activation_limit: 3,
    activation_count: 0,
    max_devices: 3,
    devices: [],
    customer_label: 'Lisensi Tahunan 2026-2027',
    notes: 'Masa aktif hingga 31 Desember 2027.',
    created_by: 'SYSTEM_OWNER',
  },
  {
    license_id: 'LIC-INIT-SINGLE-01',
    license_code: 'PAIBP-EF26-DEV1-MAX1-5533',
    product_id: 'PAIBP-EF-2026',
    status: 'ACTIVE',
    license_type: 'LIFETIME',
    created_at: '2026-11-06T00:00:00.000Z',
    activated_at: null,
    expired_at: null,
    activation_limit: 1,
    activation_count: 0,
    max_devices: 1,
    devices: [],
    customer_label: 'Lisensi Lifetime Single Device',
    notes: 'Khusus 1 perangkat.',
    created_by: 'SYSTEM_OWNER',
  },
  {
    license_id: 'LIC-INIT-EXPD-01',
    license_code: 'PAIBP-EF26-EXPD-TEST-0001',
    product_id: 'PAIBP-EF-2026',
    status: 'EXPIRED',
    license_type: 'CUSTOM',
    created_at: '2025-01-01T00:00:00.000Z',
    activated_at: '2025-01-02T00:00:00.000Z',
    expired_at: '2025-12-31T23:59:59.000Z',
    activation_limit: 1,
    activation_count: 1,
    max_devices: 1,
    devices: [],
    customer_label: 'Lisensi Uji Coba Kedaluwarsa (Expired)',
    notes: 'Untuk pengujian sistem lisensi expired.',
    created_by: 'SYSTEM_OWNER',
  },
  {
    license_id: 'LIC-INIT-REVK-01',
    license_code: 'PAIBP-EF26-REVK-STOP-4422',
    product_id: 'PAIBP-EF-2026',
    status: 'REVOKED',
    license_type: 'LIFETIME',
    created_at: '2026-11-06T00:00:00.000Z',
    activated_at: null,
    expired_at: null,
    activation_limit: 1,
    activation_count: 0,
    max_devices: 1,
    devices: [],
    customer_label: 'Lisensi Dicabut (Revoked)',
    notes: 'Untuk pengujian verifikasi status revoked.',
    created_by: 'SYSTEM_OWNER',
  },
];

/**
 * Validates a license code locally (for Vercel static deployments or offline use).
 * Returns validation result with full license details.
 */
export function verifyLicenseCodeLocally(
  inputCode: string,
  deviceId: string
): {
  success: boolean;
  message: string;
  license?: any;
  errorType?: 'INVALID' | 'EXPIRED' | 'REVOKED' | 'LIMIT' | 'DEVICE_LIMIT';
} {
  const cleanCode = (inputCode || '').trim().toUpperCase();

  if (!cleanCode || cleanCode.length < 8) {
    return {
      success: false,
      message: 'Kode aktivasi tidak valid. Periksa kembali kode yang Anda masukkan atau hubungi OWNER untuk mendapatkan bantuan.',
      errorType: 'INVALID',
    };
  }

  // 1. Check known registered licenses
  const found = DEFAULT_LICENSES.find(
    (l) => l.license_code.toUpperCase() === cleanCode
  );

  if (found) {
    if (found.status === 'REVOKED') {
      return {
        success: false,
        message: 'Lisensi ini sudah tidak aktif. Silakan hubungi OWNER untuk informasi lebih lanjut.',
        errorType: 'REVOKED',
      };
    }

    if (found.expired_at && new Date(found.expired_at).getTime() < Date.now()) {
      return {
        success: false,
        message: 'Lisensi Anda telah berakhir. Data Anda tetap aman, tetapi fitur PRO saat ini dikunci. Silakan perpanjang atau gunakan kode aktivasi baru.',
        errorType: 'EXPIRED',
      };
    }

    return {
      success: true,
      message: '🎉 Aktivasi berhasil! PAIBP SMART ASSESSMENT PRO sekarang aktif dalam MODE PRO.',
      license: {
        license_id: found.license_id,
        license_code: found.license_code,
        product_id: found.product_id,
        license_type: found.license_type,
        status: 'ACTIVE',
        activated_at: new Date().toISOString(),
        expired_at: found.expired_at,
        max_devices: found.max_devices,
        device_count: 1,
        customer_label: found.customer_label,
      },
    };
  }

  // 2. Algorithmic verification for any official pattern generated by Owner Panel:
  // Must match PAIBP-EF26-XXXX-XXXX-XXXX or PRO26-XXXX-XXXX-XXXX
  const pattern = /^(PAIBP-EF26|PRO26)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (pattern.test(cleanCode)) {
    // Check if blacklisted / revoked
    if (cleanCode.includes('REVK') || cleanCode.includes('STOP')) {
      return {
        success: false,
        message: 'Lisensi ini sudah tidak aktif. Silakan hubungi OWNER untuk informasi lebih lanjut.',
        errorType: 'REVOKED',
      };
    }
    if (cleanCode.includes('EXPD')) {
      return {
        success: false,
        message: 'Lisensi Anda telah berakhir. Data Anda tetap aman, tetapi fitur PRO saat ini dikunci.',
        errorType: 'EXPIRED',
      };
    }

    const isYearly = cleanCode.includes('YEAR');
    const expiry = isYearly
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    return {
      success: true,
      message: '🎉 Aktivasi berhasil! PAIBP SMART ASSESSMENT PRO sekarang aktif dalam MODE PRO.',
      license: {
        license_id: `LIC-${cleanCode.slice(-8)}`,
        license_code: cleanCode,
        product_id: 'PAIBP-EF-2026',
        license_type: isYearly ? 'YEARLY' : 'LIFETIME',
        status: 'ACTIVE',
        activated_at: new Date().toISOString(),
        expired_at: expiry,
        max_devices: 3,
        device_count: 1,
        customer_label: 'Lisensi Resmi PAIBP 2026',
      },
    };
  }

  return {
    success: false,
    message: 'Kode aktivasi tidak valid. Periksa kembali kode yang Anda masukkan atau hubungi OWNER untuk mendapatkan bantuan.',
    errorType: 'INVALID',
  };
}
